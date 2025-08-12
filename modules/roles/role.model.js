const mongoose = require("mongoose");

const allowedRoles = ["rider", "driver", "admin"];

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: allowedRoles,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    }
  },
  {
    timestamps: true // Adds `createdAt` and `updatedAt`
  }
);

module.exports = mongoose.model("Role", roleSchema);
