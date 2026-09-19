"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Throne } from "@/components/three/Throne";
import { ThroneOrbit, type OrbitBranch } from "@/components/three/ThroneOrbit";
import { ThroneRow } from "@/components/three/ThroneRow";
import { GoldDust } from "@/components/three/GoldDust";
import type { ThroneSkin } from "@/lib/theme/throneSkins";

export interface ThreeStageProps {
  /** "grand" for brand roles (hero + orbit ring), "branch" for Branch Owner/Manager
   * (smaller hero + sliding row) — Section 9. */
  variant: "grand" | "branch";
  orbitBranches: OrbitBranch[];
  /** Tints the rim light when the scope narrows to a single branch. */
  rimColor: string | null;
  /** The hero throne's own skin — that branch's theme when scope narrows to
   * one branch, "signature" for brand-wide views. */
  heroSkin: ThroneSkin;
  paused: boolean;
}

function CameraRig({ isMobile }: { isMobile: boolean }) {
  const { camera } = useThree();
  const pointer = useRef({ x: 0, y: 0 });
  const target = useRef(new THREE.Vector3(isMobile ? 0 : 1.6, isMobile ? -1 : 0.4, 5));

  useEffect(() => {
    function onPointerMove(e: PointerEvent) {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    }
    window.addEventListener("pointermove", onPointerMove);
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, []);

  useFrame(() => {
    const scrollFactor = Math.min(window.scrollY / 600, 1);
    const baseX = isMobile ? 0 : 1.6;
    const baseY = isMobile ? -1 : 0.4;
    target.current.set(
      baseX + pointer.current.x * 0.25,
      baseY - pointer.current.y * 0.15 - scrollFactor * 0.6,
      5 - scrollFactor * 0.8,
    );
    camera.position.lerp(target.current, 0.04);
    camera.lookAt(isMobile ? 0 : 1.4, 0.3, 0);
  });

  return null;
}

function Scene({ variant, orbitBranches, rimColor, heroSkin, paused }: ThreeStageProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 759px)");
    setIsMobile(mq.matches);
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const heroThroneScale =
    variant === "grand" ? (isMobile ? 0.55 : 0.75) : isMobile ? 0.45 : 0.6;
  const heroPosition: [number, number, number] = isMobile
    ? [0, -1.6, -1]
    : [1.6, -0.3, -1];
  const heroRotation = paused ? 0 : undefined; // static rotation handled by useFrame below

  return (
    <>
      <fog attach="fog" args={["#000000", 5, 16]} />
      <ambientLight intensity={0.18} />
      <directionalLight position={[3, 5, 4]} intensity={1.1} color="#F2DFA7" />
      <pointLight position={[-2, 2, -3]} intensity={1.4} color={rimColor ?? "#D4AF37"} />
      <spotLight
        position={[0, 6, 1]}
        angle={0.5}
        penumbra={0.6}
        intensity={0.6}
        color="#F3ECDC"
      />

      <RotatingHero
        scale={heroThroneScale}
        position={heroPosition}
        paused={paused}
        fixedRotation={heroRotation}
        skin={heroSkin}
      />

      {variant === "grand" ? (
        <group position={heroPosition}>
          <ThroneOrbit branches={orbitBranches} paused={paused} />
        </group>
      ) : (
        <ThroneRow paused={paused} skin={heroSkin} />
      )}

      <GoldDust paused={paused} />
      <CameraRig isMobile={isMobile} />
    </>
  );
}

function RotatingHero({
  scale,
  position,
  paused,
  fixedRotation,
  skin,
}: {
  scale: number;
  position: [number, number, number];
  paused: boolean;
  fixedRotation?: number;
  skin: ThroneSkin;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (paused || !ref.current) return;
    ref.current.rotation.y += 0.18 * delta;
  });
  return (
    <group ref={ref} rotation={[0, fixedRotation ?? 0, 0]}>
      <Throne scale={scale} position={position} skin={skin} />
    </group>
  );
}

/**
 * The full-viewport fixed 3D canvas (Section 9). Mounted once by
 * components/three/index.tsx, which also handles the WebGL-availability check,
 * the "mount after first paint" deferral, and the reduced-motion static frame.
 */
export function ThreeStage(props: ThreeStageProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: "low-power" }}
      camera={{ position: [1.6, 0.4, 5], fov: 42 }}
      frameloop={props.paused ? "demand" : "always"}
    >
      <Scene {...props} />
    </Canvas>
  );
}
