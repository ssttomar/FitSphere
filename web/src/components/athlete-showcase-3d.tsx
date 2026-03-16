"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, OrbitControls } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type { Group } from "three";

type AthleteVariant = "runner" | "powerlifter" | "calisthenics";

function AthleteFigure({ variant, x }: { variant: AthleteVariant; x: number }) {
  const groupRef = useRef<Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.y = Math.sin(t * 0.45 + x) * 0.22;
    groupRef.current.position.y = Math.sin(t * 0.9 + x) * 0.03;
  });

  const accent = useMemo(() => {
    if (variant === "runner") return "#00D4FF";
    if (variant === "powerlifter") return "#FF6A3D";
    return "#A8FF60";
  }, [variant]);

  const armOffset = variant === "calisthenics" ? 0.66 : 0.5;
  const torsoScale = variant === "powerlifter" ? [0.95, 1.2, 0.62] : [0.82, 1.05, 0.52];

  return (
    <group ref={groupRef} position={[x, 0, 0]}>
      <mesh position={[0, 1.85, 0]} castShadow>
        <sphereGeometry args={[0.24, 32, 32]} />
        <meshStandardMaterial color="#f5f5f5" metalness={0.35} roughness={0.25} />
      </mesh>
      <mesh position={[0, 1.2, 0]} scale={torsoScale as [number, number, number]} castShadow>
        <capsuleGeometry args={[0.35, 0.55, 10, 20]} />
        <meshStandardMaterial color={accent} metalness={0.45} roughness={0.3} />
      </mesh>
      <mesh position={[0.42, armOffset, 0]} rotation={[0, 0, -0.4]} castShadow>
        <capsuleGeometry args={[0.11, 0.5, 8, 16]} />
        <meshStandardMaterial color="#f8f8f8" metalness={0.2} roughness={0.32} />
      </mesh>
      <mesh position={[-0.42, armOffset, 0]} rotation={[0, 0, 0.4]} castShadow>
        <capsuleGeometry args={[0.11, 0.5, 8, 16]} />
        <meshStandardMaterial color="#f8f8f8" metalness={0.2} roughness={0.32} />
      </mesh>
      <mesh position={[0.2, 0.22, 0]} rotation={[0, 0, 0.2]} castShadow>
        <capsuleGeometry args={[0.12, 0.6, 8, 16]} />
        <meshStandardMaterial color="#f8f8f8" metalness={0.2} roughness={0.32} />
      </mesh>
      <mesh position={[-0.2, 0.22, 0]} rotation={[0, 0, -0.2]} castShadow>
        <capsuleGeometry args={[0.12, 0.6, 8, 16]} />
        <meshStandardMaterial color="#f8f8f8" metalness={0.2} roughness={0.32} />
      </mesh>
    </group>
  );
}

export function AthleteShowcase3D() {
  return (
    <section className="mx-auto mt-20 grid w-full max-w-[1600px] gap-8 px-4 md:px-10 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/70 p-4 shadow-[0_30px_120px_-30px_rgba(0,0,0,0.85)] backdrop-blur-sm">
        <div className="h-[540px] w-full">
          <Canvas shadows camera={{ position: [0, 1.4, 5], fov: 46 }}>
            <ambientLight intensity={0.45} />
            <directionalLight position={[4, 6, 3]} intensity={1.2} castShadow />
            <spotLight position={[-4, 5, 2]} intensity={1.1} color="#7bf2ff" />
            <Float speed={1.1} rotationIntensity={0.2} floatIntensity={0.2}>
              <AthleteFigure variant="runner" x={-1.6} />
              <AthleteFigure variant="powerlifter" x={0} />
              <AthleteFigure variant="calisthenics" x={1.6} />
            </Float>
            <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.52, 0]}>
              <planeGeometry args={[16, 16]} />
              <shadowMaterial opacity={0.25} />
            </mesh>
            <Environment preset="city" />
            <OrbitControls enablePan={false} minDistance={3.8} maxDistance={7} />
          </Canvas>
        </div>
      </div>

      <div className="flex flex-col justify-center gap-5 rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-xl">
        <h2 className="font-display text-4xl uppercase leading-none text-white md:text-5xl">
          Interactive Athlete Models
        </h2>
        <p className="text-zinc-300">
          Explore stylized runners, powerlifters, and calisthenics athletes in a dynamic 3D scene. Drag to rotate and inspect motion details.
        </p>
        <div className="grid gap-3 text-sm text-zinc-200">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Runner sprinting with explosive cadence tracking</div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Powerlifter deadlift stance with peak force focus</div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Calisthenics muscle-up sequence with form control</div>
        </div>
      </div>
    </section>
  );
}
