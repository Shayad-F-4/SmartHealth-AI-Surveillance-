import React, { useState, useRef, useEffect, useMemo, Suspense, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';
import { Bot, Sparkles, X, MessageSquareHeart } from 'lucide-react';

export interface FloatingHealthRobotProps {
  state?: 'idle' | 'thinking' | 'speaking';
  onOpenAssistant?: () => void;
  onFocusChat?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const STORAGE_KEY = 'smarthealth-ai-robot-position';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Robot 3D Model Sub-component
// ─────────────────────────────────────────────────────────────────────────────
const RobotModel: React.FC<{
  aiState: 'idle' | 'thinking' | 'speaking';
  reducedMotion: boolean;
}> = ({ aiState, reducedMotion }) => {
  const { scene } = useGLTF('/models/health-assistant.glb');
  const groupRef = useRef<THREE.Group>(null);
  const platformRef = useRef<THREE.Group>(null);
  const screenMeshRef = useRef<THREE.Mesh | null>(null);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map((m) => m.clone());
          } else {
            mesh.material = mesh.material.clone();
            const mat = mesh.material as THREE.MeshStandardMaterial;
            if (mat.name === 'Material.001' || mat.name === 'Layar') {
              screenMeshRef.current = mesh;
            }
          }
        }
      }
    });
    return clone;
  }, [scene]);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    if (groupRef.current && !reducedMotion) {
      let bobFreq = 1.6;
      let bobAmp = 0.06;

      if (aiState === 'thinking') {
        bobFreq = 3.2;
        bobAmp = 0.09;
        groupRef.current.rotation.z = Math.sin(time * 2.2) * 0.05;
        groupRef.current.rotation.x = Math.sin(time * 1.8) * 0.03;
      } else if (aiState === 'speaking') {
        bobFreq = 2.4;
        bobAmp = 0.07;
        groupRef.current.rotation.x = Math.sin(time * 4.5) * 0.04;
        groupRef.current.rotation.z = 0;
      } else {
        groupRef.current.rotation.x = 0;
        groupRef.current.rotation.z = 0;
      }

      groupRef.current.position.y = Math.sin(time * bobFreq) * bobAmp;
    }

    if (platformRef.current && !reducedMotion) {
      platformRef.current.rotation.y += delta * 0.45;
    }

    if (screenMeshRef.current) {
      const mat = screenMeshRef.current.material as THREE.MeshStandardMaterial;
      if (mat && mat.emissive) {
        if (aiState === 'thinking') {
          mat.emissive.setHex(0x06b6d4);
          mat.emissiveIntensity = 1.0 + Math.sin(time * 6) * 0.5;
        } else if (aiState === 'speaking') {
          mat.emissive.setHex(0x10b981);
          mat.emissiveIntensity = 0.9 + Math.sin(time * 8) * 0.4;
        } else {
          mat.emissive.setHex(0x38bdf8);
          mat.emissiveIntensity = 0.7 + Math.sin(time * 2) * 0.2;
        }
      }
    }
  });

  return (
    <group>
      <group ref={groupRef}>
        <Center>
          <primitive object={clonedScene} scale={0.78} />
        </Center>
      </group>

      <group ref={platformRef} position={[0, -1.18, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.95, 32]} />
          <meshBasicMaterial
            color={aiState === 'thinking' ? '#f59e0b' : aiState === 'speaking' ? '#10b981' : '#0284c7'}
            transparent
            opacity={0.18}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.82, 0.96, 48]} />
          <meshBasicMaterial
            color={aiState === 'thinking' ? '#f59e0b' : aiState === 'speaking' ? '#34d399' : '#38bdf8'}
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      <pointLight
        position={[0, -0.9, 0]}
        intensity={aiState === 'thinking' ? 2.5 : aiState === 'speaking' ? 2.0 : 1.4}
        color={aiState === 'thinking' ? '#fbbf24' : aiState === 'speaking' ? '#34d399' : '#38bdf8'}
        distance={2.8}
      />
    </group>
  );
};

useGLTF.preload('/models/health-assistant.glb');

const checkWebGLAvailability = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. Main Floating SmartHealth AI Robot Component
// ─────────────────────────────────────────────────────────────────────────────
export const FloatingHealthRobot: React.FC<FloatingHealthRobotProps> = ({
  state = 'idle',
  onOpenAssistant,
  onFocusChat,
  className = '',
  style = {},
}) => {
  const [webglSupported, setWebglSupported] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipTextIndex, setTooltipTextIndex] = useState(0);

  // Widget dimensions (Compact & 25% smaller default footprint)
  const WIDGET_WIDTH = 75;
  const WIDGET_HEIGHT = 88;
  const VISIBLE_PEEK_PX = 22; // ~20-25% visible body/face when peeking

  // Position & Edge Peeking State
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    if (typeof window === 'undefined') return { x: 100, y: 100 };
    return {
      x: window.innerWidth - WIDGET_WIDTH - 16,
      y: window.innerHeight - WIDGET_HEIGHT - (window.innerWidth < 900 ? 84 : 32),
    };
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isPeekingEdge, setIsPeekingEdge] = useState<'right' | 'left' | 'top' | 'bottom' | null>(null);

  const dragStartRef = useRef<{ pointerX: number; pointerY: number; posX: number; posY: number }>({
    pointerX: 0,
    pointerY: 0,
    posX: 0,
    posY: 0,
  });
  const isPointerDownRef = useRef(false);
  const isDragActiveRef = useRef(false);

  const tooltipOptions = [
    'Ask SmartHealth AI 💬',
    'Need health help? 🩺',
    'AI Health Guide 🤖',
  ];

  useEffect(() => {
    setWebglSupported(checkWebGLAvailability());

    const interval = setInterval(() => {
      setShowTooltip((prev) => {
        if (!prev) setTooltipTextIndex((idx) => (idx + 1) % tooltipOptions.length);
        return !prev;
      });
    }, 9000);

    return () => clearInterval(interval);
  }, []);

  // Screen Edge Snap / Peeking helper supporting Left, Right, Top, Bottom
  const calculateDockedPosition = (x: number, y: number) => {
    if (typeof window === 'undefined') return { clampedX: x, clampedY: y, peeking: null };

    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    let peeking: 'right' | 'left' | 'top' | 'bottom' | null = null;
    let clampedX = x;
    let clampedY = y;

    const edgeThreshold = 32;

    if (x > screenW - WIDGET_WIDTH - edgeThreshold) {
      // Right Edge Peek
      peeking = 'right';
      clampedX = screenW - VISIBLE_PEEK_PX;
      clampedY = Math.min(Math.max(y, 16), screenH - WIDGET_HEIGHT - 16);
    } else if (x < edgeThreshold) {
      // Left Edge Peek
      peeking = 'left';
      clampedX = -WIDGET_WIDTH + VISIBLE_PEEK_PX;
      clampedY = Math.min(Math.max(y, 16), screenH - WIDGET_HEIGHT - 16);
    } else if (y < edgeThreshold) {
      // Top Edge Peek
      peeking = 'top';
      clampedY = -WIDGET_HEIGHT + VISIBLE_PEEK_PX;
      clampedX = Math.min(Math.max(x, 16), screenW - WIDGET_WIDTH - 16);
    } else if (y > screenH - WIDGET_HEIGHT - edgeThreshold) {
      // Bottom Edge Peek
      peeking = 'bottom';
      clampedY = screenH - VISIBLE_PEEK_PX;
      clampedX = Math.min(Math.max(x, 16), screenW - WIDGET_WIDTH - 16);
    } else {
      // Free floating
      clampedX = Math.min(Math.max(x, 16), screenW - WIDGET_WIDTH - 16);
      clampedY = Math.min(Math.max(y, 16), screenH - WIDGET_HEIGHT - 16);
    }

    return { clampedX, clampedY, peeking };
  };

  // Pointer Drag Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    isPointerDownRef.current = true;
    isDragActiveRef.current = false;
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      posX: position.x,
      posY: position.y,
    };

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;

    const dx = e.clientX - dragStartRef.current.pointerX;
    const dy = e.clientY - dragStartRef.current.pointerY;
    const distance = Math.hypot(dx, dy);

    if (!isDragActiveRef.current && distance > 5) {
      isDragActiveRef.current = true;
      setIsDragging(true);
      setShowTooltip(false);
    }

    if (isDragActiveRef.current) {
      const newX = dragStartRef.current.posX + dx;
      const newY = dragStartRef.current.posY + dy;
      setPosition({ x: newX, y: newY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (isDragActiveRef.current) {
      setIsDragging(false);
      isDragActiveRef.current = false;

      // Calculate 4-edge docking
      const { clampedX, clampedY, peeking } = calculateDockedPosition(position.x, position.y);
      setPosition({ x: clampedX, y: clampedY });
      setIsPeekingEdge(peeking);
      return;
    }

    // Handle Tap / Click Action
    handleRobotTap();
  };

  const handleRobotTap = () => {
    // If currently peeking at an edge, tap smoothly un-peeks it back onto screen
    if (isPeekingEdge) {
      const screenW = typeof window !== 'undefined' ? window.innerWidth : 1000;
      const screenH = typeof window !== 'undefined' ? window.innerHeight : 800;

      setPosition((prev) => {
        let newX = prev.x;
        let newY = prev.y;
        if (isPeekingEdge === 'right') newX = screenW - WIDGET_WIDTH - 20;
        else if (isPeekingEdge === 'left') newX = 20;
        else if (isPeekingEdge === 'top') newY = 20;
        else if (isPeekingEdge === 'bottom') newY = screenH - WIDGET_HEIGHT - 80;
        return { x: newX, y: newY };
      });
      setIsPeekingEdge(null);
      return;
    }

    // Otherwise open AI Assistant panel
    if (onOpenAssistant) {
      onOpenAssistant();
    } else if (onFocusChat) {
      onFocusChat();
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={`floating-health-robot-wrapper ${className}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${WIDGET_WIDTH}px`,
        height: `${WIDGET_HEIGHT}px`,
        zIndex: 9990,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'none',
        userSelect: 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: isDragging ? 'none' : 'all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.15)',
        opacity: isPeekingEdge ? 0.9 : 1,
        filter: isPeekingEdge ? 'brightness(0.95)' : 'none',
        ...style,
      }}
    >
      {/* ── Dynamic Tooltip Popup (Hidden when dragging or peeking) ──────── */}
      {!isPeekingEdge && showTooltip && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            marginBottom: '4px',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#f8fafc',
            padding: '0.3rem 0.6rem',
            borderRadius: '10px',
            fontSize: '0.68rem',
            fontWeight: 700,
            boxShadow: '0 6px 16px rgba(15, 23, 42, 0.25)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            animation: 'robotTooltipFade 0.3s ease',
          }}
        >
          <Sparkles size={11} color="#38bdf8" style={{ display: 'inline', marginRight: '3px' }} />
          <span>{tooltipOptions[tooltipTextIndex]}</span>
        </div>
      )}

      {/* ── Compact 3D Robot Container ──────────────────────────────────── */}
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          animation: isPeekingEdge
            ? isPeekingEdge === 'right'
              ? 'robotLeanRight 2.5s ease-in-out infinite'
              : isPeekingEdge === 'left'
              ? 'robotLeanLeft 2.5s ease-in-out infinite'
              : isPeekingEdge === 'top'
              ? 'robotLeanTop 2.5s ease-in-out infinite'
              : 'robotLeanBottom 2.5s ease-in-out infinite'
            : 'robotGentleFloat 4s ease-in-out infinite',
        }}
      >
        {/* Glow halo background */}
        <div
          style={{
            position: 'absolute',
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.35) 0%, rgba(2, 132, 199, 0) 75%)',
            animation: 'robotGlowPulse 2.5s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />

        {/* 3D Model Canvas (Zoomed out & compact) */}
        <div
          style={{
            width: '75px',
            height: '75px',
            position: 'relative',
            zIndex: 2,
            background: 'transparent',
          }}
        >
          {webglSupported ? (
            <Suspense fallback={<Bot size={32} color="#0284c7" />}>
              <Canvas
                camera={{ position: [0, 0.3, 4.2], fov: 40 }}
                gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
                style={{ width: '100%', height: '100%', background: 'transparent' }}
              >
                <ambientLight intensity={1.2} color="#f0f9ff" />
                <directionalLight position={[2.5, 3.5, 3]} intensity={1.4} color="#ffffff" />
                <directionalLight position={[-2.5, 1.5, -2.5]} intensity={0.9} color="#38bdf8" />

                <RobotModel aiState={state} reducedMotion={false} />

                <OrbitControls
                  enableRotate={true}
                  enableZoom={true}
                  enablePan={false}
                  enableDamping={true}
                  dampingFactor={0.08}
                  autoRotate={true}
                  autoRotateSpeed={1.8}
                  minDistance={2.2}
                  maxDistance={5.5}
                />
              </Canvas>
            </Suspense>
          ) : (
            <Bot size={32} color="#0284c7" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }} />
          )}
        </div>

        {/* Small Name Pill Badge (Hidden when peeking at edge) */}
        {!isPeekingEdge && (
          <div
            style={{
              position: 'relative',
              zIndex: 3,
              marginTop: '-6px',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              padding: '0.12rem 0.45rem',
              borderRadius: '999px',
              fontSize: '0.62rem',
              fontWeight: 800,
              letterSpacing: '0.02em',
              boxShadow: '0 4px 10px rgba(15, 23, 42, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 4px #10b981' }} />
            <span>HealRobo AI</span>
          </div>
        )}
      </div>

      {/* ── Keyframe Animations for Floating & Peeking ──────────────────── */}
      <style>{`
        @keyframes robotGentleFloat {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-5px) rotate(1deg);
          }
        }
        @keyframes robotGlowPulse {
          0%, 100% {
            opacity: 0.4;
            transform: scale(0.95);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.05);
          }
        }
        @keyframes robotLeanRight {
          0%, 100% {
            transform: rotate(-14deg) translateX(3px);
          }
          50% {
            transform: rotate(-8deg) translateX(-1px);
          }
        }
        @keyframes robotLeanLeft {
          0%, 100% {
            transform: rotate(14deg) translateX(-3px);
          }
          50% {
            transform: rotate(8deg) translateX(1px);
          }
        }
        @keyframes robotLeanTop {
          0%, 100% {
            transform: rotate(0deg) translateY(3px);
          }
          50% {
            transform: rotate(0deg) translateY(-1px);
          }
        }
        @keyframes robotLeanBottom {
          0%, 100% {
            transform: rotate(0deg) translateY(-3px);
          }
          50% {
            transform: rotate(0deg) translateY(1px);
          }
        }
        @keyframes robotTooltipFade {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>,
    document.body
  );
};

export default FloatingHealthRobot;

