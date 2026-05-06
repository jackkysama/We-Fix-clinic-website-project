# We Fix Clinic Website

This is a fully functional website for We Fix Clinic, including homepage, doctor listings, appointment booking, and admin/employee login system.

## Files

- `index.html`: Homepage with navigation, hero section with background image, services, about, doctors list with images
- `booking.html`: Appointment booking form
- `login.html`: Login page for admin and employee roles
- `admin.html`: Admin dashboard (used for both admin and employee for demo)
- `css/style.css`: Styles for all pages
- `js/script.js`: JavaScript for functionality

## Features

- **Homepage**: Full-screen hero with background image, services, statistics, about, doctors list with images, patient testimonials
- **Modern UI**: Gradient backgrounds, smooth animations, hover effects, Poppins font, responsive design
- **Doctors Page**: Integrated into homepage (no separate page)
- **Booking System**: Advanced booking with validation, duplicate prevention, confirmation notifications
  - Email and phone validation
  - Prevents duplicate bookings for same doctor/date/time
  - Simulated email and SMS confirmations with booking details
- **Login System**: Separate logins for Admin and Employee
  - Admin credentials: username `admin`, password `admin`
  - Employee credentials: username `emp`, password `emp`
- **Admin Dashboard**: View confirmed bookings with full details, manage doctors (basic), logout
- **Boka AI Chatbot**: Advanced AI assistant for common queries about the clinic

## Staff

- **Doctors (5)**: Dr. John Smith, Dr. Emily Johnson, Dr. Michael Williams, Dr. Sarah Brown, Dr. David Lee (with professional images)
- **Receptionist (1)**: Jane Doe (with image)

## Usage

1. Open `index.html` in a web browser to start
2. Navigate to different pages using the menu
3. Book appointments on the booking page
4. Login as admin or employee to access the dashboard
5. View bookings in the admin dashboard

## Data Storage

- Bookings are stored in browser localStorage
- Login status is maintained in localStorage

## Customization

- Edit HTML files to change content
- Modify `css/style.css` for styling
- Update `js/script.js` for functionality changes

## Troubleshooting

- Ensure JavaScript is enabled in your browser
- Clear localStorage if issues with data persistence
- For production use, implement server-side authentication and database
