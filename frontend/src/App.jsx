import React, { useState } from 'react';
import { Navbar, Sidebar, initials, avatarColor, API_URL } from './components/Shared';
import API_BASE_URL from './config/api';
import { StudentForm, TutorForm } from './components/Forms';
import { AdminDashboard } from './components/AdminDashboard';
import { GlobalAdminDashboard } from './components/GlobalAdminDashboard';

const LandingPage = ({ onLogin }) => {
  const towns = [
    { name: "Naidupet", icon: "🏛️", students: 24, tutors: 8, detail: "Our flagship town with the most experienced tutor network." },
    { name: "Sullurupet", icon: "🌿", students: 18, tutors: 6, detail: "Rapidly growing hub with specialized CBSE coaching." },
    { name: "Nellore", icon: "📚", students: 12, tutors: 4, detail: "Expanding network with focus on AP State Board." },
    { name: "Tirupathi", icon: "🌱", students: 6, tutors: 2, detail: "Newest addition, growing fast with quality tutors." },
  ];
  const features = [
    { icon: "🎯", title: "Smart Matching", desc: "We pair students with tutors based on subject needs, location, and schedule compatibility." },
    { icon: "📊", title: "Progress Tracking", desc: "Admins and parents can monitor attendance, performance, and fee payments in real time." },
    { icon: "🏠", title: "Home Tuitions", desc: "All tutors provide doorstep service — no commute, more comfort, better learning." },
    { icon: "✅", title: "Verified Tutors", desc: "Every tutor goes through qualification verification before being assigned to students." },
    { icon: "💰", title: "Transparent Fees", desc: "Clear fee structures with monthly tracking. No hidden charges, ever." },
    { icon: "🌐", title: "Multi-Town Network", desc: "A unified system across 4 towns managed through a single platform." },
  ];

  return (
    <div className="landing">
      <Navbar onLogin={onLogin} />
      <section className="hero">
        <p className="hero-eyebrow">Home Tuition Network · Andhra Pradesh</p>
        <h1 className="hero-title">Quality Learning <em>at Your Doorstep</em></h1>
        <p className="hero-desc">Connecting students with verified, experienced home tutors across Naidupet, Sullurupet, Tirupathi, and Nellore.</p>
        <div className="hero-btns">
          <button className="btn btn-primary" onClick={onLogin}>Get Started →</button>
          <button className="btn" onClick={() => document.getElementById('towns')?.scrollIntoView({ behavior: 'smooth' })}>Our Towns</button>
        </div>
        <div className="hero-stats">
          <div className="hero-stat"><div className="hero-stat-num">60+</div><div className="hero-stat-label">Active Students</div></div>
          <div className="hero-stat"><div className="hero-stat-num">20+</div><div className="hero-stat-label">Verified Tutors</div></div>
          <div className="hero-stat"><div className="hero-stat-num">4</div><div className="hero-stat-label">Towns Covered</div></div>
          <div className="hero-stat"><div className="hero-stat-num">95%</div><div className="hero-stat-label">Parent Satisfaction</div></div>
        </div>
      </section>

      <div id="towns" className="section">
        <h2 className="section-title">Our Towns</h2>
        <p className="section-sub">Serving four towns with dedicated local admins and tutor networks.</p>
        <div className="town-cards">
          {towns.map(t => (
            <div key={t.name} className="town-card">
              <div className="town-icon">{t.icon}</div>
              <div className="town-name">{t.name}</div>
              <div className="town-detail" style={{ marginBottom: 12 }}>{t.detail}</div>
              <div className="flex gap-12">
                <span className="badge badge-accent">{t.students} Students</span>
                <span className="badge badge-gold">{t.tutors} Tutors</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div id="about" className="section">
        <h2 className="section-title">Why Choose ISM?</h2>
        <p className="section-sub">Everything you need for quality home education, in one place.</p>
        <div className="feature-grid">
          {features.map(f => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="footer-logo">ISM</div>
            <p className="footer-desc">Institute of Smart Mentorship</p>
            <p className="footer-subdesc">Connecting students with verified, experienced home tutors across Andhra Pradesh.</p>
          </div>
          
          <div>
            <div className="footer-title">Our Location</div>
            <div className="contact-item">
              <span className="contact-icon">📍</span>
              <div>
                <strong>Sri Preschool</strong>
                <br />Agraharapet, Naidupeta
                <br /><span style={{ color: 'var(--text3)' }}>(Near Sai Baba Temple)</span>
              </div>
            </div>
          </div>
          
          <div>
            <div className="footer-title">Contact Details</div>
            <div className="contact-person">
              <div className="contact-person-name">P. Sravan Kumar Reddy</div>
              <div className="contact-person-qual">M.Tech, B.Ed.</div>
              <div className="contact-person-cell">
                📞 <a href="tel:9952094001" style={{ color: 'var(--accent2)', textDecoration: 'none' }}>9952094001</a>
              </div>
            </div>
            
            <div className="contact-person" style={{ marginTop: 16 }}>
              <div className="contact-person-name">Dr. V.S. Mounika</div>
              <div className="contact-person-qual">B.A.M.S., M.Sc.(Psy), M.D.(Acu), B.Ed.</div>
              <div className="contact-person-cell">
                📞 <a href="tel:9014993862" style={{ color: 'var(--accent2)', textDecoration: 'none' }}>9014993862</a>
              </div>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          © 2026 ISM — Institute of Smart Mentorship · Andhra Pradesh. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

const LoginPage = ({ onLogin, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handle = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      });
      const data = await response.json();
      if (data.user) {
        onLogin(data.user);
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('Server error. Make sure backend is running.');
    }
  };

  return (
    <div className="login-wrap">
      <div style={{ width: '100%', maxWidth: 400 }}>
        <button className="btn btn-ghost btn-sm mb-16" onClick={onBack}>← Back</button>
        <div className="login-card">
          <div className="login-logo">ISM</div>
          <div className="login-sub">Institute of Smart Mentorship</div>
          {error && <div className="login-error">{error}</div>}
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handle()} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handle()} />
            </div>
            <button className="btn btn-primary w-full" onClick={handle}>Sign In →</button>
        </div>
      </div>
    </div>
  </div>
  );
};

const DashboardShell = ({ session, onLogout }) => {
  const { role } = session;
  const [page, setPage] = useState('dashboard');
  const [showForm, setShowForm] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const pageTitle = { dashboard: 'Dashboard', students: 'Students', tutors: 'Tutors', profile: 'Profile', matching: 'Smart Matching', fees: 'Fees', towns: 'Towns & Admins', earnings: 'Earnings', finance: 'Finance' };

  if (submitted) return (
    <div className="login-wrap">
      <div className="login-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
        <div className="login-logo" style={{ marginBottom: 8 }}>Registration Submitted!</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 24 }}>Your registration has been received. Our admin will contact you shortly.</div>
        {(role === 'student' || role === 'tutor') ? (
          <button className="btn btn-primary" onClick={onLogout}>Sign Out</button>
        ) : (
          <button className="btn btn-primary" onClick={() => setSubmitted(false)}>← Back to Dashboard</button>
        )}
      </div>
    </div>
  );

  if (role === 'student') return (
    <div className="login-wrap" style={{ alignItems: 'flex-start', paddingTop: 40 }}>
      <div style={{ width: '100%', maxWidth: 800 }}>
        <div className="flex-between mb-24">
          <div className="login-logo">ISM Student Portal</div>
          <button className="btn btn-ghost" onClick={onLogout}>Sign Out</button>
        </div>
        <div className="card">
          <StudentForm onDone={() => setSubmitted(true)} />
        </div>
      </div>
    </div>
  );

  if (role === 'tutor') return (
    <div className="login-wrap" style={{ alignItems: 'flex-start', paddingTop: 40 }}>
      <div style={{ width: '100%', maxWidth: 800 }}>
        <div className="flex-between mb-24">
          <div className="login-logo">ISM Tutor Portal</div>
          <button className="btn btn-ghost" onClick={onLogout}>Sign Out</button>
        </div>
        <div className="card">
          <TutorForm onDone={() => setSubmitted(true)} />
        </div>
      </div>
    </div>
  );

  if (showForm === 'student') return (
    <div className="dash-layout">
      <Sidebar role={role} active={page} setActive={setPage} user={session} onLogout={onLogout} />
      <div className="main">
        <div className="topbar"><div className="topbar-title">New Student Registration</div><button className="btn btn-sm" onClick={() => setShowForm(null)}>← Back</button></div>
        <div className="content"><StudentForm onDone={() => { setShowForm(null); setSubmitted(true); }} /></div>
      </div>
    </div>
  );
  if (showForm === 'tutor') return (
    <div className="dash-layout">
      <Sidebar role={role} active={page} setActive={setPage} user={session} onLogout={onLogout} />
      <div className="main">
        <div className="topbar"><div className="topbar-title">New Tutor Registration</div><button className="btn btn-sm" onClick={() => setShowForm(null)}>← Back</button></div>
        <div className="content"><TutorForm onDone={() => { setShowForm(null); setSubmitted(true); }} /></div>
      </div>
    </div>
  );

  return (
    <div className="dash-layout">
      <Sidebar role={role} active={page} setActive={setPage} user={session} onLogout={onLogout} />
      <div className="main">
        <div className="topbar">
          <div className="topbar-title">{pageTitle[page] || page}</div>
          <div className="topbar-right">
            {(role === 'admin' || role === 'globaladmin') && <>
              <button className="btn btn-sm" onClick={() => setShowForm('student')}>+ Student</button>
              <button className="btn btn-sm btn-primary" onClick={() => setShowForm('tutor')}>+ Tutor</button>
            </>}
            <div className={`avatar ${avatarColor(session.id || 'A')}`}>{initials(session.name || 'U')}</div>
          </div>
        </div>
        <div className="content">
          {role === 'admin' && <AdminDashboard user={session} page={page} />}
          {role === 'globaladmin' && <GlobalAdminDashboard page={page} />}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState('landing');
  const [session, setSession] = useState(null);

  const handleLogin = (user) => {
    setSession(user);
    setView('dashboard');
  };

  return (
    <div className="app">
      {view === 'landing' && <LandingPage onLogin={() => setView('login')} />}
      {view === 'login' && <LoginPage onLogin={handleLogin} onBack={() => setView('landing')} />}
      {view === 'dashboard' && session && <DashboardShell session={session} onLogout={() => { setSession(null); setView('landing'); }} />}
    </div>
  );
}
