// Version comparison utilities for semver-style versions

export type UpdateType = 'major' | 'minor' | 'patch' | 'none';

export interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
  valid: boolean;
  original: string;
}

/**
 * Parse a version string like "1.2.3" or "v1.2.3" into components
 */
export function parseVersion(version: string): ParsedVersion {
  const cleaned = version.replace(/^v/i, '').trim();
  const match = cleaned.match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  
  if (!match) {
    return { major: 0, minor: 0, patch: 0, valid: false, original: version };
  }
  
  return {
    major: parseInt(match[1], 10) || 0,
    minor: parseInt(match[2], 10) || 0,
    patch: parseInt(match[3], 10) || 0,
    valid: true,
    original: version,
  };
}

/**
 * Compare two versions and determine the type of update needed
 * Returns 'none' if currentVersion >= latestVersion
 */
export function getUpdateType(currentVersion: string, latestVersion: string): UpdateType {
  const current = parseVersion(currentVersion);
  const latest = parseVersion(latestVersion);
  
  if (!current.valid || !latest.valid) {
    return 'none';
  }
  
  // Major update: 1.x.x → 2.x.x
  if (latest.major > current.major) {
    return 'major';
  }
  
  // Minor update: 1.0.x → 1.1.x
  if (latest.major === current.major && latest.minor > current.minor) {
    return 'minor';
  }
  
  // Patch update: 1.0.0 → 1.0.1
  if (
    latest.major === current.major && 
    latest.minor === current.minor && 
    latest.patch > current.patch
  ) {
    return 'patch';
  }
  
  return 'none';
}

/**
 * Check if an update is available
 */
export function hasUpdate(currentVersion?: string, latestVersion?: string): boolean {
  if (!currentVersion || !latestVersion) return false;
  return getUpdateType(currentVersion, latestVersion) !== 'none';
}

/**
 * Format version for display (ensures consistent format)
 */
export function formatVersion(version: string): string {
  const parsed = parseVersion(version);
  if (!parsed.valid) return version;
  return `v${parsed.major}.${parsed.minor}.${parsed.patch}`;
}

/**
 * Get update badge color based on update type
 */
export function getUpdateColor(updateType: UpdateType): {
  bg: string;
  text: string;
  label: string;
} {
  switch (updateType) {
    case 'major':
      return { 
        bg: 'rgba(255, 107, 107, 0.2)',  // Red background
        text: '#FF6B6B',                   // Red text
        label: 'Major Update',
      };
    case 'minor':
      return { 
        bg: 'rgba(255, 193, 7, 0.2)',     // Yellow background
        text: '#FFC107',                   // Yellow text
        label: 'Minor Update',
      };
    case 'patch':
      return { 
        bg: 'rgba(255, 235, 59, 0.15)',   // Light yellow background
        text: '#FFEB3B',                   // Light yellow text
        label: 'Patch Update',
      };
    default:
      return { 
        bg: 'transparent', 
        text: 'inherit',
        label: '',
      };
  }
}
