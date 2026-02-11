// Global state
let currentUser = null;
let equipment = [];
let bookings = [];
let selectedEquipment = null;

// API Base URL
const API_URL = 'http://localhost:3000/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    loadEquipment();
    
    // Check if user is logged in
    const savedUser = localStorage.getItem('farmer');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUIForLoggedInUser();
    }
});

function initializeApp() {
    // Set minimum date for bookings to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').min = today;
    document.getElementById('endDate').min = today;
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target.getAttribute('href').substring(1);
            navigateToSection(target);
        });
    });

    // Login button
    document.getElementById('loginBtn').addEventListener('click', () => {
        if (currentUser) {
            logout();
        } else {
            openLoginModal();
        }
    });

    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);

    // Booking form
    document.getElementById('bookingForm').addEventListener('submit', handleBooking);

    // Filters
    document.getElementById('categoryFilter').addEventListener('change', filterEquipment);
    document.getElementById('searchInput').addEventListener('input', filterEquipment);

    // Modal close buttons
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').style.display = 'none';
        });
    });

    // Date change listeners for cost calculation
    document.getElementById('startDate').addEventListener('change', calculateTotalCost);
    document.getElementById('endDate').addEventListener('change', calculateTotalCost);

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

// Navigation
function navigateToSection(section) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    document.querySelector(`[href="#${section}"]`).classList.add('active');
    
    if (section === 'dashboard') {
        if (!currentUser) {
            alert('Please login to view your dashboard');
            openLoginModal();
            return;
        }
        showDashboard();
    } else {
        document.querySelectorAll('section').forEach(sec => {
            sec.classList.remove('hidden');
        });
        document.querySelector(`#${section}`).scrollIntoView({ behavior: 'smooth' });
    }
}

function scrollToEquipment() {
    document.getElementById('equipment').scrollIntoView({ behavior: 'smooth' });
}

// Authentication
function openLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

async function handleLogin(e) {
    e.preventDefault();
    
    const name = document.getElementById('farmerName').value;
    const phone = document.getElementById('farmerPhone').value;
    
    try {
        const response = await fetch(`${API_URL}/farmers/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, phone })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.farmer;
            localStorage.setItem('farmer', JSON.stringify(currentUser));
            updateUIForLoggedInUser();
            closeLoginModal();
            alert('Login successful!');
        } else {
            alert(data.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('farmer');
    document.getElementById('loginBtn').textContent = 'Login';
    alert('Logged out successfully');
}

function updateUIForLoggedInUser() {
    document.getElementById('loginBtn').textContent = `👤 ${currentUser.name}`;
}

// Equipment Loading
async function loadEquipment() {
    try {
        const response = await fetch(`${API_URL}/equipment`);
        const data = await response.json();
        equipment = data;
        displayEquipment(equipment);
    } catch (error) {
        console.error('Error loading equipment:', error);
        // Use sample data if API fails
        equipment = getSampleEquipment();
        displayEquipment(equipment);
    }
}

function getSampleEquipment() {
    return [
        {
            id: 1,
            name: 'Heavy Duty Tractor',
            category: 'Tractor',
            price_per_day: 1500,
            status: 'available',
            description: 'Perfect for plowing and heavy farming tasks',
            image_url: getPlaceholderImage('Tractor')
        },
        {
            id: 2,
            name: 'Combine Harvester',
            category: 'Harvester',
            price_per_day: 2500,
            status: 'available',
            description: 'Efficient harvesting for wheat, rice, and corn',
            image_url: getPlaceholderImage('Harvester')
        },
        {
            id: 3,
            name: 'Modern Plough',
            category: 'Plough',
            price_per_day: 800,
            status: 'available',
            description: 'Advanced plough for soil preparation',
            image_url: getPlaceholderImage('Plough')
        },
        {
            id: 4,
            name: 'Crop Sprayer',
            category: 'Sprayer',
            price_per_day: 1200,
            status: 'rented',
            description: 'Efficient pesticide and fertilizer application',
            image_url: getPlaceholderImage('Sprayer')
        },
        {
            id: 5,
            name: 'Mini Tractor',
            category: 'Tractor',
            price_per_day: 1000,
            status: 'available',
            description: 'Compact tractor for small farms',
            image_url:getPlaceholderImage('Tractor')
        },
        {
            id: 6,
            name: 'Seed Drill',
            category: 'Plough',
            price_per_day: 600,
            status: 'available',
            description: 'Precision seed planting equipment',
            image_url: getPlaceholderImage('Plough')
        }
    ];
}

function displayEquipment(equipmentList) {
    const grid = document.getElementById('equipmentGrid');
    grid.innerHTML = '';
    
    equipmentList.forEach(item => {
        const card = createEquipmentCard(item);
        grid.appendChild(card);
    });
}

function createEquipmentCard(item) {
    const card = document.createElement('div');
    card.className = 'equipment-card';
    
    // ✅ USE THIS INSTEAD
    const imageUrl = item.image_url || getPlaceholderImage(item.category);
    
    card.innerHTML = `
        <img src="${imageUrl}" alt="${item.name}" class="equipment-image" onerror="this.src='${getPlaceholderImage(item.category)}'">
        <div class="equipment-info">
            <span class="equipment-category">${item.category}</span>
            <h3>${item.name}</h3>
            <p>${item.description}</p>
            <div class="equipment-price">₹${item.price_per_day}/day</div>
            <span class="equipment-status status-${item.status}">${item.status.toUpperCase()}</span>
            <br><br>
            ${item.status === 'available' ? 
                `<button class="btn btn-success" onclick="openBookingModal(${item.id})">Book Now</button>` :
                `<button class="btn" disabled>Not Available</button>`
            }
        </div>
    `;
    
    return card;
}
function getPlaceholderImage(category) {
    const images = {
        // ✅ USE PROPER DIRECT IMAGE URLs
        'Tractor': 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&h=300&fit=crop',
        'Harvester': 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&h=300&fit=crop',
        'Plough': 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=400&h=300&fit=crop',
        'Sprayer': 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&h=300&fit=crop'
    };
    return images[category] || 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&h=300&fit=crop';
}

// Filtering
function filterEquipment() {
    const category = document.getElementById('categoryFilter').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    let filtered = equipment;
    
    if (category !== 'all') {
        filtered = filtered.filter(item => item.category === category);
    }
    
    if (searchTerm) {
        filtered = filtered.filter(item => 
            item.name.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm)
        );
    }
    
    displayEquipment(filtered);
}

// Booking
function openBookingModal(equipmentId) {
    if (!currentUser) {
        alert('Please login to book equipment');
        openLoginModal();
        return;
    }
    
    selectedEquipment = equipment.find(e => e.id === equipmentId);
    document.getElementById('modalEquipmentName').value = selectedEquipment.name;
    document.getElementById('bookingModal').style.display = 'block';
    
    // Reset form
    document.getElementById('bookingForm').reset();
    document.getElementById('modalEquipmentName').value = selectedEquipment.name;
    document.getElementById('totalCost').textContent = '₹0';
}

function calculateTotalCost() {
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    
    if (startDate && endDate && selectedEquipment && endDate >= startDate) {
        const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        const total = days * selectedEquipment.price_per_day;
        document.getElementById('totalCost').textContent = `₹${total}`;
    }
}

async function handleBooking(e) {
    e.preventDefault();
    
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const location = document.getElementById('location').value;
    
    const booking = {
        equipment_id: selectedEquipment.id,
        farmer_id: currentUser.id,
        start_date: startDate,
        end_date: endDate,
        location: location
    };
    
    try {
        const response = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(booking)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Booking confirmed! Check your dashboard.');
            document.getElementById('bookingModal').style.display = 'none';
            loadEquipment(); // Refresh equipment list
        } else {
            alert(data.error || 'Booking failed');
        }
    } catch (error) {
        console.error('Booking error:', error);
        alert('Booking failed. Please try again.');
    }
}

// Dashboard
async function showDashboard() {
    document.getElementById('home').style.display = 'none';
    document.getElementById('equipment').style.display = 'none';
    document.getElementById('dashboard').classList.remove('hidden');
    
    await loadBookings();
    updateDashboardStats();
}

async function loadBookings() {
    try {
        const response = await fetch(`${API_URL}/bookings/farmer/${currentUser.id}`);
        const data = await response.json();
        bookings = data;
        displayBookings();
    } catch (error) {
        console.error('Error loading bookings:', error);
        bookings = [];
        displayBookings();
    }
}

function displayBookings() {
    const tbody = document.getElementById('bookingsBody');
    tbody.innerHTML = '';
    
    if (bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No bookings yet</td></tr>';
        return;
    }
    
    bookings.forEach(booking => {
        const row = document.createElement('tr');
        const equipmentItem = equipment.find(e => e.id === booking.equipment_id);
        const totalCost = calculateBookingCost(booking, equipmentItem);
        
        row.innerHTML = `
            <td>${equipmentItem ? equipmentItem.name : 'N/A'}</td>
            <td>${new Date(booking.start_date).toLocaleDateString()}</td>
            <td>${new Date(booking.end_date).toLocaleDateString()}</td>
            <td><span class="status-badge status-${booking.status}">${booking.status.toUpperCase()}</span></td>
            <td>₹${totalCost}</td>
            <td>
                ${booking.status === 'active' ? 
                    `<button class="btn btn-danger" onclick="cancelBooking(${booking.id})">Cancel</button>` :
                    '-'
                }
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

function calculateBookingCost(booking, equipmentItem) {
    if (!equipmentItem) return 0;
    const start = new Date(booking.start_date);
    const end = new Date(booking.end_date);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return days * equipmentItem.price_per_day;
}

function updateDashboardStats() {
    const activeBookings = bookings.filter(b => b.status === 'active').length;
    const totalBookings = bookings.length;
    const totalSpent = bookings.reduce((sum, booking) => {
        const equipmentItem = equipment.find(e => e.id === booking.equipment_id);
        return sum + calculateBookingCost(booking, equipmentItem);
    }, 0);
    
    document.getElementById('activeBookings').textContent = activeBookings;
    document.getElementById('totalBookings').textContent = totalBookings;
    document.getElementById('totalSpent').textContent = `₹${totalSpent}`;
}

async function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/bookings/${bookingId}/cancel`, {
            method: 'PUT'
        });
        
        if (response.ok) {
            alert('Booking cancelled successfully');
            await loadBookings();
            await loadEquipment();
            updateDashboardStats();
        } else {
            alert('Failed to cancel booking');
        }
    } catch (error) {
        console.error('Cancel booking error:', error);
        alert('Failed to cancel booking');
    }
}
