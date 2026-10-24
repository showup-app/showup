import {
	fireEvent,
	render,
	waitFor,
	type RenderResult,
} from "@testing-library/react-native";
import RegisterScreen from "../screens/RegisterScreen";
import { getTestScreenParams, mockApi, mockNavigation } from "./utils/mocks";

describe("RegisterScreen", () => {
	const params = getTestScreenParams("Register");

	const fillValidForm = async (
		getByPlaceholderText: RenderResult["getByPlaceholderText"],
	) => {
		await fireEvent.changeText(
			getByPlaceholderText("Email"),
			"person@example.com",
		);
		await fireEvent.changeText(
			getByPlaceholderText("Full Name"),
			"Test Person",
		);
		await fireEvent.changeText(
			getByPlaceholderText("Password"),
			"secret123",
		);
		await fireEvent.changeText(
			getByPlaceholderText("Confirm Password"),
			"secret123",
		);
	};

	it("renders the registration form and login link", async () => {
		const { getByText, getByPlaceholderText, getAllByText } = await render(
			<RegisterScreen {...params} />,
		);

		expect(
			getByText("Create an account to start hosting and joining games"),
		).toBeTruthy();
		expect(getByPlaceholderText("Email")).toBeTruthy();
		expect(getByPlaceholderText("Full Name")).toBeTruthy();
		expect(getByPlaceholderText("Password")).toBeTruthy();
		expect(getByPlaceholderText("Confirm Password")).toBeTruthy();
		expect(getAllByText("Register")).toHaveLength(2);
		expect(getByText("Log In")).toBeTruthy();
	});

	it("validates required fields, email format, password length, and confirmation", async () => {
		const { getByPlaceholderText, getAllByText, findByText } = await render(
			<RegisterScreen {...params} />,
		);

		await fireEvent.press(getAllByText("Register")[1]);
		expect(await findByText("Email is required")).toBeTruthy();
		expect(await findByText("Name is required")).toBeTruthy();
		expect(await findByText("Password is required")).toBeTruthy();
		expect(await findByText("Confirm Password is required")).toBeTruthy();

		await fireEvent.changeText(
			getByPlaceholderText("Email"),
			"not-an-email",
		);
		await fireEvent.changeText(
			getByPlaceholderText("Full Name"),
			"Test Person",
		);
		await fireEvent.changeText(getByPlaceholderText("Password"), "short");
		await fireEvent.changeText(
			getByPlaceholderText("Confirm Password"),
			"different",
		);
		await fireEvent.press(getAllByText("Register")[1]);

		expect(
			await findByText("Email must be in the valid format"),
		).toBeTruthy();
		expect(
			await findByText("Password must be at least 8 characters long"),
		).toBeTruthy();
		expect(await findByText("Passwords must match")).toBeTruthy();
		expect(mockApi.register).not.toHaveBeenCalled();
	});

	it("submits only registration fields and navigates to login", async () => {
		mockApi.register.mockResolvedValue({
			ok: true,
			data: {
				id: 1,
				email: "person@example.com",
				name: "Test Person",
				reputation: 0,
			},
			status: 201,
		});
		const { getByPlaceholderText, getAllByText } = await render(
			<RegisterScreen {...params} />,
		);

		await fillValidForm(getByPlaceholderText);
		await fireEvent.press(getAllByText("Register")[1]);

		await waitFor(() => {
			expect(mockApi.register).toHaveBeenCalledWith({
				email: "person@example.com",
				name: "Test Person",
				password: "secret123",
			});
			expect(mockNavigation.replace).toHaveBeenCalledWith("Login");
		});
	});

	it("shows an email-specific error when the address is already registered", async () => {
		mockApi.register.mockResolvedValue({
			ok: false,
			data: null,
			status: 409,
			error: "Conflict",
		});
		const { getByPlaceholderText, getAllByText, findByText } = await render(
			<RegisterScreen {...params} />,
		);

		await fillValidForm(getByPlaceholderText);
		await fireEvent.press(getAllByText("Register")[1]);

		expect(
			await findByText(
				"This email is already in use by a registered user",
			),
		).toBeTruthy();
		expect(mockNavigation.replace).not.toHaveBeenCalled();
	});

	it("shows other registration API errors", async () => {
		mockApi.register.mockResolvedValue({
			ok: false,
			data: null,
			status: 500,
			error: "Registration is unavailable",
		});
		const { getByPlaceholderText, getAllByText, findByText } = await render(
			<RegisterScreen {...params} />,
		);

		await fillValidForm(getByPlaceholderText);
		await fireEvent.press(getAllByText("Register")[1]);

		expect(await findByText("Registration is unavailable")).toBeTruthy();
		expect(mockNavigation.replace).not.toHaveBeenCalled();
	});

	it("navigates to login from the existing-account link", async () => {
		const { getByText } = await render(<RegisterScreen {...params} />);

		await fireEvent.press(getByText("Log In"));

		expect(mockNavigation.navigate).toHaveBeenCalledWith("Login");
	});
});
