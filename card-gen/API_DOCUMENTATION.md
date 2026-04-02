# API Documentation

Complete API documentation for the Card Generator application, including all endpoints, data models, and integration examples.

## 🌐 Base URL

All API endpoints are prefixed with:
```
http://localhost:5000/api
```

## 📊 Data Models

### User Model Schema
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required for authenticated users),
  phone: String (optional),
  inquiries: [ObjectId], // References to inquiries sent by this user
  savedCards: [ObjectId], // References to cards saved by this user
  appointments: [ObjectId], // References to appointments made by this user
  businessType: String (enum: ['E-commerce', 'Interior Designer', 'Makeup Artist', 'Travel Agent', 'Other']),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### Card Model Schema
```javascript
{
  name: String (required),
  categoryId: String (required),
  templateId: String (required),
  data: Object (required), // Card data
  customizations: Object (optional), // Customizations
  isPublic: Boolean (default: false),
  createdBy: ObjectId (ref: 'User'),
  createdAt: Date,
  updatedAt: Date
}
```

### Inquiry Model Schema
```javascript
{
  userId: ObjectId (ref: 'User'),
  name: String (required),
  email: String (required),
  phone: String (required),
  message: String (required, 10-500 characters),
  businessType: String (enum: ['E-commerce', 'Interior Designer', 'Makeup Artist', 'Travel Agent', 'Other']),
  status: String (enum: ['New', 'In Progress', 'Completed', 'Archived'], default: 'New'),
  resolved: Boolean (default: false),
  cardGenerated: Boolean (default: false),
  cardId: ObjectId (ref: 'Card'),
  adminNotes: String (optional),
  createdAt: Date,
  updatedAt: Date
}
```

### Appointment Model Schema
```javascript
{
  userId: ObjectId (ref: 'User'),
  cardId: ObjectId (ref: 'Card'),
  name: String (required),
  email: String (required),
  phone: String (required),
  message: String (required, 10-500 characters),
  status: String (enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed'], default: 'Pending'),
  appointmentDate: Date (optional),
  appointmentTime: String (optional),
  adminNotes: String (optional),
  responded: Boolean (default: false),
  response: String (optional),
  createdAt: Date,
  updatedAt: Date
}
```

### Media Model Schema
```javascript
{
  filename: String (required),
  originalName: String (required),
  mimeType: String (required),
  size: Number (required),
  url: String (required),
  uploadedBy: ObjectId (ref: 'User'),
  createdAt: Date
}
```

## 🔐 Authentication Endpoints

### 1. User Registration
- **POST** `/api/auth/register`
- **Description**: Create a new user account
- **Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "+1234567890",
    "businessType": "E-commerce"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Account created successfully",
    "data": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "businessType": "E-commerce",
      "token": "jwt_token_here"
    }
  }
  ```

### 2. User Login
- **POST** `/api/auth/login`
- **Description**: Login with email and password
- **Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "token": "jwt_token_here"
    }
  }
  ```

### 3. Set Password
- **POST** `/api/auth/set-password`
- **Description**: Set password for existing user
- **Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "newpassword123"
  }
  ```

### 4. Get User Profile
- **GET** `/api/auth/profile`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Get complete user profile
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "businessType": "E-commerce",
      "inquiries": [/* user's inquiries */],
      "savedCards": [/* user's saved cards */],
      "appointments": [/* user's appointments */],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```

### 5. Admin Login
- **POST** `/api/auth/admin-login`
- **Description**: Admin login for system management
- **Body**:
  ```json
  {
    "username": "admin",
    "password": "admin123"
  }
  ```

### 6. Link Credentials (email/phone + password)
- **POST** `/api/auth/link-credentials`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Link an email/phone + password login to an existing account (e.g. Google-only users).

### 7. Mint Short-Lived Auth Code
- **POST** `/api/auth/mint-code`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Generate a short-lived auth code that can be exchanged for a JWT on another device.

### 8. Exchange Auth Code
- **POST** `/api/auth/exchange-code`
- **Description**: Exchange a previously minted auth code for a JWT.

### 9. Google OAuth Login
- **POST** `/api/auth/google`
- **Description**: Login or register using a Google ID token.
- **Body** (simplified):
  ```json
  {
    "idToken": "google-id-token"
  }
  ```

## 👥 User Management Endpoints

### 1. Create User (public)
- **POST** `/api/users`
- **Description**: Create a user record (used by admin tools or linked flows).

### 2. Find or Create User (public)
- **POST** `/api/users/find-or-create`
- **Description**: Find an existing user by email (and optionally phone) or create a new one.

### 3. Get All Users
- **GET** `/api/users`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Get paginated list of users
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `search`: Search by name or email

### 4. Bulk Delete Users
- **POST** `/api/users/bulk-delete`
- **Headers**: `Authorization: Bearer <token>` (admin)
- **Description**: Bulk delete multiple users (with safety checks).

### 5. Get User by ID
- **GET** `/api/users/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Get specific user with populated data

### 6. Update User
- **PUT** `/api/users/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Update user information (name, email, phone, businessType, isActive)

### 7. Delete User
- **DELETE** `/api/users/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Delete user (cannot delete users with existing inquiries)

### 8. Get User's Inquiries
- **GET** `/api/users/:id/inquiries`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Get inquiries belonging to a user.

### 9. Get User Stats
- **GET** `/api/users/:id/stats`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Get aggregate stats for a user (inquiries, cards, appointments).

### 10. Get User's Saved Cards
- **GET** `/api/users/:id/saved-cards`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Get all cards saved by a specific user

### 11. Get User's Appointments
- **GET** `/api/users/:id/appointments`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Get appointments created by or for a specific user.

### 12. Save Card for User
- **POST** `/api/users/:id/save-card`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Save a card for a specific user

### 13. Remove Saved Card
- **DELETE** `/api/users/:id/saved-cards/:cardId`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Remove a card from user's saved cards

## 📝 Inquiry Management Endpoints

### 1. Submit Inquiry
- **POST** `/api/inquiries`
- **Headers**: `Authorization: Bearer <token>` (required)
- **Description**: Submit inquiry (requires user to be logged in)
- **Body**:
  ```json
  {
    "phone": "+1234567890",
    "message": "I need a digital business card for my e-commerce store",
    "businessType": "E-commerce"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Inquiry submitted successfully",
    "data": {
      "_id": "inquiry_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "message": "I need a digital business card for my e-commerce store",
      "businessType": "E-commerce",
      "status": "New",
      "user": {
        "id": "user_id",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  }
  ```

### 2. Get All Inquiries
- **GET** `/api/inquiries`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Get paginated list of inquiries
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `status`: Filter by status
  - `businessType`: Filter by business type
  - `resolved`: Filter by resolved status

### 3. Get Inquiry by ID
- **GET** `/api/inquiries/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Get specific inquiry with user data

### 4. Update Inquiry
- **PUT** `/api/inquiries/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Update inquiry details
- **Body**:
  ```json
  {
    "status": "In Progress",
    "adminNotes": "Working on card generation",
    "resolved": false,
    "cardGenerated": true,
    "cardId": "card_object_id"
  }
  ```

### 5. Delete Inquiry
- **DELETE** `/api/inquiries/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Delete inquiry

### 6. Get Inquiry Statistics
- **GET** `/api/inquiries/stats`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Get inquiry statistics
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "totalInquiries": 100,
      "newInquiries": 15,
      "inProgressInquiries": 25,
      "completedInquiries": 50,
      "archivedInquiries": 10,
      "resolvedInquiries": 60,
      "cardGeneratedInquiries": 40,
      "businessTypeStats": {
        "E-commerce": 30,
        "Interior Designer": 25,
        "Makeup Artist": 20,
        "Travel Agent": 15,
        "Other": 10
      }
    }
  }
  ```

### 7. Create Inquiry for User (admin)
- **POST** `/api/inquiries/admin/create-for-user`
- **Headers**: `Authorization: Bearer <token>` (superadmin)
- **Description**: Create an inquiry on behalf of a specific user (by userId).

### 8. Bulk Delete Inquiries (admin)
- **POST** `/api/inquiries/bulk-delete`
- **Headers**: `Authorization: Bearer <token>` (admin/superadmin)
- **Description**: Bulk delete inquiries after password confirmation.

### 9. Pin/Unpin Inquiry
- **POST** `/api/inquiries/:id/pin`
- **POST** `/api/inquiries/:id/unpin`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Mark an inquiry as pinned/unpinned for admin focus.

### 10. Update Inquiry Payment Status
- **PUT** `/api/inquiries/:id/payment-status`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Update payment status metadata attached to an inquiry.

## 📅 Appointment Management Endpoints

### 1. Create Appointment
- **POST** `/api/appointments`
- **Description**: Create new appointment (public)
- **Body**:
  ```json
  {
    "cardId": "card_object_id",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "message": "I would like to schedule a consultation",
    "appointmentDate": "2024-01-15",
    "appointmentTime": "2:00 PM"
  }
  ```

### 2. Get All Appointments
- **GET** `/api/appointments`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Get paginated list of appointments
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `status`: Filter by status
  - `userId`: Filter by user ID
  - `cardId`: Filter by card ID

### 3. Get Appointment by ID
- **GET** `/api/appointments/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Get specific appointment with user and card data

### 4. Update Appointment
- **PUT** `/api/appointments/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Update appointment details
- **Body**:
  ```json
  {
    "status": "Confirmed",
    "appointmentDate": "2024-01-15",
    "appointmentTime": "2:00 PM",
    "adminNotes": "Confirmed for 2 PM",
    "responded": true,
    "response": "Your appointment has been confirmed for 2 PM on January 15th"
  }
  ```

### 5. Delete Appointment
- **DELETE** `/api/appointments/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Delete appointment

### 6. Get Appointment Statistics
- **GET** `/api/appointments/stats`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Get appointment statistics
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "totalAppointments": 100,
      "pendingAppointments": 20,
      "confirmedAppointments": 50,
      "cancelledAppointments": 10,
      "completedAppointments": 20,
      "respondedAppointments": 70,
      "unrespondedAppointments": 30
    }
  }
  ```

### 7. Get Appointments by User
- **GET** `/api/appointments/user/:userId`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Get all appointments for a given user.

### 8. Get User Appointment Summary
- **GET** `/api/appointments/user/:userId/summary`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Aggregated appointment summary for a user.

### 9. Get Appointments by Card
- **GET** `/api/appointments/card/:cardId`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Get all appointments created from a specific card.

## 🎨 Card Management Endpoints

### 1. Get All Cards
- **GET** `/api/cards`
- **Description**: Get public cards or filtered cards
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `category`: Filter by category
  - `search`: Search by name or description

### 2. Get Card by ID
- **GET** `/api/cards/:id`
- **Description**: Get specific card details

### 3. Create Card
- **POST** `/api/cards`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Create new card
- **Body**:
  ```json
  {
    "name": "My Business Card",
    "categoryId": "ecommerce",
    "templateId": "ecommerce-default",
    "data": {
      "storeName": "My Store",
      "email": "contact@mystore.com",
      "phone": "+1234567890"
    },
    "customizations": {
      "background": "#ffffff",
      "primaryColor": "#3B82F6"
    }
  }
  ```

### 4. Update Card
- **PUT** `/api/cards/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Update card details

### 5. Delete Card
- **DELETE** `/api/cards/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Delete card

### 6. Toggle Card Public Status
- **PATCH** `/api/cards/:id/toggle-public`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Toggle a card between public and private visibility.

### 7. Get Card Analytics
- **GET** `/api/cards/:id/analytics`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Get view/share/download/like counts and other analytics for a card.

### 8. Card Interaction Counters (public)
- **POST** `/api/cards/:id/view`
- **POST** `/api/cards/:id/share`
- **POST** `/api/cards/:id/download`
- **POST** `/api/cards/:id/like`
- **POST** `/api/cards/:id/shoplink-click`
- **Description**: Increment counters for card interactions (no auth; used by public viewer).

### 9. Card Payment Status
- **PATCH** `/api/cards/:cardId/payment-status`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Update a card's paymentStatus field.

### 10. Catalogue PDF
- **GET** `/api/cards/catalogue`
- **Description**: Stream a catalogue PDF by Cloudinary URL (preview/unsaved).
- **GET** `/api/cards/:id/catalogue`
- **Description**: Stream a catalogue PDF generated for a specific card.

### 11. Lookup by Submission / Client
- **GET** `/api/cards/submission/:submissionId`
- **Description**: Get a card by submission ID.
- **GET** `/api/cards/client/:clientId`
- **Description**: Get a card by client/inquiry ID.

## 📁 Category Management Endpoints

### 1. Get All Categories
- **GET** `/api/categories`
- **Description**: Get all available card categories
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "categoryId": "ecommerce",
        "categoryName": "E-commerce",
        "description": "Digital visiting card for e-commerce businesses",
        "icon": "🛒",
        "templates": [/* array of templates */]
      }
    ]
  }
  ```

### 2. Get Category by ID
- **GET** `/api/categories/:id`
- **Description**: Get specific category with templates

### 3. Get Templates by Category
- **GET** `/api/categories/:categoryId/templates`
- **Description**: Get templates for a specific category

### 4. Get Specific Template
- **GET** `/api/categories/:categoryId/templates/:templateId`
- **Description**: Get specific template details

## 📊 Media Management Endpoints

### 1. Upload Media
- **POST** `/api/media/upload`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Upload media files
- **Body**: FormData with file
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "media_id",
      "filename": "image.jpg",
      "originalName": "my-image.jpg",
      "mimeType": "image/jpeg",
      "size": 1024000,
      "url": "https://cloudinary.com/image.jpg",
      "uploadedBy": "user_id",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```

### 2. Get All Media
- **GET** `/api/media`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Get paginated list of media files
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `search`: Search by filename

### 3. Get Media by ID
- **GET** `/api/media/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Get specific media file details

### 4. Delete Media
- **DELETE** `/api/media/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Delete media file

### 5. Upload Multiple Media
- **POST** `/api/media/upload-multiple`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Upload multiple files (supports larger/video files).

### 6. Delete Multiple Media
- **POST** `/api/media/delete-multiple`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Bulk delete multiple media items.

### 7. Rename Folder
- **POST** `/api/media/rename-folder`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Rename a folder in the media library (Cloudinary).

## 💳 Payment & Plan Endpoints

### 1. Create Payment Order (Inquiry)
- **POST** `/api/payments/create-order`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Create a Razorpay order linked to an inquiry.

### 2. Verify Payment (Inquiry)
- **POST** `/api/payments/verify`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Verify a completed Razorpay payment for an inquiry.

### 3. Get Payment Status
- **GET** `/api/payments/status/:inquiryId`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Get payment status for a specific inquiry.

### 4. User Plan Payments
- **POST** `/api/payments/user-plan/create-order`
- **POST** `/api/payments/user-plan/verify`
- **POST** `/api/payments/user-plan/preview`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Create/verify Razorpay orders for user plans, or preview pricing.

### 5. Razorpay Webhook
- **POST** `/api/payments/webhook`
- **Description**: Razorpay webhook (no auth; signature-verified on the server).

### 6. Public Plans
- **GET** `/api/plans`
- **Description**: Get active public plans for pricing display.

## 🎟 Coupon Endpoints

> All coupon endpoints require admin-panel authentication (superadmin).

### 1. List Coupons
- **GET** `/api/coupons`

### 2. Create Coupon
- **POST** `/api/coupons`

### 3. Delete Coupon
- **DELETE** `/api/coupons/:id`

## 🛠 Admin Panel Endpoints

> These endpoints use an admin-panel token (`authenticateToken`) and often require **superadmin**.

### 1. Admin Management
- **GET** `/api/admins` – list admins (superadmin)
- **GET** `/api/admins/:id` – get admin by ID (superadmin)
- **POST** `/api/admins` – create admin (superadmin)
- **PUT** `/api/admins/:id` – update admin (superadmin)
- **DELETE** `/api/admins/:id` – delete admin (superadmin)

### 2. Admin Inquiry Assignment
- **PUT** `/api/admins/assign/:inquiryId` – assign an inquiry to an admin.
- **GET** `/api/admins/inquiries/:adminName` – get inquiries assigned to a specific admin.
- **GET** `/api/admins/calendar-stats` – calendar-style stats for admins.

## 📇 Contact Endpoints

### 1. Create Contact
- **POST** `/api/contacts`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Create a contact linked to a user.

### 2. Get Contacts for User
- **GET** `/api/contacts/user/:userId`
- **Headers**: `Authorization: Bearer <token>`

### 3. Update Contact
- **PUT** `/api/contacts/:contactId`
- **Headers**: `Authorization: Bearer <token>`

### 4. Delete Contact
- **DELETE** `/api/contacts/:contactId`
- **Headers**: `Authorization: Bearer <token>`

## 🧾 Details (Extra Info) Endpoints

### 1. Get Details by Token (public)
- **GET** `/api/details/by-token/:token`
- **Description**: Fetch extra-details form configuration using a token (for public flows).

### 2. Submit Details by Token (public)
- **POST** `/api/details/submit-by-token/:token`
- **Description**: Submit extra details using a tokenized link.

### 3. Get Details for Card
- **GET** `/api/details/for-card/:cardId`
- **Headers**: `Authorization: Bearer <token>`

### 4. Ensure Details Token for Card
- **POST** `/api/details/ensure-token/:cardId`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Create or return a tokenized link for collecting extra details for a card.

### 5. Mark Details as Applied
- **PATCH** `/api/details/:id/applied`
- **Headers**: `Authorization: Bearer <token>`

## 📨 Submission Endpoints

> Generic submission model used for internal tools and integrations.

### 1. List Submissions
- **GET** `/api/submissions`

### 2. Get Submission by ID
- **GET** `/api/submissions/:id`

### 3. Create Submission
- **POST** `/api/submissions`

### 4. Update Submission
- **PUT** `/api/submissions/:id`

### 5. Delete Submission
- **DELETE** `/api/submissions/:id`

## 🎪 Expo Campaign Endpoints

> Used by the separate expo landing page for tracking interest and clicks.

### 1. Expo Submissions
- **POST** `/api/expo/submissions`
- **Description**: Create a submission from the expo landing page.

### 2. Track Clicks
- **POST** `/api/expo/clicks/bookmyshow`
- **POST** `/api/expo/clicks/razorpay`
- **Description**: Track specific outbound CTA clicks from the expo page.

## 🔧 Validation Rules

### Business Types
Valid business types for inquiries and appointments:
- `E-commerce`
- `Interior Designer`
- `Makeup Artist`
- `Travel Agent`
- `Other`

### Inquiry Status
- `New` (default)
- `In Progress`
- `Completed`
- `Archived`

### Appointment Status
- `Pending` (default)
- `Confirmed`
- `Cancelled`
- `Completed`

## 🚨 Error Responses

### Validation Error
```json
{
  "success": false,
  "message": "Validation errors",
  "errors": [
    {
      "msg": "Please provide a valid email",
      "param": "email",
      "value": "invalid-email"
    }
  ]
}
```

### Authentication Error
```json
{
  "success": false,
  "error": "Not authorized, token failed"
}
```

### Not Found Error
```json
{
  "success": false,
  "error": "User not found"
}
```

## 🔐 Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## 📝 Rate Limiting

- Public endpoints: 100 requests per hour
- Authenticated endpoints: 1000 requests per hour
- Admin endpoints: 5000 requests per hour

## 📱 Frontend Integration Examples

### User Registration Flow
```javascript
// 1. User signs up
const signup = async (userData) => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  return response.json();
};

// 2. User logs in
const login = async (email, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return response.json();
};

// 3. Submit inquiry (requires user to be logged in)
const submitInquiry = async (inquiryData) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('User must be logged in to submit inquiries');
  }
  
  const response = await fetch('/api/inquiries', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(inquiryData)
  });
  return response.json();
};
```

### Card Management
```javascript
// Create a new card
const createCard = async (cardData) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('/api/cards', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(cardData)
  });
  return response.json();
};

// Save card for user
const saveCard = async (cardId) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('auth'));
  
  const response = await fetch(`/api/users/${user.user._id}/save-card`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ cardId })
  });
  return response.json();
};
```

### Media Upload
```javascript
// Upload media file
const uploadMedia = async (file) => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/media/upload', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  return response.json();
};
```

This comprehensive API documentation covers all the endpoints and functionality available in your card generation system! 🚀
