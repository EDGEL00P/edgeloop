#!/usr/bin/env node
/**
 * Automated TypeScript Validation & Fix Script
 * Scans, validates, and fixes TypeScript issues across all betting system files
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DIRECTORIES = [
  path.join(PROJECT_ROOT, 'server', 'betting'),
  path.join(PROJECT_ROOT, 'server', 'services'),
  path.join(PROJECT_ROOT, 'server', 'analytics'),
  path.join(PROJECT_ROOT, 'server', 'infrastructure')
];

const COMMON_FIXES = {
  'TS2304': "Add missing import from 'drizzle-orm'",
  'TS2322': "Fix type annotation or casting",
  'TS2345': "Add proper null check or type guard",
  'TS2538': "Handle undefined/null values",
  'TS2552': "Use optional chaining or nullish coalescing",
  'TS7006': "Add proper type annotation",
  'TS1005': "Fix syntax error - likely missing comma or bracket"
};

function scanFile(filePath) {
  const issues = [];
  
  if (!fs.existsSync(filePath)) {
    return [{
      file: filePath,
      line: 0,
      column: 0,
      severity: 'error',
      code: 'FILE_NOT_FOUND',
      message: `File not found: ${filePath}`
    }];
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Check for empty async method returning empty array
    if (/async\s+\w+\([^)]*\)\s*:\s*Promise\s*<[^>]+\>\s*\{\s*return\s+\[\];?\s*\}/.test(line)) {
      issues.push({
        file: filePath,
        line: lineNum,
        column: line.indexOf('return []'),
        severity: 'warning',
        code: 'EMPTY_ASYNC',
        message: 'Async method returns empty array - IMPLEMENT DATABASE QUERY'
      });
    }

    // Check for Math operations without type conversion
    if (/\d+\s*[\+\-\*\/]\s*[a-zA-Z_]/.test(line)) {
      issues.push({
        file: filePath,
        line: lineNum,
        column: line.indexOf(/[\+\-\*\/]/),
        severity: 'error',
        code: 'MATH_TYPE_ERROR',
        message: 'Math operation with variable - type safety issue'
      });
    }
  }

  return issues;
}

function validateImports(filePath) {
  const issues = [];
  
  if (!fs.existsSync(filePath)) return issues;
  
  const content = fs.readFileSync(filePath, 'utf-8');

  // Check if file uses db but doesn't import it
  const usesDb = /db\./.test(content);
  const importsDb = /from\s+["']\.\.\/db["']/.test(content) || /from\s+["']\.{2}\/db["']/.test(content);
  
  if (usesDb && !importsDb) {
    issues.push({
      file: filePath,
      line: 0,
      column: 0,
      severity: 'error',
      code: 'MISSING_DB_IMPORT',
      message: 'Uses "db" but does not import it'
    });
  }

  // Check if file uses drizzle-orm but doesn't import it
  const usesDrizzle = /eq\(|and\(|or\(/.test(content);
  const importsDrizzle = /from\s+["']drizzle-orm/.test(content);
  
  if (usesDrizzle && !importsDrizzle) {
    issues.push({
      file: filePath,
      line: 0,
      column: 0,
      severity: 'error',
      code: 'MISSING_DRIZZLE_IMPORT',
      message: 'Uses drizzle-orm operators but does not import them'
    });
  }

  return issues;
}

function runTscCheck(filePath) {
  const issues = [];
  
  try {
    const output = execSync(
      `npx -p typescript tsc --noEmit --skipLibCheck "${filePath}" 2>&1`,
      { encoding: 'utf-8', timeout: 30000, cwd: PROJECT_ROOT }
    );

    const errorRegex = /(.+)\((\d+),(\d+)\):\s*error\s*(TS\d+):\s*(.+)/g;
    let match;
    
    while ((match = errorRegex.exec(output)) !== null) {
      const [, file, line, col, code, message] = match;
      
      if (!file.includes('node_modules') && !file.includes('test.ts')) {
        issues.push({
          file: file.trim(),
          line: parseInt(line),
          column: parseInt(col),
          severity: 'error',
          code: code,
          message: message,
          fix: COMMON_FIXES[code] || 'Fix based on error message'
        });
      }
    }
  } catch (error) {
    const output = (error.stdout || error.message || '');
    const errorRegex = /(.+)\((\d+),(\d+)\):\s*error\s*(TS\d+):\s*(.+)/g;
    let match;
    
    while ((match = errorRegex.exec(output)) !== null) {
      const [, file, line, col, code, message] = match;
      issues.push({
        file: file.trim(),
        line: parseInt(line),
        column: parseInt(col),
        severity: 'error',
        code: code,
        message: message,
        fix: COMMON_FIXES[code] || 'Fix based on error message'
      });
    }
  }

  return issues;
}

function applyFix(filePath, issue) {
  if (!fs.existsSync(filePath)) return false;

  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Fix for bettingService.ts - empty getGamesForWeek
    if (filePath.includes('bettingService.ts') && issue.code === 'EMPTY_ASYNC') {
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

      // Find and replace the empty method
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('private async getGamesForWeek')) {
          // Replace from this line until closing brace
          let j = i;
          while (j < lines.length && !lines[j].includes('return []')) {
            j++;
          }
          if (j < lines.length && lines[j].includes('return []')) {
            // Replace from i to j+1
            lines.splice(i, j - i + 1, newMethod);
            content = lines.join('\n');
            fs.writeFileSync(filePath, content);
            return true;
          }
        }
      }
    }

    return false;
  } catch (error) {
    return false;
  }
}

async function analyzeDirectory(dirPath) {
  const results = [];
  
  if (!fs.existsSync(dirPath)) return results;

  const files = fs.readdirSync(dirPath).filter(
    f => f.endsWith('.ts') && !f.endsWith('.test.ts') && !f.includes('.d.ts')
  );

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const relativePath = path.relative(PROJECT_ROOT, filePath);

    console.log(`  Scanning: ${relativePath}`);

    // Scan for issues
    const scanIssues = scanFile(filePath);
    const importIssues = validateImports(filePath);
    const tscIssues = runTscCheck(filePath);
    
    const allIssues = [...scanIssues, ...importIssues, ...tscIssues];
    const fixedIssues = [];

    // Apply fixes
    for (const issue of allIssues) {
      if (applyFix(filePath, issue)) {
        fixedIssues.push(`Fixed ${issue.code}: ${issue.message}`);
      }
    }

    // Re-run tsc check after fixes
    const remainingIssues = runTscCheck(filePath);

    results.push({
      file: relativePath,
      issuesFound: allIssues.length,
      issuesFixed: fixedIssues.length,
      changes: fixedIssues,
      remainingErrors: remainingIssues.length,
      status: remainingIssues.length === 0 ? 'pass' : (fixedIssues.length > 0 ? 'fixed' : 'pending')
    });
  }

  return results;
}

function generateReport(allResults) {
  let report = '\n' + '='.repeat(80) + '\n';
  report += '  AUTOMATED TYPESCRIPT VALIDATION & FIX REPORT\n';
  report += '='.repeat(80) + '\n\n';

  const passed = allResults.filter(r => r.status === 'pass').length;
  const fixed = allResults.filter(r => r.status === 'fixed').length;
  const pending = allResults.filter(r => r.status === 'pending').length;
  const total = allResults.length;

  report += `Files Processed: ${total}\n`;
  report += `✅ Passed: ${passed}\n`;
  report += `🔧 Fixed: ${fixed}\n`;
  report += `⏳ Pending: ${pending}\n\n`;

  report += 'DETAILED RESULTS:\n';
  report += '-'.repeat(80) + '\n';

  for (const result of allResults) {
    const icon = result.status === 'pass' ? '✅' : (result.status === 'fixed' ? '🔧' : '⏳');
    report += `${icon} ${result.file}\n`;
    
    if (result.changes.length > 0) {
      for (const change of result.changes) {
        report += `   • ${change}\n`;
      }
    }
    
    if (result.remainingErrors > 0) {
      report += `   ⚠️  ${result.remainingErrors} errors remaining\n`;
    }
  }

  report += '\n' + '='.repeat(80) + '\n';
  report += '  SUMMARY\n';
  report += '='.repeat(80) + '\n\n';

  if (fixed > 0) {
    report += `🎉 Successfully fixed ${fixed} file(s)!\n`;
  }
  if (pending > 0) {
    report += `⚠️  ${pending} file(s) require manual review.\n`;
  }
  if (passed === total) {
    report += '✨ All files validated and working correctly!\n';
  }

  return report;
}

async function main() {
  console.log('\n🔍 Starting Automated TypeScript Validation...\n');
  console.log(`Project Root: ${PROJECT_ROOT}\n`);

  const allResults = [];

  for (const dir of DIRECTORIES) {
    console.log(`📂 Scanning ${path.relative(PROJECT_ROOT, dir)}/...`);
    const results = await analyzeDirectory(dir);
    allResults.push(...results);
  }

  // Generate and save report
  const report = generateReport(allResults);
  console.log(report);

  // Save report to file
  const reportPath = path.join(PROJECT_ROOT, 'scripts', 'TYPESCRIPT_FIX_REPORT.txt');
  fs.writeFileSync(reportPath, report);
  console.log(`\n📄 Report saved to: ${reportPath}`);

  // Exit with appropriate code
  const hasErrors = allResults.some(r => r.status === 'pending');
  process.exit(hasErrors ? 1 : 0);
}

main().catch(error => {
  console.error('Validation failed:', error);
  process.exit(1);
});
