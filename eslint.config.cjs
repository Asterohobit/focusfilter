const js = require("@eslint/js");

module.exports = [
  {
    ignores: ["versions/**", "node_modules/**"],
  },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        URL: "readonly",
        MutationObserver: "readonly",
        browser: "readonly",
        chrome: "readonly",
        console: "readonly",
        document: "readonly",
        window: "readonly",
      },
    },
    rules: {
      "no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
];
