-- AlterTable
ALTER TABLE "Lobby" ALTER COLUMN "status" SET DEFAULT 'waiting',
ALTER COLUMN "turn_direction" SET DEFAULT 'clockwise';

-- AlterTable
ALTER TABLE "UserLobby" ALTER COLUMN "turn_order" SET DEFAULT 0;
