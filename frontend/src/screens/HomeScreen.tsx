import { PlaceholderScreen, NavButton } from "../components/ui/PlaceholderScreen";
import { TabScreenProps } from "../navigation/types";

export function HomeScreen({ navigation }: TabScreenProps<"Home">) {
	return (
		<PlaceholderScreen title="Home">
			<NavButton label="Create a game" onPress={() => navigation.navigate("CreatePost")} />
			<NavButton label="Open a game" onPress={() => navigation.navigate("GameDetails", { gameId: 10 })} />
		</PlaceholderScreen>
	);
}
