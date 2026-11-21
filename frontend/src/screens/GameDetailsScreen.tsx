import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppScreenProps } from "../navigation/types";
import { CustomTheme, useFocusEffect, useTheme } from "@react-navigation/native";
import { Player } from "../types/game";
import { api } from "../services/api";
import { useCallback, useState } from "react";
import GameCard from "../components/game/GameCard";
import Button from "../components/ui/Button";
import { getJoinButtonText } from "../utils/format";
import { useAuthenticatedUser } from "../context/UserContext";
import LoadingView from "../components/layout/LoadingView";
import ErrorView from "../components/layout/ErrorView";
import FormErrorMessage from "../components/ui/FormErrorMessage";
import ConfirmModal from "../components/ui/ConfirmModal";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import useAsync from "../hooks/useAsync";
import PlayersList from "../components/game/PlayersList";
import { getGameModalProps, getGamePermissions } from "../utils/game";
import useGameDetailsActions from "../hooks/useGameDetailsActions";

export type ModalTypes =
	{ type: "join" } | { type: "leave" } | { type: "cancel" } | { type: "removePlayer"; player: Player } | null;

const GameDetailsScreen = ({ navigation, route }: AppScreenProps<"GameDetails">) => {
	const theme = useTheme();
	const { user, token } = useAuthenticatedUser();
	const styles = getStyles(theme);
	const { gameId } = route.params;
	const [modal, setModal] = useState<ModalTypes>(null);

	const fetchGame = useCallback(() => api.getGame(gameId, token), [token, gameId]);
	const { data: game, status, error, execute: loadGame, setData: setGame } = useAsync(fetchGame);

	const { isSubmitting, handleCancelGame, handleJoinLeaveGame, handleRemovePlayer } = useGameDetailsActions(
		game,
		token,
		setGame,
	);

	useFocusEffect(
		useCallback(() => {
			loadGame();
		}, [loadGame]),
	);

	if (status === "loading" || status === "idle") {
		return <LoadingView message="Loading game…" />;
	}

	if (status === "error" || !game) {
		return <ErrorView onRetry={loadGame} errorMsg={error} />;
	}

	const { isCancelled, isHost, canJoinLeave, canManage } = getGamePermissions(game, user.id, isSubmitting);

	const handleEditGame = () =>
		navigation.navigate("CreatePost", {
			edit: {
				gameId: game.id,
				minSpots: game.players.length,
				values: {
					sport: game.sport,
					venue: game.venue,
					address: game.address,
					starts_at: game.starts_at,
					duration_minutes: game.duration_minutes,
					spots: game.spots,
					cost: game.cost,
					min_reputation: game.min_reputation,
				},
			},
		});

	const modalProps =
		modal !== null
			? getGameModalProps(modal, {
					onCancel: handleCancelGame,
					onLeave: handleJoinLeaveGame,
					onJoin: handleJoinLeaveGame,
					onRemovePlayer: (player) => handleRemovePlayer(player.id),
				})
			: null;

	return (
		<SafeAreaView style={styles.screen} edges={["left", "right", "bottom"]}>
			<GameCard game={game} isDetailed />
			{isCancelled && (
				<View style={{ width: "100%" }}>
					<FormErrorMessage message="This game has been cancelled by the host." />
				</View>
			)}
			{isHost ? (
				<View style={styles.buttonsContainer}>
					<Button buttonStyle={{ flex: 1 }} variant="outline" disabled={!canManage} onPress={handleEditGame}>
						<MaterialCommunityIcons name="pencil-outline" size={16} color={theme.colors.text} /> Edit
						details
					</Button>
					<Button
						buttonStyle={{ flex: 1 }}
						variant="dangerSoft"
						disabled={!canManage}
						onPress={() => setModal({ type: "cancel" })}
					>
						<MaterialCommunityIcons name="close" size={16} color={theme.colors.danger} /> Cancel game
					</Button>
				</View>
			) : (
				<View style={styles.joinButton}>
					<Button
						disabled={!canJoinLeave}
						variant={game.joined ? "dangerSoft" : "primary"}
						onPress={() => setModal(game.joined ? { type: "leave" } : { type: "join" })}
					>
						{getJoinButtonText(game, user, true, isSubmitting)}
					</Button>
				</View>
			)}
			<PlayersList
				game={game}
				isDisabled={!canManage}
				isHost={isHost}
				onPress={(player) => {
					setModal({ type: "removePlayer", player: player });
				}}
			/>

			{modalProps && (
				<ConfirmModal
					visible
					onCancel={() => setModal(null)}
					{...modalProps}
					onConfirm={() => {
						modalProps.onConfirm();
						setModal(null);
					}}
				/>
			)}
		</SafeAreaView>
	);
};

export default GameDetailsScreen;

const getStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		screen: {
			flex: 1,
			backgroundColor: theme.colors.background,
			alignItems: "center",
			paddingHorizontal: 20,
			paddingTop: 16,
			gap: 16,
		},
		joinButton: {
			width: "100%",
		},
		buttonsContainer: {
			flexDirection: "row",
			width: "100%",
			gap: 10,
			alignSelf: "center",
			alignItems: "center",
			justifyContent: "space-between",
		},
	});
