import mongoose, { Schema } from "mongoose";

const VehicleSchema = new Schema(
  {
    provider: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Provider not given!"],
    },
    category: {
      type: String,
      enum: ["2-Wheeler", "4-Wheeler"],
      required: [true, "Vehicle category is required!"],
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "Sedan",
        "SUV",
        "Hatchback",
        "Truck",
        "Cruiser",
        "Sportbike",
        "Scooter",
        "Adventure",
      ],
    },
    transmission: {
      type: String,
      required: true,
      enum: ["Automatic", "Manual"],
    },
    fuelType: {
      type: String,
      required: true,
      enum: ["Petrol", "Diesel", "Hybrid", "Electric"],
    },
    seats: {
      type: Number,
      required: true,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    vinOrChassis: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },
    licensePlate: {
      type: String,
      uppercase: true,
      trim: true,
    },
    issuingState: {
      type: String,
      uppercase: true,
      trim: true,
    },
    pricePerDay: {
      type: Number,
      required: true,
      min: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    unavailableDates: [Date],
    images: {
      type: [String],
      validate: [(v) => v.length > 0, "Provide atleast one image"],
    },
    features: [String],
    odometer: { type: Number },
    status: {
      type: String,
      enum: ["Approved", "Draft", "Pending", "Rejected"],
      default: "Draft",
    },
    location: {
      type: { type: String, default: "Point" },
      coordinates: { type: [Number], required: true },
    },
    address: {
      type: String,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

VehicleSchema.index({ location: "2dsphere" });
VehicleSchema.index({ licensePlate: 1, issuingState: 1 }, { unique: true });
export const Vehicle = mongoose.model("Vehicle", VehicleSchema);
