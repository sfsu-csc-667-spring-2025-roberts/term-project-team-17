// Express server setup
import express from "express";
import httpError from "http-errors";
import http from "http";
import path from "path";
import morgan from "morgan";
import cookieParser from "cookie-parser";

// Socket
import { Server } from "socket.io";
import { setupSocket } from "./socket";

import rootRoutes from "./routes/root";
import authRoutes from "./routes/authRoutes";
import { verifyToken } from "./middleware/authMiddleware";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Middleware
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Serve static files from the public directory
app.use(express.static(path.join(process.cwd(), "public")));

// Set up views (EJS)
app.set("views", path.join(process.cwd(), "src", "server", "templates"));
app.set("view engine", "ejs");

app.use("/", rootRoutes);
app.use("/", authRoutes);

setupSocket(io);

app.use((_request, _response, next) => {
  next(httpError(404, "Not found"));
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
