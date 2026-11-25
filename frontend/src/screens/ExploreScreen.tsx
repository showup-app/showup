import { CustomTheme, useTheme } from "@react-navigation/native";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Animated, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import GameCard from "../components/game/GameCard";
import { TabScreenProps } from "../navigation/types";
import { api } from "../services/api";
import { Game } from "../types/game";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthenticatedUser } from "../context/UserContext";
import LoadingView from "../components/layout/LoadingView";
import ErrorView from "../components/layout/ErrorView";
import Chip from "../components/form/Chip";
import { SPORTS, sportIcon } from "../utils/sports";
import { capitalize } from "../utils/format";
import Toast from "react-native-toast-message";
import useAsync from "../hooks/useAsync";
import { getGlobalStyles } from "../theme/styles";

const MIN_SEARCH_LENGTH = 2;
const SEARCH_DELAY_MS = 400;

export function ExploreScreen({ navigation }: TabScreenProps<"Explore">) {
	const theme = useTheme();
	const styles = getStyles(theme);
	const globalStyles = getGlobalStyles(theme);
	const { token } = useAuthenticatedUser();

	const [search, setSearch] = useState("");
	const [sport, setSport] = useState<string | undefined>(undefined);
	const [refreshing, setRefreshing] = useState(false);

	const location = search.trim().length >= MIN_SEARCH_LENGTH ? search.trim() : undefined;

	const getGamesCallback = useCallback(
		(location?: string, sport?: string) => api.getGames({ location, sport }, token),
		[token],
	);
	const { data: games, error, status, execute: loadGames, setData: setGames } = useAsync(getGamesCallback);

	const joinGameCallback = useCallback((id: number) => api.joinGame(id, token), [token]);
	const { execute: joinGame } = useAsync(joinGameCallback);

	// Hide-on-scroll header logic written with AI assistance (Claude)
	const [scrollY] = useState(() => new Animated.Value(0));
	const [headerHeight, setHeaderHeight] = useState(0);

	const headerTranslateY = useMemo(() => {
		const scrollDown = scrollY.interpolate({
			inputRange: [0, 1],
			outputRange: [0, 1],
			extrapolateLeft: "clamp",
		});
		const clamped = Animated.diffClamp(scrollDown, 0, Math.max(headerHeight, 1));
		return Animated.multiply(clamped, -1);
	}, [scrollY, headerHeight]);

	const onScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
		useNativeDriver: true,
	});

	useEffect(() => {
		let cancelled = false;
		const timer = setTimeout(async () => {
			if (!cancelled) {
				loadGames(location, sport);
			}
		}, SEARCH_DELAY_MS);

		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [location, sport, loadGames]);

	const onRefresh = async () => {
		setRefreshing(true);
		await loadGames(location, sport);
		setRefreshing(false);
	};

	const handleJoinGame = async (gameId: Game["id"]) => {
		const res = await joinGame(gameId);
		if (!res.ok) {
			Toast.show({
				type: "error",
				text1: "Failed to join the game",
				text2: res.error,
				bottomOffset: 90,
			});
			return;
		}
		// Set current game status to joined
		setGames((prevGames) => prevGames.map((game) => (game.id === gameId ? { ...game, joined: true } : game)));
		Toast.show({
			type: "success",
			text1: "Successfully joined the game!",
			bottomOffset: 90,
		});
	};

	return (
		<SafeAreaView style={globalStyles.screen} edges={["left", "right"]}>
			{status === "idle" || (status === "loading" && !refreshing) ? (
				<View style={{ flex: 1, paddingTop: headerHeight }}>
					<LoadingView message="Finding games…" screen={false} />
				</View>
			) : status === "error" ? (
				<View style={{ flex: 1, paddingTop: headerHeight }}>
					<ErrorView errorMsg={error} onRetry={onRefresh} screen={false} />
				</View>
			) : (
				<Animated.FlatList
					data={games ?? []}
					keyExtractor={(game) => String(game.id)}
					onScroll={onScroll}
					scrollEventThrottle={16}
					contentContainerStyle={[styles.list, { paddingTop: headerHeight }]}
					renderItem={({ item }) => (
						<GameCard
							game={item}
							onSeePlayers={() => navigation.navigate("GameDetails", { gameId: item.id })}
							onJoin={() => handleJoinGame(item.id)}
						/>
					)}
					keyboardShouldPersistTaps="handled"
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={onRefresh}
							tintColor={theme.colors.textSecondary}
							progressViewOffset={headerHeight}
						/>
					}
					ListEmptyComponent={<Text style={styles.message}>{emptyMessage(sport, location)}</Text>}
				/>
			)}

			<Animated.View
				style={[styles.header, { transform: [{ translateY: headerTranslateY }] }]}
				onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
			>
				<View style={styles.searchSection}>
					<Text style={styles.label}>Search by location</Text>
					<TextInput
						style={globalStyles.input}
						value={search}
						onChangeText={setSearch}
						placeholder="e.g. Burnaby"
						placeholderTextColor={theme.colors.textMuted}
						autoCorrect={false}
						returnKeyType="search"
						clearButtonMode="while-editing"
					/>
				</View>

				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.sportChips}
					style={styles.sportChipsRow}
				>
					<Chip label="All" selected={sport === undefined} onPress={() => setSport(undefined)} />
					{SPORTS.map((name) => (
						<Chip
							key={name}
							label={capitalize(name)}
							icon={sportIcon(name)}
							selected={sport === name}
							onPress={() => setSport(name)}
						/>
					))}
				</ScrollView>
			</Animated.View>
		</SafeAreaView>
	);
}

function emptyMessage(sport?: string, location?: string): string {
	const what = sport ? `${sport} games` : "games";
	return location ? `No upcoming ${what} near "${location}"` : `No upcoming ${what} yet`;
}

const getStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		searchSection: {
			paddingHorizontal: theme.spacing.xl,
			paddingTop: theme.spacing.xl,
			paddingBottom: theme.spacing.xxl,
			gap: theme.spacing.sm,
		},
		label: {
			color: theme.colors.textMuted,
			fontSize: theme.fontSize.sm,
			fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
		},
		list: {
			paddingHorizontal: theme.spacing.xl,
			paddingBottom: theme.spacing.xl,
			gap: theme.spacing.xxl,
		},
		message: {
			color: theme.colors.textMuted,
			fontSize: theme.fontSize.md,
			textAlign: "center",
		},
		sportChipsRow: {
			flexGrow: 0,
			flexShrink: 0,
			marginBottom: theme.spacing.xl,
		},
		sportChips: {
			paddingHorizontal: theme.spacing.xl,
			gap: theme.spacing.sm,
			alignItems: "center",
		},
		header: {
			position: "absolute",
			top: 0,
			left: 0,
			right: 0,
			zIndex: 1,
			backgroundColor: theme.colors.background,
		},
	});
