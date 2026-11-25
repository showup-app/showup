import { CustomTheme, useTheme } from "@react-navigation/native";
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
import Toast from "react-native-toast-message";
import { getGlobalStyles } from "../theme/styles";

const LoginScreen = () => {
	const theme = useTheme();
	const styles = getStyles(theme);
	const globalStyles = getGlobalStyles(theme);
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
				Toast.show({
					type: "success",
					text1: "Login successful!",
					bottomOffset: 90,
				});
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
		<SafeAreaView
			style={[globalStyles.screen, globalStyles.screenPadding, styles.screen]}
			edges={["left", "right", "bottom"]}
		>
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

const getStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		screen: {
			justifyContent: "center",
			paddingBottom: 160,
			gap: theme.spacing.xxxl,
		},
		titleContainer: {
			alignSelf: "center",
		},
		form: {
			gap: theme.spacing.xxl,
		},
		fields: {
			gap: theme.spacing.lg,
		},
	});
