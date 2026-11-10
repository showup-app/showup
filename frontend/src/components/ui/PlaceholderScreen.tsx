import { ReactNode } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { theme } from "../../theme";

/** Stand-in for screens until they're built from the Figma prototypes. */
export function PlaceholderScreen({ title, children }: { title: string; children?: ReactNode }) {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>{title}</Text>
			<View style={styles.links}>{children}</View>
		</View>
	);
}

export function NavButton({ label, onPress }: { label: string; onPress: () => void }) {
	return (
		<Pressable style={styles.button} onPress={onPress}>
			<Text style={styles.buttonText}>{label}</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
		alignItems: "center",
		justifyContent: "center",
		padding: theme.spacing.lg,
	},
	title: { ...theme.typography.title, color: theme.colors.text, marginBottom: theme.spacing.lg },
	links: { gap: theme.spacing.sm, alignSelf: "stretch" },
	button: {
		backgroundColor: theme.colors.surface,
		borderColor: theme.colors.border,
		borderWidth: 1,
		borderRadius: 12,
		padding: theme.spacing.md,
		alignItems: "center",
	},
	buttonText: { ...theme.typography.body, color: theme.colors.brand },
});
