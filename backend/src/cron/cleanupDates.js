import cron from "node-cron";
import { Vehicle } from "../models/vehicle.model.js";
import ApiError from "../utils/ApiError.js";

export const cleanupDates = () => {
  const performCleanup = async () => {
    try {
      const istDateString = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
      const cutoffDate = new Date(`${istDateString}T00:00:00.000Z`);
      
      await Vehicle.updateMany(
        {},
        {
          $pull: {
            unavailableDates: {
              $lt: cutoffDate,
            },
          },
        },
      );
      console.log("Old Dates Removed");
    } catch (err) {
      console.error("Error in clearing dates:", err);
    }
  };

  // Run once immediately on startup
  performCleanup();

  // Schedule to run daily at midnight
  cron.schedule("0 0 * * *", performCleanup);
};
