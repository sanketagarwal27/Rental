import heroImage from "../assets/hero.jpg";
import SearchBar from "./SearchBar";

export default function Hero() {
  return (
    <section
      className="relative min-h-screen flex items-center"
      style={{
        backgroundImage: `url(${heroImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/65"></div>

      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-[#121212]"></div>

      <div className="relative z-20 w-full max-w-7xl mx-auto px-6">
        <div className="max-w-3xl">
          <h1 className="font-bold text-white text-5xl md:text-7xl leading-tight">
            Drive Anything,
            <span className="text-blue-300"> Go Everywhere</span>
          </h1>

          <p className="mt-6 text-zinc-300 text-lg max-w-xl leading-relaxed">
            Premium rentals for those who demand more. From two wheels to
            executive sedans, experience unmatched performance with our curated
            fleet.
          </p>

          <div className="mt-10">
            <SearchBar />
          </div>
        </div>
      </div>
    </section>
  );
}
