import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import FeaturedFleet from "../components/FeaturedFleet";
import Features from "../components/Features";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <main className="bg-[#121212] text-white overflow-x-hidden">
      <Navbar />

      <Hero />

      <FeaturedFleet />

      <Features />

      <Footer />
    </main>
  );
}
