import { LoginForm, LoginReponse, RegisterBody, User } from "../types/auth";
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

async function request<T>(
	path: string,
	options: RequestInit = {},
	fallbackErrorMessage: string = "Something went wrong",
): Promise<ResponseObject<T>> {
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
			...options,
			headers: {
				"Content-Type": "application/json",
				...options.headers,
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

		let data;
		// 204 (No content) returns no JSON response
		if (response.status === 204) {
			data = null;
		} else {
			data = await response.json();
		}

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

function getRequestBody<T>(method: "POST" | "PUT", body: T): RequestInit {
	return {
		method: method,
		body: JSON.stringify(body),
	};
}

export const api = {
	login: (loginBody: LoginForm) =>
		request<LoginReponse>(
			`/auth/login`,
			getRequestBody("POST", loginBody),
			"Failed to login, please try again later",
		),
	register: (registerBody: RegisterBody) =>
		request<User>(
			`/auth/signup`,
			getRequestBody("POST", registerBody),
			"Failed to register, please try again later",
		),
	me: (token: string) =>
		request<User>(
			`/auth/me`,
			{
				method: "GET",
				headers: { Authorization: `Bearer ${token}` },
			},
			"Failed to authenticate, please try again later",
		),
	getGames: (filters: GameFilters = {}) =>
		request<Game[]>(`/games${toQueryString(filters)}`, {}, "Couldn't load games"),
	getGame: (id: number) => request<GameDetail>(`/games/${id}`),
	createGame: (gameBody: GameCreate, token: string) =>
		request<Game>(
			`/games`,
			{
				...getRequestBody("POST", gameBody),
				headers: { Authorization: `Bearer ${token}` },
			},
			"Failed to create game",
		),

	getMyGames: (token: string, includePast = false) =>
		request<MyGames>(
			`/me/games${toQueryString({ include_past: includePast })}`,
			{
				method: "GET",
				headers: { Authorization: `Bearer ${token}` },
			},
			"Couldn't load your games",
		),
	
	markAttendance: (gameId: number, marks: AttendanceMark[], token: string) =>
  request<GameDetail>(
  	`/games/${gameId}/attendance`,
  	{
  		...getRequestBody("POST", { marks }),
  		headers: { Authorization: `Bearer ${token}` },
  	},
  	"Couldn't save attendance",
  ),

	// TODO: updateGame
	// TODO: cancelGame
	// TODO: joinGame
	// TODO: leaveGame
	// TODO: getMe
};
