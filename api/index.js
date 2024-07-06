    import express from "express";
    import cors from "cors";
    const app = express();
    import http from "http";
app.use(cors());
    import { Server } from "socket.io";
    
    import connectDB from "./db.js";

    const server = http.createServer(app);
    app.use(express.json());

    const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    },
    });

    const clients = {}; 
    const games = {};

    io.on("connection", (socket) => {
    console.log("a user connected");



    socket.on("reset", (data) => {
        const { gameId, userId } = data;
        // Check if user is valid player in the game (host or guest)
       io.to(gameId).emit("reset");
    }   );
 
      // Handle "move" event
  socket.on("move", (data) => {
    const { gameId, userId, index, currentPlayer } = data;
    console.log("move event received", data);
    
   

      io.to(gameId).emit("updateBoard", { index, currentPlayer }); 
  });


    socket.on("join", (data) => {
    
        const { userId, gameId } = data;


        if (!games[gameId]) {
        games[gameId] = {
            host: userId,
            guest: null,
        };
        } else {

        if (games[gameId].guest) {
            socket.emit("gameFull", "Game is already full.");
            return;
        }
        games[gameId].guest = userId;
        }

        clients[userId] = socket.id;
        socket.join(gameId); // Join the socket.io room for this game
        io.to(gameId).emit("playerJoined", userId); // Notify all in the room
    });



    

    socket.on("disconnect", () => {
        console.log("user disconnected");
       
        const userId = Object.keys(clients).find(key => clients[key] === socket.id);
        if (userId) {
        delete clients[userId];
       
        Object.keys(games).forEach(gameId => {
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
            io.to(gameId).emit("playerLeft", userId); // Notify all in the room
            }
        });
        }
    });

    
    });

    server.listen(3000, () => {
    console.log("listening on *:3000");

    });

    

    