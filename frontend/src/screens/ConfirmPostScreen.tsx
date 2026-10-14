import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../components/ui/Button";
import { AppScreenProps } from "../navigation/types";
import { CustomTheme, useTheme } from "@react-navigation/native";
import GameCard from "../components/game/GameCard";
import { useState } from "react";
import FormErrorMessage from "../components/ui/FormErrorMessage";

const ConfirmPostScreen = ({
	navigation,
	route,
}: AppScreenProps<"ConfirmPost">) => {
	const theme = useTheme();
	const styles = getStyles(theme);

	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handlePost = () => {
		setIsSubmitting(true);
		navigation.popTo("Tabs", { screen: "Home" });
		setIsSubmitting(false);
	};

	return (
		<SafeAreaView style={styles.screen} edges={["left", "right", "bottom"]}>
			<GameCard game={route.params.draft} />
			<View style={styles.buttonsContainer}>
				<Button
					buttonStyle={{
						flexBasis: "30%",
					}}
					variant="outline"
					onPress={() =>
						navigation.navigate("CreatePost", {
							draft: route.params.draft,
						})
					}
				>
					Edit
				</Button>
				<Button
					buttonStyle={{
						flexBasis: "60%",
					}}
					variant="primary"
					onPress={() => handlePost()}
					disabled={isSubmitting}
				>
					Post game
				</Button>
				{error !== "" && <FormErrorMessage message={error} />}
			</View>
		</SafeAreaView>
	);
};

export default ConfirmPostScreen;

const getStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		screen: {
			flex: 1,
			justifyContent: "space-between",
			backgroundColor: theme.colors.background,
			width: "90%",
			alignSelf: "center",
			gap: 10,
		},
		buttonsContainer: {
			display: "flex",
			flexDirection: "row",
			width: "100%",
			gap: 20,
			alignSelf: "center",
			alignItems: "center",
			justifyContent: "center",
		},
	});
