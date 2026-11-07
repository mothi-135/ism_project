import React, { useState, useEffect } from 'react';
import { initials, avatarColor, StatusBadge, SubjectTags, StudentDetailView, TutorDetailView, API_URL } from './Shared';

export const GlobalAdminDashboard = ({ page }) => {
  const [allStudents, setAllStudents] = useState([]);
  const [allTutors, setAllTutors] = useState([]);
  const [allAdmins, setAllAdmins] = useState([]);
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
  
  const refreshData = () => {
    fetch(`${API_URL}/api/students`)
      .then(r=>r.json())
      .then(d => setAllStudents(Array.isArray(d) ? d : []))
      .catch(e => { console.error('Error fetching students:', e); setAllStudents([]); });
    fetch(`${API_URL}/api/tutors`)
      .then(r=>r.json())
      .then(d => setAllTutors(Array.isArray(d) ? d : []))
      .catch(e => { console.error('Error fetching tutors:', e); setAllTutors([]); });
    fetch(`${API_URL}/api/admins`)
      .then(r=>r.json())
      .then(d => setAllAdmins(Array.isArray(d) ? d : []))
      .catch(e => { console.error('Error fetching admins:', e); setAllAdmins([]); });
    fetch(`${API_URL}/api/admin/notifications`)
      .then(r=>{if(r.ok)return r.json();return [];})
      .then(data=>{if(Array.isArray(data))setNotifications(data);})
      .catch(console.error);
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    setSelectedStudent(null);
    setSelectedTutor(null);
  }, [page]);

  const totalStudents = (allStudents || []).length;
  const totalTutors = (allTutors || []).length;
  const totalRevenue = (allStudents || []).filter(s=>s.feesPaid).reduce((a,s)=>a+s.fees,0);
  const pending = (allStudents || []).filter(s=>!s.tutor).length;

  if (page==='dashboard') return (
    <div>
      <div className="page-title">Global Admin — Network Overview</div>
      <div className="page-sub">Monitoring all 4 towns and the entire ISM network.</div>
      <div className="stat-grid mb-24">
        <div className="stat-card"><div className="stat-label">Total Students</div><div className="stat-value text-accent">{totalStudents}</div></div>
        <div className="stat-card"><div className="stat-label">Total Tutors</div><div className="stat-value" style={{color:'var(--success)'}}>{totalTutors}</div></div>
        <div className="stat-card"><div className="stat-label">Network Revenue</div><div className="stat-value" style={{color:'var(--gold)'}}>₹{totalRevenue.toLocaleString()}</div></div>
        <div className="stat-card"><div className="stat-label">Unassigned Students</div><div className="stat-value" style={{color:'var(--warn)'}}>{pending}</div></div>
      </div>
      <div className="card mb-24">
        <div style={{fontWeight:500,marginBottom:16}}>Town-wise Summary</div>
        <div className="table-wrap"><table><thead><tr><th>Admin</th><th>Town</th><th>Students</th><th>Tutors</th><th>Contact</th></tr></thead>
        <tbody>{allAdmins.map(a=>(
          <tr key={a.id}><td><div className="flex gap-8"><div className={`avatar ${avatarColor(a.id)}`}>{initials(a.name)}</div><span style={{fontWeight:500,color:'var(--text)'}}>{a.name}</span></div></td><td><span className="badge badge-accent">{a.town}</span></td><td>{a.students}</td><td>{a.tutors}</td><td style={{color:'var(--accent2)'}}>{a.phone}</td></tr>
        ))}</tbody></table></div>
      </div>
      
      {notifications.length > 0 && (
        <div className="card">
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

  if (page==='towns') return (
    <div>
      <div className="page-title">Towns & Admins</div>
      <div className="page-sub">All local admins and their assigned towns.</div>
      <div className="grid-2">
        {allAdmins.map(a=>(
          <div key={a.id} className="card">
            <div className="flex-between mb-16">
              <div className="flex gap-12"><div className={`avatar avatar-lg ${avatarColor(a.id)}`}>{initials(a.name)}</div><div><div style={{fontWeight:500,fontSize:15}}>{a.name}</div><div style={{fontSize:12,color:'var(--text2)'}}>{a.email}</div></div></div>
              <span className="badge badge-accent">{a.town}</span>
            </div>
            <div className="divider" />
            <div className="info-row"><span className="info-key">Students</span><span className="info-val">{a.students}</span></div>
            <div className="info-row"><span className="info-key">Tutors</span><span className="info-val">{a.tutors}</span></div>
            <div className="info-row"><span className="info-key">Phone</span><span className="info-val">{a.phone}</span></div>
          </div>
        ))}
      </div>
    </div>
  );

  if (page==='students') {
    if (selectedStudent) {
      const currentStudent = (allStudents || []).find(s => s.id === selectedStudent.id) || selectedStudent;
      const t = (allTutors || []).find(x=>x.id===currentStudent.tutor);
      return <StudentDetailView student={currentStudent} tutor={t} onBack={()=>setSelectedStudent(null)} />;
    }

    let filtered = allStudents || [];
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
          <div><div className="page-title">All Students</div><div className="page-sub">{(allStudents || []).length} students across 4 towns.</div></div>
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
              <option value="town">Town</option>
              <option value="grade">Grade</option>
              <option value="board">Board</option>
            </select>
            <input className="form-input" style={{flex: 1}} placeholder={`Search by ${searchAttr}...`} value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} />
          </div>
          <div className="table-wrap"><table><thead><tr><th>ID</th><th>Name</th><th>Town</th><th>Grade</th><th>Board</th><th>Tutor</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>{filtered.map(s=>{
            const t=(allTutors || []).find(x=>x.id===s.tutor);
            return <tr key={s.id}><td style={{color:'var(--text3)'}}>{s.id}</td><td><div className="flex gap-8"><div className={`avatar ${avatarColor(s.id)}`}>{initials(s.name)}</div><div><div style={{fontWeight:500,color:'var(--text)'}}>{s.name}</div><div style={{fontSize:11,color:'var(--text3)'}}>{s.parent}</div></div></div></td><td><span className="badge badge-accent">{s.town}</span></td><td>{s.grade}</td><td>{s.board}</td><td>{t?t.name:<span style={{color:'var(--warn)'}}>None</span>}</td><td><StatusBadge status={s.status} /></td><td><button className="btn btn-sm" onClick={()=>setSelectedStudent(s)}>View</button></td></tr>;
          })}</tbody></table></div>
        </div>
      </div>
    );
  }

  if (page==='tutors') {
    if (selectedTutor) {
      const currentTutor = (allTutors || []).find(t => t.id === selectedTutor.id) || selectedTutor;
      const assigned = (allStudents || []).filter(s => s.tutor === currentTutor.id);
      return <TutorDetailView tutor={currentTutor} assignedStudents={assigned} onBack={()=>setSelectedTutor(null)} onRefresh={refreshData} />;
    }

    let filtered = allTutors || [];
    if (filterTutorAssigned === 'assigned') filtered = filtered.filter(t => (t.students || []).length > 0);
    else if (filterTutorAssigned === 'unassigned') filtered = filtered.filter(t => (t.students || []).length === 0);

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
          <div><div className="page-title">All Tutors</div><div className="page-sub">{(allTutors || []).length} tutors across the network.</div></div>
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
              <option value="town">Town</option>
              <option value="qualification">Qualification</option>
            </select>
            <input className="form-input" style={{flex: 1}} placeholder={`Search by ${searchTutorAttr}...`} value={searchTutorQuery} onChange={e=>setSearchTutorQuery(e.target.value)} />
          </div>
          <div className="table-wrap"><table><thead><tr><th>ID</th><th>Name</th><th>Town</th><th>Subjects</th><th>Grades</th><th>Students</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>{filtered.map(t=>(
            <tr key={t.id}><td style={{color:'var(--text3)'}}>{t.id}</td><td><div className="flex gap-8"><div className={`avatar ${avatarColor(t.id)}`}>{initials(t.name)}</div><div><div style={{fontWeight:500,color:'var(--text)'}}>{t.name}</div><div style={{fontSize:11,color:'var(--text3)'}}>{t.qualification}</div></div></div></td><td><span className="badge badge-accent">{t.town}</span></td><td><SubjectTags subjects={t.subjects || []} /></td><td>{t.grades}</td><td>{(t.students || []).length}</td><td><StatusBadge status={t.status} /></td><td><button className="btn btn-sm" onClick={()=>setSelectedTutor(t)}>View</button></td></tr>
          ))}</tbody></table></div>
        </div>
      </div>
    );
  }

  if (page==='finance') {
    const assignedStudents = (allStudents || []).filter(s => s.tutor);
    const targetAmount = assignedStudents.reduce((acc, s) => acc + (s.fees * 0.10), 0);

    const totalLoyaltyPaid = (allTutors || []).reduce((acc, t) => {
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
            <div className="page-title">Network Finance</div>
            <div className="page-sub">Revenue, fees, and payroll across all towns.</div>
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
            <div className="stat-label">Remaining to Collect</div>
            <div className="stat-value" style={{color: pendingRevenue > 0 ? 'var(--danger)' : 'var(--success)'}}>₹{pendingRevenue.toLocaleString()}</div>
          </div>
          <div className="stat-card"><div className="stat-label">Total Revenue</div><div className="stat-value" style={{color:'var(--gold)'}}>₹{totalRevenue.toLocaleString()}</div></div>
          <div className="stat-card"><div className="stat-label">Pending Fees</div><div className="stat-value" style={{color:'var(--danger)'}}>₹{allStudents.filter(s=>!s.feesPaid).reduce((a,s)=>a+s.fees,0).toLocaleString()}</div></div>
        </div>
      <div className="card">
        <div style={{fontWeight:500,marginBottom:16}}>Town Revenue Breakdown</div>
        {allAdmins.map(a=>(
          <div key={a.id} style={{marginBottom:18}}>
            <div className="flex-between mb-8"><span style={{fontWeight:500}}>{a.town}</span><span style={{color:'var(--success)'}}>₹{a.revenue.toLocaleString()}</span></div>
            <div className="progress-wrap"><div className="progress-fill" style={{width:`${(a.revenue/33200*100).toFixed(0)}%`}} /></div>
          </div>
        ))}
      </div>
    </div>
  );
  }

  return null;
};
