import { CustomTheme, useTheme } from "@react-navigation/native";
import { ReactNode } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { getGlobalStyles } from "../../theme/styles";

type FormSectionProps = {
	label?: string;
	children: ReactNode;
};

const FormSection = ({ label, children }: FormSectionProps) => {
	const theme = useTheme();
	const styles = getStyles(theme);
	const globalStyles = getGlobalStyles(theme);

	return (
		<View style={[globalStyles.card, styles.card]}>
			{label && <Text style={styles.label}>{label}</Text>}
			{children}
		</View>
	);
};

export default FormSection;

const getStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		card: {
			padding: theme.spacing.lg,
			gap: theme.spacing.md,
		},
		label: {
			color: theme.colors.textMuted,
			fontSize: theme.fontSize.xs,
			fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
		},
	});
