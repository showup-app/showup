export type User = {
	id: number;
	email: string;
	name: string;
	reputation: number;
};

export type LoginForm = {
	email: string;
	password: string;
};

export type LoginReponse = {
	access_token: string;
	token_type: string;
};

export type RegisterBody = {
	email: string;
	name: string;
	password: string;
};
