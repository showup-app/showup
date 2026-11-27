import { CustomTheme, useFocusEffect, useTheme } from "@react-navigation/native";
import { useAuthenticatedUser } from "../context/UserContext";
import { TabScreenProps } from "../navigation/types";

import { SectionList, StyleSheet, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../components/ui/Button";
import { useCallback } from "react";
import { Game } from "../types/game";
import { api } from "../services/api";
import LoadingView from "../components/layout/LoadingView";
import ErrorView from "../components/layout/ErrorView";
import ProfileGameCard from "../components/game/ProfileGameCard";
import { getGlobalStyles } from "../theme/styles";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ProgressBar from "../components/ui/ProgressBar";
import Toast from "react-native-toast-message";
import useAsync from "../hooks/useAsync";

type ProfileSection = {
	title: string;
	data: Game[];
	type: "played" | "hosted";
};

const ProfileScreen = ({ navigation }: TabScreenProps<"Profile">) => {
	const theme = useTheme();
	const styles = getStyles(theme);
	const globalStyles = getGlobalStyles(theme);

	const { user, token, logout } = useAuthenticatedUser();

	const fetchProfileData = useCallback(() => api.getMyGames(token, true), [token]);
	const { status, error, data: myGames, execute: loadProfileData } = useAsync(fetchProfileData);

	useFocusEffect(
		useCallback(() => {
			loadProfileData();
		}, [loadProfileData]),
	);

	if (status === "loading" || status === "idle") {
		return <LoadingView message="Loading your games…" />;
	}

	if (status === "error") {
		return <ErrorView errorMsg={error} onRetry={loadProfileData} />;
	}

	const filterPastGames = (games: Game[]): Game[] => games.filter((game) => new Date(game.starts_at) <= new Date());

	const filterShowUpStatus = (games: Game[], showedUp: boolean = true): Game[] => {
		return games.filter((game) => game.my_showed_up === showedUp);
	};

	const profileData: ProfileSection[] = [
		{
			title: "PLAYED GAMES",
			data: filterPastGames(myGames.joined),
			type: "played",
		},
		{
			title: "HOSTED GAMES",
			data: filterPastGames(myGames.hosting),
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

	const handleLogout = () => {
		logout();
		Toast.show({
			type: "success",
			text1: "Logout successful!",
			bottomOffset: 20,
		});
	};

	return (
		<SafeAreaView edges={["left", "right"]} style={[globalStyles.screen, styles.screen]}>
			<View style={styles.playerInfo}>
				<MaterialCommunityIcons name="account-circle" size={46} color={theme.colors.textMuted} />
				<Text style={styles.name}>{user.name}</Text>
				<Button
					onPress={handleLogout}
					variant="outline"
					buttonStyle={styles.logoutButton}
					textStyle={styles.logoutText}
				>
					<MaterialCommunityIcons name="logout" size={16} color={theme.colors.text} /> Log out
				</Button>
			</View>
			<View style={[globalStyles.card, styles.reputationContainer]}>
				<Text style={styles.info}>REPUTATION</Text>
				<View style={styles.progressContainer}>
					<Text style={styles.reputation}>{user.reputation} ★</Text>
					<ProgressBar value={user.reputation} />
				</View>
			</View>
			<SectionList
				stickySectionHeadersEnabled={false}
				sections={profileData}
				keyExtractor={(game) => String(game.id)}
				renderItem={({ item }) => (
					<ProfileGameCard
						game={item}
						user={user}
						onPress={() => navigation.navigate("GameDetails", { gameId: item.id })}
					/>
				)}
				renderSectionHeader={({ section }) => (
					<View style={globalStyles.sectionHeader}>
						<Text style={globalStyles.sectionTitle}>{section.title}</Text>
						<Text style={styles.sectionCount}>{getPlayersText(section)}</Text>
					</View>
				)}
				ItemSeparatorComponent={() => <View style={styles.separator} />}
				SectionSeparatorComponent={() => <View style={styles.separator} />}
			/>
		</SafeAreaView>
	);
};

export default ProfileScreen;

const getStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		screen: {
			padding: theme.spacing.xl,
			gap: theme.spacing.xl,
		},
		sectionCount: {
			fontFamily: theme.fontFamily.regular,
			fontSize: theme.fontSize.sm,
			color: theme.colors.textMuted,
		},
		separator: {
			height: theme.spacing.md,
		},
		reputation: {
			color: theme.colors.textSecondary,
			fontFamily: theme.fontFamily.medium,
			fontSize: theme.fontSize.xxl,
		},
		info: {
			fontFamily: theme.fontFamily.regular,
			color: theme.colors.textMuted,
		},
		reputationContainer: {
			padding: theme.spacing.md,
			gap: theme.spacing.md,
		},
		progressContainer: {
			gap: theme.spacing.xs,
		},
		name: {
			fontFamily: theme.fontFamily.regular,
			fontSize: theme.fontSize.xxl,
			color: theme.colors.text,
			flex: 1,
		},
		playerInfo: {
			flexDirection: "row",
			gap: theme.spacing.md,
			alignItems: "center",
		},
		logoutButton: {
			paddingVertical: theme.spacing.sm,
			paddingHorizontal: theme.spacing.md,
			minHeight: 40,
		},
		logoutText: {
			fontFamily: theme.fontFamily.regular,
			fontSize: theme.fontSize.sm,
		},
	});
