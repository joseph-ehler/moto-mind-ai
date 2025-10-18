module.exports = {
  extends: [
    'next/core-web-vitals'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    
    // Prevent inline spacing classes in event blocks
    "no-restricted-syntax": [
      "error",
      {
        "selector": "Literal[value=/\\bmb-1\\b/]",
        "message": "Use LABEL_SPACING constant instead of mb-1"
      },
      {
        "selector": "Literal[value=/\\bpx-[0-9]\\b/]",
        "message": "Use getBlockSize() instead of inline px- classes"
      },
      {
        "selector": "Literal[value=/\\bpy-[0-9]\\b/]",
        "message": "Use getBlockSize() instead of inline py- classes"
      }
    ],
    
    // Prevent magic numbers in confidence thresholds
    "@typescript-eslint/no-magic-numbers": [
      "warn",
      {
        "ignore": [0, 1, 70, 85, 100],
        "ignoreArrayIndexes": true,
        "ignoreDefaultValues": true,
        "ignoreNumericLiteralTypes": true,
        "ignoreReadonlyClassProperties": true,
        "ignoreEnums": true
      }
    ]
  }
}
