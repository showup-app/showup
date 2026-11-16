import { StyleProp, StyleSheet, Text, TextStyle } from "react-native";
import { CustomTheme, useTheme } from "@react-navigation/native";

const Logo = ({ textStyle }: { textStyle?: StyleProp<TextStyle> }) => {
	const theme = useTheme();
	const styles = getStyles(theme);

	return (
		<Text style={[styles.logo, textStyle]}>
			Show
			<Text style={{ color: theme.colors.textSecondary }}>Up</Text>
		</Text>
	);
};

export default Logo;

const getStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		logo: {
			fontWeight: 600,
			color: theme.colors.text,
			fontSize: theme.fontSize.hero,
			textAlign: "center",
		},
	});
