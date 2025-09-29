'use client';

import React, { useCallback, useState } from 'react';
import { loadImageFromFile, ImageData } from '@/lib/ascii-converter';

interface ImageUploadProps {
  onImageLoad: (imageData: ImageData, file: File) => void;
  onError: (error: string) => void;
}

export default function ImageUpload({ onImageLoad, onError }: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      onError('Please select a valid image file');
      return;
    }

    setIsLoading(true);
    try {
      const imageData = await loadImageFromFile(file);
      onImageLoad(imageData, file);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to load image');
    } finally {
      setIsLoading(false);
    }
  }, [onImageLoad, onError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  return (
    <div className="w-full">
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300
          ${isDragOver
            ? 'border-blue-400 bg-blue-500/10 scale-105'
            : 'border-gray-600 hover:border-gray-500 hover:bg-gray-900/50'
          }
          ${isLoading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isLoading}
        />

        <div className="space-y-6">
          <div className="mx-auto w-20 h-20 text-gray-400">
            {isLoading ? (
              <div className="animate-spin w-full h-full border-4 border-gray-600 border-t-blue-500 rounded-full"></div>
            ) : (
              <svg
                className="w-full h-full"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            )}
          </div>

          <div>
            <p className="text-xl font-semibold text-white mb-2">
              {isLoading ? 'Processing image...' : 'Drop your image here'}
            </p>
            <p className="text-gray-400">
              or click to browse files
            </p>
          </div>

          <div className="inline-flex items-center space-x-2 text-sm text-gray-500 bg-gray-800 px-4 py-2 rounded-full">
            <span>Supports:</span>
            <span className="text-gray-300">JPG • PNG • GIF • WebP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
