import React, { useState, useEffect } from 'react';
import { initials, avatarColor, StatusBadge, SubjectTags, StudentDetailView, TutorDetailView, API_URL } from './Shared';

export const AdminDashboard = ({ user, page }) => {
  const [admin, setAdmin] = useState(null);
  const [townStudents, setTownStudents] = useState([]);
  const [townTutors, setTownTutors] = useState([]);
  const [matchStudent, setMatchStudent] = useState('');
  const [matchResults, setMatchResults] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchAttr, setSearchAttr] = useState('name');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAssigned, setFilterAssigned] = useState('all');

  const [selectedTutor, setSelectedTutor] = useState(null);
  const [searchTutorAttr, setSearchTutorAttr] = useState('name');
  const [searchTutorQuery, setSearchTutorQuery] = useState('');
  const [filterTutorAssigned, setFilterTutorAssigned] = useState('all');

  const [feeMonth, setFeeMonth] = useState(new Date().getMonth() + 1);
  const [feeYear, setFeeYear] = useState(new Date().getFullYear());

  const [selectedSession, setSelectedSession] = useState('Evening');
  const [selectedSlots, setSelectedSlots] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/admins/${user.id}`)
      .then(res => res.json())
      .then(data => {
        setAdmin(data);
      });
      
    fetch(`${API_URL}/api/admin/notifications`)
      .then(res => {
        if (!res.ok) return [];
        return res.json();
      })
      .then(data => {
        if(Array.isArray(data)) setNotifications(data);
      })
      .catch(err => console.error(err));
  }, [user.id]);

  const refreshData = () => {
    if (admin?.town) {
      fetch(`${API_URL}/api/students?town=${admin.town}&month=${feeMonth}&year=${feeYear}`).then(r=>r.json()).then(setTownStudents);
      fetch(`${API_URL}/api/tutors?town=${admin.town}`).then(r=>r.json()).then(setTownTutors);
    }
  };

  useEffect(() => {
    refreshData();
  }, [admin?.town, feeMonth, feeYear]);

  const runMatch = () => {
    const s = townStudents.find(x=>x.id===matchStudent);
    if (!s) return;
    const results = townTutors.filter(t => t.town===s.town && t.subjects.some(sub=>s.weakSubjects.includes(sub)));
    setMatchResults(results);
  };

  const handleAssign = async (tutorId) => {
    try {
      const res = await fetch(`${API_URL}/api/admins/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: matchStudent, tutorId })
      });
      if (res.ok) {
        refreshData();
        setMatchStudent('');
        setMatchResults([]);
        alert('Tutor assigned successfully!');
      } else {
        alert('Failed to assign tutor.');
      }
    } catch (err) {
      alert('Error assigning tutor.');
    }
  };

  if (page==='dashboard') return (
    <div>
      <div className="page-title">{admin?.town} Admin Dashboard</div>
      <div className="page-sub">Manage students and tutors in {admin?.town}.</div>
      <div className="stat-grid mb-24">
        <div className="stat-card"><div className="stat-label">Total Students</div><div className="stat-value text-accent">{townStudents.length}</div></div>
        <div className="stat-card"><div className="stat-label">Total Tutors</div><div className="stat-value" style={{color:'var(--success)'}}>{townTutors.length}</div></div>
        <div className="stat-card"><div className="stat-label">Monthly Revenue</div><div className="stat-value" style={{color:'var(--gold)'}}>₹{admin?.revenue?.toLocaleString()}</div></div>
        <div className="stat-card"><div className="stat-label">Unassigned</div><div className="stat-value" style={{color:'var(--warn)'}}>{townStudents.filter(s=>!s.tutor).length}</div></div>
      </div>
      <div className="card">
        <div style={{fontWeight:500,marginBottom:16}}>Recent Students</div>
        <div className="table-wrap"><table><thead><tr><th>Name</th><th>Grade</th><th>Subjects</th><th>Tutor</th><th>Fees</th><th>Status</th></tr></thead>
        <tbody>{townStudents.slice(0,4).map(s=>{
          const t = townTutors.find(x=>x.id===s.tutor);
          return <tr key={s.id}><td><div className="flex gap-8"><div className={`avatar ${avatarColor(s.id)}`}>{initials(s.name)}</div><span style={{color:'var(--text)',fontWeight:500}}>{s.name}</span></div></td><td>{s.grade}</td><td><SubjectTags subjects={s.weakSubjects} /></td><td>{t?t.name:<span style={{color:'var(--warn)'}}>Unassigned</span>}</td><td><StatusBadge status={s.feesPaid?'paid':'unpaid'} /></td><td><StatusBadge status={s.status} /></td></tr>;
        })}</tbody></table></div>
      </div>
      
      {notifications.length > 0 && (
        <div className="card mt-24">
          <div style={{fontWeight:500,marginBottom:16}}>System Notifications</div>
          <div className="flex" style={{flexDirection: 'column', gap: 12}}>
            {notifications.slice(0,5).map(n => (
              <div key={n.id} style={{padding: '12px', background: 'var(--bg2)', borderRadius: 'var(--radius)', borderLeft: '4px solid var(--accent)'}}>
                <div style={{fontWeight: 600, color: 'var(--accent)'}}>{n.title}</div>
                <div style={{fontSize: 14, color: 'var(--text2)', marginTop: 4}}>{n.message}</div>
                <div style={{fontSize: 11, color: 'var(--text3)', marginTop: 8}}>{new Date(n.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (page==='students') {
    if (selectedStudent) {
      const currentStudent = townStudents.find(s => s.id === selectedStudent.id) || selectedStudent;
      const t = townTutors.find(x=>x.id===currentStudent.tutor);
      return <StudentDetailView student={currentStudent} tutor={t} onBack={()=>setSelectedStudent(null)} />;
    }

    let filtered = townStudents;
    if (filterAssigned === 'assigned') filtered = filtered.filter(s => s.tutor);
    else if (filterAssigned === 'unassigned') filtered = filtered.filter(s => !s.tutor);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(s => {
        const val = s[searchAttr];
        if (typeof val === 'string') return val.toLowerCase().includes(q);
        if (searchAttr === 'id') return s.id.toLowerCase().includes(q);
        return false;
      });
    }

    return (
      <div>
        <div className="flex-between mb-24">
          <div><div className="page-title">Students — {admin?.town}</div><div className="page-sub">{townStudents.length} registered students</div></div>
          <div className="flex gap-12">
            <button className={`btn btn-sm ${filterAssigned==='all'?'btn-primary':'btn-ghost'}`} onClick={()=>setFilterAssigned('all')}>All</button>
            <button className={`btn btn-sm ${filterAssigned==='assigned'?'btn-primary':'btn-ghost'}`} onClick={()=>setFilterAssigned('assigned')}>Assigned</button>
            <button className={`btn btn-sm ${filterAssigned==='unassigned'?'btn-primary':'btn-ghost'}`} onClick={()=>setFilterAssigned('unassigned')}>Unassigned</button>
          </div>
        </div>
        <div className="card">
          <div className="flex gap-12 mb-16">
            <select className="form-input" style={{width: 150}} value={searchAttr} onChange={e=>setSearchAttr(e.target.value)}>
              <option value="name">Name</option>
              <option value="id">ID</option>
              <option value="grade">Grade</option>
              <option value="slot">Slot</option>
            </select>
            <input className="form-input" style={{flex: 1}} placeholder={`Search by ${searchAttr}...`} value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} />
          </div>
          <div className="table-wrap"><table><thead><tr><th>ID</th><th>Name</th><th>Gender</th><th>Grade</th><th>Slot</th><th>Tutor</th><th>Fees</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>{filtered.map(s=>{
            const t=townTutors.find(x=>x.id===s.tutor);
            return <tr key={s.id}><td style={{color:'var(--text3)'}}>{s.id}</td><td><div className="flex gap-8"><div className={`avatar ${avatarColor(s.id)}`}>{initials(s.name)}</div><div><div style={{fontWeight:500,color:'var(--text)'}}>{s.name}</div><div style={{fontSize:11,color:'var(--text3)'}}>{s.parent}</div></div></div></td><td>{s.gender || '—'}</td><td>{s.grade}</td><td><span className="badge">{s.slot || '—'}</span></td><td>{t?t.name:<span className="badge badge-warn">None</span>}</td><td><StatusBadge status={s.feesPaid?'paid':'unpaid'} /></td><td><StatusBadge status={s.status} /></td><td><button className="btn btn-sm" onClick={()=>setSelectedStudent(s)}>View</button></td></tr>;
          })}</tbody></table></div>
        </div>
      </div>
    );
  }

  if (page==='tutors') {
    if (selectedTutor) {
      const currentTutor = townTutors.find(t => t.id === selectedTutor.id) || selectedTutor;
      const assigned = townStudents.filter(s => s.tutor === currentTutor.id);
      return <TutorDetailView tutor={currentTutor} assignedStudents={assigned} onBack={()=>setSelectedTutor(null)} onRefresh={refreshData} />;
    }

    let filtered = townTutors;
    if (filterTutorAssigned === 'assigned') filtered = filtered.filter(t => t.students.length > 0);
    else if (filterTutorAssigned === 'unassigned') filtered = filtered.filter(t => t.students.length === 0);

    if (searchTutorQuery.trim()) {
      const q = searchTutorQuery.toLowerCase();
      filtered = filtered.filter(t => {
        const val = t[searchTutorAttr];
        if (typeof val === 'string') return val.toLowerCase().includes(q);
        if (searchTutorAttr === 'id') return t.id.toLowerCase().includes(q);
        return false;
      });
    }

    return (
      <div>
        <div className="flex-between mb-24">
          <div><div className="page-title">Tutors — {admin?.town}</div><div className="page-sub">{townTutors.length} registered tutors</div></div>
          <div className="flex gap-12">
            <button className={`btn btn-sm ${filterTutorAssigned==='all'?'btn-primary':'btn-ghost'}`} onClick={()=>setFilterTutorAssigned('all')}>All</button>
            <button className={`btn btn-sm ${filterTutorAssigned==='assigned'?'btn-primary':'btn-ghost'}`} onClick={()=>setFilterTutorAssigned('assigned')}>Assigned</button>
            <button className={`btn btn-sm ${filterTutorAssigned==='unassigned'?'btn-primary':'btn-ghost'}`} onClick={()=>setFilterTutorAssigned('unassigned')}>Unassigned</button>
          </div>
        </div>
        <div className="card">
          <div className="flex gap-12 mb-16">
            <select className="form-input" style={{width: 150}} value={searchTutorAttr} onChange={e=>setSearchTutorAttr(e.target.value)}>
              <option value="name">Name</option>
              <option value="id">ID</option>
              <option value="qualification">Qualification</option>
            </select>
            <input className="form-input" style={{flex: 1}} placeholder={`Search by ${searchTutorAttr}...`} value={searchTutorQuery} onChange={e=>setSearchTutorQuery(e.target.value)} />
          </div>
          <div className="table-wrap"><table><thead><tr><th>ID</th><th>Name</th><th>Subjects</th><th>Grade Range</th><th>Students</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>{filtered.map(t=>(
            <tr key={t.id}><td style={{color:'var(--text3)'}}>{t.id}</td><td><div className="flex gap-8"><div className={`avatar ${avatarColor(t.id)}`}>{initials(t.name)}</div><div><div style={{fontWeight:500,color:'var(--text)'}}>{t.name}</div><div style={{fontSize:11,color:'var(--text3)'}}>{t.qualification}</div></div></div></td><td><SubjectTags subjects={t.subjects} /></td><td>{t.grades}</td><td>{t.students.length}</td><td><StatusBadge status={t.status} /></td><td><button className="btn btn-sm" onClick={()=>setSelectedTutor(t)}>View</button></td></tr>
          ))}</tbody></table></div>
        </div>
      </div>
    );
  }

  if (page==='matching') {
    const morningSlots = ["05:30 AM", "06:00 AM", "06:30 AM", "07:00 AM", "07:30 AM", "08:00 AM"];
    const eveningSlots = ["04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM", "08:30 PM", "09:00 PM"];
    const currentSlots = selectedSession === 'Morning' ? morningSlots : eveningSlots;

    return (
      <div>
        <div className="page-title">Find Your Perfect Tutor</div>
        <div className="page-sub">Match students with top-rated educators who fit their schedule and learning goals.</div>
        
        <div className="card mb-24">
          <div style={{fontWeight:500,marginBottom:16, fontSize:14, textTransform:'uppercase', color:'var(--text2)'}}>Select Student To Match</div>
          <div className="flex gap-12">
            <select className="form-input" style={{flex:1}} value={matchStudent} onChange={e=>setMatchStudent(e.target.value)}>
              <option value="">Select student...</option>
              {townStudents.map(s=><option key={s.id} value={s.id}>{s.name} {s.tutor ? '(Assigned)' : ''} — {s.weakSubjects.join(', ')}</option>)}
            </select>
            <button className="btn btn-primary" onClick={runMatch}>Find Matches</button>
          </div>
        </div>

        {matchResults.length > 0 && (
          <div className="card mb-24">
            <div style={{fontSize:11, fontWeight:600, color:'var(--text2)', textTransform:'uppercase', marginBottom:8}}>Select Session Window</div>
            <div className="flex gap-12 mb-16">
              <div 
                className="flex-between align-center"
                style={{flex: 1, padding: '16px 20px', border: selectedSession === 'Morning' ? '2px solid var(--accent)' : '1px solid var(--border2)', borderRadius: 'var(--radius)', cursor: 'pointer', background: selectedSession === 'Morning' ? 'var(--accent3)' : 'var(--bg3)', opacity: selectedSession === 'Morning' ? 1 : 0.7, transition: 'all 0.2s'}}
                onClick={() => { setSelectedSession('Morning'); setSelectedSlots([]); }}
              >
                <div>
                  <div style={{fontWeight: 600, color: selectedSession === 'Morning' ? 'var(--accent2)' : 'var(--text)', marginBottom: 4}}>Morning Session</div>
                  <div style={{fontSize: 12, color: 'var(--text3)'}}>5:30 AM - 8:00 AM</div>
                </div>
                <div style={{width: 22, height: 22, borderRadius: '50%', border: selectedSession === 'Morning' ? '6px solid var(--accent)' : '2px solid var(--text3)', background: selectedSession === 'Morning' ? '#fff' : 'transparent'}}></div>
              </div>
              <div 
                className="flex-between align-center"
                style={{flex: 1, padding: '16px 20px', border: selectedSession === 'Evening' ? '2px solid var(--accent)' : '1px solid var(--border2)', borderRadius: 'var(--radius)', cursor: 'pointer', background: selectedSession === 'Evening' ? 'var(--accent3)' : 'var(--bg3)', opacity: selectedSession === 'Evening' ? 1 : 0.7, transition: 'all 0.2s'}}
                onClick={() => { setSelectedSession('Evening'); setSelectedSlots([]); }}
              >
                <div>
                  <div style={{fontWeight: 600, color: selectedSession === 'Evening' ? 'var(--accent2)' : 'var(--text)', marginBottom: 4}}>Evening Session</div>
                  <div style={{fontSize: 12, color: 'var(--text3)'}}>4:00 PM - 9:00 PM</div>
                </div>
                <div style={{width: 22, height: 22, borderRadius: '50%', border: selectedSession === 'Evening' ? '6px solid var(--accent)' : '2px solid var(--text3)', background: selectedSession === 'Evening' ? '#fff' : 'transparent'}}></div>
              </div>
            </div>

            <div className="flex-between mb-8">
              <div style={{fontSize:11, fontWeight:600, color:'var(--text2)', textTransform:'uppercase'}}>Available Time Slots (30 MIN)</div>
              <div style={{fontSize:12, fontWeight:600, color:'var(--accent)'}}>Today, {new Date().toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</div>
            </div>
            <div className="flex gap-8 flex-wrap">
              {currentSlots.map(time => {
                const isSelected = selectedSlots.includes(time);
                return (
                  <button 
                    key={time} 
                    className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-ghost'}`}
                    style={{borderRadius: 20, border: isSelected ? 'none' : '1px solid var(--border)', fontSize: 13, padding: '4px 16px'}}
                    onClick={() => setSelectedSlots(p => p.includes(time) ? p.filter(x => x !== time) : [...p, time])}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {matchResults.length > 0 && (() => {
          const displayedTutors = matchResults.filter(t => {
            if (selectedSlots.length === 0) return true;
            const tutorAllSlots = Object.values(t.availability || {}).flat();
            return selectedSlots.some(slot => tutorAllSlots.includes(slot));
          });

          return (
          <div>
            <div className="flex-between mb-16">
              <div style={{fontWeight: 600, fontSize: 16}}>Showing {displayedTutors.length} Tutors available for your selected slots</div>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20}}>
              {displayedTutors.map(t => {
                const tutorStudents = townStudents.filter(st => st.tutor === t.id);
                let isAllotted = false;
                if (selectedSlots.length > 0) {
                  isAllotted = tutorStudents.some(st => {
                    const sSlot = (st.slot || '').toLowerCase();
                    return selectedSlots.some(sel => {
                      const hr = parseInt(sel.split(':')[0], 10);
                      const isPM = sel.includes('PM');
                      if (isPM && sSlot.includes('pm')) {
                        if (hr >= 4 && hr <= 7 && sSlot.includes('5:30 pm')) return true;
                        if (hr >= 7 && hr <= 9 && sSlot.includes('7:30 pm')) return true;
                      } else if (!isPM && sSlot.includes('am')) {
                        if (hr >= 5 && hr <= 8 && sSlot.includes('5:30 am')) return true;
                      }
                      return false;
                    });
                  });
                }

                return (
                <div key={t.id} className="card" style={{padding: 24, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '100%'}}>
                  <div className="flex gap-16 mb-16 align-start">
                    <div className={`avatar ${avatarColor(t.id)}`} style={{width: 50, height: 50, fontSize: 18}}>{initials(t.name)}</div>
                    <div style={{flex: 1}}>
                      <div className="flex-between align-start">
                        <div style={{fontWeight: 600, fontSize: 16, color: 'var(--text)'}}>{t.name}</div>
                        <span style={{fontSize: 9, background: isAllotted ? '#ffebee' : '#e0f7fa', color: isAllotted ? '#c62828' : '#006064', padding: '2px 6px', borderRadius: 4, fontWeight: 700}}>
                          {isAllotted ? 'ALLOTTED TO THAT SLOT' : 'AVAILABLE NOW'}
                        </span>
                      </div>
                      <div style={{fontSize: 12, color: 'var(--text2)', marginTop: 4}}>
                        <span style={{color: '#f59e0b'}}>★ </span><span style={{fontWeight: 600}}>{t.rating || '4.8'}</span> 
                        <span style={{color: 'var(--text3)'}}> ({Math.floor(Math.random()*150)+50} reviews)</span>
                      </div>
                    </div>
                  </div>

                  <div style={{fontSize: 10, fontWeight: 700, color: 'var(--text3)', marginBottom: 8, letterSpacing: 0.5}}>EXPERTISE</div>
                  <div className="flex gap-8 flex-wrap mb-16">
                    {t.subjects.map(s => (
                      <span key={s} style={{background: 'var(--bg3)', padding: '4px 10px', borderRadius: 12, fontSize: 11, color: 'var(--text2)', border: '1px solid var(--border)'}}>{s}</span>
                    ))}
                  </div>

                  <div style={{fontSize: 10, fontWeight: 700, color: 'var(--text3)', marginBottom: 8, letterSpacing: 0.5}}>SLOTS</div>
                  <div className="flex gap-8 flex-wrap mb-24">
                    {Array.from(new Set(Object.values(t.availability || {}).flat())).map(slot => {
                      // Check if this slot is allotted
                      const isSlotAllotted = tutorStudents.some(st => {
                        const sSlot = (st.slot || '').toLowerCase();
                        const hr = parseInt(slot.split(':')[0], 10);
                        const isPM = slot.includes('PM');
                        if (isPM && sSlot.includes('pm')) {
                          if (hr >= 4 && hr <= 7 && sSlot.includes('5:30 pm')) return true;
                          if (hr >= 7 && hr <= 9 && sSlot.includes('7:30 pm')) return true;
                        } else if (!isPM && sSlot.includes('am')) {
                          if (hr >= 5 && hr <= 8 && sSlot.includes('5:30 am')) return true;
                        }
                        return false;
                      });

                      return (
                        <span key={slot} style={{background: isSlotAllotted ? '#ffebee' : 'var(--bg3)', padding: '4px 10px', borderRadius: 12, fontSize: 11, color: isSlotAllotted ? '#c62828' : 'var(--text2)', border: '1px solid var(--border)'}}>
                          {slot} {isSlotAllotted ? '(Allotted)' : ''}
                        </span>
                      );
                    })}
                    {Object.values(t.availability || {}).flat().length === 0 && <span style={{fontSize: 11, color: 'var(--text3)'}}>No availability</span>}
                  </div>

                  <div className="flex gap-12 mt-auto">
                    <button className="btn btn-ghost" style={{flex: 1, border: '1px solid var(--border)', color: 'var(--accent)'}} onClick={() => setSelectedTutor(t)}>View Profile</button>
                    <button className="btn btn-primary" style={{flex: 1}} disabled={isAllotted} onClick={() => handleAssign(t.id)}>
                      {isAllotted ? 'Unavailable' : 'Assign Tutor'}
                    </button>
                  </div>
                </div>
              )})}
              
              <div className="card" style={{border: '1px dashed var(--border)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text3)', height: '100%', minHeight: 250}}>
                <div>
                  <div style={{fontSize: 24, marginBottom: 8}}>🔍</div>
                  <div style={{fontSize: 13}}>Finding more matches based on your<br/>preferences...</div>
                </div>
              </div>
            </div>
            
            <div style={{textAlign: 'center', marginTop: 24}}>
              <button className="btn btn-ghost" style={{border: '1px solid var(--border)', color: 'var(--accent)', padding: '8px 24px'}}>Load More Tutors ▾</button>
            </div>
          </div>
        );})()}
      </div>
    );
  }

  if (page==='fees') {
    const assignedStudents = townStudents.filter(s => s.tutor);
    const unpaidPairs = assignedStudents.filter(s => !s.feesPaid).length;

    // Calculate Target Amount (10% of fees for all assigned students)
    const targetAmount = assignedStudents.reduce((acc, s) => acc + (s.fees * 0.10), 0);

    // Calculate total loyalty paid this month
    const totalLoyaltyPaid = townTutors.reduce((acc, t) => {
      const monthLoyalty = (t.loyalty || []).filter(p => {
        const d = new Date(p.date);
        return (d.getMonth() + 1) === feeMonth && d.getFullYear() === feeYear;
      }).reduce((sum, p) => sum + p.amount, 0);
      return acc + monthLoyalty;
    }, 0);

    const pendingRevenue = Math.max(0, targetAmount - totalLoyaltyPaid);

    return (
      <div>
        <div className="flex-between mb-24">
          <div>
            <div className="page-title">Fee Management</div>
            <div className="page-sub">Track and manage student-tutor fees for {admin?.town}.</div>
          </div>
          <div className="flex gap-12 align-center">
            <select className="form-input" style={{ width: 140 }} value={feeMonth} onChange={e => setFeeMonth(parseInt(e.target.value))}>
              {Array.from({length: 12}).map((_, i) => (
                <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
            <select className="form-input" style={{ width: 100 }} value={feeYear} onChange={e => setFeeYear(parseInt(e.target.value))}>
              {[new Date().getFullYear()-1, new Date().getFullYear(), new Date().getFullYear()+1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="stat-grid mb-24">
          <div className="stat-card">
            <div className="stat-label">Target Amount</div>
            <div className="stat-value text-accent">₹{targetAmount.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active Tutoring Pairs</div>
            <div className="stat-value">{assignedStudents.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Remaining to Collect</div>
            <div className="stat-value" style={{color: pendingRevenue > 0 ? 'var(--danger)' : 'var(--success)'}}>₹{pendingRevenue.toLocaleString()}</div>
          </div>
        </div>

        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Assigned Tutor</th>
                  <th>Monthly Fee</th>
                  <th>Status</th>
                  <th>Joined Date</th>
                </tr>
              </thead>
              <tbody>
                {assignedStudents.map(s => {
                  const t = townTutors.find(x => x.id === s.tutor);
                  return (
                    <tr key={s.id}>
                      <td style={{fontWeight:500, color:'var(--text)'}}>{s.name}</td>
                      <td>{t ? t.name : '—'}</td>
                      <td>₹{s.fees}</td>
                      <td><StatusBadge status={s.feesPaid ? 'paid' : 'unpaid'} /></td>
                      <td style={{color: 'var(--text2)'}}>{new Date(s.joiningDate).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
                {assignedStudents.length === 0 && (
                  <tr><td colSpan="5" style={{textAlign: 'center', padding: '24px', color: 'var(--text3)'}}>No assigned student-tutor pairs found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
