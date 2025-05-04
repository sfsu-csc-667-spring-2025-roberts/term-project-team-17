import express, { Request, Response } from "express";
import { randomInt } from "crypto";
import { attachUserFromToken } from "../middleware/authMiddleware";

const router = express.Router();
router.use(attachUserFromToken);

// Route to render the home page with options to create or join a lobby
router.get("/", (req: Request, res: Response) => {
  const title = "Home"; // Home page title
  const name = req.username || "Guest"; // Could be dynamic, or just static
  res.render("root", { title, name }); // Renders the root.ejs (landing page)
});

// Route to create a new lobby
router.get("/create", (req, res) => {
  const lobbyId = randomInt(100000, 999999).toString(); // Generate 6-digit random lobby ID
  res.redirect(`/lobby/${lobbyId}`); // Redirect to the created lobby page
});

// Route to join an existing lobby
router.get("/lobby/:lobbyId", (req, res) => {
  const { lobbyId } = req.params; // Get the lobby ID from the URL
  res.render("lobby", { lobbyId }); // Render the lobby.ejs template with the lobby ID
});

router.get("/signup", (req, res) => {
  res.render("signup"); // Render the signup page
});

router.get("/signin", (req, res) => {
  res.render("signin"); // Render the signin page
});

export default router;
