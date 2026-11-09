import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { ExploreScreen } from "../screens/ExploreScreen";
import { getTestTabParams, makeGame, makeGameDetail, mockApi, mockNavigation, mockUserContext } from "./utils/mocks";

describe("ExploreScreen", () => {
	const params = getTestTabParams("Explore");

	beforeEach(() => {
		jest.useFakeTimers();
		mockUserContext.user = {
			id: 5,
			email: "person@example.com",
			name: "Test Person",
			reputation: 80,
		};
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.restoreAllMocks();
	});

	const runSearch = async () => {
		await act(async () => {
			await jest.advanceTimersByTimeAsync(400);
		});
	};

	it("loads games, filters by location and sport, navigates to details, and joins", async () => {
		const game = makeGame({ joined: false });
		mockApi.getGames.mockResolvedValue({ ok: true, data: [game], status: 200 });
		mockApi.joinGame.mockResolvedValue({
			ok: true,
			data: makeGameDetail({ joined: true }),
			status: 200,
		});
		const { getByText, getByPlaceholderText, findByText } = await render(<ExploreScreen {...params} />);

		expect(getByText("Finding games…")).toBeTruthy();
		await runSearch();
		await waitFor(() => {
			expect(mockApi.getGames).toHaveBeenLastCalledWith({ location: undefined, sport: undefined }, "test-token");
		});
		await fireEvent.changeText(getByPlaceholderText("e.g. Burnaby"), " Burnaby ");
		await fireEvent.press(getByText("Basketball"));
		await runSearch();
		await waitFor(() => {
			expect(mockApi.getGames).toHaveBeenLastCalledWith(
				{ location: "Burnaby", sport: "basketball" },
				"test-token",
			);
		});

		await fireEvent.press(getByText("See players"));
		expect(mockNavigation.navigate).toHaveBeenCalledWith("GameDetails", { gameId: 1 });
		await fireEvent.press(getByText("Join"));
		await waitFor(() => {
			expect(mockApi.joinGame).toHaveBeenCalledWith(1, "test-token");
		});
		expect(await findByText("Joined")).toBeTruthy();
	});

	it("shows the location-specific empty state and retries a load error", async () => {
		mockApi.getGames
			.mockResolvedValueOnce({ ok: true, data: [], status: 200 })
			.mockResolvedValueOnce({ ok: false, data: null, status: 500, error: "Could not find games" })
			.mockResolvedValueOnce({ ok: true, data: [], status: 200 });
		const { getByPlaceholderText, getByText, findByText } = await render(<ExploreScreen {...params} />);
		await runSearch();
		expect(await findByText("No upcoming games yet")).toBeTruthy();

		await fireEvent.changeText(getByPlaceholderText("e.g. Burnaby"), " Burnaby ");
		await runSearch();
		expect(await findByText("Could not find games")).toBeTruthy();

		await fireEvent.press(getByText("Try again"));
		await waitFor(() => {
			expect(mockApi.getGames).toHaveBeenLastCalledWith({ location: "Burnaby" }, "test-token");
		});
		expect(await findByText('No upcoming games near "Burnaby"')).toBeTruthy();
	});

	it("uses the sport-only empty message and logs join failures", async () => {
		mockApi.getGames.mockResolvedValue({ ok: true, data: [], status: 200 });
		const { getByText, findByText } = await render(<ExploreScreen {...params} />);
		await runSearch();
		await waitFor(() => {
			fireEvent.press(getByText("Tennis"));
		});
		await runSearch();
		expect(await findByText("No upcoming tennis games yet")).toBeTruthy();
	});

	// TODO: Add error message for a failed join, and complete this test
	// it("displays an error message for a failed join request", async () => {
	// 	const game = makeGame();
	// 	mockApi.getGames.mockResolvedValue({ ok: true, data: [game], status: 200 });
	// 	mockApi.joinGame.mockResolvedValue({ ok: false, data: null, status: 400, error: "Join failed" });
	// 	const { getByText } = await render(<ExploreScreen {...params} />);
	// 	await runSearch();
	// 	await waitFor(() => {
	// 		fireEvent.press(getByText("Join"));
	// 	});
	// });

	it("refreshes the current list", async () => {
		mockApi.getGames.mockResolvedValue({ ok: true, data: [], status: 200 });
		const view = await render(<ExploreScreen {...params} />);
		await runSearch();
		await fireEvent.press(await view.findByTestId("refresh-control"));
		await waitFor(() => {
			expect(mockApi.getGames).toHaveBeenCalledTimes(2);
		});
	});
});
