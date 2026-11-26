import { CustomTheme, useFocusEffect, useTheme } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { RefreshControl, SectionList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import GameCard from "../components/game/GameCard";
import { useAuthenticatedUser } from "../context/UserContext";
import { TabScreenProps } from "../navigation/types";
import { api } from "../services/api";
import { Game, GameStatus } from "../types/game";
import LoadingView from "../components/layout/LoadingView";
import ErrorView from "../components/layout/ErrorView";
import useAsync from "../hooks/useAsync";
import { getGlobalStyles } from "../theme/styles";

// Hosts can mark attendance for this many days after kickoff
const MARK_WINDOW_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

type Section = {
	title: string;
	data: Game[];
	emptyText?: string;
	emptyAction?: string;
	onEmptyAction?: () => void;
	linkLabel: string;
	onOpen: (game: Game) => void;
	urgent?: boolean;
};

const hasStarted = (game: Game, now: number) => new Date(game.starts_at).getTime() <= now;

const needsAttendance = (game: Game, now: number) =>
	hasStarted(game, now) &&
	game.status !== GameStatus.Cancelled &&
	game.status !== GameStatus.Played &&
	now - new Date(game.starts_at).getTime() <= MARK_WINDOW_DAYS * DAY_MS;

export function HomeScreen({ navigation }: TabScreenProps<"Home">) {
	const theme = useTheme();
	const styles = getStyles(theme);
	const globalStyles = getGlobalStyles(theme);
	const { token } = useAuthenticatedUser();

	const [refreshing, setRefreshing] = useState(false);
	const [loadedAt, setLoadedAt] = useState(0);

	const fetchMyGames = useCallback(() => api.getMyGames(token, true), [token]);
	const { status, error, data: myGames, execute: loadGames } = useAsync(fetchMyGames);

	const fetchGames = useCallback(async () => {
		const res = await loadGames();
		if (res.ok) setLoadedAt(Date.now());
	}, [loadGames]);

	// Reloads list every time you come back to Home
	useFocusEffect(
		useCallback(() => {
			fetchGames();
		}, [fetchGames]),
	);

	const onRefresh = async () => {
		setRefreshing(true);
		await fetchGames();
		setRefreshing(false);
	};

	const openGame = (game: Game) => navigation.navigate("GameDetails", { gameId: game.id });
	const openAttendance = (game: Game) => navigation.navigate("Attendance", { gameId: game.id });

	// The API returns past games too (include_past), so split them here
	const now = loadedAt;
	const hosting = myGames?.hosting ?? [];
	const toMark = hosting.filter((game) => needsAttendance(game, now));
	const upcomingHosting = hosting.filter((game) => !hasStarted(game, now));
	const upcomingJoined = (myGames?.joined ?? []).filter((game) => !hasStarted(game, now));

	useEffect(() => {
		navigation.setOptions({
			tabBarBadge: toMark.length > 0 ? toMark.length : undefined,
			tabBarBadgeStyle: { backgroundColor: theme.colors.danger },
		});
	}, [navigation, toMark.length, theme.colors.danger]);

	const sections: Section[] = [
		// Only shown when there is something to mark
		...(toMark.length > 0
			? [
					{
						title: "Needs attendance",
						data: toMark,
						linkLabel: "Mark attendance",
						onOpen: openAttendance,
						urgent: true,
					},
				]
			: []),
		{
			title: "Hosting",
			data: upcomingHosting,
			linkLabel: "See players",
			onOpen: openGame,
			emptyText: "You're not hosting any upcoming games.",
			emptyAction: "Post a game",
			onEmptyAction: () => navigation.navigate("CreatePost"),
		},
		{
			title: "Joined",
			data: upcomingJoined,
			linkLabel: "See players",
			onOpen: openGame,
			emptyText: "You haven't joined any upcoming games.",
			emptyAction: "Find a game",
			onEmptyAction: () => navigation.navigate("Explore"),
		},
	];

	if (status === "idle" || (status === "loading" && !refreshing)) {
		return <LoadingView message="Loading your games…" />;
	}

	if (status === "error") {
		return <ErrorView errorMsg={error} onRetry={onRefresh} />;
	}

	return (
		<SafeAreaView style={globalStyles.screen} edges={["left", "right"]}>
			<SectionList
				sections={sections}
				keyExtractor={(game) => String(game.id)}
				renderItem={({ item, section }) => (
					<GameCard
						game={item}
						linkLabel={section.linkLabel}
						onSeePlayers={() => section.onOpen(item)}
						highlighted={section.urgent}
					/>
				)}
				renderSectionHeader={({ section }) => (
					<View style={styles.sectionHeader}>
						{section.urgent && <View style={styles.dot} />}
						<Text style={globalStyles.sectionTitle}>{section.title}</Text>
						{section.urgent && (
							<View style={styles.countBadge}>
								<Text style={styles.countText}>{section.data.length}</Text>
							</View>
						)}
					</View>
				)}
				stickySectionHeadersEnabled={false}
				contentContainerStyle={styles.list}
				ItemSeparatorComponent={() => <View style={styles.separator} />}
				SectionSeparatorComponent={() => <View style={styles.sectionGap} />}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						tintColor={theme.colors.textSecondary}
					/>
				}
			/>
		</SafeAreaView>
	);
}

const getStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		list: {
			padding: theme.spacing.xl,
		},
		separator: {
			height: 28,
		},
		sectionGap: {
			height: theme.spacing.md,
		},
		sectionHeader: {
			flexDirection: "row",
			alignItems: "center",
			gap: theme.spacing.sm,
		},
		dot: {
			width: 8,
			height: 8,
			borderRadius: 4,
			backgroundColor: theme.colors.danger,
		},
		countBadge: {
			backgroundColor: theme.colors.danger,
			borderRadius: 9,
			paddingHorizontal: theme.spacing.sm,
			paddingVertical: 1,
		},
		countText: {
			color: theme.colors.textOnDanger,
			fontSize: theme.fontSize.xs,
			fontFamily: theme.fontFamily.medium,
		},
	});
