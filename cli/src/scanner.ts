// ═══════════════════════════════════════════════════════════
// Skill Scanner - Read and parse SKILL.md files
// ═══════════════════════════════════════════════════════════

import { readdir, readFile, stat } from 'fs/promises';
import { join, basename } from 'path';

export interface ScannedSkill {
  id: string;
  name: string;
  path: string;
  version?: string;
  category?: string;
  description?: string;
  permissions?: string[];
  tokens?: number;
  files: string[];
}

/**
 * Scan a skills directory for SKILL.md files
 */
export async function scanSkillsFolder(skillsPath: string): Promise<ScannedSkill[]> {
  const skills: ScannedSkill[] = [];
  
  try {
    const entries = await readdir(skillsPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith('.')) continue; // Skip hidden folders
      
      const skillPath = join(skillsPath, entry.name);
      const skill = await scanSkill(skillPath, entry.name);
      
      if (skill) {
        skills.push(skill);
      }
    }
  } catch (error) {
    console.error(`Error scanning ${skillsPath}:`, error);
  }
  
  return skills;
}

/**
 * Scan a single skill directory
 */
async function scanSkill(skillPath: string, id: string): Promise<ScannedSkill | null> {
  try {
    const files = await readdir(skillPath);
    
    // Look for SKILL.md
    const skillMdFile = files.find(f => 
      f.toLowerCase() === 'skill.md' || 
      f.toLowerCase() === 'readme.md'
    );
    
    let skillMd = '';
    if (skillMdFile) {
      skillMd = await readFile(join(skillPath, skillMdFile), 'utf-8');
    }
    
    // Parse SKILL.md content
    const parsed = parseSkillMd(skillMd);
    
    // Count tokens (rough estimate: ~4 chars per token)
    const totalTokens = await estimateTokens(skillPath, files);
    
    return {
      id,
      name: parsed.name || formatName(id),
      path: skillPath,
      version: parsed.version,
      category: parsed.category || inferCategory(id, skillMd),
      description: parsed.description,
      permissions: parsed.permissions,
      tokens: totalTokens,
      files,
    };
  } catch (error) {
    // If we can't read the skill, still include it with minimal info
    return {
      id,
      name: formatName(id),
      path: skillPath,
      files: [],
    };
  }
}

/**
 * Parse SKILL.md frontmatter and content
 */
function parseSkillMd(content: string): {
  name?: string;
  version?: string;
  category?: string;
  description?: string;
  permissions?: string[];
} {
  const result: ReturnType<typeof parseSkillMd> = {};
  
  // Extract frontmatter (YAML between --- lines)
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (fmMatch) {
    const fm = fmMatch[1];
    
    // Parse simple YAML
    const nameMatch = fm.match(/name:\s*["']?([^"'\n]+)["']?/);
    if (nameMatch) result.name = nameMatch[1].trim();
    
    const versionMatch = fm.match(/version:\s*["']?([^"'\n]+)["']?/);
    if (versionMatch) result.version = versionMatch[1].trim();
    
    const categoryMatch = fm.match(/category:\s*["']?([^"'\n]+)["']?/);
    if (categoryMatch) result.category = categoryMatch[1].trim().toLowerCase();
    
    const descMatch = fm.match(/description:\s*["']?([^"'\n]+)["']?/);
    if (descMatch) result.description = descMatch[1].trim();
    
    // Parse permissions array
    const permMatch = fm.match(/permissions:\s*\[([^\]]+)\]/);
    if (permMatch) {
      result.permissions = permMatch[1]
        .split(',')
        .map(p => p.trim().replace(/["']/g, ''))
        .filter(Boolean);
    }
  }
  
  // If no frontmatter, try to extract from content
  if (!result.name) {
    const h1Match = content.match(/^#\s+(.+)$/m);
    if (h1Match) result.name = h1Match[1].trim();
  }
  
  if (!result.description) {
    // Get first paragraph after title
    const lines = content.split('\n');
    let afterTitle = false;
    for (const line of lines) {
      if (line.startsWith('#')) {
        afterTitle = true;
        continue;
      }
      if (afterTitle && line.trim() && !line.startsWith('#')) {
        result.description = line.trim().slice(0, 200);
        break;
      }
    }
  }
  
  return result;
}

/**
 * Estimate token count for a skill
 */
async function estimateTokens(skillPath: string, files: string[]): Promise<number> {
  let totalChars = 0;
  
  const textFiles = files.filter(f => 
    f.endsWith('.md') || 
    f.endsWith('.txt') || 
    f.endsWith('.ts') || 
    f.endsWith('.js') ||
    f.endsWith('.json')
  );
  
  for (const file of textFiles) {
    try {
      const content = await readFile(join(skillPath, file), 'utf-8');
      totalChars += content.length;
    } catch {
      // Ignore read errors
    }
  }
  
  // Rough estimate: ~4 characters per token
  return Math.round(totalChars / 4);
}

/**
 * Infer category from skill ID or content
 */
function inferCategory(id: string, content: string): string {
  const lowerContent = (id + ' ' + content).toLowerCase();
  
  const categoryPatterns: Record<string, string[]> = {
    communication: ['discord', 'slack', 'email', 'message', 'chat', 'telegram', 'whatsapp'],
    development: ['github', 'git', 'code', 'coding', 'programming', 'debug', 'api'],
    design: ['canvas', 'theme', 'ui', 'ux', 'design', 'visual', 'css', 'style'],
    media: ['audio', 'video', 'image', 'pdf', 'pptx', 'docx', 'whisper', 'music', 'spotify'],
    productivity: ['notion', 'obsidian', 'notes', 'todo', 'task', 'calendar', 'remind'],
    security: ['guard', 'security', 'password', 'auth', '1password', 'protect', 'encrypt'],
    marketing: ['seo', 'copy', 'content', 'marketing', 'ads', 'social', 'campaign'],
    utility: ['weather', 'search', 'fetch', 'summarize', 'translate', 'convert'],
    data: ['sql', 'database', 'analytics', 'data', 'query', 'report'],
    devops: ['docker', 'deploy', 'ci', 'cd', 'kubernetes', 'aws', 'cloud'],
  };
  
  for (const [category, patterns] of Object.entries(categoryPatterns)) {
    if (patterns.some(p => lowerContent.includes(p))) {
      return category;
    }
  }
  
  return 'utility'; // Default category
}

/**
 * Format skill ID into readable name
 */
function formatName(id: string): string {
  return id
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
