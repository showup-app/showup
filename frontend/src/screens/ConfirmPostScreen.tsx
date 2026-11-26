import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../components/ui/Button";
import { AppScreenProps } from "../navigation/types";
import { CommonActions, CustomTheme, useTheme } from "@react-navigation/native";
import GameCard from "../components/game/GameCard";
import { useCallback } from "react";
import FormErrorMessage from "../components/ui/FormErrorMessage";
import { api } from "../services/api";
import { useAuthenticatedUser } from "../context/UserContext";
import Toast from "react-native-toast-message";
import useAsync from "../hooks/useAsync";
import { getGlobalStyles } from "../theme/styles";

const ConfirmPostScreen = ({ navigation, route }: AppScreenProps<"ConfirmPost">) => {
	const theme = useTheme();
	const styles = getStyles(theme);
	const globalStyles = getGlobalStyles(theme);
	const { draft } = route.params;
	const { token } = useAuthenticatedUser();

	const createGameCallback = useCallback(() => api.createGame(draft, token), [draft, token]);
	const { error, execute: createGame, status } = useAsync(createGameCallback);

	const handlePost = async () => {
		const res = await createGame();

		if (res.ok) {
			Toast.show({
				type: "success",
				text1: "Game successfully created!",
			});
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
		}
	};

	return (
		<SafeAreaView
			style={[globalStyles.screen, globalStyles.screenPadding, styles.screen]}
			edges={["left", "right", "bottom"]}
		>
			<GameCard game={draft} />
			<View style={{ display: "flex", gap: theme.spacing.md }}>
				{error && <FormErrorMessage message={error} />}
				<View style={globalStyles.buttonRow}>
					<Button
						buttonStyle={{
							flex: 1,
						}}
						variant="outline"
						onPress={() => navigation.goBack()}
					>
						Edit
					</Button>
					<Button
						buttonStyle={{
							flex: 2,
						}}
						variant="primary"
						onPress={handlePost}
						disabled={status === "loading"}
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
			justifyContent: "space-between",
			gap: theme.spacing.md,
		},
	});
