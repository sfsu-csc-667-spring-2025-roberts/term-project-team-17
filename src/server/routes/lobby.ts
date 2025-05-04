import { Router } from "express";
import { randomInt } from "crypto"; // Use Node's crypto module to generate random numbers

const router = Router();

// API route to create a lobby
router.get("/create", (req, res) => {
  const lobbyId = randomInt(100000, 999999).toString();

  res.redirect(`/lobby/${lobbyId}`);
});

// Join lobby by lobby ID
router.get("/lobby/:lobbyId", (req, res) => {
  const { lobbyId } = req.params;
  // Here you could check if the lobby ID exists, or create a new one if it doesn't
  res.render("lobby", { lobbyId });
});

export default router;
