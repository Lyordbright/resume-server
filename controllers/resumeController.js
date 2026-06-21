import resumeModel from "../models/resumeModel.js";

// GET /resumes/stats
export const getResumeStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [total, downloads, latest] = await Promise.all([
      resumeModel.countDocuments({ user: userId }),
      resumeModel.aggregate([
        { $match: { user: userId } },
        { $group: { _id: null, total: { $sum: "$downloadCount" } } },
      ]),
      resumeModel.findOne({ user: userId }).sort({ updatedAt: -1 }).select("updatedAt"),
    ]);

    return res.status(200).json({
      status: "success",
      data: {
        total,
        downloads: downloads[0]?.total ?? 0,
        lastUpdated: latest?.updatedAt ?? null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /resumes?limit=N
export const getResumes = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 20;

    const resumes = await resumeModel
      .find({ user: userId })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .select("title updatedAt createdAt downloadCount");

    return res.status(200).json({ status: "success", data: resumes });
  } catch (error) {
    next(error);
  }
};

// GET /resumes/:id
export const getResumeById = async (req, res, next) => {
  try {
    const resume = await resumeModel.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({ status: "error", message: "Resume not found" });
    }

    return res.status(200).json({ status: "success", data: resume });
  } catch (error) {
    next(error);
  }
};

// POST /resumes
export const createResume = async (req, res, next) => {
  try {
    const { title, content } = req.body;

    const resume = await resumeModel.create({
      user: req.user._id,
      title: title || "Untitled Resume",
      content: content || {},
    });

    return res.status(201).json({ status: "success", data: resume });
  } catch (error) {
    next(error);
  }
};

// PUT /resumes/:id
export const updateResume = async (req, res, next) => {
  try {
    const { title, content, template } = req.body;

    const resume = await resumeModel.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { title, content, template, updatedAt: Date.now() },
      { new: true }
    );

    if (!resume) {
      return res.status(404).json({ status: "error", message: "Resume not found" });
    }

    return res.status(200).json({ status: "success", data: resume });
  } catch (error) {
    next(error);
  }
};

// DELETE /resumes/:id
export const deleteResume = async (req, res, next) => {
  try {
    const resume = await resumeModel.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({ status: "error", message: "Resume not found" });
    }

    return res.status(200).json({ status: "success", message: "Resume deleted" });
  } catch (error) {
    next(error);
  }
};

// POST /resumes/:id/download
export const trackDownload = async (req, res, next) => {
  try {
    await resumeModel.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $inc: { downloadCount: 1 } }
    );
    return res.status(200).json({ status: "success" });
  } catch (error) {
    next(error);
  }
};