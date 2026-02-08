// SkillRespec 추천 데이터 - 형 스킬 기반 분석

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
      text: '마케팅 스킬 과잉 (71%)', 
      detail: '다른 카테고리 균형 필요' 
    },
    { 
      type: 'error', 
      text: '개발/자동화 스킬 부족', 
      detail: 'DevOps, CI/CD 역량 취약' 
    },
    { 
      type: 'success', 
      text: '보안 스킬 우수', 
      detail: 'prompt-guard로 잘 방어됨' 
    },
    { 
      type: 'warning', 
      text: 'Data/Analytics 공백', 
      detail: 'SQL, 데이터 분석 스킬 부재' 
    },
  ],
  install: [
    { 
      id: 'sql-query', 
      reason: 'Data/Analytics 카테고리 완전 공백', 
      priority: 'high',
      category: 'Data' 
    },
    { 
      id: 'n8n-automation', 
      reason: '워크플로우 자동화로 생산성 10x', 
      priority: 'high',
      category: 'Automation' 
    },
    { 
      id: 'docker-basics', 
      reason: 'DevOps 역량 강화', 
      priority: 'medium',
      category: 'DevOps' 
    },
    { 
      id: 'api-testing', 
      reason: '개발 워크플로우 개선', 
      priority: 'medium',
      category: 'Development' 
    },
    { 
      id: 'git-advanced', 
      reason: '버전 관리 고급 기능 활용', 
      priority: 'low',
      category: 'Development' 
    },
  ],
  remove: [
    { 
      id: 'ui-ux-pro-max-skill', 
      reason: 'ui-ux-pro-max와 100% 중복', 
      priority: 'high',
      conflictsWith: 'ui-ux-pro-max'
    },
    { 
      id: 'copywriting (marketingskills)', 
      reason: 'skills/copywriting과 중복', 
      priority: 'medium',
      conflictsWith: 'copywriting'
    },
  ],
  update: [
    { 
      id: 'prompt-guard', 
      from: 'v2.8', 
      to: 'v3.0', 
      reason: '새 공격 패턴 50+ 추가됨' 
    },
    { 
      id: 'frontend-design', 
      from: 'v1.2', 
      to: 'v2.0', 
      reason: 'Tailwind v4 대응' 
    },
  ],
};

export default recommendations;
