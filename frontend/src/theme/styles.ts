import { CustomTheme } from "@react-navigation/native";
import { StyleSheet } from "react-native";

export const getGlobalStyles = (theme: CustomTheme) => {
	return StyleSheet.create({
		/** Full-screen background */
		screen: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		/** Side padding for screen content */
		screenPadding: {
			paddingHorizontal: theme.spacing.xl,
		},
		/** Bordered surface: game cards, form sections, profile rows */
		card: {
			backgroundColor: theme.colors.surface,
			borderColor: theme.colors.border,
			borderWidth: 1,
			borderRadius: 10,
			width: "100%",
		},
		/** Row with a section title on the left */
		sectionHeader: {
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "center",
			width: "100%",
		},
		/** Small uppercase label above a list */
		sectionTitle: {
			color: theme.colors.textMuted,
			fontSize: theme.fontSize.sm,
			fontWeight: "600",
			letterSpacing: 1,
			textTransform: "uppercase",
		},
		/** Two or more buttons side by side */
		buttonRow: {
			flexDirection: "row",
			alignItems: "center",
			width: "100%",
			gap: theme.spacing.md,
		},
		/** Tappable text link */
		link: {
			color: theme.colors.brand,
			fontSize: theme.fontSize.sm,
			fontWeight: "600",
		},
		/** Line between sections */
		divider: {
			borderBottomWidth: 1,
			borderBottomColor: theme.colors.border,
		},
		/** Text input box */
		input: {
			backgroundColor: theme.colors.surface,
			borderColor: theme.colors.border,
			borderWidth: 1,
			borderRadius: 8,
			color: theme.colors.text,
			fontSize: theme.fontSize.md,
			paddingVertical: theme.spacing.md,
			paddingHorizontal: theme.spacing.md,
		},
	});
};
