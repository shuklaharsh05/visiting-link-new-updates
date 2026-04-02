import mongoose from 'mongoose';

// Field schema for template fields
const FieldSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['text', 'email', 'tel', 'textarea', 'image', 'url', 'select', 'checkbox', 'date', 'number', 'object'],
    trim: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  required: {
    type: Boolean,
    default: false
  },
  placeholder: {
    type: String,
    trim: true
  },
  options: [{
    value: String,
    label: String
  }],
  validation: {
    minLength: Number,
    maxLength: Number,
    pattern: String,
    min: Number,
    max: Number
  },
  multiple: {
    type: Boolean,
    default: false
  }
}, { _id: false });

// Extra section schema for customizable templates
const ExtraSectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  allowed: {
    type: Boolean,
    default: true
  },
  fields: [FieldSchema]
}, { _id: false });

// Customizable options schema
const CustomizableOptionsSchema = new mongoose.Schema({
  background: {
    type: {
      type: String,
      enum: ['color', 'image', 'gradient'],
      required: true
    },
    default: {
      type: String,
      required: true
    },
    options: [String] // Available options if applicable
  },
  icons: {
    type: {
      type: String,
      enum: ['select', 'upload'],
      required: true
    },
    options: [{
      value: String,
      label: String,
      icon: String // Icon class or URL
    }],
    default: String
  },
  extraSections: [ExtraSectionSchema],
  layout: {
    type: {
      type: String,
      enum: ['vertical', 'horizontal', 'grid'],
      default: 'vertical'
    },
    options: [String]
  },
  typography: {
    fontFamily: {
      type: String,
      default: 'Inter, sans-serif'
    },
    fontSize: {
      type: String,
      default: '14px'
    },
    fontWeight: {
      type: String,
      default: 'normal'
    }
  }
}, { _id: false });

// Template schema within category
const TemplateSchema = new mongoose.Schema({
  templateId: {
    type: String,
    required: true,
    trim: true
  },
  // Template price in INR (0 = Free)
  price: {
    type: Number,
    default: 0
  },
  type: {
    type: String,
    required: true,
    enum: ['static', 'custom'],
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  preview: {
    type: String,
    trim: true
  },
  icon: {
    type: String,
    trim: true
  },
  fields: [FieldSchema],
  customizableOptions: {
    type: CustomizableOptionsSchema,
    required: function() {
      return this.type === 'custom';
    }
  },
  // Layout configuration for static templates
  layout: {
    card: String,
    profile: String,
    sections: String,
    spacing: String
  },
  // Theme configuration for static templates
  theme: {
    colors: {
      primary: String,
      secondary: String,
      background: String,
      text: String,
      accent: String
    },
    fonts: {
      primary: String,
      secondary: String
    },
    effects: {
      gradient: String,
      shadow: String
    }
  },
  // Sample data for preview
  sampleData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  }
}, { _id: false });

// Main category schema
const categorySchema = new mongoose.Schema({
  categoryId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  categoryName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  icon: {
    type: String,
    trim: true
  },
  templates: [TemplateSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'categories'
});

// Indexes
categorySchema.index({ categoryId: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ order: 1 });

// Static methods
categorySchema.statics.findByCategoryId = function(categoryId) {
  return this.findOne({ categoryId: categoryId, isActive: true });
};

categorySchema.statics.findByTemplateId = function(templateId) {
  return this.findOne({ 
    'templates.templateId': templateId, 
    isActive: true 
  });
};

categorySchema.statics.getTemplate = function(templateId) {
  return this.findOne(
    { 'templates.templateId': templateId, isActive: true },
    { 'templates.$': 1, categoryId: 1, categoryName: 1 }
  );
};

categorySchema.statics.getActiveCategories = function() {
  return this.find({ isActive: true }).sort({ order: 1 });
};

// Instance methods
categorySchema.methods.getTemplate = function(templateId) {
  return this.templates.find(template => template.templateId === templateId);
};

categorySchema.methods.getStaticTemplates = function() {
  return this.templates.filter(template => template.type === 'static' && template.isActive);
};

categorySchema.methods.getCustomTemplates = function() {
  return this.templates.filter(template => template.type === 'custom' && template.isActive);
};

categorySchema.methods.getDefaultTemplate = function() {
  return this.templates.find(template => template.isDefault && template.isActive);
};

// Template validation method
categorySchema.methods.validateTemplateData = function(templateId, data) {
  const template = this.getTemplate(templateId);
  if (!template) {
    return {
      isValid: false,
      errors: [`Template '${templateId}' not found in category '${this.categoryId}'`]
    };
  }

  const errors = [];
  
  // Validate required fields
  template.fields.forEach(field => {
    if (field.required && (!data[field.name] || (typeof data[field.name] === 'string' && data[field.name].trim() === ''))) {
      errors.push(`Required field '${field.label}' is missing or empty`);
    }
  });

  // Validate field types
  template.fields.forEach(field => {
    const value = data[field.name];
    if (value !== undefined && value !== null && value !== '') {
      switch (field.type) {
        case 'email':
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            errors.push(`Field '${field.label}' must be a valid email address`);
          }
          break;
        case 'tel':
          if (!/^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, ''))) {
            errors.push(`Field '${field.label}' must be a valid phone number`);
          }
          break;
        case 'url':
          try {
            new URL(value);
          } catch {
            errors.push(`Field '${field.label}' must be a valid URL`);
          }
          break;
        case 'number':
          if (isNaN(value)) {
            errors.push(`Field '${field.label}' must be a valid number`);
          }
          break;
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

export default mongoose.model('Category', categorySchema);
