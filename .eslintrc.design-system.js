/**
 * Design System ESLint Rules
 * 
 * Enforces mandatory usage of the design system components
 * Prevents usage of forbidden patterns
 */

module.exports = {
  rules: {
    // Forbid raw HTML elements in favor of design system components
    'no-restricted-syntax': [
      'error',
      {
        selector: 'JSXElement[openingElement.name.name="div"][openingElement.attributes.length>0]',
        message: 'Use design system layout components (Grid, Stack, Flex, Container) instead of raw divs with classes'
      },
      {
        selector: 'JSXElement[openingElement.name.name="h1"]',
        message: 'Use <Heading level="hero"> instead of <h1>'
      },
      {
        selector: 'JSXElement[openingElement.name.name="h2"]',
        message: 'Use <Heading level="title"> instead of <h2>'
      },
      {
        selector: 'JSXElement[openingElement.name.name="h3"]',
        message: 'Use <Heading level="subtitle"> instead of <h3>'
      },
      {
        selector: 'JSXElement[openingElement.name.name="p"]',
        message: 'Use <Text> instead of <p>'
      }
    ],

    // Forbid specific className patterns
    'no-restricted-props': [
      'error',
      {
        prop: 'className',
        values: [
          'flex',
          'grid', 
          'space-y-*',
          'space-x-*',
          'max-w-*',
          'grid-cols-*',
          'justify-*',
          'items-*'
        ],
        message: 'Use design system layout components instead of Tailwind layout classes'
      }
    ]
  },

  // Custom rules for design system enforcement
  overrides: [
    {
      files: ['pages/**/*.tsx', 'components/**/*.tsx'],
      rules: {
        // Require design system imports
        'import/no-restricted-paths': [
          'error',
          {
            zones: [
              {
                target: './pages/**/*',
                from: './components/ui',
                message: 'Import from @/components/design-system instead of @/components/ui'
              }
            ]
          }
        ],

        // Warn about missing Container wrapper
        'design-system/require-container': 'warn',
        
        // Error on forbidden patterns
        'design-system/no-raw-layout': 'error',
        'design-system/no-raw-typography': 'error'
      }
    }
  ]
}
