// src/client/socketHandler.ts
import { io } from "socket.io-client";

// Create WebSocket connection
export const socket = io(); // Assumes the client and server are on the same domain and port

// Join a lobby
export const joinLobby = (playerId: string, lobbyId: string) => {
  socket.emit("joinLobby", { playerId, lobbyId });
};

// Listen for updates to the user list and update DOM directly
export const listenForUserUpdates = () => {
  socket.on("updateUserList", (users: string[]) => {
    const playerListDiv = document.getElementById(
      "playerList",
    ) as HTMLDivElement;
    if (playerListDiv) {
      playerListDiv.innerHTML = ""; // Clear previous list
      users.forEach((playerId) => {
        const playerElement = document.createElement("p");
        playerElement.textContent = playerId;
        playerListDiv.appendChild(playerElement);
      });
    }
  });
};

// Emit start game event
export const startGame = (lobbyId: string) => {
  socket.emit("startGame", { lobbyId });
};
