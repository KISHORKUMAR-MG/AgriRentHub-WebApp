🚜 FarmShare - Agricultural Equipment Rental System
A comprehensive web-based platform connecting farmers with agricultural equipment rental services. Built to improve accessibility of farming tools for small farmers through an intuitive booking system.
🌟 Features
Core Functionality

Equipment Listing: Browse available tractors, harvesters, ploughs, and sprayers
Smart Booking System: Real-time availability checking and booking confirmation
Farmer Dashboard: Track active bookings, history, and spending
Maintenance Scheduling: Equipment maintenance tracking and management
Search & Filter: Category-based filtering and text search
Responsive Design: Works seamlessly on desktop, tablet, and mobile

User Features

Quick login/registration for farmers
View equipment details with pricing
Calculate rental costs automatically
Book equipment with date selection
Cancel active bookings
View booking history and statistics

🛠️ Technologies Used
Frontend

HTML5: Semantic markup for better structure
CSS3: Modern styling with gradients, flexbox, and grid
JavaScript (ES6+): Dynamic interactions and API integration
Responsive Design: Mobile-first approach

Backend

Node.js: Runtime environment
Express.js: Web application framework
SQLite3: Development database (easily migrates to MySQL)
REST API: Clean API architecture

Database

SQLite: Development (in-memory)
MySQL: Production (schema provided)

📁 Project Structure
farmshare/
├── index.html              # Main HTML file
├── styles.css              # Styling
├── script.js               # Frontend JavaScript
├── server.js               # Backend server
├── package.json            # Node.js dependencies
├── database.sql            # MySQL schema for production
└── README.md              # Documentation
🚀 Quick Start
Prerequisites

Node.js (v14 or higher)
npm (Node Package Manager)
MySQL (for production deployment)

Installation

Clone or download the project files
Install dependencies

bashnpm install

Start the backend server

bashnpm start
The server will start on http://localhost:3000

Open the application

Open index.html in your web browser
Or visit http://localhost:3000 if serving via Express



📊 Database Setup
Development (SQLite)
The application uses an in-memory SQLite database by default. Data is initialized automatically when the server starts.
Production (MySQL)

Create MySQL database

bashmysql -u root -p < database.sql

Update server.js
Replace SQLite connection with MySQL:

javascriptconst mysql = require('mysql2');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'your_username',
    password: 'your_password',
    database: 'farmshare_db'
});

Install MySQL driver

bashnpm install mysql2
🔌 API Endpoints
Farmers

POST /api/farmers/login - Login/Register farmer
GET /api/farmers - Get all farmers

Equipment

GET /api/equipment - Get all equipment
GET /api/equipment/:id - Get specific equipment
POST /api/equipment - Add new equipment
Query params: ?category=Tractor&status=available

Bookings

POST /api/bookings - Create new booking
GET /api/bookings - Get all bookings
GET /api/bookings/farmer/:farmerId - Get farmer's bookings
PUT /api/bookings/:id/cancel - Cancel booking
PUT /api/bookings/:id/complete - Complete booking

Maintenance

POST /api/maintenance - Schedule maintenance
GET /api/maintenance - Get maintenance schedule
PUT /api/maintenance/:id/complete - Complete maintenance

💡 Usage Guide
For Farmers

Login

Click "Login" button
Enter name and phone number
System automatically creates account if new


Browse Equipment

Scroll to equipment section
Use category filter or search bar
View equipment details and pricing


Book Equipment

Click "Book Now" on available equipment
Select start and end dates
Enter your location
Review total cost
Confirm booking


Manage Bookings

Go to Dashboard
View active and past bookings
Cancel active bookings if needed
Track total spending



For Administrators

Add Equipment

bashcurl -X POST http://localhost:3000/api/equipment \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Tractor",
    "category": "Tractor",
    "description": "Latest model",
    "price_per_day": 2000
  }'

Schedule Maintenance

bashcurl -X POST http://localhost:3000/api/maintenance \
  -H "Content-Type: application/json" \
  -d '{
    "equipment_id": 1,
    "scheduled_date": "2024-03-15",
    "description": "Regular service"
  }'
🎨 Customization
Color Scheme
The application uses a green agricultural theme. To customize:
In styles.css, modify:
css/* Primary colors */
--primary-green: #2d7a3e;
--secondary-green: #4CAF50;
--light-green: #e8f5e9;
Equipment Categories
Add new categories in:

Frontend: Update filter dropdown in index.html
Backend: Add to sample data in server.js
Database: Insert into equipment_categories table

🔒 Security Considerations
For production deployment:

Add authentication middleware
Implement JWT tokens
Use HTTPS
Sanitize user inputs
Add rate limiting
Implement CSRF protection
Use environment variables for sensitive data

📈 Future Enhancements

 Payment gateway integration
 SMS/Email notifications
 Equipment location tracking with maps
 Review and rating system
 Advanced analytics dashboard
 Mobile app (React Native)
 Multi-language support
 Equipment insurance tracking
 Automated pricing based on demand
 Farmer verification system

🧪 Testing
Sample test scenarios:

Login Flow

New farmer registration
Existing farmer login
Invalid phone number handling


Booking Flow

Book available equipment
Calculate costs correctly
Prevent double booking
Cancel booking


Dashboard

Display correct statistics
Show booking history
Update in real-time



🐛 Troubleshooting
Server won't start
bash# Check if port 3000 is in use
lsof -i :3000
# Kill process if needed
kill -9 <PID>
Database errors

Ensure SQLite3 is installed: npm install sqlite3
For MySQL: Check connection credentials
Verify database exists

CORS errors

Backend CORS is enabled by default
If issues persist, check browser console
Ensure API URL is correct in script.js

📝 License
MIT License - Feel free to use this project for learning and development.
🤝 Contributing
Contributions welcome! Areas for improvement:

Additional features
Bug fixes
Documentation
Testing
Performance optimization

📧 Support
For issues or questions:

Check existing documentation
Review API endpoints
Verify database schema
Check browser console for errors

🎯 Real-World Impact
This platform has been validated through real-world testing and aims to:

Simplify equipment rental for small farmers
Reduce capital investment barriers
Improve farming efficiency
Enable better resource utilization
Support sustainable agriculture


Built with ❤️ for farmers everywhere 🌾