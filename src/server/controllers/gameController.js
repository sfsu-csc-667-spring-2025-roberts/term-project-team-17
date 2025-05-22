const prisma = require("../db/prismaClient");
const { getUserId } = require("../middleware/authMiddleware");

const cards = [
    { color: "red", value: 1 },
    { color: "red", value: 2 },
    { color: "red", value: 3 },
    { color: "red", value: 4 },
    { color: "red", value: 5 },
    { color: "red", value: 6 },
    { color: "red", value: 7 },
    { color: "red", value: 8 },
    { color: "red", value: 9 },
    { color: "red", value: 10 },
    { color: "red", value: "skip" },
    { color: "red", value: "reverse" },
    { color: "red", value: "draw2" },
    { color: "red", value: "wild" },
    { color: "red", value: "wild4" },
    { color: "green", value: 1 },
    { color: "green", value: 2 },
    { color: "green", value: 3 },
    { color: "green", value: 4 },
    { color: "green", value: 5 },
    { color: "green", value: 6 },
    { color: "green", value: 7 },
    { color: "green", value: 8 },
    { color: "green", value: 9 },
    { color: "green", value: 10 },
    { color: "green", value: "skip" },
    { color: "green", value: "reverse" },
    { color: "green", value: "draw2" },
    { color: "green", value: "wild" },
    { color: "green", value: "wild4" },
    { color: "blue", value: 1 },
    { color: "blue", value: 2 },
    { color: "blue", value: 3 },
    { color: "blue", value: 4 },
    { color: "blue", value: 5 },
    { color: "blue", value: 6 },
    { color: "blue", value: 7 },
    { color: "blue", value: 8 },
    { color: "blue", value: 9 },
    { color: "blue", value: 10 },
    { color: "blue", value: "skip" },
    { color: "blue", value: "reverse" },
    { color: "blue", value: "draw2" },
    { color: "blue", value: "wild" },
    { color: "blue", value: "wild4" },
    { color: "yellow", value: 1 },
    { color: "yellow", value: 2 },
    { color: "yellow", value: 3 },
    { color: "yellow", value: 4 },
    { color: "yellow", value: 5 },
    { color: "yellow", value: 6 },
    { color: "yellow", value: 7 },
    { color: "yellow", value: 8 },
    { color: "yellow", value: 9 },
    { color: "yellow", value: 10 },
    { color: "yellow", value: "skip" },
    { color: "yellow", value: "reverse" },
    { color: "yellow", value: "draw2" },
    { color: "yellow", value: "wild" },
    { color: "yellow", value:"wild4"}
]

const create_cards = async () => {
    try {
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            const existingCard = await prisma.card.findFirst({
                where: {
                    color: card.color,
                    value: card.value
                }
            });

            if (!existingCard) {
                await prisma.card.create({
                    data: {
                        color: card.color,
                        value: card.value
                    }
                });
            }
        }
    } catch (error) {
        console.error("Error creating cards:", error);
        return;
    }

    console.log("----- Cards Created -----\n");
}

const room_create = async (req, res) => {
    const roomCode = req.body.createRoomCode;

    // Guard clauses
    errors = { createRoomCode: "" };
    if (!roomCode) errors.createRoomCode = "Please enter a room code";
    else if (roomCode.length < 4) errors.createRoomCode = "Room code must be at least 4 characters";
    else if (roomCode.length > 10) errors.createRoomCode = "Room code must be at most 10 characters";
    else if (roomCode.match(/[^a-zA-Z0-9]/)) errors.createRoomCode = "Room code can only contain letters and numbers";
    else if (await prisma.lobby.findUnique({ where: { lobby_code: roomCode } })) errors.createRoomCode = "Room code already exists";
    if (errors.createRoomCode) return res.status(400).send({ errors });


    try {
        const lobby = await prisma.lobby.create({ data: { lobby_code: roomCode } })
        console.log("Lobby created:", lobby);
        
        res.json({ gameId: roomCode });
    } catch (error) {
        console.error("Error creating room:", error);
        res.status(500).send("Error creating room");
    }
}

const room_join = async (req, res) => {
    const roomCode = req.body.joinRoomCode;
    const lobby = await prisma.lobby.findUnique({ where: { lobby_code: roomCode } });

    let errors = { joinRoomCode: "" };
    if (!roomCode) errors.joinRoomCode = "Please enter a room code";
    else if (roomCode.length < 4) errors.joinRoomCode = "Room code must be at least 4 characters";
    else if (roomCode.length > 10) errors.joinRoomCode = "Room code must be at most 10 characters";
    else if (roomCode.match(/[^a-zA-Z0-9]/)) errors.joinRoomCode = "Room code can only contain letters and numbers";
    else if (!lobby) errors.joinRoomCode = "Room code does not exist";
    else if (await prisma.userLobby.findFirst({ where: { user_id: getUserId(req), lobby_id: lobby.id } })) return res.json({ gameId: roomCode });
    else if ((await prisma.userLobby.findMany({ where: { lobby_id: lobby.id } })).length >= 4) errors.joinRoomCode = "Room is full";
    if (errors.joinRoomCode) return res.status(400).send({ errors });

    res.json({ gameId: roomCode });
}

const room_leave = async (req, res) => {
    const roomCode = req.body.joinRoomCode;
    const lobby = await prisma.lobby.findUnique({ where: { lobby_code: roomCode } });

    if (!lobby) return res.status(400).send({ errors: { leaveRoomCode: "Room code does not exist" } });

    const userLobby = await prisma.userLobby.findFirst({ where: { user_id: getUserId(req), lobby_id: lobby.id } });

    if (!userLobby) return res.status(400).send({ errors: { leaveRoomCode: "You are not in this room" } });

    try {
        await prisma.userLobby.delete({ where: { id: userLobby.id } });

        res.status(200);
    } catch (error) {
        console.error("Error leaving room:", error);
        res.status(500).send("Error leaving room");
    }
}

const room_get = async (req, res) => {
    const roomCode = req.params.id;

    try {
        const room = await prisma.lobby.findUnique({where: { lobby_code: roomCode }});

        if (!room) return res.redirect("/404");
        
        const userLobby = await prisma.userLobby.findFirst({ where: { user_id: getUserId(req), lobby_id: room.id }});
        const isFull = await prisma.userLobby.count({ where: { lobby_id: room.id } }) >= 4;
        if (!userLobby && isFull) return res.redirect("/lobby");

        res.render("game/room", { roomCode: room.lobby_code });
    } catch (error) {
        console.error("Error fetching room:", error);
        res.status(500).send("Error fetching room");
    }
}

module.exports = {
    room_create,
    room_join,
    room_get,
//     game_create,
//     game_get
    create_cards,
}