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

    try {
      const pkgContent = await readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(pkgContent);
      description = pkg.description;
      version = pkg.version;
    } catch {
      // No package.json
    }

    try {
      const skillMd = await readFile(skillMdPath, 'utf-8');
      // Extract first line as description if no package.json
      if (!description) {
        const firstLine = skillMd.split('\n').find(l => l.trim() && !l.startsWith('#'));
        description = firstLine?.trim();
      }
    } catch {
      // No SKILL.md
    }

    const stats = await stat(path);

    return {
      name,
      path,
      version,
      description,
      lastModified: stats.mtime,
    };
  } catch {
    return null;
  }
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
