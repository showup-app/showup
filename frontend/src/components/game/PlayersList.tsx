import { FlatList, StyleSheet, Text, View } from "react-native";
import PlayerCard from "./PlayerCard";
import { GameDetail, Player } from "../../types/game";
import { CustomTheme, useTheme } from "@react-navigation/native";
import { getGlobalStyles } from "../../theme/styles";

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
	const globalStyles = getGlobalStyles(theme);

	return (
		<FlatList
			style={{ flex: 1 }}
			data={game.players}
			keyExtractor={(player) => String(player.id)}
			ListHeaderComponent={
				<View style={[globalStyles.sectionHeader, styles.playersHeading]}>
					<Text style={globalStyles.sectionTitle}>PLAYERS</Text>
					<Text style={styles.joinedCount}>
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
			marginBottom: theme.spacing.sm,
		},
		joinedCount: {
			fontFamily: theme.fontFamily.regular,
			fontSize: theme.fontSize.sm,
			color: theme.colors.textMuted,
		},
	});
