const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Uploads folder create பண்றோம்
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// File save settings
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Static files serve பண்றோம் (download-க்கு)
app.use('/uploads', express.static('uploads'));

const users = [
  { id: 1, email: 'student@gmail.com', password: '1234', role: 'student' },
  { id: 2, email: 'teacher@gmail.com', password: '1234', role: 'teacher' },
];

let classes = [
  { id: 1, subject: 'Mathematics', teacherName: 'Dr. Kumar', time: '10:00 AM', date: '2026-06-27', students: 45 },
  { id: 2, subject: 'Physics', teacherName: 'Dr. Priya', time: '12:00 PM', date: '2026-06-27', students: 38 },
  { id: 3, subject: 'Computer Science', teacherName: 'Dr. Raj', time: '2:00 PM', date: '2026-06-27', students: 52 },
];

let materials = [];
let assignments = [];
let submissions = [];
let attendance = [];

// Login
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (user) res.json({ success: true, role: user.role, id: user.id });
  else res.json({ success: false });
});

// Classes
app.get('/classes', (req, res) => res.json(classes));
app.post('/classes', (req, res) => {
  const newClass = { id: classes.length + 1, ...req.body, students: 0 };
  classes.push(newClass);
  res.json({ success: true, class: newClass });
});
app.delete('/classes/:id', (req, res) => {
  classes = classes.filter(c => c.id !== parseInt(req.params.id));
  res.json({ success: true });
});

// Materials - File Upload
app.get('/materials', (req, res) => res.json(materials));

app.post('/materials', upload.single('file'), (req, res) => {
  const { title, subject, teacherName } = req.body;
  const newMaterial = {
    id: materials.length + 1,
    title,
    subject,
    teacherName,
    filename: req.file.originalname,
    filepath: req.file.filename,
    uploadedAt: new Date().toLocaleString()
  };
  materials.push(newMaterial);
  res.json({ success: true, material: newMaterial });
});

app.delete('/materials/:id', (req, res) => {
  const material = materials.find(m => m.id === parseInt(req.params.id));
  if (material) {
    try { fs.unlinkSync('uploads/' + material.filepath); } catch (e) {}
  }
  materials = materials.filter(m => m.id !== parseInt(req.params.id));
  res.json({ success: true });
});

// Assignments
app.get('/assignments', (req, res) => res.json(assignments));
app.post('/assignments', (req, res) => {
  const newAssignment = { id: assignments.length + 1, ...req.body, createdAt: new Date().toLocaleString() };
  assignments.push(newAssignment);
  res.json({ success: true });
});

// Submissions
app.get('/submissions', (req, res) => res.json(submissions));
app.post('/submissions', (req, res) => {
  const existing = submissions.find(s => s.assignmentId === req.body.assignmentId && s.studentName === req.body.studentName);
  if (existing) return res.json({ success: false, message: 'Already submitted!' });
  submissions.push({ id: submissions.length + 1, ...req.body, submittedAt: new Date().toLocaleString() });
  res.json({ success: true });
});

// Attendance
app.get('/attendance', (req, res) => res.json(attendance));
app.post('/attendance', (req, res) => {
  const existing = attendance.find(a => a.subject === req.body.subject && a.studentName === req.body.studentName && a.date === req.body.date);
  if (!existing) attendance.push({ id: attendance.length + 1, ...req.body });
  res.json({ success: true });
});

app.listen(5000, () => console.log('Server running on port 5000'));