import { ConfirmModalProps } from "../components/ui/ConfirmModal";
import { ModalTypes } from "../screens/GameDetailsScreen";
import { User } from "../types/auth";
import { GameDetail, GameStatus, Player } from "../types/game";

export const getGamePermissions = (game: GameDetail, userId: User["id"], isSubmitting: boolean) => {
	const isFull = game.spots_left <= 0 || game.status === GameStatus.Full;
	const isHost = userId === game.host_id;
	const isCancelled = game.status === GameStatus.Cancelled;
	const isStarted = new Date(game.starts_at).getTime() <= Date.now();
	const isPlayable = game.status === GameStatus.Open || game.status === GameStatus.Full;

	const canManage = isPlayable && !isStarted;
	const canJoinLeave = (!isFull || game.joined) && isPlayable && !isStarted && !isSubmitting;

	return {
		isFull,
		isHost,
		isCancelled,
		isStarted,
		isPlayable,
		canManage,
		canJoinLeave,
	};
};

export const getGameModalProps = (
	modal: NonNullable<ModalTypes>,
	actions: {
		onCancel: () => void;
		onJoin: () => void;
		onLeave: () => void;
		onRemovePlayer: (player: Player) => void;
	},
): Pick<ConfirmModalProps, "title" | "message" | "onConfirm"> => {
	switch (modal.type) {
		case "cancel":
			return {
				title: "Cancel Game",
				message: "Are you sure you want to cancel this game? This action cannot be undone.",
				onConfirm: actions.onCancel,
			};
		case "join":
			return {
				title: "Join Game",
				message:
					"Are you sure you want to join this game? Failing to attend may decrease your profile's reputation.",
				onConfirm: actions.onJoin,
			};
		case "leave":
			return {
				title: "Leave Game",
				message: "Are you sure you want to leave this game?",
				onConfirm: actions.onLeave,
			};
		case "removePlayer":
			return {
				title: "Remove Player",
				message: `Are you sure you want to remove ${modal.player.name} from the game?`,
				onConfirm: () => actions.onRemovePlayer(modal.player),
			};
	}
};
