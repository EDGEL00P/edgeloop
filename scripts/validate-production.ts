/**
 * Production Readiness Validation
 * Checks for common production issues
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { envRegistry } from '../infra/env/registry';

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

const DEFAULT_SCOPES = new Set(['server', 'web', 'trigger']);

function parseScopes(): Set<string> {
  const raw = process.env.ENV_VALIDATE_SCOPES;
  if (!raw) return DEFAULT_SCOPES;
  return new Set(
    raw
      .split(',')
      .map((scope) => scope.trim())
      .filter(Boolean),
  );
}

export function validateProduction(): ValidationResult {
  const result: ValidationResult = {
    passed: true,
    errors: [],
    warnings: [],
  };

  const scopes = parseScopes();
  const requiredVars = envRegistry.filter((entry) => {
    const isRequired =
      entry.required ||
      (!!entry.requiredInProduction && process.env.NODE_ENV === 'production');
    if (!isRequired) return false;
    return entry.scopes.some((scope) => scopes.has(scope));
  });

  for (const entry of requiredVars) {
    if (!process.env[entry.name]) {
      result.errors.push(`Missing required environment variable: ${entry.name}`);
      result.passed = false;
    }
  }

  // Check package.json engines
  try {
    const packageJson = JSON.parse(
      readFileSync(join(process.cwd(), 'package.json'), 'utf-8')
    );
    
    if (!packageJson.engines?.node) {
      result.warnings.push('package.json missing engines.node');
    }
  } catch (error) {
    result.errors.push('Could not read package.json');
    result.passed = false;
  }

  // Check vercel.json
  try {
    const vercelJson = JSON.parse(
      readFileSync(join(process.cwd(), 'vercel.json'), 'utf-8')
    );
    
    if (!vercelJson.functions) {
      result.warnings.push('vercel.json missing functions configuration');
    }
  } catch (error) {
    result.warnings.push('Could not read vercel.json (may not be using Vercel)');
  }

  // Optional performance warnings
  if (!process.env.REDIS_URL) {
    result.warnings.push('REDIS_URL not set (cache will be memory-only)');
  }

  return result;
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectRun) {
  const result = validateProduction();
  
  if (result.warnings.length > 0) {
    console.warn('⚠️  Warnings:');
    result.warnings.forEach(w => console.warn(`   - ${w}`));
  }
  
  if (result.errors.length > 0) {
    console.error('❌ Errors:');
    result.errors.forEach(e => console.error(`   - ${e}`));
    process.exit(1);
  }
  
  console.log('✅ Production validation passed');
}
