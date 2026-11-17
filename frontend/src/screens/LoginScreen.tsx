import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, View } from "react-native";
import FormInput from "../components/ui/FormInput";
import Button from "../components/ui/Button";
import TitleAndSubtitle from "../components/ui/TitleAndSubtitle";
import { SubmitHandler, useForm } from "react-hook-form";
import { LoginForm } from "../types/auth";
import { api } from "../services/api";
import FormErrorMessage from "../components/ui/FormErrorMessage";
import { useUser } from "../context/UserContext";

const LoginScreen = () => {
	const styles = getStyles();
	const { login } = useUser();

	const {
		control,
		handleSubmit,
		formState: { isSubmitting, errors },
		setError,
	} = useForm<LoginForm>({
		mode: "onSubmit",
		reValidateMode: "onSubmit",
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const onSubmit: SubmitHandler<LoginForm> = async (formData: LoginForm) => {
		const loginRes = await api.login(formData);
		if (loginRes.ok) {
			const token = loginRes.data;
			const meRes = await api.me(token.access_token);
			if (meRes.ok) {
				login(meRes.data, token.access_token);
			} else {
				setError("root.server", {
					message: meRes.error,
				});
			}
		} else {
			setError("root.server", {
				message: loginRes.error,
			});
		}
	};

	return (
		<SafeAreaView style={styles.screen} edges={["left", "right", "bottom"]}>
			<View style={styles.titleContainer}>
				<TitleAndSubtitle titleText="Login" subtitleText="Enter your email and password to log in" />
			</View>
			<View style={styles.form}>
				<View style={styles.fields}>
					<FormInput
						label="Email"
						placeholder="Email"
						autoCapitalize="none"
						keyboardType="email-address"
						autoCorrect={false}
						controllerProps={{
							control,
							name: "email",
							rules: { required: "Email is required." },
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
							rules: { required: "Password is required." },
						}}
					/>
					{errors.root?.server?.message && <FormErrorMessage message={errors.root.server.message} />}
				</View>
				<Button variant="primary" onPress={() => handleSubmit(onSubmit)()} disabled={isSubmitting}>
					{isSubmitting ? "Logging in..." : "Login"}
				</Button>
			</View>
		</SafeAreaView>
	);
};

export default LoginScreen;

const getStyles = () =>
	StyleSheet.create({
		screen: {
			flex: 1,
			justifyContent: "center",
			paddingHorizontal: 20,
			paddingBottom: 160,
			gap: 32,
		},
		titleContainer: {
			alignSelf: "center",
		},
		form: {
			gap: 24,
		},
		fields: {
			gap: 16,
		},
	});
