"use client";

// The single signature Three.js element of the marketing landing: a golden
// ring that breathes and leans gently toward the pointer. Rendered client-only
// (dynamic import, ssr:false) after idle; the CSS ring fallback shows until it
// mounts and under prefers-reduced-motion it holds a still frame.
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import type { Mesh } from "three";

function GoldenRing() {
  const mesh = useRef<Mesh>(null);
  useFrame((state, delta) => {
    const ring = mesh.current;
    if (!ring) return;
    // Slow ambient spin plus a quiet lean toward the pointer — nothing faster.
    ring.rotation.y += delta * 0.12;
    ring.rotation.x += delta * 0.05;
    const lean = 0.22;
    ring.rotation.x += (state.pointer.y * lean - ring.rotation.z) * delta * 0.8;
    ring.position.x += (state.pointer.x * 0.35 - ring.position.x) * delta * 1.2;
  });
  return (
    <mesh ref={mesh} rotation={[0.9, 0, 0.35]}>
      <torusGeometry args={[1.15, 0.16, 48, 128]} />
      {/* No env map (offline-safe), so keep metalness low enough for the
          lights themselves to model the gold and add a warm emissive floor. */}
      <meshStandardMaterial
        color="#d9b25f"
        metalness={0.45}
        roughness={0.28}
        emissive="#2e1f08"
        emissiveIntensity={0.55}
      />
    </mesh>
  );
}

export default function AtelierHeroRing() {
  const [reduced] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  return (
    <div className="atelier-hero-ring" aria-hidden="true">
      <Canvas
        frameloop={reduced ? "demand" : "always"}
        dpr={[1, 1.6]}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        camera={{ position: [0, 0, 3.2], fov: 40 }}
      >
        <ambientLight intensity={0.85} />
        <directionalLight position={[2.4, 2.6, 3]} intensity={3.2} color="#fff3d6" />
        <directionalLight position={[-2.6, -1.4, 1.4]} intensity={1.4} color="#f6d9b8" />
        <pointLight position={[0, -2.6, 2]} intensity={18} color="#c9a24f" />
        <GoldenRing />
      </Canvas>
    </div>
  );
}
