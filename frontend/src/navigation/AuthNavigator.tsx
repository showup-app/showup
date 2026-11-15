import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthStackParamList } from "./types";
import { stackScreenOptions } from "./options";
import RegisterScreen from "../screens/RegisterScreen";
import SplashScreen from "../screens/SplashScreen";
import LoginScreen from "../screens/LoginScreen";

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
	return (
		<Stack.Navigator initialRouteName="Splash" screenOptions={stackScreenOptions}>
			<Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
			<Stack.Screen name="Login" component={LoginScreen} options={{ title: "Login" }} />
			<Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Register" }} />
		</Stack.Navigator>
	);
}
