"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 400;
const SPREAD_X = 14;
const SPREAD_Z = 8;
const HEIGHT = 8;

/** ~400 gold dust points drifting upward, wrapping once they clear the scene. */
export function GoldDust({ paused }: { paused: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  const speeds = useRef<Float32Array>(new Float32Array(COUNT));

  const geometry = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * SPREAD_X;
      positions[i * 3 + 1] = Math.random() * HEIGHT - HEIGHT / 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * SPREAD_Z - 2;
      speeds.current[i] = 0.15 + Math.random() * 0.25;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame((_, delta) => {
    if (paused) return;
    const positions = geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < COUNT; i += 1) {
      let y = positions.getY(i) + speeds.current[i] * delta;
      if (y > HEIGHT / 2) y = -HEIGHT / 2;
      positions.setY(i, y);
    }
    positions.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color="#D4AF37"
        size={0.035}
        sizeAttenuation
        transparent
        opacity={0.55}
        depthWrite={false}
      />
    </points>
  );
}
