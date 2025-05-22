/*
  Warnings:

  - A unique constraint covering the columns `[socket_id]` on the table `UserLobby` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "UserLobby" ADD COLUMN     "socket_id" TEXT,
ALTER COLUMN "is_host" SET DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "UserLobby_socket_id_key" ON "UserLobby"("socket_id");
