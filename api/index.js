    import express from "express";
   
    const app = express();
    import http from "http";

    import { Server } from "socket.io";
    import cors from "cors";
   
    app.use(cors({ origin: 'https://soticktack.vercel.app/' })); 
    const server = http.createServer(app);
    app.use(express.json());
    
    const io = new Server(server, {
    cors: {
        origin: "https://soticktack.vercel.app"
    },


    });

    const clients = {}; 
    const games = {};

    io.on("connection", (socket) => {
    console.log(" user connected with socket id: ", socket.id);



    socket.on("reset", (data) => {
        const { gameId, userId } = data;
       
       io.to(gameId).emit("reset");
    }   );
 
     
  socket.on("move", (data) => {
    const { gameId, userId, index, currentPlayer } = data;
 
    
   

      io.to(gameId).emit("updateBoard", { index, currentPlayer }); 
  });


    socket.on("join", (data) => {
    
        const { userId, gameId } = data;

        if (games[gameId].host === userId || games[gameId].guests.includes(userId)) {
            return;
        }
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
        io.to(gameId).emit("playerJoined with "+gameId, userId); // Notify all in the room
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
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
    console.log("listening on *:3000");

    });

    

    