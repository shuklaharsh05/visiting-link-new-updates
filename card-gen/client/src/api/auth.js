const API_BASE = import.meta.env?.VITE_API_URL;

// Interfaces removed - using JavaScript

// User registration
export async function registerUser({ name, email, password, phone, businessType }) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, email, password, phone, businessType })
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Registration failed');
  }
  
  return res.json();
}

// User login (phone-based)
export async function loginUser(phone, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ phone, password })
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Login failed');
  }
  
  return res.json();
}

// Login with admin credentials
export async function adminLogin(username, password) {
  const res = await fetch(`${API_BASE}/auth/admin-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Login failed');
  }
  
  return res.json();
}

// Google OAuth Login/Signup
export async function googleAuth(idToken) {
  const res = await fetch(`${API_BASE}/auth/google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ idToken })
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Google authentication failed');
  }
  
  return res.json();
}

// Store auth data in localStorage
export function setAuthData(authData, isAdmin = false) {
  const authPayload = {
    isAuthenticated: true,
    token: authData.token,
    user: {
      _id: authData._id || authData.user?._id,
      name: authData.name || authData.user?.name,
      email: authData.email || authData.user?.email,
      phone: authData.phone || authData.user?.phone,
      businessType: authData.businessType || authData.user?.businessType,
      role: authData.role || authData.user?.role,
      username: authData.username || authData.user?.username
    },
    isAdmin,
    timestamp: Date.now()
  };
  
  localStorage.setItem('auth', JSON.stringify(authPayload));
  if (isAdmin) {
    localStorage.setItem('adminToken', authData.token);
  } else {
    localStorage.setItem('userToken', authData.token);
  }
}

// Get auth data from localStorage
export function getAuthData() {
  const authStr = localStorage.getItem('auth');
  if (!authStr) return null;
  
  try {
    const authData = JSON.parse(authStr);
    return {
      isAuthenticated: true,
      token: authData.token,
      user: authData.user,
      isAdmin: authData.isAdmin || false,
      timestamp: authData.timestamp
    };
  } catch {
    return null;
  }
}

// Clear auth data
export function clearAuthData() {
  localStorage.removeItem('auth');
  localStorage.removeItem('adminToken');
  localStorage.removeItem('userToken');
}

// Get auth token
export function getAuthToken() {
  const authData = getAuthData();
  return authData?.token || null;
}

// Check if user is authenticated
export function isAuthenticated() {
  const authData = getAuthData();
  return authData?.isAuthenticated || false;
}

// Check if user is admin
export function isAdmin() {
  const authData = getAuthData();
  return authData?.isAdmin || false;
}

// Helper function for authenticated API calls
export async function authenticatedFetch(endpoint, options = {}) {
  const token = getAuthToken();
  const url = `${API_BASE}${endpoint}`;

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers = {
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    headers
  };

  console.log(`Authenticated API call to: ${url}`);
  
  const response = await fetch(url, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error(`API Error - Status: ${response.status}`, error);
    console.error(`API Error - URL: ${url}`);
    console.error(`API Error - Config:`, config);
    const message = error?.error || error?.message || `Request failed: ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}

// Save card for user
export async function saveCard(cardId) {
  const authData = getAuthData();
  
  if (!authData?.isAuthenticated) {
    throw new Error('User authentication required');
  }

  // Block admin users (including superadmin) from saving cards (they should only manage, not save)
  if (authData.isAdmin || authData.user?.role === 'superadmin' || authData.user?.role === 'admin') {
    throw new Error('Admin users cannot save cards. Please login as a regular user.');
  }

  // Get user ID from the stored auth data
  const userId = authData.user?._id || authData.user?.id;
  
  if (!userId) {
    throw new Error('User ID not found in authentication data');
  }

  // Validate that userId is a valid MongoDB ObjectId (24 hex characters)
  if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
    throw new Error('Invalid user ID format. Please login as a regular user.');
  }

  try {
    return await authenticatedFetch(`/users/${userId}/save-card`, {
      method: 'POST',
      body: JSON.stringify({ cardId })
    });
  } catch (err) {
    // Make this call idempotent on the client:
    // backend returns 400 { success:false, message:'Card is already saved' }
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes('already saved')) {
      return { success: true, message: 'Card is already saved' };
    }
    throw err;
  }
}

// Get user's saved cards
export async function getSavedCards() {
  const authData = getAuthData();
  if (!authData?.isAuthenticated) {
    throw new Error('User authentication required');
  }

  // Block admin users (including superadmin) from accessing user saved cards
  if (authData.isAdmin || authData.user?.role === 'superadmin' || authData.user?.role === 'admin') {
    throw new Error('Admin users cannot access saved cards. Please login as a regular user.');
  }

  // Get user ID from the stored auth data
  const userId = authData.user?._id || authData.user?.id;
  if (!userId) {
    throw new Error('User ID not found in authentication data');
  }

  // Validate that userId is a valid MongoDB ObjectId
  if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
    throw new Error('Invalid user ID format. Please login as a regular user.');
  }

  return authenticatedFetch(`/users/${userId}/saved-cards`);
}

// Remove saved card
export async function removeSavedCard(cardId) {
  const authData = getAuthData();
  if (!authData?.isAuthenticated) {
    throw new Error('User authentication required');
  }

  // Get user ID from the stored auth data
  const userId = authData.user?._id || authData.user?.id;
  if (!userId) {
    throw new Error('User ID not found in authentication data');
  }

  return authenticatedFetch(`/users/${userId}/saved-cards/${cardId}`, {
    method: 'DELETE'
  });
}