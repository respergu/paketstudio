import type { Platform } from '../types';

export interface ScreenAreaDef {
  x: number; // in tiles
  y: number; // in tiles
  width: number; // in tiles
  height: number; // in tiles
  pixelX: number;
  pixelY: number;
  pixelWidth: number;
  pixelHeight: number;
}

export interface ScreenGuidelines {
  screenWidth: number;
  screenHeight: number;
  tileWidth: number;
  tileHeight: number;
  textArea?: ScreenAreaDef;
  gameArea?: ScreenAreaDef;
  guiArea?: ScreenAreaDef;
}

/**
 * Checks if a given platform string represents an Amstrad CPC target.
 */
export function isCpcPlatform(platform?: string | null): boolean {
  if (!platform) return false;
  return platform.toLowerCase().startsWith('cpc');
}

/**
 * Parses screen division guidelines from .pak source text, falling back
 * to standard defaults for MSX or CPC.
 */
export function getScreenGuidelines(
  platform: Platform,
  pakTexts: string[] = [],
  mapTileWidth = 8,
  mapTileHeight = 8
): ScreenGuidelines {
  const isCpc = isCpcPlatform(platform);

  const screenWidth = isCpc ? 128 : 256;
  const screenHeight = isCpc ? 192 : 192;
  const tileWidth = mapTileWidth || 8;
  const tileHeight = mapTileHeight || 8;

  let textMatch: RegExpMatchArray | null = null;
  let gameMatch: RegExpMatchArray | null = null;
  let guiMatch: RegExpMatchArray | null = null;

  for (const text of pakTexts) {
    if (!text) continue;
    if (!textMatch) {
      textMatch = text.match(/text-area\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
    }
    if (!gameMatch) {
      gameMatch = text.match(/game-area\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
    }
    if (!guiMatch) {
      guiMatch = text.match(/gui\s*\(\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*"[^"]*")?\s*\)/i);
    }
    if (textMatch && gameMatch && guiMatch) break;
  }

  // Text Area
  let textArea: ScreenAreaDef;
  if (textMatch) {
    const tx = parseInt(textMatch[1], 10);
    const ty = parseInt(textMatch[2], 10);
    const tw = parseInt(textMatch[3], 10);
    const th = parseInt(textMatch[4], 10);
    textArea = {
      x: tx,
      y: ty,
      width: tw,
      height: th,
      pixelX: tx * tileWidth,
      pixelY: ty * tileHeight,
      pixelWidth: tw * tileWidth,
      pixelHeight: th * tileHeight,
    };
  } else {
    const defaultCols = isCpc ? 16 : 32;
    textArea = {
      x: 0,
      y: 0,
      width: defaultCols,
      height: 5,
      pixelX: 0,
      pixelY: 0,
      pixelWidth: defaultCols * tileWidth,
      pixelHeight: 5 * tileHeight,
    };
  }

  // Game Area
  let gameArea: ScreenAreaDef;
  if (gameMatch) {
    const gx = parseInt(gameMatch[1], 10);
    const gy = parseInt(gameMatch[2], 10);
    const gw = parseInt(gameMatch[3], 10);
    const gh = parseInt(gameMatch[4], 10);
    gameArea = {
      x: gx,
      y: gy,
      width: gw,
      height: gh,
      pixelX: gx * tileWidth,
      pixelY: gy * tileHeight,
      pixelWidth: gw * tileWidth,
      pixelHeight: gh * tileHeight,
    };
  } else {
    const defaultCols = isCpc ? 16 : 32;
    gameArea = {
      x: 0,
      y: 6,
      width: defaultCols,
      height: 11,
      pixelX: 0,
      pixelY: 6 * tileHeight,
      pixelWidth: defaultCols * tileWidth,
      pixelHeight: 11 * tileHeight,
    };
  }

  // GUI Area
  let guiArea: ScreenAreaDef;
  if (guiMatch) {
    const ux = parseInt(guiMatch[1], 10);
    const uy = parseInt(guiMatch[2], 10);
    const defaultCols = isCpc ? 16 : 32;
    const uh = Math.max(1, Math.round(screenHeight / tileHeight) - uy);
    guiArea = {
      x: ux,
      y: uy,
      width: defaultCols,
      height: uh,
      pixelX: ux * tileWidth,
      pixelY: uy * tileHeight,
      pixelWidth: defaultCols * tileWidth,
      pixelHeight: uh * tileHeight,
    };
  } else {
    const defaultCols = isCpc ? 16 : 32;
    guiArea = {
      x: 0,
      y: 18,
      width: defaultCols,
      height: 6,
      pixelX: 0,
      pixelY: 18 * tileHeight,
      pixelWidth: defaultCols * tileWidth,
      pixelHeight: 6 * tileHeight,
    };
  }

  return {
    screenWidth,
    screenHeight,
    tileWidth,
    tileHeight,
    textArea,
    gameArea,
    guiArea,
  };
}

