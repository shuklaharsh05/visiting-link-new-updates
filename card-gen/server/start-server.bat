@echo off
set JWT_SECRET=your_jwt_secret_key
set ADMIN_USERNAME=admin
set ADMIN_PASSWORD=admin123
set MONGO_URI=mongodb://localhost:27017/card-gen
node server.js
