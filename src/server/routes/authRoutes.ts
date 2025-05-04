import express from "express";
import bcrypt from "bcryptjs";
import pool from "../db/db"; // Import the database connection

const router = express.Router();

// Sign-up route (register a new user)
router.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  // Validate inputs
  if (!username || !password) {
    res.status(400).json({ message: "Username and password are required" });
  }

  try {
    // Check if the username already exists
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
    if (result.rows.length > 0) {
      res.status(400).json({ message: "Username already taken" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user into the database
    const newUser = await pool.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username",
      [username, hashedPassword],
    );

    // Return a success response
    const user = newUser.rows[0];
    res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating user" });
  }
});

// Export routes
export default router;
