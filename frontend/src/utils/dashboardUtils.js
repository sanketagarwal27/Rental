export const formatINR = (val) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val || 0);
};

export const statusStyle = (status) => {
  if (status === "Confirmed")
    return "text-blue-400 bg-blue-500/10 border-blue-500/25";
  if (status === "Ongoing")
    return "text-amber-400 bg-amber-500/10 border-amber-500/25";
  if (status === "Completed")
    return "text-emerald-400 bg-emerald-500/10 border-emerald-500/25";
  if (status === "Cancelled")
    return "text-zinc-500 bg-zinc-800/80 border-zinc-700/50";
  return "text-zinc-400 bg-zinc-800/80 border-zinc-700/50";
};

export const getStatusColor = (status) => {
  switch (status) {
    case "Approved":
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/25";
    case "Pending":
      return "text-amber-400 bg-amber-500/10 border-amber-500/25";
    case "Rejected":
      return "text-rose-400 bg-rose-500/10 border-rose-500/25";
    default:
      return "text-zinc-400 bg-zinc-800/80 border-zinc-700/50";
  }
};
