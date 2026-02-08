// ═══════════════════════════════════════════════════════════
// Known Skills Database - ClawdHub/OpenClaw Skills Registry
// ═══════════════════════════════════════════════════════════

import type { TrustSource } from '../types';

export interface KnownSkill {
  name: string;
  category: string;
  estimatedTokens: number;
  latestVersion?: string;
  description?: string;
  permissions?: string[];
  trustSource: TrustSource;
  handlesSensitiveData?: boolean;
  aliases?: string[];  // Alternative names/variations
}

export const KNOWN_SKILLS: Record<string, KnownSkill> = {
  // ═══════════════════════════════════════════════════════════
  // Communication Skills
  // ═══════════════════════════════════════════════════════════
  'discord': {
    name: 'Discord Actions',
    category: 'communication',
    estimatedTokens: 2947,
    latestVersion: '2.3.0',
    description: 'Discord bot integration with slash commands and webhooks',
    permissions: ['network'],
    trustSource: 'official',
    handlesSensitiveData: true,
    aliases: ['discord-actions', 'discord-bot'],
  },
  'slack': {
    name: 'Slack Actions',
    category: 'communication',
    estimatedTokens: 624,
    latestVersion: '1.5.2',
    description: 'Slack workspace integration',
    permissions: ['network'],
    trustSource: 'official',
    handlesSensitiveData: true,
    aliases: ['slack-actions'],
  },
  'imsg': {
    name: 'iMessage',
    category: 'communication',
    estimatedTokens: 375,
    latestVersion: '1.0.3',
    description: 'Send and read iMessages on macOS',
    permissions: ['filesystem'],
    trustSource: 'verified',
    handlesSensitiveData: true,
    aliases: ['imessage', 'messages'],
  },
  'himalaya': {
    name: 'Himalaya Email',
    category: 'communication',
    estimatedTokens: 1154,
    latestVersion: '1.0.0',
    description: 'CLI-based email client',
    permissions: ['network', 'filesystem'],
    trustSource: 'community',
    handlesSensitiveData: true,
    aliases: ['himalaya-email', 'email'],
  },
  'wacli': {
    name: 'WhatsApp CLI',
    category: 'communication',
    estimatedTokens: 596,
    latestVersion: '2.0.1',
    description: 'WhatsApp messaging via CLI',
    permissions: ['network'],
    trustSource: 'community',
    handlesSensitiveData: true,
    aliases: ['whatsapp', 'whatsapp-cli'],
  },
  'telegram': {
    name: 'Telegram Bot',
    category: 'communication',
    estimatedTokens: 800,
    latestVersion: '1.5.0',
    description: 'Telegram bot integration',
    permissions: ['network'],
    trustSource: 'verified',
    handlesSensitiveData: true,
    aliases: ['telegram-bot'],
  },

  // ═══════════════════════════════════════════════════════════
  // Development Skills
  // ═══════════════════════════════════════════════════════════
  'github': {
    name: 'GitHub Skill',
    category: 'development',
    estimatedTokens: 418,
    latestVersion: '2.0.0',
    description: 'GitHub API integration for repos, PRs, issues',
    permissions: ['network', 'code-execution'],
    trustSource: 'official',
    handlesSensitiveData: true,
    aliases: ['github-skill', 'gh'],
  },
  'coding-agent': {
    name: 'Coding Agent',
    category: 'development',
    estimatedTokens: 2527,
    latestVersion: '3.2.0',
    description: 'Autonomous coding with file operations',
    permissions: ['filesystem', 'code-execution'],
    trustSource: 'verified',
    handlesSensitiveData: false,
    aliases: ['coder', 'code-agent'],
  },
  'skill-creator': {
    name: 'Skill Creator',
    category: 'development',
    estimatedTokens: 4555,
    latestVersion: '1.8.5',
    description: 'Create and manage Claude skills',
    permissions: ['filesystem', 'code-execution'],
    trustSource: 'official',
    handlesSensitiveData: false,
    aliases: ['skill-maker'],
  },
  'tmux': {
    name: 'tmux Skill',
    category: 'development',
    estimatedTokens: 1236,
    latestVersion: '1.1.0',
    description: 'Terminal multiplexer control',
    permissions: ['code-execution'],
    trustSource: 'verified',
    handlesSensitiveData: false,
    aliases: ['tmux-skill'],
  },
  'oracle': {
    name: 'Oracle',
    category: 'development',
    estimatedTokens: 1251,
    latestVersion: '2.1.0',
    description: 'Multi-model LLM orchestration',
    permissions: ['network'],
    trustSource: 'verified',
    handlesSensitiveData: false,
    aliases: ['multi-llm', 'model-router'],
  },
  'gemini': {
    name: 'Gemini CLI',
    category: 'development',
    estimatedTokens: 234,
    latestVersion: '1.0.0',
    description: 'Google Gemini API integration',
    permissions: ['network'],
    trustSource: 'official',
    handlesSensitiveData: true,
    aliases: ['gemini-cli', 'google-gemini'],
  },
  'mcporter': {
    name: 'MCP Porter',
    category: 'development',
    estimatedTokens: 418,
    latestVersion: '1.0.0',
    description: 'Model Context Protocol tool importer',
    permissions: ['network', 'code-execution'],
    trustSource: 'community',
    handlesSensitiveData: false,
    aliases: ['mcp-porter', 'mcp-import'],
  },
  'session-logs': {
    name: 'Session Logs',
    category: 'development',
    estimatedTokens: 857,
    latestVersion: '1.3.2',
    description: 'Session logging and replay',
    permissions: ['filesystem'],
    trustSource: 'verified',
    handlesSensitiveData: false,
    aliases: ['logs', 'session-log'],
  },
  'git-advanced': {
    name: 'Git Advanced',
    category: 'development',
    estimatedTokens: 1200,
    latestVersion: '1.0.0',
    description: 'Advanced git operations',
    permissions: ['filesystem', 'code-execution'],
    trustSource: 'verified',
    handlesSensitiveData: false,
    aliases: ['git-pro', 'advanced-git'],
  },
  'docker-basics': {
    name: 'Docker Basics',
    category: 'devops',
    estimatedTokens: 1500,
    latestVersion: '1.2.0',
    description: 'Basic Docker container management',
    permissions: ['code-execution'],
    trustSource: 'verified',
    handlesSensitiveData: false,
    aliases: ['docker', 'container'],
  },

  // ═══════════════════════════════════════════════════════════
  // Design Skills
  // ═══════════════════════════════════════════════════════════
  'canvas': {
    name: 'Canvas Skill',
    category: 'design',
    estimatedTokens: 1308,
    latestVersion: '2.0.0',
    description: 'Visual canvas for diagrams and designs',
    permissions: [],
    trustSource: 'official',
    handlesSensitiveData: false,
    aliases: ['canvas-skill'],
  },
  'theme-factory': {
    name: 'Theme Factory',
    category: 'design',
    estimatedTokens: 781,
    latestVersion: '1.2.0',
    description: 'Generate custom themes and color palettes',
    permissions: ['filesystem'],
    trustSource: 'verified',
    handlesSensitiveData: false,
    aliases: ['themes', 'color-palette'],
  },
  'mcp-builder': {
    name: 'MCP Builder',
    category: 'design',
    estimatedTokens: 2267,
    latestVersion: '1.1.0',
    description: 'Build MCP servers visually',
    permissions: ['filesystem', 'code-execution'],
    trustSource: 'official',
    handlesSensitiveData: false,
    aliases: ['mcp-create'],
  },
  'web-artifacts': {
    name: 'Web Artifacts',
    category: 'design',
    estimatedTokens: 769,
    latestVersion: '2.0.0',
    description: 'Create and preview web components',
    permissions: ['network'],
    trustSource: 'community',
    handlesSensitiveData: false,
    aliases: ['artifacts', 'web-components'],
  },

  // ═══════════════════════════════════════════════════════════
  // Media Skills
  // ═══════════════════════════════════════════════════════════
  'whisper': {
    name: 'Whisper CLI',
    category: 'media',
    estimatedTokens: 228,
    latestVersion: '1.2.0',
    description: 'Speech-to-text transcription',
    permissions: ['filesystem'],
    trustSource: 'official',
    handlesSensitiveData: false,
    aliases: ['whisper-cli', 'speech-to-text', 'stt'],
  },
  'spotify': {
    name: 'Spotify Player',
    category: 'media',
    estimatedTokens: 421,
    latestVersion: '2.1.0',
    description: 'Spotify playback control',
    permissions: ['network'],
    trustSource: 'verified',
    handlesSensitiveData: true,
    aliases: ['spotify-player', 'music'],
  },
  'peekaboo': {
    name: 'Peekaboo',
    category: 'media',
    estimatedTokens: 1492,
    latestVersion: '1.5.0',
    description: 'Screenshot and screen recording',
    permissions: ['filesystem'],
    trustSource: 'verified',
    handlesSensitiveData: false,
    aliases: ['screenshot', 'screen-capture'],
  },
  'gifgrep': {
    name: 'GIF Grep',
    category: 'media',
    estimatedTokens: 545,
    latestVersion: '1.0.1',
    description: 'Search and manage GIF libraries',
    permissions: ['network'],
    trustSource: 'community',
    handlesSensitiveData: false,
    aliases: ['gif-search', 'giphy'],
  },
  'pdf': {
    name: 'PDF Processing',
    category: 'media',
    estimatedTokens: 1767,
    latestVersion: '1.0.0',
    description: 'Read and manipulate PDF files',
    permissions: ['filesystem'],
    trustSource: 'verified',
    handlesSensitiveData: false,
    aliases: ['pdf-reader', 'pdf-skill'],
  },
  'pptx': {
    name: 'PowerPoint',
    category: 'media',
    estimatedTokens: 6384,
    latestVersion: '1.1.0',
    description: 'Create and edit PowerPoint presentations',
    permissions: ['filesystem'],
    trustSource: 'verified',
    handlesSensitiveData: false,
    aliases: ['powerpoint', 'ppt'],
  },
  'docx': {
    name: 'DOCX',
    category: 'media',
    estimatedTokens: 2538,
    latestVersion: '1.0.0',
    description: 'Create and edit Word documents',
    permissions: ['filesystem'],
    trustSource: 'verified',
    handlesSensitiveData: false,
    aliases: ['word', 'doc'],
  },
  'tts': {
    name: 'Text to Speech',
    category: 'media',
    estimatedTokens: 500,
    latestVersion: '1.0.0',
    description: 'Convert text to spoken audio',
    permissions: ['filesystem'],
    trustSource: 'official',
    handlesSensitiveData: false,
    aliases: ['text-to-speech', 'speech'],
  },

  // ═══════════════════════════════════════════════════════════
  // Productivity Skills
  // ═══════════════════════════════════════════════════════════
  'notion': {
    name: 'Notion',
    category: 'productivity',
    estimatedTokens: 1285,
    latestVersion: '3.0.0',
    description: 'Notion workspace integration',
    permissions: ['network'],
    trustSource: 'official',
    handlesSensitiveData: true,
    aliases: ['notion-skill'],
  },
  'obsidian': {
    name: 'Obsidian',
    category: 'productivity',
    estimatedTokens: 629,
    latestVersion: '1.5.0',
    description: 'Obsidian vault management',
    permissions: ['filesystem'],
    trustSource: 'verified',
    handlesSensitiveData: true,
    aliases: ['obsidian-skill'],
  },
  'things': {
    name: 'Things 3',
    category: 'productivity',
    estimatedTokens: 888,
    latestVersion: '1.3.0',
    description: 'Things 3 task management',
    permissions: ['filesystem'],
    trustSource: 'verified',
    handlesSensitiveData: true,
    aliases: ['things3', 'things-skill'],
  },
  'apple-notes': {
    name: 'Apple Notes',
    category: 'productivity',
    estimatedTokens: 522,
    latestVersion: '1.0.0',
    description: 'macOS Notes app integration',
    permissions: ['filesystem'],
    trustSource: 'official',
    handlesSensitiveData: true,
    aliases: ['notes', 'macos-notes'],
  },
  'gog': {
    name: 'Google Workspace',
    category: 'productivity',
    estimatedTokens: 1143,
    latestVersion: '1.8.2',
    description: 'Google Drive, Docs, Sheets integration',
    permissions: ['network'],
    trustSource: 'official',
    handlesSensitiveData: true,
    aliases: ['google', 'gdrive', 'google-workspace'],
  },
  'bear-notes': {
    name: 'Bear Notes',
    category: 'productivity',
    estimatedTokens: 661,
    latestVersion: '1.1.0',
    description: 'Bear note-taking app integration',
    permissions: ['filesystem'],
    trustSource: 'verified',
    handlesSensitiveData: true,
    aliases: ['bear', 'bear-skill'],
  },
  'calendar': {
    name: 'Calendar',
    category: 'productivity',
    estimatedTokens: 800,
    latestVersion: '1.2.0',
    description: 'Calendar event management',
    permissions: ['filesystem'],
    trustSource: 'official',
    handlesSensitiveData: true,
    aliases: ['cal', 'ical'],
  },
  'reminders': {
    name: 'Reminders',
    category: 'productivity',
    estimatedTokens: 450,
    latestVersion: '1.0.0',
    description: 'macOS Reminders app integration',
    permissions: ['filesystem'],
    trustSource: 'official',
    handlesSensitiveData: true,
    aliases: ['macos-reminders'],
  },

  // ═══════════════════════════════════════════════════════════
  // Security Skills
  // ═══════════════════════════════════════════════════════════
  'prompt-guard': {
    name: 'Prompt Guard',
    category: 'security',
    estimatedTokens: 5524,
    latestVersion: '3.0.0',
    description: 'Injection attack detection and prevention',
    permissions: [],
    trustSource: 'official',
    handlesSensitiveData: false,
    aliases: ['promptguard', 'injection-guard'],
  },
  'healthcheck': {
    name: 'Host Hardening',
    category: 'security',
    estimatedTokens: 2626,
    latestVersion: '1.0.0',
    description: 'System security audit and hardening',
    permissions: ['filesystem', 'code-execution'],
    trustSource: 'official',
    handlesSensitiveData: false,
    aliases: ['security-audit', 'hardening'],
  },
  '1password': {
    name: '1Password CLI',
    category: 'security',
    estimatedTokens: 656,
    latestVersion: '1.1.0',
    description: 'Password manager integration',
    permissions: ['code-execution'],
    trustSource: 'official',
    handlesSensitiveData: true,
    aliases: ['onepassword', 'op'],
  },
  'blackswan': {
    name: 'BlackSwan Risk',
    category: 'security',
    estimatedTokens: 957,
    latestVersion: '1.2.0',
    description: 'Risk analysis and threat modeling',
    permissions: ['network'],
    trustSource: 'verified',
    handlesSensitiveData: false,
    aliases: ['risk-analysis', 'threat-model'],
  },
  'hivefence': {
    name: 'HiveFence',
    category: 'security',
    estimatedTokens: 3200,
    latestVersion: '1.0.0',
    description: 'Collective AI agent defense network',
    permissions: ['network'],
    trustSource: 'official',
    handlesSensitiveData: false,
    aliases: ['hive-fence', 'collective-defense'],
  },

  // ═══════════════════════════════════════════════════════════
  // Marketing Skills
  // ═══════════════════════════════════════════════════════════
  'copywriting': {
    name: 'Copywriting',
    category: 'marketing',
    estimatedTokens: 1775,
    latestVersion: '1.5.0',
    description: 'Marketing copy generation',
    permissions: [],
    trustSource: 'verified',
    handlesSensitiveData: false,
    aliases: ['copy', 'marketing-copy'],
  },
  'seo-audit': {
    name: 'SEO Audit',
    category: 'marketing',
    estimatedTokens: 2236,
    latestVersion: '1.2.0',
    description: 'Website SEO analysis',
    permissions: ['network'],
    trustSource: 'community',
    handlesSensitiveData: false,
    aliases: ['seo', 'seo-analysis'],
  },
  'launch-strategy': {
    name: 'Launch Strategy',
    category: 'marketing',
    estimatedTokens: 3110,
    latestVersion: '1.0.0',
    description: 'Product launch planning',
    permissions: [],
    trustSource: 'verified',
    handlesSensitiveData: false,
    aliases: ['launch', 'go-to-market'],
  },
  'content-strategy': {
    name: 'Content Strategy',
    category: 'marketing',
    estimatedTokens: 2848,
    latestVersion: '2.0.1',
    description: 'Content calendar and strategy',
    permissions: [],
    trustSource: 'verified',
    handlesSensitiveData: false,
    aliases: ['content', 'content-calendar'],
  },
  'paid-ads': {
    name: 'Paid Ads',
    category: 'marketing',
    estimatedTokens: 2433,
    latestVersion: '1.3.0',
    description: 'Ad campaign management',
    permissions: ['network'],
    trustSource: 'verified',
    handlesSensitiveData: true,
    aliases: ['ads', 'advertising'],
  },
  'social-content': {
    name: 'Social Content',
    category: 'marketing',
    estimatedTokens: 2085,
    latestVersion: '1.0.0',
    description: 'Social media content creation',
    permissions: [],
    trustSource: 'verified',
    handlesSensitiveData: false,
    aliases: ['social', 'social-media'],
  },

  // ═══════════════════════════════════════════════════════════
  // Utility Skills
  // ═══════════════════════════════════════════════════════════
  'weather': {
    name: 'Weather',
    category: 'utility',
    estimatedTokens: 291,
    latestVersion: '1.0.0',
    description: 'Weather forecasts and conditions',
    permissions: ['network'],
    trustSource: 'official',
    handlesSensitiveData: false,
    aliases: ['weather-skill', 'forecast'],
  },
  'summarize': {
    name: 'Summarize',
    category: 'utility',
    estimatedTokens: 552,
    latestVersion: '2.0.0',
    description: 'Text summarization',
    permissions: [],
    trustSource: 'community',
    handlesSensitiveData: false,
    aliases: ['summary', 'tldr'],
  },
  'voice-call': {
    name: 'Voice Call',
    category: 'utility',
    estimatedTokens: 290,
    latestVersion: '1.0.0',
    description: 'Make and receive voice calls',
    permissions: ['network'],
    trustSource: 'verified',
    handlesSensitiveData: true,
    aliases: ['call', 'phone'],
  },
  'openhue': {
    name: 'OpenHue',
    category: 'utility',
    estimatedTokens: 290,
    latestVersion: '1.0.1',
    description: 'Philips Hue smart lights control',
    permissions: ['network'],
    trustSource: 'community',
    handlesSensitiveData: true,
    aliases: ['hue', 'lights'],
  },
  'local-places': {
    name: 'Local Places',
    category: 'utility',
    estimatedTokens: 635,
    latestVersion: '1.0.0',
    description: 'Local business and place search',
    permissions: ['network'],
    trustSource: 'verified',
    handlesSensitiveData: true,
    aliases: ['places', 'maps'],
  },
  'web-search': {
    name: 'Web Search',
    category: 'utility',
    estimatedTokens: 400,
    latestVersion: '1.1.0',
    description: 'Search the web via Brave/Google',
    permissions: ['network'],
    trustSource: 'official',
    handlesSensitiveData: false,
    aliases: ['search', 'brave-search'],
  },
  'web-fetch': {
    name: 'Web Fetch',
    category: 'utility',
    estimatedTokens: 350,
    latestVersion: '1.0.0',
    description: 'Fetch and parse web pages',
    permissions: ['network'],
    trustSource: 'official',
    handlesSensitiveData: false,
    aliases: ['fetch', 'scrape'],
  },

  // ═══════════════════════════════════════════════════════════
  // Data & Analytics Skills
  // ═══════════════════════════════════════════════════════════
  'sql-query': {
    name: 'SQL Query',
    category: 'data',
    estimatedTokens: 1100,
    latestVersion: '1.0.0',
    description: 'Database querying and management',
    permissions: ['network'],
    trustSource: 'verified',
    handlesSensitiveData: true,
    aliases: ['sql', 'database'],
  },
  'analytics': {
    name: 'Analytics',
    category: 'data',
    estimatedTokens: 1500,
    latestVersion: '1.0.0',
    description: 'Data analysis and visualization',
    permissions: ['filesystem'],
    trustSource: 'verified',
    handlesSensitiveData: true,
    aliases: ['data-analysis', 'stats'],
  },

  // ═══════════════════════════════════════════════════════════
  // DevOps & Automation
  // ═══════════════════════════════════════════════════════════
  'n8n-automation': {
    name: 'n8n Automation',
    category: 'devops',
    estimatedTokens: 1800,
    latestVersion: '1.0.0',
    description: 'Workflow automation with n8n',
    permissions: ['network', 'code-execution'],
    trustSource: 'community',
    handlesSensitiveData: true,
    aliases: ['n8n', 'automation'],
  },
  'api-testing': {
    name: 'API Testing',
    category: 'development',
    estimatedTokens: 900,
    latestVersion: '1.0.0',
    description: 'REST/GraphQL API testing',
    permissions: ['network'],
    trustSource: 'verified',
    handlesSensitiveData: false,
    aliases: ['postman', 'api-test'],
  },
};

// ═══════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════

/**
 * Find a skill by ID or alias
 */
export function findSkill(input: string): KnownSkill | undefined {
  const normalized = input.toLowerCase().trim();
  
  // Direct match
  if (KNOWN_SKILLS[normalized]) {
    return KNOWN_SKILLS[normalized];
  }
  
  // Alias match
  for (const [id, skill] of Object.entries(KNOWN_SKILLS)) {
    if (skill.aliases?.some(alias => alias.toLowerCase() === normalized)) {
      return { ...skill, name: skill.name }; // Return with original ID context
    }
  }
  
  // Fuzzy match (simple contains check)
  for (const [id, skill] of Object.entries(KNOWN_SKILLS)) {
    if (id.includes(normalized) || normalized.includes(id)) {
      return skill;
    }
    if (skill.name.toLowerCase().includes(normalized)) {
      return skill;
    }
  }
  
  return undefined;
}

/**
 * Get skill ID from input (handles aliases)
 */
export function getSkillId(input: string): string | undefined {
  const normalized = input.toLowerCase().trim();
  
  // Direct match
  if (KNOWN_SKILLS[normalized]) {
    return normalized;
  }
  
  // Alias match
  for (const [id, skill] of Object.entries(KNOWN_SKILLS)) {
    if (skill.aliases?.some(alias => alias.toLowerCase() === normalized)) {
      return id;
    }
  }
  
  // Fuzzy match
  for (const [id, skill] of Object.entries(KNOWN_SKILLS)) {
    if (id.includes(normalized) || normalized.includes(id)) {
      return id;
    }
  }
  
  return undefined;
}

/**
 * Get all categories
 */
export function getAllCategories(): string[] {
  const categories = new Set<string>();
  for (const skill of Object.values(KNOWN_SKILLS)) {
    categories.add(skill.category);
  }
  return Array.from(categories).sort();
}

/**
 * Get skills by category
 */
export function getSkillsByCategory(category: string): Array<{ id: string; skill: KnownSkill }> {
  return Object.entries(KNOWN_SKILLS)
    .filter(([_, skill]) => skill.category === category)
    .map(([id, skill]) => ({ id, skill }));
}

export default KNOWN_SKILLS;
