import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppScreenProps } from "../navigation/types";
import { CustomTheme, useTheme } from "@react-navigation/native";
import { GameDetail } from "../types/game";
import { api } from "../services/api";
import { useEffect, useState } from "react";
import PlayerCard from "../components/game/PlayerCard";
import GameCard from "../components/game/GameCard";
import Button from "../components/ui/Button";
import { getJoinButtonText } from "../utils/format";
import { useUser } from "../context/UserContext";

const GameDetailsScreen = ({ route }: AppScreenProps<"GameDetails">) => {
	const theme = useTheme();
	const { user, token } = useUser();
	const styles = getStyles(theme);
	const { gameId } = route.params;
	const [game, setGame] = useState<GameDetail | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const fetchGame = async () => {
		setLoading(true);
		setError(null);

		const res = await api.getGame(gameId, token!);
		if (res.ok) {
			setGame(res.data);
		} else {
			setError(res.error);
		}
		setLoading(false);
	};

	const joinGame = async () => {
		setIsSubmitting(true);
		const res = await api.joinGame(game!.id, token!);
		if (!res.ok) {
			// TODO: Unify error message display across the entire app (i.e.: modal popup? toast message?)
			console.log(res.error, res.status);
		} else {
			setGame(res.data);
		}
		setIsSubmitting(false);
	};

	const leaveGame = async () => {
		setIsSubmitting(true);
		const res = await api.leaveGame(game!.id, token!);
		if (!res.ok) {
			// TODO: Unify error message display across the entire app (i.e.: modal popup? toast message?)
			console.log(res.error, res.status);
		} else {
			setGame(res.data);
		}
		setIsSubmitting(false);
	};

	useEffect(() => {
		fetchGame();
	}, []);

	if (loading) {
		return (
			<SafeAreaView style={[styles.screen, styles.centered]} edges={["left", "right"]}>
				<ActivityIndicator color={theme.colors.textSecondary} />
				<Text style={styles.message}>Loading game…</Text>
			</SafeAreaView>
		);
	}

	if (error || !game) {
		return (
			<SafeAreaView style={[styles.screen, styles.centered]} edges={["left", "right"]}>
				<Text style={styles.message}>{error}</Text>
				<Pressable onPress={fetchGame} hitSlop={8}>
					<Text style={styles.link}>Try again</Text>
				</Pressable>
			</SafeAreaView>
		);
	}

	const isFull = game.spots_left <= 0;
	const userJoinedGame = game.joined;
	const userHostingGame = user!.id === game.host_id;
	const joinButtonDisabled = isFull || userHostingGame;

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
					onPress={game.joined ? leaveGame : joinGame}
				>
					{isSubmitting && !game.joined
						? "Joining..."
						: isSubmitting && game.joined
							? "Leaving..."
							: game.joined
								? "Leave"
								: getJoinButtonText(userJoinedGame, isFull, userHostingGame)}
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
		centered: {
			alignItems: "center",
			justifyContent: "center",
			gap: 12,
			padding: 20,
		},
		message: {
			color: theme.colors.textMuted,
			fontSize: 14,
		},
		link: {
			color: theme.colors.textSecondary,
			fontSize: 14,
			fontWeight: "600",
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
