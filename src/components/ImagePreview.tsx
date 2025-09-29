'use client';

import React, { useEffect, useRef } from 'react';
import { ImageData } from '@/lib/ascii-converter';

interface ImagePreviewProps {
  imageData: ImageData;
  fileName: string;
  onUploadNew?: () => void;
  className?: string;
}

export default function ImagePreview({ imageData, fileName, onUploadNew, className = '' }: ImagePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = imageData.width;
    canvas.height = imageData.height;

    // Create ImageData object and put it on canvas
    const canvasImageData = ctx.createImageData(imageData.width, imageData.height);
    canvasImageData.data.set(imageData.data);
    ctx.putImageData(canvasImageData, 0, 0);
  }, [imageData]);

  return (
    <div className={`bg-[#1e1e1e] rounded border border-[#2d2d2d] overflow-hidden flex flex-col ${className}`}>
      <div className="px-3 py-1.5 border-b border-[#2d2d2d] bg-[#252525] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-xs font-medium text-gray-300">
            Original
          </h3>
          <span className="text-[10px] text-gray-500">
            {imageData.width} × {imageData.height}px
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <p className="text-[10px] text-gray-500 truncate max-w-xs">
            {fileName}
          </p>
          {onUploadNew && (
            <button
              onClick={onUploadNew}
              className="px-2 py-1 text-[10px] bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center space-x-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              <span>Replace</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-2 flex-1 flex items-center justify-center bg-[#1a1a1a]">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full rounded"
          style={{ imageRendering: 'auto' }}
        />
      </div>
    </div>
  );
}
