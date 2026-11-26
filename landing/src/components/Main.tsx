import Header from "./Header";
import { Architecture } from "./Architecture";
import { AppPreview } from "./AppPreview";
import { ComingSoon } from "./ComingSoon";
import { Features } from "./Features";
import { Footer } from "./Footer";
import { NavBar } from "./NavBar";
import { TechStack } from "./TechStack";

const Main = () => {
	return (
		<main className="min-h-screen bg-background text-text">
			<NavBar />
			<Header />
			<AppPreview />
			<Features />
			<TechStack />
			<Architecture />
			<ComingSoon />
			<Footer />
		</main>
	);
};

export default Main;
