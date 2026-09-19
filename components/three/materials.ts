import * as THREE from "three";

/**
 * Shared materials for every throne instance (Section 9: "shared materials" is
 * explicitly called out for performance — one material per look, reused across
 * the hero throne, the orbit ring, and the sliding row).
 *
 * Grouped by throne skin (lib/theme/throneSkins.ts): "signature" is the
 * original brand-wide gold design, used for the grand/brand-wide hero throne;
 * the other four echo one theme's actual physical photo-booth throne each —
 * a stylized procedural abstraction, not a literal recreation (see the
 * theme-9 throne-redesign chat thread for the reference photos this reads
 * against).
 */

// --- Signature (brand-wide) ---
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

// --- Dino: weathered bronze-gold, a phoenix perched on top, ember-orb feet ---
export const bronzeMaterial = new THREE.MeshStandardMaterial({
  color: "#B07A3A",
  metalness: 0.75,
  roughness: 0.42,
  emissive: "#4a3011",
  emissiveIntensity: 0.06,
});

export const patinaGoldMaterial = new THREE.MeshStandardMaterial({
  color: "#C9A24D",
  metalness: 0.7,
  roughness: 0.48,
});

export const phoenixPlumageMaterial = new THREE.MeshStandardMaterial({
  color: "#3E7D53",
  metalness: 0.3,
  roughness: 0.5,
  emissive: "#173322",
  emissiveIntensity: 0.1,
});

export const emberOrbMaterial = new THREE.MeshStandardMaterial({
  color: "#E8A23A",
  metalness: 0.2,
  roughness: 0.25,
  emissive: "#E8A23A",
  emissiveIntensity: 0.9,
});

// --- Chrono Jail: bone-white, rough stone dais, no cushion ---
export const boneMaterial = new THREE.MeshStandardMaterial({
  color: "#DCD3BE",
  metalness: 0.02,
  roughness: 0.85,
});

export const boneShadowMaterial = new THREE.MeshStandardMaterial({
  color: "#A69B85",
  metalness: 0.02,
  roughness: 0.9,
});

export const darkStoneMaterial = new THREE.MeshStandardMaterial({
  color: "#2B2620",
  metalness: 0.05,
  roughness: 0.95,
});

// --- Jail: cold iron, cell-bar back ---
export const ironMaterial = new THREE.MeshStandardMaterial({
  color: "#5B5650",
  metalness: 0.75,
  roughness: 0.4,
});

export const darkIronMaterial = new THREE.MeshStandardMaterial({
  color: "#332F2A",
  metalness: 0.7,
  roughness: 0.5,
});

// --- Space: chrome/platinum, halo ring ---
export const platinumMaterial = new THREE.MeshStandardMaterial({
  color: "#B9B6AE",
  metalness: 0.9,
  roughness: 0.2,
});

export const deepPlatinumMaterial = new THREE.MeshStandardMaterial({
  color: "#7E7B74",
  metalness: 0.9,
  roughness: 0.25,
});

export const starGlowMaterial = new THREE.MeshStandardMaterial({
  color: "#EAF2FF",
  metalness: 0.1,
  roughness: 0.2,
  emissive: "#9FD0FF",
  emissiveIntensity: 0.8,
});
