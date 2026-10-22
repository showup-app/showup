import js from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginReactNative from "eslint-plugin-react-native";
import globals from "globals";

export default [
	{
		ignores: [
			"node_modules/**",
			"android/**",
			"ios/**",
			".expo/**",
			"build/**",
			"dist/**",
		],
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	pluginReact.configs.flat.recommended,
	pluginReact.configs.flat["jsx-runtime"],
	{
		files: ["**/*.{js,jsx,ts,tsx}"],
		plugins: {
			"react-hooks": pluginReactHooks,
			"react-native": pluginReactNative,
		},
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			globals: {
				...globals.node,
				...globals.browser,
				__DEV__: "readonly",
			},
		},
		settings: {
			react: { version: "detect" },
		},
		rules: {
			...pluginReactHooks.configs.recommended.rules,
			"react-native/no-inline-styles": "off",
			"react-native/no-color-literals": "off",
			"react-native/no-raw-text": "error",
			"react/react-in-jsx-scope": "off",
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{ argsIgnorePattern: "^_" },
			],
		},
	},
];
