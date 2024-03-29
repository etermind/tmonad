module.exports = {
    env: {
        browser: true,
        es6: true,
        node: true,
    },
    settings: {
        jsdoc: {
            maxLines: 3,
        },
    },
    parser: "@typescript-eslint/parser",
    parserOptions: {
        project: "tsconfig.eslint.json",
        sourceType: "module",
    },
    plugins: ["@typescript-eslint", "jsdoc"],
    rules: {
        "no-param-reassign": ["error", { props: false }],
        "no-else-return": "error",
        "brace-style": ["error", "stroustrup", { allowSingleLine: true }],
        "object-shorthand": ["error", "always", { avoidQuotes: true }],
        "object-curly-spacing": ["error", "always"],
        "no-array-constructor": "off",
        "@typescript-eslint/no-array-constructor": ["error"],
        "space-in-parens": ["error", "never"],
        "arrow-parens": ["error", "as-needed"],
        "computed-property-spacing": ["error", "never"],
        "func-call-spacing": ["error", "never"],
        indent: ["error", 4, { SwitchCase: 0 }],
        "prefer-arrow-callback": "error",
        "@typescript-eslint/indent": [
            "error",
            4,
            {
                ArrayExpression: "first",
                ObjectExpression: "first",
                FunctionDeclaration: {
                    parameters: "first",
                },
                FunctionExpression: {
                    parameters: "first",
                },
            },
        ],
        "@typescript-eslint/member-delimiter-style": [
            "error",
            {
                multiline: {
                    delimiter: "semi",
                    requireLast: true,
                },
                singleline: {
                    delimiter: "semi",
                    requireLast: false,
                },
            },
        ],
        "@typescript-eslint/naming-convention": [
            "error",
            {
                selector: "default",
                format: ["camelCase"],
                leadingUnderscore: "forbid",
                trailingUnderscore: "forbid",
            },
            {
                selector: "variable",
                modifiers: ["global", "const"],
                format: ["camelCase", "UPPER_CASE"],
            },
            {
                selector: "variable",
                types: ["boolean", "string", "number", "array"],
                modifiers: ["exported", "const"],
                format: ["UPPER_CASE"],
            },
            {
                selector: "variable",
                types: ["function"],
                modifiers: ["exported", "const"],
                format: ["camelCase"],
            },
            {
                selector: "parameter",
                modifiers: ["unused"],
                format: null,
                leadingUnderscore: "allow",
            },
            {
                selector: "memberLike",
                modifiers: ["private"],
                leadingUnderscore: "require",
                format: ["camelCase"],
            },
            {
                selector: "memberLike",
                modifiers: ["protected"],
                leadingUnderscore: "require",
                format: ["camelCase"],
            },
            {
                selector: "classMethod",
                filter: {
                    regex: "^toJSON$",
                    match: true,
                },
                format: null,
            },
            {
                selector: ["typeAlias"],
                format: ["PascalCase"],
            },
            {
                selector: "class",
                format: ["PascalCase"],
            },
            {
                selector: "interface",
                prefix: [],
                format: ["PascalCase"],
            },
            {
                selector: "typeParameter",
                format: ["PascalCase"],
                prefix: [],
            },
            {
                selector: "enum",
                format: ["PascalCase", "camelCase"],
            },
            {
                selector: "enumMember",
                format: ["UPPER_CASE", "camelCase"],
            },
            {
                selector: "objectLiteralProperty",
                format: null,
            },
        ],
        "@typescript-eslint/no-this-alias": "error",
        "@typescript-eslint/no-unnecessary-boolean-literal-compare": "error",
        "@typescript-eslint/quotes": [
            "error",
            "single",
            {
                avoidEscape: true,
            },
        ],
        "@typescript-eslint/semi": ["error", "always"],
        "arrow-parens": ["off", "always"],
        "comma-dangle": [
            "error",
            {
                arrays: "never",
                functions: "never",
                objects: "always-multiline",
            },
        ],
        curly: ["error", "multi-line"],
        "eol-last": "off",
        eqeqeq: ["error", "smart"],
        "id-blacklist": "off",
        "id-match": "off",
        "max-len": [
            "error",
            {
                code: 100,
            },
        ],
        "no-duplicate-imports": "error",
        "no-eval": "error",
        "no-multiple-empty-lines": "error",
        "no-new-wrappers": "error",
        "no-trailing-spaces": "error",
        "no-underscore-dangle": "off",
        "no-var": "error",
        "object-shorthand": "error",
        "one-var": ["error", "never"],
        "prefer-const": "error",
        "prefer-template": "error",
        "quote-props": ["error", "as-needed"],
        radix: "error",
        "space-before-function-paren": [
            "error",
            {
                anonymous: "always",
                named: "never",
            },
        ],
        "spaced-comment": [
            "error",
            "always",
            {
                markers: ["/"],
            },
        ],
        "jsdoc/check-access": 2, // Recommended
        "jsdoc/check-alignment": 2, // Recommended
        "jsdoc/check-indentation": 2,
        "jsdoc/check-line-alignment": 0,
        "jsdoc/check-param-names": 2, // Recommended
        "jsdoc/check-property-names": 2, // Recommended
        "jsdoc/check-syntax": 2,
        "jsdoc/check-tag-names": 2, // Recommended
        "jsdoc/check-types": 0, // Recommended
        "jsdoc/check-values": 2, // Recommended
        "jsdoc/empty-tags": 2, // Recommended
        "jsdoc/implements-on-classes": 2, // Recommended
        "jsdoc/match-description": [
            "error",
            {
                matchDescription: "^([A-Z]|[`\\d_])[\\s\\S]*$",
            },
        ],
        "jsdoc/newline-after-description": 0, // Recommended
        "jsdoc/no-bad-blocks": 2,
        "jsdoc/no-defaults": 2,
        "jsdoc/no-types": 2,
        "jsdoc/no-undefined-types": 2, // Recommended
        "jsdoc/require-description": [
            "error",
            {
                contexts: [
                    "ClassDeclaration",
                    "TSInterfaceDeclaration",
                    "TSMethodSignature",
                    "TSPropertySignature",
                    "MethodDefinition",
                ],
                descriptionStyle: "body",
            },
        ],
        "jsdoc/require-description-complete-sentence": 0,
        "jsdoc/require-example": 0,
        "jsdoc/require-file-overview": 0,
        "jsdoc/require-hyphen-before-param-description": 2,
        "jsdoc/require-jsdoc": [
            "error",
            {
                require: {
                    ClassDeclaration: true,
                    ClassExpression: true,
                    MethodDefinition: true,
                },
                contexts: [
                    "TSInterfaceDeclaration",
                    "TSMethodSignature",
                    "TSPropertySignature",
                ],
                enableFixer: true,
            },
        ], // Recommended
        "jsdoc/require-param": 2, // Recommended
        "jsdoc/require-param-description": 2, // Recommended
        "jsdoc/require-param-name": 2, // Recommended
        "jsdoc/require-param-type": 0, // Recommended
        "jsdoc/require-property": 2, // Recommended
        "jsdoc/require-property-description": 2, // Recommended
        "jsdoc/require-property-name": 2, // Recommended
        "jsdoc/require-property-type": 0, // Recommended
        "jsdoc/require-returns": 2, // Recommended
        "jsdoc/require-returns-check": 2, // Recommended
        "jsdoc/require-returns-description": 2, // Recommended
        "jsdoc/require-returns-type": 0, // Recommended
        "jsdoc/require-throws": 0,
        "jsdoc/require-yields": 2, // Recommended
        "jsdoc/require-yields-check": 2, // Recommended
        "jsdoc/valid-types": 2, // Recommended
    },
};
