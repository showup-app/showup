import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CustomTheme, useTheme } from "@react-navigation/native";
import { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Game, GameDetail } from "../../types/game";
import { capitalize, formatCost, formatLongDate, formatTimeRange } from "../../utils/format";
import { sportIcon } from "../../utils/sports";

type GameCardProps = {
	game: Game | GameDetail;
	onPress?: () => void;
};

/** Full detail game card */
const GameCard = ({ game, onPress }: GameCardProps) => {
	const theme = useTheme();
	const styles = getStyles(theme);

	// The list endpoint doesn't send these yet
	const hostName = "host_name" in game ? game.host_name : null;
	const hostReputation = "host_reputation" in game ? game.host_reputation : null;
	const spotsLeft = "spots_left" in game ? game.spots_left : game.spots;

	return (
		<Pressable style={styles.card} onPress={onPress} disabled={!onPress}>
			<View style={styles.header}>
				<View style={styles.sportIcon}>
					<MaterialCommunityIcons
						name={sportIcon(game.sport)}
						size={28}
						color={theme.colors.background}
					/>
				</View>
				<View style={styles.headerText}>
					<Text style={styles.title}>{capitalize(game.sport)} game</Text>
					{game.min_reputation > 0 && (
						<Text style={styles.caption}>
							Only players with a reputation score of {game.min_reputation}+
						</Text>
					)}
				</View>
			</View>

			<View style={styles.details}>
				<DetailRow icon="map-marker-outline" title={game.venue} subtitle={game.address} />
				<DetailRow
					icon="calendar-blank-outline"
					title={formatLongDate(game.starts_at)}
					subtitle={formatTimeRange(game.starts_at, game.duration_minutes)}
				/>
				<DetailRow icon="account-multiple-outline" title={`${spotsLeft} available spots`} />
				<DetailRow icon="currency-usd" title={formatCost(game.cost)} />
			</View>

			{hostName && (
				<View style={styles.host}>
					<MaterialCommunityIcons
						name="account-circle"
						size={40}
						color={theme.colors.textMuted}
					/>
					<View>
						<Text style={styles.hostName}>Hosted by {hostName}</Text>
						{hostReputation !== null && (
							<Text style={styles.reputation}>★ {hostReputation}</Text>
						)}
					</View>
				</View>
			)}
		</Pressable>
	);
};

export default GameCard;

type DetailRowProps = {
	icon: ComponentProps<typeof MaterialCommunityIcons>["name"];
	title: string;
	subtitle?: string;
};

/** One icon + text row inside the card (location, date, spots, cost). */
const DetailRow = ({ icon, title, subtitle }: DetailRowProps) => {
	const theme = useTheme();
	const styles = getStyles(theme);

	return (
		<View style={styles.row}>
			<MaterialCommunityIcons name={icon} size={22} color={theme.colors.textSecondary} />
			<View style={styles.rowText}>
				<Text style={styles.rowTitle}>{title}</Text>
				{subtitle && <Text style={styles.caption}>{subtitle}</Text>}
			</View>
		</View>
	);
};

const getStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		card: {
			backgroundColor: theme.colors.surface,
			borderColor: theme.colors.border,
			borderWidth: 1,
			borderRadius: 8,
			overflow: "hidden",
		},
		header: {
			flexDirection: "row",
			alignItems: "center",
			gap: 12,
			padding: 16,
			borderBottomWidth: 1,
			borderBottomColor: theme.colors.border,
		},
		sportIcon: {
			width: 40,
			height: 40,
			borderRadius: 6,
			backgroundColor: theme.colors.textSecondary,
			alignItems: "center",
			justifyContent: "center",
		},
		headerText: {
			flex: 1,
			gap: 2,
		},
		title: {
			color: theme.colors.text,
			fontSize: 18,
			fontWeight: "500",
		},
		caption: {
			color: theme.colors.textMuted,
			fontSize: 12,
		},
		details: {
			padding: 16,
			gap: 16,
		},
		row: {
			flexDirection: "row",
			alignItems: "center",
			gap: 12,
		},
		rowText: {
			flex: 1,
			gap: 2,
		},
		rowTitle: {
			color: theme.colors.text,
			fontSize: 16,
			fontWeight: "500",
		},
		host: {
			flexDirection: "row",
			alignItems: "center",
			gap: 12,
			padding: 16,
			backgroundColor: theme.colors.background,
		},
		hostName: {
			color: theme.colors.text,
			fontSize: 14,
			fontWeight: "500",
		},
		reputation: {
			color: theme.colors.textSecondary,
			fontSize: 12,
		},
	});