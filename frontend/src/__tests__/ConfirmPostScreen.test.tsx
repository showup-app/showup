import { fireEvent, render, waitFor } from "@testing-library/react-native";
import ConfirmPostScreen from "../screens/ConfirmPostScreen";
import { getTestScreenParams, makeGame, mockApi, mockNavigation } from "./utils/mocks";

describe("ConfirmPostScreen", () => {
	const params = getTestScreenParams("ConfirmPost");
	const draft = {
		sport: "soccer",
		venue: "Community Centre",
		address: "100 Main St, Burnaby",
		starts_at: "2027-06-15T18:00:00.000Z",
		duration_minutes: 90,
		spots: 10,
		cost: 0,
		min_reputation: 0,
	};

	it("shows the draft and returns to editing", async () => {
		const { getByText } = await render(
			<ConfirmPostScreen {...params} route={{ ...params.route, params: { draft } }} />,
		);

		expect(getByText("Soccer game")).toBeTruthy();
		await fireEvent.press(getByText("Edit"));
		expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
	});

	it("creates the game and resets navigation to its details", async () => {
		mockApi.createGame.mockResolvedValue({ ok: true, data: makeGame({ id: 42 }), status: 201 });
		const { getByText } = await render(
			<ConfirmPostScreen {...params} route={{ ...params.route, params: { draft } }} />,
		);

		await fireEvent.press(getByText("Post game"));
		await waitFor(() => {
			expect(mockApi.createGame).toHaveBeenCalledWith(draft, "test-token");
			expect(mockNavigation.dispatch).toHaveBeenCalledWith(
				expect.objectContaining({
					payload: {
						index: 1,
						routes: [
							{ name: "Tabs", params: { screen: "Home" } },
							{ name: "GameDetails", params: { gameId: 42 } },
						],
					},
					type: "RESET",
				}),
			);
		});
	});

	it("shows an API error and keeps the confirmation screen open", async () => {
		mockApi.createGame.mockResolvedValue({
			ok: false,
			data: null,
			status: 500,
			error: "Unable to post game",
		});
		const { getByText, findByText } = await render(
			<ConfirmPostScreen {...params} route={{ ...params.route, params: { draft } }} />,
		);

		await fireEvent.press(getByText("Post game"));
		expect(await findByText("Unable to post game")).toBeTruthy();
		expect(mockNavigation.dispatch).not.toHaveBeenCalled();
	});
});
