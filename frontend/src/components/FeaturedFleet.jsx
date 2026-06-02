import { ArrowRight } from "lucide-react";
import vehicles from "../data/vehicles.js";
import VehicleCard from "./VehicleCard";

export default function FeaturedFleet() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-24">
      <div className="flex justify-between items-center mb-10">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-blue-300">
            Our Collection
          </p>

          <h2 className="text-4xl font-bold mt-2">The Featured Fleet</h2>
        </div>

        <button className="flex items-center gap-2 text-blue-300">
          View Entire Fleet
          <ArrowRight size={18} />
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {vehicles.map((vehicle) => (
          <VehicleCard key={vehicle.id} {...vehicle} />
        ))}
      </div>
    </section>
  );
}
