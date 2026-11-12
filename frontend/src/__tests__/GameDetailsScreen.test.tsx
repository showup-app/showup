import { Alert } from "react-native";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import GameDetailsScreen from "../screens/GameDetailsScreen";
import { getTestScreenParams, makeGameDetail, mockApi, mockNavigation, mockUserContext } from "./utils/mocks";
import { GameStatus } from "../types/game";

describe("GameDetailsScreen", () => {
	const params = getTestScreenParams("GameDetails", { gameId: 1 });
	const setUser = (id: number) => {
		mockUserContext.user = {
			id,
			email: "person@example.com",
			name: "Test Person",
			reputation: 80,
		};
	};

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("shows loading, handles a load error, and retries", async () => {
		setUser(5);
		const { promise, resolve } = Promise.withResolvers<Awaited<ReturnType<typeof mockApi.getGame>>>();
		mockApi.getGame.mockReturnValue(promise);
		const { getByText, findByText } = await render(<GameDetailsScreen {...params} />);

		expect(getByText("Loading game…")).toBeTruthy();
		await act(async () => {
			resolve({ ok: false, data: null, status: 500, error: "Game unavailable" });
		});
		expect(await findByText("Game unavailable")).toBeTruthy();

		mockApi.getGame.mockResolvedValueOnce({ ok: true, data: makeGameDetail(), status: 200 });
		await fireEvent.press(getByText("Try again"));
		expect(await findByText("PLAYERS")).toBeTruthy();
		expect(mockApi.getGame).toHaveBeenCalledWith(1, "test-token");
	});

	it("lets the host edit, remove players, and cancel a game after confirmation", async () => {
		setUser(99);
		const game = makeGameDetail({
			id: 1,
			host_id: 99,
			status: GameStatus.Full,
			players: [
				{ id: 2, name: "Player One", reputation: 80, games_played: 4, is_new: false },
				{ id: 3, name: "Player Two", reputation: 75, games_played: 2, is_new: false },
			],
		});
		mockApi.getGame.mockResolvedValue({ ok: true, data: game, status: 200 });
		const { promise: removePlayerPromise, resolve: resolveRemovePlayer } =
			Promise.withResolvers<Awaited<ReturnType<typeof mockApi.removePlayer>>>();
		mockApi.removePlayer.mockImplementation(() => {
			return removePlayerPromise;
		});
		const { promise: cancelGamePromise, resolve: resolveCancelGame } =
			Promise.withResolvers<Awaited<ReturnType<typeof mockApi.cancelGame>>>();
		mockApi.cancelGame.mockImplementation(() => {
			return cancelGamePromise;
		});
		const alert = jest.spyOn(Alert, "alert");
		const { getByText, getByTestId, findByText, queryByText } = await render(<GameDetailsScreen {...params} />);

		await findByText("Edit Game Details");
		await fireEvent.press(getByText("Edit Game Details"));
		expect(mockNavigation.navigate).toHaveBeenCalledWith(
			"CreatePost",
			expect.objectContaining({ edit: expect.objectContaining({ gameId: 1, minSpots: 2 }) }),
		);
		await act(async () => {
			resolveRemovePlayer({ ok: true, data: game, status: 200 });
			await fireEvent.press(getByTestId("remove-player-2"));
		});
		expect(mockApi.removePlayer).toHaveBeenCalledWith(1, 2, "test-token");
		expect(queryByText("Player One")).toBeNull();

		await fireEvent.press(getByText("Cancel Game"));
		expect(alert).toHaveBeenCalledWith(
			"Cancel Game?",
			"Are you sure you want to cancel this game? This action cannot be undone.",
			expect.any(Array),
			{ cancelable: true },
		);
		const buttons = alert.mock.calls[0][2]!;
		buttons[0].onPress?.();
		expect(mockApi.cancelGame).not.toHaveBeenCalled();
		buttons[1].onPress?.();

		await act(async () => {
			resolveCancelGame({ ok: true, data: game, status: 200 });
		});
		expect(await findByText("This game has been cancelled by the host.")).toBeTruthy();
		expect(mockApi.cancelGame).toHaveBeenCalledWith(1, "test-token");
		await fireEvent.press(getByText("Cancel Game"));
		expect(alert).toHaveBeenCalledTimes(1);
	});

	it("joins and leaves a game, showing the in-progress label", async () => {
		setUser(5);
		const { promise: joinPromise, resolve: resolveJoin } =
			Promise.withResolvers<Awaited<ReturnType<typeof mockApi.joinGame>>>();
		mockApi.getGame.mockResolvedValue({
			ok: true,
			data: makeGameDetail({ host_id: 99, joined: false, spots_left: 2 }),
			status: 200,
		});
		mockApi.joinGame.mockReturnValue(joinPromise);
		const { promise: leavePromise, resolve: resolveLeave } =
			Promise.withResolvers<Awaited<ReturnType<typeof mockApi.leaveGame>>>();
		mockApi.leaveGame.mockReturnValue(leavePromise);
		const { getByText, findByText } = await render(<GameDetailsScreen {...params} />);

		await findByText("PLAYERS");
		const joinPress = fireEvent.press(getByText("Join"));
		expect(await findByText("Joining...")).toBeTruthy();
		await act(async () => {
			resolveJoin({
				ok: true,
				data: makeGameDetail({ host_id: 99, joined: true, spots_left: 1 }),
				status: 200,
			});
			await joinPress;
		});
		await findByText("Leave");
		const leavePress = fireEvent.press(getByText("Leave"));
		expect(await findByText("Leaving...")).toBeTruthy();
		await act(async () => {
			resolveLeave({
				ok: true,
				data: makeGameDetail({ host_id: 99, joined: false, spots_left: 2 }),
				status: 200,
			});
			await leavePress;
		});
		await waitFor(() => expect(mockApi.leaveGame).toHaveBeenCalledWith(1, "test-token"));
		expect(getByText("Join")).toBeTruthy();
	});

	it("disables joining full or cancelled games but allows a joined player to leave", async () => {
		setUser(5);
		mockApi.getGame.mockResolvedValue({
			ok: true,
			data: makeGameDetail({ joined: false, spots_left: 0 }),
			status: 200,
		});
		const full = await render(<GameDetailsScreen {...params} />);
		expect(await full.findByText("Full")).toBeTruthy();
		expect(mockApi.joinGame).not.toHaveBeenCalled();

		await full.unmount();
		mockApi.getGame.mockResolvedValue({
			ok: true,
			data: makeGameDetail({ status: GameStatus.Cancelled, joined: false, spots_left: 2 }),
			status: 200,
		});
		const cancelled = await render(<GameDetailsScreen {...params} />);
		expect(await cancelled.findByText("This game has been cancelled by the host.")).toBeTruthy();
		await fireEvent.press(cancelled.getByText("Join"));
		expect(mockApi.joinGame).not.toHaveBeenCalled();

		await cancelled.unmount();
		mockApi.getGame.mockResolvedValue({
			ok: true,
			data: makeGameDetail({ joined: true, spots_left: 0 }),
			status: 200,
		});
		mockApi.leaveGame.mockResolvedValue({
			ok: true,
			data: makeGameDetail({ joined: false, spots_left: 2 }),
			status: 200,
		});
		const joined = await render(<GameDetailsScreen {...params} />);
		await fireEvent.press(await joined.findByText("Leave"));
		await waitFor(() => expect(mockApi.leaveGame).toHaveBeenCalled());
	});

	it("does not allow hosts to edit played games or remove players after cancellation", async () => {
		setUser(99);
		mockApi.getGame.mockResolvedValue({
			ok: true,
			data: makeGameDetail({ host_id: 99, status: GameStatus.Played }),
			status: 200,
		});
		const played = await render(<GameDetailsScreen {...params} />);
		expect(await played.findByText("Edit Game Details")).toBeTruthy();
		await fireEvent.press(played.getByText("Edit Game Details"));
		expect(mockNavigation.navigate).not.toHaveBeenCalled();
		await played.unmount();

		mockApi.getGame.mockResolvedValue({
			ok: true,
			data: makeGameDetail({ host_id: 99, status: GameStatus.Cancelled }),
			status: 200,
		});
		const cancelled = await render(<GameDetailsScreen {...params} />);
		await cancelled.findByText("Cancel Game");
		await fireEvent.press(await cancelled.findByTestId("remove-player-2"));
		expect(mockApi.removePlayer).not.toHaveBeenCalled();
		await fireEvent.press(cancelled.getByText("Cancel Game"));
		expect(mockNavigation.navigate).not.toHaveBeenCalled();
	});

	it("ignores successful player removal when the screen has transitioned to an error state", async () => {
		setUser(99);
		mockApi.getGame.mockReset();
		mockApi.removePlayer.mockReset();
		const { promise, resolve } = Promise.withResolvers<Awaited<ReturnType<typeof mockApi.removePlayer>>>();
		mockApi.getGame
			.mockResolvedValueOnce({ ok: true, data: makeGameDetail({ host_id: 99 }), status: 200 })
			.mockResolvedValueOnce({ ok: false, data: null, status: 500, error: "Game unavailable" });
		mockApi.removePlayer.mockReturnValue(promise);
		const view = await render(<GameDetailsScreen {...params} />);
		await view.findByText("Edit Game Details");
		const playerCard = await view.findByTestId("remove-player-2");
		fireEvent.press(playerCard);
		await waitFor(() => expect(mockApi.removePlayer).toHaveBeenCalledWith(1, 2, "test-token"));

		await view.rerender(<GameDetailsScreen {...params} route={{ ...params.route, params: { gameId: 2 } }} />);
		await act(async () => {
			resolve({ ok: true, data: makeGameDetail(), status: 200 });
		});
		await fireEvent.press(playerCard);
		expect(view.getByText("Game unavailable")).toBeTruthy();
	});

	it("ignores successful cancellation when the screen has transitioned to an error state", async () => {
		setUser(99);
		mockApi.getGame.mockReset();
		mockApi.cancelGame.mockReset();
		const { promise, resolve } = Promise.withResolvers<Awaited<ReturnType<typeof mockApi.cancelGame>>>();
		mockApi.getGame
			.mockResolvedValueOnce({ ok: true, data: makeGameDetail({ host_id: 99 }), status: 200 })
			.mockResolvedValueOnce({ ok: false, data: null, status: 500, error: "Game unavailable" });
		mockApi.cancelGame.mockReturnValue(promise);

		const alert = jest.spyOn(Alert, "alert");
		const view = await render(<GameDetailsScreen {...params} />);
		await fireEvent.press(await view.findByText("Cancel Game"));
		await waitFor(() => expect(alert).toHaveBeenCalled());

		const alertButtons = alert.mock.calls[0][2];
		if (alertButtons === undefined) throw new Error("Alert was not called");
		const confirm = alertButtons.find((button) => button.text === "Confirm");
		if (confirm === undefined) throw new Error("Alert has no confirm button");
		confirm.onPress?.();

		await waitFor(() => expect(mockApi.cancelGame).toHaveBeenCalledWith(1, "test-token"));
		await view.rerender(<GameDetailsScreen {...params} route={{ ...params.route, params: { gameId: 2 } }} />);
		await act(async () => {
			resolve({ ok: true, data: makeGameDetail(), status: 200 });
		});
		expect(await view.findByText("Game unavailable")).toBeTruthy();
	});
});
