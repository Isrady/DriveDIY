import Nav from "@/components/landing/Nav";
import Hero from "@/components/landing/Hero";
import ProblemSection from "@/components/landing/ProblemSection";
import HowItWorks from "@/components/landing/HowItWorks";
import ServicesTabSwitcher from "@/components/landing/ServicesTabSwitcher";
import Stats from "@/components/landing/Stats";
import Community from "@/components/landing/Community";
import Pricing from "@/components/landing/Pricing";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <main className="bg-midnight">
      <Nav />
      <Hero />
      <ProblemSection />
      <HowItWorks />
      <ServicesTabSwitcher />
      <Stats />
      <Community />
      <Pricing />
      <FAQ />
      <Footer />
    </main>
  );
}
