import { fireEvent, render, waitFor } from "@testing-library/react-native";
import LoginScreen from "../screens/LoginScreen";
import { getTestScreenParams, mockApi, mockContextLogin, mockNavigation } from "./utils/mocks";

describe("LoginScreen", () => {
	const params = getTestScreenParams("Login");

	it("renders the login form", async () => {
		const { getByText, getByPlaceholderText, getAllByText } = await render(<LoginScreen {...params} />);

		expect(getByText("Enter your email and password to log in")).toBeTruthy();
		expect(getByPlaceholderText("Email")).toBeTruthy();
		expect(getByPlaceholderText("Password")).toBeTruthy();
		expect(getAllByText("Login")).toHaveLength(2);
	});

	it("shows required-field errors without calling the API", async () => {
		const { findByText, getAllByText } = await render(<LoginScreen {...params} />);

		await fireEvent.press(getAllByText("Login")[1]);

		expect(await findByText("Email is required.")).toBeTruthy();
		expect(await findByText("Password is required.")).toBeTruthy();
		expect(mockApi.login).not.toHaveBeenCalled();
	});

	it("logs in, loads the user, and navigates to the home tab", async () => {
		const user = {
			id: 1,
			email: "person@example.com",
			name: "Test Person",
			reputation: 0,
		};
		mockApi.login.mockResolvedValue({
			ok: true,
			data: { access_token: "access-token", token_type: "bearer" },
			status: 200,
		});
		mockApi.me.mockResolvedValue({
			ok: true,
			data: user,
			status: 200,
		});
		const { getByPlaceholderText, getAllByText } = await render(<LoginScreen {...params} />);

		await fireEvent.changeText(getByPlaceholderText("Email"), "person@example.com");
		await fireEvent.changeText(getByPlaceholderText("Password"), "secret123");
		await fireEvent.press(getAllByText("Login")[1]);

		await waitFor(() => {
			expect(mockApi.login).toHaveBeenCalledWith({
				email: "person@example.com",
				password: "secret123",
			});
			expect(mockApi.me).toHaveBeenCalledWith("access-token");
			expect(mockContextLogin).toHaveBeenCalledWith(user, "access-token");
			expect(mockNavigation.replace).toHaveBeenCalledWith("Tabs", {
				screen: "Home",
			});
		});
	});

	it("shows an API login error", async () => {
		mockApi.login.mockResolvedValue({
			ok: false,
			data: null,
			status: 401,
			error: "Invalid email or password",
		});
		const { getByPlaceholderText, getAllByText, findByText } = await render(<LoginScreen {...params} />);

		await fireEvent.changeText(getByPlaceholderText("Email"), "person@example.com");
		await fireEvent.changeText(getByPlaceholderText("Password"), "wrong");
		await fireEvent.press(getAllByText("Login")[1]);

		expect(await findByText("Invalid email or password")).toBeTruthy();
		expect(mockApi.me).not.toHaveBeenCalled();
		expect(mockContextLogin).not.toHaveBeenCalled();
		expect(mockNavigation.replace).not.toHaveBeenCalled();
	});

	it("shows an error when loading the user fails", async () => {
		mockApi.login.mockResolvedValue({
			ok: true,
			data: { access_token: "access-token", token_type: "bearer" },
			status: 200,
		});
		mockApi.me.mockResolvedValue({
			ok: false,
			data: null,
			status: 500,
			error: "Unable to load account",
		});
		const { getByPlaceholderText, getAllByText, findByText } = await render(<LoginScreen {...params} />);

		await fireEvent.changeText(getByPlaceholderText("Email"), "person@example.com");
		await fireEvent.changeText(getByPlaceholderText("Password"), "secret123");
		await fireEvent.press(getAllByText("Login")[1]);

		expect(await findByText("Unable to load account")).toBeTruthy();
		expect(mockContextLogin).not.toHaveBeenCalled();
		expect(mockNavigation.replace).not.toHaveBeenCalled();
	});
});
