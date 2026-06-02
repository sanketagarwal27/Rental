import mongoose, { Schema } from "mongoose";

const ReviewSchema = new Schema(
  {
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "A review must be linked to a specific booking trip!"],
    },
    reviewer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reviewer identity is required."],
    },
    reviewType: {
      type: String,
      required: true,
      enum: ["RenterToVehicle", "HostToRenter"],
    },
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
    },
    reviewee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reviewee identity is required."],
    },
    rating: {
      type: Number,
      required: [true, "Please provide a rating out of 5 stars."],
      min: [1, "Rating must be at least 1 star."],
      max: [5, "Rating cannot exceed 5 stars."],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, "Comments cannot exceed 500 characters."],
    },
  },
  { timestamps: true },
);

ReviewSchema.statics.calculateAverageRating = async function (id) {
  const stats = await this.aggregate([
    { $match: { vehicle: id, reviewType: "RenterToVehicle" } },
    {
      $group: {
        _id: "$vehicle",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);
  if (stats.length > 0) {
    await mongoose.model("Vehicle").findByIdAndUpdate(vehicleId, {
      totalReviews: stats[0].nRating,
      averageRating: Number(stats[0].avgRating.toFixed(1)),
    });
  } else {
    // Fallback if all reviews are deleted
    await mongoose.model("Vehicle").findByIdAndUpdate(vehicleId, {
      totalReviews: 0,
      averageRating: 0,
    });
  }
};
ReviewSchema.post("save", function () {
  if (this.reviewType === "RenterToVehicle" && this.vehicle)
    this.constructor.calculateAverageRating(this.vehicle);
});
ReviewSchema.index({ booking: 1, reviewer: 1 }, { unique: true });
export const Review = mongoose.model("Review", ReviewSchema);
