export default function Footer() {
  return (
    <footer className="border-t border-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-4 gap-12">
        <div>
          <h3 className="font-bold text-2xl">ELITE DRIVE</h3>

          <p className="mt-4 text-zinc-400">
            Defining the future of luxury transportation.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Fleet</h4>

          <ul className="space-y-3 text-zinc-400">
            <li>Luxury Sedans</li>
            <li>Sport Motorcycles</li>
            <li>Electric Performance</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Company</h4>

          <ul className="space-y-3 text-zinc-400">
            <li>Locations</li>
            <li>Insurance</li>
            <li>Support</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Newsletter</h4>

          <div className="flex">
            <input
              className="flex-1 bg-transparent border border-zinc-700 px-4 py-3"
              placeholder="Email address"
            />

            <button className="bg-blue-500 px-5">Join</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
