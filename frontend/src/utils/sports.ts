import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ComponentProps } from "react";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

const SPORT_ICONS: Record<string, IconName> = {
	basketball: "basketball",
	soccer: "soccer",
	volleyball: "volleyball",
	badminton: "badminton",
	tennis: "tennis",
	pickleball: "tennis-ball",
	ultimate: "disc",
	hockey: "hockey-sticks",
};

export function sportIcon(sport: string): IconName {
	return SPORT_ICONS[sport.toLowerCase()] ?? "run";
}