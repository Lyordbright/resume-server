import { model, Schema } from "mongoose";

const userSchema = new Schema({
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: [true, "Email already exists"],
  },

  firstName: {
    type: String,
    required: [true, "First Name is required"],
  },

  lastName: {
    type: String,
    required: [true, "Last Name is required"],
  },

  password: {
    type: String,
    required: [true, "Password is required"],
    select: false,
    minLength: [6, "Password must not be less than 6 characters"],
  },

  confirmPassword: {
    type: String,
    required: false,
    select: false,
    minLength: [6, "Password must not be less than 6 characters"],
  },

  // Email verification
  emailVerified: {
    type: Boolean,
    default: false,
  },

  verificationToken: {
    type: String,
  },

  verificationTokenExpires: {
    type: Date,
  },
});

const userModel = model("users", userSchema);
export default userModel;
