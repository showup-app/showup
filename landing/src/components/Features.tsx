import { HiOutlineCalendarDays, HiOutlineMapPin, HiOutlineStar } from "react-icons/hi2";

const features = [
	{ icon: HiOutlineCalendarDays, title: "Lorem ipsum" },
	{ icon: HiOutlineMapPin, title: "Dolor sit amet" },
	{ icon: HiOutlineStar, title: "Consectetur" },
];

export const Features = () => (
	<section id="features" className="scroll-mt-24 border-t border-border">
		<div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:py-16">
			<h2 id="features-heading" className="mb-5 text-3xl font-semibold tracking-tight sm:text-4xl">
				Features
			</h2>

			<p className="mb-6 max-w-2xl text-sm leading-6 text-textMuted sm:text-base">
				Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.
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
									<p className="text-sm leading-6 text-textMuted">
										Lorem ipsum dolor sit amet, consectetur adipiscing elit.
									</p>
								</div>
							</article>
						</li>
					);
				})}
			</ul>
		</div>
	</section>
);
