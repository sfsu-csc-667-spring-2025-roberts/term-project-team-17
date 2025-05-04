import { io } from "socket.io-client";

export const socket = io(); // WebSocket connection

export const joinLobby = (playerId: string, lobbyId: string) => {
  socket.emit("joinLobby", { playerId, lobbyId });
};

export const updateUserList = (callback: (users: string[]) => void) => {
  socket.on("updateUserList", callback);
};
