import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppScreenProps } from "../navigation/types";
import { CustomTheme, useTheme } from "@react-navigation/native";
import { GameDetail } from "../types/game";
import { api } from "../services/api";
import { useEffect, useState } from "react";
import PlayerCard from "../components/game/PlayerCard";
import GameCardDetailed from "../components/game/GameCardDetailed";
import GameCard from "../components/game/GameCard";
import Button from "../components/ui/Button";

const GameDetailsScreen = ({ route }: AppScreenProps<"GameDetails">) => {
	const theme = useTheme();
	const styles = getStyles(theme);
	const { gameId } = route.params;
	const [game, setGame] = useState<GameDetail | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState<boolean>(true);

	const fetchGame = async () => {
		setLoading(true);
		setError(null);

		const res = await api.getGame(gameId);
		if (res.ok) {
			setGame(res.data);
		} else {
			setError(res.error);
		}
		setLoading(false);
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

	if (error) {
		return (
			<SafeAreaView style={[styles.screen, styles.centered]} edges={["left", "right"]}>
				<Text style={styles.message}>{error}</Text>
				<View>
					<Text style={styles.link}>Try again</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.screen} edges={["left", "right", "bottom"]}>
			<GameCardDetailed game={game!} />
			<View style={styles.playersContainer}>
				<View style={styles.playersHeading}>
					<Text style={styles.playersText}>PLAYERS</Text>
					<Text style={styles.playersText}>
						{game!.players.length}/{game!.spots} joined
					</Text>
				</View>
				<ScrollView contentContainerStyle={styles.playerCards}>
					{game!.players.map((player) => (
						<PlayerCard key={player.id} player={player} />
					))}
				</ScrollView>
			</View>
			<View style={styles.joinButton}>
				<Button variant="primary">Join</Button>
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
