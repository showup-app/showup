import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AppStackParamList } from "./types";
import { stackScreenOptions } from "./options";
import { MainTabs } from "./MainTabs";
import { SearchScreen } from "../screens/SearchScreen";
import { CreatePostScreen } from "../screens/CreatePostScreen";
import ConfirmPostScreen from "../screens/ConfirmPostScreen";
import GameDetailsScreen from "../screens/GameDetailsScreen";
import RegisterScreen from "../screens/RegisterScreen";
import SplashScreen from "../screens/SplashScreen";
import LoginScreen from "../screens/LoginScreen";
import AttendanceScreen from "../screens/AttendanceScreen";

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppNavigator() {
	return (
		<Stack.Navigator initialRouteName="Splash" screenOptions={stackScreenOptions}>
			<Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
			<Stack.Screen name="Login" component={LoginScreen} options={{ title: "Login" }} />
			<Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Register" }} />
			<Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
			<Stack.Screen name="Search" component={SearchScreen} />
			<Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ title: "Create a post" }} />
			<Stack.Screen name="ConfirmPost" component={ConfirmPostScreen} options={{ title: "Confirm post" }} />
			<Stack.Screen name="GameDetails" component={GameDetailsScreen} options={{ title: "Game details" }} />
			<Stack.Screen name="Attendance" component={AttendanceScreen} options={{ title: "Mark Attendance" }} />
		</Stack.Navigator>
	);
}
