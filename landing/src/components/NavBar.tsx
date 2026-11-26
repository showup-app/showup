import { useState } from "react";
import { HiOutlineBars3, HiOutlineXMark } from "react-icons/hi2";
import { SiGithub } from "react-icons/si";

const links = [
	{ href: "#home", label: "Home" },
	{ href: "#features", label: "Features" },
	{ href: "#tech-stack", label: "Tech Stack" },
	{ href: "#architecture", label: "Architecture" },
	{ href: "#coming-soon", label: "Coming Soon" },
];

const linkClassName = "text-textMuted transition-colors hover:text-brand";

export const NavBar = () => {
	const [mobileOpen, setMobileOpen] = useState(false);

	return (
		<nav
			aria-label="Main navigation"
			className="sticky top-0 z-30 flex w-full items-center justify-between border-b border-borderStrong bg-chrome px-4 py-3 shadow-lg shadow-black/10 backdrop-blur sm:px-6 md:px-8 md:py-4 lg:px-24 xl:px-32"
		>
			<a href="#home">
				<span className="text-xl font-semibold tracking-tight text-text">
					Show<span className="text-brand">Up</span>
				</span>
			</a>

			<div
				id="menu"
				className={[
					mobileOpen ? "max-md:w-full" : "max-md:w-0",
					"max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-40 max-md:h-dvh max-md:flex-col",
					"max-md:justify-center max-md:overflow-hidden max-md:bg-overlay max-md:backdrop-blur",
					"max-md:transition-all max-md:duration-300 flex items-center gap-4 text-sm",
					"md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 lg:gap-8",
				].join(" ")}
			>
				{links.map(({ href, label }) => (
					<a key={href} href={href} onClick={() => setMobileOpen(false)} className={linkClassName}>
						{label}
					</a>
				))}

				<a
					href="https://github.com/showup-app/showup"
					onClick={() => setMobileOpen(false)}
					className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-borderStrong px-4 text-sm font-medium text-text transition hover:border-brand hover:text-brand md:hidden"
				>
					<SiGithub size={18} aria-hidden="true" />
					View on GitHub
				</a>
				<button
					type="button"
					onClick={() => setMobileOpen(false)}
					aria-label="Close navigation menu"
					className="aspect-square rounded-md bg-chrome p-2 font-medium text-text transition hover:bg-disabled md:hidden"
				>
					<HiOutlineXMark size={24} aria-hidden="true" />
				</button>
			</div>

			<a
				href="https://github.com/showup-app/showup"
				className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-borderStrong px-4 text-sm font-medium text-text transition hover:border-brand hover:text-brand max-md:hidden"
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
