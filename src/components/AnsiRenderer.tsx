'use client';

import React from 'react';
import { AnsiPixel, ANSI_16_COLORS, generateAnsi256Palette } from '@/lib/ascii-converter';

interface AnsiRendererProps {
  ansiPixels: AnsiPixel[][];
  fontSize: number;
  colorPalette: 'ansi-16' | 'ansi-256';
  className?: string;
}

export default function AnsiRenderer({ ansiPixels, fontSize, colorPalette, className = '' }: AnsiRendererProps) {
  const palette = colorPalette === 'ansi-16' ? ANSI_16_COLORS : generateAnsi256Palette();
  
  const getColorStyle = (pixel: AnsiPixel) => {
    const style: React.CSSProperties = {};
    
    if (pixel.fgColor !== undefined) {
      const [r, g, b] = palette[pixel.fgColor];
      style.color = `rgb(${r}, ${g}, ${b})`;
    }
    
    if (pixel.bgColor !== undefined) {
      const [r, g, b] = palette[pixel.bgColor];
      style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
    }
    
    return style;
  };

  // Convert to string format for reliable monospace rendering
  const renderAsString = () => {
    return ansiPixels.map(row =>
      row.map(pixel => pixel.char).join('')
    ).join('\n');
  };

  // For colored ANSI, we need individual spans, but we'll use a more reliable layout
  return (
    <div
      className={`font-mono leading-tight whitespace-pre select-all ${className}`}
      style={{
        fontSize: `${fontSize}px`,
        lineHeight: '1.1',
        fontFamily: '"Courier New", Courier, monospace', // Use most reliable monospace font
        letterSpacing: '0px', // Ensure no extra spacing
        wordSpacing: '0px'
      }}
    >
      {ansiPixels.map((row, y) => (
        <div key={y} style={{ height: `${fontSize * 1.1}px`, display: 'block' }}>
          {row.map((pixel, x) => (
            <span
              key={x}
              style={{
                ...getColorStyle(pixel),
                fontFamily: 'inherit',
                display: 'inline-block',
                width: `${fontSize * 0.6}px`, // Force consistent character width
                textAlign: 'center'
              }}
            >
              {pixel.char}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
