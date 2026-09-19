"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Throne } from "@/components/three/Throne";
import type { ThroneSkin } from "@/lib/theme/throneSkins";

const SPEED = 0.9; // units/s
const SPAN = 16; // wrap distance

/** A row of small thrones sliding left-to-right in the far background, wrapping
 * once they clear the span (Section 9, Branch Owner/Manager roles). Matches the
 * accessible scope's own theme skin when it narrows to one branch, so the
 * background row stays visually consistent with the hero throne in front of it. */
export function ThroneRow({
  count = 5,
  paused,
  skin = "signature",
}: {
  count?: number;
  paused: boolean;
  skin?: ThroneSkin;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (paused || !groupRef.current) return;
    groupRef.current.children.forEach((child: THREE.Object3D) => {
      child.position.x += SPEED * delta;
      if (child.position.x > SPAN / 2) child.position.x -= SPAN;
    });
  });

  return (
    <group ref={groupRef} position={[0, -0.6, -6]}>
      {Array.from({ length: count }, (_, i) => (
        <Throne
          key={i}
          scale={0.22}
          position={[(i / count) * SPAN - SPAN / 2, 0, 0]}
          skin={skin}
        />
      ))}
    </group>
  );
}
