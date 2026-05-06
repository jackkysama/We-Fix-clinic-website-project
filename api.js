// API Configuration
const API_URL = 'http://localhost:5001/api';

// Utility function to make API calls
async function apiCall(endpoint, method = 'GET', data = null, useAuth = false) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (useAuth) {
        const token = localStorage.getItem('authToken');
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }
    }

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);
        
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('userRole');
                window.location.href = 'login.html';
            }
            const errorData = await response.json();
            throw new Error(errorData.message || 'API Error');
        }

        return await response.json();
    } catch (error) {
        console.error(`API Error at ${endpoint}:`, error);
        throw error;
    }
}

// Authentication Functions
async function loginUser(username, password, role) {
    const response = await apiCall('/auth/login', 'POST', {
        username,
        password,
        role
    });

    if (response.token) {
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('userRole', response.user.role);
        localStorage.setItem('userId', response.user.id);
        localStorage.setItem('username', response.user.username);
    }

    return response;
}

function logoutUser() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    window.location.href = 'login.html';
}

function isUserLoggedIn() {
    return !!localStorage.getItem('authToken');
}

function getUserRole() {
    return localStorage.getItem('userRole');
}

// Booking Functions
async function createBooking(bookingData) {
    const response = await apiCall('/bookings', 'POST', {
        patient_name: bookingData.name,
        patient_email: bookingData.email,
        patient_phone: bookingData.phone,
        doctor_id: parseInt(bookingData.doctor_id),
        booking_date: bookingData.date,
        booking_time: bookingData.time,
        reason_for_visit: bookingData.reason
    });

    return response;
}

async function getBookings() {
    const response = await apiCall('/bookings', 'GET', null, true);
    return response.bookings || [];
}

async function updateBookingStatus(bookingId, status) {
    const response = await apiCall(`/bookings/${bookingId}`, 'PUT', { status }, true);
    return response;
}

async function updateBooking(bookingId, bookingData) {
    const response = await apiCall(`/bookings/${bookingId}`, 'PUT', bookingData, true);
    return response;
}

async function deleteBooking(bookingId) {
    const response = await apiCall(`/bookings/${bookingId}`, 'DELETE', null, true);
    return response;
}

// Doctor Functions
async function getDoctors() {
    const response = await apiCall('/doctors', 'GET');
    return response.doctors || [];
}

async function getDoctor(doctorId) {
    const response = await apiCall(`/doctors/${doctorId}`, 'GET');
    return response.doctor;
}

async function updateDoctor(doctorId, doctorData) {
    const response = await apiCall(`/doctors/${doctorId}`, 'PUT', doctorData, true);
    return response;
}

async function getAvailableSlots(doctorId, date) {
    const response = await apiCall(`/doctors/${doctorId}/availability?date=${date}`, 'GET');
    return response.availableSlots || [];
}

// Testimonial Functions
async function getTestimonials() {
    const response = await apiCall('/testimonials', 'GET');
    return response.testimonials || [];
}

async function createTestimonial(patientName, message) {
    const response = await apiCall('/testimonials', 'POST', {
        patient_name: patientName,
        message
    });

    return response;
}
