import { CustomTheme } from "@react-navigation/native";
import { StyleSheet } from "react-native";

// TODO: combine shared styles used across components/screens into global styles
export const getGlobalStyles = (theme: CustomTheme) => {
	return StyleSheet.create({
		container: {
			borderColor: "#3C3C3C",
			backgroundColor: "#2B2B2B",
			borderWidth: 1,
			borderRadius: 5,
			width: "100%",
		},
	});
};
