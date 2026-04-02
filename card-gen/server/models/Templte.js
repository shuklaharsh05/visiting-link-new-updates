const mongoose = require('mongoose');

// Legacy template schema - keeping for backward compatibility
// New templates should be stored in the Category collection
const templateSchema = new mongoose.Schema({
  // Template identification
  templateId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  icon: {
    type: String,
    required: true,
    trim: true
  },
  preview: {
    type: String,
    required: true,
    trim: true
  },

  // Field configuration specific to this template
  fields: {
    required: [{
      type: String,
      trim: true
    }],
    optional: [{
      type: String,
      trim: true
    }],
    sections: [{
      id: {
        type: String,
        required: true,
        trim: true
      },
      name: {
        type: String,
        required: true,
        trim: true
      },
      enabled: {
        type: Boolean,
        default: true
      },
      order: {
        type: Number,
        required: true,
        min: 1
      },
      fields: [{
        type: String,
        trim: true
      }]
    }]
  },

  // Layout configuration
  layout: {
    card: {
      type: String,
      required: true,
      trim: true
    },
    profile: {
      type: String,
      required: true,
      trim: true
    },
    sections: {
      type: String,
      required: true,
      trim: true
    },
    spacing: {
      type: String,
      required: true,
      trim: true
    }
  },

  // Theme configuration
  theme: {
    colors: {
      primary: {
        type: String,
        required: true,
        match: /^#[0-9A-Fa-f]{6}$/
      },
      secondary: {
        type: String,
        required: true,
        match: /^#[0-9A-Fa-f]{6}$/
      },
      background: {
        type: String,
        required: true,
        match: /^#[0-9A-Fa-f]{6}$/
      },
      text: {
        type: String,
        required: true,
        match: /^#[0-9A-Fa-f]{6}$/
      },
      accent: {
        type: String,
        required: true,
        match: /^#[0-9A-Fa-f]{6}$/
      }
    },
    fonts: {
      primary: {
        type: String,
        required: true,
        trim: true
      },
      secondary: {
        type: String,
        required: true,
        trim: true
      }
    },
    effects: {
      gradient: {
        type: String,
        required: true,
        trim: true
      },
      shadow: {
        type: String,
        required: true,
        trim: true
      }
    }
  },

  // Sample data for preview
  sampleData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },

  // Template metadata
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  version: {
    type: String,
    default: '1.0.0',
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true,
  collection: 'templates'
});

// Index for efficient queries
templateSchema.index({ templateId: 1 });
templateSchema.index({ category: 1 });
templateSchema.index({ isActive: 1 });
templateSchema.index({ isDefault: 1 });

// Static method to get template by templateId
templateSchema.statics.findByTemplateId = function(templateId) {
  return this.findOne({ templateId: templateId, isActive: true });
};

// Static method to get templates by category
templateSchema.statics.findByCategory = function(category) {
  return this.find({ category: category, isActive: true }).sort({ templateId: 1 });
};

// Static method to get default template
templateSchema.statics.getDefault = function() {
  return this.findOne({ isDefault: true, isActive: true });
};

// Instance method to get all possible fields for this template
templateSchema.methods.getAllFields = function() {
  const allFields = new Set();
  
  // Add required fields
  this.fields.required.forEach(field => allFields.add(field));
  
  // Add optional fields
  this.fields.optional.forEach(field => allFields.add(field));
  
  // Add section fields
  this.fields.sections.forEach(section => {
    section.fields.forEach(field => allFields.add(field));
  });
  
  return Array.from(allFields);
};

// Instance method to validate data against template fields
templateSchema.methods.validateData = function(data) {
  const errors = [];
  const allFields = this.getAllFields();
  
  // Check required fields
  this.fields.required.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push(`Required field '${field}' is missing or empty`);
    }
  });
  
  // Check for unknown fields
  Object.keys(data).forEach(field => {
    if (!allFields.includes(field)) {
      errors.push(`Unknown field '${field}' is not supported by this template`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

module.exports = mongoose.model('Template', templateSchema);
