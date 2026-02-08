#!/usr/bin/env node
/**
 * SkillRespec CLI
 * AI Agent Skill Optimizer - Respec your skills like a game
 */

import { Command } from 'commander';
import { scanSkills, formatScanResult } from './scanner.js';
import { analyzeSkills, formatAnalysisResult } from './analyzer.js';

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
  .command('analyze [dir]')
  .description('Analyze skill health')
  .option('--roast', 'Enable roast mode 🔥')
  .action(async (dir: string = './skills', options: { roast?: boolean }) => {
    console.log('🔬 Analyzing skills...');
    
    const scanResult = await scanSkills(dir);
    if (scanResult.totalCount === 0) {
      console.log('No skills found to analyze.');
      return;
    }

    const result = await analyzeSkills(scanResult.skills, { roast: options.roast });
    console.log(formatAnalysisResult(result));
  });

program
  .command('respec')
  .description('Get respec recommendations')
  .action(() => {
    console.log('🎮 Respec recommendations coming soon...');
    console.log('');
    console.log('Like in your favorite RPG, sometimes you need to:');
    console.log('  • Remove outdated skills');
    console.log('  • Upgrade core abilities');
    console.log('  • Merge duplicate powers');
    console.log('');
    console.log('Stay tuned for v0.2.0! ⚔️');
  });

program.parse();
