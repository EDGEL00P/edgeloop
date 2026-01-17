/**
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