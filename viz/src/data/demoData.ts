import type { VizData, SkillNode, SkillEdge, SkillCluster, VizMetrics } from '../types';
import { theme } from '../styles/theme';

// Use theme.categoryColors as single source of truth
const CATEGORY_COLORS = theme.categoryColors;

// Sample skill data based on the actual catalog
// version: currently installed, latestVersion: available on ClawdHub
const DEMO_SKILLS = [
  // Communication - some have updates
  { id: 'discord', name: 'Discord Actions', category: 'communication', tokens: 2947, version: '2.1.0', latestVersion: '2.3.0' },       // minor
  { id: 'slack', name: 'Slack Actions', category: 'communication', tokens: 624, version: '1.5.2', latestVersion: '1.5.2' },            // up-to-date
  { id: 'imsg', name: 'iMessage', category: 'communication', tokens: 375, version: '1.0.0', latestVersion: '1.0.3' },                  // patch
  { id: 'himalaya', name: 'Himalaya Email', category: 'communication', tokens: 1154, version: '0.9.0', latestVersion: '1.0.0' },       // major
  { id: 'wacli', name: 'WhatsApp CLI', category: 'communication', tokens: 596, version: '2.0.1', latestVersion: '2.0.1' },             // up-to-date
  
  // Development - several updates available
  { id: 'github', name: 'GitHub Skill', category: 'development', tokens: 418, version: '1.2.0', latestVersion: '2.0.0' },              // major
  { id: 'coding-agent', name: 'Coding Agent', category: 'development', tokens: 2527, version: '3.1.0', latestVersion: '3.2.0' },       // minor
  { id: 'skill-creator', name: 'Skill Creator', category: 'development', tokens: 4555, version: '1.8.0', latestVersion: '1.8.5' },     // patch
  { id: 'tmux', name: 'tmux Skill', category: 'development', tokens: 1236, version: '1.1.0', latestVersion: '1.1.0' },                 // up-to-date
  { id: 'oracle', name: 'Oracle', category: 'development', tokens: 1251, version: '2.0.0', latestVersion: '2.1.0' },                   // minor
  { id: 'gemini', name: 'Gemini CLI', category: 'development', tokens: 234, version: '1.0.0', latestVersion: '1.0.0' },                // up-to-date
  { id: 'mcporter', name: 'MCP Porter', category: 'development', tokens: 418, version: '0.5.0', latestVersion: '1.0.0' },              // major
  { id: 'session-logs', name: 'Session Logs', category: 'development', tokens: 857, version: '1.3.0', latestVersion: '1.3.2' },        // patch
  
  // Design
  { id: 'canvas', name: 'Canvas Skill', category: 'design', tokens: 1308, version: '2.0.0', latestVersion: '2.0.0' },                  // up-to-date
  { id: 'theme-factory', name: 'Theme Factory', category: 'design', tokens: 781, version: '1.0.0', latestVersion: '1.2.0' },           // minor
  { id: 'mcp-builder', name: 'MCP Builder', category: 'design', tokens: 2267, version: '1.1.0', latestVersion: '1.1.0' },              // up-to-date
  { id: 'web-artifacts', name: 'Web Artifacts', category: 'design', tokens: 769, version: '1.0.0', latestVersion: '2.0.0' },           // major
  
  // Media
  { id: 'whisper', name: 'Whisper CLI', category: 'media', tokens: 228, version: '1.2.0', latestVersion: '1.2.0' },                    // up-to-date
  { id: 'spotify', name: 'Spotify Player', category: 'media', tokens: 421, version: '2.0.0', latestVersion: '2.1.0' },                 // minor
  { id: 'peekaboo', name: 'Peekaboo', category: 'media', tokens: 1492, version: '1.5.0', latestVersion: '1.5.0' },                     // up-to-date
  { id: 'gifgrep', name: 'GIF Grep', category: 'media', tokens: 545, version: '1.0.0', latestVersion: '1.0.1' },                       // patch
  { id: 'pdf', name: 'PDF Processing', category: 'media', tokens: 1767, version: '1.0.0', latestVersion: '1.0.0' },                    // up-to-date
  { id: 'pptx', name: 'PowerPoint', category: 'media', tokens: 6384, version: '1.0.0', latestVersion: '1.1.0' },                       // minor
  { id: 'docx', name: 'DOCX', category: 'media', tokens: 2538, version: '1.0.0', latestVersion: '1.0.0' },                             // up-to-date
  
  // Productivity
  { id: 'notion', name: 'Notion', category: 'productivity', tokens: 1285, version: '2.3.0', latestVersion: '3.0.0' },                  // major
  { id: 'obsidian', name: 'Obsidian', category: 'productivity', tokens: 629, version: '1.5.0', latestVersion: '1.5.0' },               // up-to-date
  { id: 'things', name: 'Things 3', category: 'productivity', tokens: 888, version: '1.2.0', latestVersion: '1.3.0' },                 // minor
  { id: 'apple-notes', name: 'Apple Notes', category: 'productivity', tokens: 522, version: '1.0.0', latestVersion: '1.0.0' },         // up-to-date
  { id: 'gog', name: 'Google Workspace', category: 'productivity', tokens: 1143, version: '1.8.0', latestVersion: '1.8.2' },           // patch
  { id: 'bear-notes', name: 'Bear Notes', category: 'productivity', tokens: 661, version: '1.1.0', latestVersion: '1.1.0' },           // up-to-date
  
  // Security
  { id: 'prompt-guard', name: 'Prompt Guard', category: 'security', tokens: 5524, version: '2.8.0', latestVersion: '3.0.0' },          // major!
  { id: 'healthcheck', name: 'Host Hardening', category: 'security', tokens: 2626, version: '1.0.0', latestVersion: '1.0.0' },         // up-to-date
  { id: '1password', name: '1Password CLI', category: 'security', tokens: 656, version: '1.0.0', latestVersion: '1.1.0' },             // minor
  { id: 'blackswan', name: 'BlackSwan Risk', category: 'security', tokens: 957, version: '1.2.0', latestVersion: '1.2.0' },            // up-to-date
  
  // Marketing
  { id: 'copywriting', name: 'Copywriting', category: 'marketing', tokens: 1775, version: '1.5.0', latestVersion: '1.5.0' },           // up-to-date
  { id: 'seo-audit', name: 'SEO Audit', category: 'marketing', tokens: 2236, version: '1.0.0', latestVersion: '1.2.0' },               // minor
  { id: 'launch-strategy', name: 'Launch Strategy', category: 'marketing', tokens: 3110, version: '1.0.0', latestVersion: '1.0.0' },   // up-to-date
  { id: 'content-strategy', name: 'Content Strategy', category: 'marketing', tokens: 2848, version: '2.0.0', latestVersion: '2.0.1' }, // patch
  { id: 'paid-ads', name: 'Paid Ads', category: 'marketing', tokens: 2433, version: '1.3.0', latestVersion: '1.3.0' },                 // up-to-date
  { id: 'social-content', name: 'Social Content', category: 'marketing', tokens: 2085, version: '1.0.0', latestVersion: '1.0.0' },     // up-to-date
  
  // Utility
  { id: 'weather', name: 'Weather', category: 'utility', tokens: 291, version: '1.0.0', latestVersion: '1.0.0' },                      // up-to-date
  { id: 'summarize', name: 'Summarize', category: 'utility', tokens: 552, version: '1.1.0', latestVersion: '2.0.0' },                  // major
  { id: 'voice-call', name: 'Voice Call', category: 'utility', tokens: 290, version: '1.0.0', latestVersion: '1.0.0' },                // up-to-date
  { id: 'openhue', name: 'OpenHue', category: 'utility', tokens: 290, version: '1.0.0', latestVersion: '1.0.1' },                      // patch
  { id: 'local-places', name: 'Local Places', category: 'utility', tokens: 635, version: '1.0.0', latestVersion: '1.0.0' },            // up-to-date
];

function generatePositions(skills: typeof DEMO_SKILLS) {
  const categoryIndex = new Map<string, number>();
  let catIdx = 0;
  
  for (const skill of skills) {
    if (!categoryIndex.has(skill.category)) {
      categoryIndex.set(skill.category, catIdx++);
    }
  }
  
  const numCategories = categoryIndex.size;
  
  return skills.map((skill, i) => {
    const catI = categoryIndex.get(skill.category) || 0;
    const angle = (catI / numCategories) * Math.PI * 2;
    const radius = 4 + Math.random() * 2;
    const skillsInCat = skills.filter((s, j) => j < i && s.category === skill.category).length;
    
    return {
      x: Math.cos(angle) * radius + (Math.random() - 0.5) * 1.5,
      y: (skillsInCat - 3) * 0.8 + (Math.random() - 0.5),
      z: Math.sin(angle) * radius + (Math.random() - 0.5) * 1.5,
    };
  });
}

function findSimilarPairs(skills: typeof DEMO_SKILLS) {
  const pairs: { skill1: string; skill2: string; similarity: number }[] = [];
  
  // Generate plausible similarities based on category and naming
  for (let i = 0; i < skills.length; i++) {
    for (let j = i + 1; j < skills.length; j++) {
      const s1 = skills[i];
      const s2 = skills[j];
      
      // Same category = higher base similarity
      let similarity = s1.category === s2.category ? 0.4 : 0.1;
      
      // Specific high-similarity pairs
      if (
        (s1.id.includes('note') && s2.id.includes('note')) ||
        (s1.id.includes('slack') && s2.id.includes('discord')) ||
        (s1.id.includes('doc') && s2.id.includes('pdf')) ||
        (s1.id.includes('seo') && s2.id.includes('content')) ||
        (s1.id.includes('copy') && s2.id.includes('content'))
      ) {
        similarity = 0.6 + Math.random() * 0.3;
      }
      
      similarity += Math.random() * 0.2;
      
      if (similarity > 0.3) {
        pairs.push({
          skill1: s1.id,
          skill2: s2.id,
          similarity: Math.round(similarity * 100) / 100,
        });
      }
    }
  }
  
  return pairs.sort((a, b) => b.similarity - a.similarity).slice(0, 50);
}

export function generateDemoData(): VizData {
  const positions = generatePositions(DEMO_SKILLS);
  const similarPairs = findSimilarPairs(DEMO_SKILLS);
  
  // Build nodes
  const maxTokens = Math.max(...DEMO_SKILLS.map(s => s.tokens));
  const nodes: SkillNode[] = DEMO_SKILLS.map((skill, i) => ({
    id: skill.id,
    name: skill.name,
    category: skill.category,
    x: positions[i].x,
    y: positions[i].y,
    z: positions[i].z,
    tokens: skill.tokens,
    color: CATEGORY_COLORS[skill.category] || '#ffffff',
    size: (skill.tokens / maxTokens) * 0.8 + 0.2,
    connections: [],
    version: skill.version,
    latestVersion: skill.latestVersion,
  }));
  
  // Build edges
  const edges: SkillEdge[] = similarPairs.map(pair => ({
    source: pair.skill1,
    target: pair.skill2,
    weight: pair.similarity,
  }));
  
  // Update connections
  for (const edge of edges) {
    const source = nodes.find(n => n.id === edge.source);
    const target = nodes.find(n => n.id === edge.target);
    if (source && !source.connections.includes(edge.target)) {
      source.connections.push(edge.target);
    }
    if (target && !target.connections.includes(edge.source)) {
      target.connections.push(edge.source);
    }
  }
  
  // Build clusters
  const categorySkills = new Map<string, string[]>();
  for (const skill of DEMO_SKILLS) {
    if (!categorySkills.has(skill.category)) {
      categorySkills.set(skill.category, []);
    }
    categorySkills.get(skill.category)!.push(skill.id);
  }
  
  const clusters: SkillCluster[] = [];
  for (const [category, skillIds] of categorySkills) {
    const catNodes = nodes.filter(n => n.category === category);
    clusters.push({
      id: category,
      name: category.charAt(0).toUpperCase() + category.slice(1),
      category,
      skills: skillIds,
      centroid: {
        x: catNodes.reduce((s, n) => s + n.x, 0) / catNodes.length,
        y: catNodes.reduce((s, n) => s + n.y, 0) / catNodes.length,
        z: catNodes.reduce((s, n) => s + n.z, 0) / catNodes.length,
      },
      density: catNodes.length / nodes.length,
      color: CATEGORY_COLORS[category] || '#ffffff',
    });
  }
  
  // Calculate metrics
  const totalTokens = DEMO_SKILLS.reduce((s, sk) => s + sk.tokens, 0);
  const coverageScores: Record<string, number> = {};
  for (const [cat, ids] of categorySkills) {
    const catTokens = ids.reduce((s, id) => {
      const skill = DEMO_SKILLS.find(sk => sk.id === id);
      return s + (skill?.tokens || 0);
    }, 0);
    coverageScores[cat] = Math.round((catTokens / totalTokens) * 100);
  }
  
  const metrics: VizMetrics = {
    cosineSimilarities: similarPairs.slice(0, 20),
    clusterDensity: 0.72,
    overlapCoefficient: 0.38,
    coverageScores,
    uniquenessIndex: 0.85,
  };
  
  return { nodes, edges, clusters, metrics };
}
