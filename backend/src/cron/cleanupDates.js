import cron from "node-cron";
import { Vehicle } from "../models/vehicle.model.js";
import ApiError from "../utils/ApiError.js";

export const cleanupDates = () => {
  const performCleanup = async () => {
    try {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      await Vehicle.updateMany(
        {},
        {
          $pull: {
            unavailableDates: {
              $lt: today,
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
