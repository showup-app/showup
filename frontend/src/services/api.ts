import { LoginForm, LoginReponse, RegisterBody, RegisterResponse, User } from "../types/auth";
import { Game, GameCreate, GameDetail, GameFilters, MyGames, AttendanceMark } from "../types/game";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

type ResponseObject<T> =
	| {
			ok: true;
			data: T;
			status: number;
	  }
	| {
			ok: false;
			data: null;
			status: number;
			error: string;
	  };

type RequestObject = {
	method?: "GET" | "POST" | "PATCH" | "DELETE";
	token?: string;
	body?: unknown;
	fallbackErrorMessage?: string;
};

async function request<T>(path: string, options: RequestObject = {}): Promise<ResponseObject<T>> {
	const { method = "GET", token, body, fallbackErrorMessage = "Something went wrong" } = options;
	if (!API_URL) {
		return {
			ok: false,
			data: null,
			status: 0,
			error: "EXPO_PUBLIC_API_URL is not set. Copy .env.example to .env.",
		};
	}

	try {
		const response = await fetch(`${API_URL}${path}`, {
			method: method,
			...(body !== undefined && { body: JSON.stringify(body) }),
			headers: {
				"Content-Type": "application/json",
				...(token && { Authorization: `Bearer ${token}` }),
			},
		});

		if (!response.ok) {
			const body = await response.json().catch(() => null);
			const detail = typeof body?.detail === "string" ? body.detail : response.statusText;

			return {
				ok: false,
				data: null,
				status: response.status,
				error: detail || fallbackErrorMessage,
			};
		}

		// 204 (No content) returns no JSON response
		const data = response.status === 204 ? null : await response.json();

		return {
			data: data,
			status: response.status,
			ok: response.ok,
		};
	} catch (e) {
		return {
			ok: false,
			data: null,
			status: 0,
			error: e instanceof Error ? e.message : fallbackErrorMessage,
		};
	}
}

/** Turns { sport: "soccer", location: "" } into "?sport=soccer", skipping empty values. */
function toQueryString(params: Record<string, string | boolean | undefined>): string {
	const query = new URLSearchParams();
	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined && value !== "") query.append(key, String(value));
	}
	const text = query.toString();
	return text ? `?${text}` : "";
}

export const api = {
	login: (loginBody: LoginForm) =>
		request<LoginReponse>(`/auth/login`, {
			method: "POST",
			body: loginBody,
			fallbackErrorMessage: "Failed to login, please try again later",
		}),
	register: (registerBody: RegisterBody) =>
		request<RegisterResponse>(`/auth/signup`, {
			method: "POST",
			body: registerBody,
			fallbackErrorMessage: "Failed to register, please try again later",
		}),
	me: (token: string) =>
		request<User>(`/auth/me`, {
			token,
			fallbackErrorMessage: "Failed to authenticate, please try again later",
		}),
	getGames: (filters: GameFilters = {}, token: string) =>
		request<Game[]>(`/games${toQueryString(filters)}`, {
			token,
			fallbackErrorMessage: "Couldn't load games",
		}),
	getGame: (id: number, token?: string) => request<GameDetail>(`/games/${id}`, { token }),
	createGame: (gameBody: GameCreate, token: string) =>
		request<Game>(`/games`, {
			method: "POST",
			token,
			body: gameBody,
			fallbackErrorMessage: "Failed to create game",
		}),
	updateGame: (id: number, gameBody: GameCreate, token: string) =>
		request<Game>(`/games/${id}`, {
			method: "PATCH",
			token,
			body: gameBody,
			fallbackErrorMessage: "Failed to update game",
		}),
	cancelGame: (id: number, token: string) =>
		request<Game>(`/games/${id}/cancel`, { method: "POST", token, fallbackErrorMessage: "Failed to cancel game" }),
	joinGame: (id: number, token: string) =>
		request<GameDetail>(`/games/${id}/join`, {
			method: "POST",
			token,
			fallbackErrorMessage: "Failed to join game, please try again later",
		}),
	leaveGame: (id: number, token: string) =>
		request<GameDetail>(`/games/${id}/join`, {
			method: "DELETE",
			token,
			fallbackErrorMessage: "Failed to leave game, please try again later",
		}),
	getMyGames: (token: string, includePast = false) =>
		request<MyGames>(`/me/games${toQueryString({ include_past: includePast })}`, {
			token,
			fallbackErrorMessage: "Couldn't load your games",
		}),
	markAttendance: (gameId: number, marks: AttendanceMark[], token: string) =>
		request<GameDetail>(`/games/${gameId}/attendance`, {
			method: "POST",
			token,
			body: { marks },
			fallbackErrorMessage: "Couldn't save attendance",
		}),
	removePlayer: (gameId: number, playerId: number, token: string) =>
		request<GameDetail>(`/games/${gameId}/players/${playerId}`, {
			method: "DELETE",
			token,
			fallbackErrorMessage: "Couldn't remove player from game",
		}),
};
