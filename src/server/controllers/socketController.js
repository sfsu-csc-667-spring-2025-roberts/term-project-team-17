const prisma = require("../db/prismaClient");
const socketio = require("socket.io");
const { getUserId } = require("../middleware/authMiddleware");

const socketController = (server) => {
    const io = socketio(server);

    io.on("connection", (socket, user_id) => {
        console.log("New WebSocket connection");


        // ---------- LOBBY LOGIC --------


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
            } else {
                await prisma.userLobby.updateMany({
                    where: { user_id: userLobby.user_id, lobby_id: userLobby.lobby_id },
                    data: { socket_id: socket.id }
                });
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

        socket.on("leaveRoom", async (roomCode, jwt) => {
            const req = { cookies: { jwt } };
            const user_id = getUserId(req);

            const lobby = await prisma.lobby.findUnique({ where: { lobby_code: roomCode } });
            if (!lobby) return;

            const userLobby = await prisma.userLobby.findFirst({ where: { user_id, lobby_id: lobby.id } });
            if (!userLobby) return;

            await prisma.userLobby.deleteMany({ where: { user_id, lobby_id: lobby.id } });
            socket.leave(roomCode);
        });

        // Leave room
        socket.on("disconnect", () => {
            console.log("User disconnected");
            console.log("Socket ID:", socket.id);
            prisma.userLobby.findMany().then(async (userLobbies) => console.log("User lobbies:", userLobbies));
            prisma.userLobby.findMany({ where: { socket_id: socket.id } }).then(async (userLobbies) => {
                console.log("User lobbies:", userLobbies);
                for (const userLobby of userLobbies) {
                    const isLast = (await prisma.userLobby.findMany({ where: { lobby_id: userLobby.lobby_id } })).length <= 1;

                    if (isLast) {
                        prisma.lobby.delete({ where: { id: userLobby.lobby_id } });
                    }

                    prisma.userLobby.delete({ where: { socket_id: socket.id, lobby_id: userLobby.id } });
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

            await prisma.cardInstance.create({
                data: {
                    location_type: "deck",
                    lobby_id: lobby.id,
                    card_template_id: Math.floor(Math.random() * 60) + 1,
                    position: 0,
                }
            });

            // Prep users for game
            turn_order = 0;
            const userLobbies = await prisma.userLobby.findMany({ where: { lobby_id: lobby.id } });
            for (const userLobby of userLobbies) {
                const user = await prisma.user.findUnique({ where: { id: userLobby.user_id } });
                
                // Give the users their turn order
                turn_order++;
                await prisma.userLobby.updateMany({ 
                    where: { user_id: userLobby.user_id, lobby_id: userLobby.lobby_id }, 
                    data: { turn_order } 
                });

                // Create card instances for each user
                for (i = 0; i < 7; i++) {
                    random_card = Math.floor(Math.random() * 60) + 1;

                    await prisma.cardInstance.create({
                        data: {
                            holder_user_id: user.id,
                            card_template_id: random_card,
                            lobby_id: lobby.id,
                            location_type: "user",
                            position: i,
                        }
                    })
                }
            }

            // Update the lobby status
            await prisma.lobby.update({
                where: { id: lobby.id },
                data: {
                    status: "in_game",
                    current_turn_user_id: userLobbies[0].user_id,
                }
            });

            console.log("User lobbies:", userLobbies);
            console.log("Lobby updated:", lobby);

            io.to(roomCode).emit("gameStarted");
        });


        // ---------- UNO GAME LOGIC ----------


        socket.on('joinGame', async ({ roomCode, jwt }) => {
            try {
                socket.join(roomCode);
                const req = { cookies: { jwt } };
                const user_id = getUserId(req);

                const lobby = await prisma.lobby.findUnique({ where: { lobby_code: roomCode } });
                if (!lobby) {
                    io.to(roomCode).emit('invalidMove', 'Lobby not found.')
                    return;
                }

                const userLobby = await prisma.userLobby.findFirst({ where: { user_id, lobby_id: lobby.id } });
                if (!userLobby) {
                    io.to(roomCode).emit('invalidMove', 'User not found in lobby.');
                    return;
                }

                io.to(roomCode).emit("refreshGameState");
            } catch (err) {
                console.error(err);
                socket.emit('invalidMove', 'Invalid token.');
            }
        });

        socket.on('refreshGameState', async ({ roomCode, jwt }) => {
            try {
                const req = { cookies: { jwt } };
                const user_id = getUserId(req);
                const gameState = await getGameState(io, roomCode, user_id);
                if (!gameState) {
                    socket.emit('invalidMove', 'Invalid game state.');
                    return;
                }
                socket.emit('gameState', gameState);
            } catch (err) {
                console.log(err);
                socket.emit('invalidMove', 'Invalid token.');
            }
        });

        // Play Card
        socket.on('playCard', async ({ roomCode, jwt, color, value }) => {
            const req = { cookies: { jwt } };
            const user_id = getUserId(req);

            const lobby = await prisma.lobby.findUnique({ where: { lobby_code: roomCode } });
            if (!lobby) {
                socket.emit('invalidMove', 'Lobby not found.');
                return;
            }

            const userLobby = await prisma.userLobby.findFirst({ where: { user_id, lobby_id: lobby.id } });
            if (!userLobby) {
                socket.emit('invalidMove', 'User not found in lobby.');
                return;
            }

            if (lobby.current_turn_user_id !== user_id) {
                socket.emit('invalidMove', 'Not your turn.');
                return;
            }

            const currentCard = await prisma.cardInstance.findFirst({
                where: {
                    lobby_id: lobby.id,
                    location_type: "deck"
                },
                include: { card_template: true }
            });

            const playerCard = await prisma.cardInstance.findFirst({
                where: {
                    holder_user_id: user_id,
                    lobby_id: lobby.id,
                    location_type: "user",
                    card_template: {
                        color: color,
                        value: value
                    }
                },
                include: { card_template: true }
            });

            if (!playerCard) {
                io.to(roomCode).emit('invalidMove', 'Card not found in hand.');
                return;
            }

            console.log("Current card:", currentCard.card_template.color, currentCard.card_template.value);
            console.log("Player card:", playerCard.card_template.color, playerCard.card_template.value);

            if (playerCard.card_template.color !== currentCard.card_template.color && 
                playerCard.card_template.value !== currentCard.card_template.value && 
                playerCard.card_template.value !== "wild" && 
                playerCard.card_template.value !== "wild4" &&
                currentCard.card_template.value !== "wild" &&
                currentCard.card_template.value !== "wild4") {
                socket.emit('invalidMove', 'Invalid card played.');
                return;
            }

            // Play the card
            await prisma.cardInstance.updateMany({
                where: {
                    lobby_id: lobby.id,
                    location_type: "deck"
                },
                data: {
                    card_template_id: playerCard.card_template_id,
                }
            });

            await prisma.cardInstance.delete({
                where: {
                    id: playerCard.id
                }
            });

            console.log("current player id:", userLobby.turn_order);
            turn_order = userLobby.turn_order + 1;
            if (turn_order > 4) turn_order = 1;
            console.log("Turn order:", turn_order);
            const users = await prisma.userLobby.findMany({ where: { lobby_id: lobby.id } });
            for (const currentUserLobby of users) {
                
                console.log("User:", currentUserLobby.turn_order);
                console.log("Current user turn order:", currentUserLobby.turn_order);

                if (currentUserLobby.turn_order === turn_order) {
                    const user = await prisma.user.findUnique({ where: { id: userLobby.user_id } });
                    await prisma.lobby.update({
                        where: { id: lobby.id },
                        data: {
                            current_turn_user_id: currentUserLobby.user_id,
                        }
                    });
                    break;
                }
            }

            console.log("Played card:", playerCard.card_template.color, playerCard.card_template.value);

            const remainingCards = await prisma.cardInstance.count({
                where: {
                    holder_user_id: user_id,
                    lobby_id: lobby.id,
                    location_type: "user"
                }
            });
            console.log("Remaining cards:", remainingCards);

            if (remainingCards === 0) {
                const user = await prisma.user.findUnique({ where: { id: user_id } });
                io.to(roomCode).emit('gameOver', { winner: user.username });
            }
            
            io.to(roomCode).emit('refreshGameState');
        });

        // Draw Card
        socket.on('drawCard', async ({ roomCode, jwt }) => {
            const req = { cookies: { jwt } };
            const user_id = getUserId(req);

            const lobby = await prisma.lobby.findUnique({ where: { lobby_code: roomCode } });
            if (!lobby) {
                io.to(roomCode).emit('invalidMove', 'Lobby not found.');
                return;
            }

            const userLobby = await prisma.userLobby.findFirst({ where: { user_id, lobby_id: lobby.id } });
            if (!userLobby) {
                io.to(roomCode).emit('invalidMove', 'User not found in lobby.');
                return;
            }

            if (lobby.current_turn_user_id !== user_id) {
                io.to(roomCode).emit('invalidMove', 'Not your turn.');
                return;
            }

            // Draw a card from the deck
            const drawnCard = await prisma.cardInstance.create({
                data: {
                    holder_user_id: user_id,
                    location_type: "user",
                    card_template_id: Math.floor(Math.random() * 60) + 1,
                    lobby_id: lobby.id,
                    position: 0,
                }
            });

            if (!drawnCard) {
                io.to(roomCode).emit('invalidMove', 'No cards left in deck.');
                return;
            }

            io.to(roomCode).emit('refreshGameState');
        });

        // Chat
        socket.on('sendMessage', async ({ roomCode, jwt, text }) => {
            const req = { cookies: { jwt } };
            const user_id = getUserId(req);
            const user = await prisma.user.findUnique({ where: { id: user_id } });
            if (!user) {
                return;
            }

            console.log(`${user.username} sent a message: ${text}`);
            console.log(user);

            io.to(roomCode).emit('receiveMessage', {
            sender: user.username,
            text,
            });
        });
    });
};

async function getGameState(io, roomCode, userId) {

    // Get the current lobby
    const lobby = await prisma.lobby.findUnique({ where: { lobby_code: roomCode } });
    if (!lobby) {
        io.to(roomCode).emit('invalidMove', 'Lobby not found.');
        return null;
    }

    // Get the user lobby
    const userLobby = await prisma.userLobby.findFirst({ where: { user_id: userId, lobby_id: lobby.id } });
    if (!userLobby) {
        io.to(roomCode).emit('invalidMove', 'User not found in lobby.');
        return null;
    }

    // Get the current players
    const players = await prisma.userLobby.findMany({
        where: { lobby_id: lobby.id },
        include: { user: true },
    });

    // The goal is to fill out this struct and return it to the client
    const gameState = {
        hand: [],   // Player's hand { id, color, value }
        myTurnId: userLobby.turn_order, // Player's turn order (0 - 3)
        turn: null, // Current player's turn (0 - 3)
        players: [], // List of players { username, hand, id (0 - 3) }
        deck: null,  // Top card on the pile { id, color, value }
    };

    const playerHand = await prisma.cardInstance.findMany({
        where: {
        holder_user_id: userId,
        lobby_id: lobby.id,
        location_type: "user"
        },
        include: { card_template: true }
    });

    // Fill out the current player's hand
    for (const card of playerHand) {
        gameState.hand.push({
            id: card.id,
            color: card.card_template.color,
            value: card.card_template.value
        });
    }

    // Get the current player's turn
    const currentPlayer = await prisma.userLobby.findFirst({ where: { lobby_id: lobby.id, user_id: lobby.current_turn_user_id } });
    if (!currentPlayer) {
        io.to(roomCode).emit('invalidMove', 'Current player not found.');
        return null;
    }
    gameState.turn = currentPlayer.turn_order;

    // Fill out the players
    for (const player of players) {
        const cards = await prisma.cardInstance.findMany({
            where: {
                holder_user_id: player.user.id,
                lobby_id: lobby.id,
                location_type: "user"
            }
        });

        const user = await prisma.user.findUnique({ where: { id: player.user.id } });
        if (!user) {
            io.to(roomCode).emit('invalidMove', 'User not found.');
            return null;
        }

        gameState.players.push({
            turn: player.turn_order,
            cards: cards.length,
            username: user.username
        });
    }

    // Get the top card on the pile
    const topCard = await prisma.cardInstance.findFirst({
        where: {
            lobby_id: lobby.id,
            location_type: "deck"
        },
        include: { card_template: true }
    });

    if (!topCard) {
        io.to(roomCode).emit('invalidMove', 'Top card not found.');
        return null;
    }

    gameState.deck = {
        id: topCard.id,
        color: topCard.card_template.color,
        value: topCard.card_template.value
    };

    return gameState;
}

module.exports = socketController;