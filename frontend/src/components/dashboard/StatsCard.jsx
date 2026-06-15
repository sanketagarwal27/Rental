import React from "react";

const StatsCard = ({ title, value, sub, icon: Icon, accent }) => {
  const accentMap = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  };

  return (
    <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-5 hover:border-zinc-800 transition duration-200 flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <span className="text-xs text-zinc-500 font-medium">
          {title}
        </span>
        <span className={`p-2 rounded-xl border ${accentMap[accent]}`}>
          {Icon && <Icon className="w-4 h-4" />}
        </span>
      </div>
      <div>
        <h3 className="text-2xl font-bold text-zinc-100">{value}</h3>
        <p className="text-[11px] text-zinc-500 mt-1">{sub}</p>
      </div>
    </div>
  );
};

export default StatsCard;
