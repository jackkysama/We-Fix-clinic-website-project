// Main application script with API integration

document.addEventListener('DOMContentLoaded', async function() {
    const bookBtn = document.querySelector('.btn');
    if (bookBtn && bookBtn.textContent === 'Book an Appointment') {
        bookBtn.addEventListener('click', function(e) {
            e.preventDefault();
            alert('Redirecting to booking page...');
            window.location.href = 'booking.html';
        });
    }

    // Login functionality
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;
            const messageDiv = document.getElementById('message');

            if (!username || !password || !role) {
                messageDiv.innerHTML = '<p style="color: red;">All fields are required.</p>';
                return;
            }

            try {
                messageDiv.innerHTML = '<p style="color: blue;">Logging in...</p>';
                const response = await loginUser(username, password, role);

                if (!response || !response.token) {
                    throw new Error('Login failed. Please try again.');
                }

                const targetPage = (response.user && response.user.role === 'admin') ? 'admin.html' : 'employee.html';
                messageDiv.innerHTML = `<p style="color: green;">Login successful! Redirecting to ${targetPage}...</p>`;
                window.location.assign(targetPage);
            } catch (error) {
                messageDiv.innerHTML = `<p style="color: red;">${error.message || 'Invalid credentials. Please try again.'}</p>`;
                console.error('Login error:', error);
            }
        });
    }

    // Booking functionality
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        // Load doctors on page load
        loadDoctorsForBooking();

        bookingForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const doctor = document.getElementById('doctor').value;
            const date = document.getElementById('date').value;
            const time = document.getElementById('time').value;
            const reason = document.getElementById('reason').value.trim();
            const messageDiv = document.getElementById('bookingMessage');

            // Validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;

            if (!name || !email || !phone || !doctor || !date || !time) {
                messageDiv.innerHTML = '<p style="color: red;">All fields are required.</p>';
                return;
            }

            if (!emailRegex.test(email)) {
                messageDiv.innerHTML = '<p style="color: red;">Please enter a valid email address.</p>';
                return;
            }

            if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
                messageDiv.innerHTML = '<p style="color: red;">Please enter a valid phone number.</p>';
                return;
            }

            try {
                messageDiv.innerHTML = '<p style="color: blue;">Creating booking...</p>';
                
                const bookingData = {
                    name,
                    email,
                    phone,
                    doctor_id: doctor,
                    date,
                    time,
                    reason
                };

                const response = await createBooking(bookingData);
                const doctorText = document.querySelector(`#doctor option[value="${doctor}"]`)?.textContent || '';
                
                showBookingConfirmation({
                    ...bookingData,
                    doctor_name: doctorText,
                    id: response.bookingId,
                    status: 'Confirmed'
                });

                showBookingDetails({
                    ...bookingData,
                    doctor_name: doctorText,
                    id: response.bookingId,
                    status: 'Confirmed'
                });

                bookingForm.reset();
                updateAvailableSlots();
            } catch (error) {
                messageDiv.innerHTML = `<p style="color: red;">${error.message}</p>`;
                console.error('Booking error:', error);
            }
        });

        // Update time slot availability when doctor or date changes
        document.getElementById('doctor').addEventListener('change', updateAvailableSlots);
        document.getElementById('date').addEventListener('change', updateAvailableSlots);
    }

    await loadHomepageDoctors();

    async function loadDoctorsForBooking() {
        const doctorSelect = document.getElementById('doctor');
        if (!doctorSelect) return;

        try {
            const doctors = await getDoctors();
            doctorSelect.innerHTML = '<option value="">Choose a Doctor</option>';
            doctors.forEach(doctor => {
                const option = document.createElement('option');
                option.value = doctor.id;
                option.textContent = `${doctor.name} - ${doctor.specialty}`;
                doctorSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading doctors:', error);
        }
    }

    async function loadHomepageDoctors() {
        const doctorsList = document.getElementById('doctorsList');
        if (!doctorsList) return;

        try {
            console.log('Homepage: fetching doctors from API');
            const doctors = await getDoctors();
            console.log('Homepage: doctors received', doctors);

            if (!doctors || doctors.length === 0) {
                doctorsList.innerHTML = '<p>No doctors available at this time.</p>';
                return;
            }

            doctorsList.innerHTML = doctors.map((doctor) => {
                const imageIndex = doctor.id && doctor.id >= 1 && doctor.id <= 5 ? doctor.id : 1;
                const imageUrl = `images/image${imageIndex}.jpeg`;
                return `
                    <div class="doctor-card">
                        <img src="${imageUrl}" alt="${doctor.name}">
                        <h3>${doctor.name}</h3>
                        <p><strong>Specialty:</strong> ${doctor.specialty}</p>
                        <p><strong>Experience:</strong> ${doctor.experience} years</p>
                        <p><strong>Education:</strong> ${doctor.education}</p>
                        <p>${doctor.description || 'Experienced medical professional ready to help you.'}</p>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Error loading homepage doctors:', error);
            doctorsList.innerHTML = '<p>Unable to load doctors right now. Please try again later.</p>';
        }
    }

    async function updateAvailableSlots() {
        const doctorSelect = document.getElementById('doctor');
        const dateInput = document.getElementById('date');
        const timeSelect = document.getElementById('time');
        const availabilityMessage = document.getElementById('availabilityMessage');

        if (!doctorSelect || !dateInput || !timeSelect) return;

        const doctorId = doctorSelect.value;
        const selectedDate = dateInput.value;

        if (!doctorId || !selectedDate) {
            if (availabilityMessage) {
                availabilityMessage.textContent = 'Select a doctor and date to see available slots.';
            }
            return;
        }

        try {
            const availableSlots = await getAvailableSlots(doctorId, selectedDate);
            timeSelect.innerHTML = '<option value="">Select Time</option>';

            if (availableSlots.length === 0) {
                if (availabilityMessage) {
                    availabilityMessage.textContent = 'No available slots for this doctor on the selected date.';
                }
            } else {
                availableSlots.forEach(slot => {
                    const option = document.createElement('option');
                    option.value = slot;
                    option.textContent = slot;
                    timeSelect.appendChild(option);
                });
                if (availabilityMessage) {
                    availabilityMessage.textContent = `Available slots: ${availableSlots.join(', ')}`;
                }
            }
        } catch (error) {
            if (availabilityMessage) {
                availabilityMessage.textContent = 'Failed to load available slots. Please try again.';
            }
            console.error('Error getting available slots:', error);
        }
    }

    function showBookingDetails(booking) {
        const card = document.getElementById('bookingConfirmationCard');
        if (!card) return;

        card.style.display = 'block';
        card.innerHTML = `
            <div style="background: #f7faff; border: 1px solid #cbd7ff; padding: 20px; border-radius: 20px; margin-top: 20px; box-shadow: 0 8px 20px rgba(102, 126, 234, 0.12);">
                <h3 style="color: #3b5bdb; margin-bottom: 15px;">Booking Confirmed</h3>
                <p><strong>Booking ID:</strong> ${booking.id}</p>
                <p><strong>Name:</strong> ${booking.patient_name || booking.name}</p>
                <p><strong>Email:</strong> ${booking.patient_email || booking.email}</p>
                <p><strong>Phone:</strong> ${booking.patient_phone || booking.phone}</p>
                <p><strong>Doctor:</strong> ${booking.doctor_name}</p>
                <p><strong>Date:</strong> ${booking.booking_date || booking.date}</p>
                <p><strong>Time:</strong> ${booking.booking_time || booking.time}</p>
                <p><strong>Status:</strong> ${booking.status}</p>
                <p style="margin-top: 15px; color: green; font-weight: 700;">Your appointment is confirmed.</p>
            </div>
        `;
    }

    function showBookingConfirmation(booking) {
        const confirmationHTML = `
            <div id="confirmation-modal" style="
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center;
                z-index: 1000;">
                <div style="
                    background: white; padding: 30px; border-radius: 15px; max-width: 500px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3); text-align: center;">
                    <h2 style="color: #667eea; margin-bottom: 20px;">Booking Confirmed!</h2>
                    <div style="text-align: left; margin-bottom: 20px;">
                        <p><strong>Name:</strong> ${booking.patient_name || booking.name}</p>
                        <p><strong>Email:</strong> ${booking.patient_email || booking.email}</p>
                        <p><strong>Phone:</strong> ${booking.patient_phone || booking.phone}</p>
                        <p><strong>Doctor:</strong> ${booking.doctor_name}</p>
                        <p><strong>Date:</strong> ${booking.booking_date || booking.date}</p>
                        <p><strong>Time:</strong> ${booking.booking_time || booking.time}</p>
                        <p><strong>Booking ID:</strong> ${booking.id}</p>
                    </div>
                    <p style="color: green; font-weight: bold;">✓ Confirmation has been processed</p>
                    <button onclick="closeConfirmation()" style="
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white; border: none; padding: 10px 20px; border-radius: 25px;
                        cursor: pointer; margin-top: 20px;">Close</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', confirmationHTML);
    }

    // Make closeConfirmation global
    window.closeConfirmation = function() {
        const modal = document.getElementById('confirmation-modal');
        if (modal) modal.remove();
    };

    // Admin dashboard functionality
    const role = localStorage.getItem('userRole');
    const username = localStorage.getItem('username');
    const dashboardTitle = document.getElementById('dashboardTitle');

    if (dashboardTitle) {
        dashboardTitle.textContent = role === 'admin' ? 'Admin Dashboard' : 'Employee Dashboard';
    }

    const onAdminPage = window.location.pathname.includes('admin.html');
    const onEmployeePage = window.location.pathname.includes('employee.html');

    if (!role && (onAdminPage || onEmployeePage)) {
        window.location.href = 'login.html';
        return;
    }

    if (onAdminPage && role !== 'admin') {
        window.location.href = 'employee.html';
        return;
    }

    if (onEmployeePage && role !== 'employee') {
        window.location.href = 'admin.html';
        return;
    }

    if ((onAdminPage || onEmployeePage) && role) {
        const viewBookingsBtn = document.getElementById('viewBookings');
        const manageDoctorsBtn = document.getElementById('manageDoctors');
        const logoutBtn = document.getElementById('logout');
        const contentArea = document.getElementById('contentArea');

        if (manageDoctorsBtn && role !== 'admin') {
            manageDoctorsBtn.style.display = 'none';
        }

        if (viewBookingsBtn) {
            viewBookingsBtn.addEventListener('click', async function() {
                await renderBookings();
            });
        }

        if (manageDoctorsBtn && role === 'admin') {
            manageDoctorsBtn.addEventListener('click', async function() {
                await renderDoctors();
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                logoutUser();
            });
        }

        window.renderBookings = async function() {
            try {
                const bookings = await getBookings();
                window.currentBookings = bookings;
                let html = '<h3>All Bookings</h3>';
                
                if (bookings.length === 0) {
                    html += '<p>No bookings yet.</p>';
                } else {
                    html += `
                        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                            <thead>
                                <tr style="background-color: #667eea; color: white;">
                                    <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Name</th>
                                    <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Email</th>
                                    <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Phone</th>
                                    <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Doctor</th>
                                    <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Date</th>
                                    <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Time</th>
                                    <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Status</th>
                                    <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;

                    bookings.forEach(booking => {
                        html += `
                            <tr style="border: 1px solid #ddd;">
                                <td style="padding: 10px; border: 1px solid #ddd;">${booking.patient_name}</td>
                                <td style="padding: 10px; border: 1px solid #ddd;">${booking.patient_email}</td>
                                <td style="padding: 10px; border: 1px solid #ddd;">${booking.patient_phone}</td>
                                <td style="padding: 10px; border: 1px solid #ddd;">${booking.doctor_name}</td>
                                <td style="padding: 10px; border: 1px solid #ddd;">${booking.booking_date}</td>
                                <td style="padding: 10px; border: 1px solid #ddd;">${booking.booking_time}</td>
                                <td style="padding: 10px; border: 1px solid #ddd;">
                                    <select id="status-${booking.id}" style="padding: 5px; width: 140px;">
                                        <option value="Confirmed" ${booking.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                                        <option value="Completed" ${booking.status === 'Completed' ? 'selected' : ''}>Completed</option>
                                        <option value="Cancelled" ${booking.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                                    </select>
                                </td>
                                <td style="padding: 10px; border: 1px solid #ddd; display: flex; gap: 5px; flex-wrap: wrap;">
                                    <button onclick="saveBookingStatus(${booking.id})" class="btn" style="padding: 8px 10px;">Save Status</button>
                                    <button onclick="openBookingEditor(${booking.id})" class="btn" style="padding: 8px 10px;">Edit</button>
                                    <button onclick="deleteBooking(${booking.id})" class="btn" style="padding: 8px 10px; background-color: #e74c3c;">Delete</button>
                                </td>
                            </tr>
                        `;
                    });

                    html += `
                            </tbody>
                        </table>
                    `;
                }

                contentArea.innerHTML = html;
            } catch (error) {
                contentArea.innerHTML = `<p style="color: red;">Error loading bookings: ${error.message}</p>`;
            }
        }

        window.renderDoctors = async function() {
            try {
                const doctors = await getDoctors();
                let html = '<h3>Doctors</h3>';
                
                if (doctors.length === 0) {
                    html += '<p>No doctors found.</p>';
                } else {
                    html += '<div class="doctor-management-grid">';

                    doctors.forEach(doctor => {
                        const imageIndex = doctor.id && doctor.id >= 1 && doctor.id <= 5 ? doctor.id : 1;
                        const imageUrl = `images/image${imageIndex}.jpeg`;
                        html += `
                            <div class="doctor-card doctor-management-card">
                                <img src="${imageUrl}" alt="${doctor.name}">
                                <div class="doctor-card-body">
                                    <h3>${doctor.name}</h3>
                                    <p><strong>Specialty:</strong> ${doctor.specialty}</p>
                                    <p><strong>Experience:</strong> ${doctor.experience} years</p>
                                    <p><strong>Education:</strong> ${doctor.education}</p>
                                    <p>${doctor.description || 'Experienced medical professional ready to help you.'}</p>
                                </div>
                                <div class="doctor-card-actions">
                                    <button onclick="openDoctorEditor(${doctor.id})" class="btn">Edit</button>
                                </div>
                            </div>
                        `;
                    });

                    html += '</div>';
                }

                contentArea.innerHTML = html;
            } catch (error) {
                contentArea.innerHTML = `<p style="color: red;">Error loading doctors: ${error.message}</p>`;
            }
        }
    } else if (window.location.pathname.includes('admin.html') && !role) {
        // Redirect to login if not logged in
        window.location.href = 'login.html';
    }
});

window.saveBookingStatus = async function(id) {
    const statusSelect = document.getElementById(`status-${id}`);
    if (!statusSelect) {
        console.error('saveBookingStatus: status select element not found for id', id);
        return;
    }

    const status = statusSelect.value;
    console.log('saveBookingStatus:', { id, status });
    try {
        await updateBookingStatus(id, status);
        alert('Booking status updated successfully.');
        await renderBookings();
    } catch (error) {
        console.error('saveBookingStatus failed for id', id, error);
        alert(`Failed to update booking status: ${error.message}`);
    }
};

window.openBookingEditor = async function(id) {
    try {
        const bookings = window.currentBookings || await getBookings();
        const booking = bookings.find(item => item.id === id);
        const doctors = await getDoctors();
        
        if (!booking) {
            alert('Booking not found');
            return;
        }

        const modalHTML = `
            <div id="booking-editor-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000;">
                <div style="background: white; width: 90%; max-width: 700px; padding: 30px; border-radius: 20px; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                    <button onclick="closeBookingEditor()" style="position: absolute; top: 20px; right: 20px; background: transparent; border: none; font-size: 1.5rem; cursor: pointer;">×</button>
                    <h3 style="margin-bottom: 20px; color: #667eea;">Edit Booking</h3>
                    <form id="bookingEditorForm">
                        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 15px;">
                            <label style="display: block;"><strong>Patient Name</strong><input type="text" id="editPatientName" value="${booking.patient_name}" style="width: 100%; padding: 10px; margin-top: 8px;" required></label>
                            <label style="display: block;"><strong>Email</strong><input type="email" id="editPatientEmail" value="${booking.patient_email}" style="width: 100%; padding: 10px; margin-top: 8px;" required></label>
                            <label style="display: block;"><strong>Phone</strong><input type="text" id="editPatientPhone" value="${booking.patient_phone}" style="width: 100%; padding: 10px; margin-top: 8px;" required></label>
                            <label style="display: block;"><strong>Doctor</strong><select id="editDoctor" style="width: 100%; padding: 10px; margin-top: 8px;" required>${doctors.map(doc => `<option value="${doc.id}" ${doc.id === booking.doctor_id ? 'selected' : ''}>${doc.name} - ${doc.specialty}</option>`).join('')}</select></label>
                            <label style="display: block;"><strong>Date</strong><input type="date" id="editDate" value="${booking.booking_date}" style="width: 100%; padding: 10px; margin-top: 8px;" required></label>
                            <label style="display: block;"><strong>Time</strong><input type="text" id="editTime" value="${booking.booking_time}" style="width: 100%; padding: 10px; margin-top: 8px;" required></label>
                            <label style="grid-column: span 2; display: block;"><strong>Reason</strong><textarea id="editReason" style="width: 100%; padding: 10px; margin-top: 8px;" rows="3">${booking.reason_for_visit || ''}</textarea></label>
                            <label style="display: block;"><strong>Status</strong><select id="editStatus" style="width: 100%; padding: 10px; margin-top: 8px;" required>
                                <option value="Confirmed" ${booking.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                                <option value="Completed" ${booking.status === 'Completed' ? 'selected' : ''}>Completed</option>
                                <option value="Cancelled" ${booking.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                            </select></label>
                        </div>
                        <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
                            <button type="button" onclick="closeBookingEditor()" class="btn" style="background: #ccc; color: #333;">Cancel</button>
                            <button type="submit" class="btn" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        document.getElementById('bookingEditorForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            await submitBookingUpdate(id);
        });
    } catch (error) {
        alert(`Failed to open booking editor: ${error.message}`);
        console.error(error);
    }
};

window.submitBookingUpdate = async function(id) {
    const name = document.getElementById('editPatientName').value.trim();
    const email = document.getElementById('editPatientEmail').value.trim();
    const phone = document.getElementById('editPatientPhone').value.trim();
    const doctorId = document.getElementById('editDoctor').value;
    const date = document.getElementById('editDate').value;
    const time = document.getElementById('editTime').value;
    const reason = document.getElementById('editReason').value.trim();
    const status = document.getElementById('editStatus').value;

    try {
        await updateBooking(id, {
            patient_name: name,
            patient_email: email,
            patient_phone: phone,
            doctor_id: parseInt(doctorId),
            booking_date: date,
            booking_time: time,
            reason_for_visit: reason,
            status
        });
        alert('Booking updated successfully.');
        closeBookingEditor();
        await renderBookings();
    } catch (error) {
        alert(`Failed to update booking: ${error.message}`);
        console.error(error);
    }
};

window.closeBookingEditor = function() {
    const modal = document.getElementById('booking-editor-modal');
    if (modal) modal.remove();
};

window.openDoctorEditor = async function(id) {
    try {
        const doctor = await getDoctor(id);
        if (!doctor) {
            alert('Doctor not found');
            return;
        }

        const modalHTML = `
            <div id="doctor-editor-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000;">
                <div style="background: white; width: 90%; max-width: 700px; padding: 30px; border-radius: 20px; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                    <button onclick="closeDoctorEditor()" style="position: absolute; top: 20px; right: 20px; background: transparent; border: none; font-size: 1.5rem; cursor: pointer;">×</button>
                    <h3 style="margin-bottom: 20px; color: #667eea;">Edit Doctor</h3>
                    <form id="doctorEditorForm">
                        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 15px;">
                            <label style="display: block;"><strong>Name</strong><input type="text" id="editDoctorName" value="${doctor.name}" style="width: 100%; padding: 10px; margin-top: 8px;" required></label>
                            <label style="display: block;"><strong>Specialty</strong><input type="text" id="editDoctorSpecialty" value="${doctor.specialty}" style="width: 100%; padding: 10px; margin-top: 8px;" required></label>
                            <label style="display: block;"><strong>Experience</strong><input type="number" id="editDoctorExperience" value="${doctor.experience}" style="width: 100%; padding: 10px; margin-top: 8px;" required></label>
                            <label style="display: block;"><strong>Education</strong><input type="text" id="editDoctorEducation" value="${doctor.education}" style="width: 100%; padding: 10px; margin-top: 8px;" required></label>
                            <label style="grid-column: span 2; display: block;"><strong>Description</strong><textarea id="editDoctorDescription" style="width: 100%; padding: 10px; margin-top: 8px;" rows="3">${doctor.description || ''}</textarea></label>
                            <label style="grid-column: span 2; display: block;"><strong>Image URL</strong><input type="url" id="editDoctorImageUrl" value="${doctor.image_url || ''}" style="width: 100%; padding: 10px; margin-top: 8px;"></label>
                        </div>
                        <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
                            <button type="button" onclick="closeDoctorEditor()" class="btn" style="background: #ccc; color: #333;">Cancel</button>
                            <button type="submit" class="btn" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">Save Doctor</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        document.getElementById('doctorEditorForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            await submitDoctorUpdate(id);
        });
    } catch (error) {
        alert(`Failed to open doctor editor: ${error.message}`);
        console.error(error);
    }
};

window.submitDoctorUpdate = async function(id) {
    const name = document.getElementById('editDoctorName').value.trim();
    const specialty = document.getElementById('editDoctorSpecialty').value.trim();
    const experience = document.getElementById('editDoctorExperience').value.trim();
    const education = document.getElementById('editDoctorEducation').value.trim();
    const description = document.getElementById('editDoctorDescription').value.trim();
    const image_url = document.getElementById('editDoctorImageUrl').value.trim();

    try {
        await updateDoctor(id, {
            name,
            specialty,
            experience: parseInt(experience, 10),
            education,
            description,
            image_url
        });
        alert('Doctor updated successfully.');
        closeDoctorEditor();
        await renderDoctors();
    } catch (error) {
        alert(`Failed to update doctor: ${error.message}`);
        console.error(error);
    }
};

window.closeDoctorEditor = function() {
    const modal = document.getElementById('doctor-editor-modal');
    if (modal) modal.remove();
};

    // Chatbot functionality
    const chatbotButton = document.getElementById('chatbot-button');
    let chatbot = null;
    let isChatbotOpen = false;

    if (chatbotButton) {
        chatbotButton.addEventListener('click', () => {
            if (!isChatbotOpen) {
                openChatbot();
            } else {
                closeChatbot();
            }
        });
    }

function openChatbot() {
    if (chatbot) return;

    chatbot = document.createElement('div');
    chatbot.id = 'chatbot';
    chatbot.innerHTML = `
        <div id="chatbot-header">
            <span>Boka AI</span>
            <span id="chatbot-toggle">×</span>
        </div>
        <div id="chatbot-messages"></div>
        <input type="text" id="chatbot-input" placeholder="Ask Boka AI...">
    `;
    document.body.appendChild(chatbot);

    // Add event listeners
    const chatbotToggle = chatbot.querySelector('#chatbot-toggle');
    const chatbotInput = chatbot.querySelector('#chatbot-input');

    if (chatbotToggle) {
        chatbotToggle.addEventListener('click', closeChatbot);
    }

    if (chatbotInput) {
        chatbotInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const message = chatbotInput.value.trim();
                if (message) {
                    addMessage('You', message);
                    respondToMessage(message);
                    chatbotInput.value = '';
                }
            }
        });
    }

    isChatbotOpen = true;
}

function closeChatbot() {
    if (chatbot) {
        document.body.removeChild(chatbot);
        chatbot = null;
    }
    isChatbotOpen = false;
}

function addMessage(sender, message) {
    if (chatbot) {
        const chatbotMessages = chatbot.querySelector('#chatbot-messages');
        if (chatbotMessages) {
            const messageDiv = document.createElement('div');
            messageDiv.innerHTML = `<strong>${sender}:</strong> ${message}`;
            chatbotMessages.appendChild(messageDiv);
            chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        }
    }
}

function respondToMessage(message) {
    const lowerMessage = message.toLowerCase();
    let response = "I'm sorry, I didn't understand that. Can you please rephrase?";

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        response = "Hello! Welcome to We Fix Clinic. How can I assist you today?";
    } else if (lowerMessage.includes('appointment') || lowerMessage.includes('book')) {
        response = "To book an appointment, please visit our booking page or call us at (123) 456-7890. We have doctors available in General Medicine, Cardiology, Pediatrics, Dermatology, and Orthopedics.";
    } else if (lowerMessage.includes('doctor') || lowerMessage.includes('doctors')) {
        response = "We have 5 experienced doctors: Dr. John Smith (General Medicine), Dr. Emily Johnson (Cardiology), Dr. Michael Williams (Pediatrics), Dr. Sarah Brown (Dermatology), and Dr. David Lee (Orthopedics). Our receptionist Jane Doe can help with scheduling.";
    } else if (lowerMessage.includes('hours') || lowerMessage.includes('open')) {
        response = "Our clinic is open Monday to Friday from 9 AM to 5 PM, and Saturday from 9 AM to 1 PM. We are closed on Sundays.";
    } else if (lowerMessage.includes('contact') || lowerMessage.includes('phone')) {
        response = "You can contact us at info@wefixclinic.com or call (123) 456-7890. Our address is 123 Health Street, Medical City.";
    } else if (lowerMessage.includes('services')) {
        response = "We offer General Medicine, Specialist Consultations (Cardiology, Pediatrics, Dermatology, Orthopedics), and Emergency Care. We also provide preventive care and health screenings.";
    } else if (lowerMessage.includes('emergency')) {
        response = "For emergencies, please call 911 immediately or go to the nearest emergency room. For urgent but non-life-threatening issues, we offer same-day appointments.";
    } else if (lowerMessage.includes('insurance')) {
        response = "We accept most major insurance plans. Please contact our receptionist to verify coverage for your specific plan.";
    } else if (lowerMessage.includes('location') || lowerMessage.includes('address')) {
        response = "We are located at 123 Health Street, Medical City. Free parking is available on-site.";
    }

    setTimeout(() => addMessage('Boka AI', response), 500);
}
