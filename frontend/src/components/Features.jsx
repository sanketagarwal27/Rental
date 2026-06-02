import { Gem, Gauge, Zap } from "lucide-react";

export default function Features() {
  const features = [
    {
      icon: <Zap />,
      title: "Instant Booking",
      desc: "Secure your ride in under 60 seconds.",
    },
    {
      icon: <Gauge />,
      title: "24/7 Support",
      desc: "Dedicated concierge service available anytime.",
    },
    {
      icon: <Gem />,
      title: "Diverse Fleet",
      desc: "Luxury sedans, SUVs and motorcycles.",
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 py-24">
      <h2 className="text-center text-4xl font-bold">
        The Perfect Ride For Every Journey
      </h2>

      <div className="w-20 h-1 bg-blue-400 mx-auto mt-4 mb-16" />

      <div className="grid md:grid-cols-3 gap-12">
        {features.map((feature) => (
          <div key={feature.title} className="text-center">
            <div className="w-16 h-16 mx-auto rounded-lg bg-slate-800 flex items-center justify-center">
              {feature.icon}
            </div>

            <h3 className="mt-5 text-2xl font-semibold">{feature.title}</h3>

            <p className="mt-3 text-zinc-400">{feature.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
