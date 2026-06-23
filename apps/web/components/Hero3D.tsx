'use client';

// هسته‌ی سه‌بعدیِ سبکِ hero — یک ایکوزاهدرونِ درخشانِ شناور + پوسته‌ی wireframe + ذرات.
// lazy-load می‌شود (next/dynamic, ssr:false) و فقط روی دسکتاپِ بدونِ reduced-motion رندر می‌شود.

import { Canvas } from '@react-three/fiber';
import { Float, Icosahedron, MeshDistortMaterial, Sparkles } from '@react-three/drei';

function Core() {
  return (
    <Float speed={1.3} rotationIntensity={0.6} floatIntensity={0.8}>
      {/* هسته‌ی شیشه‌ای/درخشان */}
      <Icosahedron args={[1.45, 5]}>
        <MeshDistortMaterial
          color="#0b3a35"
          emissive="#2dd4bf"
          emissiveIntensity={0.55}
          roughness={0.2}
          metalness={0.5}
          distort={0.32}
          speed={1.5}
          transparent
          opacity={0.92}
        />
      </Icosahedron>
      {/* پوسته‌ی wireframe — حسِ آرنا/انرژی */}
      <Icosahedron args={[1.82, 2]}>
        <meshBasicMaterial color="#2dd4bf" wireframe transparent opacity={0.16} />
      </Icosahedron>
    </Float>
  );
}

export default function Hero3D() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 6], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ background: 'transparent' }}
      frameloop="always"
    >
      <ambientLight intensity={0.55} />
      <pointLight position={[4, 3, 5]} intensity={32} color="#2dd4bf" />
      <pointLight position={[-5, -2, 3]} intensity={12} color="#fbbf24" />
      <Core />
      <Sparkles count={64} scale={[9, 7, 4]} size={2.1} speed={0.35} color="#7fe7da" opacity={0.7} />
    </Canvas>
  );
}
