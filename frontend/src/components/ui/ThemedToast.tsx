import { CustomTheme, useTheme } from "@react-navigation/native";
import React from "react";
import Toast, { BaseToast, ErrorToast, ToastConfig, ToastProps } from "react-native-toast-message";
import { StyleSheet } from "react-native";

export const ThemedToast: React.FC<Omit<ToastProps, "config">> = (props) => {
	const theme = useTheme();
	const styles = getStyles(theme);

	const toastConfig: ToastConfig = {
		success: (toastProps) => (
			<BaseToast
				{...toastProps}
				style={[{ borderLeftColor: theme.colors.success }, styles.toastContainer]}
				contentContainerStyle={{ paddingHorizontal: theme.spacing.lg }}
				text1Style={styles.primaryText}
				text2Style={styles.secondaryText}
				text2NumberOfLines={3}
			/>
		),
		error: (toastProps) => (
			<ErrorToast
				{...toastProps}
				style={[
					{
						borderLeftColor: theme.colors.danger,
					},
					styles.toastContainer,
				]}
				contentContainerStyle={{ paddingHorizontal: theme.spacing.lg }}
				text1Style={styles.primaryText}
				text2Style={styles.secondaryText}
				text2NumberOfLines={3}
			/>
		),
	};

	return <Toast {...props} config={toastConfig} />;
};

const getStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		toastContainer: {
			backgroundColor: theme.colors.surface,
			height: "auto",
			paddingVertical: theme.spacing.md,
			borderColor: theme.colors.border,
			borderWidth: 1,
		},
		primaryText: {
			fontSize: theme.fontSize.md,
			fontFamily: theme.fontFamily.medium,
			color: theme.colors.text,
		},
		secondaryText: {
			fontFamily: theme.fontFamily.regular,
			fontSize: theme.fontSize.sm,
			color: theme.colors.textSecondary,
		},
	});
