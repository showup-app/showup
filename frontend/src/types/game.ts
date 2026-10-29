export type GameStatus = "open" | "full" | "cancelled" | "played";

/** GET /games returns a list of these. */
export type Game = {
	id: number;
	host_id: number;
	sport: string;
	venue: string;
	address: string;
	starts_at: string;
	duration_minutes: number;
	spots: number;
	cost: number;
	min_reputation: number;
	fallback_min_reputation: number | null;
	fallback_hours_before_start: number | null;
	status: GameStatus;
	updated_at: string;
	joined: boolean;
	effective_min_reputation: number;
};

export type Player = {
	id: number;
	name: string;
	reputation: number;
	games_played: number;
	is_new: boolean;
};

/** GET /games/{id} returns one of these. */
export type GameDetail = Game & {
	host_name: string;
	host_reputation: number;
	players: Player[];
	spots_left: number;
};

/** Query params for GET /games. */
export type GameFilters = {
	sport?: string;
	location?: string;
	include_past?: boolean;
};

/** Body of POST /games. */
export type GameCreate = {
	sport: string;
	venue: string;
	address: string;
	starts_at: string;
	duration_minutes: number;
	spots: number; // players needed, not counting the host
	cost: number;
	min_reputation: number;
};

/** GET /me/games returns one of these. */
export type MyGames = {
	hosting: Game[];
	joined: Game[];
};
