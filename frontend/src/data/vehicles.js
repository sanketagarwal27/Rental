import bikeImage from "../assets/bike.jpg";
import sedanImage from "../assets/sedan.jpg";
import suvImage from "../assets/suv.jpg";

const vehicles = [
  {
    id: 1,
    title: "Ninja ZX-10R",
    price: 129,
    image: bikeImage,
    tag: "Sport",
    specs: ["998cc", "SuperSport", "Verified"],
  },
  {
    id: 2,
    title: "S-Class Executive",
    price: 299,
    image: sedanImage,
    tag: "Top Tier",
    specs: ["5 Seats", "Premium", "Verified"],
  },
  {
    id: 3,
    title: "Urban Explorer X",
    price: 89,
    image: suvImage,
    tag: "Compact SUV",
    specs: ["5 Seats", "Spacious", "Verified"],
  },
];

export default vehicles;
