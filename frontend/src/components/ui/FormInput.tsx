import { CustomTheme, useTheme } from "@react-navigation/native";
import { Controller, FieldValues, UseControllerProps } from "react-hook-form";
import { StyleProp, StyleSheet, Text, TextInput, TextStyle, TextInputProps, View } from "react-native";
import FormErrorMessage from "./FormErrorMessage";

interface FormInputProps<T extends FieldValues> extends TextInputProps {
	label: string;
	controllerProps: UseControllerProps<T>;
	inputStyle?: StyleProp<TextStyle>;
	labelStyle?: StyleProp<TextStyle>;
}

const FormInput = <T extends FieldValues>({
	label,
	controllerProps,
	inputStyle,
	labelStyle,
	...inputProps
}: FormInputProps<T>) => {
	const theme = useTheme();
	const styles = getStyles(theme);

	return (
		<Controller
			{...controllerProps}
			render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
				<View style={styles.container}>
					<Text style={[styles.label, labelStyle]}>{label}</Text>
					<TextInput
						style={[styles.input, inputStyle]}
						placeholderTextColor={theme.colors.textMuted}
						onBlur={onBlur}
						onChangeText={onChange}
						value={value || ""}
						{...inputProps}
					/>

					{error && <FormErrorMessage message={error.message!} />}
				</View>
			)}
		/>
	);
};

export default FormInput;

const getStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		container: {
			display: "flex",
			gap: 5,
		},
		label: {
			color: theme.colors.textMuted,
			fontSize: 12,
		},
		input: {
			borderWidth: 1,
			borderColor: "#3C3C3C",
			backgroundColor: "#2B2B2B",
			color: theme.colors.text,
			fontSize: 14,
			padding: 10,
		},
	});
