#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════
// SkillRespec CLI - Analyze and visualize your AI skills
// ═══════════════════════════════════════════════════════════

import { Command } from 'commander';
import chalk from 'chalk';
import open from 'open';
import { resolve } from 'path';
import { scanSkillsFolder } from './scanner.js';
import { analyzeSkills, encodeForUrl } from './analyzer.js';

const VIZ_URL = 'https://viz-gold.vercel.app';

const program = new Command();

program
  .name('skillrespec')
  .description('🎮 Analyze and visualize your AI agent skills')
  .version('1.0.0')
  .argument('[path]', 'Path to skills folder', './skills')
  .option('-n, --no-open', 'Don\'t open browser')
  .option('-j, --json', 'Output JSON instead of opening browser')
  .option('-u, --url-only', 'Only print the URL')
  .action(runAnalyze);

program
  .command('analyze')
  .alias('a')
  .description('Analyze skills folder and open visualization')
  .argument('[path]', 'Path to skills folder', './skills')
  .option('-n, --no-open', 'Don\'t open browser')
  .option('-j, --json', 'Output JSON instead of opening browser')
  .option('-u, --url-only', 'Only print the URL')
  .action(runAnalyze);

async function runAnalyze(
  skillsPath: string, 
  options: { open: boolean; json: boolean; urlOnly: boolean }
) {
  const resolvedPath = resolve(skillsPath);
  const quiet = options.json || options.urlOnly;
  
  if (!quiet) {
    console.log(chalk.cyan('\n⚔️  SkillRespec Analyzer\n'));
    console.log(chalk.gray(`📁 Scanning: ${resolvedPath}\n`));
  }
  
  try {
    // Scan skills
    const skills = await scanSkillsFolder(resolvedPath);
    
    if (skills.length === 0) {
      if (!quiet) {
        console.error(chalk.red('❌ No skills found in the specified directory.'));
        console.log(chalk.gray('\nMake sure each skill has its own folder with a SKILL.md file.'));
      }
      process.exit(1);
    }
    
    if (!quiet) {
      console.log(chalk.green(`✓ Found ${skills.length} skills:\n`));
      
      // Group by category
      const byCategory = skills.reduce((acc, s) => {
        const cat = s.category || 'utility';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(s);
        return acc;
      }, {} as Record<string, typeof skills>);
      
      for (const [category, catSkills] of Object.entries(byCategory)) {
        console.log(chalk.bold(`  ${getCategoryEmoji(category)} ${category.charAt(0).toUpperCase() + category.slice(1)}`));
        for (const skill of catSkills) {
          const version = skill.version ? chalk.gray(` v${skill.version}`) : '';
          const tokens = skill.tokens ? chalk.gray(` (${skill.tokens} tokens)`) : '';
          console.log(`    ${chalk.white(skill.name)}${version}${tokens}`);
        }
        console.log();
      }
    }
    
    // Analyze
    const vizData = analyzeSkills(skills);
    
    if (options.json) {
      console.log(JSON.stringify(vizData, null, 2));
      return;
    }
    
    // Encode for URL
    const encoded = encodeForUrl(vizData);
    const url = `${VIZ_URL}/#/results#${encoded}`;
    
    if (options.urlOnly) {
      console.log(url);
      return;
    }
    
    console.log(chalk.cyan('📊 Analysis complete!\n'));
    
    // Print summary
    const categories = Object.keys(vizData.metrics.coverageScores);
    console.log(chalk.bold('Summary:'));
    console.log(`  • Total skills: ${chalk.white(skills.length)}`);
    console.log(`  • Categories: ${chalk.white(categories.length)}`);
    console.log(`  • Total tokens: ${chalk.white(vizData.nodes.reduce((s, n) => s + n.tokens, 0).toLocaleString())}`);
    
    const needsUpdate = vizData.nodes.filter(n => n.health === 'needsUpdate').length;
    if (needsUpdate > 0) {
      console.log(`  • ${chalk.yellow('⚠')} Skills needing update: ${chalk.yellow(needsUpdate)}`);
    }
    
    const securityIssues = vizData.nodes.filter(n => 
      n.vulnerability && (n.vulnerability.level === 'high' || n.vulnerability.level === 'critical')
    ).length;
    if (securityIssues > 0) {
      console.log(`  • ${chalk.red('🛡')} Security concerns: ${chalk.red(securityIssues)}`);
    }
    
    console.log();
    
    if (options.open) {
      console.log(chalk.gray('🌐 Opening visualization...\n'));
      await open(url);
    } else {
      console.log(chalk.gray('URL:'));
      console.log(chalk.underline(url));
      console.log();
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Error analyzing skills:'), error);
    process.exit(1);
  }
}

function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    communication: '💬',
    development: '⚙️',
    design: '🎨',
    media: '🎵',
    productivity: '📋',
    security: '🛡️',
    marketing: '📣',
    utility: '🔧',
    data: '📊',
    devops: '🚀',
  };
  return emojis[category] || '📦';
}

program.parse();
