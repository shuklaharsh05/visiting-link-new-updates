import Contact from "../models/Contact.js";
import User from "../models/User.js";
import { validationResult } from "express-validator";

const isAdmin = (user) => user && (user.role === "admin" || user.role === "superadmin");
const matchesUser = (reqUser, targetUserId) =>
  reqUser &&
  (reqUser._id?.toString?.() === targetUserId?.toString?.() ||
    reqUser.id?.toString?.() === targetUserId?.toString?.());

// @desc    Create a new contact for a user
// @route   POST /api/contacts
// @access  Private
export const createContact = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { userId, name, email, phone, whatsapp, notes } = req.body;

    if (!userId || !name) {
      return res.status(400).json({
        success: false,
        message: "userId and name are required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Only allow owner or admin to create contact
    if (!isAdmin(req.user) && !matchesUser(req.user, userId)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to add contact for this user",
      });
    }

    // Build contact object, explicitly including whatsapp if provided
    const contactData = {
      userId,
      name,
      email: email || undefined,
      phone: phone || undefined,
      whatsapp: whatsapp || undefined,  // Explicitly include whatsapp
      notes: notes || undefined,
    };

    const contact = await Contact.create(contactData);

    res.status(201).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    console.error("Error creating contact:", error);
    res.status(500).json({
      success: false,
      message: "Error creating contact",
      error: error.message,
    });
  }
};

// @desc    Get contacts for a user
// @route   GET /api/contacts/user/:userId
// @access  Private
export const getContactsByUser = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const { userId } = req.params;

    // Only allow owner or admin to read contacts
    if (!isAdmin(req.user) && !matchesUser(req.user, userId)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view contacts for this user",
      });
    }

    const query = { userId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { whatsapp: { $regex: search, $options: "i" } },
      ];
    }

    const [contacts, total] = await Promise.all([
      Contact.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit)),
      Contact.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        contacts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalContacts: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching contacts",
      error: error.message,
    });
  }
};

// @desc    Update a contact
// @route   PUT /api/contacts/:contactId
// @access  Private
export const updateContact = async (req, res) => {
  try {
    const { contactId } = req.params;
    const updates = req.body;

    const contact = await Contact.findById(contactId);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    // Only allow owner or admin to update
    if (!isAdmin(req.user) && !matchesUser(req.user, contact.userId)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this contact",
      });
    }

    const allowedFields = ["name", "email", "phone", "whatsapp", "notes"];
    allowedFields.forEach((field) => {
      if (field in updates) {
        contact[field] = updates[field];
      }
    });

    await contact.save();

    res.json({
      success: true,
      data: contact,
    });
  } catch (error) {
    console.error("Error updating contact:", error);
    res.status(500).json({
      success: false,
      message: "Error updating contact",
      error: error.message,
    });
  }
};

// @desc    Delete a contact
// @route   DELETE /api/contacts/:contactId
// @access  Private
export const deleteContact = async (req, res) => {
  try {
    const { contactId } = req.params;

    const contact = await Contact.findById(contactId);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    // Only allow owner or admin to delete
    if (!isAdmin(req.user) && !matchesUser(req.user, contact.userId)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this contact",
      });
    }

    await Contact.findByIdAndDelete(contactId);

    res.json({
      success: true,
      message: "Contact deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting contact:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting contact",
      error: error.message,
    });
  }
};

