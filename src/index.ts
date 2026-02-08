#!/usr/bin/env node
/**
 * SkillRespec CLI
 * AI Agent Skill Optimizer - Respec your skills like a game
 */

import { Command } from 'commander';
import { scanSkills, formatScanResult } from './scanner.js';
import { analyzeSkills, analyzeCatalogSkills, formatAnalysisResult } from './analyzer.js';
import { 
  loadCatalog, 
  querySkills, 
  formatCatalogStats, 
  formatSkillList,
  formatTokenBudget 
} from './catalog.js';
import { generateVizData, writeVizData } from './viz-data.js';

const program = new Command();

program
  .name('skillrespec')
  .description('AI Agent Skill Optimizer - Respec your skills like a game 🎮')
  .version('0.1.0');

program
  .command('scan [dir]')
  .description('Scan skills directory')
  .action(async (dir: string = './skills') => {
    console.log(`🔍 Scanning ${dir}...`);
    const result = await scanSkills(dir);
    console.log(formatScanResult(result));
  });

program
  .command('analyze')
  .description('Analyze skill health with technical metrics')
  .option('--roast', 'Enable roast mode 🔥')
  .option('-c, --category <cat>', 'Filter by category')
  .option('-s, --source <src>', 'Filter by source')
  .option('--local [dir]', 'Analyze local directory instead of catalog')
  .action(async (options: { roast?: boolean; category?: string; source?: string; local?: string | boolean }) => {
    console.log('🔬 Analyzing skills...\n');
    
    if (options.local) {
      // Analyze local directory
      const dir = typeof options.local === 'string' ? options.local : './skills';
      const scanResult = await scanSkills(dir);
      if (scanResult.totalCount === 0) {
        console.log('No skills found to analyze.');
        return;
      }
      const result = await analyzeSkills(scanResult.skills, { roast: options.roast });
      console.log(formatAnalysisResult(result));
    } else {
      // Analyze catalog
      try {
        const catalog = await loadCatalog();
        let skills = catalog.skills;
        
        if (options.category) {
          skills = skills.filter(s => s.category === options.category);
        }
        if (options.source) {
          skills = skills.filter(s => s.source === options.source);
        }
        
        console.log(`📚 Analyzing ${skills.length} skills from catalog...\n`);
        
        const result = await analyzeCatalogSkills(skills, { roast: options.roast });
        console.log(formatAnalysisResult(result));
      } catch (error) {
        console.error('❌ Failed to load catalog:', (error as Error).message);
        console.error('   Run with --local to analyze a local skills directory');
      }
    }
  });

program
  .command('respec')
  .description('Get respec recommendations')
  .action(async () => {
    console.log('🎮 Generating Respec Recommendations...\n');
    
    try {
      const catalog = await loadCatalog();
      const result = await analyzeCatalogSkills(catalog.skills, { roast: false });
      
      console.log('╔══════════════════════════════════════════════════════════════╗');
      console.log('║  ⚔️  RESPEC MENU                                              ║');
      console.log('╚══════════════════════════════════════════════════════════════╝');
      console.log('');
      
      // Find redundant skills to merge
      const highSimilarity = result.metrics.cosineSimilarities.filter(p => p.similarity > 0.5);
      
      if (highSimilarity.length > 0) {
        console.log('  🔀 MERGE CANDIDATES (high similarity):');
        for (const pair of highSimilarity.slice(0, 5)) {
          console.log(`     → ${pair.skill1} + ${pair.skill2} (${Math.round(pair.similarity * 100)}% similar)`);
        }
        console.log('');
      }
      
      // Categories to strengthen
      const coverage = result.metrics.coverageScores;
      const weak = Object.entries(coverage).filter(([_, pct]) => pct < 10);
      
      if (weak.length > 0) {
        console.log('  📈 STRENGTHEN THESE CATEGORIES:');
        for (const [cat, pct] of weak) {
          console.log(`     → ${cat}: only ${pct}% coverage`);
        }
        console.log('');
      }
      
      // Token diet
      if (result.metrics.totalTokens > 100000) {
        console.log('  🍽️  TOKEN DIET SUGGESTED:');
        console.log(`     Current: ~${result.metrics.totalTokens.toLocaleString()} tokens`);
        console.log('     Target: <100,000 tokens for optimal context usage');
        console.log('');
      }
      
      console.log('  Like in your favorite RPG, sometimes you need to:');
      console.log('    • Remove outdated skills');
      console.log('    • Upgrade core abilities');
      console.log('    • Merge duplicate powers');
      console.log('');
      console.log('  Run `skillrespec viz` to see the 3D skill map! 🗺️');
    } catch (error) {
      console.error('❌ Failed to load catalog');
    }
  });

program
  .command('catalog')
  .description('Query the unified skill catalog')
  .option('-c, --category <cat>', 'Filter by category')
  .option('-s, --source <src>', 'Filter by source (openclaw, local, github)')
  .option('-q, --search <query>', 'Search in name/description')
  .option('-l, --limit <n>', 'Limit results', parseInt)
  .option('--sort <by>', 'Sort by: name, tokens, size')
  .option('-v, --verbose', 'Verbose output')
  .option('--stats', 'Show catalog statistics')
  .option('--tokens', 'Show token budget analysis')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      const catalog = await loadCatalog();

      if (options.stats) {
        console.log(formatCatalogStats(catalog));
        return;
      }

      if (options.tokens) {
        console.log(formatTokenBudget(catalog));
        return;
      }

      const skills = querySkills(catalog, {
        category: options.category,
        source: options.source,
        search: options.search,
        limit: options.limit,
        sortBy: options.sort,
      });

      if (options.json) {
        console.log(JSON.stringify(skills, null, 2));
        return;
      }

      console.log(`📚 Found ${skills.length} skill(s):\n`);
      console.log(formatSkillList(skills, { verbose: options.verbose }));
    } catch (error) {
      console.error('❌ Failed to load catalog:', (error as Error).message);
      console.error('   Make sure skill-catalog.json exists in ~/clawd/compound/');
    }
  });

program
  .command('top')
  .description('Show top skills by token usage')
  .option('-n, --count <n>', 'Number of skills to show', parseInt, 10)
  .option('-c, --category <cat>', 'Filter by category')
  .action(async (options) => {
    try {
      const catalog = await loadCatalog();
      const skills = querySkills(catalog, {
        category: options.category,
        sortBy: 'tokens',
        limit: options.count,
      });

      console.log('🏆 Top Skills by Token Usage:\n');
      
      let rank = 1;
      for (const skill of skills) {
        const bar = '█'.repeat(Math.min(20, Math.round(skill.estimatedTokens / 500)));
        console.log(`  ${rank}. ${skill.name.padEnd(25)} ${bar} ~${skill.estimatedTokens} tokens`);
        rank++;
      }
    } catch (error) {
      console.error('❌ Failed to load catalog');
    }
  });

program
  .command('viz')
  .description('Generate 3D visualization data')
  .option('-o, --output <path>', 'Output path', './viz-data.json')
  .option('--serve', 'Start visualization server')
  .action(async (options) => {
    console.log('🎨 Generating 3D visualization data...\n');
    
    try {
      const catalog = await loadCatalog();
      const vizData = generateVizData(catalog.skills);
      
      await writeVizData(vizData, options.output);
      
      console.log(`✅ Visualization data written to ${options.output}`);
      console.log('');
      console.log('📊 Summary:');
      console.log(`   Nodes: ${vizData.nodes.length}`);
      console.log(`   Edges: ${vizData.edges.length}`);
      console.log(`   Clusters: ${vizData.clusters.length}`);
      console.log('');
      console.log('🚀 To view the visualization:');
      console.log('   cd ~/skillrespec/viz && npm run dev');
      
      if (options.serve) {
        console.log('\n🌐 Starting visualization server...');
        // Would start the server here
      }
    } catch (error) {
      console.error('❌ Failed to generate visualization:', (error as Error).message);
    }
  });

program.parse();
