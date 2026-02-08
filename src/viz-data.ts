/**
 * Visualization Data Generator
 * Transforms catalog skills into 3D-ready data
 */

import { writeFile } from 'fs/promises';
import type { CatalogSkill, VizData, SkillNode, SkillEdge, SkillCluster, VizMetrics } from './types.js';
import { 
  generatePositions, 
  buildClusters, 
  findSimilarPairs, 
  calculateClusterDensity,
  calculateOverlap,
  calculateCoverage,
  calculateUniqueness,
  CATEGORY_COLORS 
} from './metrics.js';

/**
 * Generate visualization data from catalog skills
 */
export function generateVizData(skills: CatalogSkill[]): VizData {
  const positions = generatePositions(skills);
  const clusters = buildClusters(skills);
  
  // Build nodes
  const nodes: SkillNode[] = skills.map((skill, i) => {
    // Size based on tokens (normalized)
    const maxTokens = Math.max(...skills.map(s => s.estimatedTokens || 1));
    const normalizedSize = ((skill.estimatedTokens || 1) / maxTokens) * 0.8 + 0.2;
    
    return {
      id: skill.id,
      name: skill.name,
      category: skill.category,
      x: positions[i].x,
      y: positions[i].y,
      z: positions[i].z,
      tokens: skill.estimatedTokens || 0,
      color: CATEGORY_COLORS[skill.category] || '#ffffff',
      size: normalizedSize,
      connections: [],
    };
  });
  
  // Build edges from similarity
  const similarPairs = findSimilarPairs(skills, 100);
  const edges: SkillEdge[] = similarPairs.map(pair => ({
    source: pair.skill1,
    target: pair.skill2,
    weight: pair.similarity,
  }));
  
  // Update node connections
  for (const edge of edges) {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    if (sourceNode && !sourceNode.connections.includes(edge.target)) {
      sourceNode.connections.push(edge.target);
    }
    if (targetNode && !targetNode.connections.includes(edge.source)) {
      targetNode.connections.push(edge.source);
    }
  }
  
  // Build metrics
  const metrics: VizMetrics = {
    cosineSimilarities: similarPairs,
    clusterDensity: calculateClusterDensity(skills),
    overlapCoefficient: calculateOverlap(skills),
    coverageScores: calculateCoverage(skills),
    uniquenessIndex: calculateUniqueness(skills),
  };
  
  return {
    nodes,
    edges,
    clusters,
    metrics,
  };
}

/**
 * Write visualization data to file
 */
export async function writeVizData(data: VizData, path: string): Promise<void> {
  await writeFile(path, JSON.stringify(data, null, 2));
}

/**
 * Generate HTML export with embedded data
 */
export function generateHtmlExport(data: VizData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SkillRespec 3D Visualization</title>
  <style>
    body { margin: 0; background: #0a0a0f; color: #fff; font-family: system-ui, sans-serif; }
    #container { width: 100vw; height: 100vh; }
  </style>
</head>
<body>
  <div id="container"></div>
  <script>
    window.SKILL_DATA = ${JSON.stringify(data)};
  </script>
  <script type="module" src="./viz.js"></script>
</body>
</html>`;
}
