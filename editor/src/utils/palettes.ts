import type { Platform } from '../types';

export interface PaletteColor {
  index: number;
  name: string;
  hex: string;
  r: number;
  g: number;
  b: number;
  isTransparent?: boolean;
}

export const MSX_PALETTE: PaletteColor[] = [
  { index: 0, name: 'Transparent', hex: '#000000', r: 0, g: 0, b: 0, isTransparent: true },
  { index: 1, name: 'Black', hex: '#000000', r: 0, g: 0, b: 0 },
  { index: 2, name: 'Medium Green', hex: '#24db24', r: 36, g: 219, b: 36 },
  { index: 3, name: 'Light Green', hex: '#6dff6d', r: 109, g: 255, b: 109 },
  { index: 4, name: 'Dark Blue', hex: '#2424ff', r: 36, g: 36, b: 255 },
  { index: 5, name: 'Light Blue', hex: '#496dff', r: 73, g: 109, b: 255 },
  { index: 6, name: 'Dark Red', hex: '#b62424', r: 182, g: 36, b: 36 },
  { index: 7, name: 'Cyan', hex: '#49dbff', r: 73, g: 219, b: 255 },
  { index: 8, name: 'Medium Red', hex: '#ff2424', r: 255, g: 36, b: 36 },
  { index: 9, name: 'Light Red', hex: '#ff6d6d', r: 255, g: 109, b: 109 },
  { index: 10, name: 'Dark Yellow', hex: '#dbdb24', r: 219, g: 219, b: 36 },
  { index: 11, name: 'Light Yellow', hex: '#dbdb92', r: 219, g: 219, b: 146 },
  { index: 12, name: 'Dark Green', hex: '#249224', r: 36, g: 146, b: 36 },
  { index: 13, name: 'Magenta', hex: '#db49b6', r: 219, g: 73, b: 182 },
  { index: 14, name: 'Gray', hex: '#b6b6b6', r: 182, g: 182, b: 182 },
  { index: 15, name: 'White', hex: '#ffffff', r: 255, g: 255, b: 255 },
];

export const CPC_PALETTE: PaletteColor[] = [
  { index: 0, name: 'Black', hex: '#000000', r: 0, g: 0, b: 0 },
  { index: 1, name: 'Blue', hex: '#000055', r: 0, g: 0, b: 85 },
  { index: 2, name: 'Bright Blue', hex: '#0000ff', r: 0, g: 0, b: 255 },
  { index: 3, name: 'Red', hex: '#6d0000', r: 109, g: 0, b: 0 },
  { index: 4, name: 'Magenta', hex: '#6d0055', r: 109, g: 0, b: 85 },
  { index: 5, name: 'Mauve', hex: '#6d00ff', r: 109, g: 0, b: 255 },
  { index: 6, name: 'Bright Red', hex: '#ff0000', r: 255, g: 0, b: 0 },
  { index: 7, name: 'Purple', hex: '#ff0055', r: 255, g: 0, b: 85 },
  { index: 8, name: 'Bright Magenta', hex: '#ff00ff', r: 255, g: 0, b: 255 },
  { index: 9, name: 'Green', hex: '#006d00', r: 0, g: 109, b: 0 },
  { index: 10, name: 'Cyan', hex: '#006d55', r: 0, g: 109, b: 85 },
  { index: 11, name: 'Sky Blue', hex: '#006dff', r: 0, g: 109, b: 255 },
  { index: 12, name: 'Yellow', hex: '#6d6d00', r: 109, g: 109, b: 0 },
  { index: 13, name: 'White', hex: '#6d6d55', r: 109, g: 109, b: 85 },
  { index: 14, name: 'Pastel Blue', hex: '#6d6dff', r: 109, g: 109, b: 255 },
  { index: 15, name: 'Orange', hex: '#ff6d00', r: 255, g: 109, b: 0 },
  { index: 16, name: 'Pink', hex: '#ff6d55', r: 255, g: 109, b: 85 },
  { index: 17, name: 'Pastel Magenta', hex: '#ff6dff', r: 255, g: 109, b: 255 },
  { index: 18, name: 'Bright Green', hex: '#00ff00', r: 0, g: 255, b: 0 },
  { index: 19, name: 'Sea Green', hex: '#00ff55', r: 0, g: 255, b: 85 },
  { index: 20, name: 'Bright Cyan', hex: '#00ffff', r: 0, g: 255, b: 255 },
  { index: 21, name: 'Lime Green', hex: '#6dff00', r: 109, g: 255, b: 0 },
  { index: 22, name: 'Pastel Green', hex: '#6dff55', r: 109, g: 255, b: 85 },
  { index: 23, name: 'Pastel Cyan', hex: '#6dffff', r: 109, g: 255, b: 255 },
  { index: 24, name: 'Bright Yellow', hex: '#ffff00', r: 255, g: 255, b: 0 },
  { index: 25, name: 'Pastel Yellow', hex: '#ffff55', r: 255, g: 255, b: 85 },
  { index: 26, name: 'Bright White', hex: '#ffffff', r: 255, g: 255, b: 255 },
];

export function getPlatformPalette(platform: Platform): PaletteColor[] {
  if (platform === 'msx' || platform === 'msxmegarom' || platform === 'msx-wt') {
    return clonePalette(MSX_PALETTE);
  }
  return clonePalette(CPC_PALETTE);
}

export function clonePalette(palette: PaletteColor[]): PaletteColor[] {
  return palette.map(c => ({ ...c }));
}

export function getPlatformDefaultTolerance(platform: Platform): number {
  if (platform === 'msx' || platform === 'msxmegarom' || platform === 'msx-wt') {
    return 32;
  }
  return 64;
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace('#', '').trim();
  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0] + cleaned[0], 16);
    const g = parseInt(cleaned[1] + cleaned[1], 16);
    const b = parseInt(cleaned[2] + cleaned[2], 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  if (cleaned.length === 6) {
    const r = parseInt(cleaned.slice(0, 2), 16);
    const g = parseInt(cleaned.slice(2, 4), 16);
    const b = parseInt(cleaned.slice(4, 6), 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  return null;
}

/**
 * Checks if a color matches any color in the palette within the given per-channel tolerance,
 * matching the exact algorithm in PAKET.jar (CPCColors.java & MSXColors.java).
 */
export function isColorInPalette(
  r: number,
  g: number,
  b: number,
  palette: PaletteColor[],
  tolerance: number
): boolean {
  for (const color of palette) {
    if (color.isTransparent) continue;
    if (
      Math.abs(r - color.r) <= tolerance &&
      Math.abs(g - color.g) <= tolerance &&
      Math.abs(b - color.b) <= tolerance
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Finds the nearest palette color using standard Euclidean RGB distance.
 */
export function findNearestPaletteColor(
  r: number,
  g: number,
  b: number,
  palette: PaletteColor[]
): PaletteColor {
  const validColors = palette.filter(c => !c.isTransparent);
  if (validColors.length === 0) return palette[0];

  let bestColor = validColors[0];
  let minDistance = Infinity;

  for (const color of validColors) {
    const dr = r - color.r;
    const dg = g - color.g;
    const db = b - color.b;
    const dist = dr * dr + dg * dg + db * db;
    if (dist < minDistance) {
      minDistance = dist;
      bestColor = color;
    }
  }

  return bestColor;
}

