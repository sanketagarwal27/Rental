import mongoose, { Schema } from "mongoose";
import validator from "validator";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const COUNTRY_LOCALES = {
  "+1": ["en-US", "en-CA"],
  "+91": ["en-IN"],
  "+44": ["en-GB"],
  "+61": ["en-AU"],
  "+49": ["de-DE"],
  "+33": ["fr-FR"],
  "+81": ["ja-JP"],
  "+86": ["zh-CN"],
  "+55": ["pt-BR"],
  "+7": ["ru-RU"],
};

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      default: "User",
      enum: ["User", "Admin"]
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: validator.isEmail,
        message: (props) => `${props.value} is not a valid email address!`,
      },
    },
    password: {
      type: String,
      required: [true, "Password is required!"],
      select: false,
      validate: {
        validator: function (value) {
          return validator.isStrongPassword(value, {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1,
          });
        },
        message:
          "Not strong enough. It must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
      },
    },
    avatar: {
      type: String,
    },
    isVerifiedEmail: {
      type: Boolean,
      default: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    phone: {
      type: String,
      validate: {
        validator: function (value) {
          if (!value) return true; // phone is optional
          const prefix = Object.keys(COUNTRY_LOCALES).find((p) => value.startsWith(p));
          if (!prefix) {
            return validator.isMobilePhone(value, "any", { strictMode: false });
          }
          const locales = COUNTRY_LOCALES[prefix];
          return locales.some((locale) =>
            validator.isMobilePhone(value, locale, { strictMode: true })
          );
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },
    isVerifiedPhone: {
      type: Boolean,
      default: true,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    phoneOtp: {
      type: String,
      select: false,
    },
    phoneOtpExpires: {
      type: Date,
      select: false,
    },
    adminActionOtp: {
      type: String,
      select: false,
    },
    adminActionOtpExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Find all vehicles where this user is the provider
UserSchema.virtual("myListedVehicles", {
  ref: "Vehicle",
  localField: "_id",
  foreignField: "provider",
});

// Find all trips this user has booked as a customer
UserSchema.virtual("myTrips", {
  ref: "Booking",
  localField: "_id",
  foreignField: "customer",
});

// Find all incoming bookings where this user is the provider
UserSchema.virtual("myEarnings", {
  ref: "Booking",
  localField: "_id",
  foreignField: "provider",
});

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

UserSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

UserSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    },
  );
};

UserSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
};

export const User = mongoose.model("User", UserSchema);
