import { useState, useEffect } from 'react';
import Classroom from './Classroom';

function Dashboard({ user }) {
  const [classroom, setClassroom] = useState(null);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    const res = await fetch('http://localhost:5000/classes');
    const data = await res.json();
    setClasses(data);
  };

  if (classroom) {
    return (
      <Classroom
        subject={classroom.subject}
        teacher={classroom.teacherName}
        user={user}
        onBack={() => setClassroom(null)}
      />
    );
  }

  return (
    <div style={{ fontFamily: 'Arial', padding: '20px', maxWidth: '800px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ backgroundColor: '#007bff', color: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>🎓 Remote Classroom</h2>
        <p style={{ margin: '5px 0 0 0' }}>Welcome, {user.name}! 👋</p>
      </div>

      {/* Classes */}
      <h3>📚 Today's Classes ({classes.length})</h3>

      {classes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <p>இன்னும் class schedule ஆகல! கொஞ்சம் நேரம் காத்திரு.</p>
        </div>
      )}

      {classes.map((cls) => (
        <div key={cls.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ margin: 0 }}>{cls.subject}</h4>
            <p style={{ margin: '5px 0 0 0', color: '#666' }}>
              👨‍🏫 {cls.teacherName} | 🕐 {cls.time} | 📅 {cls.date}
            </p>
            <p style={{ margin: '3px 0 0 0', color: '#888', fontSize: '14px' }}>
              👥 {cls.students} Students enrolled
            </p>
          </div>
          <button
            onClick={() => setClassroom(cls)}
            style={{ backgroundColor: '#28a745', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>
            Join Class 🚀
          </button>
        </div>
      ))}

    </div>
  );
}

export default Dashboard;