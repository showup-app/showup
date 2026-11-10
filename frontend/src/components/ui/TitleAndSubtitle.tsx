import { CustomTheme, useTheme } from "@react-navigation/native";
import { StyleSheet, Text } from "react-native";

const TitleAndSubtitle = ({ titleText, subtitleText }: { titleText: string; subtitleText?: string }) => {
	const theme = useTheme();
	const styles = getStyles(theme);

	return (
		<>
			<Text style={styles.titleText}>{titleText}</Text>
			{subtitleText && (
				<Text style={styles.subtitleText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
					{subtitleText}
				</Text>
			)}
		</>
	);
};

export default TitleAndSubtitle;

const getStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		titleText: {
			fontWeight: 600,
			color: theme.colors.text,
			fontSize: 32,
			textAlign: "center",
		},
		subtitleText: {
			fontWeight: 400,
			color: theme.colors.textMuted,
			fontSize: 16,
			textAlign: "center",
		},
	});
