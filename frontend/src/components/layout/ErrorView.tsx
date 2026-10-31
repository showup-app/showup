import { CustomTheme, useTheme } from "@react-navigation/native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, SafeAreaViewProps } from "react-native-safe-area-context";

const ErrorView = ({
	onRetry,
	errorMsg,
	tryAgainMsg = "Try again",
	screen = true,
}: {
	onRetry: () => void;
	errorMsg: string;
	tryAgainMsg?: string;
	screen?: boolean;
}) => {
	const theme = useTheme();
	const styles = getStyles(theme);
	const baseStyles = [styles.centered];

	const Container = screen ? SafeAreaView : View;
	const containerProps = screen
		? ({ edges: ["left", "right"], style: [baseStyles, styles.screen] } as SafeAreaViewProps)
		: {};

	return (
		<Container style={baseStyles} {...containerProps}>
			<Text style={styles.message}>{errorMsg}</Text>
			<Pressable onPress={onRetry} hitSlop={8}>
				<Text style={styles.link}>{tryAgainMsg}</Text>
			</Pressable>
		</Container>
	);
};

export default ErrorView;

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
		link: {
			color: theme.colors.textSecondary,
			fontSize: 14,
			fontWeight: 600,
		},
	});
