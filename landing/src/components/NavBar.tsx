import { useState } from "react";
import { HiOutlineBars3, HiOutlineXMark } from "react-icons/hi2";
import { SiGithub } from "react-icons/si";

export const NavBar = () => {
	const [mobileOpen, setMobileOpen] = useState(false);

	return (
		<nav
			aria-label="Main navigation"
			className="flex w-full items-center justify-between py-3 md:px-16 md:py-4 lg:px-24 xl:px-32"
		>
			<a href="/" aria-label="ShowUp home">
				<span className="text-xl font-semibold tracking-tight text-text">
					Show<span className="text-brand">Up</span>
				</span>
			</a>

			<div
				id="menu"
				className={`${mobileOpen ? "max-md:w-full" : "max-md:w-0"} max-md:absolute max-md:left-0 max-md:top-0 max-md:z-10 max-md:h-full max-md:flex-col max-md:justify-center max-md:overflow-hidden max-md:bg-overlay max-md:backdrop-blur max-md:transition-all max-md:duration-300 flex items-center gap-8 text-sm`}
			>
				<a href="#" onClick={() => setMobileOpen(false)} className="text-textMuted hover:text-text">
					Home
				</a>
				<a href="#" onClick={() => setMobileOpen(false)} className="text-textMuted hover:text-text">
					Features
				</a>
				<a href="#" onClick={() => setMobileOpen(false)} className="text-textMuted hover:text-text">
					Tech Stack
				</a>
				<a href="#" onClick={() => setMobileOpen(false)} className="text-textMuted hover:text-text">
					Architecture
				</a>

				<a
					href="https://github.com/showup-app/showup"
					onClick={() => setMobileOpen(false)}
					className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-brand px-5 text-sm font-medium text-textOnDanger transition hover:bg-textSecondary md:hidden"
				>
					<SiGithub size={18} />
					View on GitHub
				</a>
				<button
					type="button"
					id="close-menu"
					onClick={() => setMobileOpen(false)}
					aria-label="Close navigation menu"
					className="aspect-square rounded-md bg-chrome p-2 font-medium text-text transition hover:bg-disabled md:hidden"
				>
					<HiOutlineXMark size={24} aria-hidden="true" />
				</button>
			</div>

			<a
				href="https://github.com/showup-app/showup"
				target="_blank"
				rel="noopener noreferrer"
				className="hidden h-10 items-center justify-center gap-2 rounded-full bg-brand px-5 text-sm font-medium text-textOnDanger transition hover:bg-textSecondary md:inline-flex"
			>
				<SiGithub size={18} aria-hidden="true" />
				View on GitHub
			</a>
			<button
				type="button"
				id="open-menu"
				onClick={() => setMobileOpen(true)}
				aria-controls="menu"
				aria-expanded={mobileOpen}
				aria-label="Open navigation menu"
				className="aspect-square rounded-md bg-chrome p-2 font-medium text-text transition hover:bg-disabled md:hidden"
			>
				<HiOutlineBars3 size={24} aria-hidden="true" />
			</button>
		</nav>
	);
};
