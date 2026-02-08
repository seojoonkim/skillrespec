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
import open from 'open';

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

program
  .command('web [dir]')
  .description('Analyze skills and open interactive web visualization')
  .option('-c, --category <cat>', 'Filter by category')
  .option('-s, --source <src>', 'Filter by source')
  .option('--local', 'Analyze local directory')
  .action(async (dir: string | undefined, options: { category?: string; source?: string; local?: boolean }) => {
    console.log(`\n⚔️  SkillRespec Analyzer\n`);
    
    const isLocal = options.local || dir;
    const skillsPath = dir || './skills';
    
    let vizData;
    
    if (isLocal) {
      console.log(`🔍 Scanning ${skillsPath}...`);
      const scanResult = await scanSkills(skillsPath);
      
      if (scanResult.totalCount === 0) {
        console.log('❌ No skills found in directory.');
        process.exit(1);
      }
      
      console.log(`   Found ${scanResult.totalCount} skills\n`);
      console.log(`📊 Analyzing...`);
      
      // Convert scanned skills to catalog format for viz generation
      const catalogSkills = scanResult.skills.map(s => ({
        id: s.id || s.name.toLowerCase().replace(/\s+/g, '-'),
        name: s.name,
        description: s.description || '',
        source: 'local' as const,
        path: s.path,
        size: s.size || 0,
        estimatedTokens: s.estimatedTokens || Math.round((s.size || 0) / 4),
        category: s.category || 'other',
        dependencies: s.dependencies || [],
        conflicts: s.conflicts || [],
      }));
      
      vizData = generateVizData(catalogSkills);
    } else {
      // Use catalog
      console.log(`📚 Loading skill catalog...`);
      try {
        const catalog = await loadCatalog();
        let skills = catalog.skills;
        
        if (options.category) {
          skills = skills.filter(s => s.category === options.category);
        }
        if (options.source) {
          skills = skills.filter(s => s.source === options.source);
        }
        
        console.log(`   Found ${skills.length} skills\n`);
        console.log(`📊 Analyzing...`);
        
        vizData = generateVizData(skills);
      } catch (error) {
        console.error('❌ Failed to load catalog:', (error as Error).message);
        console.error('   Run with a directory path to analyze local skills');
        process.exit(1);
      }
    }
    
    // Calculate summary stats
    const totalTokens = vizData.nodes.reduce((sum, n) => sum + n.tokens, 0);
    const categories: Record<string, number> = {};
    for (const node of vizData.nodes) {
      categories[node.category] = (categories[node.category] || 0) + 1;
    }
    
    // Calculate health score
    const balance = vizData.metrics?.categoryBalance || 0.5;
    const depth = vizData.metrics?.avgDepth || 1;
    const healthScore = Math.round((balance * 40 + Math.min(depth / 3, 1) * 30 + 30) * 10) / 10;
    
    console.log(`\n✅ Analysis complete!`);
    console.log(`   Total skills: ${vizData.nodes.length}`);
    console.log(`   Total tokens: ~${totalTokens.toLocaleString()}`);
    console.log(`   Health score: ${healthScore || 75}%\n`);
    
    // Encode data to base64url
    const jsonData = JSON.stringify(vizData);
    const encoded = Buffer.from(jsonData).toString('base64url');
    
    // Check if data is too large for URL (browsers typically support ~2KB-8KB in URL)
    const VIZ_URL = 'https://viz-gold.vercel.app';
    
    if (encoded.length > 8000) {
      console.log(`⚠️  Data too large for URL (${Math.round(encoded.length / 1024)}KB)`);
      console.log(`   Writing to viz-data.json instead...\n`);
      await writeVizData(vizData, './viz-data.json');
      console.log(`🌐 Opening visualization (using local data file)...`);
      await open(VIZ_URL);
    } else {
      const url = `${VIZ_URL}/#${encoded}`;
      console.log(`🔗 Opening results in browser...\n`);
      await open(url);
    }
  });

program.parse();
