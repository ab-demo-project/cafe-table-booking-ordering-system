# Cafe Table Management System - Installation Guide

## Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- A code editor (VS Code recommended)

## Project Structure
```
cafe-management/
├── backend/
│   ├── server.js
│   ├── database.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── index.html
│   ├── admin.html
│   ├── table.html
│   ├── style.css
│   ├── app.js
│   └── admin.js
└── README.md
```

## Installation Steps

### 1. Create Project Directory
```bash
mkdir cafe-management
cd cafe-management
```

### 2. Set Up Backend

#### Create backend directory
```bash
mkdir backend
cd backend
```

#### Initialize npm and install dependencies
```bash
npm init -y
npm install express cors sqlite3 qrcode dotenv body-parser uuid
```

#### Create .env file
```bash
echo "PORT=3000" > .env
```

### 3. Set Up Frontend

#### Create frontend directory
```bash
cd ..
mkdir frontend
cd frontend
```

No additional installation needed for frontend (pure HTML/CSS/JS)

### 4. Create Database Directory
```bash
cd ..
mkdir backend/data
```

## Running the Application

### Start Backend Server
```bash
cd backend
node server.js
```

The backend will run on `http://localhost:3000`

### Access Frontend
Open in your browser:
- Admin Panel: `frontend/admin.html`
- Customer View: Scan QR code or visit `frontend/table.html?table=TABLE_ID`

## Features

### Admin Features
- View all tables and their status
- Generate QR codes for each table
- View and manage orders
- Mark orders as completed
- Real-time status updates

### Customer Features
- Scan QR code to access table
- Browse menu items
- Place orders
- View order status
- Call waiter

### Technical Features
- SQLite database for data persistence
- RESTful API backend
- QR code generation
- Real-time order management
- Responsive design

## API Endpoints

- `GET /api/tables` - Get all tables
- `POST /api/tables` - Create new table
- `GET /api/tables/:id` - Get specific table
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get all orders
- `PUT /api/orders/:id` - Update order status
- `GET /api/menu` - Get menu items
- `GET /api/qr/:tableId` - Generate QR code for table

## Database Schema

### Tables
- id (INTEGER PRIMARY KEY)
- table_number (TEXT UNIQUE)
- status (TEXT) - 'available', 'occupied', 'reserved'
- created_at (DATETIME)

### Orders
- id (INTEGER PRIMARY KEY)
- table_id (INTEGER)
- items (TEXT - JSON)
- total (REAL)
- status (TEXT) - 'pending', 'preparing', 'ready', 'completed'
- created_at (DATETIME)

### Menu Items
- id (INTEGER PRIMARY KEY)
- name (TEXT)
- description (TEXT)
- price (REAL)
- category (TEXT)
- available (BOOLEAN)

## Troubleshooting

### Port Already in Use
Change the PORT in `.env` file to another port (e.g., 3001)

### Database Errors
Delete `backend/data/cafe.db` and restart the server to recreate the database

### QR Codes Not Generating
Ensure the `qrcode` npm package is properly installed

## Next Steps

1. Customize menu items in `database.js`
2. Add authentication for admin panel
3. Implement payment gateway
4. Add notifications for new orders
5. Deploy to a production server

## Security Notes

For production deployment:
- Add proper authentication
- Use environment variables for sensitive data
- Implement HTTPS
- Add rate limiting
- Sanitize user inputs
- Use a production database (PostgreSQL/MySQL)