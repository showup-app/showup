import { CustomTheme, useTheme } from "@react-navigation/native";
import { Pressable, PressableProps, StyleProp, StyleSheet, Text, TextStyle, ViewStyle } from "react-native";

interface ButtonProps extends Omit<PressableProps, "style"> {
	buttonStyle?: StyleProp<ViewStyle>;
	textStyle?: StyleProp<TextStyle>;
	children: React.ReactNode;
	variant: "primary" | "outline" | "danger" | "dangerSoft";
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
				style={[styles.baseText, textVariantStyle, textStyle, buttonProps.disabled && styles.baseTextDisabled]}
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
			alignItems: "center",
			justifyContent: "center",
			borderRadius: 8,
			paddingVertical: theme.spacing.md,
			paddingHorizontal: theme.spacing.lg,
			flexDirection: "row",
			gap: theme.spacing.sm,
		},
		baseButtonDisabled: {
			backgroundColor: theme.colors.disabled,
			borderColor: "transparent",
		},
		outlineButton: {
			borderColor: theme.colors.borderStrong,
			backgroundColor: "transparent",
		},
		dangerButton: {
			backgroundColor: theme.colors.danger,
		},
		dangerButtonDisabled: {
			backgroundColor: theme.colors.disabled,
		},
		dangerSoftButton: {
			backgroundColor: `${theme.colors.danger}26`,
			borderColor: theme.colors.danger,
			borderWidth: 1,
		},
		dangerSoftButtonDisabled: {
			backgroundColor: theme.colors.disabled,
			borderColor: "transparent",
		},
		dangerSoftText: {
			color: theme.colors.danger,
		},
		baseTextDisabled: {
			color: theme.colors.textMuted,
		},
		primaryButton: {
			backgroundColor: theme.colors.textSecondary,
		},
		baseText: {
			fontSize: theme.fontSize.md,
			fontFamily: theme.fontFamily.medium,
			color: theme.colors.text,
		},
		primaryText: {
			color: theme.colors.background,
		},
		dangerText: {
			color: theme.colors.textOnDanger,
		},
		outlineText: {
			color: theme.colors.text,
		},
	});
