import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CustomTheme, useTheme } from "@react-navigation/native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Logo from "../ui/Logo";

type AppHeaderProps = {
	reputation?: number;
	onAvatarPress?: () => void;
};

const AppHeader = ({ reputation, onAvatarPress }: AppHeaderProps) => {
	const theme = useTheme();
	const styles = getStyles(theme);

	return (
		<SafeAreaView edges={["top"]} style={styles.safeArea}>
			<View style={styles.bar}>
				<Logo textStyle={styles.logo} />
				<Pressable onPress={onAvatarPress} hitSlop={8} style={styles.avatarWrap}>
					<MaterialCommunityIcons name="account-circle" size={36} color={theme.colors.textMuted} />
					{reputation !== undefined && <Text style={styles.reputation}>★ {reputation}</Text>}
				</Pressable>
			</View>
		</SafeAreaView>
	);
};

export default AppHeader;

const getStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		safeArea: {
			backgroundColor: theme.colors.background,
			borderBottomWidth: 1,
			borderBottomColor: theme.colors.border,
		},
		bar: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
			paddingHorizontal: 24,
			paddingVertical: 12,
		},
		logo: {
			fontSize: 26,
			textAlign: "left",
		},
		avatarWrap: {
			alignItems: "center",
		},
		reputation: {
			position: "absolute",
			top: -4,
			right: -18,
			color: theme.colors.textSecondary,
			fontSize: 10,
		},
	});
