/**
 * SDK Generation Script
 * Generates TypeScript SDKs from Zod contracts
 * 
 * TODO: Implement full generation with zod-to-openapi
 * For now, this creates type exports from contracts
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const CONTRACTS_DIR = join(process.cwd(), 'contracts', 'http');
const SDK_DIR = join(process.cwd(), 'sdks', 'ts');

// Extract type exports from contract files
function generateSDKFromContracts() {
  console.log('📦 Generating TypeScript SDK from contracts...');
  
  // Create SDK directory
  mkdirSync(SDK_DIR, { recursive: true });
  
  // Generate index file that re-exports contract types
  const indexContent = `/**
 * Generated TypeScript SDK
 * Auto-generated from contracts/http/
 * 
 * DO NOT EDIT MANUALLY - Run: npm run generate:sdk:ts
 */

// Re-export contract types
export * from '../../contracts/http/auth';
export * from '../../contracts/http/oracle';
export * from '../../contracts/http/execution';

// Client stubs (TODO: Implement HTTP clients)
export const identityClient = {
  login: async (req: any) => {
    throw new Error('SDK client not yet implemented - use contracts directly');
  },
};

export const oracleClient = {
  getTeams: async (req: any) => {
    throw new Error('SDK client not yet implemented - use contracts directly');
  },
  getGames: async (req: any) => {
    throw new Error('SDK client not yet implemented - use contracts directly');
  },
};

export const executionClient = {
  analyzeGame: async (req: any) => {
    throw new Error('SDK client not yet implemented - use contracts directly');
  },
};
`;

  writeFileSync(join(SDK_DIR, 'index.ts'), indexContent);
  
  console.log('✅ SDK generated at sdks/ts/index.ts');
  console.log('⚠️  Full client implementation pending - contracts ready for use');
}

if (require.main === module) {
  generateSDKFromContracts();
}

export { generateSDKFromContracts };