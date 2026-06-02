export default function VehicleCard({ title, image, price, tag, specs = [] }) {
  return (
    <div className="bg-[#181818] border border-zinc-800 rounded-lg overflow-hidden hover:border-blue-500 transition-all duration-300">
      <div className="relative">
        <img src={image} alt={title} className="h-60 w-full object-cover" />

        <span className="absolute top-3 right-3 text-xs px-3 py-1 rounded-full bg-blue-200 text-black">
          {tag}
        </span>
      </div>

      <div className="p-5">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-2xl text-white">{title}</h3>

          <div className="text-right">
            <p className="text-blue-300 text-2xl font-bold">${price}</p>

            <p className="text-xs text-zinc-400">/per day</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3 text-xs text-zinc-400">
          {specs.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>

        <button className="w-full mt-6 py-3 border border-zinc-600 hover:bg-blue-500 hover:border-blue-500 transition">
          Book Now
        </button>
      </div>
    </div>
  );
}
