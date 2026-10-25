import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CustomTheme, useTheme } from "@react-navigation/native";
import { ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";
import { GameDetail } from "../../types/game";
import { capitalize, cityFromAddress, formatCost, formatShortDate, formatTimeRange } from "../../utils/format";
import { sportIcon } from "../../utils/sports";

type GameCardProps = {
	game: GameDetail;
};

// Game card on explore/review page
const GameCardDetailed = ({ game }: GameCardProps) => {
	const theme = useTheme();
	const styles = getStyles(theme);
	const hostName = "host_name" in game ? game.host_name : null;
	const hostReputation = "host_reputation" in game ? game.host_reputation : null;
	const showFooter = hostName !== null;

	return (
		<View style={styles.card}>
			{/* Title row */}
			<View style={styles.header}>
				<MaterialCommunityIcons name={sportIcon(game.sport)} size={28} color={theme.colors.textSecondary} />
				<View style={styles.headerText}>
					<Text style={styles.title}>{capitalize(game.sport)} game</Text>
					<Text style={styles.subtitle} numberOfLines={1}>
						{game.venue} · {cityFromAddress(game.address)}
					</Text>
				</View>
			</View>

			<View style={styles.details}>
				<View style={styles.detailRow}>
					<View style={styles.detail}>
						<Text style={styles.detailName}>WHEN</Text>
						<Text style={styles.detailValue}>
							{formatShortDate(game.starts_at)} {formatTimeRange(game.starts_at, game.duration_minutes)}
						</Text>
					</View>
					<View style={styles.detail}>
						<Text style={styles.detailName}>WHERE</Text>
						<Text style={styles.detailValue}>{game.address}</Text>
					</View>
				</View>
				<View style={styles.detailRow}>
					<View style={styles.detail}>
						<Text style={styles.detailName}>COST</Text>
						<Text style={styles.detailValue}>{formatCost(game.cost)} per player</Text>
					</View>
					<View style={styles.detail}>
						<Text style={styles.detailName}>REPUTATION REQUIRED</Text>
						<Text style={styles.reputation}>★ {game.min_reputation}+</Text>
					</View>
				</View>
			</View>

			{/* Footer*/}
			{showFooter && (
				<View style={styles.footer}>
					{hostName && (
						<View style={styles.hostContainer}>
							<MaterialCommunityIcons name="account-circle" size={30} color={theme.colors.textMuted} />
							<View>
								<Text style={styles.hostName}>Hosted by {hostName}</Text>
								{hostReputation !== null && <Text style={styles.reputation}>★ {hostReputation}</Text>}
							</View>
						</View>
					)}
				</View>
			)}
		</View>
	);
};

export default GameCardDetailed;

const getStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		card: {
			backgroundColor: theme.colors.surface,
			borderColor: theme.colors.border,
			borderWidth: 1,
			borderRadius: 10,
			overflow: "hidden",
		},
		header: {
			flexDirection: "row",
			alignItems: "center",
			gap: 12,
			paddingHorizontal: 16,
			paddingVertical: 12,
			borderBottomWidth: 1,
			borderBottomColor: theme.colors.border,
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
		subtitle: {
			color: theme.colors.textMuted,
			fontSize: 13,
		},
		joinButton: {
			backgroundColor: theme.colors.textSecondary,
			borderRadius: 16,
			paddingHorizontal: 18,
			paddingVertical: 8,
		},
		joinButtonDisabled: {
			backgroundColor: "transparent",
			borderWidth: 1,
			borderColor: theme.colors.border,
		},
		joinText: {
			color: theme.colors.background,
			fontSize: 14,
			fontWeight: "600",
		},
		joinTextDisabled: {
			color: theme.colors.textMuted,
		},
		chips: {
			flexDirection: "row",
			flexWrap: "wrap",
			gap: 8,
			padding: 16,
		},
		footer: {
			flexDirection: "row",
			alignItems: "center",
			gap: 8,
			paddingHorizontal: 16,
			paddingVertical: 12,
			borderTopWidth: 1,
			borderTopColor: theme.colors.border,
		},
		hostName: {
			color: theme.colors.text,
			fontSize: 14,
		},
		reputation: {
			color: theme.colors.textSecondary,
			fontSize: 12,
		},
		seePlayers: {
			marginLeft: "auto",
		},
		link: {
			color: theme.colors.textSecondary,
			fontSize: 13,
			fontWeight: "500",
		},
		details: {
			paddingVertical: 7,
		},
		detailRow: {
			display: "flex",
			flexDirection: "row",
			width: "100%",
			paddingVertical: 5,
			paddingLeft: 10,
		},
		detail: {
			width: "50%",
		},
		detailName: {
			color: "#ADADAD",
			fontSize: 14,
			fontWeight: 400,
		},
		detailValue: {
			color: theme.colors.text,
			fontSize: 14,
			fontWeight: 400,
		},
		hostContainer: {
			display: "flex",
			flexDirection: "row",
			gap: 10,
		}
	});
