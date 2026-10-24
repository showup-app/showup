import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CustomTheme, useTheme } from "@react-navigation/native";
import { Pressable, StyleSheet, Text, View } from "react-native";

type StepperProps = {
	value: number;
	min: number;
	max: number;
	onChange: (value: number) => void;
};

const Stepper = ({ value, min, max, onChange }: StepperProps) => {
	const theme = useTheme();
	const styles = getStyles(theme);

	const canDecrease = value > min;
	const canIncrease = value < max;

	return (
		<View style={styles.row}>
			<Pressable style={styles.button} onPress={() => onChange(value - 1)} disabled={!canDecrease} hitSlop={6}>
				<MaterialCommunityIcons
					name="minus"
					size={16}
					color={canDecrease ? theme.colors.text : theme.colors.border}
				/>
			</Pressable>
			<Text style={styles.value}>{value}</Text>
			<Pressable style={styles.button} onPress={() => onChange(value + 1)} disabled={!canIncrease} hitSlop={6}>
				<MaterialCommunityIcons
					name="plus"
					size={16}
					color={canIncrease ? theme.colors.text : theme.colors.border}
				/>
			</Pressable>
		</View>
	);
};

export default Stepper;

const getStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		row: {
			flexDirection: "row",
			alignItems: "center",
			gap: 12,
		},
		button: {
			width: 32,
			height: 32,
			borderRadius: 16,
			borderWidth: 1,
			borderColor: theme.colors.border,
			alignItems: "center",
			justifyContent: "center",
		},
		value: {
			color: theme.colors.text,
			fontSize: 18,
			fontWeight: "500",
			minWidth: 24,
			textAlign: "center",
		},
	});
