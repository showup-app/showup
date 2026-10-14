export type User = {
	id: number;
	email: string;
	name: string;
	reputation: number;
};

export type RegisterBody = {
	email: string;
	name: string;
	password: string;
};
