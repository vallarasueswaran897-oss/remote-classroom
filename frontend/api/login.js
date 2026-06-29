export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { email, password } = req.body;

  const users = [
    { email: 'student@gmail.com', password: '1234', role: 'student' },
    { email: 'teacher@gmail.com', password: '1234', role: 'teacher' },
  ];

  const user = users.find(u => u.email === email && u.password === password);

  if (user) {
    res.json({ success: true, role: user.role });
  } else {
    res.json({ success: false });
  }
}