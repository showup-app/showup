import { CustomTheme, useTheme } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { FlatList, Platform, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import GameCard from "../components/game/GameCard";
import { TabScreenProps } from "../navigation/types";
import { api } from "../services/api";
import { Game } from "../types/game";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "../context/UserContext";
import LoadingView from "../components/layout/LoadingView";
import ErrorView from "../components/layout/ErrorView";

const MIN_SEARCH_LENGTH = 2;
const SEARCH_DELAY_MS = 400;

export function ExploreScreen({ navigation }: TabScreenProps<"Explore">) {
	const theme = useTheme();
	const styles = getStyles(theme);
	const { token } = useUser();

	const [search, setSearch] = useState("");
	const [games, setGames] = useState<Game[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const location = search.trim().length >= MIN_SEARCH_LENGTH ? search.trim() : undefined;

	const loadGames = async () => {
		setError(null);
		const res = await api.getGames({ location }, token!);
		if (res.ok) {
			setGames(res.data);
		} else {
			setError(res.error);
		}
	};

	useEffect(() => {
		let cancelled = false;
		const timer = setTimeout(async () => {
			setLoading(true);
			setError(null);
			if (!cancelled) {
				const result = await api.getGames({ location }, token!);
				if (result.ok) {
					setGames(result.data);
				} else {
					setError(result.error);
				}
				setLoading(false);
			}
		}, SEARCH_DELAY_MS);

		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [location, token]);

	const onRefresh = async () => {
		setRefreshing(true);
		await loadGames();
		setRefreshing(false);
	};

	return (
		<SafeAreaView style={styles.screen} edges={["left", "right"]}>
			<View style={styles.searchSection}>
				<Text style={styles.label}>Search by location</Text>
				<TextInput
					style={styles.input}
					value={search}
					onChangeText={setSearch}
					placeholder="e.g. Burnaby"
					placeholderTextColor={theme.colors.textMuted}
					autoCorrect={false}
					returnKeyType="search"
					clearButtonMode="while-editing"
				/>
			</View>

			{loading && !refreshing ? (
				<LoadingView message="Finding games…" screen={false} />
			) : error ? (
				<ErrorView errorMsg={error} onRetry={onRefresh} screen={false} />
			) : (
				<FlatList
					data={games}
					keyExtractor={(game) => String(game.id)}
					renderItem={({ item }) => (
						<GameCard
							game={item}
							onSeePlayers={() => navigation.navigate("GameDetails", { gameId: item.id })}
							onJoin={async () => {
								const res = await api.joinGame(item.id, token!);
								if (!res.ok) {
									// TODO: Unify error message display across the entire app (i.e.: modal popup? toast message?)
									console.log(res.error, res.status);
									return;
								}
								// Set current game status to joined
								setGames((prevGames) =>
									prevGames.map((game) => (game.id === item.id ? { ...item, joined: true } : game)),
								);
							}}
						/>
					)}
					contentContainerStyle={styles.list}
					keyboardShouldPersistTaps="handled"
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={onRefresh}
							tintColor={theme.colors.textSecondary}
						/>
					}
					ListEmptyComponent={
						<Text style={styles.message}>
							{location ? `No upcoming games near "${location}"` : "No upcoming games yet"}
						</Text>
					}
				/>
			)}
		</SafeAreaView>
	);
}

const getStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		screen: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		searchSection: {
			paddingHorizontal: 20,
			paddingTop: 20,
			paddingBottom: 24,
			gap: 6,
		},
		label: {
			color: theme.colors.textMuted,
			fontSize: 13,
			fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
		},
		input: {
			backgroundColor: theme.colors.surface,
			borderColor: theme.colors.border,
			borderWidth: 1,
			borderRadius: 6,
			color: theme.colors.text,
			fontSize: 16,
			paddingHorizontal: 12,
			paddingVertical: 12,
		},
		list: {
			paddingHorizontal: 20,
			paddingBottom: 20,
			gap: 28,
		},
		message: {
			color: theme.colors.textMuted,
			fontSize: 14,
			textAlign: "center",
		},
	});
