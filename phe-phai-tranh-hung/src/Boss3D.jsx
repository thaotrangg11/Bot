import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Box, Cone } from '@react-three/drei';

function Demon({ isHit }) {
  const group = useRef();
  const [hovered, setHover] = useState(false);

  useFrame((state, delta) => {
    // Xoay Boss liên tục
    group.current.rotation.y += delta * 0.5;
    // Nhấp nhô lên xuống (Thở)
    group.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    
    // Rung lắc khi bị đánh
    if (isHit) {
      group.current.position.x = (Math.random() - 0.5) * 0.4;
      group.current.position.z = (Math.random() - 0.5) * 0.4;
    } else {
      group.current.position.x = 0;
      group.current.position.z = 0;
    }
  });

  return (
    <group ref={group} position={[0, -0.5, 0]}>
      {/* Thân */}
      <Box args={[1.5, 2, 1]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#7f1d1d" roughness={0.7} />
      </Box>
      {/* Đầu */}
      <Sphere args={[0.8, 32, 32]} position={[0, 1.4, 0]}>
        <meshStandardMaterial color="#450a0a" roughness={0.5} />
      </Sphere>
      {/* Mắt trái */}
      <Sphere args={[0.15, 16, 16]} position={[-0.3, 1.5, 0.7]}>
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={3} />
      </Sphere>
      {/* Mắt phải */}
      <Sphere args={[0.15, 16, 16]} position={[0.3, 1.5, 0.7]}>
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={3} />
      </Sphere>
      {/* Sừng trái */}
      <Cone args={[0.2, 1, 16]} position={[-0.5, 2.2, 0]} rotation={[0, 0, Math.PI / 6]}>
        <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} />
      </Cone>
      {/* Sừng phải */}
      <Cone args={[0.2, 1, 16]} position={[0.5, 2.2, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} />
      </Cone>
    </group>
  );
}

export default function Boss3D({ isHit }) {
  return (
    <div style={{ width: '100%', height: '350px', position: 'absolute', top: '15%', left: 0, zIndex: 10, pointerEvents: 'none' }}>
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={2} color="#ff4444" />
        <pointLight position={[-5, -5, 5]} intensity={1} color="#4444ff" />
        <Demon isHit={isHit} />
      </Canvas>
    </div>
  );
}
