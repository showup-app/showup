import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppScreenProps } from "../navigation/types";
import { CustomTheme, useTheme } from "@react-navigation/native";
import { GameDetail, GameStatus } from "../types/game";
import { api } from "../services/api";
import { useCallback, useEffect, useState } from "react";
import PlayerCard from "../components/game/PlayerCard";
import GameCard from "../components/game/GameCard";
import Button from "../components/ui/Button";
import { getJoinButtonText } from "../utils/format";
import { useUser } from "../context/UserContext";
import LoadingView from "../components/layout/LoadingView";
import ErrorView from "../components/layout/ErrorView";
import FormErrorMessage from "../components/ui/FormErrorMessage";

type GameState = { status: "loading" } | { status: "error"; error: string } | { status: "success"; game: GameDetail };

const GameDetailsScreen = ({ navigation, route }: AppScreenProps<"GameDetails">) => {
	const theme = useTheme();
	const { user, token } = useUser();
	const styles = getStyles(theme);
	const { gameId } = route.params;
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [gameState, setGameState] = useState<GameState>({
		status: "loading",
	});

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

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		fetchGame();
	}, [fetchGame]);

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

	const handleEditGame = () => console.log("Edit game");

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

	const showConfirmCancelGameAlert = () => {
		Alert.alert(
			"Cancel Game?",
			"Are you sure you want to cancel this game? This action cannot be undone.",
			[
				{
					text: "Cancel",
					style: "cancel",
				},
				{
					text: "Confirm",
					style: "destructive",
					onPress: () => handleCancelGame(),
				},
			],
			{ cancelable: true },
		);
	};

	const joinButtonText = isSubmitting
		? game.joined
			? "Leaving..."
			: "Joining..."
		: getJoinButtonText(game, user!, true);

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
							{...(isHost && { onRemove: handleRemovePlayer })}
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
						disabled={isCancelled}
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
						onPress={showConfirmCancelGameAlert}
					>
						Cancel Game
					</Button>
				</View>
			) : (
				<View style={styles.joinButton}>
					<Button
						disabled={isJoinDisabled || isSubmitting}
						variant={game.joined ? "danger" : "primary"}
						onPress={handleJoinLeaveGame}
					>
						{joinButtonText}
					</Button>
				</View>
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
