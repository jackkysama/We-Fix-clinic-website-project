const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

const PORT = 3000;

/* ================= DATABASE ================= */

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root123', // change if needed
  database: 'clinic_db'
});

db.connect(err => {
  if (err) {
    console.log('❌ MySQL error:', err);
  } else {
    console.log('✅ MySQL connected');
  }
});

/* ================= AUTH MIDDLEWARE ================= */

function isAdmin(req, res, next) {
  const role = req.headers.role;

  if (role !== "admin") {
    return res.status(403).send({ success: false, message: "Access denied" });
  }

  next();
}

/* ================= LOGIN ================= */

// PATIENT LOGIN
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.query(
    'SELECT * FROM users WHERE email=? AND password=?',
    [email, password],
    (err, result) => {
      if (err) return res.send({ success: false });

      if (result.length > 0) {
        res.send({ success: true, role: "patient" });
      } else {
        res.send({ success: false });
      }
    }
  );
});

// EMPLOYEE / ADMIN LOGIN
app.post('/employee-login', (req, res) => {
  const { email, password } = req.body;

  db.query(
    'SELECT * FROM employees WHERE email=? AND password=?',
    [email, password],
    (err, result) => {

      if (err) return res.send({ success: false });

      if (result.length > 0) {

        if (email === "admin@test.com") {
          res.send({ success: true, role: "admin" });
        } else {
          res.send({ success: true, role: "employee" });
        }

      } else {
        res.send({ success: false });
      }
    }
  );
});

/* ================= REGISTER ================= */

app.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  db.query(
    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
    [name, email, password],
    (err) => {
      if (err) return res.send({ success: false });
      res.send({ success: true });
    }
  );
});

/* ================= BOOKINGS ================= */

// CREATE BOOKING
app.post('/book', (req, res) => {
  const { name, doctor, date, time, email } = req.body;

  db.query(
    'INSERT INTO appointments (name, doctor, date, time, email, status) VALUES (?, ?, ?, ?, ?, "Pending")',
    [name, doctor, date, time, email],
    () => res.send({ success: true })
  );
});

// READ BOOKINGS
app.get('/appointments', (req, res) => {
  db.query('SELECT * FROM appointments', (err, result) => {
    if (err) return res.send([]);
    res.send(result);
  });
});

// UPDATE BOOKING
app.put('/update/:id', (req, res) => {
  const role = req.headers.role;

  if (role !== "admin" && role !== "employee") {
    return res.status(403).send("Not allowed");
  }

  const { name, doctor, date, time } = req.body;

  db.query(
    'UPDATE appointments SET name=?, doctor=?, date=?, time=? WHERE id=?',
    [name, doctor, date, time, req.params.id],
    () => res.send({ success: true })
  );
});

// DELETE BOOKING (ADMIN ONLY)
app.delete('/delete/:id', isAdmin, (req, res) => {
  db.query(
    'DELETE FROM appointments WHERE id=?',
    [req.params.id],
    () => res.send({ success: true })
  );
});

// UPDATE STATUS
app.put('/status/:id', (req, res) => {
  const role = req.headers.role;

  if (role !== "admin" && role !== "employee") {
    return res.status(403).send("Not allowed");
  }

  db.query(
    'UPDATE appointments SET status=? WHERE id=?',
    [req.body.status, req.params.id],
    () => res.send({ success: true })
  );
});

/* ================= DOCTORS ================= */

// GET DOCTORS
app.get('/doctors', (req, res) => {
  db.query('SELECT * FROM doctors', (err, result) => {
    if (err) return res.send([]);
    res.send(result);
  });
});

// ADD DOCTOR
app.post('/doctors/add', isAdmin, (req, res) => {
  const { name, specialization } = req.body;

  db.query(
    'INSERT INTO doctors (name, specialization) VALUES (?, ?)',
    [name, specialization],
    (err) => {
      if (err) return res.send({ success: false });
      res.send({ success: true });
    }
  );
});

// UPDATE DOCTOR
app.put('/doctors/update/:id', isAdmin, (req, res) => {
  const { name, specialization } = req.body;

  db.query(
    'UPDATE doctors SET name=?, specialization=? WHERE id=?',
    [name, specialization, req.params.id],
    () => res.send({ success: true })
  );
});

// DELETE DOCTOR
app.delete('/doctors/delete/:id', isAdmin, (req, res) => {
  db.query(
    'DELETE FROM doctors WHERE id=?',
    [req.params.id],
    () => res.send({ success: true })
  );
});

/* ================= START SERVER ================= */

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
