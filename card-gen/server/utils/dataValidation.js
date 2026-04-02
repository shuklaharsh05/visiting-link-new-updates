// Data validation and auto-fix utilities
export class DataValidator {
  constructor() {
    this.urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    this.phonePattern = /^[\+]?[1-9][\d]{0,15}$/;
    this.emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  }

  // Auto-fix URL by adding https:// if missing
  normalizeUrl(url) {
    if (!url || typeof url !== 'string') return null;
    
    const trimmed = url.trim();
    if (trimmed === '') return null;
    
    // If it already has a protocol, return as is
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    
    // Add https:// if it looks like a domain
    if (this.urlPattern.test(trimmed)) {
      return `https://${trimmed}`;
    }
    
    return trimmed; // Return original if it doesn't match URL pattern
  }

  // Normalize phone number by removing spaces, dashes, parentheses
  normalizePhone(phone) {
    if (!phone || typeof phone !== 'string') return null;
    
    const trimmed = phone.trim();
    if (trimmed === '') return null;
    
    // Remove common separators
    const cleaned = trimmed.replace(/[\s\-\(\)]/g, '');
    
    // Add + if it doesn't start with one and looks like a number
    if (!cleaned.startsWith('+') && /^\d/.test(cleaned)) {
      return `+${cleaned}`;
    }
    
    return cleaned;
  }

  // Trim whitespace and convert empty strings to null
  normalizeString(str) {
    if (!str || typeof str !== 'string') return null;
    
    const trimmed = str.trim();
    return trimmed === '' ? null : trimmed;
  }

  // Validate email format
  validateEmail(email) {
    if (!email) return { isValid: true, value: null };
    
    const normalized = this.normalizeString(email);
    if (!normalized) return { isValid: true, value: null };
    
    if (!this.emailPattern.test(normalized)) {
      return { 
        isValid: false, 
        value: normalized,
        error: `Email must be a valid email address. Expected format: user@example.com`
      };
    }
    
    return { isValid: true, value: normalized };
  }

  // Validate phone number format
  validatePhone(phone) {
    if (!phone) return { isValid: true, value: null };
    
    const normalized = this.normalizePhone(phone);
    if (!normalized) return { isValid: true, value: null };
    
    if (!this.phonePattern.test(normalized)) {
      return { 
        isValid: false, 
        value: normalized,
        error: `Phone must be a valid phone number. Expected format: +1234567890`
      };
    }
    
    return { isValid: true, value: normalized };
  }

  // Validate URL format
  validateUrl(url) {
    if (!url) return { isValid: true, value: null };
    
    const normalized = this.normalizeUrl(url);
    if (!normalized) return { isValid: true, value: null };
    
    try {
      new URL(normalized);
      return { isValid: true, value: normalized };
    } catch {
      return { 
        isValid: false, 
        value: normalized,
        error: `Website must be a valid URL. Expected format: https://example.com`
      };
    }
  }

  // Validate number format
  validateNumber(number) {
    if (!number) return { isValid: true, value: null };
    
    const normalized = this.normalizeString(number);
    if (!normalized) return { isValid: true, value: null };
    
    if (isNaN(normalized)) {
      return { 
        isValid: false, 
        value: normalized,
        error: `Must be a valid number`
      };
    }
    
    return { isValid: true, value: parseFloat(normalized) };
  }

  // Process card data with no validation - all fields optional
  processCardData(data, template, hiddenFields = []) {
    const processed = {};
    
    // Process each field in the template
    template.fields.forEach(field => {
      const fieldName = field.name;
      const value = data[fieldName];
      
      // Handle different field types appropriately
      if (value === null || value === undefined) {
        processed[fieldName] = null;
        return;
      }
      
      // For array fields, ensure they remain as arrays
      if (field.type === 'array' || Array.isArray(value)) {
        processed[fieldName] = Array.isArray(value) ? value : [];
        return;
      }
      
      // For object fields, ensure they remain as objects
      if (field.type === 'object' || (typeof value === 'object' && value !== null)) {
        processed[fieldName] = typeof value === 'object' ? value : {};
        return;
      }
      
      // For string fields, normalize the string
      if (typeof value === 'string') {
        let normalizedValue = this.normalizeString(value);
        
        // If field is empty, set to null
        if (!normalizedValue || normalizedValue === '') {
          processed[fieldName] = null;
          return;
        }
        
        // For URL fields, try to add https:// if missing
        if (field.type === 'url' && normalizedValue) {
          processed[fieldName] = this.normalizeUrl(normalizedValue);
        } else {
          processed[fieldName] = normalizedValue;
        }
      } else {
        // For other types (numbers, booleans), keep as is
        processed[fieldName] = value;
      }
    });
    
    return {
      data: processed,
      isValid: true, // Always valid - no validation
      errors: []
    };
  }
}

// Export singleton instance
export const dataValidator = new DataValidator();
