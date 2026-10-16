import { createContext, useContext, useState } from "react";
import { User } from "../types/auth";
import { deleteItemAsync, setItemAsync } from "expo-secure-store";

type UserContextData = {
	user: User | null;
	token: string | null;
	login: (userData: User, token: string) => void;
	logout: () => void;
};

const UserContext = createContext<UserContextData | undefined>(undefined);

const TOKEN_KEY = "user-token";

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
	const [user, setUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(null);

	const login = async (userData: User, userToken: string) => {
		try {
			await setItemAsync(TOKEN_KEY, userToken);
			setUser(userData);
			setToken(userToken);
		} catch (e) {
			console.error("An error occured while storing the user token: ", e);
		}
	};

	const logout = async () => {
		try {
			await deleteItemAsync(TOKEN_KEY);
			setToken(null);
			setUser(null);
		} catch (e) {
			console.error("An error occured while storing the user token: ", e);
		}
	};

	return (
		<UserContext.Provider value={{ user, token, login, logout }}>
			{children}
		</UserContext.Provider>
	);
};

export const useUser = () => {
	const user = useContext(UserContext);
	if (!user)
		throw new Error("useUser must be envoked in UserContext provider");

	return user;
};
