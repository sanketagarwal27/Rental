import { Calendar, Clock3, MapPin } from "lucide-react";

export default function SearchBar() {
  return (
    <div className="bg-[#1a1a1a]/90 backdrop-blur-md border border-zinc-700 rounded-xl p-4 flex flex-col lg:flex-row gap-3 w-full max-w-5xl">
      <div className="flex-1 flex items-center gap-3 bg-[#111111] border border-zinc-700 rounded-md px-4 py-3">
        <MapPin size={18} className="text-zinc-400" />

        <input
          placeholder="City or Airport"
          className="bg-transparent outline-none w-full text-white placeholder:text-zinc-500"
        />
      </div>

      <div className="flex items-center gap-3 bg-[#111111] border border-zinc-700 rounded-md px-4 py-3">
        <Calendar size={18} className="text-zinc-400" />

        <input type="date" className="bg-transparent outline-none text-white" />
      </div>

      <div className="flex items-center gap-3 bg-[#111111] border border-zinc-700 rounded-md px-4 py-3">
        <Clock3 size={18} className="text-zinc-400" />

        <input type="time" className="bg-transparent outline-none text-white" />
      </div>

      <button className="bg-blue-500 hover:bg-blue-600 text-black font-semibold px-8 py-3 rounded-md whitespace-nowrap">
        SEARCH FLEET
      </button>
    </div>
  );
}
