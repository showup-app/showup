import { AppScreenProps } from "../navigation/types";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, Text, View } from "react-native";
import { CustomTheme, useTheme } from "@react-navigation/native";
import Button from "../components/ui/Button";
import Logo from "../components/ui/Logo";

const SplashScreen = ({ navigation }: AppScreenProps<"Splash">) => {
	const theme = useTheme();
	const styles = getStyles(theme);

	return (
		<SafeAreaView style={styles.screen}>
			<View style={{ alignSelf: "center" }}>
				<Logo />
				<Text style={styles.subtitle}>Sports events you can count on</Text>
			</View>
			<View style={{ gap: 15 }}>
				<Button onPress={() => navigation.navigate("Register")} variant="primary">
					Register
				</Button>
				<Button variant="outline" onPress={() => navigation.navigate("Login")}>
					Login
				</Button>
			</View>
		</SafeAreaView>
	);
};

export default SplashScreen;

const getStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		screen: {
			flex: 1,
			justifyContent: "space-between",
			marginTop: 50,
			marginBottom: 50,
			width: "90%",
			alignSelf: "center",
		},
		subtitle: {
			fontWeight: 400,
			color: theme.colors.textMuted,
			fontSize: 16,
		},
	});
