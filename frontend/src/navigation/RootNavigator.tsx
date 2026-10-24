import { NavigationContainer } from "@react-navigation/native";
import { AppNavigator } from "./AppNavigator";
import { theme } from "../theme";

export function RootNavigator() {
	return (
		<NavigationContainer theme={theme}>
			<AppNavigator />
		</NavigationContainer>
	);
}
