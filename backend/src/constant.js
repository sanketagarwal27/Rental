export const DB_NAME = "Rental";
export const minDeposit = {
  //Like [minimum, %of booking value] for security deposit
  //2-Wheeler
  Scooter: [1000, 30],
  Commuter: [2000, 30],
  Cruiser: [5000, 35],
  SportBike: [8000, 40],
  Adventure: [8000, 40],
  //4-Wheeler
  Hatchback: [3000, 30],
  Sedan: [5000, 35],
  SUV: [7500, 40],
  Premium: [15000, 50],
  Luxury: [30000, 50],
  Sports: [50000, 75],
  Truck: [10000, 40],
};
