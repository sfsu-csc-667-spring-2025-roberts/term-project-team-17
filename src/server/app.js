const express = require('express');

const morgan = require('morgan');
const path = require('path');
const authMiddleware = require('./middleware/authMiddleware');

const authRoutes = require('./routes/authRoutes');
const protectedRoutes = require('./routes/protectedRoutes');

const app = express();

// Middleware
app.use(morgan("dev"));
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));

// View Engine
app.set("views", path.join(process.cwd(), "src", "server", "views"));
app.set("view engine", "ejs");

// Routes
app.get("/", (req, res) => {
    res.render("index");
});

app.use("/", authRoutes);
app.use("/", authMiddleware, protectedRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server is running on http://localhost:3000");
});