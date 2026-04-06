import Admin from '../models/Admin.js';
import Inquiry from '../models/Inquiry.js';
import Card from '../models/Card.js';
import User from '../models/User.js';

const ADMIN_TYPES = ['in-house', 'corporate', 'individual'];

function isValidAdminType(type) {
  return type && ADMIN_TYPES.includes(type);
}

// Get all admins (superadmin only)
export const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find({ isActive: true }).lean();
    const adminIds = admins.map((a) => a._id).filter(Boolean);

    const usersByAdmin = new Map();
    const cardsByAdmin = new Map();

    if (adminIds.length > 0) {
      const [userAgg, cardAgg] = await Promise.all([
        User.aggregate([
          { $match: { createdByAdmin: { $in: adminIds } } },
          { $group: { _id: "$createdByAdmin", count: { $sum: 1 } } },
        ]),
        Card.aggregate([
          { $match: { createdByAdmin: { $in: adminIds } } },
          { $group: { _id: "$createdByAdmin", count: { $sum: 1 } } },
        ]),
      ]);
      userAgg.forEach((r) => {
        if (r._id) usersByAdmin.set(String(r._id), r.count || 0);
      });
      cardAgg.forEach((r) => {
        if (r._id) cardsByAdmin.set(String(r._id), r.count || 0);
      });
    }

    const withStats = admins.map((a) => ({
      ...a,
      usersCreatedCount: usersByAdmin.get(String(a._id)) ?? 0,
      cardsCreatedCount: cardsByAdmin.get(String(a._id)) ?? 0,
    }));

    res.json(withStats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get admin by ID (superadmin only)
export const getAdminById = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findById(id);
    
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    res.json(admin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new admin (superadmin only)
export const createAdmin = async (req, res) => {
  try {
    const { name, password, type, costPerCard } = req.body;
    
    if (!name || !password) {
      return res.status(400).json({ error: 'Name and password are required' });
    }
    if (type && !isValidAdminType(type)) {
      return res.status(400).json({ error: 'Invalid admin type' });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ name });
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin with this name already exists' });
    }
    
    const newAdmin = new Admin({
      name,
      password,
      ...(type ? { type } : {}),
      ...(typeof costPerCard !== "undefined" ? { costPerCard } : {}),
      walletBalance: 0,
      transactions: [],
    });
    await newAdmin.save();
    
    // Return admin without password
    const adminResponse = await Admin.findById(newAdmin._id);
    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      admin: adminResponse
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update admin password only (superadmin only)
export const updateAdminPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password is required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const admin = await Admin.findById(id).select('+password');
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    admin.password = password;
    await admin.save();

    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update admin profile/settings (superadmin only) — password not required; use updateAdminPassword to change password
export const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isActive, type, costPerCard } = req.body;

    const admin = await Admin.findById(id);

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    if (name) admin.name = name;
    if (typeof isActive === 'boolean') admin.isActive = isActive;
    if (typeof type !== 'undefined' && type !== null && type !== '') {
      if (!isValidAdminType(type)) {
        return res.status(400).json({ error: 'Invalid admin type' });
      }
      admin.type = type;
    }
    if (typeof costPerCard !== "undefined") admin.costPerCard = costPerCard;
    await admin.save();
    
    res.json({
      success: true,
      message: 'Admin updated successfully',
      admin: await Admin.findById(id)
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete admin (superadmin only)
export const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if admin has assigned inquiries
    const assignedInquiries = await Inquiry.find({ assignedTo: { $exists: true, $ne: null } });
    const adminToDelete = await Admin.findById(id);
    
    if (adminToDelete && assignedInquiries.some(inquiry => inquiry.assignedTo === adminToDelete.name)) {
      return res.status(400).json({ 
        error: 'Cannot delete admin with assigned inquiries. Please reassign inquiries first.' 
      });
    }
    
    const admin = await Admin.findByIdAndDelete(id);
    
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    res.json({ message: 'Admin deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Assign inquiry to admin
export const assignInquiry = async (req, res) => {
  try {
    const { inquiryId } = req.params;
    const { assignedTo } = req.body;
    
    const inquiry = await Inquiry.findByIdAndUpdate(
      inquiryId,
      { assignedTo },
      { new: true }
    );
    
    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }
    
    res.json({
      success: true,
      message: 'Inquiry assigned successfully',
      inquiry
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get inquiries for specific admin
export const getAdminInquiries = async (req, res) => {
  try {
    const { adminName } = req.params;
    
    const inquiries = await Inquiry.getByAssignedAdmin(adminName);
    res.json(inquiries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Helper function to format date in a specific timezone
const formatDateInTimezone = (date, timezone) => {
  if (!date) return null;
  try {
    const d = new Date(date);
    const formatter = new Intl.DateTimeFormat('en-CA', { 
      timeZone: timezone, 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
    return formatter.format(d); // Returns YYYY-MM-DD format
  } catch (e) {
    // Fallback to UTC if timezone conversion fails
    const d = new Date(date);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
};

// Calendar stats per admin (superadmin only)
// Query: start=ISO end=ISO (inclusive)
export const getCalendarStats = async (req, res) => {
  try {
    // console.log('getCalendarStats called with params:', req.query);
    
    const { start, end, tz } = req.query;
    const startDate = start ? new Date(start) : new Date(new Date().toDateString());
    const endDate = end ? new Date(end) : new Date();
    
    // console.log('Parsed dates:', { startDate, endDate });
    
    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      // console.error('Invalid date parameters:', { start, end });
      return res.status(400).json({ success: false, message: 'Invalid date parameters' });
    }

    // Validate and sanitize timezone
    let timezone = 'UTC';
    if (tz) {
      try {
        // Test if timezone is valid
        Intl.DateTimeFormat(undefined, { timeZone: tz });
        timezone = tz;
        // console.log('Using timezone:', timezone);
      } catch (e) {
        console.warn(`Invalid timezone "${tz}", falling back to UTC`);
        timezone = 'UTC';
      }
    }

    // Verify models are available
    if (!Inquiry || !Card) {
      console.error('Models not available:', { Inquiry: !!Inquiry, Card: !!Card });
      throw new Error('Database models not initialized');
    }

    // Inquiries assigned per day per admin
    // Use updatedAt to approximate the date an inquiry was assigned/reassigned to an admin
    // Note: We'll do timezone conversion in JavaScript instead of MongoDB to avoid compatibility issues
    // console.log('Fetching inquiries...');
    
    let inquiriesData = [];
    try {
      // Use find instead of aggregate for simplicity and reliability
      inquiriesData = await Inquiry.find({
        updatedAt: { $gte: startDate, $lte: endDate },
        assignedTo: { $ne: null, $exists: true }
      }).select('assignedTo updatedAt cardGenerated').lean();
      // console.log(`Found ${inquiriesData.length} inquiries`);
    } catch (err) {
      console.error('Inquiries query error:', err);
      throw new Error(`Failed to fetch inquiries: ${err.message}`);
    }

    // Cards generated per day per admin
    // console.log('Fetching cards...');
    
    let cardsData = [];
    try {
      // Use find instead of aggregate for simplicity and reliability
      cardsData = await Card.find({
        createdAt: { $gte: startDate, $lte: endDate },
        adminId: { $ne: null, $exists: true }
      }).select('createdAt adminId').lean();
      // console.log(`Found ${cardsData.length} cards`);
    } catch (err) {
      console.error('Cards query error:', err);
      throw new Error(`Failed to fetch cards: ${err.message}`);
    }

    // Process inquiries: convert dates to timezone and group
    // console.log('Processing inquiries...');
    const inquiriesByDay = {};
    for (const item of inquiriesData) {
      try {
        if (!item.assignedTo || !item.updatedAt) continue;
        const day = formatDateInTimezone(item.updatedAt, timezone);
        if (!day) continue;
        
        const key = `${day}_${item.assignedTo}`;
        if (!inquiriesByDay[key]) {
          inquiriesByDay[key] = { day, admin: item.assignedTo, totalInquiries: 0, pendingInquiries: 0 };
        }
        inquiriesByDay[key].totalInquiries += 1;
        if (item.cardGenerated === false || item.cardGenerated === undefined) {
          inquiriesByDay[key].pendingInquiries += 1;
        }
      } catch (e) {
        console.warn('Error processing inquiry item:', e);
        continue;
      }
    }

    // Process cards: convert dates to timezone and group
    // console.log('Processing cards...');
    const cardsByDay = {};
    for (const item of cardsData) {
      try {
        if (!item.adminId || !item.createdAt) continue;
        const day = formatDateInTimezone(item.createdAt, timezone);
        if (!day) continue;
        
        const key = `${day}_${item.adminId}`;
        if (!cardsByDay[key]) {
          cardsByDay[key] = { day, admin: item.adminId, totalCards: 0 };
        }
        cardsByDay[key].totalCards += 1;
      } catch (e) {
        console.warn('Error processing card item:', e);
        continue;
      }
    }

    // Combine results by day and admin
    // console.log('Combining results...');
    const byDay = {};
    
    // Add inquiries
    for (const key in inquiriesByDay) {
      const item = inquiriesByDay[key];
      if (!byDay[item.day]) byDay[item.day] = {};
      if (!byDay[item.day][item.admin]) {
        byDay[item.day][item.admin] = { totalInquiries: 0, totalCards: 0, pendingInquiries: 0 };
      }
      byDay[item.day][item.admin].totalInquiries += item.totalInquiries;
      byDay[item.day][item.admin].pendingInquiries += item.pendingInquiries;
    }

    // Add cards
    for (const key in cardsByDay) {
      const item = cardsByDay[key];
      if (!byDay[item.day]) byDay[item.day] = {};
      if (!byDay[item.day][item.admin]) {
        byDay[item.day][item.admin] = { totalInquiries: 0, totalCards: 0, pendingInquiries: 0 };
      }
      byDay[item.day][item.admin].totalCards += item.totalCards;
    }

    // Convert to array sorted by day desc
    const days = Object.keys(byDay)
      .sort((a, b) => a < b ? 1 : -1)
      .map(d => ({ 
        day: d, 
        admins: Object.entries(byDay[d]).map(([admin, vals]) => ({ admin, ...vals })) 
      }));

    // console.log(`Returning ${days.length} days of stats`);
    res.json({ success: true, data: { days } });
  } catch (err) {
    console.error('getCalendarStats error:', err);
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    
    // Ensure we always send a response
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to load calendar stats', 
        error: err.message || 'Unknown error',
        errorName: err.name,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  }
};
