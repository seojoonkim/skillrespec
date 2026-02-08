// Skill data types and loader
export interface Skill {
  id: string;
  name: string;
  description: string;
  source: 'openclaw' | 'local' | 'github';
  category: string;
  estimatedTokens: number;
  dependencies: string[];
  conflicts: string[];
}

export interface SkillCatalog {
  version: string;
  totalSkills: number;
  skills: Skill[];
  byCategory: Record<string, number>;
}

// Category colors - vibrant palette
export const CATEGORY_COLORS: Record<string, string> = {
  productivity: '#FFD700',  // Gold
  development: '#00CED1',   // Dark Turquoise
  media: '#FF6B6B',         // Coral Red
  communication: '#9B59B6', // Purple
  design: '#FF69B4',        // Hot Pink
  marketing: '#FFA500',     // Orange
  security: '#32CD32',      // Lime Green
  utility: '#87CEEB',       // Sky Blue
};

// Source icons/colors
export const SOURCE_COLORS: Record<string, string> = {
  openclaw: '#FF4500',  // Orange Red (lobster)
  local: '#4169E1',     // Royal Blue
  github: '#333333',    // Dark Gray
};

// Generate 3D positions based on category clustering
export function generatePositions(skills: Skill[]): Map<string, [number, number, number]> {
  const positions = new Map<string, [number, number, number]>();
  const categoryPositions: Record<string, [number, number, number]> = {};
  
  // Create base positions for each category (on a sphere)
  const categories = Object.keys(CATEGORY_COLORS);
  const radius = 15;
  
  categories.forEach((cat, i) => {
    const phi = Math.acos(-1 + (2 * i) / categories.length);
    const theta = Math.sqrt(categories.length * Math.PI) * phi;
    
    categoryPositions[cat] = [
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi),
    ];
  });

  // Position skills around their category center
  const categoryCount: Record<string, number> = {};
  
  skills.forEach((skill) => {
    const cat = skill.category || 'utility';
    if (!categoryCount[cat]) categoryCount[cat] = 0;
    
    const base = categoryPositions[cat] || [0, 0, 0];
    const index = categoryCount[cat]++;
    
    // Spiral around the category center
    const spiralRadius = 2 + (index * 0.3);
    const angle = index * 0.5;
    const height = (index % 5) * 0.8 - 2;
    
    const x = base[0] + spiralRadius * Math.cos(angle);
    const y = base[1] + height;
    const z = base[2] + spiralRadius * Math.sin(angle);
    
    positions.set(skill.id, [x, y, z]);
  });

  return positions;
}

// Calculate node size based on token count
export function getNodeSize(tokens: number): number {
  const minSize = 0.2;
  const maxSize = 1.0;
  const minTokens = 100;
  const maxTokens = 6000;
  
  const normalized = Math.min(1, Math.max(0, (tokens - minTokens) / (maxTokens - minTokens)));
  return minSize + normalized * (maxSize - minSize);
}

// Find similar skills based on overlapping words in descriptions
export function findSimilarSkills(skills: Skill[]): Array<[string, string, number]> {
  const edges: Array<[string, string, number]> = [];
  
  const getWords = (text: string): Set<string> => {
    return new Set(
      text.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3)
    );
  };

  const skillWords = new Map<string, Set<string>>();
  skills.forEach(s => {
    skillWords.set(s.id, getWords(s.name + ' ' + s.description));
  });

  // Find pairs with high word overlap
  for (let i = 0; i < skills.length; i++) {
    for (let j = i + 1; j < skills.length; j++) {
      const wordsA = skillWords.get(skills[i].id)!;
      const wordsB = skillWords.get(skills[j].id)!;
      
      let overlap = 0;
      wordsA.forEach(w => {
        if (wordsB.has(w)) overlap++;
      });
      
      const similarity = overlap / Math.min(wordsA.size, wordsB.size);
      
      if (similarity > 0.3 && overlap >= 3) {
        edges.push([skills[i].id, skills[j].id, similarity]);
      }
    }
  }

  return edges.sort((a, b) => b[2] - a[2]).slice(0, 100);
}
