import { CustomTheme, useTheme } from "@react-navigation/native";
import { Pressable, PressableProps, StyleProp, StyleSheet, Text, TextStyle } from "react-native";

interface ButtonProps extends PressableProps {
	buttonStyle?: StyleProp<TextStyle>;
	textStyle?: StyleProp<TextStyle>;
	children: React.ReactNode;
	variant: "primary" | "outline" | "danger";
}

const Button: React.FC<ButtonProps> = ({ buttonStyle, textStyle, children, variant, ...buttonProps }) => {
	const theme = useTheme();
	const styles = getStyles(theme);

	return (
		<Pressable
			style={[
				buttonStyle,
				styles.baseButton,
				styles[`${variant}Button`],
				buttonProps.disabled && styles.baseButtonDisabled,
			]}
			{...buttonProps}
		>
			<Text
				style={[
					textStyle,
					styles.baseText,
					`${variant}Text` in styles && styles[`${variant}Text` as keyof typeof styles],
				]}
			>
				{children}
			</Text>
		</Pressable>
	);
};

export default Button;

const getStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		baseButton: {
			borderWidth: 1,
			borderRadius: 16,
			padding: 18,
			alignItems: "center",
		},
		baseButtonDisabled: {
			backgroundColor: "#E9ECEF",
		},
		outlineButton: {
			borderColor: "#8E8E8E",
		},
		dangerButton: {
			backgroundColor: theme.colors.danger,
		},
		primaryButton: {
			backgroundColor: theme.colors.textSecondary,
		},
		baseText: {
			fontSize: 16,
			fontWeight: 600,
			color: theme.colors.text,
		},
		primaryText: {
			color: theme.colors.background,
		},
	});
