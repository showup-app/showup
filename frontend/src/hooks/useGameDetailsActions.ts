import { useState } from "react";
import { GameDetail, GameStatus } from "../types/game";
import Toast from "react-native-toast-message";
import { api } from "../services/api";

const useGameDetailsActions = (
	game: GameDetail | null,
	token: string,
	setGame: (data: GameDetail | ((prev: GameDetail) => GameDetail)) => void,
) => {
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleJoinLeaveGame = async () => {
		if (!game) return;

		setIsSubmitting(true);
		const res = game.joined ? await api.leaveGame(game.id, token) : await api.joinGame(game.id, token);
		if (!res.ok) {
			Toast.show({
				type: "error",
				text1: `Failed to ${game.joined ? "leave" : "join"} the game`,
				text2: res.error,
			});
		} else {
			Toast.show({
				type: "success",
				text1: `Successfully ${game.joined ? "left" : "joined"} the game!`,
			});
			setGame(res.data);
		}
		setIsSubmitting(false);
	};

	const handleRemovePlayer = async (playerId: number) => {
		if (!game) return;

		const res = await api.removePlayer(game.id, playerId, token);
		if (res.ok) {
			Toast.show({
				type: "success",
				text1: "Player was successfully removed from the game",
			});
			setGame((prev) => ({
				...prev,
				players: prev.players.filter((player) => player.id !== playerId),
			}));
		} else {
			Toast.show({
				type: "error",
				text1: "Failed to remove player from the game",
				text2: res.error,
			});
		}
	};

	const handleCancelGame = async () => {
		if (!game) return;

		const res = await api.cancelGame(game.id, token);
		if (res.ok) {
			setGame((prev) => ({
				...prev,
				status: GameStatus.Cancelled,
			}));
		} else {
			Toast.show({
				type: "error",
				text1: "Failed to cancel this game",
				text2: res.error,
			});
		}
	};

	return {
		isSubmitting,
		handleJoinLeaveGame,
		handleRemovePlayer,
		handleCancelGame,
	};
};

export default useGameDetailsActions;
