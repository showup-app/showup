import { CustomTheme, useTheme } from "@react-navigation/native";
import { View, StyleSheet } from "react-native";

const ProgressBar = ({ value }: { value: number }) => {
	const theme = useTheme();
	const styles = getStyles(theme);

	const widthPercentage = `${value}%`;

	return (
		<View style={styles.track}>
			<View style={[styles.fill, { width: widthPercentage }]} />
		</View>
	);
};

const getStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		track: {
			height: 12,
			width: "100%",
			backgroundColor: "#3C3C3C",
			borderRadius: 6,
			overflow: "hidden",
		},
		fill: {
			height: "100%",
			backgroundColor: theme.colors.textSecondary,
			borderRadius: 6,
		},
	});

export default ProgressBar;
