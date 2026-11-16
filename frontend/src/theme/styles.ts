import { CustomTheme } from "@react-navigation/native";
import { StyleSheet } from "react-native";

// TODO: combine shared styles used across components/screens into global styles
export const getGlobalStyles = (theme: CustomTheme) => {
	return StyleSheet.create({
		container: {
			borderColor: theme.colors.border,
			backgroundColor: theme.colors.surface,
			borderWidth: 1,
			borderRadius: 5,
			width: "100%",
		},
	});
};
