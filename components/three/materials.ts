import * as THREE from "three";

/**
 * Shared materials for every throne instance (Section 9: "shared materials" is
 * explicitly called out for performance — one material per look, reused across
 * the hero throne, the orbit ring, and the sliding row).
 */
export const goldMaterial = new THREE.MeshStandardMaterial({
  color: "#D4AF37",
  metalness: 0.85,
  roughness: 0.3,
  emissive: "#8A6C2A",
  emissiveIntensity: 0.08,
});

export const deepGoldMaterial = new THREE.MeshStandardMaterial({
  color: "#8A6C2A",
  metalness: 0.8,
  roughness: 0.38,
  emissive: "#3a2d10",
  emissiveIntensity: 0.05,
});

export const blackVelvetMaterial = new THREE.MeshStandardMaterial({
  color: "#0a0806",
  metalness: 0.05,
  roughness: 0.85,
});

export const crestJewelMaterial = new THREE.MeshStandardMaterial({
  color: "#D8674F",
  metalness: 0.4,
  roughness: 0.15,
  emissive: "#D8674F",
  emissiveIntensity: 0.35,
});
