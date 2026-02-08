// ═══════════════════════════════════════════════════════════
// SkillRespec i18n - 다국어 번역 시스템
// ═══════════════════════════════════════════════════════════

export type Language = 'ko' | 'en' | 'ja' | 'zh';

export interface Translations {
  header: {
    subtitle: string;
    healthScore: string;
    skills: string;
    connections: string;
    grade: {
      excellent: string;
      good: string;
      average: string;
      poor: string;
    };
    export: string;
    respec: string;
    report: string;
  };
  diagnosis: {
    title: string;
    target: string;
    dateTime: string;
    totalSkills: string;
    categories: string;
    overallScore: string;
    categoryDistribution: string;
    strengths: string;
    improvements: string;
    actionItems: string;
    priority: {
      high: string;
      medium: string;
      low: string;
    };
    actions: {
      install: string;
      remove: string;
      update: string;
    };
    messages: {
      marketingStrong: string;
      securityPresent: string;
      marketingOverload: string;
      noDataAnalytics: string;
      noDevOps: string;
      lowDevelopment: string;
      wellBalanced: string;
      goodCoverage: string;
    };
  };
  recommendations: {
    title: string;
    install: string;
    remove: string;
    update: string;
    reason: string;
    impact: string;
    tokens: string;
    viewAll: string;
  };
  categories: {
    title: string;
    all: string;
    // 카테고리 이름은 영어 그대로 유지 (번역 X)
  };
  footer: {
    rotate: string;
    zoom: string;
    click: string;
    powered: string;
  };
  panel: {
    nodeDetails: string;
    tokenUsage: string;
    category: string;
    connections: string;
    similarity: string;
    close: string;
  };
  mobile: {
    categories: string;
    recommend: string;
  };
}

export const translations: Record<Language, Translations> = {
  ko: {
    header: {
      subtitle: 'AI 스킬트리 분석기',
      healthScore: '건강 점수',
      skills: '스킬 수',
      connections: '연결 수',
      grade: {
        excellent: '우수',
        good: '양호',
        average: '보통',
        poor: '부족',
      },
      export: '내보내기',
      respec: '리스펙',
      report: '전체 보고서',
    },
    diagnosis: {
      title: '📊 스킬셋 종합 진단 보고서',
      target: '분석 대상',
      dateTime: '분석 일시',
      totalSkills: '총 스킬',
      categories: '카테고리',
      overallScore: '종합 점수',
      categoryDistribution: '카테고리 분포',
      strengths: '강점',
      improvements: '개선점',
      actionItems: '액션 아이템',
      priority: {
        high: '높음',
        medium: '보통',
        low: '낮음',
      },
      actions: {
        install: '설치',
        remove: '제거',
        update: '업데이트',
      },
      messages: {
        marketingStrong: '마케팅 역량 풍부',
        securityPresent: '보안 스킬 보유',
        marketingOverload: '마케팅 편중 (균형 필요)',
        noDataAnalytics: 'Data/Analytics 스킬 없음',
        noDevOps: 'DevOps/CI-CD 역량 부족',
        lowDevelopment: '개발 스킬 보강 필요',
        wellBalanced: '스킬 균형 양호',
        goodCoverage: '핵심 영역 커버리지 우수',
      },
    },
    recommendations: {
      title: '🎯 추천',
      install: '설치 추천',
      remove: '제거 추천',
      update: '업데이트 추천',
      reason: '이유',
      impact: '영향',
      tokens: '토큰',
      viewAll: '전체 보기',
    },
    categories: {
      title: '카테고리',
      all: '전체 보기',
    },
    footer: {
      rotate: '드래그로 회전',
      zoom: '스크롤로 확대',
      click: '클릭하여 상세 보기',
      powered: 'Powered by',
    },
    panel: {
      nodeDetails: '스킬 상세',
      tokenUsage: '토큰 사용량',
      category: '카테고리',
      connections: '연결',
      similarity: '유사도',
      close: '닫기',
    },
    mobile: {
      categories: '카테고리',
      recommend: '추천',
    },
  },
  en: {
    header: {
      subtitle: 'AI Skill Tree Analyzer',
      healthScore: 'Health Score',
      skills: 'Skills',
      connections: 'Connections',
      grade: {
        excellent: 'Excellent',
        good: 'Good',
        average: 'Average',
        poor: 'Poor',
      },
      export: 'Export',
      respec: 'Respec',
      report: 'Full Report',
    },
    diagnosis: {
      title: '📊 Skill Set Diagnostic Report',
      target: 'Target',
      dateTime: 'Date & Time',
      totalSkills: 'Total Skills',
      categories: 'Categories',
      overallScore: 'Overall Score',
      categoryDistribution: 'Category Distribution',
      strengths: 'Strengths',
      improvements: 'Areas for Improvement',
      actionItems: 'Action Items',
      priority: {
        high: 'High',
        medium: 'Medium',
        low: 'Low',
      },
      actions: {
        install: 'Install',
        remove: 'Remove',
        update: 'Update',
      },
      messages: {
        marketingStrong: 'Strong marketing capabilities',
        securityPresent: 'Security skills present',
        marketingOverload: 'Marketing overload (balance needed)',
        noDataAnalytics: 'No Data/Analytics skills',
        noDevOps: 'DevOps/CI-CD capability lacking',
        lowDevelopment: 'Development skills need reinforcement',
        wellBalanced: 'Well-balanced skill set',
        goodCoverage: 'Good core area coverage',
      },
    },
    recommendations: {
      title: '🎯 Recommendations',
      install: 'Install',
      remove: 'Remove',
      update: 'Update',
      reason: 'Reason',
      impact: 'Impact',
      tokens: 'Tokens',
      viewAll: 'View All',
    },
    categories: {
      title: 'Categories',
      all: 'View All',
    },
    footer: {
      rotate: 'Drag to rotate',
      zoom: 'Scroll to zoom',
      click: 'Click for details',
      powered: 'Powered by',
    },
    panel: {
      nodeDetails: 'Skill Details',
      tokenUsage: 'Token Usage',
      category: 'Category',
      connections: 'Connections',
      similarity: 'Similarity',
      close: 'Close',
    },
    mobile: {
      categories: 'Categories',
      recommend: 'Recommend',
    },
  },
  ja: {
    header: {
      subtitle: 'AIスキルツリーアナライザー',
      healthScore: 'ヘルススコア',
      skills: 'スキル数',
      connections: '接続数',
      grade: {
        excellent: '優秀',
        good: '良好',
        average: '普通',
        poor: '不足',
      },
      export: 'エクスポート',
      respec: 'リスペック',
      report: '全体レポート',
    },
    diagnosis: {
      title: '📊 スキルセット総合診断レポート',
      target: '分析対象',
      dateTime: '分析日時',
      totalSkills: '総スキル',
      categories: 'カテゴリ',
      overallScore: '総合スコア',
      categoryDistribution: 'カテゴリ分布',
      strengths: '強み',
      improvements: '改善点',
      actionItems: 'アクションアイテム',
      priority: {
        high: '高',
        medium: '中',
        low: '低',
      },
      actions: {
        install: 'インストール',
        remove: '削除',
        update: 'アップデート',
      },
      messages: {
        marketingStrong: 'マーケティング能力が豊富',
        securityPresent: 'セキュリティスキル保有',
        marketingOverload: 'マーケティング偏重（バランスが必要）',
        noDataAnalytics: 'データ分析スキルなし',
        noDevOps: 'DevOps/CI-CD能力不足',
        lowDevelopment: '開発スキルの強化が必要',
        wellBalanced: 'スキルバランス良好',
        goodCoverage: 'コア領域カバレッジ良好',
      },
    },
    recommendations: {
      title: '🎯 おすすめ',
      install: 'インストール推奨',
      remove: '削除推奨',
      update: 'アップデート推奨',
      reason: '理由',
      impact: '影響',
      tokens: 'トークン',
      viewAll: 'すべて表示',
    },
    categories: {
      title: 'カテゴリ',
      all: 'すべて表示',
    },
    footer: {
      rotate: 'ドラッグで回転',
      zoom: 'スクロールでズーム',
      click: 'クリックで詳細',
      powered: 'Powered by',
    },
    panel: {
      nodeDetails: 'スキル詳細',
      tokenUsage: 'トークン使用量',
      category: 'カテゴリ',
      connections: '接続',
      similarity: '類似度',
      close: '閉じる',
    },
    mobile: {
      categories: 'カテゴリ',
      recommend: 'おすすめ',
    },
  },
  zh: {
    header: {
      subtitle: 'AI技能树分析器',
      healthScore: '健康分数',
      skills: '技能数',
      connections: '连接数',
      grade: {
        excellent: '优秀',
        good: '良好',
        average: '一般',
        poor: '不足',
      },
      export: '导出',
      respec: '重置',
      report: '完整报告',
    },
    diagnosis: {
      title: '📊 技能集综合诊断报告',
      target: '分析对象',
      dateTime: '分析时间',
      totalSkills: '总技能',
      categories: '类别',
      overallScore: '综合得分',
      categoryDistribution: '类别分布',
      strengths: '优势',
      improvements: '改进点',
      actionItems: '行动项',
      priority: {
        high: '高',
        medium: '中',
        low: '低',
      },
      actions: {
        install: '安装',
        remove: '删除',
        update: '更新',
      },
      messages: {
        marketingStrong: '营销能力丰富',
        securityPresent: '具备安全技能',
        marketingOverload: '营销过度（需要平衡）',
        noDataAnalytics: '无数据分析技能',
        noDevOps: 'DevOps/CI-CD能力不足',
        lowDevelopment: '需要加强开发技能',
        wellBalanced: '技能均衡良好',
        goodCoverage: '核心领域覆盖良好',
      },
    },
    recommendations: {
      title: '🎯 推荐',
      install: '推荐安装',
      remove: '推荐删除',
      update: '推荐更新',
      reason: '原因',
      impact: '影响',
      tokens: '令牌',
      viewAll: '查看全部',
    },
    categories: {
      title: '类别',
      all: '查看全部',
    },
    footer: {
      rotate: '拖动旋转',
      zoom: '滚动缩放',
      click: '点击查看详情',
      powered: 'Powered by',
    },
    panel: {
      nodeDetails: '技能详情',
      tokenUsage: '令牌使用量',
      category: '类别',
      connections: '连接',
      similarity: '相似度',
      close: '关闭',
    },
    mobile: {
      categories: '类别',
      recommend: '推荐',
    },
  },
};

export const LANGUAGE_NAMES: Record<Language, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
  zh: '中文',
};

export const LANGUAGE_FLAGS: Record<Language, string> = {
  ko: '🇰🇷',
  en: '🇺🇸',
  ja: '🇯🇵',
  zh: '🇨🇳',
};
