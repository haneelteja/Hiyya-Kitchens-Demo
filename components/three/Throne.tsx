"use client";

import { useMemo } from "react";
import * as THREE from "three";
import {
  blackVelvetMaterial,
  crestJewelMaterial,
  deepGoldMaterial,
  goldMaterial,
} from "@/components/three/materials";

export interface ThroneProps {
  scale?: number;
  position?: [number, number, number];
  rotationY?: number;
  /** Tints the crest jewel — used to mark a specific branch in the orbit ring. */
  accentColor?: string;
}

/**
 * A procedurally-built throne from primitives (Section 9): a two-step round dais;
 * four turned legs with ball feet; a gold seat with a black velvet cushion and
 * apron; a tall back with a velvet inset and a medallion ring; a torus arch with a
 * five-spike crown and a crest jewel; armrests with scroll balls; side pillars
 * with finials. Swappable later for a client-supplied public/models/throne.glb
 * via drei's useGLTF, without changing how callers use <Throne />.
 */
export function Throne({
  scale = 1,
  position = [0, 0, 0],
  rotationY = 0,
  accentColor,
}: ThroneProps) {
  const jewelMaterial = useMemo(() => {
    if (!accentColor) return crestJewelMaterial;
    return new THREE.MeshStandardMaterial({
      color: accentColor,
      metalness: 0.4,
      roughness: 0.15,
      emissive: accentColor,
      emissiveIntensity: 0.35,
    });
  }, [accentColor]);

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      {/* Two-step round dais */}
      <mesh position={[0, 0.05, 0]} material={goldMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[1.15, 1.25, 0.1, 24]} />
      </mesh>
      <mesh position={[0, 0.16, 0]} material={deepGoldMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.95, 1.05, 0.12, 24]} />
      </mesh>

      {/* Four turned legs with ball feet */}
      {[
        [-0.55, -0.55],
        [0.55, -0.55],
        [-0.55, 0.35],
        [0.55, 0.35],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0.22, z]}>
          <mesh material={goldMaterial} castShadow>
            <cylinderGeometry args={[0.05, 0.07, 0.5, 10]} />
          </mesh>
          <mesh material={deepGoldMaterial} position={[0, -0.26, 0]} castShadow>
            <sphereGeometry args={[0.06, 10, 10]} />
          </mesh>
        </group>
      ))}

      {/* Seat, apron, cushion */}
      <mesh position={[0, 0.5, -0.1]} material={goldMaterial} castShadow>
        <boxGeometry args={[1.25, 0.08, 1.05]} />
      </mesh>
      <mesh position={[0, 0.44, 0.42]} material={deepGoldMaterial} castShadow>
        <boxGeometry args={[1.25, 0.14, 0.06]} />
      </mesh>
      <mesh position={[0, 0.57, -0.1]} material={blackVelvetMaterial} castShadow>
        <boxGeometry args={[1.05, 0.09, 0.85]} />
      </mesh>

      {/* Tall back with a velvet inset and a medallion ring */}
      <mesh position={[0, 1.55, -0.58]} material={goldMaterial} castShadow>
        <boxGeometry args={[1.1, 2.1, 0.1]} />
      </mesh>
      <mesh position={[0, 1.55, -0.53]} material={blackVelvetMaterial}>
        <boxGeometry args={[0.82, 1.7, 0.03]} />
      </mesh>
      <mesh
        position={[0, 1.55, -0.51]}
        material={goldMaterial}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[0.3, 0.045, 10, 28]} />
      </mesh>

      {/* Torus arch with five-spike crown and crest jewel */}
      <mesh
        position={[0, 2.62, -0.58]}
        material={goldMaterial}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <torusGeometry args={[0.56, 0.06, 10, 28, Math.PI]} />
      </mesh>
      {Array.from({ length: 5 }, (_, i) => {
        const t = i / 4; // 0..1 across the arch
        const angle = Math.PI * (1 - t); // spread across the top half of the arch
        const x = Math.cos(angle) * 0.56;
        const y = 2.62 + Math.sin(angle) * 0.56;
        return (
          <mesh key={i} position={[x, y, -0.58]} material={deepGoldMaterial} castShadow>
            <coneGeometry args={[0.06, 0.22, 8]} />
          </mesh>
        );
      })}
      <mesh position={[0, 3.02, -0.58]} material={jewelMaterial} castShadow>
        <sphereGeometry args={[0.09, 12, 12]} />
      </mesh>

      {/* Armrests with scroll balls */}
      {[-0.62, 0.62].map((x) => (
        <group key={x}>
          <mesh
            position={[x, 0.72, 0.05]}
            material={goldMaterial}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
          >
            <cylinderGeometry args={[0.05, 0.05, 0.9, 10]} />
          </mesh>
          <mesh position={[x, 0.72, 0.5]} material={deepGoldMaterial} castShadow>
            <sphereGeometry args={[0.09, 10, 10]} />
          </mesh>
        </group>
      ))}

      {/* Side pillars with finials */}
      {[-0.62, 0.62].map((x) => (
        <group key={x}>
          <mesh position={[x, 1.7, -0.58]} material={goldMaterial} castShadow>
            <cylinderGeometry args={[0.055, 0.07, 2.4, 10]} />
          </mesh>
          <mesh position={[x, 2.95, -0.58]} material={deepGoldMaterial} castShadow>
            <coneGeometry args={[0.09, 0.24, 10]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
