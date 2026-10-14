import DateTimePicker from "@react-native-community/datetimepicker";
import { CustomTheme, useTheme } from "@react-navigation/native";
import { useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatShortDate, formatTime } from "../../utils/format";
import Chip from "./Chip";

type DateTimeChipProps = {
	mode: "date" | "time";
	value: Date;
	onChange: (value: Date) => void;
	minimumDate?: Date;
};

const DateTimeChip = ({ mode, value, onChange, minimumDate }: DateTimeChipProps) => {
	const theme = useTheme();
	const styles = getStyles(theme);
	const [open, setOpen] = useState(false);
	const [draft, setDraft] = useState(value);

	const label = mode === "date" ? formatShortDate(value.toISOString()) : formatTime(value.toISOString());

	const openPicker = () => {
		setDraft(value);
		setOpen(true);
	};

	return (
		<>
			<Chip
				icon={mode === "date" ? "calendar-blank-outline" : "clock-outline"}
				label={label}
				onPress={openPicker}
			/>

			{open && Platform.OS === "android" && (
				<DateTimePicker
					mode={mode}
					value={value}
					minimumDate={minimumDate}
					onValueChange={(_event, date) => {
						setOpen(false);
						onChange(date);
					}}
					onDismiss={() => setOpen(false)}
				/>
			)}

			{Platform.OS === "ios" && (
				<Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
					<Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
					<SafeAreaView edges={["bottom"]} style={styles.sheet}>
						<View style={styles.sheetHeader}>
							<Pressable onPress={() => setOpen(false)} hitSlop={8}>
								<Text style={styles.cancel}>Cancel</Text>
							</Pressable>
							<Pressable
								onPress={() => {
									onChange(draft);
									setOpen(false);
								}}
								hitSlop={8}
							>
								<Text style={styles.done}>Done</Text>
							</Pressable>
						</View>
						<DateTimePicker
							mode={mode}
							value={draft}
							minimumDate={minimumDate}
							display="spinner"
							themeVariant="dark"
							minuteInterval={5}
							onValueChange={(_event, date) => setDraft(date)}
						/>
					</SafeAreaView>
				</Modal>
			)}
		</>
	);
};

export default DateTimeChip;

const getStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		backdrop: {
			flex: 1,
			backgroundColor: "rgba(0, 0, 0, 0.5)",
		},
		sheet: {
			backgroundColor: theme.colors.surface,
			borderTopLeftRadius: 16,
			borderTopRightRadius: 16,
		},
		sheetHeader: {
			flexDirection: "row",
			justifyContent: "space-between",
			padding: 16,
		},
		cancel: {
			color: theme.colors.textMuted,
			fontSize: 16,
		},
		done: {
			color: theme.colors.textSecondary,
			fontSize: 16,
			fontWeight: "600",
		},
	});