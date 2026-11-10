import { CustomTheme, useTheme } from "@react-navigation/native";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, SafeAreaViewProps } from "react-native-safe-area-context";

const LoadingView = ({ message, screen = true }: { message: string; screen?: boolean }) => {
	const theme = useTheme();
	const styles = getStyles(theme);
	const baseStyles = [styles.centered];

	const Container = screen ? SafeAreaView : View;
	const containerProps = screen
		? ({ edges: ["left", "right"], style: [baseStyles, styles.screen] } as SafeAreaViewProps)
		: {};

	return (
		<Container style={baseStyles} {...containerProps}>
			<ActivityIndicator color={theme.colors.textSecondary} />
			<Text style={styles.message}>{message}</Text>
		</Container>
	);
};

export default LoadingView;

const getStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		screen: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		centered: {
			alignItems: "center",
			justifyContent: "center",
			gap: 12,
			padding: 20,
		},
		message: {
			color: theme.colors.textMuted,
			fontSize: 14,
		},
	});
