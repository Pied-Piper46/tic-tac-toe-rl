import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';

// モバイルデバイス検出関数
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform));
}

function generateStarPositions(count, radius) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = Math.random() * radius;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  return positions;
}

function Stars(props) {
  const ref = useRef();
  const [sphere] = useMemo(() => [generateStarPositions(3000, 1.5)], []); // モバイル用に星の数を減らす

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color="#ffa0e0"
          size={0.005}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
}

// CSS背景のフォールバック
function CSSSpaceBackground() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: -1,
      background: `
        radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%),
        radial-gradient(2px 2px at 20px 30px, #00d4ff, transparent),
        radial-gradient(2px 2px at 40px 70px, #ff006e, transparent),
        radial-gradient(1px 1px at 90px 40px, #8338ec, transparent),
        radial-gradient(1px 1px at 130px 80px, #ffbe0b, transparent),
        radial-gradient(2px 2px at 160px 30px, #3a86ff, transparent)
      `,
      backgroundSize: '100% 100%, 200px 100px, 200px 100px, 200px 100px, 200px 100px, 200px 100px',
      backgroundRepeat: 'no-repeat, repeat, repeat, repeat, repeat, repeat',
      animation: 'sparkle 20s linear infinite'
    }} />
  );
}

function SpaceBackground() {
  const [isMobile, setIsMobile] = useState(false);
  const [webGLSupported, setWebGLSupported] = useState(true);

  useEffect(() => {
    // モバイルデバイス検出
    setIsMobile(isMobileDevice());

    // WebGLサポート検出
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setWebGLSupported(!!gl);
    } catch (e) {
      setWebGLSupported(false);
    }
  }, []);

  // モバイルまたはWebGL非サポートの場合はCSS背景を使用
  if (isMobile || !webGLSupported) {
    return <CSSSpaceBackground />;
  }

  // デスクトップでWebGLサポートありの場合はThree.js背景を使用
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%', 
      zIndex: -1 
    }}>
      <Canvas 
        camera={{ position: [0, 0, 1] }}
        gl={{ 
          antialias: false, // モバイル性能向上のため
          alpha: true,
          powerPreference: "high-performance"
        }}
        onCreated={({ gl }) => {
          gl.setClearColor('#090a0f', 1);
        }}
      >
        <Stars />
      </Canvas>
    </div>
  );
}

export default SpaceBackground;
