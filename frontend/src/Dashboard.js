import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Classroom from './Classroom';

const supabase = createClient(
  'https://btdodewrpjnpiiizevnm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0ZG9kZXdycGpucGlpaXpldm5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3Mzk2NjgsImV4cCI6MjA5ODMxNTY2OH0.DNviFjwWe3FXmQGdTmLSD-FiVQRLhvf4zzeV816JDrM'
);

function Dashboard({ user }) {
  const [classroom, setClassroom] = useState(null);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    const { data } = await supabase
      .from('classes')
      .select('*')
      .order('date', { ascending: true });
    if (data) setClasses(data);
  };

  if (classroom) {
    return (
      <Classroom
        subject={classroom.subject}
        teacher={classroom.teacher_name}
        user={user}
        onBack={() => { setClassroom(null); fetchClasses(); }}
      />
    );
  }

  return (
    <div style={{ fontFamily: 'Arial', padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ backgroundColor: '#007bff', color: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>🎓 Remote Classroom</h2>
        <p style={{ margin: '5px 0 0' }}>Welcome, {user.name}! 👋</p>
      </div>

      <h3>📚 All Classes ({classes.length})</h3>

      {classes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <p>No classes yet! Wait for your teacher to add classes.</p>
        </div>
      )}

      {classes.map((cls) => (
        <div key={cls.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ margin: 0 }}>{cls.subject}</h4>
            <p style={{ margin: '5px 0 0', color: '#666' }}>
              👨‍🏫 {cls.teacher_name} | 🕐 {cls.time} | 📅 {cls.date}
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