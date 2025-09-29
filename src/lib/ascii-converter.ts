/**
 * ASCII Art Converter - Core conversion logic
 */

// Different ASCII/ANSI character sets ordered by brightness (darkest to lightest)
export const ASCII_SETS = {
  // ASCII Art Sets (traditional text-based art)
  'minimal': " .:-=+*#%@", // Minimal Ramp (fast + bold) - 10 chars
  'smooth': " .'`^\",:;Il!i~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$", // 12-Step Smooth Ramp - 70 chars
  'classic': " .,:;ox%#@", // Classic 10-Char Gradient - 10 chars
  'dense': " `.-':_,^=;><+!rc*/z?sLTv)J7(|Fi{}C3tlf1unxzjY5V2wqkoahd0ep9gy6Pb4km8RDZXUBO#MW&8%B@$", // Dense Ramp with Strong Contrast - 92 chars

  // ANSI Art Sets (authentic CP437 block characters)
  'blocks': " ░▒▓█", // Authentic CP437 blocks (may need compatible font)
  'ansi-safe': " .:-=#@", // ASCII fallback that always works
  'ansi-half': " ▄█", // Half and full blocks
  'ansi-simple': " ▒█", // Just medium and full
  'ansi-classic': " .▒▓█", // Mix of ASCII and blocks
  'ansi-minimal': " █" // Just full block
} as const;

export type AsciiSetKey = keyof typeof ASCII_SETS;
export type ArtStyle = 'ascii' | 'ansi';

export interface ConversionOptions {
  width: number;
  height?: number;
  asciiSet: AsciiSetKey;
  artStyle: ArtStyle;
  maintainAspectRatio: boolean;
  fontSize: number;
  contrast: number;
  brightness: number;
  charAspectRatio: number;
  colorScheme?: 'white-on-black' | 'black-on-white';
  useColors?: boolean;
  colorPalette?: 'ansi-16' | 'ansi-256';
}

export interface ImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

// ANSI Color Palettes
export const ANSI_16_COLORS = [
  [0, 0, 0],       // Black
  [128, 0, 0],     // Dark Red
  [0, 128, 0],     // Dark Green
  [128, 128, 0],   // Dark Yellow
  [0, 0, 128],     // Dark Blue
  [128, 0, 128],   // Dark Magenta
  [0, 128, 128],   // Dark Cyan
  [192, 192, 192], // Light Gray
  [128, 128, 128], // Dark Gray
  [255, 0, 0],     // Red
  [0, 255, 0],     // Green
  [255, 255, 0],   // Yellow
  [0, 0, 255],     // Blue
  [255, 0, 255],   // Magenta
  [0, 255, 255],   // Cyan
  [255, 255, 255], // White
];

export interface AnsiPixel {
  char: string;
  fgColor?: number;
  bgColor?: number;
  rgb?: [number, number, number];
}

/**
 * Convert brightness value (0-255) to ASCII character
 */
export function brightnessToAscii(brightness: number, asciiSet: string, invertBrightness: boolean = false): string {
  let normalizedBrightness = Math.max(0, Math.min(255, brightness));

  // Invert brightness for black-on-white display
  if (invertBrightness) {
    normalizedBrightness = 255 - normalizedBrightness;
  }

  const index = Math.floor((normalizedBrightness / 255) * (asciiSet.length - 1));
  return asciiSet[index];
}

/**
 * Get pixel brightness from RGB values
 */
export function getPixelBrightness(r: number, g: number, b: number): number {
  // Using luminance formula for better brightness perception
  return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
}

/**
 * Find closest ANSI color index for RGB values
 */
export function findClosestAnsiColor(r: number, g: number, b: number, palette: number[][]): number {
  let minDistance = Infinity;
  let closestIndex = 0;

  for (let i = 0; i < palette.length; i++) {
    const [pr, pg, pb] = palette[i];
    const distance = Math.sqrt(
      Math.pow(r - pr, 2) +
      Math.pow(g - pg, 2) +
      Math.pow(b - pb, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = i;
    }
  }

  return closestIndex;
}

/**
 * Generate ANSI 256-color palette
 */
export function generateAnsi256Palette(): number[][] {
  const palette: number[][] = [];

  // First 16 colors (standard ANSI)
  palette.push(...ANSI_16_COLORS);

  // 216 color cube (6x6x6)
  for (let r = 0; r < 6; r++) {
    for (let g = 0; g < 6; g++) {
      for (let b = 0; b < 6; b++) {
        palette.push([
          r === 0 ? 0 : 55 + r * 40,
          g === 0 ? 0 : 55 + g * 40,
          b === 0 ? 0 : 55 + b * 40
        ]);
      }
    }
  }

  // 24 grayscale colors
  for (let i = 0; i < 24; i++) {
    const gray = 8 + i * 10;
    palette.push([gray, gray, gray]);
  }

  return palette;
}

/**
 * Convert RGB to ANSI color with character selection
 */
export function rgbToAnsiPixel(
  r: number,
  g: number,
  b: number,
  asciiChars: string,
  useColors: boolean,
  colorPalette: 'ansi-16' | 'ansi-256' = 'ansi-16',
  invertBrightness: boolean = false
): AnsiPixel {
  const brightness = getPixelBrightness(r, g, b);
  const char = brightnessToAscii(brightness, asciiChars, invertBrightness);

  if (!useColors) {
    return { char };
  }

  const palette = colorPalette === 'ansi-16' ? ANSI_16_COLORS : generateAnsi256Palette();
  const colorIndex = findClosestAnsiColor(r, g, b, palette);

  // For ANSI art, we can use both foreground and background colors
  // Use darker colors for background, brighter for foreground
  const avgColor = (r + g + b) / 3;

  if (avgColor < 128) {
    // Dark pixel: use color as background, space or dark char as foreground
    return {
      char: char === ' ' ? ' ' : '▓',
      fgColor: 0, // Black foreground
      bgColor: colorIndex,
      rgb: [r, g, b]
    };
  } else {
    // Bright pixel: use color as foreground
    return {
      char,
      fgColor: colorIndex,
      bgColor: undefined,
      rgb: [r, g, b]
    };
  }
}

/**
 * Apply contrast and brightness adjustments
 */
export function adjustBrightness(value: number, contrast: number, brightness: number): number {
  // Apply contrast (1.0 = normal, >1.0 = more contrast, <1.0 = less contrast)
  let adjusted = ((value - 128) * contrast) + 128;
  
  // Apply brightness (-100 to +100)
  adjusted += brightness;
  
  return Math.max(0, Math.min(255, adjusted));
}

/**
 * Resize image data to target dimensions
 */
export function resizeImageData(
  imageData: ImageData,
  targetWidth: number,
  targetHeight: number
): ImageData {
  const { data, width, height } = imageData;
  const newData = new Uint8ClampedArray(targetWidth * targetHeight * 4);
  
  const scaleX = width / targetWidth;
  const scaleY = height / targetHeight;
  
  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const sourceX = Math.floor(x * scaleX);
      const sourceY = Math.floor(y * scaleY);
      
      const sourceIndex = (sourceY * width + sourceX) * 4;
      const targetIndex = (y * targetWidth + x) * 4;
      
      newData[targetIndex] = data[sourceIndex];     // R
      newData[targetIndex + 1] = data[sourceIndex + 1]; // G
      newData[targetIndex + 2] = data[sourceIndex + 2]; // B
      newData[targetIndex + 3] = data[sourceIndex + 3]; // A
    }
  }
  
  return {
    data: newData,
    width: targetWidth,
    height: targetHeight
  };
}

/**
 * Calculate target dimensions maintaining aspect ratio
 */
export function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  targetWidth: number,
  maintainAspectRatio: boolean,
  charAspectRatio: number = 0.5
): { width: number; height: number } {
  if (!maintainAspectRatio) {
    return { width: targetWidth, height: Math.floor(targetWidth * 0.5) }; // Default height
  }

  const imageAspectRatio = originalWidth / originalHeight;

  // To maintain the original image's aspect ratio in ASCII:
  // Since characters are taller than they are wide, we need to compensate
  // by reducing the height proportionally
  const targetHeight = Math.floor((targetWidth / imageAspectRatio) * charAspectRatio);

  return { width: targetWidth, height: targetHeight };
}

/**
 * Convert image data to ASCII/ANSI art
 */
export function convertToAscii(
  imageData: ImageData,
  options: ConversionOptions
): string | AnsiPixel[][] {
  const { width, asciiSet, contrast, brightness, artStyle, useColors, colorPalette, colorScheme } = options;
  const asciiChars = ASCII_SETS[asciiSet];

  // Invert brightness for black-on-white display
  const invertBrightness = colorScheme === 'black-on-white';

  // Calculate target dimensions
  const dimensions = calculateDimensions(
    imageData.width,
    imageData.height,
    width,
    options.maintainAspectRatio,
    options.charAspectRatio
  );

  // Resize image if needed
  const resizedData = resizeImageData(imageData, dimensions.width, dimensions.height);

  if (artStyle === 'ansi' && useColors) {
    // Return ANSI pixel array for colored output
    const ansiPixels: AnsiPixel[][] = [];

    for (let y = 0; y < dimensions.height; y++) {
      const row: AnsiPixel[] = [];
      for (let x = 0; x < dimensions.width; x++) {
        const index = (y * dimensions.width + x) * 4;
        let r = resizedData.data[index];
        let g = resizedData.data[index + 1];
        let b = resizedData.data[index + 2];

        // Apply brightness and contrast adjustments
        const avgBrightness = getPixelBrightness(r, g, b);
        const adjustedBrightness = adjustBrightness(avgBrightness, contrast, brightness);
        const brightnessFactor = adjustedBrightness / avgBrightness || 1;

        r = Math.max(0, Math.min(255, r * brightnessFactor));
        g = Math.max(0, Math.min(255, g * brightnessFactor));
        b = Math.max(0, Math.min(255, b * brightnessFactor));

        const ansiPixel = rgbToAnsiPixel(r, g, b, asciiChars, true, colorPalette, invertBrightness);
        row.push(ansiPixel);
      }
      ansiPixels.push(row);
    }

    return ansiPixels;
  } else {
    // Return plain ASCII string
    let ascii = '';

    for (let y = 0; y < dimensions.height; y++) {
      for (let x = 0; x < dimensions.width; x++) {
        const index = (y * dimensions.width + x) * 4;
        const r = resizedData.data[index];
        const g = resizedData.data[index + 1];
        const b = resizedData.data[index + 2];

        let pixelBrightness = getPixelBrightness(r, g, b);
        pixelBrightness = adjustBrightness(pixelBrightness, contrast, brightness);

        ascii += brightnessToAscii(pixelBrightness, asciiChars, invertBrightness);
      }
      ascii += '\n';
    }

    return ascii;
  }
}

/**
 * Load image from file and convert to ImageData
 */
export function loadImageFromFile(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      resolve(imageData);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}
