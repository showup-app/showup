import type { ComponentProps } from "react";
import { AppScreenProps, AppStackParamList, MainTabParamList, TabScreenProps } from "../../navigation/types";
import { api } from "../../services/api";
import { User } from "../../types/auth";
import { Game, GameDetail, GameStatus, MyGames } from "../../types/game";

// Prevent Jest warning when running tests
Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
	configurable: true,
	get: () => true,
	set: () => {},
});

beforeEach(() => {
	jest.clearAllMocks();
	process.env.EXPO_PUBLIC_API_URL = "https://example.com";
	mockUserContext.user = null;
	mockUserContext.token = "test-token";
	mockContextLogout.mockReset();
});

jest.mock("@react-navigation/native", () => {
	const actualNav = jest.requireActual<typeof import("@react-navigation/native")>("@react-navigation/native");
	const { theme } = jest.requireActual<typeof import("../../theme/index")>("../../theme/index");

	return {
		...actualNav,
		useFocusEffect: (callback: () => void) => {
			const React = jest.requireActual<typeof import("react")>("react");
			React.useEffect(callback, [callback]);
		},
		useTheme: () => theme,
	};
});

jest.mock("@expo/vector-icons", () => {
	const { Pressable } = jest.requireActual<typeof import("react-native")>("react-native");

	return {
		MaterialCommunityIcons: ({
			name: _name,
			size: _size,
			color: _color,
			...props
		}: ComponentProps<typeof import("@expo/vector-icons").MaterialCommunityIcons>) => <Pressable {...props} />,
	};
});

jest.mock("react-native/Libraries/Lists/FlatList", () => {
	const React = jest.requireActual<typeof import("react")>("react");
	const { View } = jest.requireActual<typeof import("react-native")>("react-native");

	type MockFlatListProps = {
		data?: readonly unknown[] | null;
		renderItem: (info: { item: unknown; index: number }) => React.ReactNode;
		keyExtractor?: (item: unknown, index: number) => string;
		ListHeaderComponent?: React.ReactNode | React.ComponentType;
		ListFooterComponent?: React.ReactNode | React.ComponentType;
		ListEmptyComponent?: React.ReactNode | React.ComponentType;
		refreshControl?: React.ReactNode;
	};

	const renderListComponent = (component: MockFlatListProps["ListHeaderComponent"]) =>
		typeof component === "function" ? React.createElement(component) : component;

	const MockFlatList = ({
		data,
		renderItem,
		keyExtractor,
		ListHeaderComponent,
		ListFooterComponent,
		ListEmptyComponent,
		refreshControl,
	}: MockFlatListProps) => {
		const items = data ?? [];

		return (
			<View>
				{refreshControl}
				{renderListComponent(ListHeaderComponent)}
				{items.length === 0
					? renderListComponent(ListEmptyComponent)
					: items.map((item, index) => (
							<React.Fragment key={keyExtractor?.(item, index) ?? String(index)}>
								{renderItem({ item, index })}
							</React.Fragment>
						))}
				{renderListComponent(ListFooterComponent)}
			</View>
		);
	};

	return { __esModule: true, default: MockFlatList };
});

jest.mock("react-native/Libraries/Components/RefreshControl/RefreshControl", () => {
	const { Text, View } = jest.requireActual<typeof import("react-native")>("react-native");

	return {
		__esModule: true,
		default: ({ onRefresh }: { onRefresh?: () => void }) => (
			<View>
				<Text testID="refresh-control" onPress={onRefresh}>
					Refresh
				</Text>
			</View>
		),
	};
});

export const mockContextLogin = jest.fn();
export const mockContextLogout = jest.fn();
export const mockUserContext: { user: User | null; token: string | null } = {
	user: null,
	token: "test-token",
};

jest.mock("../../context/UserContext", () => ({
	useUser: () => ({ ...mockUserContext, login: mockContextLogin, logout: mockContextLogout }),
}));

jest.mock("../../services/api");

export const mockApi = jest.mocked(api);
export const makeGame = (overrides: Partial<Game> = {}): Game => ({
	id: 1,
	host_id: 99,
	sport: "soccer",
	venue: "Community Centre",
	address: "100 Main St, Burnaby",
	starts_at: "2027-06-15T18:00:00.000Z",
	duration_minutes: 90,
	spots: 10,
	cost: 0,
	min_reputation: 0,
	fallback_min_reputation: null,
	fallback_hours_before_start: null,
	status: GameStatus.Open,
	updated_at: "2027-06-01T10:00:00.000Z",
	joined: false,
	effective_min_reputation: 0,
	marked_count: 0,
	showed_up_count: 0,
	my_showed_up: null,
	my_reputation_change: null,
	...overrides,
});

export const makeGameDetail = (overrides: Partial<GameDetail> = {}): GameDetail => ({
	...makeGame(overrides),
	host_name: "Host Person",
	host_reputation: 90,
	players: [{ id: 2, name: "Player One", reputation: 80, games_played: 4, is_new: false, showed_up: undefined }],
	spots_left: 9,
	...overrides,
});

export const makeMyGames = (overrides: Partial<MyGames> = {}): MyGames => ({
	hosting: [],
	joined: [],
	...overrides,
});

jest.mock("../../components/form/DateTimeChip", () => {
	const { Pressable, Text } = jest.requireActual<typeof import("react-native")>("react-native");

	const MockDateTimeChip = ({ mode, onChange }: { mode: "date" | "time"; onChange: (date: Date) => void }) => (
		<Pressable
			testID={`test-${mode}-picker`}
			onPress={() =>
				onChange(new Date(mode === "date" ? "2027-06-20T18:00:00.000Z" : "2027-06-15T20:30:00.000Z"))
			}
		>
			<Text>Test {mode}</Text>
		</Pressable>
	);
	MockDateTimeChip.displayName = "MockDateTimeChip";
	return MockDateTimeChip;
});

export const mockNavigation = {
	replace: jest.fn(),
	navigate: jest.fn(),
	goBack: jest.fn(),
	dispatch: jest.fn(),
	setOptions: jest.fn(),
};

export const getTestScreenParams = <T extends keyof AppStackParamList>(
	screenName: T,
	routeParams?: AppStackParamList[T],
) => {
	return {
		navigation: mockNavigation as unknown as AppScreenProps<T>["navigation"],
		route: {
			key: `${screenName}-route`,
			name: screenName,
			...(routeParams === undefined ? {} : { params: routeParams }),
		} as AppScreenProps<T>["route"],
	};
};

export const getTestTabParams = <T extends keyof MainTabParamList>(screenName: T) => ({
	navigation: mockNavigation as unknown as TabScreenProps<T>["navigation"],
	route: {
		key: `${screenName}-route`,
		name: screenName,
	} as TabScreenProps<T>["route"],
});
