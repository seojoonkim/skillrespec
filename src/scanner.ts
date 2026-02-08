/**
 * Skill Scanner - Discovers skills in a directory
 */

import { readdir, stat, readFile } from 'fs/promises';
import { join } from 'path';
import type { Skill, ScanResult } from './types.js';

export async function scanSkills(directory: string): Promise<ScanResult> {
  const startTime = Date.now();
  const skills: Skill[] = [];

  try {
    const entries = await readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillPath = join(directory, entry.name);
        const skill = await parseSkill(skillPath, entry.name);
        if (skill) {
          skills.push(skill);
        }
      }
    }
  } catch (error) {
    // Directory might not exist yet
    console.error(`Could not scan directory: ${directory}`);
  }

  return {
    skills,
    totalCount: skills.length,
    scanTime: Date.now() - startTime,
  };
}

async function parseSkill(path: string, name: string): Promise<Skill | null> {
  try {
    // Look for SKILL.md or package.json
    const skillMdPath = join(path, 'SKILL.md');
    const pkgPath = join(path, 'package.json');

    let description: string | undefined;
    let version: string | undefined;
    let totalSize = 0;
    let skillMdContent = '';

    try {
      const pkgContent = await readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(pkgContent);
      description = pkg.description;
      version = pkg.version;
      totalSize += Buffer.byteLength(pkgContent, 'utf-8');
    } catch {
      // No package.json
    }

    try {
      skillMdContent = await readFile(skillMdPath, 'utf-8');
      totalSize += Buffer.byteLength(skillMdContent, 'utf-8');
      // Extract first line as description if no package.json
      if (!description) {
        const firstLine = skillMdContent.split('\n').find(l => l.trim() && !l.startsWith('#'));
        description = firstLine?.trim();
      }
    } catch {
      // No SKILL.md
    }

    // Calculate total directory size (approximation)
    const dirSize = await getDirectorySize(path);
    totalSize = Math.max(totalSize, dirSize);

    const stats = await stat(path);

    return {
      name,
      path,
      version,
      description,
      size: totalSize,
      estimatedTokens: Math.round(totalSize / 4), // ~4 chars per token approximation
      lastModified: stats.mtime,
    };
  } catch {
    return null;
  }
}

async function getDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0;
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = join(dirPath, entry.name);
      if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.json') || entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
        const stats = await stat(entryPath);
        totalSize += stats.size;
      } else if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        totalSize += await getDirectorySize(entryPath);
      }
    }
  } catch {
    // Ignore errors
  }
  return totalSize;
}

export function formatScanResult(result: ScanResult): string {
  const lines = [
    `📦 Found ${result.totalCount} skill(s) in ${result.scanTime}ms`,
    '',
  ];

  for (const skill of result.skills) {
    const version = skill.version ? `v${skill.version}` : '';
    lines.push(`  • ${skill.name} ${version}`);
    if (skill.description) {
      lines.push(`    ${skill.description}`);
    }
  }

  if (result.totalCount === 0) {
    lines.push('  (no skills found)');
  }

  return lines.join('\n');
}
