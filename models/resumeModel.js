import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      default: "Untitled Resume",
      trim: true,
    },
    content: {
      personalInfo: {
        fullName: String,
        email: String,
        phone: String,
        location: String,
        linkedin: String,
        portfolio: String,
        summary: String,
      },
      experience: [
        {
          company: String,
          role: String,
          startDate: String,
          endDate: String,
          current: Boolean,
          description: String,
        },
      ],
      education: [
        {
          institution: String,
          degree: String,
          field: String,
          startDate: String,
          endDate: String,
        },
      ],
      skills: [String],
      certifications: [
        {
          name: String,
          issuer: String,
          date: String,
        },
      ],
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    template: {
      type: String,
      enum: ["classic", "modern", "minimal"],
      default: "classic",
    },
  },
  { timestamps: true }
);

const resumeModel = mongoose.model("Resume", resumeSchema);
export default resumeModel;