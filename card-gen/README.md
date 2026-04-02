# Card Generator Application

A comprehensive digital business card generation platform with admin panel, supporting multiple categories and customizable templates.

## 🚀 Features

- **Dynamic Card Generation**: Create cards based on configurable templates
- **Multiple Categories**: E-commerce, Interior Designer, Makeup Artist, Travel Agent
- **Template Types**: Static and custom templates with different customization options
- **Admin Panel**: Dashboard with statistics, assignments, and management tools
- **Public Access**: Public card generator and card viewing
- **User Management**: Registration, authentication, and user profiles
- **Card Saving & Analytics**: Save cards and track views, shares, downloads, likes, and shop link clicks
- **Appointment System**: Book consultations and appointments from cards
- **Payments & Plans**: Razorpay-powered payments, user plans, and coupons
- **MongoDB Integration**: Scalable data storage with Mongoose ODM

## 📁 Project Structure

### Frontend (`/client`)
```
client/
├── src/
│   ├── api/                    # API service functions
│   │   ├── auth.js            # Authentication API calls
│   │   ├── cards.js           # Card management API calls
│   │   ├── categories.js      # Category and template API calls
│   │   ├── inquiries.js       # Inquiry management API calls
│   │   ├── appointments.js    # Appointment booking API calls
│   │   ├── media.js           # Media upload API calls
│   │   └── users.js           # User management API calls
│   ├── components/            # React components
│   │   ├── cards/             # Card template components
│   │   │   ├── EcommerceCard.jsx
│   │   │   ├── InteriorDesignerCard.jsx
│   │   │   ├── MakeupArtistCard.jsx
│   │   │   └── TravelAgentCard.jsx
│   │   ├── AdminApp.jsx       # Admin panel application
│   │   ├── AppointmentModal.jsx # Appointment booking modal
│   │   ├── BusinessDirectory.jsx # Business directory listing
│   │   ├── CardGenerator.jsx  # Legacy card generator
│   │   ├── CustomisedCardBuilder.jsx # Custom card builder
│   │   ├── CustomisedCardRenderer.jsx # Custom card renderer
│   │   ├── Dashboard.jsx       # Admin dashboard
│   │   ├── LoginForm.jsx      # Login form component
│   │   ├── MediaLibrary.jsx   # Media management
│   │   ├── MediaManager.jsx   # Media upload/management
│   │   ├── PublicCardViewer.jsx # Public card display
│   │   ├── SimpleCardGenerator.jsx # Main card generator
│   │   ├── Sidebar.jsx        # Navigation sidebar
│   │   ├── Toast.jsx          # Toast notifications
│   │   ├── UnsaveConfirmModal.jsx # Unsave confirmation
│   │   └── UserAuthModal.jsx  # User authentication modal
│   ├── contexts/              # React contexts
│   │   ├── AuthContext.jsx    # Authentication context
│   │   └── ToastContext.jsx   # Toast notification context
│   ├── schemas/               # Data schemas
│   │   └── cardSchemas.js     # Card schema definitions
│   ├── App.jsx                # Main application component
│   ├── main.jsx               # Application entry point
│   └── index.css              # Global styles
├── public/                    # Static assets
│   ├── e-commerce/           # E-commerce card icons
│   ├── interior-designer/    # Interior designer card icons
│   ├── travel-agent/         # Travel agent card icons
│   └── testimonials.png      # Testimonial images
├── index.html                 # HTML template
├── package.json               # Frontend dependencies
├── tailwind.config.js         # Tailwind CSS configuration
└── vite.config.js            # Vite build configuration
```

### Backend (`/server`)
```
server/
├── config/
│   └── db.js                  # Database connection configuration
├── controllers/               # Request handlers
│   ├── adminController.js       # Admin panel logic
│   ├── appointmentController.js # Appointment management
│   ├── authController.js        # Authentication logic (email/phone + Google)
│   ├── cardController.js        # Card CRUD, analytics & counters
│   ├── categoryController.js    # Category and template management
│   ├── inquiryController.js     # Inquiry management & stats
│   ├── mediaController.js       # Media upload/management
│   ├── paymentController.js     # Razorpay payments for inquiries and plans
│   ├── planController.js        # Public plans/pricing
│   ├── couponController.js      # Admin coupon management
│   ├── detailsController.js     # Extra details forms (token-based)
│   ├── contactController.js     # Per-user contacts
│   ├── expoController.js        # Expo landing page submissions & clicks
│   ├── submissionController.js  # Form submission handling
│   └── userController.js        # User management
├── middleware/
│   └── authMiddleware.js      # Authentication middleware
├── models/                    # Mongoose schemas
│   ├── Admin.js           # Admin user model
│   ├── Appointment.js     # Appointment model
│   ├── Card.js            # Card data & analytics model
│   ├── Category.js        # Category and template model
│   ├── Contact.js         # Per-user contacts
│   ├── Coupon.js          # Discount coupons for plans/payments
│   ├── Details.js         # Extra details submitted via token links
│   ├── Expo.js            # Expo submissions
│   ├── ExpoStats.js       # Aggregated expo click stats
│   ├── Inquiry.js         # Inquiry model
│   ├── Media.js           # Media model
│   ├── PinnedInquiry.js   # Pinned inquiries for admin focus
│   ├── Plan.js            # User plans/pricing
│   ├── Submission.js      # Generic submission model
│   ├── Templte.js         # Legacy template model
│   └── User.js            # User authentication model
├── routes/                    # API routes
│   ├── adminRoutes.js       # Admin panel endpoints
│   ├── appointmentRoutes.js  # Appointment endpoints
│   ├── authRoutes.js         # Authentication endpoints
│   ├── cardRoutes.js         # Card management, analytics & counters
│   ├── categoryRoutes.js     # Category endpoints
│   ├── contactRoutes.js      # Contact endpoints
│   ├── couponRoutes.js       # Coupon endpoints (admin)
│   ├── detailsRoutes.js      # Token-based extra details endpoints
│   ├── expoRoutes.js         # Expo campaign endpoints
│   ├── inquiryRoutes.js      # Inquiry endpoints
│   ├── mediaRoutes.js        # Media endpoints
│   ├── paymentRoutes.js      # Payment & Razorpay endpoints
│   ├── planRoutes.js         # Public plans endpoints
│   ├── submissionRoutes.js   # Form submission endpoints
│   ├── userRoutes.js         # User management endpoints
│   └── index.js              # Main router configuration
├── services/                  # External services
│   ├── cloudinary.js          # Cloudinary integration
│   └── emailService.js        # Email notification service
├── utils/                     # Utility functions
│   ├── dataValidation.js      # Data validation utilities
│   ├── exportCSV.js           # CSV export functionality
│   └── generateQR.js          # QR code generation
├── scripts/                   # Database scripts
│   └── seedCategories.js      # Database seeding script
├── package.json               # Backend dependencies
└── server.js                  # Express server entry point
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### 1. Clone and Install Dependencies
```bash
git clone <repository-url>
cd card-gen

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Environment Configuration
Create a `.env` file in the server directory:
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/cardgen
PORT=5000
JWT_SECRET=your-jwt-secret-key
NODE_ENV=development
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_SECRET=your-razorpay-secret
GOOGLE_CLIENT_ID=your-google-oauth-client-id
EMAIL_USER=your-notification-email@gmail.com
EMAIL_PASS=your-email-app-password
```

Create a `.env` file in the client directory:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Database Setup
```bash
cd server
node scripts/seedCategories.js
```

### 4. Start the Application
```bash
# Terminal 1 - Start backend server
cd server
npm start

# Terminal 2 - Start frontend development server
cd client
npm run dev
```

## 🔄 Application Flow

### 1. User Registration & Authentication
- Users can register with email, password, and business type
- Login system with JWT token authentication
- Admin panel with separate authentication

### 2. Card Generation Process
- **Category Selection**: Choose from 4 available categories
- **Template Selection**: Static or custom templates
- **Data Input**: Fill in business information
- **Customization**: Customize colors, layouts, and content
- **Preview**: Real-time card preview
- **Save/Share**: Save cards and share with others

### 3. Admin Panel Workflow
- **Dashboard**: Overview of users, inquiries, and appointments
- **User Management**: View and manage user accounts
- **Inquiry Management**: Handle user inquiries and requests
- **Appointment Management**: Manage consultation bookings
- **Card Management**: View and manage generated cards
- **Media Management**: Upload and manage media files

### 4. Public Features
- **Public Card Generator**: Generate cards without registration
- **Public Card Viewer**: View and share generated cards
- **Appointment Booking**: Book consultations directly from cards

## 📊 Database Schema

### User Model
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required),
  phone: String (optional),
  businessType: String (enum: ['E-commerce', 'Interior Designer', 'Makeup Artist', 'Travel Agent', 'Other']),
  inquiries: [ObjectId], // References to user's inquiries
  savedCards: [ObjectId], // References to saved cards
  appointments: [ObjectId], // References to appointments
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### Card Model
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

### Inquiry Model
```javascript
{
  userId: ObjectId (ref: 'User'),
  name: String (required),
  email: String (required),
  phone: String (required),
  message: String (required, 10-500 characters),
  businessType: String (required),
  status: String (enum: ['New', 'In Progress', 'Completed', 'Archived']),
  resolved: Boolean (default: false),
  cardGenerated: Boolean (default: false),
  cardId: ObjectId (ref: 'Card'),
  adminNotes: String (optional),
  createdAt: Date,
  updatedAt: Date
}
```

### Appointment Model
```javascript
{
  userId: ObjectId (ref: 'User'),
  cardId: ObjectId (ref: 'Card'),
  name: String (required),
  email: String (required),
  phone: String (required),
  message: String (required, 10-500 characters),
  status: String (enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed']),
  appointmentDate: Date (optional),
  appointmentTime: String (optional),
  adminNotes: String (optional),
  responded: Boolean (default: false),
  response: String (optional),
  createdAt: Date,
  updatedAt: Date
}
```

## 🎨 Available Categories

### 1. E-commerce 🛒
- **Purpose**: Online stores and retail businesses
- **Features**: Product showcase, shopping categories, featured products
- **Templates**: Static and custom templates available

### 2. Interior Designer 🏠
- **Purpose**: Home and commercial design professionals
- **Features**: Portfolio showcase, design services, work gallery
- **Templates**: Static and custom templates available

### 3. Makeup Artist 💄
- **Purpose**: Beauty and cosmetic professionals
- **Features**: Work gallery, services, certifications
- **Templates**: Static and custom templates available

### 4. Travel Agent ✈️
- **Purpose**: Tourism and travel professionals
- **Features**: Destinations, travel packages, booking options
- **Templates**: Static and custom templates available

## 🔧 Adding New Categories

### Step 1: Update Seed Data
Add your new category to `server/scripts/seedCategories.js`:

```javascript
{
  "categoryId": "healthcare",
  "categoryName": "Healthcare",
  "description": "Medical and healthcare professional cards",
  "icon": "🏥",
  "order": 5,
  "isActive": true,
  "templates": [
    // Template definitions
  ]
}
```

### Step 2: Create Card Component
Create a new card component in `client/src/components/cards/`:

```javascript
// HealthcareCard.jsx
import React from 'react';

const HealthcareCard = ({ cardData, hiddenFields = [], cardId }) => {
  // Your custom card design
  return (
    <div className="healthcare-card">
      {/* Card content */}
    </div>
  );
};

export default HealthcareCard;
```

### Step 3: Update Card Renderer
Add the new card to the card rendering logic in `CustomisedCardRenderer.jsx`.

### Step 4: Run Seed Script
```bash
cd server
node scripts/seedCategories.js
```

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
cd client
npm run build
# Deploy the 'dist' folder
```

### Backend (Railway/Heroku)
```bash
cd server
# Set environment variables
# Deploy the server directory
```

## 📝 Development Notes

- **Frontend**: React with Vite, Tailwind CSS, Lucide React icons
- **Backend**: Express.js with MongoDB and Mongoose
- **Authentication**: JWT tokens with role-based access
- **File Upload**: Cloudinary integration for media management
- **Email**: Email service for notifications
- **Database**: MongoDB with comprehensive data models

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.