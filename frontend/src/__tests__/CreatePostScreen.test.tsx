import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { Platform } from "react-native";
import { CreatePostScreen } from "../screens/CreatePostScreen";
import { getTestScreenParams, makeGame, mockApi, mockNavigation, mockUserContext } from "./utils/mocks";

describe("CreatePostScreen", () => {
	const params = getTestScreenParams("CreatePost");
	const submit = (press: () => Promise<void>) => act(press);

	it("validates the required fields and venue/address length limits", async () => {
		const { getByText, getByPlaceholderText, findByText } = await render(<CreatePostScreen {...params} />);

		await submit(() => fireEvent.press(getByText("Next")));
		expect(await findByText("Pick a sport")).toBeTruthy();
		expect(await findByText("Add where you're playing")).toBeTruthy();
		expect(await findByText("Add the address")).toBeTruthy();

		await fireEvent.press(getByText("Basketball"));
		await fireEvent.press(getByText("Free"));
		await fireEvent.changeText(getByPlaceholderText("BCIT Building SE16"), "v".repeat(201));
		await fireEvent.changeText(getByPlaceholderText("3700 Willingdon Ave, Burnaby"), "a".repeat(301));
		await submit(() => fireEvent.press(getByText("Next")));
		expect(await findByText("Keep it under 200 characters")).toBeTruthy();
		expect(await findByText("Keep it under 300 characters")).toBeTruthy();
		expect(mockNavigation.navigate).not.toHaveBeenCalled();
	});

	it("creates a free game draft with selected date, time, duration, spots, and reputation", async () => {
		const { getByText, getByPlaceholderText, getByTestId } = await render(<CreatePostScreen {...params} />);

		await fireEvent.press(getByText("Basketball"));
		await fireEvent.changeText(getByPlaceholderText("BCIT Building SE16"), "  Gym  ");
		await fireEvent.changeText(getByPlaceholderText("3700 Willingdon Ave, Burnaby"), "  10 Main St  ");
		await fireEvent.press(getByTestId("test-date-picker"));
		await fireEvent.press(getByTestId("test-time-picker"));
		await fireEvent.press(getByText("2 hr"));
		await fireEvent.press(getByText("80+"));
		await submit(() => fireEvent.press(getByText("Next")));

		await waitFor(() => {
			expect(mockNavigation.navigate).toHaveBeenCalledWith(
				"ConfirmPost",
				expect.objectContaining({
					draft: expect.objectContaining({
						sport: "basketball",
						venue: "Gym",
						address: "10 Main St",
						starts_at: expect.any(String),
						duration_minutes: 120,
						spots: 10,
						cost: 0,
						min_reputation: 80,
					}),
				}),
			);
		});
		const draft = mockNavigation.navigate.mock.calls[0][1] as { draft: { starts_at: string } };
		expect(new Date(draft.draft.starts_at).toISOString()).toContain("2027-06-20");
	});

	it("validates a paid game's price and submits a valid amount", async () => {
		const { getByText, getByPlaceholderText, findByText } = await render(<CreatePostScreen {...params} />);

		await fireEvent.press(getByText("Soccer"));
		await fireEvent.changeText(getByPlaceholderText("BCIT Building SE16"), "Field");
		await fireEvent.changeText(getByPlaceholderText("3700 Willingdon Ave, Burnaby"), "1 Main St");
		await fireEvent.press(getByText("Set price"));
		const price = getByPlaceholderText("5.00");

		await fireEvent.changeText(price, "free");
		await submit(() => fireEvent.press(getByText("Next")));
		expect(await findByText("Enter a price like 5 or 4.50")).toBeTruthy();

		await fireEvent.changeText(price, "0");
		await submit(() => fireEvent.press(getByText("Next")));
		expect(await findByText("Enter a price above $0, or choose Free")).toBeTruthy();

		await fireEvent.changeText(price, "10000");
		await submit(() => fireEvent.press(getByText("Next")));
		expect(await findByText("That's too high")).toBeTruthy();

		await fireEvent.changeText(price, "4.50");
		await submit(() => fireEvent.press(getByText("Next")));
		await waitFor(() => {
			expect(mockNavigation.navigate).toHaveBeenCalledWith(
				"ConfirmPost",
				expect.objectContaining({ draft: expect.objectContaining({ cost: 4.5 }) }),
			);
		});
	});

	it("loads edit values and asks the user to log in before saving without a token", async () => {
		mockUserContext.token = null;
		const edit = {
			gameId: 7,
			minSpots: 4,
			values: {
				sport: "soccer",
				venue: "Field",
				address: "1 Main St",
				starts_at: "2027-06-15T18:00:00.000Z",
				duration_minutes: 90,
				spots: 10,
				cost: 0,
				min_reputation: 0,
			},
		};
		const { getByText, findByText, getByPlaceholderText } = await render(
			<CreatePostScreen {...params} route={{ ...params.route, params: { edit } }} />,
		);

		expect(getByText("Not counting you · 4 already joined")).toBeTruthy();
		expect(getByPlaceholderText("BCIT Building SE16").props.value).toBe("Field");
		await submit(() => fireEvent.press(getByText("Save changes")));
		expect(await findByText("Please log in again to save your changes")).toBeTruthy();
		expect(mockApi.updateGame).not.toHaveBeenCalled();
	});

	it("updates a paid game and returns to the details screen on success", async () => {
		const edit = {
			gameId: 7,
			minSpots: 2,
			values: {
				sport: "tennis",
				venue: "Court",
				address: "2 Main St",
				starts_at: "2027-06-15T18:00:00.000Z",
				duration_minutes: 60,
				spots: 4,
				cost: 5.5,
				min_reputation: 70,
			},
		};
		mockApi.updateGame.mockResolvedValue({ ok: true, data: makeGame({ id: 7 }), status: 200 });
		const { getByText, getByPlaceholderText } = await render(
			<CreatePostScreen {...params} route={{ ...params.route, params: { edit } }} />,
		);

		await fireEvent.changeText(getByPlaceholderText("BCIT Building SE16"), "Updated Court");
		await submit(() => fireEvent.press(getByText("Save changes")));
		await waitFor(() => {
			expect(mockApi.updateGame).toHaveBeenCalledWith(
				7,
				expect.objectContaining({
					sport: "tennis",
					venue: "Updated Court",
					cost: 5.5,
				}),
				"test-token",
			);
			expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
		});
	});

	it("shows a failed update error and stays on the form", async () => {
		const edit = {
			gameId: 8,
			minSpots: 2,
			values: {
				sport: "soccer",
				venue: "Field",
				address: "1 Main St",
				starts_at: "2027-06-15T18:00:00.000Z",
				duration_minutes: 90,
				spots: 5,
				cost: 0,
				min_reputation: 0,
			},
		};
		mockApi.updateGame.mockResolvedValue({
			ok: false,
			data: null,
			status: 500,
			error: "Unable to update game",
		});
		const { getByText, findByText } = await render(
			<CreatePostScreen {...params} route={{ ...params.route, params: { edit } }} />,
		);

		await submit(() => fireEvent.press(getByText("Save changes")));
		expect(await findByText("Unable to update game")).toBeTruthy();
		expect(mockNavigation.goBack).not.toHaveBeenCalled();
	});

	it("shows saving feedback while an edit is being persisted", async () => {
		const edit = {
			gameId: 10,
			minSpots: 2,
			values: {
				sport: "soccer",
				venue: "Field",
				address: "1 Main St",
				starts_at: "2027-06-15T18:00:00.000Z",
				duration_minutes: 90,
				spots: 5,
				cost: 0,
				min_reputation: 0,
			},
		};
		let resolveUpdate: ((result: Awaited<ReturnType<typeof mockApi.updateGame>>) => void) | undefined;
		let notifyUpdateStarted: (() => void) | undefined;
		const updateStarted = new Promise<void>((resolve) => {
			notifyUpdateStarted = resolve;
		});
		mockApi.updateGame.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveUpdate = resolve;
					notifyUpdateStarted?.();
				}),
		);
		const { getByText, findByText } = await render(
			<CreatePostScreen {...params} route={{ ...params.route, params: { edit } }} />,
		);

		let savePress: Promise<void>;
		await act(async () => {
			savePress = fireEvent.press(getByText("Save changes"));
			await updateStarted;
		});
		expect(await findByText("Saving...")).toBeTruthy();
		await act(async () => {
			resolveUpdate?.({ ok: true, data: makeGame({ id: 10 }), status: 200 });
			await savePress;
		});
		await waitFor(() => expect(mockNavigation.goBack).toHaveBeenCalled());
	});

	it("validates an edit scheduled in the past", async () => {
		const edit = {
			gameId: 9,
			minSpots: 2,
			values: {
				sport: "soccer",
				venue: "Field",
				address: "1 Main St",
				starts_at: "2020-06-15T18:00:00.000Z",
				duration_minutes: 90,
				spots: 5,
				cost: 0,
				min_reputation: 0,
			},
		};
		const { getByText, findByText } = await render(
			<CreatePostScreen {...params} route={{ ...params.route, params: { edit } }} />,
		);

		await submit(() => fireEvent.press(getByText("Save changes")));
		expect(await findByText("Pick a time in the future")).toBeTruthy();
		expect(mockApi.updateGame).not.toHaveBeenCalled();
	});

	it("uses iOS keyboard avoidance behavior", async () => {
		const descriptor = Object.getOwnPropertyDescriptor(Platform, "OS");
		Object.defineProperty(Platform, "OS", { configurable: true, value: "ios" });
		try {
			const view = await render(<CreatePostScreen {...params} />);
			expect(view.getByText("Next")).toBeTruthy();
		} finally {
			if (descriptor) Object.defineProperty(Platform, "OS", descriptor);
		}
	});
});
