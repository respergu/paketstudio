import React, { useEffect, useRef, useState } from 'react';
import { safeInvoke as invoke } from '../utils/ipc';
import type { PakImageRef, FileNode } from '../types';

interface SpritePreviewProps {
  projectPath: string;
  imageRef?: PakImageRef;
  baseDir?: string;
  files?: FileNode[];
  zoom: number;
  className?: string;
}

export const SpritePreview: React.FC<SpritePreviewProps> = ({
  projectPath,
  imageRef,
  baseDir,
  files,
  zoom,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cachedImg, setCachedImg] = useState<HTMLImageElement | null>(null);

  const file = imageRef?.file;

  // Load the source image when file changes
  useEffect(() => {
    if (!projectPath || !file) {
      setCachedImg(null);
      setError(null);
      return;
    }

    let isCancelled = false;

    const candidates: string[] = [];
    if (file.startsWith('/')) {
      candidates.push(file);
    } else {
      if (baseDir) {
        candidates.push(`${projectPath}/${baseDir}/${file}`);
      }
      candidates.push(`${projectPath}/${file}`);
      if (files) {
        const fileNameOnly = file.split('/').pop() || file;
        const matches = files.filter(f =>
          f.name === file ||
          f.relative_path === file ||
          f.relative_path.endsWith(`/${file}`) ||
          f.name === fileNameOnly
        );
        for (const m of matches) {
          if (!candidates.includes(m.path)) {
            candidates.push(m.path);
          }
        }
      }
    }

    const tryLoad = async () => {
      for (const candidate of candidates) {
        if (isCancelled) return;
        try {
          const dataUrl = await invoke<string>('read_file_base64', { filePath: candidate });
          if (isCancelled) return;
          const img = new Image();
          img.onload = () => {
            if (!isCancelled) {
              setCachedImg(img);
              setError(null);
            }
          };
          img.onerror = () => {
            if (!isCancelled) {
              setError(`Could not decode ${file}`);
              setCachedImg(null);
            }
          };
          img.src = dataUrl;
          return;
        } catch {
          // Try next candidate
        }
      }

      if (!isCancelled) {
        setError(`File not found: ${file}`);
        setCachedImg(null);
      }
    };

    tryLoad();

    return () => {
      isCancelled = true;
    };
  }, [projectPath, file, baseDir, files]);

  // Draw the cropped sub-rectangle when image, coordinates, or zoom change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!imageRef || !cachedImg) {
      canvas.width = 64;
      canvas.height = 64;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const x1 = imageRef.x1 || 0;
    const y1 = imageRef.y1 || 0;
    const { x2, y2 } = imageRef;
    const hasExplicitBounds = x2 !== undefined && y2 !== undefined && x2 > x1 && y2 > y1;
    const srcWidth = hasExplicitBounds ? (x2 - x1) : (cachedImg.naturalWidth || cachedImg.width);
    const srcHeight = hasExplicitBounds ? (y2 - y1) : (cachedImg.naturalHeight || cachedImg.height);

    const destWidth = srcWidth * zoom;
    const destHeight = srcHeight * zoom;

    canvas.width = destWidth;
    canvas.height = destHeight;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, destWidth, destHeight);

    ctx.drawImage(
      cachedImg,
      x1,
      y1,
      srcWidth,
      srcHeight,
      0,
      0,
      destWidth,
      destHeight
    );
  }, [cachedImg, imageRef, zoom]);

  if (!imageRef) {
    return (
      <div className={`sprite-preview-empty ${className || ''}`}>
        <span>No sprite assigned</span>
      </div>
    );
  }

  const width = (imageRef.x2 !== undefined && imageRef.x2 > imageRef.x1)
    ? (imageRef.x2 - imageRef.x1)
    : (cachedImg ? cachedImg.naturalWidth : 0);
  const height = (imageRef.y2 !== undefined && imageRef.y2 > imageRef.y1)
    ? (imageRef.y2 - imageRef.y1)
    : (cachedImg ? cachedImg.naturalHeight : 0);

  return (
    <div className={`sprite-preview-container ${className || ''}`}>
      <div className="sprite-canvas-wrapper checkerboard-bg">
        <canvas ref={canvasRef} className="sprite-canvas" />
      </div>
      <div className="sprite-meta">
        <span className="sprite-dims">{width > 0 ? `${width} × ${height} px` : ''}</span>
        <span className="sprite-coords">
          {imageRef.x2 !== undefined
            ? `(${imageRef.x1}, ${imageRef.y1}) → (${imageRef.x2}, ${imageRef.y2})`
            : 'full image'}
        </span>
      </div>
      {error && <span className="sprite-error">{error}</span>}
    </div>
  );
};
