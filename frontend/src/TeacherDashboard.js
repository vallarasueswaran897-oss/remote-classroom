import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Classroom from './Classroom';

const supabase = createClient(
  'https://btdodewrpjnpiiizevnm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0ZG9kZXdycGpucGlpaXpldm5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3Mzk2NjgsImV4cCI6MjA5ODMxNTY2OH0.DNviFjwWe3FXmQGdTmLSD-FiVQRLhvf4zzeV816JDrM'
);

function TeacherDashboard({ user }) {
  const [classroom, setClassroom] = useState(null);
  const [classes, setClasses] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newClass, setNewClass] = useState({ subject: '', time: '', date: '' });

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    const { data } = await supabase.from('classes').select('*').eq('teacher_name', user.name);
    if (data) setClasses(data);
  };

  const addClass = async () => {
    if (!newClass.subject || !newClass.time || !newClass.date) {
      alert('Please fill all fields!');
      return;
    }
    await supabase.from('classes').insert([{
      subject: newClass.subject,
      time: newClass.time,
      date: newClass.date,
      teacher_name: user.name
    }]);
    setNewClass({ subject: '', time: '', date: '' });
    setShowAddForm(false);
    fetchClasses();
  };

  const deleteClass = async (id) => {
    if (window.confirm('Delete this class?')) {
      await supabase.from('classes').delete().eq('id', id);
      fetchClasses();
    }
  };

  if (classroom) {
    return (
      <Classroom
        subject={classroom.subject}
        teacher={user.name}
        user={user}
        onBack={() => { setClassroom(null); fetchClasses(); }}
      />
    );
  }

  return (
    <div style={{ fontFamily: 'Arial', padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ backgroundColor: '#28a745', color: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>Teacher Dashboard</h2>
          <p style={{ margin: '5px 0 0' }}>Welcome, {user.name}!</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{ backgroundColor: 'white', color: '#28a745', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
          {showAddForm ? 'Cancel' : '+ Add Class'}
        </button>
      </div>

      {showAddForm && (
        <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ddd' }}>
          <h3 style={{ margin: '0 0 15px 0' }}>New Class</h3>
          <input placeholder="Subject Name" value={newClass.subject}
            onChange={(e) => setNewClass({ ...newClass, subject: e.target.value })}
            style={{ padding: '10px', width: '100%', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
          <input placeholder="Time (e.g. 10:00 AM)" value={newClass.time}
            onChange={(e) => setNewClass({ ...newClass, time: e.target.value })}
            style={{ padding: '10px', width: '100%', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
          <input type="date" value={newClass.date}
            onChange={(e) => setNewClass({ ...newClass, date: e.target.value })}
            style={{ padding: '10px', width: '100%', marginBottom: '15px', borderRadius: '5px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
          <button onClick={addClass}
            style={{ padding: '10px 30px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', width: '100%', fontSize: '16px' }}>
            Create Class
          </button>
        </div>
      )}

      <h3>Your Classes ({classes.length})</h3>

      {classes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <p>No classes yet! Click Add Class.</p>
        </div>
      )}

      {classes.map((cls) => (
        <div key={cls.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ margin: 0 }}>{cls.subject}</h4>
            <p style={{ margin: '5px 0 0', color: '#666' }}>{cls.teacher_name} | {cls.time} | {cls.date}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setClassroom(cls)}
              style={{ backgroundColor: '#007bff', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              Start Class
            </button>
            <button onClick={() => deleteClass(cls.id)}
              style={{ backgroundColor: '#dc3545', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TeacherDashboard;