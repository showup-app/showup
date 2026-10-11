import { CustomTheme, useTheme } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";

const FormErrorMessage = ({ message }: { message: string }) => {
	const theme = useTheme();
	const styles = getStyles(theme);

	return (
		<View style={styles.container}>
			<Text style={styles.text}>{message}</Text>
		</View>
	);
};

export default FormErrorMessage;

const getStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		container: {
			width: "100%",
			backgroundColor: theme.colors.danger,
			padding: 10,
		},
		text: {
			fontSize: 14,
			color: theme.colors.text,
		},
	});
