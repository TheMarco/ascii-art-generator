'use client';

import React from 'react';
import { ConversionOptions, AsciiSetKey, ASCII_SETS, ArtStyle } from '@/lib/ascii-converter';
import { DitheringAlgorithm, getRecommendedDithering } from '@/lib/dithering';

interface ControlPanelProps {
  options: ConversionOptions & {
    ditheringAlgorithm: DitheringAlgorithm;
    ditheringStrength: number;
  };
  onOptionsChange: (options: Partial<ControlPanelProps['options']>) => void;
}

const DITHERING_ALGORITHMS: { value: DitheringAlgorithm; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'floyd-steinberg', label: 'Floyd-Steinberg' },
  { value: 'atkinson', label: 'Atkinson' },
  { value: 'ordered-4x4', label: 'Ordered' },
];

const ART_STYLES: { value: ArtStyle; label: string; description: string }[] = [
  { value: 'ascii', label: 'ASCII Art', description: 'Traditional monochrome text art' },
  { value: 'ansi', label: 'ANSI Art', description: 'BBS-era colored block art (1980s-90s)' },
];

const ASCII_SET_LABELS: Record<string, string> = {
  'minimal': 'Minimal Ramp (fast + bold)',
  'smooth': '12-Step Smooth Ramp',
  'classic': 'Classic 10-Char Gradient',
  'dense': 'Dense Ramp with Strong Contrast',
  'blocks': 'CP437 Blocks',
  'ansi-safe': 'ASCII Fallback',
  'ansi-half': 'Half & Full Blocks',
  'ansi-simple': 'Simple Blocks',
  'ansi-classic': 'Classic Mix',
  'ansi-minimal': 'Full Block Only'
};

export default function ControlPanel({ options, onOptionsChange }: ControlPanelProps) {
  const handleSliderChange = (key: string, value: number) => {
    onOptionsChange({ [key]: value });
  };

  const handleSelectChange = (key: string, value: string) => {
    onOptionsChange({ [key]: value });
  };

  const handleCheckboxChange = (key: string, checked: boolean) => {
    onOptionsChange({ [key]: checked });
  };

  return (
    <div className="bg-[#1e1e1e] border-t border-[#2d2d2d] px-4 py-2.5">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-x-3 gap-y-2">

        {/* Art Style */}
        <div className="space-y-1">
          <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wide">Style</label>
          <select
            value={options.artStyle || 'ascii'}
            onChange={(e) => {
              const newStyle = e.target.value as ArtStyle;
              const recommendedSet = newStyle === 'ansi' ? 'blocks' : 'minimal';
              const useColors = newStyle === 'ansi';
              const recommendedDithering = getRecommendedDithering(
                newStyle,
                ASCII_SETS[recommendedSet as AsciiSetKey].length,
                useColors
              );
              handleSelectChange('artStyle', newStyle);
              handleSelectChange('asciiSet', recommendedSet);
              handleSelectChange('ditheringAlgorithm', recommendedDithering);
              if (newStyle === 'ansi') {
                handleCheckboxChange('useColors', true);
              }
            }}
            className="w-full px-2 py-1 text-xs border border-[#3d3d3d] rounded bg-[#2d2d2d] text-gray-200 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            {ART_STYLES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Character Set */}
        <div className="space-y-1">
          <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wide">Charset</label>
          <select
            value={options.asciiSet}
            onChange={(e) => handleSelectChange('asciiSet', e.target.value)}
            className="w-full px-2 py-1 text-xs border border-[#3d3d3d] rounded bg-[#2d2d2d] text-gray-200 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            {Object.entries(ASCII_SETS)
              .filter(([key]) => {
                const isAnsiSet = key.startsWith('ansi-') || key === 'blocks';
                return options.artStyle === 'ansi' ? isAnsiSet : !isAnsiSet;
              })
              .map(([key, chars]) => (
                <option key={key} value={key}>{ASCII_SET_LABELS[key] || key}</option>
              ))}
          </select>
        </div>

        {/* Width */}
        <div className="space-y-1">
          <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wide">
            Width <span className="text-blue-400 font-mono">{options.width}</span>
          </label>
          <input
            type="range"
            min="20"
            max="200"
            value={options.width}
            onChange={(e) => handleSliderChange('width', parseInt(e.target.value))}
            className="w-full h-1 bg-[#3d3d3d] rounded appearance-none cursor-pointer slider"
          />
        </div>

        {/* Font Size */}
        <div className="space-y-1">
          <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wide">
            Size <span className="text-blue-400 font-mono">{options.fontSize}px</span>
          </label>
          <input
            type="range"
            min="6"
            max="20"
            value={options.fontSize}
            onChange={(e) => handleSliderChange('fontSize', parseInt(e.target.value))}
            className="w-full h-1 bg-[#3d3d3d] rounded appearance-none cursor-pointer slider"
          />
        </div>

        {/* Contrast */}
        <div className="space-y-1">
          <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wide">
            Contrast <span className="text-blue-400 font-mono">{options.contrast.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min="0.1"
            max="3.0"
            step="0.1"
            value={options.contrast}
            onChange={(e) => handleSliderChange('contrast', parseFloat(e.target.value))}
            className="w-full h-1 bg-[#3d3d3d] rounded appearance-none cursor-pointer slider"
          />
        </div>

        {/* Brightness */}
        <div className="space-y-1">
          <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wide">
            Bright <span className="text-blue-400 font-mono">{options.brightness > 0 ? '+' : ''}{options.brightness}</span>
          </label>
          <input
            type="range"
            min="-100"
            max="100"
            value={options.brightness}
            onChange={(e) => handleSliderChange('brightness', parseInt(e.target.value))}
            className="w-full h-1 bg-[#3d3d3d] rounded appearance-none cursor-pointer slider"
          />
        </div>

        {/* Dithering (ASCII only) */}
        {options.artStyle === 'ascii' && (
          <>
            <div className="space-y-1">
              <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wide">Dither</label>
              <select
                value={options.ditheringAlgorithm}
                onChange={(e) => handleSelectChange('ditheringAlgorithm', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-[#3d3d3d] rounded bg-[#2d2d2d] text-gray-200 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                {DITHERING_ALGORITHMS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Dithering Strength */}
            {options.ditheringAlgorithm !== 'none' && (
              <div className="space-y-1">
                <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wide">
                  Strength <span className="text-blue-400 font-mono">{(options.ditheringStrength * 100).toFixed(0)}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={options.ditheringStrength}
                  onChange={(e) => handleSliderChange('ditheringStrength', parseFloat(e.target.value))}
                  className="w-full h-1 bg-[#3d3d3d] rounded appearance-none cursor-pointer slider"
                />
              </div>
            )}
          </>
        )}

        {/* Color Palette (ANSI colors only) */}
        {options.artStyle === 'ansi' && options.useColors && (
          <div className="space-y-1">
            <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wide">Palette</label>
            <select
              value={options.colorPalette || 'ansi-16'}
              onChange={(e) => handleSelectChange('colorPalette', e.target.value)}
              className="w-full px-2 py-1 text-xs border border-[#3d3d3d] rounded bg-[#2d2d2d] text-gray-200 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ansi-16">16 Colors</option>
              <option value="ansi-256">256 Colors</option>
            </select>
          </div>
        )}

        {/* Color Scheme (ASCII only) */}
        {options.artStyle === 'ascii' && (
          <div className="space-y-1">
            <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wide">Colors</label>
            <select
              value={options.colorScheme || 'white-on-black'}
              onChange={(e) => handleSelectChange('colorScheme', e.target.value)}
              className="w-full px-2 py-1 text-xs border border-[#3d3d3d] rounded bg-[#2d2d2d] text-gray-200 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="white-on-black">White on Black</option>
              <option value="black-on-white">Black on White</option>
            </select>
          </div>
        )}

      </div>

      {/* Character Set Preview */}
      <div className="mt-2 px-4 py-2 bg-[#252525] rounded border border-[#2d2d2d]">
        <div className="text-[10px] text-gray-500 mb-1">Character Set Preview:</div>
        <div className="text-xs text-gray-200 font-mono bg-black px-3 py-2 rounded overflow-x-auto whitespace-nowrap">
          {ASCII_SETS[options.asciiSet]}
        </div>
        {(options.asciiSet.startsWith('ansi-') || options.asciiSet === 'blocks') && options.asciiSet !== 'ansi-safe' && (
          <div className="text-[10px] text-yellow-400 mt-1">
            ⚠ Block characters may not align perfectly in all fonts
          </div>
        )}
      </div>
    </div>
  );
}
