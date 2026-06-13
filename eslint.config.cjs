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
        Node: "readonly",
        URL: "readonly",
        MutationObserver: "readonly",
        browser: "readonly",
        cancelAnimationFrame: "readonly",
        chrome: "readonly",
        console: "readonly",
        document: "readonly",
        requestAnimationFrame: "readonly",
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
