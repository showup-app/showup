import { DefaultTheme } from "@react-navigation/native";
import { colors } from "./colors";
import { spacing } from "./spacing";
import { fontFamily, fontSize, navigationFonts, typography } from "./typography";

export const theme = {
	...DefaultTheme,
	colors,
	spacing,
	fontSize,
	fontFamily,
	fonts: navigationFonts,
	typography,
};
