import { AuthScreenProps } from "../navigation/types";
import { SafeAreaView } from "react-native-safe-area-context";
import { Animated, StyleSheet, Text, View } from "react-native";
import { CustomTheme, useTheme } from "@react-navigation/native";
import Button from "../components/ui/Button";
import Logo from "../components/ui/Logo";
import { useCallback, useState } from "react";
import LogoMark from "../components/ui/LogoMark";

const SplashScreen = ({ navigation }: AuthScreenProps<"Splash">) => {
	const theme = useTheme();
	const styles = getStyles(theme);
	const [fade] = useState(() => new Animated.Value(0));

	const showRest = useCallback(() => {
		Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
	}, [fade]);

	return (
		<SafeAreaView style={styles.screen}>
			<View style={styles.hero}>
				<LogoMark size={140} animated onDone={showRest} />
				<Animated.View style={{ opacity: fade, alignItems: "center", gap: theme.spacing.sm }}>
					<Logo textStyle={styles.wordmark} />
					<Text style={styles.subtitle}>Sports events you can count on</Text>
				</Animated.View>
			</View>
			<Animated.View style={{ gap: theme.spacing.lg, opacity: fade }}>
				<Button onPress={() => navigation.navigate("Register")} variant="primary">
					Register
				</Button>
				<Button variant="outline" onPress={() => navigation.navigate("Login")}>
					Login
				</Button>
			</Animated.View>
		</SafeAreaView>
	);
};

export default SplashScreen;

const getStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		screen: {
			flex: 1,
			justifyContent: "center",
			gap: 56,
			paddingBottom: 80,
			width: "90%",
			alignSelf: "center",
		},
		subtitle: {
			fontWeight: 400,
			color: theme.colors.textMuted,
			fontSize: theme.fontSize.lg,
		},
		hero: {
			alignItems: "center",
			gap: theme.spacing.xxl,
		},
		wordmark: {
			fontSize: theme.fontSize.display,
		},
	});
