import { CustomTheme, useTheme } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LogoMark from "../ui/LogoMark";

type AppHeaderProps = {
	title: string;
};

const AppHeader = ({ title }: AppHeaderProps) => {
	const theme = useTheme();
	const styles = getStyles(theme);

	return (
		<SafeAreaView edges={["top"]} style={styles.safeArea}>
			<View style={styles.bar}>
				<LogoMark size={34} strokeWidth={90} />
				<Text style={styles.title}>{title}</Text>
			</View>
		</SafeAreaView>
	);
};

export default AppHeader;

const getStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		safeArea: {
			backgroundColor: theme.colors.chrome,
			borderBottomWidth: 1,
			borderBottomColor: theme.colors.border,
		},
		bar: {
			flexDirection: "row",
			alignItems: "center",
			gap: theme.spacing.md,
			paddingHorizontal: theme.spacing.xl,
			paddingVertical: theme.spacing.md,
		},
		title: {
			fontSize: theme.fontSize.xxl,
			fontFamily: theme.fontFamily.medium,
			color: theme.colors.text,
		},
	});
