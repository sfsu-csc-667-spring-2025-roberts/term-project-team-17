import { Server, Socket } from "socket.io";

// Store users by lobbyId
const lobbyUsers: { [lobbyId: string]: string[] } = {}; // Maps lobbyId to array of userIds

export function setupSocket(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log("A user connected");

    // Handle player joining a lobby
    socket.on("joinLobby", (data) => {
      const { playerId, lobbyId } = data;

      console.log(`${playerId} joined lobby ${lobbyId}`);

      // Add user to the lobby's list of users
      if (!lobbyUsers[lobbyId]) {
        lobbyUsers[lobbyId] = [];
      }
      lobbyUsers[lobbyId].push(playerId);

      // Join the WebSocket room for this lobby
      socket.join(lobbyId);

      // Emit the updated list of players to all users in the lobby
      io.to(lobbyId).emit("updateUserList", lobbyUsers[lobbyId]);

      // Notify others in the lobby that a new player has joined
      socket.to(lobbyId).emit("playerJoined", { playerId });
    });

    // Handle starting the game
    socket.on("startGame", (data) => {
      console.log(`Starting game for lobby ${data.lobbyId}`);
      socket.to(data.lobbyId).emit("gameStarted", { lobbyId: data.lobbyId });
    });

    // Handle disconnecting
    socket.on("disconnect", () => {
      console.log("A user disconnected");

      // Remove the user from the lobby on disconnect (optional cleanup)
      for (const lobbyId in lobbyUsers) {
        const index = lobbyUsers[lobbyId].indexOf(socket.id);
        if (index > -1) {
          lobbyUsers[lobbyId].splice(index, 1); // Remove user from the list
          io.to(lobbyId).emit("updateUserList", lobbyUsers[lobbyId]); // Emit updated list
          break;
        }
      }
    });
  });
}
