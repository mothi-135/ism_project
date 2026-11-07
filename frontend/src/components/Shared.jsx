import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../config/api';

export { API_BASE_URL };
export const API_URL = API_BASE_URL.replace(/\/api\/?$/, '');

export const initials = (name) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

export const getSlotBuckets = (slotInput) => {
  const buckets = new Set();
  if (!slotInput) return buckets;

  const items = Array.isArray(slotInput) ? slotInput : [slotInput];
  for (const item of items) {
    if (typeof item !== 'string' && typeof item !== 'number') continue;
    const str = String(item).toLowerCase().trim();
    if (!str || str === 'unassigned') continue;

    // Check full slot string names first
    if (str.includes('5:30 am - 7:30 am')) {
      buckets.add('morning');
    }
    if (str.includes('5:30 pm - 7:30 pm')) {
      buckets.add('evening_early');
    }
    if (str.includes('7:30 pm - 9:00 pm')) {
      buckets.add('evening_late');
    }

    // Check individual time chips (e.g. '05:30 AM', '06:00 PM', '07:30 PM')
    const timeMatch = str.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
    if (timeMatch && !str.includes('-')) {
      let hr = parseInt(timeMatch[1], 10);
      const isPM = timeMatch[3].toLowerCase() === 'pm';
      if (isPM && hr < 12) hr += 12;
      if (!isPM && hr === 12) hr = 0;
      const minFromMidnight = hr * 60 + parseInt(timeMatch[2], 10);

      // Morning: 5:00 AM to 8:30 AM
      if (minFromMidnight >= 300 && minFromMidnight < 510) {
        buckets.add('morning');
      }
      // Early evening: 4:00 PM to 7:29 PM
      else if (minFromMidnight >= 960 && minFromMidnight < 1170) {
        buckets.add('evening_early');
      }
      // Late evening: 7:30 PM to 10:00 PM
      else if (minFromMidnight >= 1170 && minFromMidnight <= 1320) {
        buckets.add('evening_late');
      }
    }

    // Check slot ID numbers
    if (typeof item === 'number' || /^\d+$/.test(str)) {
      const num = parseInt(str, 10);
      if ([1, 2, 10, 11, 12, 13].includes(num)) buckets.add('morning');
      if ([3, 4, 5, 6, 7, 14, 15].includes(num)) buckets.add('evening_early');
      if ([8, 9, 16, 17].includes(num)) buckets.add('evening_late');
    }
  }

  if (buckets.size === 0 && items.length > 0) {
    items.forEach(it => {
      const s = String(it).trim().toLowerCase();
      if (s && s !== 'unassigned') buckets.add(s);
    });
  }

  return buckets;
};

export const hasSlotConflict = (bucketsA, bucketsB) => {
  for (const b of bucketsA) {
    if (bucketsB.has(b)) return true;
  }
  return false;
};

export const avatarColor = (id) => {
  const colors = ['avatar-purple', 'avatar-gold', 'avatar-success', 'avatar-info'];

  const safeId = String(id || 'A');

  return colors[safeId.charCodeAt(0) % colors.length];
};

export const StatusBadge = ({ status }) => {
  const map = { active: 'badge-success', pending: 'badge-warn', verified: 'badge-success', unassigned: 'badge-info', paid: 'badge-success', unpaid: 'badge-danger' };
  return <span className={`badge ${map[status] || 'badge-accent'}`}>{status}</span>;
};

export const SubjectTags = ({ subjects }) => subjects.map(s => <span key={s} className="subject-tag">{s}</span>);

export const Navbar = ({ onLogin }) => (
  <nav className="navbar">
    <div className="nav-brand" style={{ cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>ISM</div>
    <div className="nav-links">
      <button className="btn btn-ghost btn-sm" onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}>About</button>
      <button className="btn btn-ghost btn-sm" onClick={() => document.getElementById('towns')?.scrollIntoView({ behavior: 'smooth' })}>Towns</button>
      <button className="btn btn-primary btn-sm" onClick={onLogin}>Login →</button>
    </div>
  </nav>
);

export const Sidebar = ({ role, active, setActive, user, onLogout }) => {
  const navMap = {
    student: [
      { key: 'dashboard', icon: '🏠', label: 'Dashboard' },
      { key: 'tutors', icon: '👨‍🏫', label: 'My Tutor' },
      { key: 'profile', icon: '👤', label: 'My Profile' },
    ],
    tutor: [
      { key: 'dashboard', icon: '🏠', label: 'Dashboard' },
      { key: 'students', icon: '🎒', label: 'My Students' },
      { key: 'profile', icon: '👤', label: 'My Profile' },
      { key: 'earnings', icon: '💰', label: 'Earnings' },
    ],
    admin: [
      { key: 'dashboard', icon: '📊', label: 'Dashboard' },
      { key: 'students', icon: '🎒', label: 'Students' },
      { key: 'tutors', icon: '👨‍🏫', label: 'Tutors' },
      { key: 'matching', icon: '🎯', label: 'Matching' },
      { key: 'fees', icon: '💰', label: 'Fees' },
    ],
    globaladmin: [
      { key: 'dashboard', icon: '🌐', label: 'Overview' },
      { key: 'towns', icon: '🏙️', label: 'Towns & Admins' },
      { key: 'students', icon: '🎒', label: 'All Students' },
      { key: 'tutors', icon: '👨‍🏫', label: 'All Tutors' },
      { key: 'finance', icon: '💰', label: 'Finance' },
    ],
  };
  const nav = navMap[role] || [];
  const roleLabel = { student: 'Student Portal', tutor: 'Tutor Portal', admin: 'Admin Console', globaladmin: 'Global Admin' };

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-name">ISM</div>
        <div className="brand-sub">{roleLabel[role]}</div>
      </div>
      <div className="sidebar-nav">
        {nav.map(item => (
          <button key={item.key} className={`nav-btn ${active === item.key ? 'active' : ''}`} onClick={() => setActive(item.key)}>
            <span className="nav-icon">{item.icon}</span>{item.label}
          </button>
        ))}
      </div>
      <div className="sidebar-footer">
        <div className="flex gap-12 mb-8">
          <div className={`avatar ${avatarColor(user?.id || 'A')}`}>{initials(user?.name || 'US')}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
            <div className="text-sm">{role}</div>
          </div>
        </div>
        <button className="btn btn-sm w-full btn-ghost" onClick={onLogout}>Sign Out</button>
      </div>
    </div>
  );
};

export const StudentDetailView = ({ student, tutor, onBack }) => {
  if (!student) return null;
  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          <button className="btn btn-ghost btn-sm mb-8" onClick={onBack}>← Back to Students</button>
          <div className="page-title">{student.name}</div>
          <div className="page-sub">Student ID: {student.id} | <StatusBadge status={student.status} /></div>
        </div>
        <div className={`avatar avatar-lg ${avatarColor(student.id)}`}>{initials(student.name)}</div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="form-section-title">Personal Details</div>
          <div className="info-row"><span className="info-key">Gender</span><span className="info-val">{student.gender || '—'}</span></div>
          <div className="info-row"><span className="info-key">Date Joined</span><span className="info-val">{student.joiningDate ? new Date(student.joiningDate).toLocaleDateString() : '—'}</span></div>
          <div className="info-row"><span className="info-key">Email</span><span className="info-val">{student.email || '—'}</span></div>
          <div className="info-row"><span className="info-key">Parent Name</span><span className="info-val">{student.parent || '—'}</span></div>
          <div className="info-row"><span className="info-key">Phone</span><span className="info-val">{student.phone || '—'}</span></div>
          <div className="info-row"><span className="info-key">Town</span><span className="info-val">{student.town}</span></div>
          <div className="info-row"><span className="info-key">Pincode</span><span className="info-val">{student.pincode || '—'}</span></div>
          <div className="info-row"><span className="info-key">Address</span><span className="info-val">{student.address || '—'}</span></div>
        </div>

        <div>
          <div className="card mb-24">
            <div className="form-section-title">Academic Details</div>
            <div className="info-row"><span className="info-key">Grade</span><span className="info-val">{student.grade}</span></div>
            <div className="info-row"><span className="info-key">Board</span><span className="info-val">{student.board || '—'}</span></div>
            <div className="info-row"><span className="info-key">School</span><span className="info-val">{student.school || '—'}</span></div>
            <div className="info-row" style={{ alignItems: 'center' }}><span className="info-key">Weak Subjects</span><span className="info-val"><SubjectTags subjects={student.weakSubjects || []} /></span></div>
            <div className="info-row"><span className="info-key">Preferred Slot</span><span className="info-val">{student.slot || '—'}</span></div>
            <div className="info-row"><span className="info-key">Preferred Tutor Gender</span><span className="info-val">{student.preferredGender || '—'}</span></div>
            <div className="info-row"><span className="info-key">Additional Requirements</span><span className="info-val">{student.additionalRequirements || '—'}</span></div>
          </div>

          <div className="card">
            <div className="form-section-title">Tutor & Fees</div>
            {tutor ? (
              <div className="info-row"><span className="info-key">Assigned Tutor</span><span className="info-val">{tutor.name} ({tutor.id})</span></div>
            ) : (
              <div className="info-row"><span className="info-key">Assigned Tutor</span><span className="info-val" style={{ color: 'var(--warn)' }}>Unassigned</span></div>
            )}
            <div className="info-row"><span className="info-key">Fees</span><span className="info-val">₹{student.fees}</span></div>
            <div className="info-row"><span className="info-key">Payment Status</span><span className="info-val"><StatusBadge status={student.feesPaid ? 'paid' : 'unpaid'} /></span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TutorDetailView = ({ tutor, assignedStudents, onBack, onRefresh }) => {
  const [loyaltyPayments, setLoyaltyPayments] = useState(tutor.loyalty || []);
  const [showAddLoyalty, setShowAddLoyalty] = useState(false);
  const [loyaltyForm, setLoyaltyForm] = useState({ studentId: '', date: '', amount: '', notes: '' });

  useEffect(() => {
    setLoyaltyPayments(tutor.loyalty || []);
  }, [tutor.loyalty]);

  const handleAddLoyalty = () => {
    if (!loyaltyForm.studentId || !loyaltyForm.date || !loyaltyForm.amount) {
      alert('Please fill in all fields (Student, Date, and Amount).');
      return;
    }
    fetch(`${API_URL}/api/tutors/${tutor.id}/loyalty`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: loyaltyForm.studentId,
        date: loyaltyForm.date,
        amount: parseFloat(loyaltyForm.amount),
        notes: loyaltyForm.notes
      })
    })
      .then(res => {
        if (res.ok) {
          const selectedStudentObj = assignedStudents.find(s => s.id === loyaltyForm.studentId);
          const studentName = selectedStudentObj ? selectedStudentObj.name : '';
          setLoyaltyPayments(prev => [
            {
              id: Date.now(),
              date: loyaltyForm.date,
              amount: parseFloat(loyaltyForm.amount),
              notes: `${studentName ? 'For ' + studentName + ' - ' : ''}${loyaltyForm.notes}`
            },
            ...prev
          ]);
          setShowAddLoyalty(false);
          setLoyaltyForm({ studentId: '', date: '', amount: '', notes: '' });
          if (onRefresh) onRefresh();
        } else {
          res.json().then(data => alert(data.message || 'Failed to add loyalty payment.'));
        }
      })
      .catch(err => {
        alert('Error connecting to backend.');
      });
  };

  if (!tutor) return null;

  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          <button className="btn btn-ghost btn-sm mb-8" onClick={onBack}>← Back to Tutors</button>
          <div className="page-title">{tutor.name}</div>
          <div className="page-sub">Tutor ID: {tutor.id} | <StatusBadge status={tutor.status} /></div>
        </div>
        <div className={`avatar avatar-lg ${avatarColor(tutor.id)}`}>{initials(tutor.name)}</div>
      </div>

      <div className="grid-2">
        <div>
          <div className="card mb-24">
            <div className="form-section-title">Personal Details</div>
            <div className="info-row"><span className="info-key">Gender</span><span className="info-val">{tutor.gender || '—'}</span></div>
            <div className="info-row"><span className="info-key">Phone</span><span className="info-val">{tutor.phone}</span></div>
            <div className="info-row"><span className="info-key">WhatsApp</span><span className="info-val">{tutor.whatsapp || '—'}</span></div>
            <div className="info-row"><span className="info-key">Email</span><span className="info-val">{tutor.email || '—'}</span></div>
            <div className="info-row"><span className="info-key">DOB</span><span className="info-val">{tutor.dob ? new Date(tutor.dob).toLocaleDateString() : '—'}</span></div>
            <div className="info-row"><span className="info-key">Aadhaar</span><span className="info-val">{tutor.aadhaar || '—'}</span></div>
            <div className="info-row"><span className="info-key">Town</span><span className="info-val">{tutor.town}</span></div>
            <div className="info-row"><span className="info-key">Address</span><span className="info-val">{tutor.address || '—'}</span></div>
          </div>

          <div className="card mb-24">
            <div className="flex-between mb-16"><div className="form-section-title mb-0">Assigned Students</div></div>
            {assignedStudents.length === 0 ? <div style={{ color: 'var(--text3)', fontSize: 13 }}>No students assigned.</div> : (
              <div className="table-wrap"><table><thead><tr><th>ID</th><th>Name</th><th>Grade</th></tr></thead>
                <tbody>{assignedStudents.map(s => (
                  <tr key={s.id}><td>{s.id}</td><td>{s.name}</td><td>{s.grade}</td></tr>
                ))}</tbody></table></div>
            )}
          </div>
        </div>

        <div>
          <div className="card mb-24">
            <div className="form-section-title">Qualifications & Experience</div>
            <div className="info-row"><span className="info-key">Qualification</span><span className="info-val">{tutor.qualification || '—'}</span></div>
            <div className="info-row"><span className="info-key">Experience</span><span className="info-val">{tutor.experience || '—'}</span></div>
            <div className="info-row"><span className="info-key">Grades Taught</span><span className="info-val">{tutor.grades || '—'}</span></div>
            <div className="info-row" style={{ alignItems: 'center' }}><span className="info-key">Subjects</span><span className="info-val"><SubjectTags subjects={tutor.subjects || []} /></span></div>
            <div className="info-row"><span className="info-key">Pincodes</span><span className="info-val">{(tutor.pincodes || []).join(', ') || '—'}</span></div>
          </div>

          <div className="card">
            <div className="flex-between mb-16">
              <div className="form-section-title mb-0">Loyalty Payments</div>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddLoyalty(true)}>+ Add Payment</button>
            </div>

            {showAddLoyalty && (
              <div style={{ background: 'var(--bg3)', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label">For Student</label>
                  <select 
                    className="form-input" 
                    value={loyaltyForm.studentId} 
                    onChange={e => setLoyaltyForm({ ...loyaltyForm, studentId: e.target.value })}
                  >
                    <option value="">Select student...</option>
                    {assignedStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-input" value={loyaltyForm.date} onChange={e => setLoyaltyForm({ ...loyaltyForm, date: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Amount (₹)</label><input type="number" className="form-input" value={loyaltyForm.amount} onChange={e => setLoyaltyForm({ ...loyaltyForm, amount: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Notes</label><input type="text" className="form-input" value={loyaltyForm.notes} onChange={e => setLoyaltyForm({ ...loyaltyForm, notes: e.target.value })} /></div>
                <div className="flex gap-8 mt-12">
                  <button className="btn btn-primary btn-sm" onClick={handleAddLoyalty}>Save</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setShowAddLoyalty(false); setLoyaltyForm({ studentId: '', date: '', amount: '', notes: '' }); }}>Cancel</button>
                </div>
              </div>
            )}

            {loyaltyPayments.length === 0 ? <div style={{ color: 'var(--text3)', fontSize: 13 }}>No loyalty payments recorded.</div> : (
              <div className="table-wrap"><table><thead><tr><th>Date</th><th>Amount</th><th>Notes</th></tr></thead>
                <tbody>{loyaltyPayments.map(p => (
                  <tr key={p.id}><td>{p.date}</td><td style={{ color: 'var(--success)' }}>₹{p.amount}</td><td>{p.notes}</td></tr>
                ))}</tbody></table></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
