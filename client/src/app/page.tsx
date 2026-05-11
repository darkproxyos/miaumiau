"use client";

import { useEffect, useRef } from "react";
import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  MeshBuilder,
  Vector3,
  Color3,
  StandardMaterial
} from "@babylonjs/core";

import { io } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SERVER_URL ||
  "https://miaumiau-d58w.onrender.com";

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    console.log("CONNECTING TO:", SOCKET_URL);

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("CONNECTED:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.log("SOCKET ERROR:", err.message);
    });

    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);

    const camera = new ArcRotateCamera(
      "camera",
      -Math.PI / 2,
      Math.PI / 3,
      20,
      Vector3.Zero(),
      scene
    );

    camera.attachControl(canvasRef.current, true);

    const light = new HemisphericLight(
      "light",
      new Vector3(0, 1, 0),
      scene
    );

    light.intensity = 1;

    const ground = MeshBuilder.CreateGround(
      "ground",
      { width: 50, height: 50 },
      scene
    );

    const groundMat = new StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new Color3(0.1, 0.1, 0.15);
    ground.material = groundMat;

    const players: any = {};

    const keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      dash: false
    };

    window.addEventListener("keydown", (e) => {
      if (e.key === "w") keys.up = true;
      if (e.key === "s") keys.down = true;
      if (e.key === "a") keys.left = true;
      if (e.key === "d") keys.right = true;
      if (e.key === "Shift") keys.dash = true;
    });

    window.addEventListener("keyup", (e) => {
      if (e.key === "w") keys.up = false;
      if (e.key === "s") keys.down = false;
      if (e.key === "a") keys.left = false;
      if (e.key === "d") keys.right = false;
      if (e.key === "Shift") keys.dash = false;
    });

    setInterval(() => {
      socket.emit("input", keys);
    }, 50);

    socket.on("state", (state: any) => {
      console.log("STATE:", state);

      for (const id in state) {
        const p = state[id];

        if (!players[id]) {
          const mesh = MeshBuilder.CreateCapsule(
            "player_" + id,
            { height: 2, radius: 0.5 },
            scene
          );

          const mat = new StandardMaterial("mat_" + id, scene);

          mat.diffuseColor =
            id === socket.id
              ? Color3.Blue()
              : Color3.Red();

          mesh.material = mat;

          players[id] = mesh;
        }

        players[id].position.x = p.position.x;
        players[id].position.z = p.position.z;

        if (id === socket.id) {
          camera.target = players[id].position;
        }
      }
    });

    engine.runRenderLoop(() => {
      scene.render();
    });

    window.addEventListener("resize", () => {
      engine.resize();
    });

    return () => {
      engine.dispose();
      socket.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100vw",
        height: "100vh",
        display: "block"
      }}
    />
  );
}
