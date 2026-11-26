import { SiGithub } from "react-icons/si";

export const Footer = () => (
	<footer className="border-t border-border bg-chrome">
		<div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 md:grid-cols-[1.2fr_auto] md:items-start md:py-10">
			<div className="flex flex-col items-start gap-2">
				<a href="#home" className="text-xl font-semibold tracking-tight text-text">
					Show<span className="text-brand">Up</span>
				</a>
				<div>
					<p className="text-xs font-semibold tracking-[0.16em] text-textMuted uppercase">
						COMP 7082 · GROUP 15
					</p>
					<p className="text-sm text-textMuted">Andrew, Nikola, Raajvir, Sara</p>
				</div>
			</div>

			<a
				href="https://github.com/showup-app/showup"
				className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-borderStrong px-4 text-sm font-medium text-text transition hover:border-brand hover:text-brand"
			>
				<SiGithub size={18} />
				GitHub
			</a>
		</div>
	</footer>
);
