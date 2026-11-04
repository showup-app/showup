import { CommonActions, CustomTheme, useFocusEffect, useTheme } from "@react-navigation/native";
import { useUser } from "../context/UserContext";
import { TabScreenProps } from "../navigation/types";

import { SectionList, StyleSheet, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../components/ui/Button";
import { useCallback, useState } from "react";
import { MyGames } from "../types/game";
import { api } from "../services/api";
import LoadingView from "../components/layout/LoadingView";
import ErrorView from "../components/layout/ErrorView";
import ProfileGameCard from "../components/game/ProfileGameCard";
import { getGlobalStyles } from "../theme/styles";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const ProfileScreen = ({ navigation }: TabScreenProps<"Profile">) => {
	const theme = useTheme();
	const styles = getStyles(theme);
	const globalStyles = getGlobalStyles(theme);

	const [myGames, setMyGames] = useState<MyGames | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const { user, token, logout } = useUser();

	const loadProfileData = useCallback(async () => {
		setError(null);
		const res = await api.getMyGames(token!, true);
		if (res.ok) {
			setMyGames(res.data);
		} else {
			setError(res.error);
		}
		setLoading(false);
	}, []);

	useFocusEffect(
		useCallback(() => {
			loadProfileData();
		}, [loadProfileData]),
	);

	if (loading) {
		return <LoadingView message="Loading your games…" />;
	}

	if (error || !myGames) {
		return <ErrorView errorMsg={error || "An error occured"} onRetry={loadProfileData} />;
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

	// .filter((game) => new Date(game.starts_at) <= new Date())
	const profileData = [
		{
			title: "Played Games",
			data: myGames.joined,
		},
		{
			title: "Hosted Games",
			data: myGames.hosting,
		},
	];

	return (
		<SafeAreaView edges={["left", "right", "bottom"]} style={styles.screen}>
			<View style={styles.playerInfo}>
				<View>
					<MaterialCommunityIcons name="account-circle" size={46} color={theme.colors.textMuted} />
				</View>
				<View>
					<Text style={[styles.name]}>{user!.name}</Text>
					<Text style={[styles.info]}>{user!.email}</Text>
				</View>
			</View>
			<View style={[globalStyles.container, styles.reputationContainer]}>
				<Text style={styles.info}>REPUTATION</Text>
				<View>
					<Text style={styles.reputation}>{user!.reputation} ★</Text>
					
				</View>
			</View>
			<SectionList
				contentContainerStyle={styles.list}
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
						<Text style={styles.playersText}>Total: {section.data.length}</Text>
					</View>
				)}
				ItemSeparatorComponent={() => <View style={styles.separator} />}
				SectionSeparatorComponent={() => <View style={styles.sectionGap} />}
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
			gap: 15,
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
			height: 28,
		},
		sectionGap: {
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
		},
		name: {
			fontSize: 26,
			color: theme.colors.text,
		},
		playerInfo: {
			flexDirection: "row",
			gap: 10,
			alignItems: "center",
		}
	});
