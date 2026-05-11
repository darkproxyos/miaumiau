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
  Color4,
  StandardMaterial,
  DirectionalLight
} from "@babylonjs/core";

import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);

    // 🎨 CIELO Y NIEBLA KAWAII
    scene.clearColor = new Color4(0.85, 0.9, 1.0, 1);
    scene.fogMode = Scene.FOGMODE_EXP;
    scene.fogDensity = 0.008;
    scene.fogColor = new Color3(0.85, 0.9, 1.0);

    // 🌟 LUCES CÁLIDAS
    const light1 = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);
    light1.intensity = 0.7;
    light1.groundColor = new Color3(1, 0.8, 0.8); 

    const light2 = new DirectionalLight("light2", new Vector3(-1, -2, -1), scene);
    light2.intensity = 0.5;
    light2.diffuse = new Color3(1, 0.95, 0.8); 

    // 📷 CÁMARA
    const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 3.5, 25, Vector3.Zero(), scene);
    camera.attachControl(canvasRef.current, true);
    camera.lowerRadiusLimit = 8;
    camera.upperRadiusLimit = 40;

    // 🌿 SUELO
    const ground = MeshBuilder.CreateGround("ground", { width: 150, height: 150, subdivisions: 32 }, scene);
    const groundMat = new StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new Color3(0.65, 0.95, 0.55); 
    groundMat.specularColor = new Color3(0.1, 0.1, 0.1);
    ground.material = groundMat;

    // 🌳 ARBOLES
    const createTree = (x: number, z: number) => {
      const trunk = MeshBuilder.CreateCylinder("trunk", { height: 2, diameterTop: 0.3, diameterBottom: 0.5, tessellation: 6 }, scene);
      trunk.position = new Vector3(x, 1, z);
      const trunkMat = new StandardMaterial("tMat", scene);
      trunkMat.diffuseColor = new Color3(0.8, 0.55, 0.3);
      trunkMat.specularColor = Color3.Black();
      trunk.material = trunkMat;

      const colors = [new Color3(0.4, 0.9, 0.4), new Color3(0.3, 0.85, 0.5), new Color3(0.5, 1, 0.6)];
      
      const leaves1 = MeshBuilder.CreateSphere("l1", { diameter: 3, segments: 8 }, scene);
      leaves1.position = new Vector3(x, 2.5, z);
      const lMat1 = new StandardMaterial("lMat1", scene);
      lMat1.diffuseColor = colors[Math.floor(Math.random() * colors.length)];
      lMat1.specularColor = Color3.Black();
      leaves1.material = lMat1;

      const leaves2 = MeshBuilder.CreateSphere("l2", { diameter: 2.2, segments: 8 }, scene);
      leaves2.position = new Vector3(x + 0.5, 3.8, z - 0.2);
      const lMat2 = new StandardMaterial("lMat2", scene);
      lMat2.diffuseColor = colors[Math.floor(Math.random() * colors.length)];
      lMat2.specularColor = Color3.Black();
      leaves2.material = lMat2;
    };

    for (let i = 0; i < 60; i++) {
      const x = (Math.random() - 0.5) * 120;
      const z = (Math.random() - 0.5) * 120;
      if (Math.abs(x) > 8 || Math.abs(z) > 8) createTree(x, z);
    }

    // 🏔️ MONTAÑAS
    const createMountain = (x: number, z: number, size: number, color: Color3) => {
      const mtn = MeshBuilder.CreateCylinder("mtn", { height: size * 2, diameterTop: 0, diameterBottom: size * 3, tessellation: 6 }, scene);
      mtn.position = new Vector3(x, size, z);
      const mtnMat = new StandardMaterial("mtnMat", scene);
      mtnMat.diffuseColor = color;
      mtnMat.specularColor = Color3.Black();
      mtn.material = mtnMat;
    };

    createMountain(-60, -60, 25, new Color3(0.75, 0.7, 0.9)); 
    createMountain(50, -70, 30, new Color3(0.7, 0.8, 0.95));  
    createMountain(0, -90, 20, new Color3(0.85, 0.75, 0.9));  

    // 🌸 FLORES
    const createFlower = (x: number, z: number) => {
      const flower = MeshBuilder.CreateSphere("flower", { diameter: 0.6, segments: 8 }, scene);
      flower.position = new Vector3(x, 0.5, z);
      const fMat = new StandardMaterial("fMat", scene);
      fMat.diffuseColor = new Color3(1, 0.6, 0.8); 
      fMat.emissiveColor = new Color3(0.5, 0.2, 0.4); 
      fMat.specularColor = Color3.Black();
      flower.material = fMat;
    };

    for (let i = 0; i < 30; i++) {
      createFlower((Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80);
    }

    // 🌐 NETWORKING
    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    const players: any = {};
    let myId: string | null = null;

    const keys = { up: false, down: false, left: false, right: false, dash: false };

    const keyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "w") keys.up = true;
      if (e.key.toLowerCase() === "s") keys.down = true;
      if (e.key.toLowerCase() === "a") keys.left = true;
      if (e.key.toLowerCase() === "d") keys.right = true;
      if (e.key === "Shift") keys.dash = true;
    };

    const keyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "w") keys.up = false;
      if (e.key.toLowerCase() === "s") keys.down = false;
      if (e.key.toLowerCase() === "a") keys.left = false;
      if (e.key.toLowerCase() === "d") keys.right = false;
      if (e.key === "Shift") keys.dash = false;
    };

    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);

    const inputLoop = setInterval(() => {
      socket.emit("input", keys);
    }, 50);

    socket.on("state", (state) => {
      if (!myId) myId = socket.id;

      for (const id in state) {
        const data = state[id];

        if (!players[id]) {
          const body = MeshBuilder.CreateCapsule("player_" + id, { height: 1.5, radius: 0.6, tessellation: 16 }, scene);
          const mat = new StandardMaterial("mat_" + id, scene);
          mat.specularColor = new Color3(0.3, 0.3, 0.3);
          
          if (id === myId) {
            mat.diffuseColor = new Color3(0.6, 0.8, 1); 
            mat.emissiveColor = new Color3(0.2, 0.3, 0.5); 
          } else {
            mat.diffuseColor = new Color3(1, 0.7, 0.8); 
            mat.emissiveColor = new Color3(0.4, 0.2, 0.3);
          }
          
          body.material = mat;
          players[id] = body;
        }

        const mesh = players[id];
        mesh.position = Vector3.Lerp(mesh.position, new Vector3(data.position.x, 1, data.position.z), 0.3);

        if (Math.abs(data.velocity.x) > 0.1 || Math.abs(data.velocity.z) > 0.1) {
          mesh.position.y = 1 + Math.sin(Date.now() * 0.01) * 0.15;
        }

        if (id === myId) {
          camera.target = Vector3.Lerp(camera.target, mesh.position, 0.05);
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
      clearInterval(inputLoop);
      socket.disconnect();
      engine.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100vw",
        height: "100vh",
        display: "block",
        outline: "none"
      }}
    />
  );
}
