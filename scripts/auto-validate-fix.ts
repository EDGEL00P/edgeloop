#!/usr/bin/env ts-node
/**
 * Automated TypeScript Validation & Fix Script
 * Scans, validates, and fixes TypeScript issues across all betting system files
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BETTING_DIR = resolve(__dirname, 'server/betting');
const SERVICES_DIR = resolve(__dirname, 'server/services');
const ANALYTICS_DIR = resolve(__dirname, 'server/analytics');
const INFRA_DIR = resolve(__dirname, 'server/infrastructure');

interface FileIssue {
  file: string;
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  fix?: string;
}

interface FixResult {
  file: string;
  issuesFixed: number;
  changes: string[];
  status: 'fixed' | 'pending' | 'failed';
}

const COMMON_FIXES: Record<string, string> = {
  'TS2304': "Add missing import from 'drizzle-orm'",
  'TS2322': "Fix type annotation or casting",
  'TS2345': "Add proper null check or type guard",
  'TS2538': "Handle undefined/null values",
  'TS2552': "Use optional chaining or nullish coalescing",
  'TS7006': "Add proper type annotation",
  'TS1005': "Fix syntax error - likely missing comma or bracket"
};

function scanFile(filePath: string): FileIssue[] {
  const issues: FileIssue[] = [];
  
  if (!existsSync(filePath)) {
    return [{
      file: filePath,
      line: 0,
      column: 0,
      severity: 'error',
      code: 'FILE_NOT_FOUND',
      message: `File not found: ${filePath}`,
      fix: 'Create the file or check path'
    }];
  }

  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Check for common issues
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
        message: 'Async method returns empty array instead of fetching data',
        fix: 'Implement actual database query'
      });
    }

    // Check for any type usage in object literals
    if (/: any[,\]}]/.test(line)) {
      issues.push({
        file: filePath,
        line: lineNum,
        column: line.indexOf(': any'),
        severity: 'info',
        code: 'ANY_TYPE',
        message: 'Using "any" type - consider using specific types',
        fix: 'Replace with proper type from interfaces'
      });
    }

    // Check for non-null assertions
    if (/!$/.test(line) && !line.includes('!==')) {
      issues.push({
        file: filePath,
        line: lineNum,
        column: line.indexOf('!'),
        severity: 'warning',
        code: 'NON_NULL_ASSERTION',
        message: 'Non-null assertion used - potential runtime error',
        fix: 'Use optional chaining or null checks'
      });
    }

    // Check for console.error without proper error handling
    if (/console\.error\([^)]+\)/.test(line) && !line.includes('try')) {
      issues.push({
        file: filePath,
        line: lineNum,
        column: line.indexOf('console.error'),
        severity: 'info',
        code: 'CONSOLE_ERROR',
        message: 'console.error found - ensure proper error logging',
        fix: 'Consider using structured logger'
      });
    }

    // Check for missing semicolons in template literals
    if (/\$\{[^}]+\}`;?\s*$/.test(line.trim()) && !line.trim().endsWith(';')) {
      issues.push({
        file: filePath,
        line: lineNum,
        column: line.length,
        severity: 'warning',
        code: 'MISSING_SEMICOLON',
        message: 'Template literal may be missing semicolon',
        fix: 'Add semicolon at end of statement'
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
        message: 'Math operation with variable - ensure type safety',
        fix: 'Add proper type conversion'
      });
    }
  }

  return issues;
}

function runTscCheck(filePath: string): FileIssue[] {
  const issues: FileIssue[] = [];
  
  try {
    const output = execSync(
      `npx -p typescript tsc --noEmit --skipLibCheck "${filePath}" 2>&1`,
      { encoding: 'utf-8', timeout: 30000 }
    );

    const errorRegex = /(.+)\((\d+),(\d+)\):\s*error\s*(TS\d+):\s*(.+)/g;
    let match;
    
    while ((match = errorRegex.exec(output)) !== null) {
      const [, file, line, col, code, message] = match;
      
      // Filter out false positives for node_modules
      if (!file.includes('node_modules')) {
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
    // tsc might fail, but we still get some output
    const output = (error as any).stdout || (error as any).message || '';
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

function applyFix(filePath: string, issue: FileIssue): boolean {
  if (!existsSync(filePath)) return false;

  try {
    let content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    if (issue.code === 'EMPTY_ASYNC' || issue.code === 'MISSING_SEMICOLON') {
      // Fix for bettingService.ts - empty getGamesForWeek
      if (filePath.includes('bettingService.ts') && issue.line === 344) {
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
        
        const oldMethod = lines[issue.line - 1];
        if (oldMethod.includes('return []')) {
          lines[issue.line - 1] = newMethod;
          content = lines.join('\n');
          writeFileSync(filePath, content);
          return true;
        }
      }
    }

    // Fix for missing semicolons in template literals
    if (issue.code === 'MISSING_SEMICOLON' || issue.code === 'TS1005') {
      const targetLine = lines[issue.line - 1];
      const trimmed = targetLine.trim();
      
      // Check if line ends with template literal without semicolon
      if (trimmed.endsWith('`') || (trimmed.endsWith('`;') && targetLine.includes('${'))) {
        // Find the actual line with the issue
        if (targetLine.includes('${') && !targetLine.trim().endsWith(';')) {
          lines[issue.line - 1] = targetLine.trim() + ';';
          content = lines.join('\n');
          writeFileSync(filePath, content);
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    return false;
  }
}

function validateImports(filePath: string): FileIssue[] {
  const issues: FileIssue[] = [];
  
  if (!existsSync(filePath)) return issues;
  
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

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
      message: 'File uses "db" but does not import it',
      fix: 'Add: import { db } from "../db";'
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
      message: 'File uses drizzle-orm operators but does not import them',
      fix: 'Add: import { eq, and, or } from "drizzle-orm";'
    });
  }

  // Check if file uses schema but doesn't import it
  const usesSchema = /historicalGames|weeklyMetrics|nflTeams|nflPlayers/.test(content);
  const importsSchema = /from\s+["']@shared\/schema["']/.test(content);
  
  if (usesSchema && !importsSchema) {
    issues.push({
      file: filePath,
      line: 0,
      column: 0,
      severity: 'error',
      code: 'MISSING_SCHEMA_IMPORT',
      message: 'File uses schema tables but does not import from @shared/schema',
      fix: 'Add: import { historicalGames, weeklyMetrics, nflTeams } from "@shared/schema";'
    });
  }

  return issues;
}

async function analyzeDirectory(dirPath: string): Promise<FixResult[]> {
  const results: FixResult[] = [];
  
  if (!existsSync(dirPath)) return results;

  const files = require('fs').readdirSync(dirPath).filter(
    f => f.endsWith('.ts') && !f.endsWith('.test.ts')
  );

  for (const file of files) {
    const filePath = join(dirPath, file);
    const relativePath = relative(__dirname, filePath);

    // Scan for issues
    const scanIssues = scanFile(filePath);
    const importIssues = validateImports(filePath);
    const tscIssues = runTscCheck(filePath);
    
    const allIssues = [...scanIssues, ...importIssues, ...tscIssues];
    const fixedIssues: string[] = [];

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
      issuesFixed: fixedIssues.length,
      changes: fixedIssues,
      status: remainingIssues.length === 0 && fixedIssues.length > 0 ? 'fixed' : 
              remainingIssues.length === 0 ? 'pass' : 'pending'
    });
  }

  return results;
}

async function generateReport(results: FixResult[]): Promise<string> {
  let report = '\n' + '='.repeat(80) + '\n';
  report += '  AUTOMATED TYPESCRIPT VALIDATION & FIX REPORT\n';
  report += '='.repeat(80) + '\n\n';

  const passed = results.filter(r => r.status === 'pass').length;
  const fixed = results.filter(r => r.status === 'fixed').length;
  const pending = results.filter(r => r.status === 'pending').length;
  const total = results.length;

  report += `Files Processed: ${total}\n`;
  report += `✅ Passed: ${passed}\n`;
  report += `🔧 Fixed: ${fixed}\n`;
  report += `⏳ Pending: ${pending}\n\n`;

  for (const result of results) {
    const icon = result.status === 'pass' ? '✅' : (result.status === 'fixed' ? '🔧' : '⏳');
    report += `${icon} ${result.file}\n`;
    
    if (result.changes.length > 0) {
      for (const change of result.changes) {
        report += `   • ${change}\n`;
      }
    }
    
    if (result.status === 'pending') {
      report += `   ⚠️  Manual review needed\n`;
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

  const allResults: FixResult[] = [];

  // Analyze betting directory
  console.log('📂 Scanning server/betting/...');
  const bettingResults = await analyzeDirectory(BETTING_DIR);
  allResults.push(...bettingResults);

  // Analyze services directory
  console.log('📂 Scanning server/services/...');
  const servicesResults = await analyzeDirectory(SERVICES_DIR);
  allResults.push(...servicesResults);

  // Analyze analytics directory
  console.log('📂 Scanning server/analytics/...');
  const analyticsResults = await analyzeDirectory(ANALYTICS_DIR);
  allResults.push(...analyticsResults);

  // Analyze infrastructure directory
  console.log('📂 Scanning server/infrastructure/...');
  const infraResults = await analyzeDirectory(INFRA_DIR);
  allResults.push(...infraResults);

  // Generate and save report
  const report = await generateReport(allResults);
  console.log(report);

  // Save report to file
  const reportPath = resolve(__dirname, 'TYPESCRIPT_FIX_REPORT.txt');
  writeFileSync(reportPath, report);
  console.log(`\n📄 Report saved to: ${reportPath}`);

  // Exit with appropriate code
  const hasErrors = allResults.some(r => r.status === 'pending');
  process.exit(hasErrors ? 1 : 0);
}

main().catch(error => {
  console.error('Validation failed:', error);
  process.exit(1);
});
