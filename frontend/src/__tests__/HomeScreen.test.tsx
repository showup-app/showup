import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { HomeScreen } from "../screens/HomeScreen";
import { getTestTabParams, makeGame, makeMyGames, mockApi, mockNavigation, mockUserContext } from "./utils/mocks";
import { GameStatus } from "../types/game";

describe("HomeScreen", () => {
	const params = getTestTabParams("Home");

	const relativeGame = (id: number, offsetDays: number, status = GameStatus.Open) =>
		makeGame({
			id,
			starts_at: new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000).toISOString(),
			status,
		});

	it("loads upcoming games, attendance items, badges, and opens game screens", async () => {
		mockUserContext.user = { id: 99, email: "host@example.com", name: "Host", reputation: 80 };
		let resolveGames: ((result: Awaited<ReturnType<typeof mockApi.getMyGames>>) => void) | undefined;
		mockApi.getMyGames.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveGames = resolve;
				}),
		);
		const { getByText, getAllByText, findByText } = await render(<HomeScreen {...params} />);

		expect(getByText("Loading your games…")).toBeTruthy();
		await act(async () => {
			resolveGames?.({
				ok: true,
				data: makeMyGames({
					hosting: [
						relativeGame(1, -1),
						relativeGame(2, -8),
						relativeGame(3, -1, GameStatus.Cancelled),
						relativeGame(4, -1, GameStatus.Played),
						relativeGame(5, 1),
						relativeGame(8, 3),
					],
					joined: [relativeGame(6, 2), relativeGame(7, -1)],
				}),
				status: 200,
			});
		});
		expect(await findByText("Needs attendance")).toBeTruthy();
		expect(getByText("Hosting")).toBeTruthy();
		expect(getByText("Joined")).toBeTruthy();
		expect(mockApi.getMyGames).toHaveBeenCalledWith("test-token", true);
		expect(mockNavigation.setOptions).toHaveBeenCalledWith(expect.objectContaining({ tabBarBadge: 1 }));

		await fireEvent.press(getByText("Mark attendance"));
		expect(mockNavigation.navigate).toHaveBeenCalledWith("Attendance", { gameId: 1 });
		await fireEvent.press(getAllByText("See players")[0]);
		expect(mockNavigation.navigate).toHaveBeenCalledWith("GameDetails", { gameId: 5 });
	});

	it("shows an API error and retries loading", async () => {
		mockApi.getMyGames
			.mockResolvedValueOnce({ ok: false, data: null, status: 500, error: "Games unavailable" })
			.mockResolvedValueOnce({ ok: true, data: makeMyGames(), status: 200 });
		const { getByText, findByText } = await render(<HomeScreen {...params} />);

		expect(await findByText("Games unavailable")).toBeTruthy();
		await fireEvent.press(getByText("Try again"));
		await waitFor(() => expect(mockApi.getMyGames).toHaveBeenCalledTimes(2));
	});
});
