import { User } from "../models/user.model.js";
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
  const { name, email, password, phone } = req.body;
  if (
    [name, email, password].some((field) => String(field || "").trim() === "")
  )
    throw new ApiError(400, "All fields are required!");
  const existedUser = await User.findOne({ $or: [{ email }, { phone }] });
  if (existedUser)
    throw new ApiError(409, "User with this email or phone already exists");
  const avatar_local_path = req?.files?.avatar?.[0]?.path;
  let avatar = {
    url: "https://static.vecteezy.com/system/resources/previews/051/458/534/large_2x/profile-icon-user-profile-username-icon-free-vector.jpg",
  };
  if (avatar_local_path) {
    avatar = await uploadOnCloudinary(avatar_local_path);
  }
  const user = await User.create({
    name,
    email,
    password,
    avatar: avatar.url,
    phone,
  });
  const createdUser = await User.findById(user._id);
  if (!createdUser)
    throw new ApiError(500, "Something went wrong while registering the user");
  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully!"));
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, phone, password } = req.body;
  if (!email && !phone) throw new ApiError(400, "Email or Phone is required");
  const user = await User.findOne({ $or: [{ email }, { phone }] }).select(
    "+password",
  );
  if (!user) throw new ApiError(404, "User not found!");
  const isPasswordValid = user.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError(401, "Incorrect Password!");
  const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(
    user._id,
  );
  const loggedInUser = await User.findById(user._id);
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
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
    secure: true,
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
    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
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
  await user.save({ validateBeforeSave: false });

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
      options: { sort: { startDate: -1 } },
      populate: {
        path: "vehicle",
      },
    })
    .populate({
      path: "myEarnings",
      options: { sort: { createdAt: -1 } },
      populate: {
        path: "customer",
        select: "name email phone avatar",
      },
    });

  if (!userDashboard) {
    throw new ApiError(404, "User account dashboard profile not found.");
  }

  const earningsBreakdown = userDashboard.myEarnings || [];

  const totalPayoutEarned = earningsBreakdown
    .filter((booking) => ["Confirmed", "Completed"].includes(booking.status))
    .reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);

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
        vehiclesHosted: userDashboard.myListedVehicles || [], // Cars they own
        vehiclesRented: userDashboard.myTrips || [], // Trips they took
        financials: {
          totalEarned: totalPayoutEarned,
          totalRentedOutCount: earningsBreakdown.length,
          rentalBookingsList: earningsBreakdown, // Income ledger
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
    throw new ApiError(404, "User not Found");
  }
  const resetToken = crypto.randomBytes(32).toString("hex");
  user.passwordResetToken = resetToken;
  user.passwordResetExpires = Date.now() + 15 * 60 * 1000;
  await user.save({ validateBeforeSave: false });
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  const message = `
    Forgot your password?

    Click this link to reset it:

    ${resetUrl}

    This link expires in 15 minutes.
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
