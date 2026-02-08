// ═══════════════════════════════════════════════════════════
// ClawHub API Client + Mock Data
// ═══════════════════════════════════════════════════════════

export interface ClawHubSkill {
  id: string;
  name: string;
  slug: string;
  description: string;
  author: string;
  version: string;
  downloads: number;
  stars: number;
  category: string;
  tags: string[];
  updatedAt: string;
  verified: boolean;
}

// Mock data for popular skills (realistic ClawdHub data)
const MOCK_SKILLS: ClawHubSkill[] = [
  {
    id: 'prompt-guard',
    name: 'Prompt Guard',
    slug: 'prompt-guard',
    description: 'Advanced prompt injection defense with real-time detection',
    author: 'seojoonkim',
    version: '2.8.0',
    downloads: 1847,
    stars: 234,
    category: 'security',
    tags: ['security', 'injection', 'defense'],
    updatedAt: '2026-02-06',
    verified: true,
  },
  {
    id: 'hivefence',
    name: 'HiveFence',
    slug: 'hivefence',
    description: 'Collective immunity network for agent security',
    author: 'seojoonkim',
    version: '1.0.0',
    downloads: 523,
    stars: 89,
    category: 'security',
    tags: ['security', 'network', 'collective'],
    updatedAt: '2026-02-04',
    verified: true,
  },
  {
    id: 'code-reviewer',
    name: 'Code Reviewer',
    slug: 'code-reviewer',
    description: 'AI-powered code review with best practices',
    author: 'devtools',
    version: '3.2.1',
    downloads: 4521,
    stars: 567,
    category: 'development',
    tags: ['code', 'review', 'quality'],
    updatedAt: '2026-02-01',
    verified: true,
  },
  {
    id: 'git-workflow',
    name: 'Git Workflow',
    slug: 'git-workflow',
    description: 'Streamlined git operations with smart branching',
    author: 'devtools',
    version: '2.1.0',
    downloads: 3892,
    stars: 423,
    category: 'development',
    tags: ['git', 'workflow', 'automation'],
    updatedAt: '2026-01-28',
    verified: true,
  },
  {
    id: 'doc-writer',
    name: 'Doc Writer',
    slug: 'doc-writer',
    description: 'Auto-generate documentation from code',
    author: 'doctools',
    version: '1.5.2',
    downloads: 2156,
    stars: 312,
    category: 'productivity',
    tags: ['documentation', 'markdown', 'auto'],
    updatedAt: '2026-01-25',
    verified: true,
  },
  {
    id: 'api-tester',
    name: 'API Tester',
    slug: 'api-tester',
    description: 'REST/GraphQL API testing and validation',
    author: 'testtools',
    version: '2.0.3',
    downloads: 1678,
    stars: 198,
    category: 'development',
    tags: ['api', 'testing', 'validation'],
    updatedAt: '2026-01-20',
    verified: false,
  },
  {
    id: 'image-analyzer',
    name: 'Image Analyzer',
    slug: 'image-analyzer',
    description: 'Vision model integration for image analysis',
    author: 'mediatools',
    version: '1.2.0',
    downloads: 945,
    stars: 134,
    category: 'media',
    tags: ['image', 'vision', 'analysis'],
    updatedAt: '2026-01-15',
    verified: true,
  },
  {
    id: 'shell-master',
    name: 'Shell Master',
    slug: 'shell-master',
    description: 'Advanced shell command generation and execution',
    author: 'devtools',
    version: '1.8.0',
    downloads: 2789,
    stars: 345,
    category: 'utility',
    tags: ['shell', 'bash', 'commands'],
    updatedAt: '2026-01-12',
    verified: true,
  },
  {
    id: 'data-viz',
    name: 'Data Viz',
    slug: 'data-viz',
    description: 'Create beautiful charts and visualizations',
    author: 'datatools',
    version: '1.1.0',
    downloads: 1234,
    stars: 178,
    category: 'data',
    tags: ['charts', 'visualization', 'data'],
    updatedAt: '2026-01-10',
    verified: false,
  },
  {
    id: 'markdown-pro',
    name: 'Markdown Pro',
    slug: 'markdown-pro',
    description: 'Enhanced markdown with advanced formatting',
    author: 'doctools',
    version: '2.3.1',
    downloads: 3456,
    stars: 421,
    category: 'productivity',
    tags: ['markdown', 'formatting', 'docs'],
    updatedAt: '2026-01-08',
    verified: true,
  },
  {
    id: 'db-manager',
    name: 'DB Manager',
    slug: 'db-manager',
    description: 'Database operations and query optimization',
    author: 'datatools',
    version: '1.4.0',
    downloads: 1567,
    stars: 201,
    category: 'data',
    tags: ['database', 'sql', 'optimization'],
    updatedAt: '2026-01-05',
    verified: true,
  },
  {
    id: 'slack-bot',
    name: 'Slack Bot',
    slug: 'slack-bot',
    description: 'Slack integration for notifications and commands',
    author: 'commtools',
    version: '1.0.2',
    downloads: 876,
    stars: 98,
    category: 'communication',
    tags: ['slack', 'notifications', 'bot'],
    updatedAt: '2026-01-03',
    verified: false,
  },
];

// ═══════════════════════════════════════════════════════════
// API Functions
// ═══════════════════════════════════════════════════════════

export async function fetchPopularSkills(): Promise<ClawHubSkill[]> {
  // In production, this would call the real ClawHub API
  // const response = await fetch('https://api.clawdhub.com/v1/skills/popular');
  // return response.json();
  
  // For now, return mock data with a slight delay to simulate network
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...MOCK_SKILLS].sort((a, b) => b.downloads - a.downloads));
    }, 300);
  });
}

export async function searchSkills(query: string): Promise<ClawHubSkill[]> {
  const lowered = query.toLowerCase();
  return MOCK_SKILLS.filter(
    (skill) =>
      skill.name.toLowerCase().includes(lowered) ||
      skill.description.toLowerCase().includes(lowered) ||
      skill.tags.some((tag) => tag.toLowerCase().includes(lowered))
  );
}

export async function getSkillBySlug(slug: string): Promise<ClawHubSkill | null> {
  return MOCK_SKILLS.find((s) => s.slug === slug) || null;
}

export function getInstallCommand(slug: string): string {
  return `clawhub install ${slug}`;
}

export function formatDownloads(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}
