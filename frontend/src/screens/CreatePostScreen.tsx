import { CustomTheme, useTheme } from "@react-navigation/native";
import { Controller, SubmitHandler, useForm, useWatch } from "react-hook-form";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Chip from "../components/form/Chip";
import DateTimeChip from "../components/form/DateTimeChip";
import FormSection from "../components/form/FormSection";
import Stepper from "../components/form/Stepper";
import Button from "../components/ui/Button";
import FormErrorMessage from "../components/ui/FormErrorMessage";
import FormInput from "../components/ui/FormInput";
import { AppScreenProps } from "../navigation/types";
import { GameCreate } from "../types/game";
import { capitalize } from "../utils/format";
import { SPORTS, sportIcon } from "../utils/sports";

const MIN_SPOTS = 2;
const MAX_SPOTS = 30;

const SPORT_OPTIONS = SPORTS.map((sport) => ({
	value: sport,
	label: capitalize(sport),
	icon: sportIcon(sport),
}));

const DURATIONS = [
	{ minutes: 60, label: "1 hr" },
	{ minutes: 90, label: "1.5 hr" },
	{ minutes: 120, label: "2 hr" },
];

const REPUTATIONS = [
	{ value: 0, label: "Anyone", hint: "Open to everyone" },
	{ value: 70, label: "70+", hint: "Keeps out repeat no-shows" },
	{ value: 80, label: "80+", hint: "Fine with the odd miss" },
	{ value: 90, label: "90+", hint: "Very reliable players only" },
];

type CreateGameForm = {
	sport: string;
	venue: string;
	address: string;
	startsAt: Date;
	durationMinutes: number;
	spots: number;
	minReputation: number;
	isFree: boolean;
	cost: string;
};

function defaultStart(): Date {
	const date = new Date();
	date.setDate(date.getDate() + 1);
	date.setHours(18, 0, 0, 0);
	return date;
}

function withTime(day: Date, time: Date): Date {
	const result = new Date(day);
	result.setHours(time.getHours(), time.getMinutes(), 0, 0);
	return result;
}

function withDay(time: Date, day: Date): Date {
	const result = new Date(time);
	result.setFullYear(day.getFullYear(), day.getMonth(), day.getDate());
	return result;
}

export function CreatePostScreen({ navigation }: AppScreenProps<"CreatePost">) {
	const theme = useTheme();
	const styles = getStyles(theme);

	const { control, handleSubmit } = useForm<CreateGameForm>({
		defaultValues: {
			sport: "",
			venue: "",
			address: "",
			startsAt: defaultStart(),
			durationMinutes: 90,
			spots: 10,
			minReputation: 0,
			isFree: true,
			cost: "",
		},
	});

	const isFree = useWatch({
		control,
		name: "isFree",
	});

	const onSubmit: SubmitHandler<CreateGameForm> = (form) => {
		const draft: GameCreate = {
			sport: form.sport,
			venue: form.venue.trim(),
			address: form.address.trim(),
			starts_at: form.startsAt.toISOString(),
			duration_minutes: form.durationMinutes,
			spots: form.spots,
			cost: form.isFree ? 0 : Number(form.cost),
			min_reputation: form.minReputation,
		};
		navigation.navigate("ConfirmPost", { draft });
	};

	return (
		<SafeAreaView style={styles.screen} edges={["bottom", "left", "right"]}>
			<KeyboardAvoidingView
				style={styles.screen}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				keyboardVerticalOffset={100}
			>
				<ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
					{/* Sport */}
					<FormSection label="Sport">
						<Controller
							control={control}
							name="sport"
							rules={{ required: "Pick a sport" }}
							render={({ field, fieldState }) => (
								<>
									<View style={styles.chipRow}>
										{SPORT_OPTIONS.map((option) => (
											<Chip
												key={option.value}
												icon={option.icon}
												label={option.label}
												selected={field.value === option.value}
												onPress={() => field.onChange(option.value)}
											/>
										))}
									</View>
									{fieldState.error && <FormErrorMessage message={fieldState.error.message!} />}
								</>
							)}
						/>
					</FormSection>

					{/* Where */}
					<FormSection label="Where">
						<FormInput
							label="Venue"
							placeholder="BCIT Building SE16"
							controllerProps={{
								control,
								name: "venue",
								rules: {
									validate: (value) => String(value).trim() !== "" || "Add where you're playing",
									maxLength: { value: 200, message: "Keep it under 200 characters" },
								},
							}}
						/>
						<FormInput
							label="Address"
							placeholder="3700 Willingdon Ave, Burnaby"
							controllerProps={{
								control,
								name: "address",
								rules: {
									validate: (value) => String(value).trim() !== "" || "Add the address",
									maxLength: { value: 300, message: "Keep it under 300 characters" },
								},
							}}
						/>
					</FormSection>

					{/* When */}
					<FormSection label="When">
						<Controller
							control={control}
							name="startsAt"
							rules={{
								validate: (value: Date) => value > new Date() || "Pick a time in the future",
							}}
							render={({ field, fieldState }) => (
								<>
									<View style={styles.chipRow}>
										<DateTimeChip
											mode="date"
											value={field.value}
											minimumDate={new Date()}
											onChange={(day) => field.onChange(withDay(field.value, day))}
										/>
										<DateTimeChip
											mode="time"
											value={field.value}
											onChange={(time) => field.onChange(withTime(field.value, time))}
										/>
									</View>
									{fieldState.error && <FormErrorMessage message={fieldState.error.message!} />}
								</>
							)}
						/>
						<Controller
							control={control}
							name="durationMinutes"
							render={({ field }) => (
								<View style={styles.chipRow}>
									{DURATIONS.map((duration) => (
										<Chip
											key={duration.minutes}
											icon="timer-sand"
											label={duration.label}
											selected={field.value === duration.minutes}
											onPress={() => field.onChange(duration.minutes)}
										/>
									))}
								</View>
							)}
						/>
					</FormSection>

					{/* Players and cost */}
					<FormSection>
						<Controller
							control={control}
							name="spots"
							render={({ field }) => (
								<View style={styles.row}>
									<View style={styles.rowText}>
										<Text style={styles.rowTitle}>Players needed</Text>
										<Text style={styles.caption}>Not counting you</Text>
									</View>
									<Stepper
										value={field.value}
										min={MIN_SPOTS}
										max={MAX_SPOTS}
										onChange={field.onChange}
									/>
								</View>
							)}
						/>

						<View style={styles.divider} />

						<Controller
							control={control}
							name="minReputation"
							render={({ field }) => (
								<View style={styles.block}>
									<Text style={styles.rowTitle}>Who can join</Text>
									<View style={styles.chipRow}>
										{REPUTATIONS.map((option) => (
											<Chip
												key={option.value}
												label={option.label}
												selected={field.value === option.value}
												onPress={() => field.onChange(option.value)}
											/>
										))}
									</View>
									<Text style={styles.caption}>
										{REPUTATIONS.find((option) => option.value === field.value)?.hint}
									</Text>
								</View>
							)}
						/>

						<View style={styles.divider} />

						<View style={styles.block}>
							<View style={styles.row}>
								<Text style={[styles.rowTitle, styles.rowText]}>Cost per player</Text>
								<Controller
									control={control}
									name="isFree"
									render={({ field }) => (
										<View style={styles.chipRow}>
											<Chip
												label="Free"
												selected={field.value}
												selectedColor={theme.colors.success}
												onPress={() => field.onChange(true)}
											/>
											<Chip
												label="Set price"
												selected={!field.value}
												onPress={() => field.onChange(false)}
											/>
										</View>
									)}
								/>
							</View>
							{!isFree && (
								<Controller
									control={control}
									name="cost"
									rules={{
										validate: (value: string) => {
											if (!/^\d+(\.\d{1,2})?$/.test(value)) return "Enter a price like 5 or 4.50";
											const amount = Number(value);
											if (amount <= 0) return "Enter a price above $0, or choose Free";
											if (amount > 9999.99) return "That's too high";
											return true;
										},
									}}
									render={({ field, fieldState }) => (
										<>
											<View style={styles.priceInput}>
												<Text style={styles.dollar}>$</Text>
												<TextInput
													style={styles.priceText}
													value={field.value}
													onChangeText={field.onChange}
													onBlur={field.onBlur}
													placeholder="5.00"
													placeholderTextColor={theme.colors.textMuted}
													keyboardType="decimal-pad"
													maxLength={7}
												/>
											</View>
											{fieldState.error && (
												<FormErrorMessage message={fieldState.error.message!} />
											)}
										</>
									)}
								/>
							)}
						</View>
					</FormSection>
				</ScrollView>

				<View style={styles.footer}>
					<Button variant="primary" onPress={() => handleSubmit(onSubmit)()}>
						Next
					</Button>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const getStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		screen: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		content: {
			padding: 20,
			gap: 16,
		},
		chipRow: {
			flexDirection: "row",
			flexWrap: "wrap",
			gap: 8,
		},
		row: {
			flexDirection: "row",
			alignItems: "center",
			gap: 12,
		},
		rowText: {
			flex: 1,
		},
		block: {
			gap: 10,
		},
		rowTitle: {
			color: theme.colors.text,
			fontSize: 16,
		},
		caption: {
			color: theme.colors.textMuted,
			fontSize: 12,
		},
		divider: {
			height: 1,
			backgroundColor: theme.colors.border,
			marginVertical: 4,
		},
		priceInput: {
			flexDirection: "row",
			alignItems: "center",
			gap: 6,
			backgroundColor: theme.colors.background,
			borderColor: theme.colors.border,
			borderWidth: 1,
			borderRadius: 6,
			paddingHorizontal: 12,
		},
		dollar: {
			color: theme.colors.textMuted,
			fontSize: 16,
		},
		priceText: {
			flex: 1,
			color: theme.colors.text,
			fontSize: 16,
			paddingVertical: 12,
		},
		footer: {
			paddingHorizontal: 20,
			paddingVertical: 12,
		},
	});
