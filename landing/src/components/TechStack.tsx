import { TbBrandReactNative } from "react-icons/tb";
import {
	SiExpo,
	SiGithub,
	SiSupabase,
	SiJest,
	SiFastapi,
	SiPytest,
	SiRender,
	SiDocker,
	SiTypescript,
	SiPython,
	SiPydantic,
} from "react-icons/si";

const stackSections = [
	{
		title: "Frontend",
		items: [
			{ icon: SiTypescript, label: "TypeScript" },
			{ icon: TbBrandReactNative, label: "React Native" },
			{ icon: SiExpo, label: "Expo" },
			{ icon: SiJest, label: "Jest" },
		],
	},
	{
		title: "Backend",
		items: [
			{ icon: SiPython, label: "Python" },
			{ icon: SiFastapi, label: "FastAPI" },
			{ icon: SiPydantic, label: "Pydantic" },
			{ icon: SiPytest, label: "Pytest" },
		],
	},
	{
		title: "Cloud",
		items: [
			{ icon: SiDocker, label: "Docker" },
			{ icon: SiSupabase, label: "Supabase" },
			{ icon: SiRender, label: "Render" },
			{ icon: SiGithub, label: "GitHub" },
		],
	},
];

export const TechStack = () => (
	<section id="tech-stack" aria-labelledby="tech-stack-heading" className="scroll-mt-24 border-t border-border">
		<div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:py-16">
			<h2 id="tech-stack-heading" className="mb-5 text-3xl font-semibold tracking-tight sm:text-4xl">
				Tech Stack
			</h2>
			<p className="mb-6 max-w-6xl text-sm leading-6 text-textMuted sm:text-base">
				Below is a list of technologies used in the creation of ShowUp. Our team decided on these tools based on
				several criteria including: familiarity, ease of use, developer experience, and project constraints.
			</p>

			<div className="grid grid-cols-1 gap-3">
				{stackSections.map((section) => (
					<article key={section.title} className="rounded-xl border border-border bg-surface p-4 sm:p-5">
						<h3 className="mb-3 text-lg font-semibold">{section.title}</h3>
						<ul className="grid grid-cols-2 gap-2 sm:gap-3">
							{section.items.map((item) => {
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
				))}
			</div>
		</div>
	</section>
);
