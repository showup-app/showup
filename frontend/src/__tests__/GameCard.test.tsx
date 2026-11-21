// Portions of this file were generated with AI assistance (GitHub Copilot) and human-reviewed afterwards
import { fireEvent, render } from "@testing-library/react-native";
import GameCard from "../components/game/GameCard";
import { GameCreate, GameStatus } from "../types/game";
import { makeGame, makeGameDetail, mockUserContext } from "./utils/mocks";

describe("GameCard", () => {
	beforeEach(() => {
		mockUserContext.user = {
			id: 5,
			email: "player@example.com",
			name: "Test Player",
			reputation: 80,
		};
	});

	it("shows game details and calls its actions", async () => {
		const onJoin = jest.fn();
		const onSeePlayers = jest.fn();
		const { getByText } = await render(
			<GameCard
				game={makeGame({ min_reputation: 50, spots: 2, cost: 5 })}
				onJoin={onJoin}
				onSeePlayers={onSeePlayers}
				linkLabel="View roster"
				highlighted
			/>,
		);

		expect(getByText("Soccer game")).toBeTruthy();
		expect(getByText("Community Centre · Burnaby")).toBeTruthy();
		expect(getByText("2 spots left")).toBeTruthy();
		expect(getByText("50+ only")).toBeTruthy();
		expect(getByText("$5.00")).toBeTruthy();
		await fireEvent.press(getByText("Join"));
		await fireEvent.press(getByText("View roster"));
		expect(onJoin).toHaveBeenCalledTimes(1);
		expect(onSeePlayers).toHaveBeenCalledTimes(1);
	});

	it("shows host information and detailed game facts", async () => {
		const onJoin = jest.fn();
		const onSeePlayers = jest.fn();
		const { getByText, queryByText } = await render(
			<GameCard
				game={makeGameDetail({
					min_reputation: 20,
					spots_left: 2,
					host_name: "Game Host",
					host_reputation: 95,
				})}
				onJoin={onJoin}
				onSeePlayers={onSeePlayers}
				isDetailed
			/>,
		);

		expect(getByText("WHEN")).toBeTruthy();
		expect(getByText("WHERE")).toBeTruthy();
		expect(getByText("COST")).toBeTruthy();
		expect(getByText("REPUTATION REQUIRED")).toBeTruthy();
		expect(getByText("100 Main St, Burnaby")).toBeTruthy();
		expect(getByText("Free per player")).toBeTruthy();
		expect(getByText("★ 20+")).toBeTruthy();
		expect(getByText("Hosted by Game Host")).toBeTruthy();
		expect(getByText("★ 95")).toBeTruthy();
		expect(getByText("Join")).toBeTruthy();
		expect(queryByText("See players")).toBeNull();
		await fireEvent.press(getByText("Join"));
		expect(onJoin).toHaveBeenCalledTimes(1);
		expect(onSeePlayers).not.toHaveBeenCalled();
	});

	it("shows a cancelled game, omits unavailable host details, and disables joining", async () => {
		const onJoin = jest.fn();
		const { getAllByText, getByText } = await render(
			<GameCard
				game={makeGame({
					status: GameStatus.Cancelled,
					spots: 0,
					joined: false,
				})}
				onJoin={onJoin}
			/>,
		);

		expect(getAllByText("Full")).toHaveLength(2);
		expect(getByText("Cancelled")).toBeTruthy();
		await fireEvent.press(getAllByText("Full")[0]);
		expect(onJoin).not.toHaveBeenCalled();
	});

	it("labels joined and hosted games and disables the join action", async () => {
		const onJoin = jest.fn();
		const joined = await render(<GameCard game={makeGame({ joined: true })} onJoin={onJoin} />);
		expect(joined.getByText("Joined")).toBeTruthy();
		await fireEvent.press(joined.getByText("Joined"));
		expect(onJoin).not.toHaveBeenCalled();
		await joined.unmount();

		const hosted = await render(<GameCard game={makeGame({ host_id: 5 })} onJoin={onJoin} />);
		expect(hosted.getByText("Hosting")).toBeTruthy();
		await fireEvent.press(hosted.getByText("Hosting"));
		expect(onJoin).not.toHaveBeenCalled();
	});

	it("renders a create-game card with free cost and a single remaining spot", async () => {
		const game: GameCreate = {
			sport: "pickleball",
			venue: "Recreation Centre",
			address: "1 Park Rd, Vancouver",
			starts_at: "2027-06-15T18:00:00.000Z",
			duration_minutes: 60,
			spots: 1,
			cost: 0,
			min_reputation: 0,
		};
		const { getByText } = await render(<GameCard game={game} />);

		expect(getByText("Pickleball game")).toBeTruthy();
		expect(getByText("1 spot left")).toBeTruthy();
		expect(getByText("Free")).toBeTruthy();
		expect(getByText(/Jun 15/)).toBeTruthy();
	});
});
