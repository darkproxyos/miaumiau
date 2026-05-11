const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const players = {};

io.on("connection", (socket) => {
  console.log("PLAYER CONNECTED:", socket.id);

  players[socket.id] = {
    position: { x: 0, y: 0, z: 0 }
  };

  socket.on("input", (keys) => {
    const player = players[socket.id];
    if (!player) return;

    const speed = keys.dash ? 0.3 : 0.15;

    if (keys.up) player.position.z -= speed;
    if (keys.down) player.position.z += speed;
    if (keys.left) player.position.x -= speed;
    if (keys.right) player.position.x += speed;
  });

  socket.on("disconnect", () => {
    console.log("PLAYER DISCONNECTED:", socket.id);
    delete players[socket.id];
  });
});

setInterval(() => {
  io.emit("state", players);
}, 50);

app.get("/", (req, res) => {
  res.send("NeoProxy Multiplayer Server ONLINE");
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log("SERVER RUNNING ON PORT", PORT);
});
