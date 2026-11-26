import { CustomTheme, useTheme } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";

const TitleAndSubtitle = ({ titleText, subtitleText }: { titleText: string; subtitleText?: string }) => {
	const theme = useTheme();
	const styles = getStyles(theme);

	return (
		<View style={styles.container}>
			<Text style={styles.titleText}>{titleText}</Text>
			{subtitleText && (
				<Text style={styles.subtitleText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
					{subtitleText}
				</Text>
			)}
		</View>
	);
};

export default TitleAndSubtitle;

const getStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		container: {
			alignItems: "center",
			gap: theme.spacing.sm,
		},
		titleText: {
			fontFamily: theme.fontFamily.medium,
			color: theme.colors.text,
			fontSize: theme.fontSize.display,
			textAlign: "center",
		},
		subtitleText: {
			fontFamily: theme.fontFamily.regular,
			color: theme.colors.textMuted,
			fontSize: theme.fontSize.lg,
			textAlign: "center",
		},
	});
