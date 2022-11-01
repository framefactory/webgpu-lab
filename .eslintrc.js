module.exports = {
    "env": {
        "browser": true,
        "node": true,
        "es2022": true,
    },
    "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "prettier",
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": "latest",
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
        "@typescript-eslint/ban-ts-comment": "warn",
        "@typescript-eslint/no-this-alias": "off",
        //"no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": [ "warn", { 
            "argsIgnorePattern": "^_",
            "caughtErrorsIgnorePattern": "^_",
            //"varsIgnorePattern": "^_",
        }
    }
};