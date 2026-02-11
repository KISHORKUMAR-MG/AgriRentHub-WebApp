const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});
app.get("/health", (req, res) => {
    res.send("OK");
});

// Database setup
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Initialize database schema
function initializeDatabase() {
    db.serialize(() => {
        // Farmers table
        db.run(`
            CREATE TABLE farmers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT UNIQUE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Equipment table
        db.run(`
            CREATE TABLE equipment (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                description TEXT,
                price_per_day REAL NOT NULL,
                status TEXT DEFAULT 'available',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Bookings table
        db.run(`
            CREATE TABLE bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                equipment_id INTEGER NOT NULL,
                farmer_id INTEGER NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                location TEXT NOT NULL,
                status TEXT DEFAULT 'active',
                total_cost REAL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (equipment_id) REFERENCES equipment(id),
                FOREIGN KEY (farmer_id) REFERENCES farmers(id)
            )
        `);

        // Maintenance table
        db.run(`
            CREATE TABLE maintenance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                equipment_id INTEGER NOT NULL,
                scheduled_date DATE NOT NULL,
                description TEXT,
                status TEXT DEFAULT 'scheduled',
                completed_date DATE,
                FOREIGN KEY (equipment_id) REFERENCES equipment(id)
            )
        `);

        // Insert sample data
        insertSampleData();
    });
}

// Insert sample data
function insertSampleData() {
    const equipment = [
        ['Heavy Duty Tractor', 'Tractor', 'Perfect for plowing and heavy farming tasks', 1500, 'available'],
        ['Combine Harvester', 'Harvester', 'Efficient harvesting for wheat, rice, and corn', 2500, 'available'],
        ['Modern Plough', 'Plough', 'Advanced plough for soil preparation', 800, 'available'],
        ['Crop Sprayer', 'Sprayer', 'Efficient pesticide and fertilizer application', 1200, 'available'],
        ['Mini Tractor', 'Tractor', 'Compact tractor for small farms', 1000, 'available'],
        ['Seed Drill', 'Plough', 'Precision seed planting equipment', 600, 'available']
    ];

    const stmt = db.prepare('INSERT INTO equipment (name, category, description, price_per_day, status) VALUES (?, ?, ?, ?, ?)');
    equipment.forEach(item => {
        stmt.run(item);
    });
    stmt.finalize();

    console.log('Sample equipment data inserted');
}

// ==================== API ROUTES ====================

// FARMERS ROUTES
// Login/Register farmer
app.post('/api/farmers/login', (req, res) => {
    const { name, phone } = req.body;

    if (!name || !phone) {
        return res.status(400).json({ error: 'Name and phone are required' });
    }

    // Check if farmer exists
    db.get('SELECT * FROM farmers WHERE phone = ?', [phone], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (row) {
            // Farmer exists, return existing record
            return res.json({ farmer: row, message: 'Login successful' });
        }

        // Create new farmer
        db.run('INSERT INTO farmers (name, phone) VALUES (?, ?)', [name, phone], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to create farmer account' });
            }

            const newFarmer = {
                id: this.lastID,
                name,
                phone
            };

            res.status(201).json({ farmer: newFarmer, message: 'Account created successfully' });
        });
    });
});

// Get all farmers
app.get('/api/farmers', (req, res) => {
    db.all('SELECT * FROM farmers', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

// EQUIPMENT ROUTES
// Get all equipment
app.get('/api/equipment', (req, res) => {
    const { category, status } = req.query;
    let query = 'SELECT * FROM equipment WHERE 1=1';
    const params = [];

    if (category) {
        query += ' AND category = ?';
        params.push(category);
    }

    if (status) {
        query += ' AND status = ?';
        params.push(status);
    }

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

// Get equipment by ID
app.get('/api/equipment/:id', (req, res) => {
    db.get('SELECT * FROM equipment WHERE id = ?', [req.params.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Equipment not found' });
        }
        res.json(row);
    });
});

// Add new equipment
app.post('/api/equipment', (req, res) => {
    const { name, category, description, price_per_day } = req.body;

    if (!name || !category || !price_per_day) {
        return res.status(400).json({ error: 'Name, category, and price are required' });
    }

    db.run(
        'INSERT INTO equipment (name, category, description, price_per_day) VALUES (?, ?, ?, ?)',
        [name, category, description, price_per_day],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to add equipment' });
            }
            res.status(201).json({ id: this.lastID, message: 'Equipment added successfully' });
        }
    );
});

// BOOKINGS ROUTES
// Create a booking
app.post('/api/bookings', (req, res) => {
    const { equipment_id, farmer_id, start_date, end_date, location } = req.body;

    if (!equipment_id || !farmer_id || !start_date || !end_date || !location) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if equipment is available
    db.get('SELECT * FROM equipment WHERE id = ? AND status = "available"', [equipment_id], (err, equipment) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!equipment) {
            return res.status(400).json({ error: 'Equipment not available' });
        }

        // Calculate total cost
        const start = new Date(start_date);
        const end = new Date(end_date);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        const total_cost = days * equipment.price_per_day;

        // Create booking
        db.run(
            'INSERT INTO bookings (equipment_id, farmer_id, start_date, end_date, location, total_cost) VALUES (?, ?, ?, ?, ?, ?)',
            [equipment_id, farmer_id, start_date, end_date, location, total_cost],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to create booking' });
                }

                // Update equipment status
                db.run('UPDATE equipment SET status = "rented" WHERE id = ?', [equipment_id]);

                res.status(201).json({
                    id: this.lastID,
                    message: 'Booking created successfully',
                    total_cost
                });
            }
        );
    });
});

// Get all bookings
app.get('/api/bookings', (req, res) => {
    const query = `
        SELECT 
            b.*,
            e.name as equipment_name,
            f.name as farmer_name
        FROM bookings b
        JOIN equipment e ON b.equipment_id = e.id
        JOIN farmers f ON b.farmer_id = f.id
        ORDER BY b.created_at DESC
    `;

    db.all(query, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

// Get bookings by farmer
app.get('/api/bookings/farmer/:farmerId', (req, res) => {
    const query = `
        SELECT 
            b.*,
            e.name as equipment_name
        FROM bookings b
        JOIN equipment e ON b.equipment_id = e.id
        WHERE b.farmer_id = ?
        ORDER BY b.created_at DESC
    `;

    db.all(query, [req.params.farmerId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

// Cancel booking
app.put('/api/bookings/:id/cancel', (req, res) => {
    db.get('SELECT * FROM bookings WHERE id = ?', [req.params.id], (err, booking) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        db.run('UPDATE bookings SET status = "cancelled" WHERE id = ?', [req.params.id], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to cancel booking' });
            }

            // Update equipment status back to available
            db.run('UPDATE equipment SET status = "available" WHERE id = ?', [booking.equipment_id]);

            res.json({ message: 'Booking cancelled successfully' });
        });
    });
});

// Complete booking
app.put('/api/bookings/:id/complete', (req, res) => {
    db.get('SELECT * FROM bookings WHERE id = ?', [req.params.id], (err, booking) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        db.run('UPDATE bookings SET status = "completed" WHERE id = ?', [req.params.id], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to complete booking' });
            }

            // Update equipment status back to available
            db.run('UPDATE equipment SET status = "available" WHERE id = ?', [booking.equipment_id]);

            res.json({ message: 'Booking completed successfully' });
        });
    });
});

// MAINTENANCE ROUTES
// Schedule maintenance
app.post('/api/maintenance', (req, res) => {
    const { equipment_id, scheduled_date, description } = req.body;

    if (!equipment_id || !scheduled_date) {
        return res.status(400).json({ error: 'Equipment ID and scheduled date are required' });
    }

    db.run(
        'INSERT INTO maintenance (equipment_id, scheduled_date, description) VALUES (?, ?, ?)',
        [equipment_id, scheduled_date, description],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to schedule maintenance' });
            }
            res.status(201).json({ id: this.lastID, message: 'Maintenance scheduled successfully' });
        }
    );
});

// Get maintenance schedule
app.get('/api/maintenance', (req, res) => {
    const query = `
        SELECT 
            m.*,
            e.name as equipment_name
        FROM maintenance m
        JOIN equipment e ON m.equipment_id = e.id
        ORDER BY m.scheduled_date DESC
    `;

    db.all(query, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

// Complete maintenance
app.put('/api/maintenance/:id/complete', (req, res) => {
    db.run(
        'UPDATE maintenance SET status = "completed", completed_date = CURRENT_TIMESTAMP WHERE id = ?',
        [req.params.id],
        (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to complete maintenance' });
            }
            res.json({ message: 'Maintenance completed successfully' });
        }
    );
});

// Start server
app.listen(PORT, () => {
    console.log(`🚜 FarmShare Server running on http://localhost:${PORT}`);
    console.log(`📊 API available at http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});