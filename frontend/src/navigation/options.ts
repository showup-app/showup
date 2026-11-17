import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { theme } from "../theme";

export const stackScreenOptions: NativeStackNavigationOptions = {
	headerStyle: { backgroundColor: theme.colors.chrome },
	headerShadowVisible: true,
	headerTitleStyle: { fontSize: theme.fontSize.lg, fontWeight: "600" },
	headerTintColor: theme.colors.text,
	headerBackButtonDisplayMode: "minimal",
	contentStyle: { backgroundColor: theme.colors.background },
};
