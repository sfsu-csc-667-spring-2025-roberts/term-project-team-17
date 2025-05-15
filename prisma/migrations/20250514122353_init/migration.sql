-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lobby" (
    "id" SERIAL NOT NULL,
    "lobby_code" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "current_turn_user_id" INTEGER,
    "turn_direction" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lobby_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLobby" (
    "user_id" INTEGER NOT NULL,
    "lobby_id" INTEGER NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_host" BOOLEAN NOT NULL,
    "turn_order" INTEGER NOT NULL,

    CONSTRAINT "UserLobby_pkey" PRIMARY KEY ("user_id","lobby_id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "lobby_id" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardTemplate" (
    "id" SERIAL NOT NULL,
    "color" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "CardTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardInstance" (
    "id" SERIAL NOT NULL,
    "card_template_id" INTEGER NOT NULL,
    "lobby_id" INTEGER NOT NULL,
    "holder_user_id" INTEGER,
    "location_type" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "CardInstance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lobby_lobby_code_key" ON "Lobby"("lobby_code");

-- CreateIndex
CREATE UNIQUE INDEX "Lobby_current_turn_user_id_key" ON "Lobby"("current_turn_user_id");

-- AddForeignKey
ALTER TABLE "Lobby" ADD CONSTRAINT "Lobby_current_turn_user_id_fkey" FOREIGN KEY ("current_turn_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLobby" ADD CONSTRAINT "UserLobby_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLobby" ADD CONSTRAINT "UserLobby_lobby_id_fkey" FOREIGN KEY ("lobby_id") REFERENCES "Lobby"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_lobby_id_fkey" FOREIGN KEY ("lobby_id") REFERENCES "Lobby"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardInstance" ADD CONSTRAINT "CardInstance_card_template_id_fkey" FOREIGN KEY ("card_template_id") REFERENCES "CardTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardInstance" ADD CONSTRAINT "CardInstance_lobby_id_fkey" FOREIGN KEY ("lobby_id") REFERENCES "Lobby"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardInstance" ADD CONSTRAINT "CardInstance_holder_user_id_fkey" FOREIGN KEY ("holder_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
