import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatINR } from "../../utils/dashboardUtils";
import { BarChart2 } from "lucide-react";

const VehicleEarningsChart = ({ rentals }) => {
  const data = useMemo(() => {
    if (!rentals) return [];
    
    // Filter for completed bookings to show actual earnings
    const completed = rentals.filter((b) => b.status === "Completed");
    
    // Group by vehicle ID
    const earningsMap = completed.reduce((acc, booking) => {
      const v = booking.vehicle;
      if (!v) return acc;
      
      const key = v._id;
      const netPayout = (booking.hostPayout || booking.totalPrice * 0.95 || 0) - (booking.extraCharge || 0);
      
      if (!acc[key]) {
        acc[key] = {
          name: `${v.brand} ${v.model}`,
          amount: 0,
        };
      }
      acc[key].amount += netPayout;
      return acc;
    }, {});
    
    // Convert to array and sort by amount descending
    return Object.values(earningsMap).sort((a, b) => b.amount - a.amount);
  }, [rentals]);

  if (data.length === 0) {
    return (
      <div className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-6 flex flex-col items-center justify-center h-80">
        <BarChart2 className="w-10 h-10 text-zinc-700 mb-3" />
        <h3 className="text-sm font-medium text-zinc-400">No earnings data available yet.</h3>
        <p className="text-xs text-zinc-600 mt-1">Complete trips to see your earnings chart.</p>
      </div>
    );
  }

  // Custom tooltip to match aesthetic
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl shadow-xl">
          <p className="text-xs text-zinc-400 mb-1">{payload[0].payload.name}</p>
          <p className="text-sm font-bold text-emerald-400">{formatINR(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-zinc-200">Earnings by Vehicle</h3>
          <p className="text-xs text-zinc-500 mt-1">Net payout after platform fees</p>
        </div>
        <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800">
          <BarChart2 className="w-4 h-4 text-emerald-500" />
        </div>
      </div>
      
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#a1a1aa', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis 
              tickFormatter={(value) => `₹${value >= 1000 ? (value/1000).toFixed(1) + 'k' : value}`}
              tick={{ fill: '#a1a1aa', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              dx={-10}
            />
            <Tooltip cursor={{ fill: '#27272a', opacity: 0.4 }} content={<CustomTooltip />} />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#059669'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default VehicleEarningsChart;
