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

type GameState = {
	game: GameDetail | null;
	error: string | null;
	loading: boolean;
};

const GameDetailsScreen = ({ navigation, route }: AppScreenProps<"GameDetails">) => {
	const theme = useTheme();
	const { user, token } = useUser();
	const styles = getStyles(theme);
	const { gameId } = route.params;
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [gameState, setGameState] = useState<GameState>({
		game: null,
		error: null,
		loading: true,
	});

	const fetchGame = useCallback(async () => {
		const res = await api.getGame(gameId, token!);
		if (res.ok) {
			setGameState({
				game: res.data,
				error: null,
				loading: false,
			});
		} else {
			setGameState({
				game: null,
				error: res.error,
				loading: false,
			});
		}
	}, [gameId, token]);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		fetchGame();
	}, [fetchGame]);

	if (gameState.loading) {
		return <LoadingView message="Loading game…" />;
	}

	if (gameState.error || !gameState.game) {
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
	const canJoin = (isFull && !game.joined) || isHost;

	const handleJoinLeaveGame = async () => {
		setIsSubmitting(true);
		const res = game.joined ? await api.leaveGame(game.id, token!) : await api.joinGame(game.id, token!);
		if (!res.ok) {
			// TODO: Unify error message display across the entire app (i.e.: modal popup? toast message?)
			console.log(res.error, res.status);
		} else {
			setGameState({
				loading: gameState.loading,
				error: gameState.error,
				game: res.data,
			});
		}
		setIsSubmitting(false);
	};

	const handleRemovePlayer = () => console.log("test");

	const handleCancelGame = async () => {
		const res = await api.cancelGame(game.id, token!);
		if (res.ok) {
			setGameState({
				...gameState,
				game: { ...game, status: GameStatus.Cancelled },
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
			<View style={styles.playersContainer}>
				<View style={styles.playersHeading}>
					<Text style={styles.playersText}>PLAYERS</Text>
					<Text style={styles.playersText}>
						{game.players.length}/{game.spots} joined
					</Text>
				</View>
				<ScrollView contentContainerStyle={styles.playerCards}>
					{game.players.map((player) => (
						<PlayerCard key={player.id} player={player} {...(isHost && { onRemove: handleRemovePlayer })} />
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
						onPress={() => console.log("button 1")}
					>
						Edit Game Details
					</Button>
					<Button
						buttonStyle={{
							flex: 1,
						}}
						variant="danger"
						onPress={showConfirmCancelGameAlert}
					>
						Cancel Game
					</Button>
				</View>
			) : (
				<View style={styles.joinButton}>
					<Button
						disabled={canJoin || isSubmitting}
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
			display: "flex",
			flexDirection: "row",
			justifyContent: "space-between",
			width: "100%",
		},
		playersText: {
			fontSize: 14,
			color: "#ADADAD",
		},
		playersContainer: {
			display: "flex",
			gap: 10,
			flex: 1,
		},
		joinButton: {
			width: "100%",
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
