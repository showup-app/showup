import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CustomTheme, useFocusEffect, useTheme } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../components/ui/Button";
import FormErrorMessage from "../components/ui/FormErrorMessage";
import { useAuthenticatedUser } from "../context/UserContext";
import { AppScreenProps } from "../navigation/types";
import { api } from "../services/api";
import { AttendanceMark } from "../types/game";
import { capitalize, formatShortDate } from "../utils/format";
import LoadingView from "../components/layout/LoadingView";
import ErrorView from "../components/layout/ErrorView";
import Toast from "react-native-toast-message";
import useAsync from "../hooks/useAsync";

/** Each player's mark */
type Marks = Record<number, boolean | undefined>;

const AttendanceScreen = ({ navigation, route }: AppScreenProps<"Attendance">) => {
	const theme = useTheme();
	const styles = getStyles(theme);
	const { gameId } = route.params;
	const { token } = useAuthenticatedUser();

	const [marks, setMarks] = useState<Marks>({});

	const fetchGame = useCallback(() => api.getGame(gameId), [gameId]);
	const { data: game, error: gameError, status: gameStatus, execute: loadGame } = useAsync(fetchGame);

	const markAttendance = useCallback(() => {
		const body: AttendanceMark[] = Object.entries(marks)
			.filter(([, showedUp]) => showedUp !== undefined)
			.map(([userId, showedUp]) => ({ user_id: Number(userId), showed_up: showedUp as boolean }));

		return api.markAttendance(gameId, body, token);
	}, [gameId, marks, token]);
	const { status: saveStatus, error: saveError, execute: saveAttendance } = useAsync(markAttendance);

	useFocusEffect(
		useCallback(() => {
			const loadSavedMarks = async () => {
				const { data, ok } = await loadGame();
				if (!ok) return;

				const saved: Marks = {};
				for (const player of data.players) {
					saved[player.id] = player.showed_up ?? undefined;
				}
				setMarks(saved);
			};

			loadSavedMarks();
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
		const res = await saveAttendance();

		if (res.ok) {
			Toast.show({
				type: "success",
				text1: "Attendance successfully saved!",
				bottomOffset: 90,
			});
			navigation.goBack();
		}
	};

	if (gameStatus === "loading" || gameStatus === "idle") {
		return <LoadingView message="Loading players…" />;
	}

	if (gameStatus === "error" || !game) {
		return <ErrorView errorMsg={gameError ?? "Couldn't load this game"} onRetry={loadGame} />;
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
									color={mark === true ? theme.colors.success : theme.colors.textMuted}
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
					<Button variant="primary" onPress={handleSave} disabled={!allMarked || saveStatus === "loading"}>
						{saveStatus === "loading" ? "Saving..." : "Save attendance"}
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
			gap: theme.spacing.md,
			padding: theme.spacing.xl,
		},
		list: {
			paddingHorizontal: theme.spacing.xl,
			paddingBottom: theme.spacing.xl,
		},
		header: {
			alignItems: "center",
			gap: theme.spacing.sm,
			paddingVertical: theme.spacing.xl,
			borderBottomWidth: 1,
			borderBottomColor: theme.colors.border,
			marginBottom: theme.spacing.sm,
		},
		title: {
			color: theme.colors.text,
			fontSize: theme.fontSize.xl,
			fontWeight: "600",
		},
		subtitle: {
			color: theme.colors.textMuted,
			fontSize: theme.fontSize.md,
			fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
		},
		gameInfo: {
			color: theme.colors.textMuted,
			fontSize: theme.fontSize.xs,
		},
		row: {
			flexDirection: "row",
			alignItems: "center",
			gap: theme.spacing.lg,
			paddingVertical: theme.spacing.lg,
		},
		playerInfo: {
			flex: 1,
			gap: theme.spacing.xxs,
		},
		playerName: {
			color: theme.colors.text,
			fontSize: theme.fontSize.lg,
			fontWeight: "600",
		},
		reputation: {
			color: theme.colors.textSecondary,
			fontSize: theme.fontSize.xs,
		},
		divider: {
			height: 1,
			backgroundColor: theme.colors.border,
		},
		footer: {
			gap: theme.spacing.md,
			padding: theme.spacing.xl,
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
			fontSize: theme.fontSize.md,
		},
		link: {
			color: theme.colors.textSecondary,
			fontSize: theme.fontSize.md,
			fontWeight: "600",
		},
		hintRow: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "center",
			gap: theme.spacing.sm,
		},
		hint: {
			color: theme.colors.warning,
			fontSize: theme.fontSize.sm,
			fontWeight: "500",
		},
	});
