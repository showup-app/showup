import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppScreenProps } from "../navigation/types";
import { CustomTheme, useFocusEffect, useTheme } from "@react-navigation/native";
import { GameStatus, Player } from "../types/game";
import { api } from "../services/api";
import { useCallback, useState } from "react";
import PlayerCard from "../components/game/PlayerCard";
import GameCard from "../components/game/GameCard";
import Button from "../components/ui/Button";
import { getJoinButtonText } from "../utils/format";
import { useAuthenticatedUser } from "../context/UserContext";
import LoadingView from "../components/layout/LoadingView";
import ErrorView from "../components/layout/ErrorView";
import FormErrorMessage from "../components/ui/FormErrorMessage";
import ConfirmModal, { ConfirmModalProps } from "../components/ui/ConfirmModal";
import Toast from "react-native-toast-message";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import useAsync from "../hooks/useAsync";

type ModalTypes =
	{ type: "join" } | { type: "leave" } | { type: "cancel" } | { type: "removePlayer"; player: Player } | null;

const GameDetailsScreen = ({ navigation, route }: AppScreenProps<"GameDetails">) => {
	const theme = useTheme();
	const { user, token } = useAuthenticatedUser();
	const styles = getStyles(theme);
	const { gameId } = route.params;
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [modal, setModal] = useState<ModalTypes>(null);
	const [loadTime] = useState(() => Date.now());

	const fetchGame = useCallback(() => api.getGame(gameId, token), [token, gameId]);
	const { data: game, status, error, execute: loadGame, setData: setGame } = useAsync(fetchGame);

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

	const isFull = game.spots_left <= 0 || game.status === GameStatus.Full;
	const isHost = user.id === game.host_id;
	const isCancelled = game.status === GameStatus.Cancelled;
	const isStarted = new Date(game.starts_at).getTime() <= loadTime;
	const isPlayable = game.status === GameStatus.Open || game.status === GameStatus.Full;

	const canManage = isPlayable && !isStarted;
	const canJoinLeave = (!isFull || game.joined) && isPlayable && !isStarted && !isSubmitting;

	const handleJoinLeaveGame = async () => {
		setIsSubmitting(true);
		const res = game.joined ? await api.leaveGame(game.id, token) : await api.joinGame(game.id, token);
		if (!res.ok) {
			Toast.show({
				type: "error",
				text1: `Failed to ${game.joined ? "leave" : "join"} the game`,
				text2: res.error,
			});
		} else {
			Toast.show({
				type: "success",
				text1: `Successfully ${game.joined ? "left" : "joined"} the game!`,
			});
			setGame(res.data);
		}
		setIsSubmitting(false);
	};

	const handleRemovePlayer = async (playerId: number) => {
		if (!canManage) return;

		const res = await api.removePlayer(game.id, playerId, token);
		if (res.ok) {
			Toast.show({
				type: "success",
				text1: "Player was successfully removed from the game",
			});
			setGame((prev) => ({
				...prev,
				players: prev.players.filter((player) => player.id !== playerId),
			}));
		} else {
			Toast.show({
				type: "error",
				text1: "Failed to remove player from the game",
				text2: res.error,
			});
		}
	};

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

	const handleCancelGame = async () => {
		const res = await api.cancelGame(game.id, token);
		if (res.ok) {
			setGame((prev) => ({
				...prev,
				status: GameStatus.Cancelled,
			}));
		} else {
			Toast.show({
				type: "error",
				text1: "Failed to cancel this game",
				text2: res.error,
			});
		}
	};

	const joinLeaveButtonText = isSubmitting
		? game.joined
			? "Leaving..."
			: "Joining..."
		: getJoinButtonText(game, user, true);

	const getModalProps = (modal: NonNullable<ModalTypes>): Omit<ConfirmModalProps, "onCancel" | "visible"> => {
		switch (modal.type) {
			case "cancel":
				return {
					title: "Cancel Game",
					message: "Are you sure you want to cancel this game? This action cannot be undone.",
					onConfirm: handleCancelGame,
				};
			case "join":
				return {
					title: "Join Game",
					message:
						"Are you sure you want to join this game? Failing to attend may decrease your profile's reputation.",
					onConfirm: handleJoinLeaveGame,
				};
			case "leave":
				return {
					title: "Leave Game",
					message: "Are you sure you want to leave this game?",
					onConfirm: handleJoinLeaveGame,
				};
			case "removePlayer":
				return {
					title: "Remove Player",
					message: `Are you sure you want to remove ${modal.player.name} from the game?`,
					onConfirm: () => handleRemovePlayer(modal.player.id),
				};
		}
	};

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
						{joinLeaveButtonText}
					</Button>
				</View>
			)}
			<View style={styles.playersContainer}>
				<View style={styles.playersHeading}>
					<Text style={styles.playersText}>PLAYERS</Text>
					<Text style={styles.playersText}>
						{game.players.length}/{game.spots} joined
					</Text>
				</View>
				<ScrollView contentContainerStyle={styles.playerCards}>
					{game.players.map((player) => (
						<PlayerCard
							key={player.id}
							player={player}
							isDisabled={!canManage}
							{...(isHost && {
								onPress: () => {
									setModal({ type: "removePlayer", player: player });
								},
							})}
						/>
					))}
				</ScrollView>
			</View>

			{modal !== null && (
				<ConfirmModal
					visible
					onCancel={() => setModal(null)}
					{...getModalProps(modal)}
					onConfirm={() => {
						getModalProps(modal).onConfirm();
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
		playerCards: {
			gap: 8,
		},
		playersHeading: {
			flexDirection: "row",
			justifyContent: "space-between",
			width: "100%",
		},
		playersText: {
			fontSize: theme.fontSize.md,
			color: theme.colors.textMuted,
		},
		playersContainer: {
			gap: 10,
			flex: 1,
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
