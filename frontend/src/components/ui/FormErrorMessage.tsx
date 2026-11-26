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
			backgroundColor: `${theme.colors.danger}1F`,
			padding: theme.spacing.md,
			borderColor: theme.colors.danger,
			borderWidth: 1,
			borderRadius: 5,
		},
		text: {
			fontSize: theme.fontSize.md,
			color: theme.colors.danger,
			fontFamily: theme.fontFamily.medium,
		},
	});
