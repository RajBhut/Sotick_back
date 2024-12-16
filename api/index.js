import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "https://soticktack.vercel.app",
      "https://soticktack.rajb.codes",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST"],
  },
});

const clients = {};
const games = {};

io.on("connection", (socket) => {
  const broadcastAvailableGames = () => {
    const availableGames = {};
    Object.keys(games).forEach((gameId) => {
      if (!games[gameId].guest) {
        availableGames[gameId] = games[gameId];
      }
    });
    io.emit("avalable_games_out", availableGames);
  };

  socket.on("join", (data) => {
    const { userId, gameId } = data;

    if (!games[gameId]) {
      games[gameId] = { host: userId, guest: null };
    } else if (games[gameId].guest) {
      socket.emit("gameFull", "Game is already full.");
      return;
    } else if (games[gameId].host === userId) {
    } else {
      games[gameId].guest = userId;
    }

    clients[userId] = socket.id;
    socket.join(gameId);

    io.to(gameId).emit("playerJoined", { gameId, userId });
  });

  socket.on("move", (data) => {
    const { gameId, index, currentPlayer } = data;

    const roomClients = io.sockets.adapter.rooms.get(gameId);

    io.to(gameId).emit("updateBoard", { index, currentPlayer });
  });

  socket.on("get_available_games", () => {
    broadcastAvailableGames();
  });

  socket.on("disconnect", () => {
    const userId = Object.keys(clients).find(
      (key) => clients[key] === socket.id
    );

    if (userId) {
      delete clients[userId];

      Object.keys(games).forEach((gameId) => {
        if (games[gameId].host === userId || games[gameId].guest === userId) {
          if (games[gameId].guest === userId) {
            games[gameId].guest = null;
          } else if (games[gameId].host === userId) {
            if (games[gameId].guest) {
              games[gameId].host = games[gameId].guest;
              games[gameId].guest = null;
            } else {
              delete games[gameId];
            }
          }
          io.to(gameId).emit("playerLeft", userId);
        }
      });
      const availableGames = {};
      Object.keys(games).forEach((gId) => {
        if (!games[gId].guest) {
          availableGames[gId] = games[gId];
        }
      });
      io.emit("avalable_games_out", availableGames);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Listening on *:${PORT}`);
});
