import { RiTeamFill } from "react-icons/ri";
import { MdSportsSoccer } from "react-icons/md";
import { GiBasketballJersey } from "react-icons/gi";

const features = [
	{
		icon: RiTeamFill,
		title: "Host Reliable Games",
		body: "Game hosts can customize the details of their game including sport, cost, location, minimum reputation, and more!",
	},
	{
		icon: MdSportsSoccer,
		title: "Discover New Games",
		body: "New players can discover games according to their needs by filtering by the sport or searching by location",
	},
	{
		icon: GiBasketballJersey,
		title: "Easily Join Games",
		body: "Players can easily join and leave games with one tap, without a complex sign-up or registration process",
	},
];

export const Features = () => (
	<section id="features" className="scroll-mt-24 border-t border-border">
		<div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:py-16">
			<h2 id="features-heading" className="mb-5 text-3xl font-semibold tracking-tight sm:text-4xl">
				Features
			</h2>

			<p className="mb-6 max-w-6xl text-sm leading-6 text-textMuted sm:text-base">
				ShowUp is a pick-up sports event app that promotes access to reliable players and games. Using ShowUp
				allows game organizers to find players that attend regularly, so that they are not left struggling to
				find players last minute, while managing any venue costs that come with hosting the game. ShowUp also
				allows new players to find reliable games. Since pick-up sports games are commonly not shared publicly
				and harder for new players to find, ShowUp provides one location for hosts to post their games, and for
				reliable players to discover them.
				<br></br>
				<br></br>
				ShowUp uses a player-based reputation score system that promotes reliable games. Game hosts can set a
				minimum reputation requirement for their games, ensuring that only reliable players join. After the game
				finishes, hosts mark every player's attendance for their game. After the host marks the game's
				attendance, the players' reputation scores are updated. Showing up raises it, and not showing up
				decreases it. Every new player starts at the maximum reputation (100/100), so that they have access to
				join any game regardless of the reputation requirement.
			</p>

			<ul className="space-y-3">
				{features.map((feature) => {
					const Icon = feature.icon;
					return (
						<li key={feature.title}>
							<article className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3 sm:items-center sm:p-4">
								<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-chrome text-brand">
									<Icon size={23} />
								</div>
								<div className="min-w-0 flex-1">
									<h3 className="mb-1 font-semibold">{feature.title}</h3>
									<p className="text-sm leading-6 text-textMuted">{feature.body}</p>
								</div>
							</article>
						</li>
					);
				})}
			</ul>
		</div>
	</section>
);
