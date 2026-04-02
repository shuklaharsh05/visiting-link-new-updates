import Submission from "../models/Submission.js";

// Normalize incoming payload to our schema (supports legacy shapes)
const normalizePayload = (payload = {}) => {
  const normalized = { ...payload };

  // contact -> flatten
  if (payload.contact) {
    normalized.phone = normalized.phone ?? payload.contact.phone;
    normalized.email = normalized.email ?? payload.contact.email;
    normalized.website = normalized.website ?? payload.contact.website;
  }

  // socialLinks -> social
  if (payload.socialLinks && !payload.social) {
    normalized.social = {
      facebook: payload.socialLinks.facebook,
      instagram: payload.socialLinks.instagram,
      linkedin: payload.socialLinks.linkedin,
      twitter: payload.socialLinks.twitter,
    };
  }

  // portfolio: allow string URLs array or structured
  if (Array.isArray(payload.portfolio)) {
    normalized.portfolio = payload.portfolio.map((item) => {
      if (typeof item === "string") {
        return { title: "", description: "", image: item };
      }
      return item;
    });
  }

  // appointments singular -> array shape
  if (payload.appointment && !payload.appointments) {
    normalized.appointments = [
      { day: "", time: payload.appointment, available: true },
    ];
  }

  // Ensure design/layout objects exist for style + order persistence
  if (!normalized.design) normalized.design = {};
  if (!normalized.layout) normalized.layout = {};

  return normalized;
};

// Get all submissions
export const getSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find();
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get submission by id
export const getSubmissionById = async (req, res) => {
  try {
    const doc = await Submission.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Submission not found" });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Create new submission
export const createSubmission = async (req, res) => {
  try {
    const payload = normalizePayload(req.body);
    const newSubmission = new Submission(payload);
    await newSubmission.save();
    res.status(201).json(newSubmission);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update submission status or details
export const updateSubmission = async (req, res) => {
  try {
    const payload = normalizePayload(req.body);
    const updated = await Submission.findByIdAndUpdate(
      req.params.id,
      payload,
      {
        new: true,
      }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete a submission
export const deleteSubmission = async (req, res) => {
  try {
    await Submission.findByIdAndDelete(req.params.id);
    res.json({ message: "Submission deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
