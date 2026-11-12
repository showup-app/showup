import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import AttendanceScreen from "../screens/AttendanceScreen";
import { getTestScreenParams, makeGameDetail, mockApi, mockNavigation } from "./utils/mocks";

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
		const { findByText, findByLabelText } = await render(<AttendanceScreen {...params} />);

		expect(await findByText("Your game just ended!")).toBeTruthy();
		expect(await findByText("Player One")).toBeTruthy();
		expect(await findByText("★ 80")).toBeTruthy();
		expect(await findByText("New")).toBeTruthy();
		expect(await findByText("1 of 2 marked")).toBeTruthy();

		await fireEvent.press(await findByLabelText("New Player didn't show up"));
		expect(await findByText("2 of 2 marked")).toBeTruthy();
		await fireEvent.press(await findByLabelText("Player One didn't show up"));
		await fireEvent.press(await findByText("Everyone showed up"));
		await fireEvent.press(await findByText("Save attendance"));

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
		const { promise, resolve } = Promise.withResolvers<Awaited<ReturnType<typeof mockApi.getGame>>>();
		mockApi.getGame.mockReturnValue(promise);
		const { getByText, findByText } = await render(<AttendanceScreen {...params} />);

		expect(getByText("Loading players…")).toBeTruthy();
		await act(() => {
			resolve({ ok: false, data: null, status: 500, error: "Could not load players" });
		});

		expect(await findByText("Could not load players")).toBeTruthy();
		mockApi.getGame.mockResolvedValueOnce({ ok: true, data: makeGameDetail(), status: 200 });
		await fireEvent.press(getByText("Try again"));

		expect(await findByText("Player One")).toBeTruthy();
		expect(mockApi.getGame).toHaveBeenCalledTimes(2);
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

	it("prevents saving until all players are marked", async () => {
		mockApi.getGame.mockResolvedValue({ ok: true, data: makeGameDetail(), status: 200 });
		const { findByText } = await render(<AttendanceScreen {...params} />);

		await fireEvent.press(await findByText("Save attendance"));
		expect(mockApi.markAttendance).not.toHaveBeenCalled();
	});

	it("shows attendance save errors", async () => {
		mockApi.getGame.mockResolvedValue({ ok: true, data: makeGameDetail(), status: 200 });
		mockApi.markAttendance.mockResolvedValue({
			ok: false,
			data: null,
			status: 500,
			error: "Unable to save attendance",
		});
		const { findByText, findByLabelText } = await render(<AttendanceScreen {...params} />);

		await fireEvent.press(await findByLabelText("Player One showed up"));
		await fireEvent.press(await findByText("Save attendance"));

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
		mockApi.getGame.mockResolvedValue({ ok: true, data: game, status: 200 });

		const { promise, resolve } = Promise.withResolvers<Awaited<ReturnType<typeof mockApi.markAttendance>>>();
		mockApi.markAttendance.mockReturnValue(promise);

		const { findByText } = await render(<AttendanceScreen {...params} />);
		fireEvent.press(await findByText("Save attendance"));
		expect(await findByText("Saving...")).toBeTruthy();

		await act(() => {
			resolve({ ok: true, data: game, status: 200 });
		});
		await waitFor(() => expect(mockNavigation.goBack).toHaveBeenCalled());
	});
});
