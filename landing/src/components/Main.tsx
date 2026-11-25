import { NavBar } from "./NavBar";

const Main = () => {
	return (
		<section className="flex flex-col gap-10 items-center bg-surface text-text px-4 pb-10">
			<NavBar />

			<div className="flex w-full flex-col items-center gap-5 pt-4 text-center">
				<h1>
					<img
						src="/assets/splash-icon.png"
						className="h-28 w-28 object-contain sm:h-36 sm:w-36 md:h-48 md:w-48"
					/>
				</h1>
				<div>
					<span className="text-xl md:text-4xl font-semibold tracking-tight text-text">
						Show<span className="text-brand">Up</span>
					</span>
					<p className="max-w-xl text-lg leading-relaxed text-textMuted md:text-xl">
						Sports events you can count on
					</p>
				</div>
				<p className="max-w-full rounded-full border border-borderStrong bg-chrome px-3 py-2 text-center text-xs font-semibold leading-relaxed tracking-[0.12em] text-brand uppercase sm:px-4 sm:tracking-[0.18em]">
					COMP 7082 GROUP 15 - Andrew, Nikola, Raajvir, Sara
				</p>
			</div>
{/* 
			<div className="relative max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-8 md:px-0 mt-14">
				<div className="bg-linear-to-b from-chrome to-background hover:-translate-y-1 transition duration-300 border border-border rounded-lg p-6 space-y-4">
					<div className="flex items-start justify-between">
						<img
							className="w-12 h-12"
							src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/companyLogo/mark/figma.png"
						/>
						<button className="bg-brand text-xs text-textOnDanger rounded-full px-4 py-2">New</button>
					</div>
					<p className="text-lg text-text">Figma</p>
					<p className="text-sm text-textMuted">
						Let AI handle the repetitive, time-consuming tasks so your.
					</p>
				</div>
				<div className="bg-linear-to-b from-chrome to-background hover:-translate-y-1 transition duration-300 border border-border rounded-lg p-6 space-y-4">
					<img
						className="w-12 h-12"
						src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/companyLogo/mark/miro.png"
					/>
					<p className="text-lg text-text">Miro</p>
					<p className="text-sm text-textMuted">
						Empower your business by letting AI take over repetitive tasks.
					</p>
				</div>
				<div className="bg-linear-to-b from-chrome to-background hover:-translate-y-1 transition duration-300 border border-border rounded-lg p-6 space-y-4">
					<img
						className="w-12 h-12"
						src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/companyLogo/mark/webflow.png"
					/>
					<p className="text-lg text-text">Webflow</p>
					<p className="text-sm text-textMuted">
						AI takes care of the repetitive stuff, so your team can focus.
					</p>
				</div>
			</div> */}
		</section>
	);
};

export default Main;
