import { CustomTheme, useTheme } from "@react-navigation/native";
import { AppScreenProps } from "../navigation/types";
import { StyleSheet, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../components/ui/Button";
import FormInput from "../components/ui/FormInput";
import TitleAndSubtitle from "../components/ui/TitleAndSubtitle";
import { SubmitHandler, useForm } from "react-hook-form";
import { api } from "../services/api";
import { RegisterBody } from "../types/auth";
import FormErrorMessage from "../components/ui/FormErrorMessage";

type RegisterForm = {
	email: string;
	name: string;
	password: string;
	confirmPassword: string;
};

const RegisterScreen = ({ navigation }: AppScreenProps<"Register">) => {
	const theme = useTheme();
	const styles = getStyles(theme);

	const {
		control,
		handleSubmit,
		getValues,
		setError,
		formState: { errors, isSubmitting },
	} = useForm<RegisterForm>({
		mode: "onSubmit",
		reValidateMode: "onSubmit",
		defaultValues: {
			email: "",
			name: "",
			password: "",
			confirmPassword: "",
		},
	});

	const onSubmit: SubmitHandler<RegisterForm> = async (formData: RegisterForm) => {
		const registerBody: RegisterBody = {
			email: formData.email,
			name: formData.name,
			password: formData.password,
		};

		const res = await api.register(registerBody);
		if (res.ok) {
			// TODO: Once register API returns token, treat register the same as a successful login
			navigation.replace("Login");
		} else {
			if (res.status === 409) {
				setError(
					"email",
					{
						message: "This email is already in use by a registered user",
					},
					{ shouldFocus: true },
				);
			} else {
				setError("root.server", {
					message: res.error,
				});
			}
		}
	};

	return (
		<SafeAreaView style={styles.screen}>
			<View style={{ alignSelf: "center" }}>
				<TitleAndSubtitle
					titleText="Register"
					subtitleText="Create an account to start hosting and joining games"
				/>
			</View>
			<View style={{ display: "flex", gap: 25 }}>
				<View style={{ display: "flex", gap: 10 }}>
					<FormInput
						label="Email"
						placeholder="Email"
						autoCapitalize="none"
						keyboardType="email-address"
						autoCorrect={false}
						controllerProps={{
							control,
							name: "email",
							rules: {
								required: "Email is required",
								pattern: {
									value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
									message: "Email must be in the valid format",
								},
							},
						}}
					/>
					<FormInput
						label="Full Name"
						placeholder="Full Name"
						textContentType="name"
						autoCapitalize="words"
						autoCorrect={false}
						controllerProps={{
							control,
							name: "name",
							rules: { required: "Name is required" },
						}}
					/>
					<FormInput
						label="Password"
						placeholder="Password"
						secureTextEntry={true}
						textContentType="password"
						autoCorrect={false}
						autoCapitalize="none"
						controllerProps={{
							control,
							name: "password",
							rules: {
								required: "Password is required",
								minLength: {
									value: 8,
									message: "Password must be at least 8 characters long",
								},
							},
						}}
					/>
					<FormInput
						label="Confirm Password"
						placeholder="Confirm Password"
						secureTextEntry={true}
						textContentType="password"
						autoCorrect={false}
						autoCapitalize="none"
						controllerProps={{
							control,
							name: "confirmPassword",
							rules: {
								required: "Confirm Password is required",
								validate: (value) => value === getValues("password") || "Passwords must match",
							},
						}}
					/>
					{errors.root?.server?.message && <FormErrorMessage message={errors.root.server.message} />}
				</View>
				<Button variant="primary" onPress={() => handleSubmit(onSubmit)()} disabled={isSubmitting}>
					{isSubmitting ? "Registering..." : "Register"}
				</Button>
				<Text style={styles.footerText}>
					Already have an account?{" "}
					<Text style={{ color: theme.colors.textSecondary }} onPress={() => navigation.navigate("Login")}>
						Log In
					</Text>
				</Text>
			</View>
		</SafeAreaView>
	);
};

export default RegisterScreen;

const getStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		screen: {
			display: "flex",
			flex: 1,
			justifyContent: "flex-start",
			marginTop: 50,
			marginBottom: 50,
			gap: 30,
			width: "90%",
			alignSelf: "center",
		},
		footerText: {
			color: theme.colors.text,
			fontSize: 16,
			textAlign: "center",
			fontWeight: 600,
		},
	});
