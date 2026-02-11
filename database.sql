-- FarmShare Agricultural Equipment Rental System
-- MySQL Database Schema

-- Create Database
CREATE DATABASE IF NOT EXISTS farmshare_db;
USE farmshare_db;

-- Farmers Table
CREATE TABLE farmers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Equipment Categories Table
CREATE TABLE equipment_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Equipment Table
CREATE TABLE equipment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    price_per_day DECIMAL(10, 2) NOT NULL,
    status ENUM('available', 'rented', 'maintenance', 'retired') DEFAULT 'available',
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    year_of_manufacture YEAR,
    image_url VARCHAR(255),
    location VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Bookings Table
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipment_id INT NOT NULL,
    farmer_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    location TEXT NOT NULL,
    status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
    total_cost DECIMAL(10, 2),
    payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE RESTRICT,
    FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE RESTRICT,
    INDEX idx_farmer (farmer_id),
    INDEX idx_equipment (equipment_id),
    INDEX idx_dates (start_date, end_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Maintenance Table
CREATE TABLE maintenance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipment_id INT NOT NULL,
    scheduled_date DATE NOT NULL,
    completed_date DATE,
    description TEXT,
    status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
    cost DECIMAL(10, 2),
    technician_name VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE RESTRICT,
    INDEX idx_equipment (equipment_id),
    INDEX idx_scheduled_date (scheduled_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Reviews Table
CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipment_id INT NOT NULL,
    farmer_id INT NOT NULL,
    booking_id INT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    INDEX idx_equipment (equipment_id),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Payments Table
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('cash', 'online', 'card', 'upi') NOT NULL,
    transaction_id VARCHAR(100),
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE RESTRICT,
    INDEX idx_booking (booking_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert Sample Categories
INSERT INTO equipment_categories (name, description) VALUES
('Tractor', 'Heavy-duty vehicles for plowing and field work'),
('Harvester', 'Equipment for harvesting crops'),
('Plough', 'Tools for soil preparation and planting'),
('Sprayer', 'Equipment for applying pesticides and fertilizers');

-- Insert Sample Equipment
INSERT INTO equipment (name, category, description, price_per_day, manufacturer, model) VALUES
('Heavy Duty Tractor', 'Tractor', 'Perfect for plowing and heavy farming tasks', 1500.00, 'John Deere', '5075E'),
('Combine Harvester', 'Harvester', 'Efficient harvesting for wheat, rice, and corn', 2500.00, 'Case IH', 'Axial-Flow 250'),
('Modern Plough', 'Plough', 'Advanced plough for soil preparation', 800.00, 'Lemken', 'Juwel 8'),
('Crop Sprayer', 'Sprayer', 'Efficient pesticide and fertilizer application', 1200.00, 'Hardi', 'Navigator 3000'),
('Mini Tractor', 'Tractor', 'Compact tractor for small farms', 1000.00, 'Mahindra', '275 DI'),
('Seed Drill', 'Plough', 'Precision seed planting equipment', 600.00, 'Kuhn', 'Maxima 2');

-- Create Views for Common Queries

-- View: Available Equipment with Booking Count
CREATE VIEW available_equipment_stats AS
SELECT 
    e.*,
    COUNT(b.id) as total_bookings,
    COALESCE(AVG(r.rating), 0) as avg_rating
FROM equipment e
LEFT JOIN bookings b ON e.id = b.equipment_id
LEFT JOIN reviews r ON e.id = r.equipment_id
WHERE e.status = 'available'
GROUP BY e.id;

-- View: Farmer Booking History
CREATE VIEW farmer_booking_history AS
SELECT 
    f.id as farmer_id,
    f.name as farmer_name,
    COUNT(b.id) as total_bookings,
    SUM(CASE WHEN b.status = 'active' THEN 1 ELSE 0 END) as active_bookings,
    SUM(b.total_cost) as total_spent
FROM farmers f
LEFT JOIN bookings b ON f.id = b.farmer_id
GROUP BY f.id;

-- View: Equipment Revenue
CREATE VIEW equipment_revenue AS
SELECT 
    e.id,
    e.name,
    e.category,
    COUNT(b.id) as total_bookings,
    SUM(b.total_cost) as total_revenue,
    AVG(b.total_cost) as avg_booking_cost
FROM equipment e
LEFT JOIN bookings b ON e.id = b.equipment_id AND b.status != 'cancelled'
GROUP BY e.id;

-- Stored Procedure: Check Equipment Availability
DELIMITER //
CREATE PROCEDURE CheckEquipmentAvailability(
    IN equip_id INT,
    IN check_start_date DATE,
    IN check_end_date DATE
)
BEGIN
    SELECT COUNT(*) as conflicting_bookings
    FROM bookings
    WHERE equipment_id = equip_id
    AND status = 'active'
    AND (
        (start_date <= check_end_date AND end_date >= check_start_date)
    );
END //
DELIMITER ;

-- Stored Procedure: Get Equipment Utilization Rate
DELIMITER //
CREATE PROCEDURE GetEquipmentUtilization(
    IN equip_id INT,
    IN period_days INT
)
BEGIN
    SELECT 
        e.name,
        COUNT(b.id) as bookings_count,
        SUM(DATEDIFF(b.end_date, b.start_date) + 1) as days_rented,
        period_days as total_days,
        ROUND((SUM(DATEDIFF(b.end_date, b.start_date) + 1) / period_days) * 100, 2) as utilization_rate
    FROM equipment e
    LEFT JOIN bookings b ON e.id = b.equipment_id 
        AND b.status != 'cancelled'
        AND b.start_date >= DATE_SUB(CURDATE(), INTERVAL period_days DAY)
    WHERE e.id = equip_id
    GROUP BY e.id;
END //
DELIMITER ;