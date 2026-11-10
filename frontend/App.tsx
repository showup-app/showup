import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { UserProvider } from "./src/context/UserContext";

export default function App() {
	return (
		<SafeAreaProvider>
			<UserProvider>
				<StatusBar style="light" />
				<RootNavigator />
			</UserProvider>
		</SafeAreaProvider>
	);
}
