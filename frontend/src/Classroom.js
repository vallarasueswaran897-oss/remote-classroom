import { useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://btdodewrpjnpiiizevnm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0ZG9kZXdycGpucGlpaXpldm5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3Mzk2NjgsImV4cCI6MjA5ODMxNTY2OH0.DNviFjwWe3FXmQGdTmLSD-FiVQRLhvf4zzeV816JDrM'
);

function Classroom({ subject, teacher, user, onBack }) {
  const jitsiContainer = useRef(null);
  const apiRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [materialTitle, setMaterialTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [newAssignment, setNewAssignment] = useState({ title: '', description: '', dueDate: '' });
  const [submitText, setSubmitText] = useState({});

  const isTeacher = user && user.role === 'teacher';

  useEffect(() => {
    const markAttendance = async () => {
      const today = new Date().toISOString().split('T')[0];
      await supabase.from('attendance').insert([{
        student_name: user ? user.name : 'Unknown',
        subject,
        date: today
      }]);
    };
    if (!isTeacher) markAttendance();

    fetchMaterials();
    fetchAssignments();
    fetchAttendance();
    fetchMessages();

    // Realtime chat subscription
    const chatSub = supabase
      .channel('chat:' + subject)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `subject=eq.${subject}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    // Realtime materials subscription
    const materialSub = supabase
      .channel('materials:' + subject)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'materials',
        filter: `subject=eq.${subject}`
      }, () => fetchMaterials())
      .subscribe();

    // Realtime attendance subscription
    const attendanceSub = supabase
      .channel('attendance:' + subject)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'attendance',
        filter: `subject=eq.${subject}`
      }, () => fetchAttendance())
      .subscribe();

    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = () => {
      const roomName = subject.replace(/\s+/g, '-').toLowerCase() + '-remoteclassroom2025';
      const api = new window.JitsiMeetExternalAPI('meet.jit.si', {
        roomName,
        parentNode: jitsiContainer.current,
        width: '100%',
        height: 380,
        configOverwrite: { startWithAudioMuted: false, startWithVideoMuted: false, disableDeepLinking: true },
        interfaceConfigOverwrite: { TOOLBAR_BUTTONS: [], SHOW_JITSI_WATERMARK: false },
        userInfo: { displayName: user ? user.name : teacher },
      });
      apiRef.current = api;
    };
    document.body.appendChild(script);

    return () => {
      if (apiRef.current) apiRef.current.dispose();
      if (document.body.contains(script)) document.body.removeChild(script);
      supabase.removeChannel(chatSub);
      supabase.removeChannel(materialSub);
      supabase.removeChannel(attendanceSub);
    };
  }, [subject, teacher, user, isTeacher]);

  const fetchMessages = async () => {
    const { data } = await supabase.from('messages').select('*').eq('subject', subject).order('created_at');
    if (data) setMessages(data);
  };

  const fetchMaterials = async () => {
    const { data } = await supabase.from('materials').select('*').eq('subject', subject);
    if (data) setMaterials(data);
  };

  const fetchAssignments = async () => {
    const { data } = await supabase.from('assignments').select('*').eq('subject', subject);
    if (data) setAssignments(data);
  };

  const fetchAttendance = async () => {
    const { data } = await supabase.from('attendance').select('*').eq('subject', subject);
    if (data) setAttendance(data);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    await supabase.from('messages').insert([{
      sender: user ? user.name : 'Unknown',
      text: newMessage,
      subject
    }]);
    setNewMessage('');
  };

  const uploadMaterial = async () => {
    if (!materialTitle || !selectedFile) return alert('Title and File required!');
    setUploading(true);
    const fileExt = selectedFile.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from('materials').upload(fileName, selectedFile);
    if (error) { alert('Upload failed!'); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('materials').getPublicUrl(fileName);
    await supabase.from('materials').insert([{
      title: materialTitle,
      subject,
      teacher_name: user.name,
      filename: selectedFile.name,
      filepath: urlData.publicUrl,
      uploaded_at: new Date().toISOString()
    }]);
    setMaterialTitle('');
    setSelectedFile(null);
    setUploading(false);
    alert('File uploaded!');
  };

  const deleteMaterial = async (id) => {
    if (!window.confirm('Delete this material?')) return;
    await supabase.from('materials').delete().eq('id', id);
  };

  const addAssignment = async () => {
    if (!newAssignment.title || !newAssignment.dueDate) return alert('Title and Due Date required!');
    await supabase.from('assignments').insert([{ ...newAssignment, subject, teacher_name: user.name }]);
    setNewAssignment({ title: '', description: '', dueDate: '' });
    fetchAssignments();
  };

  const submitAssignment = async (assignmentId) => {
    const text = submitText[assignmentId];
    if (!text) return alert('Answer type pannunga!');
    await supabase.from('submissions').insert([{
      assignment_id: assignmentId,
      student_name: user.name,
      answer: text,
      subject
    }]);
    alert('Submitted!');
  };

  const getFileIcon = (filename) => {
    if (!filename) return '📄';
    const ext = filename.split('.').pop().toLowerCase();
    if (ext === 'pdf') return '📕';
    if (['doc', 'docx'].includes(ext)) return '📘';
    if (['ppt', 'pptx'].includes(ext)) return '📙';
    if (['jpg', 'jpeg', 'png'].includes(ext)) return '🖼';
    return '📄';
  };

  const tabStyle = (tab) => ({
    padding: '8px 12px', border: 'none', cursor: 'pointer',
    borderRadius: '5px 5px 0 0', fontSize: '13px',
    backgroundColor: activeTab === tab ? '#007bff' : '#e9ecef',
    color: activeTab === tab ? 'white' : '#333', fontWeight: 'bold'
  });

  return (
    <div style={{ fontFamily: 'Arial', padding: '15px' }}>
      <div style={{ backgroundColor: '#343a40', color: 'white', padding: '12px 15px', borderRadius: '8px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0 }}>💻 {subject}</h3>
          <p style={{ margin: 0, fontSize: '13px' }}>Teacher: {teacher}</p>
        </div>
        <button onClick={() => { if (apiRef.current) apiRef.current.dispose(); onBack(); }}
          style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>
          🚪 Leave
        </button>
      </div>

      <div style={{ display: 'flex', gap: '15px' }}>
        <div style={{ flex: 2 }}>
          <div style={{ borderRadius: '8px', overflow: 'hidden', border: '2px solid #343a40' }}>
            <div ref={jitsiContainer} style={{ width: '100%', height: '380px' }} />
          </div>
          <div style={{ marginTop: '10px', textAlign: 'center' }}>
            <button onClick={() => { if (apiRef.current) apiRef.current.executeCommand('toggleAudio'); setIsMuted(!isMuted); }}
              style={{ margin: '3px', padding: '8px 15px', backgroundColor: isMuted ? '#dc3545' : '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              {isMuted ? '🔇 Unmute' : '🎤 Mute'}
            </button>
            <button onClick={() => { if (apiRef.current) apiRef.current.executeCommand('toggleVideo'); setIsVideoOff(!isVideoOff); }}
              style={{ margin: '3px', padding: '8px 15px', backgroundColor: isVideoOff ? '#dc3545' : '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              {isVideoOff ? '📷 Video On' : '📷 Video Off'}
            </button>
            <button onClick={() => { if (apiRef.current) apiRef.current.executeCommand('toggleRaiseHand'); setHandRaised(!handRaised); }}
              style={{ margin: '3px', padding: '8px 15px', backgroundColor: handRaised ? '#ffc107' : '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              {handRaised ? '✋ Lower Hand' : '✋ Raise Hand'}
            </button>
          </div>
        </div>

        <div style={{ flex: 2 }}>
          <div style={{ display: 'flex', gap: '3px' }}>
            <button style={tabStyle('chat')} onClick={() => setActiveTab('chat')}>💬 Chat</button>
            <button style={tabStyle('materials')} onClick={() => setActiveTab('materials')}>📚 Materials</button>
            <button style={tabStyle('assignments')} onClick={() => setActiveTab('assignments')}>📝 Tasks</button>
            {isTeacher && (
              <button style={tabStyle('attendance')} onClick={() => setActiveTab('attendance')}>✅ Attendance</button>
            )}
          </div>

          <div style={{ border: '1px solid #ddd', borderRadius: '0 8px 8px 8px', padding: '15px', height: '420px', overflowY: 'auto', backgroundColor: 'white' }}>
            {activeTab === 'chat' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '5px', marginBottom: '10px' }}>
                  {messages.length === 0 && <p style={{ color: '#999', textAlign: 'center' }}>No messages yet. Say hi!</p>}
                  {messages.map((msg, i) => (
                    <p key={i} style={{ margin: '5px 0' }}>
                      <b style={{ color: msg.sender === (user ? user.name : 'You') ? '#007bff' : '#333' }}>{msg.sender}:</b> {msg.text}
                    </p>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <input placeholder="Type message..." value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    style={{ flex: 1, padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }} />
                  <button onClick={sendMessage}
                    style={{ padding: '8px 12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                    Send
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'materials' && (
              <div>
                {isTeacher && (
                  <div style={{ backgroundColor: '#f0f8ff', padding: '12px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #b8daff' }}>
                    <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>📁 Upload File</p>
                    <input placeholder="Material Title" value={materialTitle}
                      onChange={(e) => setMaterialTitle(e.target.value)}
                      style={{ width: '100%', padding: '7px', marginBottom: '8px', borderRadius: '5px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
                    <input id="fileInput" type="file"
                      style={{ display: 'none' }} onChange={(e) => setSelectedFile(e.target.files[0])} />
                    <div onClick={() => document.getElementById('fileInput').click()}
                      style={{ border: '2px dashed #007bff', borderRadius: '8px', padding: '15px', textAlign: 'center', marginBottom: '8px', cursor: 'pointer' }}>
                      {selectedFile ? <p style={{ margin: 0, color: '#28a745' }}>{selectedFile.name}</p>
                        : <p style={{ margin: 0, color: '#666' }}>Click to select file</p>}
                    </div>
                    <button onClick={uploadMaterial} disabled={uploading}
                      style={{ width: '100%', padding: '9px', backgroundColor: uploading ? '#6c757d' : '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                      {uploading ? '⏳ Uploading...' : '📤 Upload File'}
                    </button>
                  </div>
                )}
                <p style={{ fontWeight: 'bold' }}>📚 Materials ({materials.length})</p>
                {materials.length === 0 && <p style={{ color: '#666', textAlign: 'center' }}>No materials yet.</p>}
                {materials.map((m) => (
                  <div key={m.id} style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 'bold' }}>{getFileIcon(m.filename)} {m.title}</p>
                      <p style={{ margin: '3px 0', fontSize: '12px', color: '#666' }}>{m.filename} | By {m.teacher_name}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <a href={m.filepath} target="_blank" rel="noreferrer"
                        style={{ padding: '5px 10px', backgroundColor: '#28a745', color: 'white', borderRadius: '5px', textDecoration: 'none', fontSize: '12px' }}>
                        📥 Download
                      </a>
                      {isTeacher && (
                        <button onClick={() => deleteMaterial(m.id)}
                          style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>
                          🗑 Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'assignments' && (
              <div>
                {isTeacher && (
                  <div style={{ backgroundColor: '#fffff4', padding: '12px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #b2dfdb' }}>
                    <input placeholder="Assignment Title" value={newAssignment.title}
                      onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                      style={{ width: '100%', padding: '7px', marginBottom: '7px', borderRadius: '5px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
                    <input placeholder="Description" value={newAssignment.description}
                      onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                      style={{ width: '100%', padding: '7px', marginBottom: '7px', borderRadius: '5px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
                    <input type="date" value={newAssignment.dueDate}
                      onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                      style={{ width: '100%', padding: '7px', marginBottom: '7px', borderRadius: '5px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
                    <button onClick={addAssignment}
                      style={{ padding: '8px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                      Create Assignment
                    </button>
                  </div>
                )}
                {assignments.length === 0 && <p style={{ color: '#666', textAlign: 'center' }}>No assignments yet.</p>}
                {assignments.map((a) => (
                  <div key={a.id} style={{ border: '1px solid #ddd', padding: '12px', borderRadius: '8px', marginBottom: '10px' }}>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>📝 {a.title}</p>
                    {a.description && <p style={{ margin: '4px 0', fontSize: '13px', color: '#555' }}>{a.description}</p>}
                    <p style={{ margin: '4px 0', fontSize: '12px', color: '#dc3545' }}>📅 Due: {a.due_date}</p>
                    {!isTeacher && (
                      <div style={{ marginTop: '8px' }}>
                        <textarea placeholder="Type your answer..."
                          value={submitText[a.id] || ''}
                          onChange={(e) => setSubmitText({ ...submitText, [a.id]: e.target.value })}
                          style={{ width: '100%', padding: '7px', borderRadius: '5px', border: '1px solid #ddd', boxSizing: 'border-box', height: '70px', resize: 'none' }} />
                        <button onClick={() => submitAssignment(a.id)}
                          style={{ width: '100%', padding: '8px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '5px' }}>
                          Submit Assignment
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'attendance' && isTeacher && (
              <div>
                <p style={{ fontWeight: 'bold' }}>✅ Attendance - {subject}</p>
                {attendance.length === 0 && <p style={{ color: '#666', textAlign: 'center' }}>No students joined yet.</p>}
                {attendance.map((a, i) => (
                  <div key={i} style={{ border: '1px solid #c3e6cb', padding: '10px', borderRadius: '8px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', backgroundColor: '#f0fff4' }}>
                    <span>👤 <b>{a.student_name}</b></span>
                    <span style={{ color: '#28a745' }}>✅ Present | {a.date}</span>
                  </div>
                ))}
                <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#e9ecef', borderRadius: '5px', textAlign: 'center' }}>
                  <b>Total Present: {attendance.length} students</b>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Classroom;