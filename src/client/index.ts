// src/client/index.ts
import {
  socket,
  joinLobby,
  listenForUserUpdates,
  startGame,
} from "./socketHandler";
import { handleSignup, handleSignin } from "./formHandler";

document.addEventListener("DOMContentLoaded", () => {
  // WebSocket connection
  socket.on("connect", () => {
    console.log("WebSocket Connected: " + socket.id);
  });

  // Handle sign up form
  const signupForm = document.getElementById("signupForm") as HTMLFormElement;
  if (signupForm) {
    signupForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const username = (document.getElementById("username") as HTMLInputElement)
        .value;
      const password = (document.getElementById("password") as HTMLInputElement)
        .value;
      await handleSignup(username, password);
    });
  }

  // Handle sign in form
  const signinForm = document.getElementById("signinForm") as HTMLFormElement;
  if (signinForm) {
    signinForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const username = (document.getElementById("username") as HTMLInputElement)
        .value;
      const password = (document.getElementById("password") as HTMLInputElement)
        .value;
      await handleSignin(username, password);
    });
  }

  // Handle create lobby button click
  const createLobbyButton = document.getElementById("createLobbyButton");
  if (createLobbyButton) {
    createLobbyButton.addEventListener("click", () => {
      console.log("Create Lobby Clicked");
      window.location.href = "/create"; // Redirect to the backend /create endpoint
    });
  }

  // Handle join lobby button click
  const joinLobbyButton = document.getElementById("joinLobbyButton");
  if (joinLobbyButton) {
    joinLobbyButton.addEventListener("click", () => {
      const lobbyId = (document.getElementById("lobbyId") as HTMLInputElement)
        .value;
      if (lobbyId.length === 6 && !isNaN(Number(lobbyId))) {
        console.log(`Joining lobby: ${lobbyId}`);
        joinLobby("player1", lobbyId); // Emit joinLobby event
        window.location.href = `/lobby/${lobbyId}`; // Redirect to the lobby page
      } else {
        alert("Please enter a valid 6-digit lobby ID");
      }
    });
  }

  // Start listening for updates to the user list
  listenForUserUpdates();
});
