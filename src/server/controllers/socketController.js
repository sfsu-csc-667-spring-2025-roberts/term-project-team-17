const prisma = require("../db/prismaClient");
const socketio = require("socket.io");
const { getUserId } = require("../middleware/authMiddleware");

const socketController = (server) => {
    const io = socketio(server);

    io.on("connection", (socket, user_id) => {
        console.log("New WebSocket connection");


        // Join a room
        socket.on("joinRoom", async (roomCode, jwt) => {
            socket.join(roomCode);
            const req = { cookies: { jwt } };
            const user_id = getUserId(req);

            const lobby = await prisma.lobby.findUnique({ where: { lobby_code: roomCode } });
            let userLobby = await prisma.userLobby.findFirst({ where: { user_id, lobby_id: lobby.id } });
            const isFull = (await prisma.userLobby.findMany({ where: { lobby_id: lobby.id } })).length >= 4;
            
            if (!lobby) {
                socket.emit("roomNotFound", "Room code does not exist");
                return;
            }

            if (!userLobby) {
                if (isFull) {
                    socket.emit("roomFull", "Room is full");
                    return;
                }

                userLobby = await prisma.userLobby.create({
                    data: {
                        user_id,
                        lobby_id: lobby.id,
                        socket_id: socket.id,
                        is_host: false
                    }
                });
                
                console.log("User lobby created:", userLobby);
            }

            // Update players
            const userLobbies = await prisma.userLobby.findMany({ where: { lobby_id: lobby.id } });
            users = []
            for (const userLobby of userLobbies) {
                const user = await prisma.user.findUnique({ where: { id: userLobby.user_id } });
                users.push({
                    id: user.id,
                    username: user.username,
                    is_host: userLobby.is_host
                });
            }
            
            console.log(`User joined room: ${roomCode}`);
            io.to(roomCode).emit("players", users);
        });


        // Send message
        socket.on("sendMessage", (message) => {
            const roomCode = message.roomCode;
            io.to(roomCode).emit("receiveMessage", message);
        });


        // Leave room
        socket.on("disconnect", () => {
            console.log("User disconnected");
            console.log("Socket ID:", socket.id);
            prisma.userLobby.findMany({ where: { socket_id: socket.id } }).then(async (userLobbies) => {
                console.log("User lobbies:", userLobbies);
                for (const userLobby of userLobbies) {
                    const isLast = (await prisma.userLobby.findMany({ where: { lobby_id: userLobby.lobby_id } })).length <= 1;

                    if (isLast) {
                        prisma.lobby.delete({ where: { id: userLobby.lobby_id } });
                    }

                    prisma.userLobby.delete({ where: { id: userLobby.id } });
                }
            })
        });

        // Start game
        socket.on("startGame", async (roomCode) => {
            const lobby = await prisma.lobby.findUnique({ where: { lobby_code: roomCode } });
            if (!lobby) {
                socket.emit("roomNotFound", "Room code does not exist");
                return;
            }

            const userLobbies = await prisma.userLobby.findMany({ where: { lobby_id: lobby.id } });
            users = []
            for (const userLobby of userLobbies) {
                const user = await prisma.user.findUnique({ where: { id: userLobby.user_id } });
                users.push({
                    id: user.id,
                    username: user.username,
                    is_host: userLobby.is_host
                });
            }

            io.to(roomCode).emit("gameStarted", users);
        });
    });
}

module.exports = socketController;