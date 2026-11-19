// Portions of this file were generated with AI assistance (GitHub Copilot) and human-reviewed afterwards
import { fireEvent, render } from "@testing-library/react-native";
import PlayerCard from "../components/game/PlayerCard";

describe("PlayerCard", () => {
	const player = {
		id: 42,
		name: "Test Player",
		reputation: 87,
		games_played: 12,
		is_new: false,
	};

	it("shows the player's name and reputation without a remove action", async () => {
		const { getByText, queryByTestId } = await render(<PlayerCard player={player} />);

		expect(getByText("Test Player")).toBeTruthy();
		expect(getByText("★ 87")).toBeTruthy();
		expect(queryByTestId("remove-player-42")).toBeNull();
	});

	it("calls the remove action when the enabled button is pressed", async () => {
		const onPress = jest.fn();
		const { getByTestId } = await render(<PlayerCard player={player} onPress={onPress} />);
		const removeButton = getByTestId("remove-player-42");

		expect(removeButton.props.accessibilityLabel).toBe("Remove Test Player");
		await fireEvent.press(removeButton);
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	it("renders the remove button disabled when requested", async () => {
		const onPress = jest.fn();
		const { getByTestId } = await render(<PlayerCard player={player} onPress={onPress} isDisabled />);
		const removeButton = getByTestId("remove-player-42");

		await fireEvent.press(removeButton);
		expect(onPress).not.toHaveBeenCalled();
	});
});
