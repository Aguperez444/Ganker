import Header from "../components/common/Header.jsx";
import Footer from "../components/common/Footer.jsx";
import HeroSection from "../components/landing/HeroSection.jsx";
import HowItWorksSection from "../components/landing/HowItWorksSection.jsx";
import SupportedGamesSection from "../components/landing/SupportedGamesSection.jsx";
import CtaBanner from "../components/landing/CtaBanner.jsx";

function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0718] text-white flex flex-col selection:bg-orange-500 selection:text-white">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <HowItWorksSection />
        <SupportedGamesSection />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
}

export default HomePage;
