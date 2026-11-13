import { CustomTheme, useTheme } from "@react-navigation/native";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Button from "./Button";

export type ConfirmModalProps = {
	visible: boolean;
	title: string;
	message: string;
	onConfirm: () => void;
	onCancel: () => void;
};

const ConfirmModal = ({ visible, title, message, onConfirm, onCancel }: ConfirmModalProps) => {
	const theme = useTheme();
	const styles = getStyles(theme);

	return (
		<Modal visible={visible} transparent statusBarTranslucent animationType="fade">
			<Pressable style={styles.backdrop} onPress={() => console.log("cancel")}>
				<Pressable style={styles.container}>
					<Text style={styles.title}>{title}</Text>
					<Text style={styles.message}>{message}</Text>
					<View style={styles.buttonsContainer}>
						<Button
							variant="danger"
							buttonStyle={{
								flex: 1,
							}}
							onPress={onCancel}
						>
							Cancel
						</Button>
						<Button
							variant="primary"
							buttonStyle={{
								flex: 1,
							}}
							onPress={onConfirm}
						>
							Confirm
						</Button>
					</View>
				</Pressable>
			</Pressable>
		</Modal>
	);
};

export default ConfirmModal;

const getStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		backdrop: {
			flex: 1,
			backgroundColor: "rgba(0, 0, 0, 0.5)",
			justifyContent: "center",
			alignItems: "center",
			padding: 24,
		},
		container: {
			backgroundColor: theme.colors.surface,
			borderColor: theme.colors.border,
			borderWidth: 1,
			borderRadius: 10,
			width: "100%",
			padding: 20,
			alignItems: "center",
			justifyContent: "center",
			gap: 10,
		},
		buttonsContainer: {
			padding: 10,
			gap: 5,
			width: "100%",
			flexDirection: "row",
		},
		title: {
			color: theme.colors.text,
			textAlign: "center",
			fontSize: 24,
		},
		message: {
			color: theme.colors.textMuted,
			textAlign: "center",
			fontSize: 18,
		},
	});
