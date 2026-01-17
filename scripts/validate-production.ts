/**
 * Production Readiness Validation
 * Checks for common production issues
 */

import { readFileSync } from 'fs';
import { join } from 'path';

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'SESSION_SECRET',
  'BALLDONTLIE_API_KEY',
];

export function validateProduction(): ValidationResult {
  const result: ValidationResult = {
    passed: true,
    errors: [],
    warnings: [],
  };

  // Check environment variables
  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      result.errors.push(`Missing required environment variable: ${envVar}`);
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

  return result;
}

if (require.main === module) {
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

export { validateProduction };