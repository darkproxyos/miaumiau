const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

const players = {};
const TICK_RATE = 20;

io.on("connection", (socket) => {
  console.log("Jugador conectado:", socket.id);

  players[socket.id] = {
    id: socket.id,
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    input: { up: false, down: false, left: false, right: false, dash: false }
  };

  socket.on("input", (inputData) => {
    const player = players[socket.id];
    if (player) {
      player.input = inputData;
    }
  });

  socket.on("disconnect", () => {
    console.log("Jugador desconectado:", socket.id);
    delete players[socket.id];
  });
});

const SPEED = 8;
const DASH_SPEED = 20;

setInterval(() => {
  const delta = 1 / TICK_RATE;

  for (const id in players) {
    const p = players[id];
    let speed = SPEED;
    
    if (p.input.dash) speed = DASH_SPEED;

    p.velocity.x = 0;
    p.velocity.z = 0;
    if (p.input.up) p.velocity.z = speed;
    if (p.input.down) p.velocity.z = -speed;
    if (p.input.left) p.velocity.x = -speed;
    if (p.input.right) p.velocity.x = speed;

    p.position.x += p.velocity.x * delta;
    p.position.z += p.velocity.z * delta;
  }

  io.emit("state", players);
}, 1000 / TICK_RATE);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`ProxyOS Multiplayer Server ONLINE`);
});
