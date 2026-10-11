import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Upload,
  Crop,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Sparkles,
  Check,
  Image as ImageIcon,
  Move,
  RefreshCw,
  Eye,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

interface BannerCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBannerBlob: (blob: Blob) => Promise<void>;
  onSavePresetUrl?: (url: string) => Promise<void>;
  currentBannerUrl?: string | null;
  userRole?: string;
  userName?: string;
}

// Curated high-resolution SVG healthcare banner data URIs for users with no image
const HEALTHCARE_PRESETS = [
  {
    id: 'cardio-sapphire',
    title: 'Cardiology Pulse Sapphire',
    subtitle: 'Deep Navy & Cyan Cardiogram Wave',
    theme: '#0284c7',
    dataUrl:
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400" viewBox="0 0 1200 400">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#090d16" />
            <stop offset="50%" stop-color="#0f213e" />
            <stop offset="100%" stop-color="#0369a1" />
          </linearGradient>
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(56, 189, 248, 0.08)" stroke-width="1"/>
          </pattern>
        </defs>
        <rect width="1200" height="400" fill="url(#bg)" />
        <rect width="1200" height="400" fill="url(#grid)" />
        <path d="M 0 200 L 300 200 L 320 180 L 340 220 L 360 140 L 380 270 L 400 170 L 420 210 L 440 200 L 800 200 L 820 160 L 840 250 L 860 110 L 880 280 L 900 180 L 920 210 L 1200 200" fill="none" stroke="#38bdf8" stroke-width="3" stroke-linecap="round" opacity="0.85" filter="drop-shadow(0 0 8px #38bdf8)" />
        <circle cx="860" cy="110" r="5" fill="#38bdf8" filter="drop-shadow(0 0 10px #38bdf8)" />
        <circle cx="360" cy="140" r="5" fill="#38bdf8" filter="drop-shadow(0 0 10px #38bdf8)" />
      </svg>
    `),
  },
  {
    id: 'bio-dna-teal',
    title: 'Genomics Bio-Helix',
    subtitle: 'Emerald & Teal Cellular Structure',
    theme: '#0d9488',
    dataUrl:
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400" viewBox="0 0 1200 400">
        <defs>
          <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#022c22" />
            <stop offset="60%" stop-color="#064e3b" />
            <stop offset="100%" stop-color="#0d9488" />
          </linearGradient>
        </defs>
        <rect width="1200" height="400" fill="url(#bg2)" />
        <g stroke="rgba(45, 212, 191, 0.25)" stroke-width="2" fill="none">
          <circle cx="1000" cy="120" r="80" />
          <circle cx="1000" cy="120" r="140" stroke-dasharray="8 6" />
          <circle cx="1000" cy="120" r="200" stroke-dasharray="4 8" />
          <circle cx="150" cy="300" r="100" />
          <circle cx="150" cy="300" r="160" stroke-dasharray="6 6" />
        </g>
        <path d="M 0 150 Q 300 280 600 150 T 1200 150" fill="none" stroke="#2dd4bf" stroke-width="3" opacity="0.6" />
        <path d="M 0 250 Q 300 120 600 250 T 1200 250" fill="none" stroke="#34d399" stroke-width="3" opacity="0.6" />
      </svg>
    `),
  },
  {
    id: 'clinical-horizon-blue',
    title: 'Clinical Precision Matrix',
    subtitle: 'Modern Royal Ultramarine Healthcare Wave',
    theme: '#2563eb',
    dataUrl:
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400" viewBox="0 0 1200 400">
        <defs>
          <linearGradient id="bg3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0f172a" />
            <stop offset="50%" stop-color="#1e3a8a" />
            <stop offset="100%" stop-color="#1d4ed8" />
          </linearGradient>
        </defs>
        <rect width="1200" height="400" fill="url(#bg3)" />
        <path d="M 0 350 C 350 200, 700 400, 1200 180 L 1200 400 L 0 400 Z" fill="rgba(37, 99, 235, 0.35)" />
        <path d="M 0 380 C 450 280, 800 360, 1200 240 L 1200 400 L 0 400 Z" fill="rgba(96, 165, 250, 0.2)" />
        <g fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2">
          <path d="M 900 80 L 900 120 M 880 100 L 920 100" stroke-width="4" stroke="#60a5fa" />
          <path d="M 1050 140 L 1050 170 M 1035 155 L 1065 155" stroke-width="3" stroke="#93c5fd" />
          <path d="M 750 60 L 750 84 M 738 72 L 762 72" stroke-width="3" stroke="#60a5fa" />
        </g>
      </svg>
    `),
  },
  {
    id: 'neural-indigo-mesh',
    title: 'AI Neural Health Diagnostics',
    subtitle: 'Indigo & Violet Bio-Signal Grid',
    theme: '#6366f1',
    dataUrl:
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400" viewBox="0 0 1200 400">
        <defs>
          <linearGradient id="bg4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0f172a" />
            <stop offset="50%" stop-color="#312e81" />
            <stop offset="100%" stop-color="#4f46e5" />
          </linearGradient>
        </defs>
        <rect width="1200" height="400" fill="url(#bg4)" />
        <g stroke="rgba(165, 180, 252, 0.3)" stroke-width="1.5">
          <line x1="200" y1="100" x2="350" y2="180" />
          <line x1="350" y1="180" x2="500" y2="120" />
          <line x1="500" y1="120" x2="680" y2="240" />
          <line x1="680" y1="240" x2="840" y2="160" />
          <line x1="840" y1="160" x2="1020" y2="220" />
        </g>
        <circle cx="200" cy="100" r="6" fill="#818cf8" filter="drop-shadow(0 0 8px #818cf8)" />
        <circle cx="350" cy="180" r="7" fill="#c084fc" filter="drop-shadow(0 0 8px #c084fc)" />
        <circle cx="500" cy="120" r="6" fill="#818cf8" />
        <circle cx="680" cy="240" r="9" fill="#a855f7" filter="drop-shadow(0 0 10px #a855f7)" />
        <circle cx="840" cy="160" r="7" fill="#818cf8" />
        <circle cx="1020" cy="220" r="8" fill="#38bdf8" />
      </svg>
    `),
  },
  {
    id: 'wellness-cyan-radiant',
    title: 'Radiant Preventive Health',
    subtitle: 'Vibrant Sky Blue & Cyan Horizon',
    theme: '#0284c7',
    dataUrl:
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400" viewBox="0 0 1200 400">
        <defs>
          <linearGradient id="bg5" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#082f49" />
            <stop offset="50%" stop-color="#0284c7" />
            <stop offset="100%" stop-color="#38bdf8" />
          </linearGradient>
        </defs>
        <rect width="1200" height="400" fill="url(#bg5)" />
        <circle cx="950" cy="200" r="160" fill="rgba(255,255,255,0.08)" />
        <circle cx="950" cy="200" r="110" fill="rgba(255,255,255,0.06)" />
        <circle cx="950" cy="200" r="60" fill="rgba(255,255,255,0.08)" />
      </svg>
    `),
  },
  {
    id: 'sleek-slate-dark',
    title: 'Sleek Dark Modernist',
    subtitle: 'Minimalist Charcoal & Cobalt Accent',
    theme: '#334155',
    dataUrl:
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400" viewBox="0 0 1200 400">
        <defs>
          <linearGradient id="bg6" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#020617" />
            <stop offset="100%" stop-color="#1e293b" />
          </linearGradient>
        </defs>
        <rect width="1200" height="400" fill="url(#bg6)" />
        <path d="M 0 260 L 600 200 L 1200 260 L 1200 400 L 0 400 Z" fill="rgba(30, 41, 59, 0.7)" />
        <line x1="0" y1="260" x2="600" y2="200" stroke="#38bdf8" stroke-width="2" opacity="0.4" />
        <line x1="600" y1="200" x2="1200" y2="260" stroke="#38bdf8" stroke-width="2" opacity="0.4" />
      </svg>
    `),
  },
];

export const BannerCropperModal: React.FC<BannerCropperModalProps> = ({
  isOpen,
  onClose,
  onSaveBannerBlob,
  onSavePresetUrl,
  currentBannerUrl,
  userRole = 'PATIENT',
  userName = 'User',
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'presets'>('upload');

  // Image source state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number; aspect: number } | null>(null);

  // Transform controls
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Selected preset
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);

  // Target Banner dimensions
  const TARGET_WIDTH = 1200;
  const TARGET_HEIGHT = 400; // 3:1 banner aspect ratio
  const BANNER_ASPECT = TARGET_WIDTH / TARGET_HEIGHT; // 3.0

  // Reset all adjustments
  const handleResetControls = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  }, []);

  // Handle local file load
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage('File size exceeds 20MB limit.');
      return;
    }

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        loadedImageRef.current = img;
        setImageSrc(dataUrl);
        setImageMeta({
          width: img.naturalWidth,
          height: img.naturalHeight,
          aspect: img.naturalWidth / img.naturalHeight,
        });
        handleResetControls();
        setSelectedPresetId(null);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Drag pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageSrc) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !imageSrc) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!imageSrc || e.touches.length !== 1) return;
    setIsDragging(true);
    setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !imageSrc || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Draw interactive preview
  useEffect(() => {
    const previewCanvas = previewCanvasRef.current;
    if (!previewCanvas) return;
    const ctx = previewCanvas.getContext('2d');
    if (!ctx) return;

    const width = previewCanvas.width;
    const height = previewCanvas.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    if (!loadedImageRef.current) {
      // Draw placeholder
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);
      return;
    }

    const img = loadedImageRef.current;

    ctx.save();
    // Clip to rounded banner area
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.clip();

    // Center pivot
    ctx.translate(width / 2 + pan.x, height / 2 + pan.y);
    ctx.rotate((rotation * Math.PI) / 180);

    // Compute scale to cover canvas initially
    const scaleToCover = Math.max(width / img.naturalWidth, height / img.naturalHeight);
    const finalScale = scaleToCover * zoom;

    const drawW = img.naturalWidth * finalScale;
    const drawH = img.naturalHeight * finalScale;

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }, [imageSrc, zoom, rotation, pan]);

  // Generate cropped output blob and save
  const handleApplyCropAndSave = async () => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);

      // Case A: User picked a preset
      if (activeTab === 'presets' && selectedPresetId) {
        const preset = HEALTHCARE_PRESETS.find((p) => p.id === selectedPresetId);
        if (preset) {
          // Convert SVG data URL to Blob
          const res = await fetch(preset.dataUrl);
          const blob = await res.blob();
          await onSaveBannerBlob(blob);
          onClose();
          return;
        }
      }

      // Case B: User uploaded and adjusted image
      if (!loadedImageRef.current) {
        setErrorMessage('Please select or upload an image to crop.');
        return;
      }

      const img = loadedImageRef.current;
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = TARGET_WIDTH;
      exportCanvas.height = TARGET_HEIGHT;
      const ctx = exportCanvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to create canvas rendering context.');
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.save();
      ctx.translate(TARGET_WIDTH / 2 + pan.x * (TARGET_WIDTH / 600), TARGET_HEIGHT / 2 + pan.y * (TARGET_HEIGHT / 200));
      ctx.rotate((rotation * Math.PI) / 180);

      const scaleToCover = Math.max(TARGET_WIDTH / img.naturalWidth, TARGET_HEIGHT / img.naturalHeight);
      const finalScale = scaleToCover * zoom;

      const drawW = img.naturalWidth * finalScale;
      const drawH = img.naturalHeight * finalScale;

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      // Export as high quality JPEG Blob
      exportCanvas.toBlob(
        async (blob) => {
          if (!blob) {
            setErrorMessage('Failed to generate cropped image.');
            setIsProcessing(false);
            return;
          }
          await onSaveBannerBlob(blob);
          setIsProcessing(false);
          onClose();
        },
        'image/jpeg',
        0.92
      );
    } catch (err: any) {
      console.error('Failed to crop and save banner:', err);
      setErrorMessage(err.message || 'Error processing banner crop.');
      setIsProcessing(false);
    }
  };

  // Apply a preset directly
  const handleSelectPreset = (preset: (typeof HEALTHCARE_PRESETS)[0]) => {
    setSelectedPresetId(preset.id);
    const img = new Image();
    img.onload = () => {
      loadedImageRef.current = img;
      setImageSrc(preset.dataUrl);
      setImageMeta({ width: 1200, height: 400, aspect: 3.0 });
      handleResetControls();
    };
    img.src = preset.dataUrl;
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose();
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          width: '100%',
          maxWidth: 780,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #f8fafc, #ffffff)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <Crop size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                Profile Header Banner Studio
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                Preprocess, crop & align your profile cover (3:1 Panoramic Ratio • 1200 × 400px)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: 8,
              width: 34,
              height: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
            padding: '0 1.5rem',
            gap: '1rem',
          }}
        >
          <button
            onClick={() => setActiveTab('upload')}
            style={{
              padding: '0.85rem 0.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'upload' ? '2.5px solid #0284c7' : '2.5px solid transparent',
              color: activeTab === 'upload' ? '#0284c7' : '#64748b',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Upload size={16} /> Upload & Preprocess Photo
          </button>

          <button
            onClick={() => setActiveTab('presets')}
            style={{
              padding: '0.85rem 0.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'presets' ? '2.5px solid #0284c7' : '2.5px solid transparent',
              color: activeTab === 'presets' ? '#0284c7' : '#64748b',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Sparkles size={16} /> Curated Healthcare Banners
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
          {errorMessage && (
            <div
              style={{
                marginBottom: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: 10,
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: '0.82rem',
                fontWeight: 600,
              }}
            >
              {errorMessage}
            </div>
          )}

          {activeTab === 'upload' ? (
            <div>
              {/* Interactive Cropper Viewport */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '3 / 1',
                  borderRadius: 14,
                  overflow: 'hidden',
                  background: '#090d16',
                  border: '2px solid #e2e8f0',
                  boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.4)',
                  cursor: imageSrc ? (isDragging ? 'grabbing' : 'grab') : 'default',
                  userSelect: 'none',
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* Canvas */}
                <canvas
                  ref={previewCanvasRef}
                  width={600}
                  height={200}
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'block',
                  }}
                />

                {/* Profile Silhouette Overlay (Shows avatar positioning) */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 12,
                    left: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    pointerEvents: 'none',
                    background: 'rgba(15, 23, 42, 0.45)',
                    backdropFilter: 'blur(4px)',
                    padding: '4px 12px 4px 6px',
                    borderRadius: 24,
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #38bdf8, #0369a1)',
                      border: '2px solid #ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                    }}
                  >
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ color: '#ffffff', fontSize: '0.75rem', fontWeight: 700 }}>
                    Profile Header Overlay Preview
                  </span>
                </div>

                {/* Helper hint */}
                {imageSrc && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 12,
                      background: 'rgba(0,0,0,0.6)',
                      backdropFilter: 'blur(4px)',
                      color: 'rgba(255,255,255,0.85)',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: 6,
                      pointerEvents: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Move size={11} /> Drag to Reposition
                  </div>
                )}

                {/* Empty State */}
                {!imageSrc && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#94a3b8',
                      padding: '1rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '0.5rem',
                        color: '#38bdf8',
                      }}
                    >
                      <ImageIcon size={24} />
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
                      Click to Browse Image or Drag & Drop
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
                      PNG, JPG, WEBP up to 20MB • Automatically preprocessed to 3:1 banner
                    </span>
                  </div>
                )}
              </div>

              {/* Upload Controls Row */}
              <div
                style={{
                  marginTop: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: '0.5rem 0.9rem',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#334155',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <Upload size={14} /> {imageSrc ? 'Replace Image' : 'Select Photo'}
                  </button>

                  {imageSrc && (
                    <button
                      type="button"
                      onClick={handleResetControls}
                      title="Reset pan and zoom"
                      style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                        background: '#f8fafc',
                        color: '#64748b',
                        fontWeight: 600,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <RefreshCw size={13} /> Center Reset
                    </button>
                  )}
                </div>

                {/* Preprocessing Info Badge */}
                {imageMeta && (
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: '#0369a1',
                      background: '#f0f9ff',
                      border: '1px solid #bae6fd',
                      padding: '4px 10px',
                      borderRadius: 8,
                      fontWeight: 600,
                    }}
                  >
                    Original: {imageMeta.width}×{imageMeta.height} ({imageMeta.aspect.toFixed(2)}:1) &rarr; Cropping to 3:1 Banner
                  </div>
                )}
              </div>

              {/* Adjustments Tooling (Zoom & Rotation) */}
              {imageSrc && (
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '0.85rem 1rem',
                    borderRadius: 12,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.5rem',
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Zoom Slider */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 200 }}>
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
                      style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 2 }}
                    >
                      <ZoomOut size={16} />
                    </button>
                    <input
                      type="range"
                      min="0.8"
                      max="3.0"
                      step="0.05"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      style={{
                        flex: 1,
                        accentColor: '#0284c7',
                        cursor: 'pointer',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.min(3.0, z + 0.1))}
                      style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 2 }}
                    >
                      <ZoomIn size={16} />
                    </button>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', minWidth: 38 }}>
                      {Math.round(zoom * 100)}%
                    </span>
                  </div>

                  {/* Rotate */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={() => setRotation((r) => (r + 90) % 360)}
                      style={{
                        padding: '0.4rem 0.75rem',
                        borderRadius: 8,
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#334155',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <RotateCw size={13} /> Rotate 90°
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.82rem', color: '#64748b' }}>
                Don't have a high-resolution banner photo? Choose one of our studio-grade healthcare and medical banners below. Each is automatically preprocessed and sized to fit your profile header.
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '0.85rem',
                }}
              >
                {HEALTHCARE_PRESETS.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      style={{
                        borderRadius: 12,
                        overflow: 'hidden',
                        border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                        cursor: 'pointer',
                        background: '#ffffff',
                        transition: 'all 0.18s ease',
                        boxShadow: isSelected ? '0 4px 12px rgba(2,132,199,0.2)' : '0 2px 4px rgba(0,0,0,0.04)',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          height: 80,
                          backgroundImage: `url("${preset.dataUrl}")`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          position: 'relative',
                        }}
                      >
                        {isSelected && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 6,
                              right: 6,
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              background: '#0284c7',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                            }}
                          >
                            <Check size={14} />
                          </div>
                        )}
                      </div>
                      <div style={{ padding: '0.65rem 0.85rem' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                          {preset.title}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>
                          {preset.subtitle}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            style={{
              padding: '0.6rem 1.1rem',
              borderRadius: 10,
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#475569',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApplyCropAndSave}
            disabled={isProcessing || (!imageSrc && activeTab === 'upload' && !selectedPresetId)}
            style={{
              padding: '0.65rem 1.4rem',
              borderRadius: 10,
              border: 'none',
              background:
                isProcessing || (!imageSrc && activeTab === 'upload' && !selectedPresetId)
                  ? '#94a3b8'
                  : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor:
                isProcessing || (!imageSrc && activeTab === 'upload' && !selectedPresetId)
                  ? 'not-allowed'
                  : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            {isProcessing ? (
              <>
                <RefreshCw size={15} className="spin" /> Preprocessing & Applying...
              </>
            ) : (
              <>
                <Check size={16} /> Preprocess & Set as Banner
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BannerCropperModal;
