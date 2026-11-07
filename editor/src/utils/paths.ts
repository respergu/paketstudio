/**
 * Normalizes a file or folder path by converting backslashes to forward slashes,
 * collapsing duplicate slashes, and removing trailing slashes (except root '/').
 */
export function normalizePath(p: string | null | undefined): string {
  if (!p) return '';
  const converted = p.replace(/\\/g, '/').replace(/\/+/g, '/');
  if (converted.length > 1 && converted.endsWith('/')) {
    return converted.slice(0, -1);
  }
  return converted;
}

/**
 * Checks if two paths are equivalent, taking into account path separators,
 * double slashes, trailing slashes, and case-insensitivity.
 */
export function isSamePath(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return normalizePath(a).toLowerCase() === normalizePath(b).toLowerCase();
}

