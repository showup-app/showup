import { NavigationContainer } from "@react-navigation/native";
import { AppNavigator } from "./AppNavigator";
import { theme } from "../theme";
import { useUser } from "../context/UserContext";
import { AuthNavigator } from "./AuthNavigator";

export function RootNavigator() {
	const { token } = useUser();

	return (
		<NavigationContainer theme={theme}>{token !== null ? <AppNavigator /> : <AuthNavigator />}</NavigationContainer>
	);
}
