import { CustomTheme, useFocusEffect, useTheme } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import GameCard from "../components/game/GameCard";
import { useUser } from "../context/UserContext";
import { TabScreenProps } from "../navigation/types";
import { api } from "../services/api";
import { Game, MyGames } from "../types/game";

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
};

const hasStarted = (game: Game, now: number) => new Date(game.starts_at).getTime() <= now;

const needsAttendance = (game: Game, now: number) =>
	hasStarted(game, now) &&
	game.status !== "cancelled" &&
	game.status !== "played" &&
	now - new Date(game.starts_at).getTime() <= MARK_WINDOW_DAYS * DAY_MS;

export function HomeScreen({ navigation }: TabScreenProps<"Home">) {
	const theme = useTheme();
	const styles = getStyles(theme);
	const { token } = useUser();

	const [myGames, setMyGames] = useState<MyGames | null>(null);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [loadedAt, setLoadedAt] = useState(0);

	const loadGames = useCallback(async () => {
		if (!token) {
			setError("Please log in again to see your games");
			setLoading(false);
			return;
		}
		setError(null);
		const res = await api.getMyGames(token, true);
		if (res.ok) {
			setMyGames(res.data);
			setLoadedAt(Date.now());
		} else {
			setError(res.error);
		}
		setLoading(false);
	}, [token]);

	// Reloads list every time you come back to Home
	useFocusEffect(
		useCallback(() => {
			loadGames();
		}, [loadGames]),
	);

	const onRefresh = async () => {
		setRefreshing(true);
		await loadGames();
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

	const sections: Section[] = [
		// Only shown when there is something to mark
		...(toMark.length > 0
			? [
					{
						title: "Needs attendance",
						data: toMark,
						linkLabel: "Mark attendance",
						onOpen: openAttendance,
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

	if (loading && !refreshing) {
		return (
			<SafeAreaView style={[styles.screen, styles.centered]} edges={["left", "right"]}>
				<ActivityIndicator color={theme.colors.textSecondary} />
				<Text style={styles.message}>Loading your games…</Text>
			</SafeAreaView>
		);
	}

	if (error) {
		return (
			<SafeAreaView style={[styles.screen, styles.centered]} edges={["left", "right"]}>
				<Text style={styles.message}>{error}</Text>
				<Pressable onPress={onRefresh} hitSlop={8}>
					<Text style={styles.link}>Try again</Text>
				</Pressable>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.screen} edges={["left", "right"]}>
			<SectionList
				sections={sections}
				keyExtractor={(game) => String(game.id)}
				renderItem={({ item, section }) => (
					<GameCard game={item} linkLabel={section.linkLabel} onSeePlayers={() => section.onOpen(item)} />
				)}
				renderSectionHeader={({ section }) => <Text style={styles.sectionTitle}>{section.title}</Text>}
				renderSectionFooter={({ section }) =>
					section.data.length === 0 && section.emptyText ? (
						<View style={styles.empty}>
							<Text style={styles.message}>{section.emptyText}</Text>
							<Pressable onPress={section.onEmptyAction} hitSlop={8}>
								<Text style={styles.link}>{section.emptyAction}</Text>
							</Pressable>
						</View>
					) : null
				}
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
		screen: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		centered: {
			alignItems: "center",
			justifyContent: "center",
			gap: 12,
			padding: 20,
		},
		list: {
			padding: 20,
		},
		greeting: {
			color: theme.colors.text,
			fontSize: theme.typography.title.fontSize,
			fontWeight: theme.typography.title.fontWeight,
			marginBottom: 16,
		},
		sectionTitle: {
			color: theme.colors.textMuted,
			fontSize: 13,
			fontWeight: "600",
			letterSpacing: 1,
			textTransform: "uppercase",
		},
		separator: {
			height: 28,
		},
		sectionGap: {
			height: 12,
		},
		empty: {
			alignItems: "flex-start",
			gap: 8,
			paddingVertical: 8,
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
	});
