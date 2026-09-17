"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Throne } from "@/components/three/Throne";

export interface OrbitBranch {
  code: string;
  color: string;
}

/**
 * A ring of small thrones orbiting the hero throne, one per accessible branch
 * (Section 9, brand roles). The whole ring rotates together; each mini throne
 * also faces outward along its orbit.
 */
export function ThroneOrbit({
  branches,
  radius = 2.6,
  paused,
}: {
  branches: OrbitBranch[];
  radius?: number;
  paused: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (paused || !groupRef.current) return;
    groupRef.current.rotation.y += 0.12 * delta;
  });

  return (
    <group ref={groupRef}>
      {branches.map((b, i) => {
        const angle = (i / branches.length) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        return (
          <Throne
            key={b.code}
            scale={0.28}
            position={[x, -0.4, z]}
            rotationY={-angle + Math.PI / 2}
            accentColor={b.color}
          />
        );
      })}
    </group>
  );
}
