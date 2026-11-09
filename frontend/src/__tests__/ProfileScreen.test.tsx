import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import ProfileScreen from "../screens/ProfileScreen";
import {
	getTestTabParams,
	makeGame,
	makeMyGames,
	mockApi,
	mockContextLogout,
	mockNavigation,
	mockUserContext,
} from "./utils/mocks";
import { GameStatus } from "../types/game";

describe("ProfileScreen", () => {
	const params = getTestTabParams("Profile");

	beforeEach(() => {
		mockUserContext.user = {
			id: 5,
			email: "person@example.com",
			name: "Test Person",
			reputation: 80,
		};
	});

	it("shows loading and error states, then retries successfully", async () => {
		let resolveGames: ((result: Awaited<ReturnType<typeof mockApi.getMyGames>>) => void) | undefined;
		mockApi.getMyGames
			.mockImplementationOnce(
				() =>
					new Promise((resolve) => {
						resolveGames = resolve;
					}),
			)
			.mockResolvedValueOnce({ ok: true, data: makeMyGames(), status: 200 });

		const { getByText, findByText } = await render(<ProfileScreen {...params} />);

		expect(getByText("Loading your games…")).toBeTruthy();
		expect(mockApi.getMyGames).toHaveBeenCalledWith("test-token", true);
		await act(async () => {
			resolveGames?.({ ok: false, data: null, status: 500, error: "Could not load profile" });
		});
		expect(await findByText("Could not load profile")).toBeTruthy();

		await fireEvent.press(getByText("Try again"));
		expect(await findByText("PLAYED GAMES")).toBeTruthy();
		expect(mockApi.getMyGames).toHaveBeenCalledTimes(2);
	});

	it("filters past games, summarizes attendance, opens games, and logs out", async () => {
		mockApi.getMyGames.mockResolvedValue({
			ok: true,
			data: makeMyGames({
				joined: [
					makeGame({
						id: 1,
						sport: "soccer",
						starts_at: "2020-06-15T18:00:00.000Z",
						my_showed_up: true,
						my_reputation_change: 5,
					}),
					makeGame({
						id: 2,
						sport: "basketball",
						starts_at: "2020-06-16T18:00:00.000Z",
						my_showed_up: false,
						my_reputation_change: -2,
					}),
					makeGame({
						id: 3,
						sport: "tennis",
						starts_at: "2020-06-17T18:00:00.000Z",
						my_showed_up: null,
						my_reputation_change: null,
					}),
					makeGame({
						id: 4,
						sport: "volleyball",
						starts_at: "2020-06-18T18:00:00.000Z",
						my_showed_up: true,
						my_reputation_change: 0,
					}),
					makeGame({
						id: 5,
						sport: "future",
						starts_at: "2999-06-15T18:00:00.000Z",
						my_showed_up: true,
					}),
				],
				hosting: [
					makeGame({
						id: 6,
						host_id: 5,
						sport: "hockey",
						starts_at: "2020-06-19T18:00:00.000Z",
						status: GameStatus.Played,
						marked_count: 3,
						showed_up_count: 2,
					}),
					makeGame({
						id: 7,
						host_id: 5,
						sport: "future hosted",
						starts_at: "2999-06-15T18:00:00.000Z",
					}),
				],
			}),
			status: 200,
		});

		const { getAllByText, getByText, queryByText } = await render(<ProfileScreen {...params} />);

		await waitFor(() => expect(getByText("PLAYED GAMES")).toBeTruthy());
		expect(getByText("Test Person")).toBeTruthy();
		expect(getByText("80 ★")).toBeTruthy();
		expect(getByText("2 played • 1 no-show")).toBeTruthy();
		expect(getByText("1 hosted")).toBeTruthy();
		expect(getAllByText("Showed Up")).toHaveLength(2);
		expect(getByText("No-show")).toBeTruthy();
		expect(getAllByText("Unknown")).toHaveLength(2);
		expect(getByText("No change")).toBeTruthy();
		expect(getByText("Played")).toBeTruthy();
		expect(getByText("2/3 showed up")).toBeTruthy();
		expect(queryByText("Future game")).toBeNull();
		expect(queryByText("Future hosted game")).toBeNull();

		await fireEvent.press(getByText("Tennis game"));
		expect(mockNavigation.navigate).toHaveBeenCalledWith("GameDetails", { gameId: 3 });
		await fireEvent.press(getByText("Logout"));

		expect(mockContextLogout).toHaveBeenCalledTimes(1);
		expect(mockNavigation.dispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "RESET",
				payload: {
					index: 1,
					routes: [{ name: "Splash" }, { name: "Login" }],
				},
			}),
		);
	});

	it("shows zero attendance counts when there are no past games", async () => {
		mockApi.getMyGames.mockResolvedValue({ ok: true, data: makeMyGames(), status: 200 });

		const { findByText } = await render(<ProfileScreen {...params} />);

		expect(await findByText("0 played • 0 no-show")).toBeTruthy();
		expect(await findByText("0 hosted")).toBeTruthy();
	});
});
