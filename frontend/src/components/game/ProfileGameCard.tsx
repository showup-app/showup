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
	const { my_showed_up, my_reputation_change, status, showed_up_count, marked_count } = game;

	const getTopInfoText = (): string => {
		if (isHost) return capitalize(status);
		if (my_showed_up === null) return "Unknown";
		return my_showed_up ? "Showed Up" : "No-show";
	};

	const getBottomInfoText = (): string => {
		if (isHost) return `${showed_up_count}/${marked_count} showed up`;
		if (my_showed_up === null || my_reputation_change === null) return "Unknown";
		if (my_reputation_change === 0) return "No change";
		return `${my_reputation_change > 0 ? "+" : ""}${my_reputation_change}`;
	};

	const getAttendanceStyle = () => {
		if (isHost || game.my_showed_up === null) {
			return;
		}
		return game.my_showed_up ? styles.showedUp : styles.noShow;
	};

	return (
		<Pressable style={[globalStyles.container, styles.card]} onPress={onPress}>
			<View style={styles.left}>
				<Text style={styles.game}>{capitalize(game.sport)} game</Text>
				<Text style={styles.info}>
					{formatShortDate(game.starts_at)} - {cityFromAddress(game.address)}
				</Text>
			</View>
			<View style={styles.right}>
				<Text style={[styles.info, styles.rightText, getAttendanceStyle()]}>{getTopInfoText()}</Text>
				<Text style={[styles.rightText, styles.bold]}>{getBottomInfoText()}</Text>
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
		showedUp: {
			color: theme.colors.textSecondary,
		},
		noShow: {
			color: theme.colors.danger,
		},
		bold: {
			fontWeight: 500,
			color: theme.colors.text,
		},
	});
