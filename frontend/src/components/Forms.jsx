import React, { useState } from 'react';
import { API_URL } from './Shared';

export const StudentForm = ({ onDone }) => {
  const [step, setStep] = useState(1);
  const TOTAL = 3;
  const [data, setData] = useState({ name: '', gender: '', grade: '', academicYear: '', school: '', board: '', weakSubjects: [], parent: '', phone: '', town: '', address: '', preferredGender: '', slots: [], pincode: '', additionalRequirements: '', aadhaar: '', schoolCity: '', caste: '', religion: '', fatherName: '', fatherPhone: '', fatherOccupation: '', motherName: '', motherPhone: '', motherOccupation: '', landmark: '' });
  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi', 'Telugu', 'Social Studies', 'Science'];
  const up = (k, v) => setData(p => ({ ...p, [k]: v }));
  const toggleSubject = (s) => setData(p => ({ ...p, weakSubjects: p.weakSubjects.includes(s) ? p.weakSubjects.filter(x => x !== s) : [...p.weakSubjects, s] }));

  const slotOptions = ['5:30 am - 7:30 am', '5:30 pm - 7:30 pm', '7:30 pm - 9:00 pm'];
  const handleAddSlot = (val) => {
    if (val && !data.slots.includes(val)) {
      setData(p => ({ ...p, slots: [...p.slots, val] }));
    }
  };
  const handleRemoveSlot = (s) => setData(p => ({ ...p, slots: p.slots.filter(x => x !== s) }));

  const handleSubmit = () => {
    fetch(`${API_URL}/api/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, fees: 2000, feesPaid: false }) // set default fees
    })
      .then(r => r.json())
      .then(res => {
        onDone();
      })
      .catch(err => {
        alert('Error submitting registration');
      });
  };

  return (
    <div>
      <div className="page-title">Student Registration</div>
      <div className="page-sub">Fill in the details below to register a new student.</div>
      <div className="step-indicator">
        {[1, 2, 3].map((n, i) => (
          <div key={n} className="flex gap-8" style={{ flex: 1, alignItems: 'center' }}>
            <div className={`step-dot ${step > n ? 'done' : step === n ? 'active' : ''}`}>{step > n ? '✓' : n}</div>
            {i < 2 && <div className={`step-line ${step > n ? 'done' : ''}`} style={{ flex: 1 }} />}
          </div>
        ))}
      </div>

      <div className="card">
        {step === 1 && <>
          <div className="form-section-title">Personal & Academic Details</div>
          <div className="form-grid mt-16">
            <div className="form-row">
              <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" placeholder="Student's full name" value={data.name} onChange={e => up('name', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Gender</label><select className="form-input" value={data.gender} onChange={e => up('gender', e.target.value)}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Aadhaar Number</label><input className="form-input" placeholder="12-digit Aadhaar" value={data.aadhaar} onChange={e => up('aadhaar', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Grade / Class</label><select className="form-input" value={data.grade} onChange={e => up('grade', e.target.value)}><option value="">Select</option>{['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'].map(g => <option key={g}>{g}</option>)}</select></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">School Name</label><input className="form-input" placeholder="School name" value={data.school} onChange={e => up('school', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">School City</label><input className="form-input" placeholder="School city" value={data.schoolCity} onChange={e => up('schoolCity', e.target.value)} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Academic Year</label><select className="form-input" value={data.academicYear} onChange={e => up('academicYear', e.target.value)}><option value="">Select</option><option>2023-2024</option><option>2024-2025</option><option>2025-2026</option><option>2026-2027</option></select></div>
              <div className="form-group"></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Board</label><select className="form-input" value={data.board} onChange={e => up('board', e.target.value)}><option value="">Select</option><option>CBSE</option><option>AP State</option><option>ICSE</option></select></div>
              <div className="form-group"><label className="form-label">Caste</label><select className="form-input" value={data.caste} onChange={e => up('caste', e.target.value)}><option value="">Select Caste</option><option>OBC</option><option>OC</option><option>BC</option><option>SC</option><option>ST</option></select></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Religion</label><select className="form-input" value={data.religion} onChange={e => up('religion', e.target.value)}><option value="">Select Religion</option><option>HINDU</option><option>MUSLIM</option><option>CHRISTIAN</option><option>SIKH</option><option>OTHER</option></select></div>
              <div className="form-group"></div>
            </div>
            <div className="form-group">
              <label className="form-label">Weak Subjects</label>
              <div className="checkbox-group mt-4">
                {subjects.map(s => (
                  <label key={s} className={`checkbox-pill ${data.weakSubjects.includes(s) ? 'selected' : ''}`}>
                    <input type="checkbox" checked={data.weakSubjects.includes(s)} onChange={() => toggleSubject(s)} />
                    {s}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </>}

        {step === 2 && <>
          <div className="form-section-title">Parent & Contact Information</div>
          <div className="form-grid mt-16">
            <div className="form-row">
              <div className="form-group"><label className="form-label">Father Name</label><input className="form-input" placeholder="Father's full name" value={data.fatherName} onChange={e => up('fatherName', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Father Mobile</label><input className="form-input" placeholder="10-digit mobile" maxLength={10} value={data.fatherPhone} onChange={e => up('fatherPhone', e.target.value)} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Father Occupation</label><input className="form-input" placeholder="e.g. Business, Teacher" value={data.fatherOccupation} onChange={e => up('fatherOccupation', e.target.value)} /></div>
              <div className="form-group"></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Mother Name</label><input className="form-input" placeholder="Mother's full name" value={data.motherName} onChange={e => up('motherName', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Mother Mobile</label><input className="form-input" placeholder="10-digit mobile" maxLength={10} value={data.motherPhone} onChange={e => up('motherPhone', e.target.value)} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Mother Occupation</label><input className="form-input" placeholder="generation shaper" value={data.motherOccupation} onChange={e => up('motherOccupation', e.target.value)} /></div>
              <div className="form-group"></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Town</label><select className="form-input" value={data.town} onChange={e => up('town', e.target.value)}><option value="">Select Town</option><option>Naidupet</option><option>Sullurupet</option><option>Nellore</option><option>Tirupathi</option></select></div>
              <div className="form-group"><label className="form-label">Pincode</label><input className="form-input" placeholder="516001" value={data.pincode} onChange={e => up('pincode', e.target.value)} /></div>
            </div>
            <div className="form-group"><label className="form-label">Full Address</label><textarea className="form-input" rows={3} placeholder="House number, street..." style={{ resize: 'vertical' }} value={data.address} onChange={e => up('address', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Landmark</label><input className="form-input" placeholder="Near temple, opposite school..." value={data.landmark} onChange={e => up('landmark', e.target.value)} /></div>
          </div>
        </>}

        {step === 3 && <>
          <div className="form-section-title">Preferences & Requirements</div>
          <div className="form-grid mt-16">
            <div className="form-row">
              <div className="form-group"><label className="form-label">Preferred Tutor Gender</label><select className="form-input" value={data.preferredGender} onChange={e => up('preferredGender', e.target.value)}><option value="">No Preference</option><option>Male</option><option>Female</option></select></div>
              <div className="form-group">
                <label className="form-label">Preferred Time Slots</label>
                <div className="flex gap-8 mb-8">
                  <select className="form-input" value="" onChange={(e) => handleAddSlot(e.target.value)}>
                    <option value="" disabled>Select Slot to Add...</option>
                    {slotOptions.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="flex gap-8 flex-wrap">
                  {data.slots.map(s => (
                    <div key={s} className="badge flex gap-4" style={{ alignItems: 'center', background: 'var(--bg3)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                      {s} <span style={{ cursor: 'pointer', fontWeight: 'bold', color: 'var(--danger)' }} onClick={() => handleRemoveSlot(s)}>×</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="form-group"><label className="form-label">Additional Requirements</label><textarea className="form-input" rows={3} placeholder="Any specific requirements or notes for the admin..." style={{ resize: 'vertical' }} value={data.additionalRequirements} onChange={e => up('additionalRequirements', e.target.value)} /></div>
            <div className="card-sm" style={{ background: 'var(--bg3)' }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, color: 'var(--accent2)' }}>Registration Summary</div>
              {data.name && <div className="info-row"><span className="info-key">Name</span><span className="info-val">{data.name}</span></div>}
              {data.aadhaar && <div className="info-row"><span className="info-key">Aadhaar Number</span><span className="info-val">{data.aadhaar}</span></div>}
              {data.grade && <div className="info-row"><span className="info-key">Grade</span><span className="info-val">{data.grade}</span></div>}
              {data.academicYear && <div className="info-row"><span className="info-key">Academic Year</span><span className="info-val">{data.academicYear}</span></div>}
              {data.board && <div className="info-row"><span className="info-key">Board</span><span className="info-val">{data.board}</span></div>}
              {data.school && <div className="info-row"><span className="info-key">School Name</span><span className="info-val">{data.school}</span></div>}
              {data.schoolCity && <div className="info-row"><span className="info-key">School City</span><span className="info-val">{data.schoolCity}</span></div>}
              {data.caste && <div className="info-row"><span className="info-key">Caste</span><span className="info-val">{data.caste}</span></div>}
              {data.religion && <div className="info-row"><span className="info-key">Religion</span><span className="info-val">{data.religion}</span></div>}
              {data.weakSubjects.length > 0 && <div className="info-row"><span className="info-key">Weak Subjects</span><span className="info-val">{data.weakSubjects.join(', ')}</span></div>}
              {data.fatherName && <div className="info-row"><span className="info-key">Father Name</span><span className="info-val">{data.fatherName}</span></div>}
              {data.fatherPhone && <div className="info-row"><span className="info-key">Father Mobile</span><span className="info-val">{data.fatherPhone}</span></div>}
              {data.motherName && <div className="info-row"><span className="info-key">Mother Name</span><span className="info-val">{data.motherName}</span></div>}
              {data.motherPhone && <div className="info-row"><span className="info-key">Mother Mobile</span><span className="info-val">{data.motherPhone}</span></div>}
              {data.town && <div className="info-row"><span className="info-key">Town</span><span className="info-val">{data.town}</span></div>}
              {data.landmark && <div className="info-row"><span className="info-key">Landmark</span><span className="info-val">{data.landmark}</span></div>}
              {data.slots && data.slots.length > 0 && <div className="info-row"><span className="info-key">Preferred Slots</span><span className="info-val">{data.slots.join(', ')}</span></div>}
            </div>
          </div>
        </>}

        <div className="flex-between mt-24">
          <button className="btn" onClick={() => step > 1 ? setStep(step - 1) : null} style={{ visibility: step > 1 ? 'visible' : 'hidden' }}>← Back</button>
          {step < TOTAL ? <button className="btn btn-primary" onClick={() => setStep(step + 1)}>Continue →</button>
            : <button className="btn btn-primary" onClick={handleSubmit}>Submit Registration ✓</button>}
        </div>
      </div>
    </div>
  );
};

const parseSlot = (slotStr) => {
  const match = slotStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return null;
  let hr = parseInt(match[1]);
  const min = parseInt(match[2]);
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && hr < 12) hr += 12;
  if (ampm === 'AM' && hr === 12) hr = 0;
  const start = hr * 60 + min;
  return { start, end: start + 30 };
};

const formatMinutes = (m) => {
  let hr = Math.floor(m / 60);
  const min = m % 60;
  const ampm = hr >= 12 ? 'PM' : 'AM';
  hr = hr % 12;
  if (hr === 0) hr = 12;
  const hrStr = String(hr).padStart(2, '0');
  const minStr = String(min).padStart(2, '0');
  return `${hrStr}:${minStr} ${ampm}`;
};

const getCombinedSlots = (slots) => {
  if (!slots || slots.length === 0) return [];
  const parsed = slots.map(parseSlot).filter(Boolean);
  parsed.sort((a, b) => a.start - b.start);
  const merged = [parsed[0]];
  for (let i = 1; i < parsed.length; i++) {
    const last = merged[merged.length - 1];
    const cur = parsed[i];
    if (cur.start <= last.end) {
      last.end = Math.max(last.end, cur.end);
    } else {
      merged.push(cur);
    }
  }
  return merged.map(interval => {
    const isMorning = interval.end <= 12 * 60;
    const isEvening = interval.start >= 12 * 60;
    let label = 'Combined Block';
    let icon = '📅';
    if (isMorning) {
      label = 'Morning Session';
      icon = '☀️';
    } else if (isEvening) {
      label = 'Evening Session';
      icon = '🌙';
    }
    return {
      label,
      icon,
      time: `${formatMinutes(interval.start)} - ${formatMinutes(interval.end)}`
    };
  });
};

export const TutorForm = ({ onDone }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    name: '', gender: '', phone: '', subjects: [], gradeFrom: '', gradeTo: '', qualification: '', experience: '', address: '', aadhaar: '',
    caste: '', religion: '', landmark: '', pincodes: '', town: '',
    tenth_school_name: '', tenth_cgpa: '', inter_stream: '', inter_college_name: '', inter_cgpa: '', degree_name: '', degree_college_name: '', degree_cgpa: '', occupation: '',
    availability: { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [] }
  });

  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi', 'Telugu', 'Social Studies', 'Science', 'Computer Science'];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const daysFull = {
    Mon: 'Monday',
    Tue: 'Tuesday',
    Wed: 'Wednesday',
    Thu: 'Thursday',
    Fri: 'Friday',
    Sat: 'Saturday',
    Sun: 'Sunday'
  };

  const morningSlots = ["05:30 AM", "06:00 AM", "06:30 AM", "07:00 AM", "07:30 AM"];
  const eveningSlots = ["04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM", "08:30 PM"];
  const allSlots = [...morningSlots, ...eveningSlots];

  const up = (k, v) => setData(p => ({ ...p, [k]: v }));
  const toggle = (s) => setData(p => ({ ...p, subjects: p.subjects.includes(s) ? p.subjects.filter(x => x !== s) : [...p.subjects, s] }));

  const toggleAvailability = (day, slot) => {
    const daySlots = data.availability[day] || [];
    const newSlots = daySlots.includes(slot) ? daySlots.filter(x => x !== slot) : [...daySlots, slot];
    setData(p => ({
      ...p,
      availability: { ...p.availability, [day]: newSlots }
    }));
  };

  const toggleAllForTime = (time) => {
    let allSelected = true;
    for (const d of days) {
      if (!(data.availability[d] || []).includes(time)) {
        allSelected = false;
        break;
      }
    }

    setData(p => {
      const newAvail = { ...p.availability };
      for (const d of days) {
        const daySlots = newAvail[d] || [];
        if (allSelected) {
          newAvail[d] = daySlots.filter(x => x !== time);
        } else {
          if (!daySlots.includes(time)) newAvail[d] = [...daySlots, time];
        }
      }
      return { ...p, availability: newAvail };
    });
  };

  const toggleAllDay = (day) => {
    const current = data.availability[day] || [];
    if (current.length < allSlots.length) {
      setData(p => ({
        ...p,
        availability: { ...p.availability, [day]: [...allSlots] }
      }));
    } else {
      setData(p => ({
        ...p,
        availability: { ...p.availability, [day]: [] }
      }));
    }
  };

  const selectAllGlobal = () => {
    const newAvail = {};
    days.forEach(d => {
      newAvail[d] = [...allSlots];
    });
    setData(p => ({ ...p, availability: newAvail }));
  };

  const clearAllGlobal = () => {
    const newAvail = {};
    days.forEach(d => {
      newAvail[d] = [];
    });
    setData(p => ({ ...p, availability: newAvail }));
  };

  const handleSubmit = () => {
    const formattedPincodes = data.pincodes.split(',').map(p => p.trim()).filter(Boolean);
    fetch(`${API_URL}/api/tutors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, pincodes: formattedPincodes, grades: `${data.gradeFrom} to ${data.gradeTo}` })
    })
      .then(r => r.json())
      .then(res => {
        onDone();
      })
      .catch(err => {
        alert('Error submitting registration');
      });
  };

  return (
    <div>
      <div className="page-title">Tutor Registration</div>
      <div className="page-sub">Register as a home tutor in our network.</div>
      <div className="step-indicator">
        {[1, 2, 3, 4].map((n, i) => (
          <div key={n} className="flex gap-8" style={{ flex: 1, alignItems: 'center' }}>
            <div className={`step-dot ${step > n ? 'done' : step === n ? 'active' : ''}`}>{step > n ? '✓' : n}</div>
            {i < 3 && <div className={`step-line ${step > n ? 'done' : ''}`} style={{ flex: 1 }} />}
          </div>
        ))}
      </div>

      <div className="card">
        {step === 1 && <>
          <div className="form-section-title">Personal Information</div>
          <div className="form-grid mt-16">
            <div className="form-row">
              <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" placeholder="Your full name" value={data.name} onChange={e => up('name', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Gender</label><select className="form-input" value={data.gender} onChange={e => up('gender', e.target.value)}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Mobile Number</label><input className="form-input" placeholder="10-digit number" value={data.phone} onChange={e => up('phone', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Aadhaar Number</label><input className="form-input" placeholder="12-digit Aadhaar" value={data.aadhaar} onChange={e => up('aadhaar', e.target.value)} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Caste</label><select className="form-input" value={data.caste} onChange={e => up('caste', e.target.value)}><option value="">Select Caste</option><option>OBC</option><option>OC</option><option>BC</option><option>SC</option><option>ST</option></select></div>
              <div className="form-group"><label className="form-label">Religion</label><select className="form-input" value={data.religion} onChange={e => up('religion', e.target.value)}><option value="">Select Religion</option><option>HINDU</option><option>MUSLIM</option><option>CHRISTIAN</option><option>SIKH</option><option>OTHER</option></select></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Primary Town</label><select className="form-input" value={data.town} onChange={e => up('town', e.target.value)}><option value="">Select</option><option>Naidupet</option><option>Sullurpet</option><option>Nellore</option><option>Thirupathi</option></select></div>
              <div className="form-group"><label className="form-label">Available Pincodes</label><input className="form-input" placeholder="516001, 516002..." value={data.pincodes} onChange={e => up('pincodes', e.target.value)} /></div>
            </div>
            <div className="form-group"><label className="form-label">Landmark</label><input className="form-input" placeholder="Near temple..." value={data.landmark} onChange={e => up('landmark', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Home Address</label><textarea className="form-input" rows={3} placeholder="Full address" style={{ resize: 'vertical' }} value={data.address} onChange={e => up('address', e.target.value)} /></div>
          </div>
        </>}

        {step === 2 && <>
          <div className="form-section-title">Qualifications & Experience</div>
          <div className="form-grid mt-16">
            <div className="form-row">
              <div className="form-group"><label className="form-label">Highest Qualification</label><select className="form-input" value={data.qualification} onChange={e => up('qualification', e.target.value)}><option value="">Select</option><option>Intermediate / 12th</option><option>B.Sc</option><option>B.Ed</option><option>M.Sc</option><option>B.Tech / B.E.</option><option>M.Tech</option><option>Other</option></select></div>
              <div className="form-group"><label className="form-label">Years of Experience</label><select className="form-input" value={data.experience} onChange={e => up('experience', e.target.value)}><option value="">Select</option><option>Fresher</option><option>1 year</option><option>2-3 years</option><option>4-5 years</option><option>5+ years</option></select></div>
            </div>
            <div className="form-group">
              <label className="form-label">Subjects You Can Teach</label>
              <div className="checkbox-group mt-4">
                {subjects.map(s => (
                  <label key={s} className={`checkbox-pill ${data.subjects.includes(s) ? 'selected' : ''}`}>
                    <input type="checkbox" checked={data.subjects.includes(s)} onChange={() => toggle(s)} />
                    {s}
                  </label>
                ))}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Teaches From Grade</label><select className="form-input" value={data.gradeFrom} onChange={e => up('gradeFrom', e.target.value)}><option value="">Select</option>{['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'].map(g => <option key={g}>{g}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Teaches Up To Grade</label><select className="form-input" value={data.gradeTo} onChange={e => up('gradeTo', e.target.value)}><option value="">Select</option>{['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'].map(g => <option key={g}>{g}</option>)}</select></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Current Occupation</label><input className="form-input" placeholder="e.g. Teacher, Engineer" value={data.occupation} onChange={e => up('occupation', e.target.value)} /></div>
              <div className="form-group"></div>
            </div>

            <div className="form-section-title mt-16" style={{ fontSize: 14 }}>Education Details</div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">10th School Name</label><input className="form-input" placeholder="School Name" value={data.tenth_school_name} onChange={e => up('tenth_school_name', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">10th CGPA/Percentage</label><input className="form-input" placeholder="e.g. 9.5 or 90%" value={data.tenth_cgpa} onChange={e => up('tenth_cgpa', e.target.value)} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Inter/12th College Name</label><input className="form-input" placeholder="College Name" value={data.inter_college_name} onChange={e => up('inter_college_name', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Inter/12th Stream</label><input className="form-input" placeholder="e.g. MPC, BiPC" value={data.inter_stream} onChange={e => up('inter_stream', e.target.value)} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Inter/12th CGPA</label><input className="form-input" placeholder="e.g. 9.0" value={data.inter_cgpa} onChange={e => up('inter_cgpa', e.target.value)} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Degree Name</label><input className="form-input" placeholder="e.g. B.Tech" value={data.degree_name} onChange={e => up('degree_name', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Degree College Name</label><input className="form-input" placeholder="College Name" value={data.degree_college_name} onChange={e => up('degree_college_name', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Degree CGPA</label><input className="form-input" placeholder="e.g. 8.5" value={data.degree_cgpa} onChange={e => up('degree_cgpa', e.target.value)} /></div>
            </div>
          </div>
        </>}

        {step === 3 && <>
          <div className="flex-between">
            <div className="form-section-title" style={{ margin: 0, border: 'none' }}>Set Your Weekly Availability</div>
            <div style={{ fontSize: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
              <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--accent2)', fontWeight: 500, padding: 0 }} onClick={selectAllGlobal}>Select All Slots</button>
              <span style={{ color: 'var(--text3)' }}>|</span>
              <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--text2)', fontWeight: 500, padding: 0 }} onClick={clearAllGlobal}>Clear All</button>
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20, marginTop: 4 }}>
            Select the time slots you are available to teach. These will be your recurring weekly hours.
          </p>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  {days.map(d => (
                    <th key={d} className="day-header" style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{daysFull[d]}</div>
                      <span className="day-header-all" style={{ display: 'inline-block', fontSize: 10, color: 'var(--accent2)', cursor: 'pointer', marginTop: 4, fontWeight: 700 }} onClick={() => toggleAllDay(d)}>ALL</span>
                    </th>
                  ))}
                  <th style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text)' }}>All Days</th>
                </tr>
              </thead>
              <tbody>
                <tr className="session-header">
                  <td colSpan={8} style={{ pointerEvents: 'none', background: 'var(--bg2)', fontWeight: 600, color: 'var(--accent2)', padding: '12px 14px' }}>
                    ☀️ Morning Session <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text3)', marginLeft: 8 }}>5:30 AM — 8:00 AM</span>
                  </td>
                </tr>
                {morningSlots.map(t => (
                  <tr key={t}>
                    <td style={{ fontWeight: 500, fontSize: 12, color: 'var(--text2)' }}>{t}</td>
                    {days.map(d => {
                      const isSel = data.availability[d]?.includes(t);
                      return (
                        <td key={d} style={{ textAlign: 'center', padding: '6px' }}>
                          <button
                            type="button"
                            className={`avail-btn ${isSel ? 'selected' : ''}`}
                            onClick={() => toggleAvailability(d, t)}
                          >
                            Available
                          </button>
                        </td>
                      );
                    })}
                    <td style={{ textAlign: 'center', padding: '6px', verticalAlign: 'middle' }}>
                      <span style={{ fontSize: 10, color: 'var(--accent)', cursor: 'pointer', fontWeight: 700, padding: '4px 8px', background: 'var(--bg3)', borderRadius: 4 }} onClick={() => toggleAllForTime(t)}>ALL</span>
                    </td>
                  </tr>
                ))}

                <tr className="session-header">
                  <td colSpan={8} style={{ pointerEvents: 'none', background: 'var(--bg2)', fontWeight: 600, color: 'var(--accent2)', padding: '12px 14px' }}>
                    🌙 Evening Session <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text3)', marginLeft: 8 }}>4:00 PM — 9:00 PM</span>
                  </td>
                </tr>
                {eveningSlots.map(t => (
                  <tr key={t}>
                    <td style={{ fontWeight: 500, fontSize: 12, color: 'var(--text2)' }}>{t}</td>
                    {days.map(d => {
                      const isSel = data.availability[d]?.includes(t);
                      return (
                        <td key={d} style={{ textAlign: 'center', padding: '6px' }}>
                          <button
                            type="button"
                            className={`avail-btn ${isSel ? 'selected' : ''}`}
                            onClick={() => toggleAvailability(d, t)}
                          >
                            Available
                          </button>
                        </td>
                      );
                    })}
                    <td style={{ textAlign: 'center', padding: '6px', verticalAlign: 'middle' }}>
                      <span style={{ fontSize: 10, color: 'var(--accent)', cursor: 'pointer', fontWeight: 700, padding: '4px 8px', background: 'var(--bg3)', borderRadius: 4 }} onClick={() => toggleAllForTime(t)}>ALL</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>}

        {step === 4 && (
          <div>
            <div className="form-section-title">Review Your Schedule</div>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 24 }}>
              Please review your recurring weekly hours. Adjacent slots have been combined for clarity. These hours will be used to generate your availability for student bookings.
            </p>

            <div className="avail-grid">
              {days.map(d => {
                const daySlots = data.availability[d] || [];
                const combined = getCombinedSlots(daySlots);
                const hasSlots = combined.length > 0;

                return (
                  <div key={d} className="day-card" style={{ border: hasSlots ? '1px solid var(--accent)' : '1px solid var(--border)' }}>
                    <div className="day-card-header">
                      <span>{daysFull[d]}</span>
                      {hasSlots ? (
                        <span style={{ color: 'var(--success)' }}>✓</span>
                      ) : (
                        <span style={{ color: 'var(--text3)', fontSize: 12 }}>—</span>
                      )}
                    </div>
                    {hasSlots ? (
                      combined.map((item, idx) => (
                        <div key={idx} className="day-card-session">
                          <span className="day-card-session-icon">{item.icon}</span>
                          <div>
                            <div className="day-card-session-label">{item.label}</div>
                            <div className="day-card-session-time">{item.time}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic', lineHeight: 1.4 }}>
                        No sessions scheduled. You are currently marked as unavailable for bookings on this day.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex-between mt-24">
          <button className="btn" onClick={() => step > 1 ? setStep(step - 1) : null} style={{ visibility: step > 1 ? 'visible' : 'hidden' }}>← Back</button>
          {step < 4 ? <button className="btn btn-primary" onClick={() => setStep(step + 1)}>Continue →</button>
            : <button className="btn btn-primary" onClick={handleSubmit}>Submit Registration ✓</button>}
        </div>
      </div>
    </div>
  );
};
