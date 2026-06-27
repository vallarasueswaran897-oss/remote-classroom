import { useEffect, useRef, useState } from 'react';

function Classroom({ subject, teacher, user, onBack }) {
  const jitsiContainer = useRef(null);
  const apiRef = useRef(null);
  const [messages, setMessages] = useState([
    { sender: 'System', text: 'Welcome to ' + subject + ' class!' },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [materialTitle, setMaterialTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [newAssignment, setNewAssignment] = useState({ title: '', description: '', dueDate: '' });
  const [submitText, setSubmitText] = useState({});

  useEffect(() => {
    fetch('http://localhost:5000/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName: user ? user.name : 'Unknown',
        subject: subject,
        date: new Date().toLocaleDateString()
      })
    });
    fetchMaterials();
    fetchAssignments();

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
    };
  }, [subject, teacher, user]);

  const fetchMaterials = async () => {
    const res = await fetch('http://localhost:5000/materials');
    setMaterials(await res.json());
  };

  const fetchAssignments = async () => {
    const res = await fetch('http://localhost:5000/assignments');
    setAssignments(await res.json());
  };

  const fetchAttendance = async () => {
    const res = await fetch('http://localhost:5000/attendance');
    setAttendance(await res.json());
  };

  const uploadMaterial = async () => {
    if (!materialTitle || !selectedFile) return alert('Title and File போடு!');
    setUploading(true);
    const formData = new FormData();
    formData.append('title', materialTitle);
    formData.append('subject', subject);
    formData.append('teacherName', user.name);
    formData.append('file', selectedFile);
    await fetch('http://localhost:5000/materials', {
      method: 'POST',
      body: formData
    });
    setMaterialTitle('');
    setSelectedFile(null);
    setUploading(false);
    fetchMaterials();
    alert('✅ File uploaded!');
  };

  const deleteMaterial = async (id) => {
    if (!window.confirm('Delete this material?')) return;
    await fetch('http://localhost:5000/materials/' + id, { method: 'DELETE' });
    fetchMaterials();
  };

  const addAssignment = async () => {
    if (!newAssignment.title || !newAssignment.dueDate) return alert('Title and Due Date போடு!');
    await fetch('http://localhost:5000/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newAssignment, subject, teacherName: user.name })
    });
    setNewAssignment({ title: '', description: '', dueDate: '' });
    fetchAssignments();
  };

  const submitAssignment = async (assignmentId) => {
    const text = submitText[assignmentId];
    if (!text) return alert('Answer type பண்ணு!');
    const res = await fetch('http://localhost:5000/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignmentId, studentName: user.name, answer: text, subject })
    });
    const data = await res.json();
    alert(data.success ? '✅ Submitted successfully!' : '⚠️ Already submitted!');
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    setMessages([...messages, { sender: user ? user.name : 'You', text: newMessage }]);
    setNewMessage('');
  };

  const isTeacher = user && user.role === 'teacher';
  const subjectMaterials = materials.filter(m => m.subject === subject);
  const subjectAssignments = assignments.filter(a => a.subject === subject);
  const subjectAttendance = attendance.filter(a => a.subject === subject);

  const tabStyle = (tab) => ({
    padding: '8px 12px', border: 'none', cursor: 'pointer',
    borderRadius: '5px 5px 0 0', fontSize: '13px',
    backgroundColor: activeTab === tab ? '#007bff' : '#e9ecef',
    color: activeTab === tab ? 'white' : '#333', fontWeight: 'bold'
  });

  const getFileIcon = (filename) => {
    if (!filename) return '📄';
    const ext = filename.split('.').pop().toLowerCase();
    if (ext === 'pdf') return '📕';
    if (['doc', 'docx'].includes(ext)) return '📘';
    if (['ppt', 'pptx'].includes(ext)) return '📙';
    if (['xls', 'xlsx'].includes(ext)) return '📗';
    if (['jpg', 'jpeg', 'png'].includes(ext)) return '🖼️';
    if (['mp4', 'mkv'].includes(ext)) return '🎬';
    return '📄';
  };

  return (
    <div style={{ fontFamily: 'Arial', padding: '15px' }}>

      <div style={{ backgroundColor: '#343a40', color: 'white', padding: '12px 15px', borderRadius: '8px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0 }}>📹 {subject}</h3>
          <p style={{ margin: 0, fontSize: '13px' }}>Teacher: {teacher}</p>
        </div>
        <button onClick={() => { if (apiRef.current) apiRef.current.dispose(); onBack(); }}
          style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>
          🚪 Leave
        </button>
      </div>

      <div style={{ display: 'flex', gap: '15px' }}>

        {/* Left - Video */}
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

        {/* Right - Tabs */}
        <div style={{ flex: 2 }}>
          <div style={{ display: 'flex', gap: '3px' }}>
            <button style={tabStyle('chat')} onClick={() => setActiveTab('chat')}>💬 Chat</button>
            <button style={tabStyle('materials')} onClick={() => setActiveTab('materials')}>📎 Materials</button>
            <button style={tabStyle('assignments')} onClick={() => setActiveTab('assignments')}>📝 Tasks</button>
            {isTeacher && (
              <button style={tabStyle('attendance')} onClick={() => { setActiveTab('attendance'); fetchAttendance(); }}>
                ✅ Attendance
              </button>
            )}
          </div>

          <div style={{ border: '1px solid #ddd', borderRadius: '0 8px 8px 8px', padding: '15px', height: '420px', overflowY: 'auto', backgroundColor: 'white' }}>

            {/* Chat */}
            {activeTab === 'chat' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '5px', marginBottom: '10px' }}>
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

            {/* Materials */}
            {activeTab === 'materials' && (
              <div>
                {isTeacher && (
                  <div style={{ backgroundColor: '#f0f8ff', padding: '12px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #b8daff' }}>
                    <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#004085' }}>📤 Upload File</p>
                    <input
                      placeholder="Material Title (e.g. Chapter 1 Notes)"
                      value={materialTitle}
                      onChange={(e) => setMaterialTitle(e.target.value)}
                      style={{ width: '100%', padding: '7px', marginBottom: '8px', borderRadius: '5px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                    />
                    <div style={{ border: '2px dashed #007bff', borderRadius: '8px', padding: '15px', textAlign: 'center', marginBottom: '8px', backgroundColor: '#f8f9fa', cursor: 'pointer' }}
                      onClick={() => document.getElementById('fileInput').click()}>
                      {selectedFile ? (
                        <div>
                          <p style={{ margin: 0, color: '#28a745', fontWeight: 'bold' }}>
                            {getFileIcon(selectedFile.name)} {selectedFile.name}
                          </p>
                          <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#666' }}>
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p style={{ margin: 0, fontSize: '24px' }}>📁</p>
                          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '13px' }}>
                            Click to select file<br />
                            <span style={{ fontSize: '11px' }}>PDF, DOC, PPT, XLS, Images supported</span>
                          </p>
                        </div>
                      )}
                    </div>
                    <input
                      id="fileInput"
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.mp4"
                      style={{ display: 'none' }}
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                    />
                    <button onClick={uploadMaterial} disabled={uploading}
                      style={{ width: '100%', padding: '9px', backgroundColor: uploading ? '#6c757d' : '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: uploading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                      {uploading ? '⏳ Uploading...' : '📤 Upload File'}
                    </button>
                  </div>
                )}

                <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#333' }}>
                  📚 Materials ({subjectMaterials.length})
                </p>

                {subjectMaterials.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#666', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <p style={{ fontSize: '30px', margin: 0 }}>📂</p>
                    <p>No materials uploaded yet.</p>
                  </div>
                )}

                {subjectMaterials.map(m => (
                  <div key={m.id} style={{ border: '1px solid #ddd', padding: '10px 12px', borderRadius: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fafafa' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>
                        {getFileIcon(m.filename)} {m.title}
                      </p>
                      <p style={{ margin: '3px 0', fontSize: '12px', color: '#666' }}>
                        {m.filename} | By {m.teacherName}
                      </p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#999' }}>{m.uploadedAt}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '5px', flexDirection: 'column' }}>
                      <a href={'http://localhost:5000/uploads/' + m.filepath} target="_blank" rel="noreferrer"
                        style={{ padding: '5px 10px', backgroundColor: '#28a745', color: 'white', borderRadius: '5px', textDecoration: 'none', fontSize: '12px', textAlign: 'center' }}>
                        ⬇️ Download
                      </a>
                      {isTeacher && (
                        <button onClick={() => deleteMaterial(m.id)}
                          style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>
                          🗑️ Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Assignments */}
            {activeTab === 'assignments' && (
              <div>
                {isTeacher && (
                  <div style={{ backgroundColor: '#f0fff4', padding: '12px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #b2dfdb' }}>
                    <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#155724' }}>➕ Create Assignment</p>
                    <input placeholder="Assignment Title"
                      value={newAssignment.title}
                      onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                      style={{ width: '100%', padding: '7px', marginBottom: '7px', borderRadius: '5px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
                    <input placeholder="Description (optional)"
                      value={newAssignment.description}
                      onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                      style={{ width: '100%', padding: '7px', marginBottom: '7px', borderRadius: '5px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
                    <input type="date"
                      value={newAssignment.dueDate}
                      onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                      style={{ width: '100%', padding: '7px', marginBottom: '7px', borderRadius: '5px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
                    <button onClick={addAssignment}
                      style={{ width: '100%', padding: '8px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                      Create Assignment
                    </button>
                  </div>
                )}

                {subjectAssignments.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#666', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <p style={{ fontSize: '30px', margin: 0 }}>📝</p>
                    <p>No assignments yet.</p>
                  </div>
                )}

                {subjectAssignments.map(a => (
                  <div key={a.id} style={{ border: '1px solid #ddd', padding: '12px', borderRadius: '8px', marginBottom: '10px', backgroundColor: '#fafafa' }}>
                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>📝 {a.title}</p>
                    {a.description && <p style={{ margin: '4px 0', fontSize: '13px', color: '#555' }}>{a.description}</p>}
                    <p style={{ margin: '4px 0', fontSize: '12px', color: '#dc3545' }}>⏰ Due: {a.dueDate}</p>
                    {!isTeacher && (
                      <div style={{ marginTop: '8px' }}>
                        <textarea placeholder="Type your answer here..."
                          value={submitText[a.id] || ''}
                          onChange={(e) => setSubmitText({ ...submitText, [a.id]: e.target.value })}
                          style={{ width: '100%', padding: '7px', borderRadius: '5px', border: '1px solid #ddd', boxSizing: 'border-box', height: '70px', resize: 'none' }} />
                        <button onClick={() => submitAssignment(a.id)}
                          style={{ width: '100%', padding: '8px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '5px', fontWeight: 'bold' }}>
                          Submit Assignment
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Attendance - Teacher only */}
            {activeTab === 'attendance' && isTeacher && (
              <div>
                <p style={{ fontWeight: 'bold', margin: '0 0 12px 0' }}>✅ Attendance - {subject}</p>
                {subjectAttendance.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#666', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <p style={{ fontSize: '30px', margin: 0 }}>👥</p>
                    <p>No students joined yet.</p>
                  </div>
                )}
                {subjectAttendance.map((a, i) => (
                  <div key={i} style={{ border: '1px solid #c3e6cb', padding: '10px 12px', borderRadius: '8px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', backgroundColor: '#f0fff4' }}>
                    <span>👤 <b>{a.studentName}</b></span>
                    <span style={{ color: '#28a745', fontWeight: 'bold' }}>✅ Present | {a.date}</span>
                  </div>
                ))}
                <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#e9ecef', borderRadius: '5px', textAlign: 'center' }}>
                  <b>Total Present: {subjectAttendance.length} students</b>
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