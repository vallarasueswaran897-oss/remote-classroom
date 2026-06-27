import { useState } from 'react';
import Dashboard from './Dashboard';
import TeacherDashboard from './TeacherDashboard';

function App() {
  const [page, setPage] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  const handleLogin = async () => {
    if (!name.trim()) {
      setError('Please enter your name!');
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (data.success) {
        setUser({ ...data, name: name });
        setPage('dashboard');
      } else {
        setError('Wrong email or password!');
      }
    } catch (err) {
      setError('Server not running! Start backend first.');
    }
  };

  if (page === 'dashboard' && user && user.role === 'teacher') {
    return <TeacherDashboard user={user} />;
  }

  if (page === 'dashboard' && user && user.role === 'student') {
    return <Dashboard user={user} />;
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '80px', fontFamily: 'Arial' }}>
      <h1>🎓 Remote Classroom</h1>
      <h3 style={{ color: '#666' }}>Rural College Portal</h3>
      <br />
      <input
        placeholder="Your Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ padding: '10px', width: '250px', display: 'block', margin: '10px auto', borderRadius: '5px', border: '1px solid #ddd' }}
      />
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ padding: '10px', width: '250px', display: 'block', margin: '10px auto', borderRadius: '5px', border: '1px solid #ddd' }}
      />
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ padding: '10px', width: '250px', display: 'block', margin: '10px auto', borderRadius: '5px', border: '1px solid #ddd' }}
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <br />
      <button
        onClick={handleLogin}
        style={{ padding: '12px 40px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>
        Login 🚀
      </button>
      <br /><br />
      <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', display: 'inline-block', textAlign: 'left' }}>
        <p style={{ margin: '5px 0', color: '#666' }}>🎓 Student: student@gmail.com / 1234</p>
        <p style={{ margin: '5px 0', color: '#666' }}>👨‍🏫 Teacher: teacher@gmail.com / 1234</p>
      </div>
    </div>
  );
}

export default App;