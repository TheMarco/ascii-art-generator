'use client';

import React, { useState } from 'react';
import { AnsiPixel } from '@/lib/ascii-converter';
import AnsiRenderer from './AnsiRenderer';

interface AsciiOutputProps {
  ascii: string | AnsiPixel[][];
  fontSize: number;
  colorScheme: 'white-on-black' | 'black-on-white';
  artStyle: 'ascii' | 'ansi';
  useColors?: boolean;
  colorPalette?: 'ansi-16' | 'ansi-256';
  className?: string;
}

export default function AsciiOutput({
  ascii,
  fontSize,
  colorScheme,
  artStyle,
  useColors = false,
  colorPalette = 'ansi-16',
  className = ''
}: AsciiOutputProps) {
  const [copied, setCopied] = useState(false);

  const isAnsiPixels = Array.isArray(ascii);
  const isColoredAnsi = artStyle === 'ansi' && useColors && isAnsiPixels;

  const getTextContent = (): string => {
    if (isAnsiPixels) {
      return ascii.map(row => row.map(pixel => pixel.char).join('')).join('\n');
    }
    return ascii as string;
  };

  const handleCopy = async () => {
    try {
      const textContent = getTextContent();
      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleDownload = () => {
    const textContent = getTextContent();
    const filename = isColoredAnsi ? 'ansi-art.txt' : 'ascii-art.txt';
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const textContent = getTextContent();

  if (!textContent.trim()) {
    return (
      <div className={`bg-gray-900 rounded-xl border border-gray-700 p-8 flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-400">
          <div className="text-6xl mb-4">⚡</div>
          <p className="text-lg">ASCII art will appear here</p>
          <p className="text-sm text-gray-500 mt-2">Upload an image and adjust settings to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-[#1e1e1e] rounded border border-[#2d2d2d] overflow-hidden flex flex-col ${className}`}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#2d2d2d] bg-[#252525]">
        <div className="flex items-center space-x-2">
          <h3 className="text-xs font-medium text-gray-300">
            {isColoredAnsi ? 'ANSI' : 'ASCII'}
            {isColoredAnsi && (
              <span className="ml-1 text-[10px] text-blue-400">
                ({colorPalette === 'ansi-16' ? '16' : '256'})
              </span>
            )}
          </h3>
          <span className="text-[10px] text-gray-500">
            {textContent.split('\n').length - 1}L × {textContent.split('\n')[0]?.length || 0}C
          </span>
        </div>

        <div className="flex space-x-1.5">
          <button
            onClick={handleCopy}
            className="px-2 py-1 text-[10px] bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center space-x-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-2 py-1 text-[10px] bg-green-600 hover:bg-green-700 text-white rounded transition-colors flex items-center space-x-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>Save</span>
          </button>
        </div>
      </div>

      <div className="flex-1 p-2 overflow-hidden">
        <div className={`rounded p-3 h-full overflow-auto ${
          isColoredAnsi
            ? 'bg-black'
            : colorScheme === 'white-on-black'
              ? 'bg-black'
              : 'bg-white'
        }`}>
          {isColoredAnsi ? (
            <AnsiRenderer
              ansiPixels={ascii as AnsiPixel[][]}
              fontSize={fontSize}
              colorPalette={colorPalette}
            />
          ) : (
            <pre
              className={`font-mono leading-tight whitespace-pre select-all ${
                colorScheme === 'white-on-black' ? 'text-white' : 'text-black'
              }`}
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: '1.1',
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
              }}
            >
              {ascii as string}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
