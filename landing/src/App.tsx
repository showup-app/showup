import Header from "./components/Header";
import { Architecture } from "./components/Architecture";
import { AppPreview } from "./components/AppPreview";
import { ComingSoon } from "./components/ComingSoon";
import { Features } from "./components/Features";
import { Footer } from "./components/Footer";
import { NavBar } from "./components/NavBar";
import { TechStack } from "./components/TechStack";

const App = () => {
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

export default App;
