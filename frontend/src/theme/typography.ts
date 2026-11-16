import { DefaultTheme } from "@react-navigation/native";

export const fontSize = {
	xxs: 10,
	xs: 12,
	sm: 13,
	md: 14,
	lg: 16,
	xl: 18,
	xxl: 24,
	display: 32,
	hero: 64,
};

export const typography = {
	...DefaultTheme.fonts,
	title: { fontSize: fontSize.xxl, fontWeight: "700" as const },
	body: { fontSize: fontSize.lg, fontWeight: "400" as const },
	caption: { fontSize: fontSize.sm, fontWeight: "400" as const },
};
