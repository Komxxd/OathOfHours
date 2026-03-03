import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { authClient } from './auth';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import './App.css';

export default function App() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authClient.getSession().then((result) => {
      if (result.data?.session && result.data?.user) {
        setSession(result.data.session);
        setUser(result.data.user);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] souls-bg">
        <div className="flex flex-col items-center gap-6 relative z-10">
          <div className="w-4 h-4 rounded-full bg-[#fdf5d3] shadow-[0_0_20px_5px_rgba(203,170,100,0.6)] animate-pulse" />
          <p className="text-[#a89f91] font-souls text-lg tracking-[0.2em] uppercase animate-pulse">Summoning...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/auth"
            element={session ? <Navigate to="/dashboard" /> : <AuthPage setSession={setSession} setUser={setUser} />}
          />
          <Route
            path="/dashboard"
            element={session ? <Dashboard user={user} session={session} /> : <Navigate to="/auth" />}
          />
        </Routes>
      </main>

    </Router>
  );
}
