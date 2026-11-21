import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import SplashScreen from "../screens/SplashScreen";
import { getTestScreenParams, mockNavigation } from "./utils/mocks";

describe("SplashScreen", () => {
	const params = getTestScreenParams("Splash");

	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("correctly displays the screen content", async () => {
		const { findByText } = await render(<SplashScreen {...params} />);

		await act(async () => {
			jest.runAllTimers();
		});

		await waitFor(async () => {
			expect(await findByText("ShowUp")).toBeTruthy();
			expect(await findByText("Sports events you can count on")).toBeTruthy();
			expect(await findByText("Login")).toBeTruthy();
			expect(await findByText("Register")).toBeTruthy();
		});
	});

	it("correctly navigates to the login/register pages", async () => {
		const { findByText } = await render(<SplashScreen {...params} />);

		await act(async () => {
			jest.runAllTimers();
		});

		await fireEvent.press(await findByText("Login"));
		await waitFor(async () => {
			expect(mockNavigation.navigate).toHaveBeenCalled();
		});
		await fireEvent.press(await findByText("Register"));
		await waitFor(async () => {
			expect(mockNavigation.navigate).toHaveBeenCalled();
		});
	});
});
