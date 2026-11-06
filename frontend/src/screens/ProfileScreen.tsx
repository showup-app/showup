import { CommonActions, CustomTheme, useFocusEffect, useTheme } from "@react-navigation/native";
import { useUser } from "../context/UserContext";
import { TabScreenProps } from "../navigation/types";

import { SectionList, StyleSheet, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../components/ui/Button";
import { useCallback, useState } from "react";
import { Game, MyGames } from "../types/game";
import { api } from "../services/api";
import LoadingView from "../components/layout/LoadingView";
import ErrorView from "../components/layout/ErrorView";
import ProfileGameCard from "../components/game/ProfileGameCard";
import { getGlobalStyles } from "../theme/styles";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ProgressBar from "../components/ui/ProgressBar";

type ProfileState = { status: "loading" } | { status: "error"; error: string } | { status: "success"; data: MyGames };

type ProfileSection = {
	title: string;
	data: Game[];
	type: "played" | "hosted";
};

const ProfileScreen = ({ navigation }: TabScreenProps<"Profile">) => {
	const theme = useTheme();
	const styles = getStyles(theme);
	const globalStyles = getGlobalStyles(theme);

	const [profileState, setProfileState] = useState<ProfileState>({
		status: "loading",
	});

	const { user, token, logout } = useUser();

	const loadProfileData = useCallback(async () => {
		const res = await api.getMyGames(token!, true);
		if (res.ok) {
			setProfileState({
				status: "success",
				data: res.data,
			});
		} else {
			setProfileState({
				status: "error",
				error: res.error,
			});
		}
	}, [token]);

	useFocusEffect(
		useCallback(() => {
			loadProfileData();
		}, [loadProfileData]),
	);

	if (profileState.status === "loading") {
		return <LoadingView message="Loading your games…" />;
	}

	if (profileState.status === "error") {
		return <ErrorView errorMsg={profileState.error} onRetry={loadProfileData} />;
	}

	const handleLogout = () => {
		logout();
		navigation.dispatch(
			CommonActions.reset({
				index: 1,
				routes: [{ name: "Splash" }, { name: "Login" }],
			}),
		);
	};

	const filterPastGames = (games: Game[]): Game[] => games.filter((game) => new Date(game.starts_at) <= new Date());

	const filterShowUpStatus = (games: Game[], showedUp: boolean = true): Game[] => {
		return games.filter((game) => game.my_showed_up === showedUp);
	};

	const profileData: ProfileSection[] = [
		{
			title: "PLAYED GAMES",
			data: filterPastGames(profileState.data.joined),
			type: "played",
		},
		{
			title: "HOSTED GAMES",
			data: filterPastGames(profileState.data.hosting),
			type: "hosted",
		},
	];

	const getPlayersText = ({ data, type }: ProfileSection) => {
		if (type === "hosted") return `${data.length} hosted`;
		const showedUpCount = filterShowUpStatus(data).length;
		const noShowCount = filterShowUpStatus(data, false).length;

		const showedUpText = showedUpCount > 0 ? showedUpCount.toString() : "0";
		const noShowText = noShowCount > 0 ? noShowCount.toString() : "0";

		return `${showedUpText} played • ${noShowText} no-show`;
	};

	return (
		<SafeAreaView edges={["left", "right"]} style={styles.screen}>
			<View style={styles.playerInfo}>
				<MaterialCommunityIcons name="account-circle" size={46} color={theme.colors.textMuted} />
				<Text style={[styles.name]}>{user!.name}</Text>
			</View>
			<View style={[globalStyles.container, styles.reputationContainer]}>
				<Text style={styles.info}>REPUTATION</Text>
				<View style={styles.progressContainer}>
					<Text style={styles.reputation}>{user!.reputation} ★</Text>
					<ProgressBar value={user!.reputation} />
				</View>
			</View>
			<SectionList
				contentContainerStyle={styles.list}
				stickySectionHeadersEnabled={false}
				sections={profileData}
				keyExtractor={(game) => String(game.id)}
				renderItem={({ item }) => (
					<ProfileGameCard
						game={item}
						user={user!}
						onPress={() => navigation.navigate("GameDetails", { gameId: item.id })}
					/>
				)}
				renderSectionHeader={({ section }) => (
					<View style={styles.playersHeading}>
						<Text style={styles.playersText}>{section.title}</Text>
						<Text style={styles.playersText}>{getPlayersText(section)}</Text>
					</View>
				)}
				ItemSeparatorComponent={() => <View style={styles.separator} />}
				SectionSeparatorComponent={() => <View style={styles.separator} />}
			/>
			<Button onPress={() => handleLogout()} variant="primary">
				Logout
			</Button>
		</SafeAreaView>
	);
};

export default ProfileScreen;

const getStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		screen: {
			flex: 1,
			backgroundColor: theme.colors.background,
			padding: 20,
			gap: 20,
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
		separator: {
			height: 12,
		},
		list: {},
		reputation: {
			color: theme.colors.textSecondary,
			fontWeight: 600,
			fontSize: 26,
		},
		info: {
			color: theme.colors.textMuted,
		},
		reputationContainer: {
			padding: 10,
			gap: 10,
		},
		progressContainer: {
			gap: 5,
		},
		name: {
			fontSize: 26,
			color: theme.colors.text,
		},
		playerInfo: {
			flexDirection: "row",
			gap: 10,
			alignItems: "center",
		},
	});
