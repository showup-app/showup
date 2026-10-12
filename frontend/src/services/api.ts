import { Game, GameDetail, GameFilters } from "../types/game";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

/** Backend error */
export class ApiError extends Error {
	constructor(
		public status: number,
		message: string,
	) {
		super(message);
	}
}


async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
	if (!API_URL) {
		throw new Error("EXPO_PUBLIC_API_URL is not set. Copy .env.example to .env.");
	}

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
		throw new ApiError(response.status, detail || "Something went wrong");
	}

	return response.json() as Promise<T>;
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
  // TODO: login
	// TODO: register

	getGames: (filters: GameFilters = {}) => request<Game[]>(`/games${toQueryString(filters)}`),
	getGame: (id: number) => request<GameDetail>(`/games/${id}`),

	// TODO: createGame
	// TODO: updateGame
	// TODO: cancelGame
	// TODO: joinGame
	// TODO: leaveGame
	// TODO: getMe
	// TODO: getMyGames
	// TODO: markAttendance
};