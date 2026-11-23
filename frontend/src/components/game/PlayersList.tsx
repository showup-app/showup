import { FlatList, StyleSheet, Text, View } from "react-native";
import PlayerCard from "./PlayerCard";
import { GameDetail, Player } from "../../types/game";
import { CustomTheme, useTheme } from "@react-navigation/native";

const PlayersList = ({
	game,
	isHost,
	onPress,
	isDisabled,
}: {
	game: GameDetail;
	isHost: boolean;
	onPress: (player: Player) => void;
	isDisabled: boolean;
}) => {
	const theme = useTheme();
	const styles = getStyles(theme);

	return (
		<FlatList
			style={{ flex: 1 }}
			data={game.players}
			keyExtractor={(player) => String(player.id)}
			ListHeaderComponent={
				<View style={styles.playersHeading}>
					<Text style={styles.playersText}>PLAYERS</Text>
					<Text style={styles.playersText}>
						{game.players.length}/{game.spots} joined
					</Text>
				</View>
			}
			renderItem={({ item: player }) => (
				<PlayerCard
					player={player}
					isDisabled={isDisabled}
					onPress={isHost ? () => onPress(player) : undefined}
				/>
			)}
			ItemSeparatorComponent={() => <View style={styles.playerCardSeparator} />}
		/>
	);
};

export default PlayersList;

const getStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		playerCardSeparator: {
			height: theme.spacing.sm,
		},
		playersHeading: {
			flexDirection: "row",
			justifyContent: "space-between",
			width: "100%",
			marginBottom: theme.spacing.sm,
		},
		playersText: {
			fontSize: theme.fontSize.md,
			color: theme.colors.textMuted,
		},
	});
