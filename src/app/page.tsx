'use client';

import React, { useState, useCallback, useMemo } from 'react';
import ImageUpload from '@/components/ImageUpload';
import ImagePreview from '@/components/ImagePreview';
import ControlPanel from '@/components/ControlPanel';
import AsciiOutput from '@/components/AsciiOutput';
import { ImageData, convertToAscii, ConversionOptions } from '@/lib/ascii-converter';
import { applyDithering, DitheringAlgorithm } from '@/lib/dithering';

interface AppState {
  imageData: ImageData | null;
  fileName: string;
  ascii: string;
  error: string;
}

interface ExtendedOptions extends ConversionOptions {
  ditheringAlgorithm: DitheringAlgorithm;
  ditheringStrength: number;
  colorScheme: 'white-on-black' | 'black-on-white';
}

export default function Home() {
  const [state, setState] = useState<AppState>({
    imageData: null,
    fileName: '',
    ascii: '',
    error: ''
  });

  const [options, setOptions] = useState<ExtendedOptions>({
    width: 80,
    asciiSet: 'minimal',
    artStyle: 'ascii',
    maintainAspectRatio: true,
    fontSize: 10,
    contrast: 1.0,
    brightness: 0,
    charAspectRatio: 0.5,
    ditheringAlgorithm: 'none',
    ditheringStrength: 0.5,
    colorScheme: 'white-on-black',
    useColors: false,
    colorPalette: 'ansi-16'
  });

  const handleImageLoad = useCallback((imageData: ImageData, file: File) => {
    setState(prev => ({
      ...prev,
      imageData,
      fileName: file.name,
      error: ''
    }));
  }, []);

  const handleError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      error
    }));
  }, []);

  const handleOptionsChange = useCallback((newOptions: Partial<ExtendedOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }));
  }, []);

  // Generate ASCII art when image or options change
  const ascii = useMemo(() => {
    if (!state.imageData) return '';

    try {
      // For ANSI color art, skip dithering as it destroys color information
      const shouldApplyDithering = options.ditheringAlgorithm !== 'none' &&
                                   options.ditheringStrength > 0 &&
                                   !(options.artStyle === 'ansi' && options.useColors);

      // Apply dithering if enabled and appropriate
      let processedImageData = state.imageData;
      if (shouldApplyDithering) {
        processedImageData = applyDithering(state.imageData, {
          algorithm: options.ditheringAlgorithm,
          strength: options.ditheringStrength
        });
      }

      // Convert to ASCII/ANSI
      return convertToAscii(processedImageData, options);
    } catch (error) {
      console.error('Error generating ASCII art:', error);
      return '';
    }
  }, [state.imageData, options]);

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-[#2d2d2d] bg-[#1e1e1e]">
        <div className="container mx-auto px-4 py-2.5 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-200">
            ASCII / ANSI Art Generator
          </h1>
          {state.error && (
            <div className="text-xs text-red-400 bg-red-900/20 px-3 py-1 rounded border border-red-800">
              {state.error}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-3 flex-1 flex flex-col">
        {!state.imageData ? (
          /* Upload State */
          <div className="flex items-center justify-center flex-1">
            <div className="w-full max-w-2xl">
              <ImageUpload onImageLoad={handleImageLoad} onError={handleError} />
            </div>
          </div>
        ) : (
          /* Main Interface */
          <div className="flex flex-col h-full">
            {/* Top: Image and ASCII side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-0">
              {/* Left: Image Preview */}
              <div className="flex flex-col">
                <ImagePreview
                  imageData={state.imageData}
                  fileName={state.fileName}
                  onUploadNew={() => setState(prev => ({ ...prev, imageData: null, fileName: '', ascii: '', error: '' }))}
                  className="flex-1"
                />
              </div>

              {/* Right: ASCII Output */}
              <div>
                <AsciiOutput
                  ascii={ascii}
                  fontSize={options.fontSize}
                  colorScheme={options.colorScheme}
                  artStyle={options.artStyle}
                  useColors={options.useColors}
                  colorPalette={options.colorPalette}
                  className="h-full"
                />
              </div>
            </div>

            {/* Bottom: Horizontal Controls */}
            <div className="flex-shrink-0">
              <ControlPanel
                options={options}
                onOptionsChange={handleOptionsChange}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[#2d2d2d] bg-[#1e1e1e]">
        <div className="container mx-auto px-4 py-2 text-center">
          <p className="text-[11px] text-gray-500">
            A useless utility by Marco van Hylckama Vlieg -{' '}
            <a
              href="https://ai-created.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              ai-created.com
            </a>
            {' '}-{' '}
            <a
              href="https://x.com/AIandDesign"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              @AIandDesign on X
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
