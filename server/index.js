const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const players = {};
const TICK_RATE = 20;
const SPEED = 8;
const DASH_SPEED = 20;
const MAP_LIMIT = 72;

io.on("connection", (socket) => {
  console.log("Gatito conectado:", socket.id);
  players[socket.id] = {
    id: socket.id,
    name: "Gatito",
    avatarIdx: 0,
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    input: { up: false, down: false, left: false, right: false, dash: false }
  };

  socket.on("setName", (name) => {
    if (typeof name !== "string") return;
    players[socket.id].name = name.slice(0, 16).replace(/[<>]/g, "");
  });

  socket.on("setAvatar", (idx) => {
    const i = parseInt(idx);
    if (!isNaN(i) && i >= 0 && i <= 5) players[socket.id].avatarIdx = i;
  });

  socket.on("input", (input) => {
    const p = players[socket.id];
    if (!p) return;
    p.input = {
      up:    !!input.up,
      down:  !!input.down,
      left:  !!input.left,
      right: !!input.right,
      dash:  !!input.dash
    };
  });

  socket.on("disconnect", () => {
    console.log("Gatito desconectado:", socket.id);
    delete players[socket.id];
  });
});

setInterval(() => {
  const delta = 1 / TICK_RATE;
  for (const id in players) {
    const p = players[id];
    const speed = p.input.dash ? DASH_SPEED : SPEED;
    p.velocity.x = 0;
    p.velocity.z = 0;
    if (p.input.up)    p.velocity.z =  speed;
    if (p.input.down)  p.velocity.z = -speed;
    if (p.input.left)  p.velocity.x = -speed;
    if (p.input.right) p.velocity.x =  speed;
    p.position.x = Math.max(-MAP_LIMIT, Math.min(MAP_LIMIT, p.position.x + p.velocity.x * delta));
    p.position.z = Math.max(-MAP_LIMIT, Math.min(MAP_LIMIT, p.position.z + p.velocity.z * delta));
  }
  io.emit("state", players);
}, 1000 / TICK_RATE);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log("MiauMiau Server ONLINE 🐾 puerto", PORT));
