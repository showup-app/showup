import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CustomTheme, useTheme } from "@react-navigation/native";
import { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Game, GameCreate, GameDetail } from "../../types/game";
import {
	capitalize,
	cityFromAddress,
	formatCost,
	formatShortDate,
	formatSpotsLeft,
	formatTimeRange,
	getJoinButtonText,
} from "../../utils/format";
import { sportIcon } from "../../utils/sports";
import { useUser } from "../../context/UserContext";

// Change chip colour to orange below 3
const LOW_SPOTS = 3;

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

type GameCardProps = {
	game: Game | GameDetail | GameCreate;
	onJoin?: () => void;
	onSeePlayers?: () => void;
	isDetailed?: boolean;
};

// Game card on explore/review page
const GameCard = ({ game, onJoin, onSeePlayers, isDetailed = false }: GameCardProps) => {
	const theme = useTheme();
	const styles = getStyles(theme);
	const { user } = useUser();
	const hostName = "host_name" in game ? game.host_name : null;
	const hostReputation = "host_reputation" in game ? game.host_reputation : null;
	const spotsLeft = "spots_left" in game ? game.spots_left : game.spots;

	const isFull = spotsLeft <= 0;
	const isAlmostFull = !isFull && spotsLeft <= LOW_SPOTS;
	const showFooter = hostName !== null || onSeePlayers !== undefined;
	const userJoinedGame = "joined" in game && game.joined;
	const userHostingGame = "host_id" in game && game.host_id === user?.id;
	const joinButtonDisabled = isFull || userJoinedGame || userHostingGame;

	return (
		<View style={styles.card}>
			{/* Title row */}
			<View style={[styles.header, isDetailed && styles.bottomBorder]}>
				<MaterialCommunityIcons name={sportIcon(game.sport)} size={28} color={theme.colors.textSecondary} />
				<View style={styles.headerText}>
					<Text style={styles.title}>{capitalize(game.sport)} game</Text>
					<Text style={styles.subtitle} numberOfLines={1}>
						{game.venue} · {cityFromAddress(game.address)}
					</Text>
				</View>
				{onJoin && (
					<Pressable
						style={[styles.joinButton, joinButtonDisabled && styles.joinButtonDisabled]}
						onPress={onJoin}
						disabled={joinButtonDisabled}
						hitSlop={8}
					>
						<Text style={[styles.joinText, joinButtonDisabled && styles.joinTextDisabled]}>
							{getJoinButtonText(userJoinedGame, isFull, userHostingGame)}
						</Text>
					</Pressable>
				)}
			</View>

			{isDetailed ? (
				<View style={styles.details}>
					<View style={styles.detailRow}>
						<View style={styles.detail}>
							<Text style={styles.detailName}>WHEN</Text>
							<Text style={styles.detailValue}>
								{formatShortDate(game.starts_at)}{" "}
								{formatTimeRange(game.starts_at, game.duration_minutes)}
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
			) : (
				/* Detail chips */
				<View style={styles.chips}>
					<Chip icon="calendar-blank-outline" label={formatShortDate(game.starts_at)} />
					<Chip icon="clock-outline" label={formatTimeRange(game.starts_at, game.duration_minutes)} />
					<Chip
						icon={isAlmostFull ? "fire" : "account-multiple-outline"}
						label={formatSpotsLeft(spotsLeft)}
						color={isAlmostFull ? theme.colors.warning : undefined}
					/>
					<Chip label={formatCost(game.cost)} color={game.cost === 0 ? theme.colors.success : undefined} />
					{game.min_reputation > 0 && <Chip icon="star-outline" label={`${game.min_reputation}+ only`} />}
				</View>
			)}

			{/* Footer*/}
			{showFooter && !isDetailed && (
				<View style={styles.footer}>
					{hostName && (
						<>
							<MaterialCommunityIcons name="account-circle" size={24} color={theme.colors.textMuted} />
							<Text style={styles.hostName}>{hostName}</Text>
							{hostReputation !== null && <Text style={styles.reputation}>★ {hostReputation}</Text>}
						</>
					)}
					{onSeePlayers && (
						<Pressable onPress={onSeePlayers} hitSlop={8} style={styles.seePlayers}>
							<Text style={styles.link}>See players</Text>
						</Pressable>
					)}
				</View>
			)}

			{showFooter && isDetailed && (
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

export default GameCard;

type ChipProps = {
	label: string;
	icon?: IconName;
	color?: string;
};

const Chip = ({ label, icon, color }: ChipProps) => {
	const theme = useTheme();
	const styles = getStyles(theme);
	const textColor = color ?? theme.colors.text;

	return (
		<View style={styles.chip}>
			{icon && <MaterialCommunityIcons name={icon} size={14} color={textColor} />}
			<Text style={[styles.chipText, { color: textColor }]}>{label}</Text>
		</View>
	);
};

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
			paddingTop: 16,
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
		chip: {
			flexDirection: "row",
			alignItems: "center",
			gap: 4,
			backgroundColor: theme.colors.border,
			borderRadius: 12,
			paddingHorizontal: 10,
			paddingVertical: 5,
		},
		chipText: {
			fontSize: 13,
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
		},
		bottomBorder: {
			paddingBottom: 12,
			borderBottomWidth: 1,
			borderBottomColor: theme.colors.border,
		},
	});
