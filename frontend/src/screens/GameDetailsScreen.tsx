import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppScreenProps } from "../navigation/types";
import { CustomTheme, useTheme } from "@react-navigation/native";
import { GameDetail } from "../types/game";
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

const GameDetailsScreen = ({ route }: AppScreenProps<"GameDetails">) => {
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
	const userHostingGame = user!.id === game.host_id;
	const joinButtonDisabled = (isFull && !game.joined) || userHostingGame;

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
						<PlayerCard key={player.id} player={player} />
					))}
				</ScrollView>
			</View>
			<View style={styles.joinButton}>
				<Button
					disabled={joinButtonDisabled || isSubmitting}
					variant={game.joined ? "danger" : "primary"}
					onPress={handleJoinLeaveGame}
				>
					{joinButtonText}
				</Button>
			</View>
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
	});
