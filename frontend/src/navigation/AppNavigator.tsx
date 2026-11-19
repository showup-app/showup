import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AppStackParamList } from "./types";
import { stackScreenOptions } from "./options";
import { MainTabs } from "./MainTabs";
import { CreatePostScreen } from "../screens/CreatePostScreen";
import ConfirmPostScreen from "../screens/ConfirmPostScreen";
import GameDetailsScreen from "../screens/GameDetailsScreen";
import AttendanceScreen from "../screens/AttendanceScreen";

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppNavigator() {
	return (
		<Stack.Navigator initialRouteName="Tabs" screenOptions={stackScreenOptions}>
			<Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
			<Stack.Screen
				name="CreatePost"
				component={CreatePostScreen}
				options={({ route }) => ({ title: route.params?.edit ? "Edit game" : "Create a post" })}
			/>
			<Stack.Screen name="ConfirmPost" component={ConfirmPostScreen} options={{ title: "Confirm post" }} />
			<Stack.Screen name="GameDetails" component={GameDetailsScreen} options={{ title: "Game details" }} />
			<Stack.Screen name="Attendance" component={AttendanceScreen} options={{ title: "Mark attendance" }} />
		</Stack.Navigator>
	);
}
