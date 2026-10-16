import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../components/ui/Button";
import { AppScreenProps } from "../navigation/types";
import { CommonActions, CustomTheme, useTheme } from "@react-navigation/native";
import GameCard from "../components/game/GameCard";
import { useState } from "react";
import FormErrorMessage from "../components/ui/FormErrorMessage";
import { api } from "../services/api";
import { useUser } from "../context/UserContext";

const ConfirmPostScreen = ({
	navigation,
	route,
}: AppScreenProps<"ConfirmPost">) => {
	const theme = useTheme();
	const styles = getStyles(theme);
	const { draft } = route.params;
	const { token } = useUser();

	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handlePost = async () => {
		setIsSubmitting(true);
		const res = await api.createGame(draft, token!);
		setIsSubmitting(false);
		if (res.ok) {
			navigation.dispatch(
				CommonActions.reset({
					index: 1,
					routes: [
						{ name: "Tabs", params: { screen: "Home" } },
						{
							name: "GameDetails",
							params: { gameId: res.data.id },
						},
					],
				}),
			);
		} else {
			setError(res.error);
		}
	};

	return (
		<SafeAreaView style={styles.screen} edges={["left", "right", "bottom"]}>
			<GameCard game={draft} />
			<View style={{ display: "flex", gap: 10 }}>
				{error && <FormErrorMessage message={error} />}
				<View style={styles.buttonsContainer}>
					<Button
						buttonStyle={{
							flex: 1,
						}}
						variant="outline"
						onPress={() =>
							navigation.navigate("CreatePost", {
								draft: draft,
							})
						}
					>
						Edit
					</Button>
					<Button
						buttonStyle={{
							flex: 2,
						}}
						variant="primary"
						onPress={() => handlePost()}
						disabled={isSubmitting}
					>
						Post game
					</Button>
				</View>
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
			justifyContent: "space-between",
		},
	});
