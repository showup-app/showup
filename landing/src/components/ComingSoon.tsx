import { HiOutlineSparkles } from "react-icons/hi2";

const upcomingFeatures = [
	"Social Networking - Follow friends and join their games!",
	"Instant Messaging - Communicate with the host for any game inquiries!",
	"Game Day Reminders - Receive push notifications before your game starts!",
	"Favourite Sports - Select your favourite sports and receive recommendations for upcoming games!",
];

export const ComingSoon = () => (
	<section id="coming-soon" className="scroll-mt-24 border-t border-border">
		<div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:py-14">
			<div className="mx-auto max-w-3xl rounded-xl border border-borderStrong bg-surface p-4 sm:p-6">
				<div className="flex items-start gap-4">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
						<HiOutlineSparkles size={24} />
					</div>
					<div>
						<h2 id="coming-soon-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
							Coming Soon
						</h2>
						<ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-textMuted marker:text-brand">
							{upcomingFeatures.map((feature) => (
								<li key={feature}>{feature}</li>
							))}
						</ul>
					</div>
				</div>
			</div>
		</div>
	</section>
);
