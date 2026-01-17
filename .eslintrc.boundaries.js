/**
 * Boundary Enforcement Rules
 * Prevents domains from importing each other directly
 * Forces use of contracts/SDKs for inter-domain communication
 * 
 * Rule: "One product stack, one engine boundary, contracts are the only shared language."
 */

module.exports = {
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          // Domains cannot import from other domains
          {
            group: ['domains/*'],
            message: 'Domains cannot import from other domains. Use contracts/ and generated SDKs from sdks/ instead.',
            allowTypeImports: false,
          },
          // Apps cannot import domains directly
          {
            group: ['apps/*/domains/*', 'domains/*'],
            message: 'Apps cannot import domains directly. Use @edgeloop/sdk-ts instead.',
            allowTypeImports: false,
          },
          // Contracts cannot import domains
          {
            group: ['contracts/*/domains/*'],
            message: 'Contracts cannot import domains. Keep contracts dependency-clean.',
            allowTypeImports: false,
          },
          // SDKs cannot import domains (only contracts)
          {
            group: ['sdks/*/domains/*'],
            message: 'SDKs can only import from contracts/. They are generated, not handwritten.',
            allowTypeImports: false,
          },
        ],
      },
    ],
  },
};
