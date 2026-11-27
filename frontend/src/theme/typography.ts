/** Font files loaded in App.tsx. Each weight is its own family, so use these instead of fontWeight. */
export const fontFamily = {
	regular: "Roboto_400Regular",
	medium: "Roboto_500Medium",
	bold: "Roboto_700Bold",
	mono: "RobotoMono_400Regular",
};

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
	title: { fontSize: fontSize.xxl, fontFamily: fontFamily.bold },
	body: { fontSize: fontSize.lg, fontFamily: fontFamily.regular },
	caption: { fontSize: fontSize.sm, fontFamily: fontFamily.regular },
};

/** React Navigation uses these for header titles and tab labels */
export const navigationFonts = {
	regular: { fontFamily: fontFamily.regular, fontWeight: "normal" as const },
	medium: { fontFamily: fontFamily.medium, fontWeight: "normal" as const },
	bold: { fontFamily: fontFamily.bold, fontWeight: "normal" as const },
	heavy: { fontFamily: fontFamily.bold, fontWeight: "normal" as const },
};
