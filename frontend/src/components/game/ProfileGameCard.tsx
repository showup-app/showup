import { Pressable, StyleSheet, Text, View } from "react-native";
import { CustomTheme, useTheme } from "@react-navigation/native";
import { Game } from "../../types/game";
import { User } from "../../types/auth";
import { capitalize, cityFromAddress, formatShortDate } from "../../utils/format";
import { getGlobalStyles } from "../../theme/styles";

const ProfileGameCard = ({ game, user, onPress }: { game: Game; user: User; onPress: () => void }) => {
	const theme = useTheme();
	const styles = getStyles(theme);
	const globalStyles = getGlobalStyles(theme);
	const isHost = game.host_id === user.id;

	return (
		<Pressable style={[globalStyles.container, styles.card]} onPress={onPress}>
			<View style={styles.left}>
				<Text style={styles.game}>{capitalize(game.sport)} game</Text>
				<Text style={styles.info}>
					{formatShortDate(game.starts_at)} - {cityFromAddress(game.address)}
				</Text>
			</View>
			<View style={styles.right}>
				<Text style={[styles.info, styles.rightText]}>{isHost ? capitalize(game.status) : "Showed Up"}</Text>
				<Text style={[styles.rightText, styles.bold]}>{isHost ? `${game.spots} spots` : "+5"}</Text>
			</View>
		</Pressable>
	);
};

export default ProfileGameCard;

const getStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		card: {
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "center",
			padding: 12,
		},
		left: {
			flex: 2,
			justifyContent: "flex-start",
		},
		right: {
			flex: 1,
		},
		rightText: {
			textAlign: "right",
		},
		game: {
			color: theme.colors.text,
		},
		info: {
			color: theme.colors.textMuted,
		},
		bold: {
			fontWeight: 500,
			color: theme.colors.text,
		},
	});
