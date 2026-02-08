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
    { 
      id: 'prompt-guard', 
      from: 'v2.8', 
      to: 'v3.0', 
      reason: 'New attack patterns 50+ added' 
    },
    { 
      id: 'frontend-design', 
      from: 'v1.2', 
      to: 'v2.0', 
      reason: 'Tailwind v4 support' 
    },
  ],
};

export default recommendations;
