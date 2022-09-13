module.exports = {
    "env": {
        "browser": true,
        "node": true,
        "es2021": true,
    },
    "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "prettier",
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": 12,
        "sourceType": "module",
    },
    "plugins": [
        "@typescript-eslint",
    ],
    "ignorePatterns": [
        "webpack.config.js",
        "tailwind.config.js",
    ],
    "rules": {
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/ban-types": "off",
    }
};