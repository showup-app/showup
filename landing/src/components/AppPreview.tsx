const screenshots = [
	{ src: "/screenshots/1.jpeg" },
	{ src: "/screenshots/2.jpeg" },
	{ src: "/screenshots/3.jpeg" },
	{ src: "/screenshots/4.jpeg" },
];

export const AppPreview = () => (
	<section className="bg-surface">
		<div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:py-14">
			<div className="mx-auto grid max-w-5xl grid-cols-2 items-start gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
				{screenshots.map((screenshot) => (
					<div
						key={screenshot.src}
						className="mx-auto w-full max-w-47.5 rounded-4xl border-4 border-borderStrong bg-background p-2 shadow-xl shadow-black/20"
					>
						<div className="relative aspect-9/19 overflow-hidden rounded-[1.4rem] border border-border bg-surface">
							<img src={screenshot.src} className="h-full w-full object-cover" />
						</div>
					</div>
				))}
			</div>
		</div>
	</section>
);
