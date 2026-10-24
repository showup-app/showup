import { AppScreenProps, AppStackParamList } from "../../navigation/types";
import { api } from "../../services/api";

beforeEach(() => {
	jest.clearAllMocks();
	process.env.EXPO_PUBLIC_API_URL = "https://example.com";
});

jest.mock("@react-navigation/native", () => ({
	...jest.requireActual("@react-navigation/native"),
	useTheme: () => ({
		colors: {
			background: "#ffffff",
			text: "#000000",
			textMuted: "#666666",
			textSecondary: "#333333",
		},
	}),
}));

export const mockContextLogin = jest.fn();

jest.mock("../../context/UserContext", () => ({
	useUser: () => ({ login: mockContextLogin }),
}));

jest.mock("../../services/api");

export const mockApi = jest.mocked(api);

export const mockNavigation = {
	replace: jest.fn(),
	navigate: jest.fn(),
};

export const getTestScreenParams = <T extends keyof AppStackParamList>(screenName: T) => {
	return {
		navigation: mockNavigation as unknown as AppScreenProps<T>["navigation"],
		route: {
			key: `${screenName}-route`,
			name: screenName,
		} as AppScreenProps<T>["route"],
	};
};
