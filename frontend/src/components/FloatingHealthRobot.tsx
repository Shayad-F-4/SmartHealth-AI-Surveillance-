import React, { useState, useRef, useEffect, useMemo, Suspense, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';

export interface FloatingHealthRobotProps {
  state?: 'idle' | 'thinking' | 'speaking';
  onFocusChat?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const STORAGE_KEY = 'smarthealth-ai-robot-position';
const WIDGET_WIDTH = 180;
const WIDGET_HEIGHT = 210;
const MARGIN = 16;
const DRAG_THRESHOLD = 7; // pixels for drag vs click

// ─────────────────────────────────────────────────────────────────────────────
// 1. Robot Model Sub-component
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

      {/* Holographic Floating Platform Underneath */}
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

        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.05, 1.12, 32]} />
          <meshBasicMaterial color="#0ea5e9" transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>

        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 0.35, 24]} />
          <meshBasicMaterial color="#7dd3fc" transparent opacity={0.8} side={THREE.DoubleSide} />
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

// ─────────────────────────────────────────────────────────────────────────────
// 2. WebGL & Position Helpers
// ─────────────────────────────────────────────────────────────────────────────
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

const clampToViewport = (
  x: number,
  y: number,
  width: number = WIDGET_WIDTH,
  height: number = WIDGET_HEIGHT
): { x: number; y: number } => {
  if (typeof window === 'undefined') return { x, y };
  const minX = MARGIN;
  const maxX = Math.max(MARGIN, window.innerWidth - width - MARGIN);
  const minY = MARGIN;
  const maxY = Math.max(MARGIN, window.innerHeight - height - MARGIN);

  return {
    x: Math.min(Math.max(x, minX), maxX),
    y: Math.min(Math.max(y, minY), maxY),
  };
};

const getDefaultPosition = (): { x: number; y: number } => {
  if (typeof window === 'undefined') return { x: 100, y: 100 };
  return clampToViewport(
    window.innerWidth - WIDGET_WIDTH - 24,
    window.innerHeight - WIDGET_HEIGHT - 24
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. Main Clean Floating HealRobo Component
// ─────────────────────────────────────────────────────────────────────────────
export const FloatingHealthRobot: React.FC<FloatingHealthRobotProps> = ({
  state = 'idle',
  onFocusChat,
  className = '',
  style = {},
}) => {
  const [position, setPosition] = useState<{ x: number; y: number }>(getDefaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isInteracting3D, setIsInteracting3D] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [isClosingAnim, setIsClosingAnim] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  const widgetRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ pointerX: number; pointerY: number; posX: number; posY: number }>({
    pointerX: 0,
    pointerY: 0,
    posX: 0,
    posY: 0,
  });
  const isPointerDownRef = useRef(false);
  const isDragActiveRef = useRef(false);
  const lastClickTimeRef = useRef<number>(0);
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateDomPosition = useCallback((x: number, y: number) => {
    if (widgetRef.current) {
      widgetRef.current.style.left = `${x}px`;
      widgetRef.current.style.top = `${y}px`;
    }
  }, []);

  useEffect(() => {
    setWebglSupported(checkWebGLAvailability());

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const motionListener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', motionListener);

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          setPosition(clampToViewport(parsed.x, parsed.y));
        } else {
          setPosition(getDefaultPosition());
        }
      } else {
        setPosition(getDefaultPosition());
      }
    } catch {
      setPosition(getDefaultPosition());
    }

    const handleResize = () => {
      setPosition((prev) => {
        const clamped = clampToViewport(prev.x, prev.y);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(clamped));
        } catch {
          // ignore
        }
        return clamped;
      });
    };

    const handleExternalReset = () => {
      const def = getDefaultPosition();
      setPosition(def);
      updateDomPosition(def.x, def.y);
      setIsClosed(false);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(def));
      } catch {
        // ignore
      }
    };

    const handleExternalOpen = () => {
      setIsClosed(false);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('smarthealth-reset-robot', handleExternalReset);
    window.addEventListener('smarthealth-open-robot', handleExternalOpen);

    return () => {
      mq.removeEventListener('change', motionListener);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('smarthealth-reset-robot', handleExternalReset);
      window.removeEventListener('smarthealth-open-robot', handleExternalOpen);
    };
  }, [updateDomPosition]);

  // Pointer drag logic
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

    if (!isDragActiveRef.current && distance > DRAG_THRESHOLD) {
      isDragActiveRef.current = true;
      setIsDragging(true);
    }

    if (isDragActiveRef.current) {
      e.preventDefault();
      const newX = dragStartRef.current.posX + dx;
      const newY = dragStartRef.current.posY + dy;
      const clamped = clampToViewport(newX, newY);
      updateDomPosition(clamped.x, clamped.y);
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
      const dx = e.clientX - dragStartRef.current.pointerX;
      const dy = e.clientY - dragStartRef.current.pointerY;
      const clamped = clampToViewport(
        dragStartRef.current.posX + dx,
        dragStartRef.current.posY + dy
      );

      setPosition(clamped);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(clamped));
      } catch {
        // ignore
      }

      setIsDragging(false);
      isDragActiveRef.current = false;
      return;
    }

    // Handle single click vs double click
    handleWidgetClick();
  };

  const handlePointerCancel = () => {
    isPointerDownRef.current = false;
    if (isDragActiveRef.current) {
      setIsDragging(false);
      isDragActiveRef.current = false;
      updateDomPosition(position.x, position.y);
    }
  };

  const handleWidgetClick = () => {
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTimeRef.current;

    if (timeSinceLastClick < 320 && timeSinceLastClick > 0) {
      // Double click -> minimize
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      lastClickTimeRef.current = 0;
      handleCloseWidget();
    } else {
      // Single click -> focus chat
      lastClickTimeRef.current = now;
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
      clickTimeoutRef.current = setTimeout(() => {
        if (onFocusChat) {
          onFocusChat();
        }
        clickTimeoutRef.current = null;
      }, 260);
    }
  };

  const handleCloseWidget = () => {
    setIsClosingAnim(true);
    setTimeout(() => {
      setIsClosed(true);
      setIsClosingAnim(false);
    }, 220);
  };

  const handleReopenWidget = () => {
    setIsClosed(false);
    setIsClosingAnim(false);
    if (onFocusChat) {
      onFocusChat();
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      {/* ── 1. Re-open Pill (When Closed/Minimized) ────────────────────── */}
      {isClosed && (
        <button
          onClick={handleReopenWidget}
          title="HealRobo (Click to restore)"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 0.9rem',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            color: '#0369a1',
            borderRadius: '999px',
            border: '1px solid #bae6fd',
            boxShadow: '0 8px 20px rgba(2, 132, 199, 0.18)',
            cursor: 'pointer',
            fontSize: '0.82rem',
            fontWeight: 800,
            letterSpacing: '0.02em',
            animation: reducedMotion ? 'none' : 'healRoboFadeIn 0.25s ease',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.borderColor = '#38bdf8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.borderColor = '#bae6fd';
          }}
        >
          <span>🤖 HealRobo</span>
        </button>
      )}

      {/* ── 2. Clean Draggable 3D HealRobo Floating Assistant ───────────── */}
      {!isClosed && (
        <div
          ref={widgetRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          className={`healrobo-floating-wrapper ${className}`}
          style={{
            position: 'fixed',
            left: `${position.x}px`,
            top: `${position.y}px`,
            width: `${WIDGET_WIDTH}px`,
            height: `${WIDGET_HEIGHT}px`,
            zIndex: 9998,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none',
            touchAction: 'none',
            background: 'transparent', // 100% transparent container
            border: 'none',
            boxShadow: 'none',
            cursor: isDragging ? 'grabbing' : 'grab',
            transform: isDragging ? 'scale(1.04)' : 'scale(1)',
            filter: isDragging
              ? 'drop-shadow(0 14px 28px rgba(14, 165, 233, 0.35))'
              : 'drop-shadow(0 6px 16px rgba(2, 132, 199, 0.15))',
            transition: isDragging
              ? 'none'
              : isClosingAnim
              ? 'opacity 0.2s ease, transform 0.2s ease'
              : 'transform 0.2s ease, filter 0.2s ease',
            opacity: isClosingAnim ? 0 : 1,
            animation: isClosingAnim
              ? 'healRoboFadeOut 0.2s ease forwards'
              : reducedMotion
              ? 'none'
              : 'healRoboFadeIn 0.25s ease',
            ...style,
          }}
        >
          {/* ── Minimalist Clean Name Tag ──────────────────────────────── */}
          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '0.03em',
              marginBottom: '0.15rem',
              textShadow: '0 1px 4px rgba(255, 255, 255, 0.9)',
              pointerEvents: 'none',
            }}
          >
            HealRobo
          </div>

          {/* ── 3D Robot Transparent Canvas ────────────────────────────── */}
          <div
            style={{
              width: '100%',
              height: '180px',
              position: 'relative',
              background: 'transparent',
            }}
          >
            {webglSupported ? (
              <Suspense fallback={null}>
                <Canvas
                  camera={{ position: [0, 0.3, 3.8], fov: 42 }}
                  gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'transparent',
                    cursor: isInteracting3D ? 'grabbing' : 'grab',
                  }}
                >
                  <ambientLight intensity={0.85} color="#f0f9ff" />
                  <directionalLight position={[2.5, 3.5, 3]} intensity={1.3} color="#ffffff" />
                  <directionalLight position={[-2.5, 1.5, -2.5]} intensity={0.9} color="#38bdf8" />

                  <RobotModel aiState={state} reducedMotion={reducedMotion} />

                  <OrbitControls
                    enableRotate={true}
                    enableZoom={true}
                    enablePan={false}
                    enableDamping={true}
                    dampingFactor={0.05}
                    minDistance={2.4}
                    maxDistance={5.8}
                    autoRotate={!reducedMotion && !isInteracting3D}
                    autoRotateSpeed={state === 'thinking' ? 3.0 : 1.4}
                    onStart={() => setIsInteracting3D(true)}
                    onEnd={() => setIsInteracting3D(false)}
                  />
                </Canvas>
              </Suspense>
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                }}
              >
                🤖
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Clean Animations & Mobile Responsive Styles ───────────────── */}
      <style>{`
        @keyframes healRoboFadeIn {
          from {
            opacity: 0;
            transform: scale(0.88);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes healRoboFadeOut {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(0.88);
          }
        }
        @media (max-width: 768px) {
          .healrobo-floating-wrapper {
            width: 140px !important;
            height: 160px !important;
          }
          .healrobo-floating-wrapper > div:last-child {
            height: 135px !important;
          }
        }
      `}</style>
    </>,
    document.body
  );
};

export default FloatingHealthRobot;
