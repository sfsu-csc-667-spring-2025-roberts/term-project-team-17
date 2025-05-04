import { io } from "socket.io-client"; // Import the Socket.IO client

// Create a WebSocket connection
const socket = io(); // Use this if the client and server are on the same domain and port

// Handle creating a new lobby
document.getElementById("createLobbyButton")?.addEventListener("click", () => {
  window.location.href = "/create"; // Redirect to the backend /create endpoint
});

// Handle joining an existing lobby
document.getElementById("joinLobbyButton")?.addEventListener("click", () => {
  const lobbyId = (document.getElementById("lobbyId") as HTMLInputElement)
    .value;

  if (lobbyId.length === 6 && !isNaN(Number(lobbyId))) {
    // After joining the lobby, establish the WebSocket connection
    socket.emit("joinLobby", { playerId: "player1", lobbyId });

    // Redirect to the lobby page after emitting the event
    window.location.href = `/lobby/${lobbyId}`; // Redirect to the lobby page
  } else {
    alert("Please enter a valid 6-digit lobby ID");
  }
});

// Listen for the updated user list
socket.on("updateUserList", (users: string[]) => {
  const playerListDiv = document.getElementById("playerList") as HTMLDivElement;

  // Clear the existing list
  playerListDiv.innerHTML = "";

  // Add each player to the list
  users.forEach((playerId) => {
    const playerElement = document.createElement("p");
    playerElement.textContent = playerId; // Display the player ID
    playerListDiv.appendChild(playerElement);
  });
});

// Start game event
document.getElementById("startGameButton")?.addEventListener("click", () => {
  alert("Starting the game..."); // Replace with actual game start logic
});

// Sign up
document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signupForm") as HTMLFormElement;

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = (document.getElementById("username") as HTMLInputElement)
      .value;
    const password = (document.getElementById("password") as HTMLInputElement)
      .value;

    try {
      const response = await fetch("/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();
      if (response.ok) {
        alert("User created successfully!");
        console.log(result);
      } else {
        alert(result.message || "Error creating user");
      }
    } catch (error) {
      console.error(error);
      alert("Error creating user");
    }
  });
});
