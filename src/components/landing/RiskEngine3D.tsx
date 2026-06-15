import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

/* ------------------------------------------------------------------
   RiskEngine3D — forensic "contract X-ray" hero.
   A stack of document pages floats in space while a hazard-red
   scan-line sweeps vertically. Clause markers flare red / amber as
   the beam crosses them. A drifting particle field reacts to cursor.
   Falls back to a static styled mock when WebGL is unavailable or
   the user prefers reduced motion.
------------------------------------------------------------------- */

const HAZARD = '#FF3B30';
const AMBER = '#F5A524';

type Marker = {
  pos: [number, number, number];
  type: 'critical' | 'warning';
  w: number;
};

// Deterministic clause markers placed on the front page.
const MARKERS: Marker[] = [
  { pos: [-0.55, 1.05, 0.02], type: 'critical', w: 0.9 },
  { pos: [0.35, 0.42, 0.02], type: 'warning', w: 1.3 },
  { pos: [-0.2, -0.3, 0.02], type: 'critical', w: 0.7 },
  { pos: [0.5, -1.05, 0.02], type: 'warning', w: 1.0 },
  { pos: [-0.65, -1.55, 0.02], type: 'critical', w: 1.1 },
];

// One page: dark plane with thin emissive "text" bars.
function Page({ z, idx }: { z: number; idx: number }) {
  const bars = useMemo(() => {
    const rows: { y: number; w: number; x: number }[] = [];
    for (let i = 0; i < 11; i++) {
      const y = 1.7 - i * 0.32;
      // pseudo-random but deterministic per page/row
      const seed = Math.sin((idx + 1) * 12.9 + i * 78.2) * 43758.5;
      const r = seed - Math.floor(seed);
      rows.push({ y, w: 0.9 + r * 1.4, x: -1.0 + (r * 0.4) });
    }
    return rows;
  }, [idx]);

  return (
    <group position={[0, 0, z]}>
      {/* page body */}
      <mesh>
        <planeGeometry args={[2.8, 3.9]} />
        <meshStandardMaterial
          color={idx === 0 ? '#14141a' : '#0e0e13'}
          roughness={0.85}
          metalness={0.1}
          transparent
          opacity={idx === 0 ? 0.98 : 0.5 - idx * 0.08}
        />
      </mesh>
      {/* hairline border */}
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(2.8, 3.9)]} />
        <lineBasicMaterial color={idx === 0 ? '#2a2a33' : '#1b1b22'} transparent opacity={0.7} />
      </lineSegments>
      {/* text bars only on first two pages for perf */}
      {idx < 2 &&
        bars.map((b, i) => (
          <mesh key={i} position={[b.x + b.w / 2, b.y, 0.01]}>
            <planeGeometry args={[b.w, 0.05]} />
            <meshBasicMaterial color="#3a3a44" transparent opacity={idx === 0 ? 0.55 : 0.25} />
          </mesh>
        ))}
    </group>
  );
}

function ClauseMarker({ marker, scanY }: { marker: Marker; scanY: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const base = marker.type === 'critical' ? HAZARD : AMBER;

  useFrame(() => {
    if (!matRef.current || !ref.current) return;
    const dist = Math.abs(scanY - marker.pos[1]);
    const flare = THREE.MathUtils.clamp(1 - dist / 0.5, 0, 1);
    const intensity = 0.18 + flare * 0.82;
    matRef.current.opacity = intensity;
    const s = 1 + flare * 0.6;
    ref.current.scale.set(s, s, s);
  });

  return (
    <group position={marker.pos}>
      <mesh ref={ref} renderOrder={996}>
        <planeGeometry args={[marker.w, 0.14]} />
        <meshBasicMaterial
          ref={matRef}
          color={base}
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
      {/* tick dot */}
      <mesh position={[-marker.w / 2 - 0.12, 0, 0]} renderOrder={997}>
        <circleGeometry args={[0.05, 16]} />
        <meshBasicMaterial color={base} transparent opacity={0.9} depthTest={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

function ScanBeam({ onY }: { onY: (y: number) => void }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // sweep -2.2 .. 2.2, period ~4s
    const y = Math.sin(t * 0.8) * 2.1;
    if (ref.current) ref.current.position.y = y;
    onY(y);
  });
  return (
    <group ref={ref} position={[0, 0, 0.5]}>
      {/* core line — always drawn on top of the pages */}
      <mesh renderOrder={999}>
        <planeGeometry args={[3.4, 0.04]} />
        <meshBasicMaterial
          color={HAZARD}
          transparent
          opacity={0.95}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
      {/* soft glow */}
      <mesh renderOrder={998}>
        <planeGeometry args={[3.4, 0.5]} />
        <meshBasicMaterial
          color={HAZARD}
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function Particles() {
  const ref = useRef<THREE.Points>(null);
  const count = 420;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const seed = Math.sin(i * 91.3) * 43758.5;
      const r1 = seed - Math.floor(seed);
      const r2 = (Math.sin(i * 12.1) * 9999) % 1;
      const r3 = (Math.cos(i * 4.7) * 9999) % 1;
      arr[i * 3] = (r1 - 0.5) * 11;
      arr[i * 3 + 1] = (r2 - 0.5) * 8;
      arr[i * 3 + 2] = (r3 - 0.5) * 6 - 1.5;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.02;
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.022}
        color="#5a5a66"
        transparent
        opacity={0.7}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function DocumentRig() {
  const group = useRef<THREE.Group>(null);
  const { pointer } = useThree();
  const [scanY, setScanY] = useState(0);

  useFrame(() => {
    if (!group.current) return;
    // parallax toward cursor
    const targetY = pointer.x * 0.35;
    const targetX = -pointer.y * 0.22;
    group.current.rotation.y += (targetY - group.current.rotation.y) * 0.05;
    group.current.rotation.x += (targetX - group.current.rotation.x) * 0.05;
  });

  return (
    <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.4}>
      <group ref={group} rotation={[0.05, -0.35, 0.02]}>
        {[0, -0.22, -0.44, -0.66, -0.88].map((z, i) => (
          <Page key={i} z={z} idx={i} />
        ))}
        {MARKERS.map((m, i) => (
          <ClauseMarker key={i} marker={m} scanY={scanY} />
        ))}
        <ScanBeam onY={setScanY} />
      </group>
    </Float>
  );
}

function StaticFallback() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg forensic-panel">
      <div className="absolute inset-0 forensic-grid opacity-40" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative h-[78%] w-[58%] max-w-xs border border-forensic-line bg-forensic-graphite/80 p-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="mb-2 h-1 rounded bg-white/10"
              style={{ width: `${50 + ((i * 37) % 45)}%` }}
            />
          ))}
          <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[#FF3B30] shadow-[0_0_10px_2px_rgba(255,59,48,0.6)]" />
          <span className="absolute left-3 top-1/3 h-1.5 w-12 bg-[#FF3B30]/70" />
          <span className="absolute left-3 top-2/3 h-1.5 w-16 bg-[#F5A524]/70" />
        </div>
      </div>
      <div className="scan-hairline top-1/2" />
    </div>
  );
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

export const RiskEngine3D: React.FC = () => {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setOk(supportsWebGL() && !reduced);
  }, []);

  if (ok === null) return <div className="h-full w-full" />;
  if (!ok) return <StaticFallback />;

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 6], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 5]} intensity={0.8} />
      <pointLight position={[-3, -2, 3]} intensity={0.5} color={HAZARD} />
      <DocumentRig />
      <Particles />
      <fog attach="fog" args={['#08080A', 6, 13]} />
    </Canvas>
  );
};

export default RiskEngine3D;
