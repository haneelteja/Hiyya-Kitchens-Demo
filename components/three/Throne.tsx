"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { ThroneSkin } from "@/lib/theme/throneSkins";
import {
  blackVelvetMaterial,
  boneMaterial,
  boneShadowMaterial,
  bronzeMaterial,
  crestJewelMaterial,
  darkIronMaterial,
  darkStoneMaterial,
  deepGoldMaterial,
  deepPlatinumMaterial,
  emberOrbMaterial,
  goldMaterial,
  ironMaterial,
  patinaGoldMaterial,
  phoenixPlumageMaterial,
  platinumMaterial,
  starGlowMaterial,
} from "@/components/three/materials";

export interface ThroneProps {
  scale?: number;
  position?: [number, number, number];
  rotationY?: number;
  /** Tints the crest jewel — used to mark a specific branch in the orbit ring. */
  accentColor?: string;
  /** Which theme's stylized throne to build (lib/theme/throneSkins.ts). */
  skin?: ThroneSkin;
}

/** Per-skin material palette — the same base geometry below is reused for every
 * skin; only materials and the topper/back detail change per theme. */
function paletteFor(skin: ThroneSkin) {
  switch (skin) {
    case "dino":
      return {
        base: bronzeMaterial,
        accent: patinaGoldMaterial,
        cushion: blackVelvetMaterial as THREE.Material | null,
      };
    case "chrono_jail":
      return { base: darkStoneMaterial, accent: boneMaterial, cushion: null };
    case "jail":
      return {
        base: darkIronMaterial,
        accent: ironMaterial,
        cushion: blackVelvetMaterial,
      };
    case "space":
      return {
        base: deepPlatinumMaterial,
        accent: platinumMaterial,
        cushion: blackVelvetMaterial,
      };
    case "signature":
    default:
      return {
        base: goldMaterial,
        accent: deepGoldMaterial,
        cushion: blackVelvetMaterial,
      };
  }
}

/** The five-spike crown + crest jewel — the original brand-wide "signature" topper. */
function SignatureTopper({ jewelMaterial }: { jewelMaterial: THREE.Material }) {
  return (
    <>
      <mesh
        position={[0, 2.62, -0.58]}
        material={goldMaterial}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <torusGeometry args={[0.56, 0.06, 10, 28, Math.PI]} />
      </mesh>
      {Array.from({ length: 5 }, (_, i) => {
        const t = i / 4;
        const angle = Math.PI * (1 - t);
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
    </>
  );
}

/** Dino: a phoenix perched atop the back, wings fanned out, plus ember-orb feet
 * at the base — the gold/bronze throne with the perched bird from the reference. */
function DinoTopper() {
  const wingFeathers = Array.from({ length: 5 }, (_, i) => i);
  return (
    <>
      {/* Perched phoenix: body, head, tail, fanned wings */}
      <mesh position={[0, 2.85, -0.58]} material={bronzeMaterial} castShadow>
        <sphereGeometry args={[0.16, 12, 12]} />
      </mesh>
      <mesh position={[0, 3.02, -0.5]} material={patinaGoldMaterial} castShadow>
        <sphereGeometry args={[0.08, 10, 10]} />
      </mesh>
      <mesh
        position={[0, 2.78, -0.78]}
        material={phoenixPlumageMaterial}
        rotation={[0.5, 0, 0]}
        castShadow
      >
        <coneGeometry args={[0.09, 0.32, 8]} />
      </mesh>
      {[-1, 1].map((side) =>
        wingFeathers.map((i) => {
          const spread = (i / (wingFeathers.length - 1)) * 0.9 - 0.1;
          return (
            <mesh
              key={`${side}-${i}`}
              position={[side * (0.22 + i * 0.09), 2.85 + spread * 0.12, -0.58]}
              rotation={[0, 0, side * (0.3 + spread * 0.9)]}
              material={i > 2 ? phoenixPlumageMaterial : bronzeMaterial}
              castShadow
            >
              <boxGeometry args={[0.16, 0.03, 0.09]} />
            </mesh>
          );
        }),
      )}
      {/* Floral rosette medallions either side of the back */}
      {[-0.62, 0.62].map((x) => (
        <group key={x} position={[x, 1.85, -0.55]}>
          <mesh material={patinaGoldMaterial} castShadow>
            <sphereGeometry args={[0.1, 10, 10]} />
          </mesh>
          {Array.from({ length: 6 }, (_, i) => {
            const a = (i / 6) * Math.PI * 2;
            return (
              <mesh
                key={i}
                position={[Math.cos(a) * 0.14, Math.sin(a) * 0.14, 0]}
                material={bronzeMaterial}
                castShadow
              >
                <sphereGeometry args={[0.055, 8, 8]} />
              </mesh>
            );
          })}
        </group>
      ))}
    </>
  );
}

/** Chrono Jail: no crown — a splay of branching bone/antler spikes instead. */
function ChronoJailTopper() {
  const spikes = [-0.5, -0.3, -0.12, 0.05, 0.22, 0.42];
  return (
    <>
      {spikes.map((t, i) => {
        const angle = Math.PI / 2 + t * 1.4;
        const len = 0.5 + Math.abs(t) * 0.15;
        const x = Math.cos(angle) * 0.15;
        const y = 2.55 + Math.sin(angle) * 0.05 + i * 0.03;
        return (
          <group key={i} position={[x, y, -0.58]} rotation={[0, 0, -t * 1.1]}>
            <mesh material={boneMaterial} position={[0, len / 2, 0]} castShadow>
              <coneGeometry args={[0.045, len, 7]} />
            </mesh>
            {Math.abs(t) > 0.25 && (
              <mesh
                material={boneShadowMaterial}
                position={[0.06, len * 0.55, 0]}
                rotation={[0, 0, -0.6]}
                castShadow
              >
                <coneGeometry args={[0.03, len * 0.4, 6]} />
              </mesh>
            )}
          </group>
        );
      })}
    </>
  );
}

/** Jail: a flat iron lintel with a padlock silhouette instead of a crown. */
function JailTopper() {
  return (
    <>
      <mesh position={[0, 2.68, -0.58]} material={darkIronMaterial} castShadow>
        <boxGeometry args={[1.05, 0.09, 0.09]} />
      </mesh>
      <mesh position={[0, 2.5, -0.58]} material={ironMaterial} castShadow>
        <boxGeometry args={[0.16, 0.2, 0.08]} />
      </mesh>
      <mesh
        position={[0, 2.62, -0.58]}
        material={ironMaterial}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <torusGeometry args={[0.08, 0.02, 8, 16]} />
      </mesh>
    </>
  );
}

/** Space: a halo ring behind the back with glowing star points. */
function SpaceTopper() {
  return (
    <>
      <mesh
        position={[0, 2.75, -0.68]}
        material={platinumMaterial}
        rotation={[Math.PI / 2.4, 0, 0]}
        castShadow
      >
        <torusGeometry args={[0.62, 0.035, 10, 32]} />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.62, 2.75 + Math.sin(a) * 0.62 * 0.4, -0.68]}
            material={starGlowMaterial}
          >
            <sphereGeometry args={[0.03, 8, 8]} />
          </mesh>
        );
      })}
    </>
  );
}

/**
 * A procedurally-built throne from primitives, one of five stylized skins per
 * lib/theme/throneSkins.ts (Section 9). Shared structure — a two-step round
 * dais, four legs, a seat with apron and (usually) a cushion, a tall back, and
 * armrests with side pillars — with materials and a signature topper/base
 * accent swapped per skin. Each theme skin is a stylized abstraction of that
 * theme's real physical throne, not a literal recreation — see
 * lib/theme/throneSkins.ts for the mapping and reasoning.
 */
export function Throne({
  scale = 1,
  position = [0, 0, 0],
  rotationY = 0,
  accentColor,
  skin = "signature",
}: ThroneProps) {
  const { base, accent, cushion } = paletteFor(skin);

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
      <mesh position={[0, 0.05, 0]} material={base} castShadow receiveShadow>
        <cylinderGeometry args={[1.15, 1.25, 0.1, 24]} />
      </mesh>
      <mesh position={[0, 0.16, 0]} material={accent} castShadow receiveShadow>
        <cylinderGeometry args={[0.95, 1.05, 0.12, 24]} />
      </mesh>

      {/* Dino only: two ember-glow orbs sitting at the front of the dais,
          echoing the reference throne's base orbs */}
      {skin === "dino" &&
        [-0.65, 0.65].map((x) => (
          <mesh key={x} position={[x, 0.22, 0.75]} material={emberOrbMaterial} castShadow>
            <sphereGeometry args={[0.16, 16, 16]} />
          </mesh>
        ))}

      {/* Four legs with ball feet */}
      {[
        [-0.55, -0.55],
        [0.55, -0.55],
        [-0.55, 0.35],
        [0.55, 0.35],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0.22, z]}>
          <mesh material={base} castShadow>
            <cylinderGeometry
              args={skin === "chrono_jail" ? [0.06, 0.09, 0.5, 6] : [0.05, 0.07, 0.5, 10]}
            />
          </mesh>
          <mesh material={accent} position={[0, -0.26, 0]} castShadow>
            <sphereGeometry args={[0.06, 10, 10]} />
          </mesh>
        </group>
      ))}

      {/* Seat, apron, cushion (no cushion for Chrono Jail — bare bone/stone) */}
      <mesh position={[0, 0.5, -0.1]} material={base} castShadow>
        <boxGeometry args={[1.25, 0.08, 1.05]} />
      </mesh>
      <mesh position={[0, 0.44, 0.42]} material={accent} castShadow>
        <boxGeometry args={[1.25, 0.14, 0.06]} />
      </mesh>
      {cushion && (
        <mesh position={[0, 0.57, -0.1]} material={cushion} castShadow>
          <boxGeometry args={[1.05, 0.09, 0.85]} />
        </mesh>
      )}

      {/* Tall back panel */}
      <mesh position={[0, 1.55, -0.58]} material={base} castShadow>
        <boxGeometry args={[1.1, 2.1, 0.1]} />
      </mesh>

      {skin === "jail" ? (
        // Iron cell bars instead of a velvet inset
        Array.from({ length: 5 }, (_, i) => (
          <mesh
            key={i}
            position={[-0.32 + i * 0.16, 1.55, -0.52]}
            material={ironMaterial}
            castShadow
          >
            <cylinderGeometry args={[0.02, 0.02, 1.6, 8]} />
          </mesh>
        ))
      ) : (
        <>
          {cushion && (
            <mesh position={[0, 1.55, -0.53]} material={cushion}>
              <boxGeometry args={[0.82, 1.7, 0.03]} />
            </mesh>
          )}
          <mesh
            position={[0, 1.55, -0.51]}
            material={accent}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <torusGeometry args={[0.3, 0.045, 10, 28]} />
          </mesh>
        </>
      )}

      {/* Per-skin topper */}
      {skin === "dino" && <DinoTopper />}
      {skin === "chrono_jail" && <ChronoJailTopper />}
      {skin === "jail" && <JailTopper />}
      {skin === "space" && <SpaceTopper />}
      {skin === "signature" && <SignatureTopper jewelMaterial={jewelMaterial} />}

      {/* Armrests with scroll balls */}
      {[-0.62, 0.62].map((x) => (
        <group key={x}>
          <mesh
            position={[x, 0.72, 0.05]}
            material={base}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
          >
            <cylinderGeometry args={[0.05, 0.05, 0.9, 10]} />
          </mesh>
          <mesh position={[x, 0.72, 0.5]} material={accent} castShadow>
            <sphereGeometry args={[0.09, 10, 10]} />
          </mesh>
        </group>
      ))}

      {/* Side pillars with finials */}
      {[-0.62, 0.62].map((x) => (
        <group key={x}>
          <mesh position={[x, 1.7, -0.58]} material={base} castShadow>
            <cylinderGeometry args={[0.055, 0.07, 2.4, 10]} />
          </mesh>
          <mesh position={[x, 2.95, -0.58]} material={accent} castShadow>
            <coneGeometry args={[0.09, 0.24, 10]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
