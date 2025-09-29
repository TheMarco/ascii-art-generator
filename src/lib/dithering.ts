/**
 * Dithering Algorithms for ASCII Art Generation
 */

import { ImageData } from './ascii-converter';

export type DitheringAlgorithm =
  | 'none'
  | 'floyd-steinberg'
  | 'floyd-steinberg-serpentine'
  | 'jarvis-judice-ninke'
  | 'atkinson'
  | 'stucki'
  | 'burkes'
  | 'sierra'
  | 'sierra-lite'
  | 'ordered-2x2'
  | 'ordered-4x4'
  | 'ordered-8x8'
  | 'blue-noise'
  | 'adaptive-hybrid';

export interface DitheringOptions {
  algorithm: DitheringAlgorithm;
  strength: number; // 0.0 to 1.0
}

// Ordered dithering matrices
const ORDERED_2X2 = [
  [0, 2],
  [3, 1]
];

const ORDERED_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5]
];

const ORDERED_8X8 = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21]
];

/**
 * Apply Floyd-Steinberg dithering (standard left-to-right)
 */
function floydSteinbergDither(imageData: ImageData, strength: number): ImageData {
  return errorDiffusionDither(imageData, strength, [
    [0, 0, 7/16],
    [-1, 1, 3/16],
    [0, 1, 5/16],
    [1, 1, 1/16]
  ], false);
}

/**
 * Apply Floyd-Steinberg dithering with serpentine (zigzag) scanning
 */
function floydSteinbergSerpentineDither(imageData: ImageData, strength: number): ImageData {
  return errorDiffusionDither(imageData, strength, [
    [0, 0, 7/16],
    [-1, 1, 3/16],
    [0, 1, 5/16],
    [1, 1, 1/16]
  ], true);
}

/**
 * Apply Jarvis-Judice-Ninke dithering (larger diffusion kernel)
 */
function jarvisJudiceNinkeDither(imageData: ImageData, strength: number): ImageData {
  return errorDiffusionDither(imageData, strength, [
    [1, 0, 7/48], [2, 0, 5/48],
    [-2, 1, 3/48], [-1, 1, 5/48], [0, 1, 7/48], [1, 1, 5/48], [2, 1, 3/48],
    [-2, 2, 1/48], [-1, 2, 3/48], [0, 2, 5/48], [1, 2, 3/48], [2, 2, 1/48]
  ], false);
}

/**
 * Apply Stucki dithering
 */
function stuckiDither(imageData: ImageData, strength: number): ImageData {
  return errorDiffusionDither(imageData, strength, [
    [1, 0, 8/42], [2, 0, 4/42],
    [-2, 1, 2/42], [-1, 1, 4/42], [0, 1, 8/42], [1, 1, 4/42], [2, 1, 2/42],
    [-2, 2, 1/42], [-1, 2, 2/42], [0, 2, 4/42], [1, 2, 2/42], [2, 2, 1/42]
  ], false);
}

/**
 * Generic error diffusion dithering with custom kernel
 */
function errorDiffusionDither(
  imageData: ImageData,
  strength: number,
  kernel: Array<[number, number, number]>,
  serpentine: boolean = false
): ImageData {
  const { data, width, height } = imageData;
  const newData = new Uint8ClampedArray(data);

  for (let y = 0; y < height; y++) {
    const isRightToLeft = serpentine && y % 2 === 1;
    const startX = isRightToLeft ? width - 1 : 0;
    const endX = isRightToLeft ? -1 : width;
    const stepX = isRightToLeft ? -1 : 1;

    for (let x = startX; x !== endX; x += stepX) {
      const index = (y * width + x) * 4;

      // Process each color channel
      for (let channel = 0; channel < 3; channel++) {
        const oldPixel = newData[index + channel];
        const newPixel = oldPixel < 128 ? 0 : 255;
        const error = (oldPixel - newPixel) * strength;

        newData[index + channel] = newPixel;

        // Distribute error using kernel
        for (const [dx, dy, weight] of kernel) {
          const nx = x + (isRightToLeft ? -dx : dx);
          const ny = y + dy;

          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const neighborIndex = (ny * width + nx) * 4 + channel;
            newData[neighborIndex] = Math.max(0, Math.min(255,
              newData[neighborIndex] + error * weight
            ));
          }
        }
      }
    }
  }

  return { data: newData, width, height };
}

/**
 * Apply Atkinson dithering
 */
function atkinsonDither(imageData: ImageData, strength: number): ImageData {
  const { data, width, height } = imageData;
  const newData = new Uint8ClampedArray(data);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      
      for (let channel = 0; channel < 3; channel++) {
        const oldPixel = newData[index + channel];
        const newPixel = oldPixel < 128 ? 0 : 255;
        const error = (oldPixel - newPixel) * strength;
        
        newData[index + channel] = newPixel;
        
        // Atkinson dithering pattern
        const errorFraction = error / 8;
        
        if (x + 1 < width) newData[((y * width) + x + 1) * 4 + channel] += errorFraction;
        if (x + 2 < width) newData[((y * width) + x + 2) * 4 + channel] += errorFraction;
        if (y + 1 < height) {
          if (x - 1 >= 0) newData[((y + 1) * width + x - 1) * 4 + channel] += errorFraction;
          newData[((y + 1) * width + x) * 4 + channel] += errorFraction;
          if (x + 1 < width) newData[((y + 1) * width + x + 1) * 4 + channel] += errorFraction;
        }
        if (y + 2 < height) {
          newData[((y + 2) * width + x) * 4 + channel] += errorFraction;
        }
      }
    }
  }
  
  return { data: newData, width, height };
}

/**
 * Apply Burkes dithering
 */
function burkesDither(imageData: ImageData, strength: number): ImageData {
  const { data, width, height } = imageData;
  const newData = new Uint8ClampedArray(data);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      
      for (let channel = 0; channel < 3; channel++) {
        const oldPixel = newData[index + channel];
        const newPixel = oldPixel < 128 ? 0 : 255;
        const error = (oldPixel - newPixel) * strength;
        
        newData[index + channel] = newPixel;
        
        // Burkes dithering pattern
        if (x + 1 < width) newData[((y * width) + x + 1) * 4 + channel] += error * 8/32;
        if (x + 2 < width) newData[((y * width) + x + 2) * 4 + channel] += error * 4/32;
        if (y + 1 < height) {
          if (x - 2 >= 0) newData[((y + 1) * width + x - 2) * 4 + channel] += error * 2/32;
          if (x - 1 >= 0) newData[((y + 1) * width + x - 1) * 4 + channel] += error * 4/32;
          newData[((y + 1) * width + x) * 4 + channel] += error * 8/32;
          if (x + 1 < width) newData[((y + 1) * width + x + 1) * 4 + channel] += error * 4/32;
          if (x + 2 < width) newData[((y + 1) * width + x + 2) * 4 + channel] += error * 2/32;
        }
      }
    }
  }
  
  return { data: newData, width, height };
}

/**
 * Apply Sierra dithering
 */
function sierraDither(imageData: ImageData, strength: number): ImageData {
  const { data, width, height } = imageData;
  const newData = new Uint8ClampedArray(data);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      
      for (let channel = 0; channel < 3; channel++) {
        const oldPixel = newData[index + channel];
        const newPixel = oldPixel < 128 ? 0 : 255;
        const error = (oldPixel - newPixel) * strength;
        
        newData[index + channel] = newPixel;
        
        // Sierra dithering pattern
        if (x + 1 < width) newData[((y * width) + x + 1) * 4 + channel] += error * 5/32;
        if (x + 2 < width) newData[((y * width) + x + 2) * 4 + channel] += error * 3/32;
        if (y + 1 < height) {
          if (x - 2 >= 0) newData[((y + 1) * width + x - 2) * 4 + channel] += error * 2/32;
          if (x - 1 >= 0) newData[((y + 1) * width + x - 1) * 4 + channel] += error * 4/32;
          newData[((y + 1) * width + x) * 4 + channel] += error * 5/32;
          if (x + 1 < width) newData[((y + 1) * width + x + 1) * 4 + channel] += error * 4/32;
          if (x + 2 < width) newData[((y + 1) * width + x + 2) * 4 + channel] += error * 2/32;
        }
        if (y + 2 < height) {
          if (x - 1 >= 0) newData[((y + 2) * width + x - 1) * 4 + channel] += error * 2/32;
          newData[((y + 2) * width + x) * 4 + channel] += error * 3/32;
          if (x + 1 < width) newData[((y + 2) * width + x + 1) * 4 + channel] += error * 2/32;
        }
      }
    }
  }
  
  return { data: newData, width, height };
}

/**
 * Apply Sierra Lite dithering
 */
function sierraLiteDither(imageData: ImageData, strength: number): ImageData {
  const { data, width, height } = imageData;
  const newData = new Uint8ClampedArray(data);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      
      for (let channel = 0; channel < 3; channel++) {
        const oldPixel = newData[index + channel];
        const newPixel = oldPixel < 128 ? 0 : 255;
        const error = (oldPixel - newPixel) * strength;
        
        newData[index + channel] = newPixel;
        
        // Sierra Lite dithering pattern
        if (x + 1 < width) newData[((y * width) + x + 1) * 4 + channel] += error * 2/4;
        if (y + 1 < height) {
          if (x - 1 >= 0) newData[((y + 1) * width + x - 1) * 4 + channel] += error * 1/4;
          newData[((y + 1) * width + x) * 4 + channel] += error * 1/4;
        }
      }
    }
  }
  
  return { data: newData, width, height };
}

/**
 * Apply ordered dithering
 */
function orderedDither(imageData: ImageData, matrix: number[][], strength: number): ImageData {
  const { data, width, height } = imageData;
  const newData = new Uint8ClampedArray(data);
  const matrixSize = matrix.length;
  const maxValue = matrixSize * matrixSize - 1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const threshold = (matrix[y % matrixSize][x % matrixSize] / maxValue) * 255 * strength;

      for (let channel = 0; channel < 3; channel++) {
        const oldPixel = newData[index + channel];
        newData[index + channel] = oldPixel > threshold ? 255 : 0;
      }
    }
  }

  return { data: newData, width, height };
}

/**
 * Generate blue noise threshold map using void-and-cluster method
 */
function generateBlueNoiseMap(width: number, height: number): number[][] {
  const map: number[][] = Array(height).fill(0).map(() => Array(width).fill(0));
  const totalPixels = width * height;

  // Initialize with random values
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      map[y][x] = Math.random();
    }
  }

  // Apply void-and-cluster algorithm (simplified version)
  for (let iteration = 0; iteration < 10; iteration++) {
    // Find largest cluster (void)
    let maxEnergy = -Infinity;
    let voidX = 0, voidY = 0;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let energy = 0;
        // Calculate local energy (sum of neighbors)
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            energy += map[y + dy][x + dx];
          }
        }

        if (energy > maxEnergy) {
          maxEnergy = energy;
          voidX = x;
          voidY = y;
        }
      }
    }

    // Redistribute energy
    map[voidY][voidX] *= 0.5;
  }

  return map;
}

/**
 * Apply blue noise dithering
 */
function blueNoiseDither(imageData: ImageData, strength: number): ImageData {
  const { data, width, height } = imageData;
  const newData = new Uint8ClampedArray(data);
  const noiseMap = generateBlueNoiseMap(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const threshold = noiseMap[y][x] * 255 * strength;

      for (let channel = 0; channel < 3; channel++) {
        const oldPixel = newData[index + channel];
        newData[index + channel] = oldPixel > threshold ? 255 : 0;
      }
    }
  }

  return { data: newData, width, height };
}

/**
 * Calculate local contrast/gradient for adaptive dithering
 */
function calculateLocalContrast(data: Uint8ClampedArray, x: number, y: number, width: number, height: number): number {
  const index = (y * width + x) * 4;
  const centerBrightness = (data[index] + data[index + 1] + data[index + 2]) / 3;

  let maxDiff = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const neighborIndex = (ny * width + nx) * 4;
        const neighborBrightness = (data[neighborIndex] + data[neighborIndex + 1] + data[neighborIndex + 2]) / 3;
        maxDiff = Math.max(maxDiff, Math.abs(centerBrightness - neighborBrightness));
      }
    }
  }

  return maxDiff / 255; // Normalize to 0-1
}

/**
 * Apply adaptive hybrid dithering (combines techniques based on local image properties)
 */
function adaptiveHybridDither(imageData: ImageData, strength: number): ImageData {
  const { data, width, height } = imageData;
  const newData = new Uint8ClampedArray(data);

  // Pre-calculate contrast map
  const contrastMap: number[][] = Array(height).fill(0).map(() => Array(width).fill(0));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      contrastMap[y][x] = calculateLocalContrast(data, x, y, width, height);
    }
  }

  // Apply different dithering based on local properties
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const contrast = contrastMap[y][x];

      for (let channel = 0; channel < 3; channel++) {
        const oldPixel = newData[index + channel];
        let newPixel: number;

        if (contrast > 0.3) {
          // High contrast area: use minimal dithering to preserve edges
          newPixel = oldPixel < 128 ? 0 : 255;
        } else if (contrast > 0.1) {
          // Medium contrast: use Floyd-Steinberg-style error diffusion
          newPixel = oldPixel < 128 ? 0 : 255;
          const error = (oldPixel - newPixel) * strength * 0.7; // Reduced strength

          // Distribute error (simplified)
          if (x + 1 < width) {
            newData[((y * width) + x + 1) * 4 + channel] += error * 0.4;
          }
          if (y + 1 < height && x > 0) {
            newData[((y + 1) * width + x - 1) * 4 + channel] += error * 0.2;
          }
          if (y + 1 < height) {
            newData[((y + 1) * width + x) * 4 + channel] += error * 0.3;
          }
        } else {
          // Low contrast (flat area): use ordered dithering pattern
          const threshold = ((x % 4) * 4 + (y % 4)) / 16 * 255 * strength;
          newPixel = oldPixel > threshold ? 255 : 0;
        }

        newData[index + channel] = Math.max(0, Math.min(255, newPixel));
      }
    }
  }

  return { data: newData, width, height };
}

/**
 * Get recommended dithering algorithm based on art style and character set
 */
export function getRecommendedDithering(artStyle: 'ascii' | 'ansi', characterCount: number, useColors: boolean = false): DitheringAlgorithm {
  // For most ASCII/ANSI art, no dithering often looks best because:
  // 1. Characters already provide texture/pattern
  // 2. Few gray levels make dithering create more noise than benefit
  // 3. Character aspect ratio distorts dithering patterns

  if (artStyle === 'ansi') {
    if (useColors) {
      // Colored ANSI art: colors provide the gradation, minimal dithering needed
      return 'none';
    } else {
      // Monochrome ANSI with block characters: characters provide texture
      return characterCount <= 5 ? 'none' : 'ordered-2x2';
    }
  } else {
    // ASCII art: characters provide inherent texture and density variation
    if (characterCount <= 10) {
      return 'none'; // Simple sets work best without dithering
    } else if (characterCount >= 50) {
      // Very detailed character sets might benefit from subtle dithering
      return 'floyd-steinberg-serpentine';
    } else {
      return 'none'; // Most ASCII sets work best without dithering
    }
  }
}

/**
 * Apply dithering to image data
 */
export function applyDithering(imageData: ImageData, options: DitheringOptions): ImageData {
  const { algorithm, strength } = options;

  if (algorithm === 'none' || strength === 0) {
    return imageData;
  }

  switch (algorithm) {
    case 'floyd-steinberg':
      return floydSteinbergDither(imageData, strength);
    case 'floyd-steinberg-serpentine':
      return floydSteinbergSerpentineDither(imageData, strength);
    case 'jarvis-judice-ninke':
      return jarvisJudiceNinkeDither(imageData, strength);
    case 'stucki':
      return stuckiDither(imageData, strength);
    case 'atkinson':
      return atkinsonDither(imageData, strength);
    case 'burkes':
      return burkesDither(imageData, strength);
    case 'sierra':
      return sierraDither(imageData, strength);
    case 'sierra-lite':
      return sierraLiteDither(imageData, strength);
    case 'ordered-2x2':
      return orderedDither(imageData, ORDERED_2X2, strength);
    case 'ordered-4x4':
      return orderedDither(imageData, ORDERED_4X4, strength);
    case 'ordered-8x8':
      return orderedDither(imageData, ORDERED_8X8, strength);
    case 'blue-noise':
      return blueNoiseDither(imageData, strength);
    case 'adaptive-hybrid':
      return adaptiveHybridDither(imageData, strength);
    default:
      return imageData;
  }
}
