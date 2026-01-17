/**
 * Boundary Enforcement Rules
 * Prevents services from importing each other directly
 * Forces use of contracts/SDKs for inter-service communication
 * 
 * Rule: "Services never import services. Apps never import services. Everything uses contracts and generated SDKs."
 */

module.exports = {
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          // Services cannot import from other services
          {
            group: ['../services/*', '../../services/*', '../../../services/*'],
            message: 'Services cannot import other services. Use @edgeloop/sdk-ts instead.',
            allowTypeImports: false,
          },
          // Apps cannot import services directly
          {
            group: ['../../services/*', '../../../services/*'],
            message: 'Apps cannot import services directly. Use @edgeloop/sdk-ts instead.',
            allowTypeImports: false,
          },
          // Contracts cannot import services or domains
          {
            group: ['../services/*', '../../services/*', '../domains/*', '../../domains/*'],
            message: 'Contracts cannot import services or domains. Keep contracts dependency-clean.',
            allowTypeImports: false,
          },
          // SDKs cannot import services (only contracts)
          {
            group: ['../services/*', '../../services/*'],
            message: 'SDKs can only import from contracts/. They are generated, not handwritten.',
            allowTypeImports: false,
          },
        ],
      },
    ],
  },
};