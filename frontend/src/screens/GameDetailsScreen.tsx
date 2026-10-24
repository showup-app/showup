import { PlaceholderScreen } from "../components/ui/PlaceholderScreen";
import { AppScreenProps } from "../navigation/types";

export function GameDetailsScreen({ route }: AppScreenProps<"GameDetails">) {
	return <PlaceholderScreen title={`Game ${route.params.gameId}`} />;
}
