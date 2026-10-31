import { StyleSheet, Text, View } from "react-native";
import { Player } from "../../types/game";
import { CustomTheme, useTheme } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const PlayerCard = ({ player }: { player: Player }) => {
	const theme = useTheme();
	const styles = getStyles(theme);

	return (
		<View style={styles.container}>
			<View style={styles.userProfile}>
				<MaterialCommunityIcons name="account-circle" size={36} color={theme.colors.textMuted} />
				<Text style={styles.playerName}>{player.name}</Text>
			</View>
			<Text style={styles.reputation}>★ {player.reputation}</Text>
		</View>
	);
};

export default PlayerCard;

const getStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		container: {
			display: "flex",
			flexDirection: "row",
			borderColor: "#3C3C3C",
			borderWidth: 1,
			borderRadius: 5,
			justifyContent: "space-between",
			width: "100%",
			alignItems: "center",
			backgroundColor: "#2B2B2B",
			padding: 7,
		},
		reputation: {
			color: theme.colors.textSecondary,
			fontSize: 12,
			fontWeight: 600,
		},
		userProfile: {
			display: "flex",
			flexDirection: "row",
			gap: 5,
			alignItems: "center",
		},
		playerName: {
			color: theme.colors.text,
			fontWeight: 400,
		},
	});
