import {
	HiOutlineCircleStack,
	HiOutlineCloud,
	HiOutlineCodeBracket,
	HiOutlineCpuChip,
	HiOutlineDevicePhoneMobile,
	HiOutlineServerStack,
} from "react-icons/hi2";

const stackItems = [
	{ icon: HiOutlineDevicePhoneMobile, label: "Lorem" },
	{ icon: HiOutlineCodeBracket, label: "Ipsum" },
	{ icon: HiOutlineServerStack, label: "Dolor" },
	{ icon: HiOutlineCircleStack, label: "Sit amet" },
	{ icon: HiOutlineCloud, label: "Consectetur" },
	{ icon: HiOutlineCpuChip, label: "Adipiscing" },
];

export const TechStack = () => (
	<section id="tech-stack" aria-labelledby="tech-stack-heading" className="scroll-mt-24 border-t border-border">
		<div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:py-16">
			<h2 id="tech-stack-heading" className="mb-5 text-3xl font-semibold tracking-tight sm:text-4xl">
				Tech Stack
			</h2>
			<p className="mb-6 max-w-2xl text-sm leading-6 text-textMuted sm:text-base">
				Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vitae purus.
			</p>

			<div className="grid gap-3 grid-cols-1">
				<article className="rounded-xl border border-border bg-surface p-4 sm:p-5">
					<ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
						{stackItems.map((item) => {
							const Icon = item.icon;
							return (
								<li
									key={item.label}
									className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border border-border bg-chrome p-3 text-center"
								>
									<Icon size={24} className="text-brand" aria-hidden="true" />
									<span className="text-xs font-medium text-textMuted">{item.label}</span>
								</li>
							);
						})}
					</ul>
				</article>
			</div>
		</div>
	</section>
);
