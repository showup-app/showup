import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CustomTheme, useFocusEffect, useTheme } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../components/ui/Button";
import FormErrorMessage from "../components/ui/FormErrorMessage";
import { useUser } from "../context/UserContext";
import { AppScreenProps } from "../navigation/types";
import { api } from "../services/api";
import { AttendanceMark, GameDetail } from "../types/game";
import { capitalize, formatShortDate } from "../utils/format";
import LoadingView from "../components/layout/LoadingView";
import ErrorView from "../components/layout/ErrorView";

/** Each player's mark */
type Marks = Record<number, boolean | undefined>;

const AttendanceScreen = ({ navigation, route }: AppScreenProps<"Attendance">) => {
	const theme = useTheme();
	const styles = getStyles(theme);
	const { gameId } = route.params;
	const { token } = useUser();

	const [game, setGame] = useState<GameDetail | null>(null);
	const [marks, setMarks] = useState<Marks>({});
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	const loadGame = useCallback(async () => {
		const res = await api.getGame(gameId);
		if (res.ok) {
			const loaded = res.data;
			setGame(loaded);
			// Start from any marks the host already saved
			const saved: Marks = {};
			for (const player of loaded.players) {
				saved[player.id] = player.showed_up ?? undefined;
			}
			setMarks(saved);
			setLoadError(null);
		} else {
			setLoadError(res.error);
		}
		setLoading(false);
	}, [gameId]);

	useFocusEffect(
		useCallback(() => {
			loadGame();
		}, [loadGame]),
	);

	const setMark = (playerId: number, showedUp: boolean) => {
		setMarks((current) => ({ ...current, [playerId]: showedUp }));
	};

	const markEveryoneShowedUp = () => {
		if (!game) return;
		const all: Marks = {};
		for (const player of game.players) {
			all[player.id] = true;
		}
		setMarks(all);
	};

	const markedCount = Object.values(marks).filter((mark) => mark !== undefined).length;

	const handleSave = async () => {
		if (!token) {
			setSaveError("Please log in again to save attendance");
			return;
		}
		const body: AttendanceMark[] = Object.entries(marks)
			.filter(([, showedUp]) => showedUp !== undefined)
			.map(([userId, showedUp]) => ({ user_id: Number(userId), showed_up: showedUp as boolean }));

		setIsSaving(true);
		setSaveError(null);
		const res = await api.markAttendance(gameId, body, token);
		setIsSaving(false);

		if (res.ok) {
			navigation.goBack();
		} else {
			setSaveError(res.error);
		}
	};

	if (loading) {
		return <LoadingView message="Loading players…" />;
	}

	if (loadError || !game) {
		return <ErrorView errorMsg={loadError ?? "Couldn't load this game"} onRetry={loadGame} />;
	}

	const allMarked = game.players.length > 0 && markedCount === game.players.length;

	return (
		<SafeAreaView style={styles.screen} edges={["left", "right", "bottom"]}>
			<FlatList
				data={game.players}
				keyExtractor={(player) => String(player.id)}
				contentContainerStyle={styles.list}
				ListHeaderComponent={
					<View style={styles.header}>
						<Text style={styles.title}>Your game just ended!</Text>
						<Text style={styles.subtitle}>Did they show up?</Text>
						<Text style={styles.gameInfo}>
							{capitalize(game.sport)} at {game.venue} · {formatShortDate(game.starts_at)}
						</Text>
					</View>
				}
				renderItem={({ item: player }) => {
					const mark = marks[player.id];
					return (
						<View style={styles.row}>
							<MaterialCommunityIcons name="account-circle" size={44} color={theme.colors.textMuted} />
							<View style={styles.playerInfo}>
								<Text style={styles.playerName}>{player.name}</Text>
								<Text style={styles.reputation}>
									{player.is_new ? "New" : `★ ${player.reputation}`}
								</Text>
							</View>
							<Pressable
								onPress={() => setMark(player.id, true)}
								hitSlop={8}
								accessibilityLabel={`${player.name} showed up`}
							>
								<MaterialCommunityIcons
									name={mark === true ? "thumb-up" : "thumb-up-outline"}
									size={30}
									color={mark === true ? theme.colors.textSecondary : theme.colors.textMuted}
								/>
							</Pressable>
							<Pressable
								onPress={() => setMark(player.id, false)}
								hitSlop={8}
								accessibilityLabel={`${player.name} didn't show up`}
							>
								<MaterialCommunityIcons
									name={mark === false ? "thumb-down" : "thumb-down-outline"}
									size={30}
									color={mark === false ? theme.colors.danger : theme.colors.textMuted}
								/>
							</Pressable>
						</View>
					);
				}}
				ItemSeparatorComponent={() => <View style={styles.divider} />}
				ListEmptyComponent={<Text style={styles.message}>No players joined this game.</Text>}
			/>

			{game.players.length > 0 && (
				<View style={styles.footer}>
					{saveError && <FormErrorMessage message={saveError} />}
					<View style={styles.footerRow}>
						<Text style={styles.message}>
							{markedCount} of {game.players.length} marked
						</Text>
						<Pressable onPress={markEveryoneShowedUp} hitSlop={8}>
							<Text style={styles.link}>Everyone showed up</Text>
						</Pressable>
					</View>
					<Button variant="primary" onPress={handleSave} disabled={!allMarked || isSaving}>
						{isSaving ? "Saving..." : "Save attendance"}
					</Button>
					{!allMarked && (
						<View style={styles.hintRow}>
							<MaterialCommunityIcons
								name="alert-circle-outline"
								size={16}
								color={theme.colors.warning}
							/>
							<Text style={styles.hint}>Mark every player to save</Text>
						</View>
					)}
				</View>
			)}
		</SafeAreaView>
	);
};

export default AttendanceScreen;

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
			paddingHorizontal: 20,
			paddingBottom: 20,
		},
		header: {
			alignItems: "center",
			gap: 8,
			paddingVertical: 20,
			borderBottomWidth: 1,
			borderBottomColor: theme.colors.border,
			marginBottom: 8,
		},
		title: {
			color: theme.colors.text,
			fontSize: 18,
			fontWeight: "600",
		},
		subtitle: {
			color: theme.colors.textMuted,
			fontSize: 14,
			fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
		},
		gameInfo: {
			color: theme.colors.textMuted,
			fontSize: 12,
		},
		row: {
			flexDirection: "row",
			alignItems: "center",
			gap: 14,
			paddingVertical: 14,
		},
		playerInfo: {
			flex: 1,
			gap: 2,
		},
		playerName: {
			color: theme.colors.text,
			fontSize: 15,
			fontWeight: "600",
		},
		reputation: {
			color: theme.colors.textSecondary,
			fontSize: 12,
		},
		divider: {
			height: 1,
			backgroundColor: theme.colors.border,
		},
		footer: {
			gap: 12,
			padding: 20,
			borderTopWidth: 1,
			borderTopColor: theme.colors.border,
		},
		footerRow: {
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "center",
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
		hintRow: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "center",
			gap: 6,
		},
		hint: {
			color: theme.colors.warning,
			fontSize: 13,
			fontWeight: "500",
		},
	});
