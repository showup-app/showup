import { Fragment } from "react";
import {
	HiOutlineArrowDown,
	HiOutlineArrowRight,
	HiOutlineCircleStack,
	HiOutlineDevicePhoneMobile,
	HiOutlineServerStack,
	HiOutlineSquares2X2,
} from "react-icons/hi2";

const layers = [
	{ icon: HiOutlineDevicePhoneMobile, label: "Lorem ipsum", detail: "Lorem ipsum dolor sit amet" },
	{ icon: HiOutlineServerStack, label: "Dolor sit amet", detail: "Consectetur adipiscing elit" },
	{ icon: HiOutlineCircleStack, label: "Consectetur", detail: "Sed do eiusmod tempor" },
];

export const Architecture = () => (
	<section id="architecture" className="scroll-mt-24 border-t border-border">
		<div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:py-16">
			<h2 id="architecture-heading" className="mb-5 text-3xl font-semibold tracking-tight sm:text-4xl">
				Architecture
			</h2>

			<p className="mb-6 max-w-3xl text-sm leading-6 text-textMuted sm:text-base">
				Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aute irure dolor.
			</p>

			<div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
				<div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
					{layers.map((layer, index) => {
						const Icon = layer.icon;
						return (
							<Fragment key={layer.label}>
								{index > 0 && (
									<div className="flex justify-center text-brand">
										<HiOutlineArrowDown className="sm:hidden" size={20} />
										<HiOutlineArrowRight className="hidden sm:block" size={20} />
									</div>
								)}
								<div className="min-w-0 rounded-xl border border-border bg-chrome p-4">
									<div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
										<Icon size={22} />
									</div>
									<h3 className="font-semibold">{layer.label}</h3>
									<p className="mt-1 text-xs leading-5 text-textMuted">{layer.detail}</p>
								</div>
							</Fragment>
						);
					})}
				</div>
			</div>

			<div className="mt-3 grid gap-3 sm:grid-cols-2">
				<div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 sm:p-4">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chrome text-textMuted">
						<HiOutlineSquares2X2 size={21} />
					</div>
					<div>
						<p className="text-sm font-medium">Lorem ipsum</p>
						<p className="mt-1 text-xs text-textMuted">Lorem ipsum dolor sit amet.</p>
					</div>
				</div>
				<div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 sm:p-4">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chrome text-textMuted">
						<HiOutlineCircleStack size={21} />
					</div>
					<div>
						<p className="text-sm font-medium">Dolor sit amet</p>
						<p className="mt-1 text-xs text-textMuted">Consectetur adipiscing elit.</p>
					</div>
				</div>
			</div>
		</div>
	</section>
);
