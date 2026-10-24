import { CustomTheme, useTheme } from "@react-navigation/native";
import { ReactNode } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

type FormSectionProps = {
	label?: string;
	children: ReactNode;
};

const FormSection = ({ label, children }: FormSectionProps) => {
	const theme = useTheme();
	const styles = getStyles(theme);

	return (
		<View style={styles.card}>
			{label && <Text style={styles.label}>{label}</Text>}
			{children}
		</View>
	);
};

export default FormSection;

const getStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		card: {
			backgroundColor: theme.colors.surface,
			borderColor: theme.colors.border,
			borderWidth: 1,
			borderRadius: 10,
			padding: 16,
			gap: 10,
		},
		label: {
			color: theme.colors.textMuted,
			fontSize: 12,
			fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
		},
	});
