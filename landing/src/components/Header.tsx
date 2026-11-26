import splashIcon from "../../../frontend/assets/splash-icon.png";

const Header = () => {
	return (
		<section id="home" className="bg-surface">
			<div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-4 text-center sm:px-6 md:py-8">
				<img
					src={splashIcon}
					alt="ShowUp"
					className="h-28 w-28 object-contain sm:h-36 sm:w-36 md:h-48 md:w-48"
				/>
				<div>
					<h1 className="text-xl font-semibold tracking-tight text-text md:text-4xl">
						Show<span className="text-brand">Up</span>
					</h1>
					<p className="mt-2 max-w-xl text-lg leading-relaxed text-textMuted md:text-xl">
						Sports events you can count on
					</p>
				</div>
				<p className="max-w-full rounded-full border border-borderStrong bg-chrome px-3 py-2 text-center text-xs font-semibold leading-relaxed tracking-[0.12em] text-brand uppercase sm:px-4 sm:tracking-[0.18em]">
					COMP 7082 GROUP 15 - Andrew, Nikola, Raajvir, Sara
				</p>
			</div>
		</section>
	);
};

export default Header;
