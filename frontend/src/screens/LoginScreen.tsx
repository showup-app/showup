import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, View } from "react-native";
import { AppScreenProps } from "../navigation/types";
import FormInput from "../components/ui/FormInput";
import { CustomTheme, useTheme } from "@react-navigation/native";
import Button from "../components/ui/Button";
import TitleAndSubtitle from "../components/ui/TitleAndSubtitle";
import { SubmitHandler, useForm } from "react-hook-form";
import { LoginForm } from "../types/auth";
import { api } from "../services/api";
import FormErrorMessage from "../components/ui/FormErrorMessage";

const LoginScreen = ({ navigation }: AppScreenProps<"Login">) => {
	const theme = useTheme();
	const styles = getStyles(theme);

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
		try {
			const token = await api.login(formData);
			const user = await api.me(token.access_token);
			console.log(user); // TODO: add user to global state
			navigation.replace("Tabs", { screen: "Home" });
		} catch (error) {
			setError("root.server", {
				message: "Failed to login, please try again later",
			});
		}
	};

	return (
		<SafeAreaView style={styles.screen}>
			<View style={{ alignSelf: "center" }}>
				<TitleAndSubtitle
					titleText="Login"
					subtitleText="Enter your email and password to log in"
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
					{errors.root?.server?.message && (
						<FormErrorMessage
							message={errors.root.server.message}
						/>
					)}
				</View>
				<Button
					variant="primary"
					onPress={handleSubmit(onSubmit)}
					disabled={isSubmitting}
				>
					{isSubmitting ? "Logging in..." : "Login"}
				</Button>
			</View>
		</SafeAreaView>
	);
};

export default LoginScreen;

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
	});
