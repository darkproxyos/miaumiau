"use client";

import { useEffect, useRef, useState } from "react";
import {
  Engine, Scene, ArcRotateCamera, HemisphericLight,
  MeshBuilder, Vector3, Color3, Color4, StandardMaterial,
  DirectionalLight, Mesh
} from "@babylonjs/core";
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";
import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";

const AVATARS = [
  { label: "🩵 Cielo",    color: [0.6, 0.8, 1.0],   emissive: [0.2, 0.3, 0.5] },
  { label: "🩷 Candy",    color: [1.0, 0.7, 0.8],   emissive: [0.4, 0.2, 0.3] },
  { label: "💜 Malva",    color: [0.8, 0.6, 1.0],   emissive: [0.3, 0.1, 0.4] },
  { label: "🍋 Limón",    color: [1.0, 0.95, 0.4],  emissive: [0.4, 0.4, 0.1] },
  { label: "🍑 Durazno",  color: [1.0, 0.75, 0.5],  emissive: [0.4, 0.25, 0.1] },
  { label: "🤍 Nieve",    color: [0.95, 0.95, 1.0], emissive: [0.3, 0.3, 0.4] },
];

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [screen, setScreen] = useState<"lobby" | "game">("lobby");
  const [name, setName] = useState("");
  const [avatarIdx, setAvatarIdx] = useState(0);
  const [nameError, setNameError] = useState("");
  const gameDataRef = useRef<{ name: string; avatarIdx: number } | null>(null);

  const handlePlay = () => {
    const trimmed = name.trim();
    if (!trimmed) { setNameError("¡Pon tu nombre de gatito! 🐾"); return; }
    if (trimmed.length > 16) { setNameError("Máximo 16 caracteres 🙈"); return; }
    gameDataRef.current = { name: trimmed, avatarIdx };
    setScreen("game");
  };

  useEffect(() => {
    if (screen !== "game" || !canvasRef.current || !gameDataRef.current) return;

    const { name: myName, avatarIdx: myAvatar } = gameDataRef.current;
    const myColor = AVATARS[myAvatar].color;
    const myEmissive = AVATARS[myAvatar].emissive;

    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);

    scene.clearColor = new Color4(0.85, 0.9, 1.0, 1);
    scene.fogMode = Scene.FOGMODE_EXP;
    scene.fogDensity = 0.008;
    scene.fogColor = new Color3(0.85, 0.9, 1.0);

    const light1 = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);
    light1.intensity = 0.7;
    light1.groundColor = new Color3(1, 0.8, 0.8);

    const light2 = new DirectionalLight("light2", new Vector3(-1, -2, -1), scene);
    light2.intensity = 0.5;
    light2.diffuse = new Color3(1, 0.95, 0.8);

    const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 3.5, 25, Vector3.Zero(), scene);
    camera.attachControl(canvasRef.current, true);
    camera.lowerRadiusLimit = 8;
    camera.upperRadiusLimit = 40;

    const ground = MeshBuilder.CreateGround("ground", { width: 150, height: 150, subdivisions: 32 }, scene);
    const groundMat = new StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new Color3(0.65, 0.95, 0.55);
    groundMat.specularColor = new Color3(0.1, 0.1, 0.1);
    ground.material = groundMat;

    const createTree = (x: number, z: number, idx: number) => {
      const trunk = MeshBuilder.CreateCylinder("trunk_" + idx, { height: 2, diameterTop: 0.3, diameterBottom: 0.5, tessellation: 6 }, scene);
      trunk.position = new Vector3(x, 1, z);
      const trunkMat = new StandardMaterial("trunkMat_" + idx, scene);
      trunkMat.diffuseColor = new Color3(0.8, 0.55, 0.3);
      trunkMat.specularColor = Color3.Black();
      trunk.material = trunkMat;

      const leafColors = [new Color3(0.4, 0.9, 0.4), new Color3(0.3, 0.85, 0.5), new Color3(0.5, 1, 0.6)];
      const lc = leafColors[idx % 3];

      const leaves1 = MeshBuilder.CreateSphere("leaves1_" + idx, { diameter: 3, segments: 8 }, scene);
      leaves1.position = new Vector3(x, 2.5, z);
      const lMat1 = new StandardMaterial("lMat1_" + idx, scene);
      lMat1.diffuseColor = lc;
      lMat1.specularColor = Color3.Black();
      leaves1.material = lMat1;

      const leaves2 = MeshBuilder.CreateSphere("leaves2_" + idx, { diameter: 2.2, segments: 8 }, scene);
      leaves2.position = new Vector3(x + 0.5, 3.8, z - 0.2);
      const lMat2 = new StandardMaterial("lMat2_" + idx, scene);
      lMat2.diffuseColor = lc;
      lMat2.specularColor = Color3.Black();
      leaves2.material = lMat2;
    };

    for (let i = 0; i < 60; i++) {
      const x = (Math.random() - 0.5) * 120;
      const z = (Math.random() - 0.5) * 120;
      if (Math.abs(x) > 8 || Math.abs(z) > 8) createTree(x, z, i);
    }

    const createMountain = (x: number, z: number, size: number, color: Color3, idx: number) => {
      const mtn = MeshBuilder.CreateCylinder("mtn_" + idx, { height: size * 2, diameterTop: 0, diameterBottom: size * 3, tessellation: 6 }, scene);
      mtn.position = new Vector3(x, size, z);
      const mtnMat = new StandardMaterial("mtnMat_" + idx, scene);
      mtnMat.diffuseColor = color;
      mtnMat.specularColor = Color3.Black();
      mtn.material = mtnMat;
    };
    createMountain(-60, -60, 25, new Color3(0.75, 0.7, 0.9), 0);
    createMountain(50,  -70, 30, new Color3(0.7,  0.8, 0.95), 1);
    createMountain(0,  -90, 20, new Color3(0.85, 0.75, 0.9), 2);

    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    const players: Record<string, { mesh: Mesh; nameTag: TextBlock }> = {};
    let myId: string | null = null;

    const keys = { up: false, down: false, left: false, right: false, dash: false };
    let lastKeys = JSON.stringify(keys);

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
      const current = JSON.stringify(keys);
      if (current !== lastKeys) {
        socket.emit("input", keys);
        lastKeys = current;
      }
    }, 50);

    socket.on("connect", () => {
      myId = socket.id ?? null;
      socket.emit("setName", myName);
      socket.emit("setAvatar", myAvatar);
    });

    socket.on("connect_error", () => {
      console.error("No se pudo conectar al servidor MiauMiau 😿");
    });

    socket.on("state", (state: Record<string, any>) => {
      for (const id in state) {
        const data = state[id];

        // SEGURIDAD: datos incompletos = ignorar frame
        if (!data?.position || !data?.velocity) continue;

        const isMe = id === myId;

        if (!players[id]) {
          const parent = MeshBuilder.CreateBox("root_" + id, { size: 0.01 }, scene) as Mesh;

          const body = MeshBuilder.CreateCapsule("body_" + id, { height: 1.2, radius: 0.5, tessellation: 16 }, scene);
          const mat = new StandardMaterial("mat_" + id, scene);

          const av = AVATARS[data.avatarIdx ?? 0];
          mat.diffuseColor  = new Color3(...(av?.color    ?? myColor)    as [number, number, number]);
          mat.emissiveColor = new Color3(...(av?.emissive ?? myEmissive) as [number, number, number]);
          mat.specularColor = new Color3(0.3, 0.3, 0.3);
          body.material = mat;
          body.parent = parent;

          const earBase = { height: 0.4, diameterTop: 0, diameterBottom: 0.4, tessellation: 3 };

          const earL = MeshBuilder.CreateCylinder("earL_" + id, earBase, scene);
          earL.position = new Vector3(-0.25, 0.85, 0);
          earL.rotation.z = Math.PI / 6;
          earL.material = mat;
          earL.parent = parent;

          const earR = MeshBuilder.CreateCylinder("earR_" + id, earBase, scene);
          earR.position = new Vector3(0.25, 0.85, 0);
          earR.rotation.z = -Math.PI / 6;
          earR.material = mat;
          earR.parent = parent;

          const plane = MeshBuilder.CreatePlane("namePlane_" + id, { width: 2, height: 0.5 }, scene) as Mesh;
          plane.position = new Vector3(0, 1.8, 0);
          plane.parent = parent;
          plane.billboardMode = Mesh.BILLBOARDMODE_ALL;

          const advTex = AdvancedDynamicTexture.CreateForMesh(plane);
          const tb = new TextBlock("tb_" + id);
          tb.text = data.name || "Gatito";
          tb.color = isMe ? "#aee8ff" : "#ffc8dd";
          tb.fontSize = 24;
          tb.fontFamily = "Arial";
          tb.outlineWidth = 3;
          tb.outlineColor = "#333";
          advTex.addControl(tb);

          players[id] = { mesh: parent, nameTag: tb };
        }

        const { mesh, nameTag } = players[id];
        if (data.name && nameTag.text !== data.name) nameTag.text = data.name;

        const px = data.position.x ?? 0;
        const pz = data.position.z ?? 0;
        const vx = data.velocity.x ?? 0;
        const vz = data.velocity.z ?? 0;

        const target = new Vector3(px, 0, pz);
        mesh.position = Vector3.Lerp(mesh.position, target, 0.3);

        const moving = Math.abs(vx) > 0.1 || Math.abs(vz) > 0.1;
        mesh.position.y = moving ? Math.sin(Date.now() * 0.015) * 0.15 : 0;

        if (isMe) {
          camera.target = Vector3.Lerp(camera.target, mesh.position, 0.05);
        }
      }

      for (const id in players) {
        if (!state[id]) {
          players[id].mesh.dispose();
          delete players[id];
        }
      }
    });

    engine.runRenderLoop(() => scene.render());
    window.addEventListener("resize", () => engine.resize());

    return () => {
      clearInterval(inputLoop);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      socket.disconnect();
      engine.dispose();
    };
  }, [screen]);

  if (screen === "lobby") {
    return (
      <div style={{
        width: "100vw", height: "100vh",
        background: "linear-gradient(135deg, #fce4ec 0%, #e3f2fd 50%, #f3e5f5 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Segoe UI', sans-serif"
      }}>
        <div style={{
          background: "rgba(255,255,255,0.75)",
          backdropFilter: "blur(12px)",
          borderRadius: "24px",
          padding: "40px 48px",
          boxShadow: "0 8px 32px rgba(180,130,200,0.25)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "20px",
          minWidth: "320px"
        }}>
          <div style={{ fontSize: "48px" }}>🐾</div>
          <h1 style={{ margin: 0, fontSize: "28px", color: "#c06090", letterSpacing: "2px" }}>MiauMiau</h1>
          <p style={{ margin: 0, color: "#999", fontSize: "14px" }}>El mundo kawaii multijugador</p>

          <input
            maxLength={16}
            placeholder="Tu nombre de gatito..."
            value={name}
            onChange={e => { setName(e.target.value); setNameError(""); }}
            onKeyDown={e => e.key === "Enter" && handlePlay()}
            style={{
              width: "100%", padding: "10px 16px", borderRadius: "12px",
              border: "2px solid #f0a0c0", outline: "none", fontSize: "16px",
              background: "#fff8fb", color: "#333", boxSizing: "border-box",
              textAlign: "center"
            }}
          />
          {nameError && <p style={{ margin: 0, color: "#e06080", fontSize: "13px" }}>{nameError}</p>}

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
            {AVATARS.map((av, i) => (
              <button key={i} onClick={() => setAvatarIdx(i)} style={{
                padding: "8px 14px", borderRadius: "12px", border: "none", cursor: "pointer",
                fontSize: "13px", fontWeight: "bold",
                background: avatarIdx === i ? "#f8b4cc" : "#f0f0f0",
                color: avatarIdx === i ? "#fff" : "#888",
                transform: avatarIdx === i ? "scale(1.1)" : "scale(1)",
                transition: "all 0.15s ease",
                boxShadow: avatarIdx === i ? "0 2px 8px rgba(240,100,150,0.4)" : "none"
              }}>
                {av.label}
              </button>
            ))}
          </div>

          <button onClick={handlePlay} style={{
            padding: "12px 36px", borderRadius: "16px", border: "none",
            background: "linear-gradient(90deg, #f48fb1, #ce93d8)",
            color: "white", fontSize: "18px", fontWeight: "bold", cursor: "pointer",
            boxShadow: "0 4px 16px rgba(200,100,180,0.4)",
            letterSpacing: "1px", transition: "transform 0.1s"
          }}
            onMouseDown={e => (e.currentTarget.style.transform = "scale(0.96)")}
            onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
          >
            ¡Jugar! 🐱
          </button>
        </div>
      </div>
    );
  }

  return (
    <canvas ref={canvasRef} style={{ width: "100vw", height: "100vh", display: "block", outline: "none" }} />
  );
}
