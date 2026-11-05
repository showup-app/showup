import { CustomTheme, useTheme } from "@react-navigation/native";
import { Pressable, PressableProps, StyleProp, StyleSheet, Text, TextStyle, ViewStyle } from "react-native";

interface ButtonProps extends Omit<PressableProps, "style"> {
	buttonStyle?: StyleProp<ViewStyle>;
	textStyle?: StyleProp<TextStyle>;
	children: React.ReactNode;
	variant: "primary" | "outline" | "danger";
}

const Button: React.FC<ButtonProps> = ({ buttonStyle, textStyle, children, variant, ...buttonProps }) => {
	const theme = useTheme();
	const styles = getStyles(theme);

	const textVariantStyle = styles[`${variant}Text` as keyof typeof styles] as StyleProp<TextStyle>;
	const buttonVariantStyle = styles[`${variant}Button` as keyof typeof styles] as StyleProp<ViewStyle>;
	const disabledButtonVariantStyle = styles[
		`${variant}ButtonDisabled` as keyof typeof styles
	] as StyleProp<ViewStyle>;

	return (
		<Pressable
			style={[
				styles.baseButton,
				buttonVariantStyle,
				buttonProps.disabled && styles.baseButtonDisabled,
				buttonProps.disabled && disabledButtonVariantStyle,
				buttonStyle,
			]}
			{...buttonProps}
		>
			<Text
				style={[styles.baseText, textVariantStyle, textStyle]}
				numberOfLines={1}
				adjustsFontSizeToFit
				minimumFontScale={0.5}
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
			borderColor: "transparent",
			borderRadius: 16,
			padding: 18,
			alignItems: "center",
			justifyContent: "center",
		},
		baseButtonDisabled: {
			backgroundColor: "#E9ECEF",
			borderColor: "transparent",
		},
		outlineButton: {
			borderColor: "#8E8E8E",
			backgroundColor: "transparent",
		},
		dangerButton: {
			backgroundColor: theme.colors.danger,
		},
		dangerButtonDisabled: {
			backgroundColor: theme.colors.textMuted || "#CCCCCC",
		},
		primaryButton: {
			backgroundColor: theme.colors.textSecondary,
		},
		baseText: {
			fontSize: 16,
			fontWeight: "600",
			color: theme.colors.text,
		},
		primaryText: {
			color: theme.colors.background,
		},
		dangerText: {
			color: "#FFFFFF",
		},
		outlineText: {
			color: theme.colors.text,
		},
	});
