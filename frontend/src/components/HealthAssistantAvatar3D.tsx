import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface HealthAssistantAvatar3DProps {
  state?: 'idle' | 'thinking' | 'speaking';
  size?: number;
}

export const HealthAssistantAvatar3D: React.FC<HealthAssistantAvatar3DProps> = ({
  state = 'idle',
  size = 180,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();

    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 4.2;

    // Renderer setup with alpha transparency
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // Group for all avatar elements to enable gentle floating
    const avatarGroup = new THREE.Group();
    scene.add(avatarGroup);

    // 1. Central Core Sphere (Soft translucent medical blue/cyan)
    const coreGeometry = new THREE.SphereGeometry(0.85, 32, 32);
    const coreMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7, // Sky blue
      emissive: 0x0369a1,
      emissiveIntensity: 0.35,
      roughness: 0.15,
      metalness: 0.1,
      transmission: 0.85, // Glass-like translucency
      thickness: 1.2,
      transparent: true,
      opacity: 0.92,
    });
    const coreSphere = new THREE.Mesh(coreGeometry, coreMaterial);
    avatarGroup.add(coreSphere);

    // 2. Inner Vitality Nucleus (Glowing health emerald/cyan pulse)
    const innerGeometry = new THREE.SphereGeometry(0.48, 24, 24);
    const innerMaterial = new THREE.MeshStandardMaterial({
      color: 0x14b8a6, // Teal / emerald health glow
      emissive: 0x0d9488,
      emissiveIntensity: 0.8,
      roughness: 0.3,
    });
    const innerSphere = new THREE.Mesh(innerGeometry, innerMaterial);
    avatarGroup.add(innerSphere);

    // 3. Subtle "Friendly Face / Medical Cross Visor" Accent
    // Minimalist, stylized curved sensor/visor band
    const visorCurve = new THREE.TorusGeometry(0.88, 0.04, 16, 40, Math.PI * 0.45);
    const visorMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.9,
    });
    const visor = new THREE.Mesh(visorCurve, visorMaterial);
    visor.rotation.z = Math.PI * 0.77;
    visor.position.z = 0.08;
    avatarGroup.add(visor);

    // 4. Orbital Health Ring 1 (Horizontal tilt)
    const ring1Geometry = new THREE.TorusGeometry(1.22, 0.024, 16, 64);
    const ring1Material = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.4,
      metalness: 0.8,
      roughness: 0.2,
      transparent: true,
      opacity: 0.75,
    });
    const ring1 = new THREE.Mesh(ring1Geometry, ring1Material);
    ring1.rotation.x = Math.PI * 0.38;
    avatarGroup.add(ring1);

    // 5. Orbital Health Ring 2 (Vertical tilt)
    const ring2Geometry = new THREE.TorusGeometry(1.36, 0.018, 16, 64);
    const ring2Material = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.35,
      metalness: 0.7,
      roughness: 0.2,
      transparent: true,
      opacity: 0.65,
    });
    const ring2 = new THREE.Mesh(ring2Geometry, ring2Material);
    ring2.rotation.y = Math.PI * 0.32;
    ring2.rotation.x = Math.PI * 0.2;
    avatarGroup.add(ring2);

    // 6. Ambient Halo Particles (Calm medical telemetry motes)
    const particleCount = 28;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const radius = 1.3 + Math.random() * 0.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[i * 3 + 2] = radius * Math.cos(phi);
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x7dd3fc,
      size: 0.05,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    avatarGroup.add(particles);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xe0f2fe, 1.4);
    keyLight.position.set(2, 3, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x10b981, 1.0);
    rimLight.position.set(-3, -2, -2);
    scene.add(rimLight);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();
      const currentSt = stateRef.current;

      // Gentle floating sine-wave translation (calm breathing)
      avatarGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.08;

      // State-specific dynamics
      if (currentSt === 'thinking') {
        // Active rotation and pulse
        ring1.rotation.z += 0.04;
        ring2.rotation.z -= 0.035;
        ring1.rotation.y += 0.02;
        coreSphere.rotation.y += 0.03;
        particles.rotation.y += 0.02;

        const pulse = Math.sin(elapsedTime * 8) * 0.2 + 1;
        innerSphere.scale.set(pulse, pulse, pulse);
        innerMaterial.emissiveIntensity = 1.2 + Math.sin(elapsedTime * 8) * 0.4;
      } else if (currentSt === 'speaking') {
        // Conversational harmonic pulse
        ring1.rotation.z += 0.02;
        ring2.rotation.z -= 0.018;
        coreSphere.rotation.y += 0.015;
        particles.rotation.y += 0.008;

        const speakPulse = 1 + Math.sin(elapsedTime * 5) * 0.08;
        innerSphere.scale.set(speakPulse, speakPulse, speakPulse);
        innerMaterial.emissiveIntensity = 0.9 + Math.sin(elapsedTime * 6) * 0.3;
      } else {
        // Idle gentle float
        ring1.rotation.z += 0.008;
        ring2.rotation.z -= 0.007;
        coreSphere.rotation.y += 0.006;
        particles.rotation.y += 0.003;

        const breath = 1 + Math.sin(elapsedTime * 2) * 0.04;
        innerSphere.scale.set(breath, breath, breath);
        innerMaterial.emissiveIntensity = 0.75 + Math.sin(elapsedTime * 2) * 0.15;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      coreGeometry.dispose();
      coreMaterial.dispose();
      innerGeometry.dispose();
      innerMaterial.dispose();
      visorCurve.dispose();
      visorMaterial.dispose();
      ring1Geometry.dispose();
      ring1Material.dispose();
      ring2Geometry.dispose();
      ring2Material.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();
    };
  }, [size]);

  return (
    <div
      ref={mountRef}
      style={{
        width: size,
        height: size,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    />
  );
};
