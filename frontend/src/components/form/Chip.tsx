import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CustomTheme, useTheme } from "@react-navigation/native";
import { ComponentProps } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

type ChipProps = {
	label: string;
	icon?: ComponentProps<typeof MaterialCommunityIcons>["name"];
	selected?: boolean;
	selectedColor?: string;
	onPress?: () => void;
};

const Chip = ({ label, icon, selected = false, selectedColor, onPress }: ChipProps) => {
	const theme = useTheme();
	const styles = getStyles(theme);
	const activeColor = selectedColor ?? theme.colors.textSecondary;
	const textColor = selected ? activeColor : theme.colors.text;

	return (
		<Pressable
			onPress={onPress}
			hitSlop={4}
			style={[styles.chip, selected && { borderColor: activeColor, backgroundColor: "transparent" }]}
		>
			{icon && <MaterialCommunityIcons name={icon} size={16} color={textColor} />}
			<Text style={[styles.text, { color: textColor }]}>{label}</Text>
		</Pressable>
	);
};

export default Chip;

const getStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		chip: {
			flexDirection: "row",
			alignItems: "center",
			gap: 6,
			backgroundColor: theme.colors.border,
			borderColor: "transparent",
			borderWidth: 1,
			borderRadius: 16,
			paddingHorizontal: 12,
			paddingVertical: 7,
		},
		text: {
			fontSize: 14,
		},
	});