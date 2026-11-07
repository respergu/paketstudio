import type {
  PakItem,
  PakObject,
  PakObjectState,
  PakImageRef,
  PakAnimationRef,
  PakRoom
} from '../types';

/**
 * Parses a comma-separated argument list, respecting double and single quotes.
 */
export function parseArgs(raw: string): string[] {
  const args: string[] = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';

  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (inQuote) {
      if (c === quoteChar) {
        inQuote = false;
      }
      current += c;
    } else {
      if (c === '"' || c === "'") {
        inQuote = true;
        quoteChar = c;
        current += c;
      } else if (c === ',') {
        args.push(current.trim());
        current = '';
      } else {
        current += c;
      }
    }
  }

  if (current.trim().length > 0) {
    args.push(current.trim());
  }

  return args;
}

/**
 * Strips surrounding double or single quotes if present.
 */
export function stripQuotes(s: string): string {
  const trimmed = s.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

/**
 * Measures the leading whitespace indentation of a line, treating tabs as 4 spaces.
 */
function getIndentation(line: string): number {
  const match = line.match(/^([ \t]*)/);
  if (!match) return 0;
  let indent = 0;
  for (const ch of match[1]) {
    indent += ch === '\t' ? 4 : 1;
  }
  return indent;
}

/**
 * Parses image("path.png") or image("path.png", x1, y1, x2, y2)
 */
export function parseImageDirective(line: string): PakImageRef | undefined {
  const match = line.match(/^image\s*\((.*?)\)/i);
  if (!match) return undefined;

  const args = parseArgs(match[1]);
  if (args.length === 0) return undefined;

  const file = stripQuotes(args[0]);
  if (!file) return undefined;

  if (args.length >= 5) {
    const x1 = parseInt(args[1], 10) || 0;
    const y1 = parseInt(args[2], 10) || 0;
    const x2 = parseInt(args[3], 10) || 0;
    const y2 = parseInt(args[4], 10) || 0;
    return { file, x1, y1, x2, y2 };
  }

  return { file, x1: 0, y1: 0 };
}

export interface ParseResult {
  items: PakItem[];
  objects: PakObject[];
  rooms: PakRoom[];
  errors: Array<{ line: number; message: string }>;
}

/**
 * Tolerant block parser for .pak files.
 * Extracts items, objects, and rooms while isolating syntax errors and preserving rule bodies.
 */
export function parsePakFile(content: string, filePath: string): ParseResult {
  const lines = content.split(/\r?\n/);
  const items: PakItem[] = [];
  const objects: PakObject[] = [];
  const rooms: PakRoom[] = [];
  const errors: Array<{ line: number; message: string }> = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines and comment lines
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) {
      i++;
      continue;
    }

    const indent = getIndentation(line);

    // Only inspect top-level definitions
    if (indent === 0) {
      const itemMatch = line.match(/^item\s*\((.*)\)\s*:/i);
      const objectMatch = line.match(/^object\s*\((.*)\)\s*:/i);
      const roomMatch = line.match(/^room\s*\((.*)\)\s*:/i);

      if (itemMatch) {
        const startLine = i;
        const rawArgs = itemMatch[1];
        const args = parseArgs(rawArgs);

        if (args.length < 3) {
          errors.push({
            line: startLine + 1,
            message: `Malformed item declaration on line ${startLine + 1}`
          });
        }

        const id = stripQuotes(args[0] || 'unknown-item');
        const name = stripQuotes(args[1] || id);
        const description = stripQuotes(args[2] || '');

        i++;
        let lastContentLine = startLine;
        const blockLines: string[] = [];

        // Collect indented child lines of this item
        while (i < lines.length) {
          const childLine = lines[i];
          const childTrimmed = childLine.trim();

          if (!childTrimmed) {
            blockLines.push(childLine);
            i++;
            continue;
          }

          if (getIndentation(childLine) > 0) {
            lastContentLine = i;
            blockLines.push(childLine);
            i++;
          } else {
            break;
          }
        }

        // Parse item body lines
        let image: PakImageRef | undefined = undefined;
        let defaultUseMessage: string | undefined = undefined;
        const rules: string[] = [];

        for (const child of blockLines) {
          const t = child.trim();
          if (!t || t.startsWith('#') || t.startsWith(';')) continue;

          if (t.toLowerCase().startsWith('image(')) {
            const img = parseImageDirective(t);
            if (img) image = img;
          } else if (t.toLowerCase().startsWith('default-use-message(')) {
            const msgMatch = t.match(/^default-use-message\s*\((.*)\)/i);
            if (msgMatch) {
              const msgArgs = parseArgs(msgMatch[1]);
              if (msgArgs.length > 0) {
                defaultUseMessage = stripQuotes(msgArgs[0]);
              }
            }
          } else {
            // Keep rules or unparsed lines, preserving indentation
            rules.push(child);
          }
        }

        const endLine = lastContentLine;

        items.push({
          id,
          name,
          description,
          image,
          defaultUseMessage,
          rules,
          filePath,
          startLine,
          endLine
        });
        continue;
      }

      if (objectMatch) {
        const startLine = i;
        const rawArgs = objectMatch[1];
        const args = parseArgs(rawArgs);

        if (args.length < 3) {
          errors.push({
            line: startLine + 1,
            message: `Malformed object declaration on line ${startLine + 1}`
          });
        }

        const id = stripQuotes(args[0] || 'unknown-object');
        const name = stripQuotes(args[1] || id);
        const description = stripQuotes(args[2] || '');

        i++;
        let lastContentLine = startLine;
        const blockLines: Array<{ lineIndex: number; text: string }> = [];

        while (i < lines.length) {
          const childLine = lines[i];
          const childTrimmed = childLine.trim();

          if (!childTrimmed) {
            i++;
            continue;
          }

          if (getIndentation(childLine) > 0) {
            lastContentLine = i;
            blockLines.push({ lineIndex: i, text: childLine });
            i++;
          } else {
            break;
          }
        }

        const states: PakObjectState[] = [];
        const objectRules: string[] = [];
        const directImages: PakImageRef[] = [];

        let stateIdx = 0;
        while (stateIdx < blockLines.length) {
          const item = blockLines[stateIdx];
          const t = item.text.trim();

          const stateMatch = t.match(/^state\s*\((.*?)\)\s*:/i);
          if (stateMatch) {
            const stateArgs = parseArgs(stateMatch[1]);
            const stateName = stripQuotes(stateArgs[0] || 'idle');
            const direction = stripQuotes(stateArgs[1] || 'front');

            stateIdx++;
            let stateImage: PakImageRef | undefined = undefined;
            let stateAnimation: PakAnimationRef | undefined = undefined;
            const collisionMask: string[] = [];
            let selectionType: 'pixel' | 'box' | 'none' | undefined = undefined;
            const stateRules: string[] = [];

            while (stateIdx < blockLines.length) {
              const subItem = blockLines[stateIdx];
              const subTrimmed = subItem.text.trim();
              const subIndent = getIndentation(subItem.text);

              // State directives are indented further than state(...)
              if (subIndent <= getIndentation(item.text)) {
                break;
              }

              if (subTrimmed.toLowerCase().startsWith('image(')) {
                const img = parseImageDirective(subTrimmed);
                if (img) stateImage = img;
              } else if (subTrimmed.toLowerCase().startsWith('animation(')) {
                const animMatch = subTrimmed.match(/^animation\s*\((.*?)\)\s*:/i);
                if (animMatch) {
                  const animArgs = parseArgs(animMatch[1]);
                  const speed = parseInt(animArgs[0], 10) || 10;
                  const loop = parseInt(animArgs[1], 10) || 0;
                  const sequence = animArgs.length > 2 ? animArgs.slice(1).map(s => parseInt(s, 10) || 0) : undefined;
                  const frames: PakImageRef[] = [];

                  stateIdx++;
                  while (stateIdx < blockLines.length) {
                    const animFrame = blockLines[stateIdx];
                    const frameTrimmed = animFrame.text.trim();
                    if (getIndentation(animFrame.text) <= subIndent) {
                      break;
                    }
                    if (frameTrimmed.toLowerCase().startsWith('image(')) {
                      const fImg = parseImageDirective(frameTrimmed);
                      if (fImg) frames.push(fImg);
                    } else if (frameTrimmed.toLowerCase().startsWith('collisionmask(')) {
                      const maskMatch = frameTrimmed.match(/^collisionmask\s*\((.*?)\)/i);
                      if (maskMatch) {
                        const maskArgs = parseArgs(maskMatch[1]);
                        for (const m of maskArgs) {
                          collisionMask.push(stripQuotes(m));
                        }
                      }
                    } else if (frameTrimmed.toLowerCase().startsWith('selection(') || frameTrimmed.toLowerCase().startsWith('selection-type(')) {
                      const selMatch = frameTrimmed.match(/^(?:selection|selection-type)\s*\((.*?)\)/i);
                      if (selMatch) {
                        const selArgs = parseArgs(selMatch[1]);
                        const val = stripQuotes(selArgs[0]).toLowerCase();
                        if (val === 'pixel' || val === 'box' || val === 'none') {
                          selectionType = val;
                        }
                      }
                    }
                    stateIdx++;
                  }
                  stateAnimation = { speed, loop, sequence, frames };
                  continue;
                }
              } else if (subTrimmed.toLowerCase().startsWith('collisionmask(')) {
                const maskMatch = subTrimmed.match(/^collisionmask\s*\((.*?)\)/i);
                if (maskMatch) {
                  const maskArgs = parseArgs(maskMatch[1]);
                  for (const m of maskArgs) {
                    collisionMask.push(stripQuotes(m));
                  }
                }
              } else if (subTrimmed.toLowerCase().startsWith('selection(') || subTrimmed.toLowerCase().startsWith('selection-type(')) {
                const selMatch = subTrimmed.match(/^(?:selection|selection-type)\s*\((.*?)\)/i);
                if (selMatch) {
                  const selArgs = parseArgs(selMatch[1]);
                  const val = stripQuotes(selArgs[0]).toLowerCase();
                  if (val === 'pixel' || val === 'box' || val === 'none') {
                    selectionType = val;
                  }
                }
              } else {
                stateRules.push(subItem.text);
              }

              stateIdx++;
            }

            if (!stateImage && stateAnimation && stateAnimation.frames.length > 0) {
              stateImage = stateAnimation.frames[0];
            }

            states.push({
              name: stateName,
              direction,
              image: stateImage,
              animation: stateAnimation,
              collisionMask: collisionMask.length > 0 ? collisionMask : undefined,
              selectionType,
              rules: stateRules
            });
            continue;
          }

          // Non-state child line of object (e.g. object-level rule or direct image)
          if (!t.startsWith('#') && !t.startsWith(';')) {
            if (t.toLowerCase().startsWith('image(')) {
              const img = parseImageDirective(t);
              if (img) directImages.push(img);
            } else {
              objectRules.push(item.text);
            }
          }
          stateIdx++;
        }

        if (states.length === 0 && directImages.length > 0) {
          states.push({
            name: 'idle',
            direction: 'front',
            image: directImages[0],
            rules: []
          });
        }

        const endLine = lastContentLine;
        objects.push({
          id,
          name,
          description,
          states,
          rules: objectRules,
          filePath,
          startLine,
          endLine
        });
        continue;
      }

      if (roomMatch) {
        const startLine = i;
        const rawArgs = roomMatch[1];
        const args = parseArgs(rawArgs);

        if (args.length < 4) {
          errors.push({
            line: startLine + 1,
            message: `Malformed room declaration on line ${startLine + 1}`
          });
        }

        const id = stripQuotes(args[0] || 'unknown-room');
        const tmxFile = stripQuotes(args[1] || '');
        const x = parseInt(args[2], 10) || 0;
        const y = parseInt(args[3], 10) || 0;
        let subroom = false;

        for (let a = 4; a < args.length; a++) {
          const mod = stripQuotes(args[a]).toLowerCase();
          if (mod === 'subroom') {
            subroom = true;
          }
        }

        i++;
        let lastContentLine = startLine;
        const rules: string[] = [];

        while (i < lines.length) {
          const childLine = lines[i];
          const childTrimmed = childLine.trim();

          if (!childTrimmed) {
            i++;
            continue;
          }

          if (getIndentation(childLine) > 0) {
            lastContentLine = i;
            rules.push(childLine);
            i++;
          } else {
            break;
          }
        }

        rooms.push({
          id,
          tmxFile,
          x,
          y,
          subroom: subroom || undefined,
          rules,
          filePath,
          startLine,
          endLine: lastContentLine
        });
        continue;
      }
    }

    i++;
  }

  return { items, objects, rooms, errors };
}

/**
 * Generates formatted PAKET code for an Item declaration.
 */
export function generateItemBlock(item: PakItem): string {
  const lines: string[] = [];
  // Identifiers containing hyphens or starting with letter can be bare or quoted
  const idStr = item.id.includes(' ') ? `"${item.id}"` : item.id;
  lines.push(`item(${idStr}, "${item.name}", "${item.description}"):`);

  if (item.image) {
    if (item.image.x2 !== undefined && item.image.y2 !== undefined) {
      lines.push(`    image("${item.image.file}", ${item.image.x1}, ${item.image.y1}, ${item.image.x2}, ${item.image.y2})`);
    } else {
      lines.push(`    image("${item.image.file}")`);
    }
  }
  if (item.defaultUseMessage) {
    lines.push(`    default-use-message("${item.defaultUseMessage}")`);
  }
  if (item.rules && item.rules.length > 0) {
    for (const r of item.rules) {
      lines.push(r.startsWith('    ') ? r : `    ${r}`);
    }
  }

  return lines.join('\n');
}

/**
 * Generates formatted PAKET code for an Object declaration.
 */
export function generateObjectBlock(obj: PakObject): string {
  const lines: string[] = [];
  lines.push(`object("${obj.id}", "${obj.name}", "${obj.description}"):`);

  for (const s of obj.states) {
    lines.push(`    state("${s.name}", "${s.direction}"):`);
    if (s.image) {
      if (s.image.x2 !== undefined && s.image.y2 !== undefined) {
        lines.push(`        image("${s.image.file}", ${s.image.x1}, ${s.image.y1}, ${s.image.x2}, ${s.image.y2})`);
      } else {
        lines.push(`        image("${s.image.file}")`);
      }
    } else if (s.animation) {
      const seqStr = s.animation.sequence ? s.animation.sequence.join(', ') : `${s.animation.loop}, ${s.animation.frames.length}`;
      lines.push(`        animation(${s.animation.speed}, ${seqStr}):`);
      for (const f of s.animation.frames) {
        if (f.x2 !== undefined && f.y2 !== undefined) {
          lines.push(`            image("${f.file}", ${f.x1}, ${f.y1}, ${f.x2}, ${f.y2})`);
        } else {
          lines.push(`            image("${f.file}")`);
        }
      }
    }
    if (s.collisionMask && s.collisionMask.length > 0) {
      const masks = s.collisionMask.map(m => `"${m}"`).join(', ');
      lines.push(`        collisionmask(${masks})`);
    }
    if (s.selectionType) {
      lines.push(`        selection(${s.selectionType})`);
    }
    if (s.rules && s.rules.length > 0) {
      for (const r of s.rules) {
        lines.push(r.startsWith('        ') ? r : `        ${r}`);
      }
    }
  }

  if (obj.rules && obj.rules.length > 0) {
    for (const r of obj.rules) {
      lines.push(r.startsWith('    ') ? r : `    ${r}`);
    }
  }

  return lines.join('\n');
}

/**
 * Inserts a new item after the last existing item in content, or appends at the end.
 */
export function insertItemIntoContent(content: string, item: PakItem): string {
  const { items } = parsePakFile(content, item.filePath);
  const blockText = generateItemBlock(item);

  if (items.length > 0) {
    // Find the last item by endLine
    let maxEndLine = -1;
    for (const it of items) {
      if (it.endLine > maxEndLine) {
        maxEndLine = it.endLine;
      }
    }
    const lines = content.split(/\r?\n/);
    lines.splice(maxEndLine + 1, 0, '', blockText);
    return lines.join('\n');
  }

  // If no items exist, append at the end of the file with clean separation
  const trimmed = content.trimEnd();
  return trimmed ? `${trimmed}\n\n${blockText}\n` : `${blockText}\n`;
}

/**
 * Updates an existing item block in content by replacing its line range.
 */
export function updateItemInContent(content: string, item: PakItem, targetId: string): string {
  const { items } = parsePakFile(content, item.filePath);
  const matched = items.find(it => it.id === targetId);

  const startLine = matched ? matched.startLine : item.startLine;
  const endLine = matched ? matched.endLine : item.endLine;

  const lines = content.split(/\r?\n/);
  const blockText = generateItemBlock(item);
  const blockLines = blockText.split('\n');

  if (startLine >= 0 && endLine >= startLine && startLine < lines.length) {
    lines.splice(startLine, endLine - startLine + 1, ...blockLines);
    return lines.join('\n');
  }

  // Fallback if line range was invalid
  return insertItemIntoContent(content, item);
}

/**
 * Deletes an item declaration block from content.
 */
export function deleteItemFromContent(content: string, targetId: string, filePath: string): string {
  const { items } = parsePakFile(content, filePath);
  const matched = items.find(it => it.id === targetId);
  if (!matched) return content;

  const lines = content.split(/\r?\n/);
  let count = matched.endLine - matched.startLine + 1;
  if (matched.startLine + count < lines.length && lines[matched.startLine + count].trim() === '') {
    count++;
  }
  lines.splice(matched.startLine, count);
  return lines.join('\n');
}

/**
 * Inserts a new object after the last existing object in content, or appends at the end.
 */
export function insertObjectIntoContent(content: string, obj: PakObject): string {
  const { objects } = parsePakFile(content, obj.filePath);
  const blockText = generateObjectBlock(obj);

  if (objects.length > 0) {
    let maxEndLine = -1;
    for (const o of objects) {
      if (o.endLine > maxEndLine) {
        maxEndLine = o.endLine;
      }
    }
    const lines = content.split(/\r?\n/);
    lines.splice(maxEndLine + 1, 0, '', blockText);
    return lines.join('\n');
  }

  const trimmed = content.trimEnd();
  return trimmed ? `${trimmed}\n\n${blockText}\n` : `${blockText}\n`;
}

/**
 * Updates an existing object block in content by replacing its line range.
 */
export function updateObjectInContent(content: string, obj: PakObject, targetId: string): string {
  const { objects } = parsePakFile(content, obj.filePath);
  const matched = objects.find(o => o.id === targetId);

  const startLine = matched ? matched.startLine : obj.startLine;
  const endLine = matched ? matched.endLine : obj.endLine;

  const lines = content.split(/\r?\n/);
  const blockText = generateObjectBlock(obj);
  const blockLines = blockText.split('\n');

  if (startLine >= 0 && endLine >= startLine && startLine < lines.length) {
    lines.splice(startLine, endLine - startLine + 1, ...blockLines);
    return lines.join('\n');
  }

  return insertObjectIntoContent(content, obj);
}

/**
 * Deletes an object declaration block from content.
 */
export function deleteObjectFromContent(content: string, targetId: string, filePath: string): string {
  const { objects } = parsePakFile(content, filePath);
  const matched = objects.find(o => o.id === targetId);
  if (!matched) return content;

  const lines = content.split(/\r?\n/);
  let count = matched.endLine - matched.startLine + 1;
  if (matched.startLine + count < lines.length && lines[matched.startLine + count].trim() === '') {
    count++;
  }
  lines.splice(matched.startLine, count);
  return lines.join('\n');
}

/**
 * Generates formatted PAKET code for a Room declaration.
 */
export function generateRoomBlock(room: PakRoom): string {
  const lines: string[] = [];
  const idStr = room.id.includes(' ') ? `"${room.id}"` : room.id;
  const tmxStr = `"${room.tmxFile}"`;
  const subroomStr = room.subroom ? ', subroom' : '';
  lines.push(`room(${idStr}, ${tmxStr}, ${room.x}, ${room.y}${subroomStr}):`);

  if (room.rules && room.rules.length > 0) {
    for (const r of room.rules) {
      lines.push(r.startsWith('    ') ? r : `    ${r}`);
    }
  }

  return lines.join('\n');
}

/**
 * Inserts a new room after the last existing room in content, or appends at the end.
 */
export function insertRoomIntoContent(content: string, room: PakRoom): string {
  const { rooms } = parsePakFile(content, room.filePath);
  const blockText = generateRoomBlock(room);

  if (rooms.length > 0) {
    let maxEndLine = -1;
    for (const r of rooms) {
      if (r.endLine > maxEndLine) {
        maxEndLine = r.endLine;
      }
    }
    const lines = content.split(/\r?\n/);
    lines.splice(maxEndLine + 1, 0, '', blockText);
    return lines.join('\n');
  }

  const trimmed = content.trimEnd();
  return trimmed ? `${trimmed}\n\n${blockText}\n` : `${blockText}\n`;
}

/**
 * Updates an existing room declaration block in content by replacing its line range.
 */
export function updateRoomInContent(content: string, room: PakRoom, targetId: string): string {
  const { rooms } = parsePakFile(content, room.filePath);
  const matched = rooms.find(r => r.id === targetId);

  const startLine = matched ? matched.startLine : room.startLine;
  const endLine = matched ? matched.endLine : room.endLine;

  const lines = content.split(/\r?\n/);
  const blockText = generateRoomBlock(room);
  const blockLines = blockText.split('\n');

  if (startLine >= 0 && endLine >= startLine && startLine < lines.length) {
    lines.splice(startLine, endLine - startLine + 1, ...blockLines);
    return lines.join('\n');
  }

  return insertRoomIntoContent(content, room);
}

/**
 * Deletes a room declaration block from content.
 */
export function deleteRoomFromContent(content: string, targetId: string, filePath: string): string {
  const { rooms } = parsePakFile(content, filePath);
  const matched = rooms.find(r => r.id === targetId);
  if (!matched) return content;

  const lines = content.split(/\r?\n/);
  let count = matched.endLine - matched.startLine + 1;
  if (matched.startLine + count < lines.length && lines[matched.startLine + count].trim() === '') {
    count++;
  }
  lines.splice(matched.startLine, count);
  return lines.join('\n');
}

export interface ParsedCustomPalette {
  platform: 'cpc' | 'msx';
  colors: Array<{ r: number; g: number; b: number }>;
  tolerance?: number;
  filePath: string;
  startLine: number;
  endLine: number;
}

/**
 * Parses any cpc-rgb-palette: or msx-screen2-rgb-palette: directive and palette-rgb-tolerance(N)
 * defined in a .pak file.
 */
export function parseCustomPaletteFromContent(content: string, filePath: string): ParsedCustomPalette | null {
  const lines = content.split(/\r?\n/);
  let tolerance: number | undefined = undefined;

  for (const line of lines) {
    const tolMatch = line.match(/^\s*palette-rgb-tolerance\s*\(\s*(\d+)\s*\)/i);
    if (tolMatch) {
      tolerance = parseInt(tolMatch[1], 10);
      break;
    }
  }

  let palStart = -1;
  let detectedPlatform: 'cpc' | 'msx' | null = null;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (/^cpc-rgb-palette\s*:/i.test(trimmed)) {
      palStart = i;
      detectedPlatform = 'cpc';
      break;
    } else if (/^msx-screen2-rgb-palette\s*:/i.test(trimmed)) {
      palStart = i;
      detectedPlatform = 'msx';
      break;
    }
  }

  if (palStart === -1 || !detectedPlatform) {
    return null;
  }

  const expectedCount = detectedPlatform === 'cpc' ? 27 : 16;
  const colors: Array<{ r: number; g: number; b: number }> = [];
  let endLine = palStart;

  for (let i = palStart + 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Skip empty lines and comment lines
    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#')) {
      continue;
    }

    // If we hit another section/directive keyword like "room:", stop
    if (trimmed.includes(':') && !trimmed.includes(',')) {
      break;
    }

    const parts = trimmed.split(',').map(s => parseInt(s.trim(), 10));
    if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      colors.push({
        r: Math.max(0, Math.min(255, parts[0])),
        g: Math.max(0, Math.min(255, parts[1])),
        b: Math.max(0, Math.min(255, parts[2]))
      });
      endLine = i;
      if (colors.length >= expectedCount) {
        break;
      }
    }
  }

  return {
    platform: detectedPlatform,
    colors,
    tolerance,
    filePath,
    startLine: palStart,
    endLine
  };
}

/**
 * Updates or appends a custom palette block in .pak file content.
 */
export function updateCustomPaletteInContent(
  content: string,
  platform: 'cpc' | 'cpc6128' | 'msx' | 'msxmegarom' | 'msx-wt',
  colors: Array<{ r: number; g: number; b: number }>,
  tolerance?: number
): string {
  const isMsx = platform.startsWith('msx');
  const directive = isMsx ? 'msx-screen2-rgb-palette:' : 'cpc-rgb-palette:';

  const blockLines: string[] = [];
  if (tolerance !== undefined) {
    blockLines.push(`palette-rgb-tolerance(${tolerance})`);
  }
  blockLines.push(directive);
  for (const c of colors) {
    blockLines.push(`  ${c.r}, ${c.g}, ${c.b}`);
  }

  const lines = content.split(/\r?\n/);

  // Check if an existing tolerance directive exists to replace/remove
  let existingTolLine = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*palette-rgb-tolerance\s*\(/i.test(lines[i])) {
      existingTolLine = i;
      break;
    }
  }

  // Check if an existing palette block exists
  let palStart = -1;
  let palEnd = -1;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (/^(cpc-rgb-palette|msx-screen2-rgb-palette)\s*:/i.test(trimmed)) {
      palStart = i;
      palEnd = i;
      for (let j = i + 1; j < lines.length; j++) {
        const nextTrimmed = lines[j].trim();
        if (!nextTrimmed) continue;
        if (nextTrimmed.includes(':') && !nextTrimmed.includes(',')) break;
        if (nextTrimmed.split(',').length >= 3) {
          palEnd = j;
        }
      }
      break;
    }
  }

  if (palStart !== -1) {
    // If tolerance was right before palette, include it in replacement range
    let replaceStart = palStart;
    if (existingTolLine === palStart - 1) {
      replaceStart = existingTolLine;
    } else if (existingTolLine !== -1) {
      // Remove tolerance line separately if it was elsewhere
      lines.splice(existingTolLine, 1);
      if (existingTolLine < palStart) {
        palStart--;
        palEnd--;
        replaceStart = palStart;
      }
    }

    lines.splice(replaceStart, palEnd - replaceStart + 1, ...blockLines);
    return lines.join('\n');
  }

  // If no palette block existed, remove lone tolerance line if any
  if (existingTolLine !== -1) {
    lines.splice(existingTolLine, 1);
  }

  // Append to the end
  const trimmedContent = content.trimEnd();
  return trimmedContent + '\n\n' + blockLines.join('\n') + '\n';
}

/**
 * Removes any custom palette directives from content, restoring default platform colors.
 */
export function removeCustomPaletteFromContent(content: string): string {
  const lines = content.split(/\r?\n/);
  const result: string[] = [];
  let inPaletteBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (/^\s*palette-rgb-tolerance\s*\(/i.test(trimmed)) {
      continue;
    }

    if (/^(cpc-rgb-palette|msx-screen2-rgb-palette)\s*:/i.test(trimmed)) {
      inPaletteBlock = true;
      continue;
    }

    if (inPaletteBlock) {
      if (trimmed.includes(':') && !trimmed.includes(',')) {
        inPaletteBlock = false;
        result.push(line);
      } else if (trimmed.split(',').length >= 3) {
        continue;
      } else if (!trimmed) {
        continue;
      } else {
        inPaletteBlock = false;
        result.push(line);
      }
    } else {
      result.push(line);
    }
  }

  return result.join('\n');
}
