import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import Card from '../models/Card.js';
import { validationResult } from 'express-validator';

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private
export const getAllAppointments = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      cardId, 
      userId, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      fields 
    } = req.query;
    
    const query = {};

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Filter by card if provided
    if (cardId) {
      query.cardId = cardId;
    }

    // Filter by user if provided
    if (userId) {
      query.userId = userId;
    }

    // Validate sortBy field to prevent injection
    const allowedSortFields = ['createdAt', 'appointmentDate', 'status', 'name'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    // Build projection for selective field loading
    let projection = {};
    if (fields) {
      const requestedFields = fields.split(',');
      requestedFields.forEach(field => {
        projection[field.trim()] = 1;
      });
    }

    // Use aggregation pipeline for better performance
    const pipeline = [
      { $match: query },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
          pipeline: [
            { $project: { name: 1, email: 1, phone: 1 } }
          ]
        }
      },
      {
        $lookup: {
          from: 'cards',
          localField: 'cardId',
          foreignField: '_id',
          as: 'card',
          pipeline: [
            { $project: { title: 1, categoryId: 1, templateId: 1 } }
          ]
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$card', preserveNullAndEmptyArrays: true } },
      { $sort: { [sortField]: sortDirection } },
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) }
    ];

    // Add projection if specific fields requested
    if (Object.keys(projection).length > 0) {
      pipeline.push({ $project: projection });
    }

    // Get appointments and total count in parallel
    const [appointments, total] = await Promise.all([
      Appointment.aggregate(pipeline),
      Appointment.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        appointments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalAppointments: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: error.message
    });
  }
};

// @desc    Get appointment by ID
// @route   GET /api/appointments/:id
// @access  Private
export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('userId', 'name email phone businessType')
      .populate('cardId', 'title categoryId templateId data');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appointment',
      error: error.message
    });
  }
};

// @desc    Create new appointment
// @route   POST /api/appointments
// @access  Public
export const createAppointment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { cardId, name, email, phone, message, appointmentDate, appointmentTime } = req.body;

    // Validate required fields
    if (!cardId || !name || !email || !phone || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: cardId, name, email, phone, message'
      });
    }

    // Check if card exists
    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }

    // Link to existing user if present; do NOT create new user for public appointments
    const existingUser = await User.findOne({ email });

    const appointment = new Appointment({
      userId: existingUser ? existingUser._id : undefined,
      cardId,
      name,
      email,
      phone,
      message,
      appointmentDate: appointmentDate ? new Date(appointmentDate) : undefined,
      appointmentTime
    });

    await appointment.save();

    // If user exists, add appointment to user's appointments array
    if (existingUser) {
      existingUser.appointments.push(appointment._id);
      await existingUser.save();
    }

    res.status(201).json({
      success: true,
      message: 'Appointment submitted successfully',
      data: {
        ...appointment.toObject(),
        user: existingUser ? {
          id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email
        } : null,
        card: {
          id: card._id,
          title: card.title,
          categoryId: card.categoryId
        }
      }
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating appointment',
      error: error.message
    });
  }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
export const updateAppointment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { status, adminNotes, appointmentDate, appointmentTime, response, responded } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
    if (appointmentDate) updateData.appointmentDate = new Date(appointmentDate);
    if (appointmentTime) updateData.appointmentTime = appointmentTime;
    if (response) updateData.response = response;
    if (typeof responded === 'boolean') updateData.responded = responded;

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('userId', 'name email phone')
     .populate('cardId', 'title categoryId');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating appointment',
      error: error.message
    });
  }
};

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private
export const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Remove appointment from user's appointments array if linked
    if (appointment.userId) {
      await User.findByIdAndUpdate(
        appointment.userId,
        { $pull: { appointments: appointment._id } }
      );
    }

    await Appointment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting appointment',
      error: error.message
    });
  }
};

// @desc    Get appointments by user
// @route   GET /api/appointments/user/:userId
// @access  Private
export const getAppointmentsByUser = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const query = { userId: req.params.userId };

    if (status) {
      query.status = status;
    }

    // Validate sortBy field to prevent injection
    const allowedSortFields = ['createdAt', 'appointmentDate', 'status'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    // Use aggregation pipeline for better performance with large datasets
    const pipeline = [
      { $match: query },
      {
        $lookup: {
          from: 'cards',
          localField: 'cardId',
          foreignField: '_id',
          as: 'card',
          pipeline: [
            { $project: { title: 1, categoryId: 1, templateId: 1 } }
          ]
        }
      },
      { $unwind: { path: '$card', preserveNullAndEmptyArrays: true } },
      { $sort: { [sortField]: sortDirection } },
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          phone: 1,
          message: 1,
          status: 1,
          appointmentDate: 1,
          appointmentTime: 1,
          responded: 1,
          createdAt: 1,
          cardId: 1,
          card: 1
        }
      }
    ];

    // Get appointments and total count in parallel
    const [appointments, total] = await Promise.all([
      Appointment.aggregate(pipeline),
      Appointment.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        appointments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalAppointments: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user appointments',
      error: error.message
    });
  }
};

// @desc    Get appointments by card
// @route   GET /api/appointments/card/:cardId
// @access  Private
export const getAppointmentsByCard = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { cardId: req.params.cardId };

    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Appointment.countDocuments(query);

    res.json({
      success: true,
      data: {
        appointments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalAppointments: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching card appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching card appointments',
      error: error.message
    });
  }
};

// @desc    Get appointment statistics
// @route   GET /api/appointments/stats
// @access  Private
export const getAppointmentStats = async (req, res) => {
  try {
    const { userId, cardId } = req.query;
    const matchStage = {};
    
    if (userId) matchStage.userId = userId;
    if (cardId) matchStage.cardId = cardId;

    // Use aggregation pipeline for efficient statistics calculation
    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ];

    const [statusStats, totalCount] = await Promise.all([
      Appointment.aggregate(pipeline),
      Appointment.countDocuments(matchStage)
    ]);

    // Convert array to object for easier access
    const statusBreakdown = {};
    statusStats.forEach(stat => {
      statusBreakdown[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: {
        totalAppointments: totalCount,
        pendingAppointments: statusBreakdown.Pending || 0,
        confirmedAppointments: statusBreakdown.Confirmed || 0,
        cancelledAppointments: statusBreakdown.Cancelled || 0,
        completedAppointments: statusBreakdown.Completed || 0,
        statusBreakdown
      }
    });
  } catch (error) {
    console.error('Error fetching appointment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appointment statistics',
      error: error.message
    });
  }
};

// @desc    Get user appointment summary (lightweight)
// @route   GET /api/appointments/user/:userId/summary
// @access  Private
export const getUserAppointmentSummary = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Get only essential appointment data for summary
    const pipeline = [
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalAppointments: { $sum: 1 },
          pendingAppointments: {
            $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
          },
          confirmedAppointments: {
            $sum: { $cond: [{ $eq: ['$status', 'Confirmed'] }, 1, 0] }
          },
          completedAppointments: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
          },
          recentAppointments: {
            $push: {
              _id: '$_id',
              status: '$status',
              appointmentDate: '$appointmentDate',
              createdAt: '$createdAt'
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalAppointments: 1,
          pendingAppointments: 1,
          confirmedAppointments: 1,
          completedAppointments: 1,
          recentAppointments: {
            $slice: [
              {
                $sortArray: {
                  input: '$recentAppointments',
                  sortBy: { createdAt: -1 }
                }
              },
              5
            ]
          }
        }
      }
    ];

    const result = await Appointment.aggregate(pipeline);
    const summary = result[0] || {
      totalAppointments: 0,
      pendingAppointments: 0,
      confirmedAppointments: 0,
      completedAppointments: 0,
      recentAppointments: []
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching user appointment summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user appointment summary',
      error: error.message
    });
  }
};
