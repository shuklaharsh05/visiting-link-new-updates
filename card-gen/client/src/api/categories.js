const API_BASE_URL = import.meta.env.VITE_API_URL;

// Get all active categories
export const getCategories = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/categories`);
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

// Get category by ID
export const getCategoryById = async (categoryId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch category');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching category:', error);
    throw error;
  }
};

// Get templates by category
export const getTemplatesByCategory = async (categoryId, type = null) => {
  try {
    const url = type 
      ? `${API_BASE_URL}/categories/${categoryId}/templates?type=${type}`
      : `${API_BASE_URL}/categories/${categoryId}/templates`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch templates');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }
};

// Get specific template
export const getTemplate = async (categoryId, templateId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/templates/${templateId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch template');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching template:', error);
    throw error;
  }
};

// Validate card data against template
export const validateCardData = async (categoryId, templateId, cardData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/templates/${templateId}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cardData }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to validate card data');
    }
    return await response.json();
  } catch (error) {
    console.error('Error validating card data:', error);
    throw error;
  }
};

// Create card
export const createCard = async (categoryId, templateId, cardData, customizations = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        categoryId,
        templateId,
        cardData,
        customizations,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create card');
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating card:', error);
    throw error;
  }
};

// Update card
export const updateCard = async (cardId, categoryId, templateId, cardData, customizations = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/cards/${cardId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        categoryId,
        templateId,
        cardData,
        customizations,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update card');
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating card:', error);
    throw error;
  }
};
