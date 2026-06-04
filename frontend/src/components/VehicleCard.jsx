import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

export default function VehicleCard({ title, image, price, tag, specs = [] }) {
  const { user } = useAuth();
  const handleBooking = () => {
    if (!user) toast.error("Please login to proceed with booking");
    else console.log("Booking...");
  };
  return (
    <div className="bg-zinc-950/40 backdrop-blur-md border border-zinc-900 rounded-2xl overflow-hidden hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-300 group flex flex-col justify-between">
      <div>
        <div className="relative overflow-hidden">
          <img
            src={image}
            alt={title}
            className="h-60 w-full object-cover group-hover:scale-102 transition-transform duration-300"
          />

          <span className="absolute top-3 right-3 text-[11px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 backdrop-blur-md">
            {tag}
          </span>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-xl text-zinc-100">{title}</h3>

            <div className="text-right">
              <p className="text-blue-400 text-xl font-bold">${price}</p>

              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mt-0.5">
                / per day
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 text-xs text-zinc-400">
            {specs.map((item) => (
              <span
                key={item}
                className="px-2 py-1 rounded-md bg-zinc-900/60 border border-zinc-900/40 font-mono text-[10px]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 pt-0">
        <button
          className="w-full py-3 rounded-xl border border-zinc-800 hover:border-blue-500 hover:bg-blue-600 hover:text-white transition-all duration-200 text-zinc-300 font-medium text-sm cursor-pointer shadow-lg shadow-black/20"
          onClick={handleBooking}
        >
          Book Now
        </button>
      </div>
    </div>
  );
}
