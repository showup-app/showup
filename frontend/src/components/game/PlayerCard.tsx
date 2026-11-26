import { Pressable, StyleSheet, Text, View } from "react-native";
import { Player } from "../../types/game";
import { CustomTheme, useTheme } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const PlayerCard = ({
	player,
	onPress,
	isDisabled = false,
}: {
	player: Player;
	onPress?: () => void;
	isDisabled?: boolean;
}) => {
	const theme = useTheme();
	const styles = getStyles(theme);

	return (
		<View style={styles.container}>
			<View style={styles.userProfile}>
				<MaterialCommunityIcons name="account-circle" size={36} color={theme.colors.textMuted} />
				<Text style={styles.playerName}>{player.name}</Text>
			</View>
			<View style={styles.rightSection}>
				<Text style={styles.reputation}>★ {player.reputation}</Text>
				{onPress && (
					<Pressable
						testID={`remove-player-${player.id}`}
						onPress={onPress}
						disabled={isDisabled}
						hitSlop={10}
						accessibilityLabel={`Remove ${player.name}`}
						style={isDisabled && styles.removeDisabled}
					>
						<MaterialCommunityIcons name="close" size={20} color={theme.colors.textMuted} />
					</Pressable>
				)}
			</View>
		</View>
	);
};

export default PlayerCard;

const getStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		container: {
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "center",
			width: "100%",
			backgroundColor: theme.colors.surface,
			borderRadius: 8,
			paddingVertical: theme.spacing.md,
			paddingHorizontal: theme.spacing.md,
		},
		reputation: {
			color: theme.colors.textSecondary,
			fontSize: theme.fontSize.md,
			fontFamily: theme.fontFamily.medium,
		},
		userProfile: {
			display: "flex",
			flexDirection: "row",
			gap: theme.spacing.xs,
			alignItems: "center",
		},
		playerName: {
			fontFamily: theme.fontFamily.regular,
			color: theme.colors.text,
		},
		rightSection: {
			flexDirection: "row",
			gap: theme.spacing.md,
			alignItems: "center",
		},
		removeDisabled: {
			opacity: 0.4,
		},
	});
