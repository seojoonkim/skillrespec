// SkillRespec Recommendation Data - Simon's skill analysis

export interface DiagnosisItem {
  type: 'success' | 'warning' | 'error';
  text: string;
  detail: string;
}

export interface InstallItem {
  id: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  category?: string;
}

export interface RemoveItem {
  id: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  conflictsWith?: string;
}

export interface UpdateItem {
  id: string;
  from: string;
  to: string;
  reason: string;
}

export interface Recommendations {
  diagnosis: DiagnosisItem[];
  install: InstallItem[];
  remove: RemoveItem[];
  update: UpdateItem[];
}

export const recommendations: Recommendations = {
  diagnosis: [
    { 
      type: 'warning', 
      text: 'Marketing skills overload (71%)', 
      detail: 'Balance with other categories needed' 
    },
    { 
      type: 'error', 
      text: 'Development/automation skills lacking', 
      detail: 'DevOps, CI/CD capability weak' 
    },
    { 
      type: 'success', 
      text: 'Security skills excellent', 
      detail: 'Well protected with prompt-guard' 
    },
    { 
      type: 'warning', 
      text: 'Data/Analytics gap', 
      detail: 'SQL, data analysis skills missing' 
    },
  ],
  install: [
    { 
      id: 'sql-query', 
      reason: 'Data/Analytics category completely empty', 
      priority: 'high',
      category: 'Data' 
    },
    { 
      id: 'n8n-automation', 
      reason: 'Workflow automation for 10x productivity', 
      priority: 'high',
      category: 'Automation' 
    },
    { 
      id: 'docker-basics', 
      reason: 'Strengthen DevOps capability', 
      priority: 'medium',
      category: 'DevOps' 
    },
    { 
      id: 'api-testing', 
      reason: 'Improve development workflow', 
      priority: 'medium',
      category: 'Development' 
    },
    { 
      id: 'git-advanced', 
      reason: 'Utilize advanced version control features', 
      priority: 'low',
      category: 'Development' 
    },
  ],
  remove: [
    { 
      id: 'ui-ux-pro-max-skill', 
      reason: '100% duplicate of ui-ux-pro-max', 
      priority: 'high',
      conflictsWith: 'ui-ux-pro-max'
    },
    { 
      id: 'copywriting (marketingskills)', 
      reason: 'Duplicate of skills/copywriting', 
      priority: 'medium',
      conflictsWith: 'copywriting'
    },
  ],
  update: [
    { id: 'prompt-guard', from: 'v2.8.0', to: 'v3.0.0', reason: 'New attack patterns 50+ added' },
    { id: 'github', from: 'v1.2.0', to: 'v2.0.0', reason: 'Major API overhaul, new features' },
    { id: 'himalaya', from: 'v0.9.0', to: 'v1.0.0', reason: 'Stable release with breaking changes' },
    { id: 'mcporter', from: 'v0.5.0', to: 'v1.0.0', reason: 'Production ready release' },
    { id: 'web-artifacts', from: 'v1.0.0', to: 'v2.0.0', reason: 'New component system' },
    { id: 'notion', from: 'v2.3.0', to: 'v3.0.0', reason: 'Database API v2 support' },
    { id: 'discord', from: 'v2.1.0', to: 'v2.3.0', reason: 'New slash commands' },
    { id: 'coding-agent', from: 'v3.1.0', to: 'v3.2.0', reason: 'Performance improvements' },
    { id: 'oracle', from: 'v2.0.0', to: 'v2.1.0', reason: 'New prediction models' },
    { id: 'theme-factory', from: 'v1.0.0', to: 'v1.2.0', reason: 'New themes added' },
    { id: 'spotify', from: 'v2.0.0', to: 'v2.1.0', reason: 'Playlist management' },
    { id: 'things', from: 'v1.2.0', to: 'v1.3.0', reason: 'Tags support' },
    { id: 'pptx', from: 'v1.0.0', to: 'v1.1.0', reason: 'Chart support' },
    { id: 'imsg', from: 'v1.0.0', to: 'v1.0.3', reason: 'Bug fixes' },
    { id: 'skill-creator', from: 'v1.8.0', to: 'v1.8.5', reason: 'Template updates' },
    { id: 'session-logs', from: 'v1.3.0', to: 'v1.3.2', reason: 'Performance patch' },
    { id: 'gifgrep', from: 'v1.0.0', to: 'v1.0.1', reason: 'Search fix' },
    { id: 'gog', from: 'v1.8.0', to: 'v1.8.2', reason: 'Auth refresh fix' },
  ],
};

export default recommendations;
