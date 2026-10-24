import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { theme } from "../theme";

export const stackScreenOptions: NativeStackNavigationOptions = {
	headerStyle: { backgroundColor: theme.colors.background },
	headerTintColor: theme.colors.text,
	headerShadowVisible: false,
	contentStyle: { backgroundColor: theme.colors.background },
};
