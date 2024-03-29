import { NextFunction, Request, Response } from "express";
import UserModels from "../Models/UserModels";
import { AppError, HTTPCODES } from "../Utils/AppError";
import bcrypt from "bcrypt";
import AsyncHandler from "../Utils/AsyncHandler";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { OTPAccountVerification } from "../Emails/EmailAuth";

// Get all users:
export const GetUser = async (req: Request, res: Response) => {
  try {
    const user = await UserModels.find();

    return res.status(200).json({
      message: "All users successfully gotten",
      data: user,
    });
  } catch (err: any) {
    return res.status(404).json({
      message: "An error occured in getting all users",
      data: err.message,
    });
  }
};

// Get a single User:
export const GetSingleUser = AsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const singleuser = await UserModels.findById(req.params.userID).populate({
      path: "predict",
    });

    if (!singleuser) {
      next(
        new AppError({
          message: "User not found",
          httpcode: HTTPCODES.NOT_FOUND,
        })
      );
    }

    return res.status(200).json({
      message: "Successfully got this single user",
      data: singleuser,
    });
  }
);

// Users Registration:
export const UsersRegistration = AsyncHandler(
  async (req: any, res: Response, next: NextFunction) => {
    const { name, email, password } = req.body;

    const token = crypto.randomBytes(48).toString("hex");
    const OTP = crypto.randomBytes(2).toString("hex");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const findEmail = await UserModels.findOne({ email });

    if (findEmail) {
      next(
        new AppError({
          message: "User with this account already exists",
          httpcode: HTTPCODES.FORBIDDEN,
        })
      );
    }

    const Users = await UserModels.create({
      name,
      email,
      password: hashedPassword,
      confirmPassword: hashedPassword,
      status: "User",
      token,
      OTP,
      verified: false,
    });
    OTPAccountVerification(Users);

    return res.status(201).json({
      message: "Successfully created User",
      data: Users,
    });
  }
);

// Once the user clicks on the activate button in the email, they are now verified users
// Verify a user:
export const UsersVerification = AsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userID } = req.params;
    const User = await UserModels.findByIdAndUpdate(
      userID,
      {
        OTP: "",
        verified: true,
      },
      { new: true }
    );

    if (User) {
      return res.status(HTTPCODES.OK).json({
        message: "User Verification Successfull",
        data: User,
      });
    } else {
      next(
        new AppError({
          message: "Verification failed",
          httpcode: HTTPCODES.BAD_REQUEST,
        })
      );
    }
  }
);

//  When users login, after 5 mins they are logged out
// Users Login:
export const UsersLogin = AsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    const CheckUser = await UserModels.findOne({ email });

    const CheckPassword = await bcrypt.compare(password, CheckUser!.password);

    if (CheckPassword) {
      if (CheckUser) {
        if (CheckUser?.verified && CheckUser?.OTP === "") {
          // The access token that expires every 2 mins
          // const AccessToken = jwt.sign(
          //   {
          //     id: CheckUser?._id,
          //   },
          //   "AccessTokenSecret",
          //   {
          //     expiresIn: "40s",
          //   }
          // );
          // The refresh token
          // const RefreshToken = jwt.sign(
          //   {
          //     id: CheckUser?._id,
          //   },
          //   "RefreshTokenSecret",
          //   { expiresIn: "1m" }
          // );

          return res.status(HTTPCODES.OK).json({
            message: "User Login successfull",
            data: CheckUser,
            // AccessToken: AccessToken,
            // RefreshToken: RefreshToken,
          });
        } else {
          next(
            new AppError({
              message: "User not Verified",
              httpcode: HTTPCODES.NOT_FOUND,
            })
          );
        }
      } else {
        next(
          new AppError({
            message: "User not Found",
            httpcode: HTTPCODES.NOT_FOUND,
          })
        );
      }
    } else {
      next(
        new AppError({
          message: "Email or password not correct",
          httpcode: HTTPCODES.CONFLICT,
        })
      );
    }
  }
);

// Refresh the token again for every time they login:
export const RefreshUserToken = AsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { RefreshToken } = req.body;

      jwt.verify(
        RefreshToken,
        "RefreshTokenSecret",
        (err: any, payload: any) => {
          if (err) {
            throw err;
          } else {
            console.log(payload);

            const AccessToken = jwt.sign(
              {
                id: payload.id,
              },
              "AccessTokenSecret",
              {
                expiresIn: "40s",
              }
            );

            const RefreshToken = req.body.RefreshToken;

            return res.status(HTTPCODES.OK).json({
              message: "New token generated",
              AccessTokenData: AccessToken,
              RefreshTokenData: RefreshToken,
            });
          }
        }
      );
    } catch (error) {
      return res.status(HTTPCODES.INTERNAL_SERVER_ERROR).json({
        message: "An error occured in genertaing new token",
        data: error,
      });
    }
  }
);
// Update one user:
export const updateOneUser = AsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.body;

    const user = await UserModels.findByIdAndUpdate(
      req.params.userID,
      { name },
      { new: true }
    );

    if (!user) {
      next(
        new AppError({
          message: "An error occured in updating name",
          httpcode: HTTPCODES.INTERNAL_SERVER_ERROR,
        })
      );
    }

    return res.status(201).json({
      message: "Successfully updated the user's name",
      data: user,
    });
  }
);

// Delete a user:
export const DeleteAUser = AsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await UserModels.findByIdAndDelete(req.params.userID);

    if (!user) {
      next(
        new AppError({
          message: "An error occured in deleting this user",
          httpcode: HTTPCODES.INTERNAL_SERVER_ERROR,
        })
      );
    }

    return res.status(201).json({
      message: "Successfully deleted this user",
      data: user,
    });
  }
);
