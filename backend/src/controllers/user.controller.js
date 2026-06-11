import { User } from "../models/user.model.js";
import { Vehicle } from "../models/vehicle.model.js";
import { Booking } from "../models/booking.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return {
      accessToken,
      refreshToken,
    };
  } catch (err) {
    throw new ApiError(
      500,
      err?.message || "Something went wrong while generating tokens",
    );
  }
};

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (
    [name, email, password].some((field) => String(field || "").trim() === "")
  )
    throw new ApiError(400, "All fields are required!");

  const existedUser = await User.findOne({ email });
  if (existedUser) {
    throw new ApiError(409, "An account with this email already exists");
  }
  const user = await User.create({
    name,
    email,
    password,
  });
  const createdUser = await User.findById(user._id);
  if (!createdUser)
    throw new ApiError(500, "Something went wrong while registering the user");
  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully!"));
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email) throw new ApiError(400, "Email is required");

  const user = await User.findOne({ email }).select("+password");
  if (!user) throw new ApiError(404, "No account found with this email.");
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid)
    throw new ApiError(401, "Incorrect password. Please try again.");
  const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(
    user._id,
  );
  const loggedInUser = await User.findById(user._id);
  const accessTokenOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day
  };
  const refreshTokenOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 24 * 60 * 60 * 1000, // 10 days
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, accessTokenOptions)
    .cookie("refreshToken", refreshToken, refreshTokenOptions)
    .json(new ApiResponse(200, loggedInUser, "User logged in successfully!"));
});

export const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    },
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token !");
    }
    if (user?.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Invalid Refresh Token !");
    }
    const accessTokenOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day
    };
    const refreshTokenOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 10 * 24 * 60 * 60 * 1000, // 10 days
    };
    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);
    return res
      .status(200)
      .cookie("accessToken", accessToken, accessTokenOptions)
      .cookie("refreshToken", newRefreshToken, refreshTokenOptions)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access Token Refreshed !",
        ),
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token");
  }
});

export const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid Old Password");
  }
  user.password = newPassword;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

export const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required !");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error uploading avatar !");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    },
  );

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar Updated Successfully !"));
});

export const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;

  const updateFields = {};
  if (name && name.trim()) updateFields.name = name.trim();
  if (phone !== undefined) {
    // Allow clearing phone or setting a new one
    // If phone changed, reset verification
    const currentUser = await User.findById(req.user?._id);
    if (currentUser.phone !== phone) {
      updateFields.isVerifiedPhone = false;
    }
    updateFields.phone = phone;
  }

  if (Object.keys(updateFields).length === 0) {
    throw new ApiError(400, "No fields to update");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: updateFields },
    { new: true, runValidators: true },
  );

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Profile updated successfully!"));
});

export const sendEmailVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id);

  if (!user) throw new ApiError(404, "User not found");
  if (user.isVerifiedEmail) {
    throw new ApiError(400, "Email is already verified");
  }

  const verifyToken = crypto.randomBytes(32).toString("hex");
  user.emailVerificationToken = verifyToken;
  user.emailVerificationExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
  await user.save({ validateBeforeSave: false });

  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${verifyToken}`;
  const message = `
    Welcome to AutoRent!

    Please verify your email address by clicking the link below:

    ${verifyUrl}

    This link expires in 15 minutes.

    If you did not request this, please ignore this email.
  `;

  await sendEmail({
    email: user.email,
    subject: "Verify Your Email - AutoRent",
    message,
  });

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Verification email sent successfully!"));
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "Invalid or expired verification link");
  }

  user.isVerifiedEmail = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Email verified successfully!"));
});

export const sendPhoneOtp = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id);
  if (!user) throw new ApiError(404, "User not found");
  if (!user.phone) {
    throw new ApiError(400, "Please add a phone number first before verifying");
  }
  if (user.isVerifiedPhone) {
    throw new ApiError(400, "Phone number is already verified");
  }

  // Generate a random 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.phoneOtp = otp;
  user.phoneOtpExpires = Date.now() + 5 * 60 * 1000; // 5 mins validity
  await user.save({ validateBeforeSave: false });

  // Dev-mode action: Log OTP directly to the console
  console.log("=================================================");
  console.log(
    `[DEV MODE] SMS OTP for User ${user.name} (${user.phone}): ${otp}`,
  );
  console.log("=================================================");

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "OTP sent successfully! (Logged to console in dev)",
      ),
    );
});

export const verifyPhoneOtp = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  if (!otp) throw new ApiError(400, "OTP is required");

  const user = await User.findOne({
    _id: req.user?._id,
    phoneOtp: otp,
    phoneOtpExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  user.isVerifiedPhone = true;
  user.phoneOtp = undefined;
  user.phoneOtpExpires = undefined;
  await user.save({ validateBeforeSave: false });

  res
    .status(200)
    .json(new ApiResponse(200, user, "Phone number verified successfully!"));
});

export const getUserDashboardData = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized request! User session not found.");
  }

  const userDashboard = await User.findById(userId)
    .populate({
      path: "myListedVehicles",
    })
    .populate({
      path: "myTrips",
      match: { status: { $ne: "Locked" } },
      options: { sort: { createdAt: -1 } },
      populate: {
        path: "vehicle",
      },
    })
    .populate({
      path: "myEarnings",
      match: { status: { $nin: ["Locked", "Cancelled"] } },
      options: { sort: { createdAt: -1 } },
      populate: [
        {
          path: "customer",
          select: "name email phone avatar",
        },
        {
          path: "vehicle",
          select: "brand model year type images address pricePerDay",
        },
      ],
    });

  if (!userDashboard) {
    throw new ApiError(404, "User account dashboard profile not found.");
  }

  const earningsBreakdown = userDashboard.myEarnings || [];

  const completedBookings = earningsBreakdown.filter(
    (b) => b.status === "Completed",
  );

  // Net earnings = 95% host payout (after 5% platform commission)
  const totalPayoutEarned = completedBookings.reduce(
    (sum, b) => sum + (b.hostPayout || b.totalPrice * 0.95 || 0),
    0,
  );
  const totalPlatformFeeDeducted = completedBookings.reduce(
    (sum, b) => sum + (b.platformFee || b.totalPrice * 0.05 || 0),
    0,
  );

  const profileDetails = {
    _id: userDashboard._id,
    name: userDashboard.name,
    email: userDashboard.email,
    avatar: userDashboard.avatar,
    isVerifiedEmail: userDashboard.isVerifiedEmail,
    isVerifiedPhone: userDashboard.isVerifiedPhone,
  };

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        profile: profileDetails,
        vehiclesHosted: userDashboard.myListedVehicles || [],
        vehiclesRented: userDashboard.myTrips || [],
        financials: {
          totalEarned: Math.round(totalPayoutEarned), // 95% net to host
          platformFeeDeducted: Math.round(totalPlatformFeeDeducted), // 5% platform cut
          totalRentedOutCount: earningsBreakdown.length,
          rentalBookingsList: earningsBreakdown,
        },
      },
      "User dashboard profile data fetched successfully!",
    ),
  );
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "No account exists with this email address.");
  }
  const resetToken = crypto.randomBytes(32).toString("hex");
  user.passwordResetToken = resetToken;
  user.passwordResetExpires = Date.now() + 5 * 60 * 1000;
  await user.save({ validateBeforeSave: false });
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  const message = `
    Forgot your password?

    Click this link to reset it:

    ${resetUrl}

    This link expires in 5 minutes.
  `;
  await sendEmail({
    email: user.email,
    subject: "Password Reset",
    message: message,
  });
  res.status(200).json(new ApiResponse(200, {}, "Reset email sent"));
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: {
      $gt: Date.now(),
    },
  });
  if (!user) throw new ApiError(400, "Invalid or expired token");
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed Successfully !"));
});
