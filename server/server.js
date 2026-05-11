const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("ProxyOS Multiplayer Server ONLINE");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const players = {};

io.on("connection", (socket) => {
  console.log("player connected", socket.id);

  players[socket.id] = {
    position: { x: 0, z: 0 }
  };

  socket.on("input", (keys) => {
    const speed = keys.dash ? 0.4 : 0.2;

    if (keys.up) players[socket.id].position.z -= speed;
    if (keys.down) players[socket.id].position.z += speed;
    if (keys.left) players[socket.id].position.x -= speed;
    if (keys.right) players[socket.id].position.x += speed;
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
  });
});

setInterval(() => {
  io.emit("state", players);
}, 50);

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log("server running on", PORT);
});
