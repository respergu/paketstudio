import React, { useState, useEffect } from 'react';
import { safeInvoke as invoke } from '../utils/ipc';
import { ZoomIn, ZoomOut, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface ImagePreviewPaneProps {
  filePath: string;
  title: string;
}

export const ImagePreviewPane: React.FC<ImagePreviewPaneProps> = ({ filePath, title }) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [zoom, setZoom] = useState<number>(4);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setError(null);
    setDataUrl(null);
    setDimensions(null);

    invoke<string>('read_file_base64', { filePath })
      .then((url) => {
        if (!isCancelled) {
          setDataUrl(url);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error(`Failed to load image ${filePath}:`, err);
          setError(typeof err === 'string' ? err : 'Failed to read image data');
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [filePath]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
  };

  return (
    <div className="image-preview-container">
      <div className="preview-toolbar">
        <div className="preview-info">
          <ImageIcon size={15} className="icon-img" />
          <span className="image-filename">{title}</span>
          {dimensions && (
            <span className="image-dimensions-badge">
              {dimensions.width} × {dimensions.height} px
            </span>
          )}
        </div>

        <div className="preview-controls">
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => setZoom((z) => Math.max(1, z / 2))}
            disabled={zoom <= 1}
            title="Zoom Out"
          >
            <ZoomOut size={13} />
          </button>
          <span className="zoom-level">{zoom}x</span>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => setZoom((z) => Math.min(16, z * 2))}
            disabled={zoom >= 16}
            title="Zoom In"
          >
            <ZoomIn size={13} />
          </button>
        </div>
      </div>

      <div className="image-canvas-wrapper">
        {isLoading && <span className="preview-loading">Loading image...</span>}

        {error && (
          <div className="preview-error">
            <AlertCircle size={24} className="text-error" />
            <span>Could not load image: {error}</span>
          </div>
        )}

        {dataUrl && !error && (
          <img
            src={dataUrl}
            alt={title}
            className="pixelated-image"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
            }}
            onLoad={handleImageLoad}
          />
        )}
      </div>
    </div>
  );
};
