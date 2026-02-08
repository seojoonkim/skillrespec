// ═══════════════════════════════════════════════════════════
// Tool Dependency Parser - Extracts tool dependencies from skills
// ═══════════════════════════════════════════════════════════

import type { SkillNode } from '../types';
import { KNOWN_SKILLS } from '../data/knownSkills';

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export interface ToolNode {
  id: string;
  name: string;
  type: 'tool';
  category: string;
  x: number;
  y: number;
  z: number;
  usageCount: number; // How many skills use this tool
}

export interface ToolEdge {
  source: string; // skill id
  target: string; // tool id
  weight: number;
}

// Known tool categories based on common patterns
export const TOOL_REGISTRY: Record<string, { name: string; category: string }> = {
  // File System
  'filesystem': { name: 'File System', category: 'system' },
  'read': { name: 'Read Files', category: 'system' },
  'write': { name: 'Write Files', category: 'system' },
  'edit': { name: 'Edit Files', category: 'system' },
  'trash': { name: 'Trash Files', category: 'system' },
  
  // Code Execution
  'code-execution': { name: 'Code Execution', category: 'runtime' },
  'exec': { name: 'Shell Exec', category: 'runtime' },
  'process': { name: 'Process Mgmt', category: 'runtime' },
  
  // Network
  'network': { name: 'Network Access', category: 'network' },
  'web_search': { name: 'Web Search', category: 'network' },
  'web_fetch': { name: 'Web Fetch', category: 'network' },
  'browser': { name: 'Browser Control', category: 'network' },
  
  // Communication
  'message': { name: 'Messaging', category: 'comms' },
  'tts': { name: 'Text-to-Speech', category: 'media' },
  'image': { name: 'Image Analysis', category: 'media' },
  
  // Node Control
  'nodes': { name: 'Node Control', category: 'system' },
  'canvas': { name: 'Canvas', category: 'ui' },
};

// ═══════════════════════════════════════════════════════════
// Extract Tool Dependencies
// ═══════════════════════════════════════════════════════════

/**
 * Get tools that a skill depends on based on permissions
 */
export function getSkillTools(skillId: string): string[] {
  const skill = KNOWN_SKILLS[skillId];
  if (!skill) return [];

  const tools: string[] = [];
  
  // Map permissions to tools
  if (skill.permissions) {
    for (const perm of skill.permissions) {
      if (TOOL_REGISTRY[perm]) {
        tools.push(perm);
      }
    }
  }

  // Infer additional tools from category
  switch (skill.category) {
    case 'communication':
      if (!tools.includes('network')) tools.push('network');
      tools.push('message');
      break;
    case 'media':
      if (!tools.includes('filesystem')) tools.push('filesystem');
      break;
    case 'development':
      if (!tools.includes('code-execution')) tools.push('code-execution');
      break;
    case 'utility':
      if (skill.permissions?.includes('network')) {
        tools.push('web_fetch');
      }
      break;
  }

  return [...new Set(tools)]; // Dedupe
}

/**
 * Build tool nodes and edges from skill nodes
 */
export function buildToolGraph(skillNodes: SkillNode[]): {
  toolNodes: ToolNode[];
  toolEdges: ToolEdge[];
} {
  const toolUsage = new Map<string, { count: number; skills: string[] }>();
  const toolEdges: ToolEdge[] = [];

  // Count tool usage across all skills
  for (const skill of skillNodes) {
    const tools = getSkillTools(skill.id);
    for (const tool of tools) {
      if (!toolUsage.has(tool)) {
        toolUsage.set(tool, { count: 0, skills: [] });
      }
      const usage = toolUsage.get(tool)!;
      usage.count++;
      usage.skills.push(skill.id);

      // Create edge
      toolEdges.push({
        source: skill.id,
        target: `tool:${tool}`,
        weight: 1,
      });
    }
  }

  // Build tool nodes in a ring around the origin
  const toolNodes: ToolNode[] = [];
  const toolIds = Array.from(toolUsage.keys());
  const numTools = toolIds.length;

  for (let i = 0; i < numTools; i++) {
    const toolId = toolIds[i];
    const usage = toolUsage.get(toolId)!;
    const registry = TOOL_REGISTRY[toolId] || { name: toolId, category: 'other' };
    
    // Position in outer ring
    const angle = (i / numTools) * Math.PI * 2;
    const radius = 12; // Outer ring for tools

    toolNodes.push({
      id: `tool:${toolId}`,
      name: registry.name,
      type: 'tool',
      category: registry.category,
      x: Math.cos(angle) * radius,
      y: (Math.random() - 0.5) * 2,
      z: Math.sin(angle) * radius,
      usageCount: usage.count,
    });
  }

  return { toolNodes, toolEdges };
}

// ═══════════════════════════════════════════════════════════
// Tool Categories for Coloring
// ═══════════════════════════════════════════════════════════

export const TOOL_COLORS: Record<string, string> = {
  system: '#6b7280',   // Gray
  runtime: '#f59e0b',  // Amber
  network: '#3b82f6',  // Blue
  comms: '#8b5cf6',    // Violet
  media: '#ec4899',    // Pink
  ui: '#10b981',       // Emerald
  other: '#64748b',    // Slate
};

export function getToolColor(category: string): string {
  return TOOL_COLORS[category] || TOOL_COLORS.other;
}
