import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, View } from "react-native";
import { AppScreenProps } from "../navigation/types";
import FormInput from "../components/ui/FormInput";
import Button from "../components/ui/Button";
import TitleAndSubtitle from "../components/ui/TitleAndSubtitle";
import { SubmitHandler, useForm } from "react-hook-form";
import { LoginForm } from "../types/auth";
import { api } from "../services/api";
import FormErrorMessage from "../components/ui/FormErrorMessage";
import { useUser } from "../context/UserContext";

const LoginScreen = ({ navigation }: AppScreenProps<"Login">) => {
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
				navigation.replace("Tabs", { screen: "Home" });
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
		<SafeAreaView style={styles.screen}>
			<View style={{ alignSelf: "center" }}>
				<TitleAndSubtitle titleText="Login" subtitleText="Enter your email and password to log in" />
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
			display: "flex",
			flex: 1,
			justifyContent: "flex-start",
			marginTop: 50,
			marginBottom: 50,
			gap: 30,
			width: "90%",
			alignSelf: "center",
		},
	});
