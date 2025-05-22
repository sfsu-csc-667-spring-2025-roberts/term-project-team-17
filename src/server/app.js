const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const { requireAuth, checkUser } = require('./middleware/authMiddleware');
const socketController = require('./controllers/socketController');

const authRoutes = require('./routes/authRoutes');
const protectedRoutes = require('./routes/protectedRoutes');
const gameRoutes = require('./routes/gameRoutes');

const app = express();
const server = http.createServer(app);

socketController(server);

// Middleware
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));

// View Engine
app.set("views", path.join(process.cwd(), "src", "server", "views"));
app.set("view engine", "ejs");

// Routes
app.use(checkUser);
app.get("/", (req, res) => res.render("index"));
app.use("/", authRoutes);
app.use("/", requireAuth, protectedRoutes);
app.use("/", requireAuth, gameRoutes);
app.use((req, res) => {
    res.status(404).render("404");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log("Server is running on http://localhost:3000");
});