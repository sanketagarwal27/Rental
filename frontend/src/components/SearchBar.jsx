import { MapPin } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

export default function SearchBar() {
  const { user } = useAuth();
  const handleSearch = () => {
    if (user) {
      console.log("Searching...");
    } else {
      toast.error("Please login to search");
    }
  };
  return (
    <>
      <div className="bg-zinc-950/70 backdrop-blur-lg border border-zinc-900 rounded-2xl p-4 flex flex-col lg:flex-row gap-3 w-full max-w-5xl shadow-2xl">
        <label className="flex flex-1 items-center gap-3 bg-black/40 border border-zinc-900/60 rounded-xl px-4 py-3 cursor-text hover:border-zinc-800 transition">
          <MapPin size={18} className="text-zinc-550 shrink-0" />
          <input
            placeholder="City or Airport"
            className="bg-transparent outline-none w-full text-white placeholder:text-zinc-650 text-sm"
          />
        </label>

        <label className="flex flex-1 items-center gap-3 bg-black/40 border border-zinc-900/60 rounded-xl px-4 py-3 cursor-pointer hover:border-zinc-800 transition">
          <input
            type="date"
            className="bg-transparent outline-none text-white w-full [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:cursor-pointer text-sm"
          />
        </label>

        <label className="flex flex-1 items-center gap-3 bg-black/40 border border-zinc-900/60 rounded-xl px-4 py-3 cursor-pointer hover:border-zinc-800 transition">
          <input
            type="time"
            className="bg-transparent outline-none text-white w-full [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:cursor-pointer text-sm"
          />
        </label>

        <button
          className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-8 py-3 rounded-xl whitespace-nowrap transition-all duration-200 shadow-lg shadow-blue-600/15 cursor-pointer text-sm"
          onClick={handleSearch}
        >
          Search Fleet
        </button>
      </div>
    </>
  );
}
