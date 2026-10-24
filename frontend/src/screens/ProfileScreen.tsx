import { CommonActions, CustomTheme, useTheme } from "@react-navigation/native";
import { useUser } from "../context/UserContext";
import { TabScreenProps } from "../navigation/types";

import { StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../components/ui/Button";

const ProfileScreen = ({ navigation }: TabScreenProps<"Profile">) => {
	const theme = useTheme();
	const styles = getStyles(theme);

	const { user, logout } = useUser();

	const handleLogout = () => {
		logout();
		navigation.dispatch(
			CommonActions.reset({
				index: 1,
				routes: [{ name: "Splash" }, { name: "Login" }],
			}),
		);
	};

	return (
		<SafeAreaView edges={["left", "right", "bottom"]} style={styles.screen}>
			<Text style={{ color: "#FFFFFF" }}>{user?.id}</Text>
			<Text style={{ color: "#FFFFFF" }}>{user?.name}</Text>
			<Text style={{ color: "#FFFFFF" }}>{user?.email}</Text>
			<Text style={{ color: "#FFFFFF" }}>{user?.reputation}</Text>

			<Button onPress={() => handleLogout()} variant="primary">
				Logout
			</Button>
		</SafeAreaView>
	);
};

export default ProfileScreen;

const getStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		screen: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
	});
