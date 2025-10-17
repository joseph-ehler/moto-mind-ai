/**
 * MotoMind Elite-Tier ESLint Configuration
 * 
 * Prevents:
 * 1. Hardcoded URLs (localhost, production domains)
 * 2. Non-barrel imports (relative paths to design system)
 * 3. Deep relative imports (more than 2 levels)
 * 
 * Status: Enforced in CI/CD + pre-commit hooks
 */

module.exports = {
  extends: ['./.eslintrc.js'], // Extend existing config
  
  rules: {
    /**
     * RULE 1: No hardcoded URLs
     * Detects localhost, http://, https:// in strings
     */
    'no-restricted-syntax': [
      'error',
      {
        selector: 'Literal[value=/^https?:\\/\\/localhost/]',
        message: '❌ Hardcoded localhost URL detected! Use apiUrl() from @/lib/utils/api-url instead.'
      },
      {
        selector: 'Literal[value=/^https?:\\/\\/motomind\\.app/]',
        message: '❌ Hardcoded production URL detected! Use apiUrl() or absoluteApiUrl() instead.'
      },
      {
        selector: 'TemplateLiteral[quasis.*.value.raw=/https?:\\/\\/localhost/]',
        message: '❌ Hardcoded localhost URL in template literal! Use apiUrl() instead.'
      },
      {
        selector: 'TemplateLiteral[quasis.*.value.raw=/https?:\\/\\/motomind\\.app/]',
        message: '❌ Hardcoded production URL in template literal! Use apiUrl() instead.'
      }
    ],

    /**
     * RULE 2: No relative imports to design system
     * Must use barrel export: @/components/design-system
     */
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: [
              '**/components/design-system/primitives/*',
              '**/components/design-system/patterns/*',
              '**/components/design-system/feedback/*',
              '**/components/design-system/forms/*',
              '../../../components/design-system/**',
              '../../components/design-system/**',
              '../components/design-system/**'
            ],
            message: '❌ Do not import design system components directly! Use barrel import: import { Component } from \'@/components/design-system\''
          },
          {
            group: ['../**/../**/../**/'],
            message: '❌ Deep relative imports (4+ levels) are forbidden! Use path aliases (@/) instead.'
          }
        ]
      }
    ]
  },

  overrides: [
    {
      // Allow internal design system files to use relative imports
      files: ['components/design-system/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: [
                  '../../../primitives/*',
                  '../../../patterns/*',
                  '../../../feedback/*',
                  '../../../forms/*'
                ],
                message: '❌ Use barrel import: import { Component } from \'@/components/design-system\' (even within design system)'
              }
            ]
          }
        ]
      }
    },
    {
      // Documentation and examples can have hardcoded URLs
      files: [
        'docs/**/*',
        '**/*.md',
        '**/README.*',
        '**/__tests__/**/*',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        'scripts/**/*'
      ],
      rules: {
        'no-restricted-syntax': 'off',
        'no-restricted-imports': 'off'
      }
    }
  ]
}
