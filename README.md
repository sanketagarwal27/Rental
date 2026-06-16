# Vehicle Rental Platform

A comprehensive, full-stack vehicle rental application built with the MERN stack (MongoDB, Express, React, Node.js). This platform allows users to browse, book, and manage vehicle rentals with ease, while offering real-time features and secure payment processing.

## 🚀 Features

- **User Authentication:** Secure signup and login using JWT and bcrypt.
- **Vehicle Listings:** Browse available vehicles, view details, and check availability.
- **Real-time Messaging:** Integrated chat functionality between users and vehicle owners using Socket.io.
- **Booking System:** Seamless vehicle booking and management.
- **Payment Gateway Integration:** Secure and reliable payment processing via Razorpay.
- **Reviews & Ratings:** Leave feedback and rate vehicles after a rental period.
- **Interactive Maps:** View vehicle locations on an interactive map using Mapbox GL / Leaflet.
- **Image Uploads:** Cloud storage for vehicle and user images using Cloudinary.

## 🛠️ Tech Stack

### Frontend
- **Framework:** React (built with Vite)
- **Styling:** Tailwind CSS
- **Routing:** React Router DOM
- **API Requests:** Axios
- **Real-time:** Socket.io-client
- **Maps:** Mapbox GL & Leaflet
- **Icons & Notifications:** Lucide React, React Hot Toast, Sonner

### Backend
- **Environment:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Real-time:** Socket.io
- **Payments:** Razorpay
- **File Uploads:** Multer & Cloudinary
- **Security:** Helmet, Express Rate Limit, CORS
- **Validation:** Validator, vin-validator

## 📁 Project Structure

The project is organized with separate `frontend` and `backend` directories.

```text
Rental/
├── backend/          # Node.js/Express backend server
│   ├── src/          # Source code including controllers, models, routes
│   └── package.json  # Backend dependencies
└── frontend/         # React/Vite frontend application
    ├── src/          # Source code including components, pages, context
    └── package.json  # Frontend dependencies
```

## ⚙️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas)
- Accounts for Cloudinary, Razorpay, and Mapbox (for necessary API keys)

### Installation

1. **Clone the repository** (if applicable) or navigate to the project directory:
   ```bash
   cd Rental
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   ```
   - Create a `.env` file in the `backend` directory based on `.env.example` and fill in your environment variables (Database URI, JWT Secret, Cloudinary keys, Razorpay keys, etc.).

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   ```
   - Create a `.env` file in the `frontend` directory based on `.env.example` and add your Vite environment variables (API URLs, Mapbox token, etc.).

### Running the Application

To run the application locally, you will need two terminal windows.

**Terminal 1 - Run the Backend Server:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Run the Frontend Development Server:**
```bash
cd frontend
npm run dev
```

The application should now be running. The frontend will typically be accessible at `http://localhost:5173/` and the backend on the port specified in your `.env` (often 5000 or 8000).
