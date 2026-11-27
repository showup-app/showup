import { Fragment } from "react";
import {
	HiOutlineArrowDown,
	HiOutlineArrowRight,
	HiOutlineCircleStack,
	HiOutlineDevicePhoneMobile,
	HiOutlineServerStack,
} from "react-icons/hi2";
import { SiGithubactions } from "react-icons/si";

const layers = [
	{
		icon: HiOutlineDevicePhoneMobile,
		label: "Mobile App (TypeScript + React Native)",
		detail: "Acts as a presentation layer that users interact with, and communicates with the backend to perform to perform actions",
	},
	{
		icon: HiOutlineServerStack,
		label: "Backend (Python + FastAPI)",
		detail: "Validates and processes client API requests & communicates with the database. Deployed as a cloud instance hosted on Render.com",
	},
	{
		icon: HiOutlineCircleStack,
		label: "Database (PostgreSQL)",
		detail: "Provides a data persistance layer that the backend communicates with. Managed through a cloud environment hosted on Supabase",
	},
];

export const Architecture = () => (
	<section id="architecture" className="scroll-mt-24 border-t border-border">
		<div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:py-16">
			<h2 id="architecture-heading" className="mb-5 text-3xl font-semibold tracking-tight sm:text-4xl">
				Architecture
			</h2>

			<p className="mb-6 max-w-6xl text-sm leading-6 text-textMuted sm:text-base">
				ShowUp implements a layered client/server architecture split amongst different components. This includes
				the client, which is a React Native + TypeScript mobile app, and the server, which is a Python + FastAPI
				backend. Communication between client & server is facilitated through REST API endpoints. The backend
				defines structured request and response bodies that the client interacts with to perform actions, such
				as creating a game, joining a game, and saving attendance marks.
				<br></br>
				<br></br>
				ShowUp uses cloud deployments for both the backend and database. The backend is a deployed instance
				hosted on Render.io, and is automatically reployed on a successful push to the main branch. The database
				is a managed PostgreSQL instance hosted on Supabase. CI pipelines are implemented through GitHub Actions
				for both the frontend and backend. This supports functional and maintainable code by running tests, code
				formatting, linting, and installing dependencies. This enforces code quality while ensuring that issues
				are caught early.
				<br></br>
				<br></br>
				The ShowUp source code is hosted on GitHub, where team members have adopted a feature branching
				workflow. Tasks are divided into separate branches, and are merged into the main branch after team
				member review and the required CI checks are passing. Team members working on separate features with
				short-lived branches allows merge conflicts to be minimized.
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

			<div className="mt-3 grid gap-3 grid-cols-1">
				<div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 sm:p-4">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chrome text-textMuted">
						<SiGithubactions size={21} />
					</div>
					<div>
						<p className="text-sm font-medium">CI/CD Pipelines (GitHub Actions)</p>
						<p className="mt-1 text-xs text-textMuted">
							ShowUp supports a high standard of code quality by implementing CI/CD pipelines for both the
							frontend and backend. The pipelines automatically run several build steps whenever code is
							pushed to the repository. This includes: code formatting, linting, dependency installation,
							and unit tests. The backend instance automatically redeploys on a successful push to the
							main branch.
						</p>
					</div>
				</div>
			</div>
		</div>
	</section>
);
