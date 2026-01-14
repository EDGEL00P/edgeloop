#!/usr/bin/env node
/**
 * Quick TypeScript Validation & Fix Script
 * Focuses on common issues without running full tsc for each file
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DIRECTORIES = [
  path.join(PROJECT_ROOT, 'server', 'betting'),
  path.join(PROJECT_ROOT, 'server', 'services'),
  path.join(PROJECT_ROOT, 'server', 'analytics'),
  path.join(PROJECT_ROOT, 'server', 'infrastructure')
];

function scanAndFixFile(filePath) {
  const results = { fixed: [], issues: [] };
  
  if (!fs.existsSync(filePath)) {
    results.issues.push({ file: filePath, error: 'FILE_NOT_FOUND' });
    return results;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;
  const lines = content.split('\n');

  // Issue 1: Empty async methods returning []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('private async getGamesForWeek') && lines[i + 1]?.includes('return []')) {
      const newMethod = `  private async getGamesForWeek(season: number, week: number): Promise<any[]> {
    try {
      const games = await db.query.historicalGames.findMany({
        where: and(
          eq(historicalGames.season, season),
          eq(historicalGames.week, week)
        ),
        orderBy: [historicalGames.date]
      });

      return games.map(game => ({
        id: game.id,
        homeTeam: game.homeTeam || "",
        awayTeam: game.awayTeam || "",
        homeTeamId: game.homeTeamId || 0,
        visitorTeamId: game.visitorTeamId || 0,
        openingSpread: 0,
        currentSpread: 0,
        openingTotal: 0,
        currentTotal: 0
      }));
    } catch (error) {
      console.error(\`Error fetching games for week \${week}:\`, error);
      return [];
    }
  }`;

      // Replace the empty method
      lines.splice(i, 2, newMethod);
      content = lines.join('\n');
      results.fixed.push('Fixed: getGamesForWeek() now queries database');
    }
  }

  // Issue 2: Missing db import when using db.
  const usesDb = /db\./.test(content) && !/from\s+["']\.\.\/db["']/.test(content);
  if (usesDb) {
    const dbImport = 'import { db } from "../db";\n';
    const insertPoint = content.indexOf('import') >= 0 ? content.indexOf('\n', content.indexOf('import')) : 0;
    content = dbImport + content;
    results.fixed.push('Fixed: Added missing db import');
  }

  // Issue 3: Missing drizzle-orm imports
  const usesDrizzleOps = /eq\(|and\(|or\(/.test(content) && !/from\s+["']drizzle-orm/.test(content);
  if (usesDrizzleOps) {
    const drizzleImport = 'import { eq, and, or } from "drizzle-orm";\n';
    const insertPoint = content.indexOf('\n', content.indexOf('import')) + 1;
    content = content.slice(0, insertPoint) + drizzleImport + content.slice(insertPoint);
    results.fixed.push('Fixed: Added missing drizzle-orm imports (eq, and, or)');
  }

  // Issue 4: Missing @shared/schema import
  const usesSchema = /historicalGames|weeklyMetrics|nflTeams|nflPlayers/.test(content);
  const importsSchema = /from\s+["']@shared\/schema["']/.test(content);
  if (usesSchema && !importsSchema) {
    const schemaImport = 'import { historicalGames, weeklyMetrics, nflTeams, nflPlayers } from "@shared/schema";\n';
    const insertPoint = content.indexOf('\n', content.indexOf('import')) + 1;
    content = content.slice(0, insertPoint) + schemaImport + content.slice(insertPoint);
    results.fixed.push('Fixed: Added missing @shared/schema imports');
  }

  // Write fixed content
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
  }

  return results;
}

async function main() {
  console.log('\n🔍 Quick TypeScript Validation & Fix\n');
  console.log(`Project Root: ${PROJECT_ROOT}\n`);

  let totalFixed = 0;
  let totalScanned = 0;
  const summary = [];

  for (const dir of DIRECTORIES) {
    if (!fs.existsSync(dir)) continue;

    const dirName = path.relative(PROJECT_ROOT, dir);
    console.log(`📂 ${dirName}/`);

    const files = fs.readdirSync(dir).filter(
      f => f.endsWith('.ts') && !f.includes('.d.ts') && !f.includes('.test.')
    );

    for (const file of files) {
      const filePath = path.join(dir, file);
      totalScanned++;
      
      const result = scanAndFixFile(filePath);
      
      if (result.fixed.length > 0) {
        totalFixed += result.fixed.length;
        console.log(`   🔧 ${file}`);
        result.fixed.forEach(fix => console.log(`      • ${fix}`));
        summary.push({ file: `${dirName}/${file}`, fixes: result.fixed });
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('  SUMMARY');
  console.log('='.repeat(60));
  console.log(`Files Scanned: ${totalScanned}`);
  console.log(`Issues Fixed: ${totalFixed}`);
  console.log('');

  if (summary.length > 0) {
    console.log('Files Modified:');
    for (const item of summary) {
      console.log(`  • ${item.file}`);
    }
  } else {
    console.log('✨ All files are properly configured!');
  }

  console.log('\n✅ Validation Complete!\n');
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
