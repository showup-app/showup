import { fireEvent, render, waitFor } from "@testing-library/react-native";
import AttendanceScreen from "../screens/AttendanceScreen";
import { getTestScreenParams, makeGameDetail, mockApi, mockNavigation, mockUserContext } from "./utils/mocks";

describe("AttendanceScreen", () => {
	const params = getTestScreenParams("Attendance", { gameId: 1 });

	it("loads players, marks attendance, marks everyone, and saves", async () => {
		const game = makeGameDetail({
			players: [
				{ id: 2, name: "Player One", reputation: 80, games_played: 4, is_new: false, showed_up: true },
				{ id: 3, name: "New Player", reputation: 0, games_played: 0, is_new: true, showed_up: null },
			],
		});
		mockApi.getGame.mockResolvedValue({ ok: true, data: game, status: 200 });
		mockApi.markAttendance.mockResolvedValue({ ok: true, data: game, status: 200 });
		const { findByText, getByLabelText, getByText } = await render(<AttendanceScreen {...params} />);

		expect(await findByText("Your game just ended!")).toBeTruthy();
		expect(getByText("Player One")).toBeTruthy();
		expect(getByText("★ 80")).toBeTruthy();
		expect(getByText("New")).toBeTruthy();
		expect(getByText("1 of 2 marked")).toBeTruthy();

		await fireEvent.press(getByLabelText("New Player didn't show up"));
		expect(getByText("2 of 2 marked")).toBeTruthy();
		await fireEvent.press(getByLabelText("Player One didn't show up"));
		await fireEvent.press(getByText("Everyone showed up"));
		await fireEvent.press(getByText("Save attendance"));

		await waitFor(() => {
			expect(mockApi.markAttendance).toHaveBeenCalledWith(
				1,
				[
					{ user_id: 2, showed_up: true },
					{ user_id: 3, showed_up: true },
				],
				"test-token",
			);
			expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
		});
	});

	it("shows loading then an error and retries the failed load", async () => {
		let resolveGame: ((result: Awaited<ReturnType<typeof mockApi.getGame>>) => void) | undefined;
		mockApi.getGame
			.mockImplementationOnce(
				() =>
					new Promise((resolve) => {
						resolveGame = resolve;
					}),
			)
			.mockResolvedValueOnce({ ok: true, data: makeGameDetail(), status: 200 });
		const { getByText, findByText } = await render(<AttendanceScreen {...params} />);

		expect(getByText("Loading players…")).toBeTruthy();
		resolveGame?.({ ok: false, data: null, status: 500, error: "Could not load players" });

		await findByText("Could not load players");
		await fireEvent.press(getByText("Try again"));
		expect(await findByText("Player One")).toBeTruthy();
		expect(mockApi.getGame).toHaveBeenCalledTimes(2);
	});

	it("requires a token before saving attendance", async () => {
		mockUserContext.token = null;
		mockApi.getGame.mockResolvedValue({
			ok: true,
			data: makeGameDetail({
				players: [
					{ id: 2, name: "Player One", reputation: 80, games_played: 4, is_new: false, showed_up: true },
				],
			}),
			status: 200,
		});
		const { findByText, queryByText } = await render(<AttendanceScreen {...params} />);

		expect(await findByText("Player One")).toBeTruthy();
		await fireEvent.press(await findByText("Save attendance"));
		expect(await findByText("Please log in again to save attendance")).toBeTruthy();
		expect(queryByText("No players joined this game.")).toBeNull();
	});

	it("shows the empty-player message", async () => {
		mockApi.getGame.mockResolvedValue({
			ok: true,
			data: makeGameDetail({ players: [] }),
			status: 200,
		});
		const { findByText, queryByText } = await render(<AttendanceScreen {...params} />);

		expect(await findByText("No players joined this game.")).toBeTruthy();
		expect(queryByText("Save attendance")).toBeNull();
	});

	it("shows attendance save errors and prevents saving until all players are marked", async () => {
		mockApi.getGame.mockResolvedValue({ ok: true, data: makeGameDetail(), status: 200 });
		mockApi.markAttendance.mockResolvedValue({
			ok: false,
			data: null,
			status: 500,
			error: "Unable to save attendance",
		});
		const { findByText, getByText, getByLabelText } = await render(<AttendanceScreen {...params} />);

		await findByText("Mark every player to save");
		await fireEvent.press(getByText("Save attendance"));
		expect(mockApi.markAttendance).not.toHaveBeenCalled();

		await fireEvent.press(getByLabelText("Player One showed up"));
		await fireEvent.press(getByText("Save attendance"));
		expect(await findByText("Unable to save attendance")).toBeTruthy();
		expect(mockNavigation.goBack).not.toHaveBeenCalled();
	});

	it("preserves an empty API error message", async () => {
		mockApi.getGame.mockResolvedValue({ ok: false, data: null, status: 500, error: "" });
		const { findByText, queryByText } = await render(<AttendanceScreen {...params} />);

		expect(await findByText("Try again")).toBeTruthy();
		expect(queryByText("Couldn't load this game")).toBeNull();
	});

	it("uses the fallback when the API omits its error message", async () => {
		const response: Awaited<ReturnType<typeof mockApi.getGame>> = {
			ok: false,
			data: null,
			status: 500,
			error: "placeholder",
		};
		Object.defineProperty(response, "error", { value: null });
		mockApi.getGame.mockResolvedValue(response);
		const { findByText } = await render(<AttendanceScreen {...params} />);

		expect(await findByText("Couldn't load this game")).toBeTruthy();
	});

	it("shows saving feedback while the attendance request is pending", async () => {
		const game = makeGameDetail({
			players: [{ id: 2, name: "Player One", reputation: 80, games_played: 4, is_new: false, showed_up: true }],
		});
		let resolveSave: ((result: Awaited<ReturnType<typeof mockApi.markAttendance>>) => void) | undefined;
		mockApi.getGame.mockResolvedValue({ ok: true, data: game, status: 200 });
		mockApi.markAttendance.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveSave = resolve;
				}),
		);
		const { getByText, findByText } = await render(<AttendanceScreen {...params} />);

		const savePress = fireEvent.press(getByText("Save attendance"));
		expect(await findByText("Saving...")).toBeTruthy();
		resolveSave?.({ ok: true, data: game, status: 200 });
		await savePress;
		await waitFor(() => expect(mockNavigation.goBack).toHaveBeenCalled());
	});
});
