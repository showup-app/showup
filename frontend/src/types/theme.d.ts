import "@react-navigation/native";
import { theme } from "../theme";

declare module "@react-navigation/native" {
	export type CustomTheme = typeof theme;
	export type Theme = CustomTheme;

	export function useTheme(): CustomTheme;
}
