import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppScreenProps } from "../navigation/types";
import { CustomTheme, useFocusEffect, useTheme } from "@react-navigation/native";
import { GameDetail, GameStatus, Player } from "../types/game";
import { api } from "../services/api";
import { useCallback, useState } from "react";
import PlayerCard from "../components/game/PlayerCard";
import GameCard from "../components/game/GameCard";
import Button from "../components/ui/Button";
import { getJoinButtonText } from "../utils/format";
import { useUser } from "../context/UserContext";
import LoadingView from "../components/layout/LoadingView";
import ErrorView from "../components/layout/ErrorView";
import FormErrorMessage from "../components/ui/FormErrorMessage";
import ConfirmModal, { ConfirmModalProps } from "../components/ui/ConfirmModal";

type GameState = { status: "loading" } | { status: "error"; error: string } | { status: "success"; game: GameDetail };
type ModalTypes =
	{ type: "join" } | { type: "leave" } | { type: "cancel" } | { type: "removePlayer"; player: Player } | null;

const GameDetailsScreen = ({ navigation, route }: AppScreenProps<"GameDetails">) => {
	const theme = useTheme();
	const { user, token } = useUser();
	const styles = getStyles(theme);
	const { gameId } = route.params;
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [gameState, setGameState] = useState<GameState>({
		status: "loading",
	});
	const [modal, setModal] = useState<ModalTypes>(null);
	const [loadedAt, setLoadedAt] = useState(0);

	const fetchGame = useCallback(async () => {
		const res = await api.getGame(gameId, token!);
		if (res.ok) {
			setGameState({
				status: "success",
				game: res.data,
			});
		} else {
			setGameState({
				status: "error",
				error: res.error,
			});
		}
	}, [gameId, token]);

	useFocusEffect(
		useCallback(() => {
			fetchGame();
		}, [fetchGame]),
	);

	if (gameState.status === "loading") {
		return <LoadingView message="Loading game…" />;
	}

	if (gameState.status === "error") {
		return (
			<ErrorView
				onRetry={fetchGame}
				errorMsg={gameState.error !== null ? gameState.error : "Something went wrong..."}
			/>
		);
	}

	const { game } = gameState;
	const isFull = game.spots_left <= 0;
	const isHost = user!.id === game.host_id;
	const isCancelled = game.status === GameStatus.Cancelled;
	const isJoinDisabled = (isFull && !game.joined) || isCancelled;

	const handleJoinLeaveGame = async () => {
		setIsSubmitting(true);
		const res = game.joined ? await api.leaveGame(game.id, token!) : await api.joinGame(game.id, token!);
		setLoadedAt(Date.now());
		if (!res.ok) {
			// TODO: Unify error message display across the entire app (i.e.: modal popup? toast message?)
			console.log(res.error, res.status);
		} else {
			setGameState({
				status: "success",
				game: res.data,
			});
		}
		setIsSubmitting(false);
	};

	const handleRemovePlayer = async (playerId: number) => {
		if (isCancelled) return;

		const res = await api.removePlayer(game.id, playerId, token!);
		if (res.ok) {
			setGameState((prev) => {
				if (prev.status !== "success") return prev;

				return {
					...prev,
					game: { ...prev.game, players: prev.game.players.filter((player) => player.id !== playerId) },
				};
			});
		} else {
			console.log(res.error);
		}
	};

	const canEdit =
		(game.status === GameStatus.Open || game.status === GameStatus.Full) &&
		new Date(game.starts_at).getTime() > loadedAt;

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
		const res = await api.cancelGame(game.id, token!);
		if (res.ok) {
			setGameState((prev) => {
				if (prev.status !== "success") return prev;

				return {
					...prev,
					game: { ...prev.game, status: GameStatus.Cancelled },
				};
			});
		} else {
			console.log(res.error);
		}
	};

	const joinButtonText = isSubmitting
		? game.joined
			? "Leaving..."
			: "Joining..."
		: getJoinButtonText(game, user!, true);

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
							isDisabled={isCancelled}
							{...(isHost && {
								onPress: () => {
									setModal({ type: "removePlayer", player: player });
								},
							})}
						/>
					))}
				</ScrollView>
			</View>
			{isHost ? (
				<View style={styles.buttonsContainer}>
					<Button
						buttonStyle={{
							flex: 1,
						}}
						variant="primary"
						disabled={!canEdit}
						onPress={handleEditGame}
					>
						Edit Game Details
					</Button>
					<Button
						buttonStyle={{
							flex: 1,
						}}
						variant="danger"
						disabled={isCancelled}
						onPress={() => setModal({ type: "cancel" })}
					>
						Cancel Game
					</Button>
				</View>
			) : (
				<View style={styles.joinButton}>
					<Button
						disabled={isJoinDisabled || isSubmitting}
						variant={game.joined ? "danger" : "primary"}
						onPress={() => setModal(game.joined ? { type: "leave" } : { type: "join" })}
					>
						{joinButtonText}
					</Button>
				</View>
			)}
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
			gap: 30,
		},
		playerCards: {
			gap: 10,
		},
		playersHeading: {
			flexDirection: "row",
			justifyContent: "space-between",
			width: "100%",
		},
		playersText: {
			fontSize: 14,
			color: "#ADADAD",
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
			gap: 20,
			alignSelf: "center",
			alignItems: "center",
			justifyContent: "space-between",
		},
	});
