import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bomb, Shield } from 'lucide-react';
import io from 'socket.io-client';
import './App.css';
import './NewStyles.css';

// Components & Pages
import Navbar from './components/Navbar';
import Index from './pages/Index';
import TeamIdentify from './pages/TeamIdentify';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import RoleSelect from './pages/RoleSelect';
import DefuserPage from './pages/DefuserPage';
import InstructorPage from './pages/InstructorPage';
import Round2Page from './pages/Round2Page';
import AdminDashboard from './pages/AdminDashboard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const socket = io(API_URL);

const App = () => {
  const [activeDashboard, setActiveDashboard] = useState(null); // 'user' or 'admin'
  const [isRedCode, setIsRedCode] = useState(false);
  const [teamData, setTeamData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentView, setCurrentView] = useState('landing');
  const [authStep, setAuthStep] = useState('initial');
  const [authTeamName, setAuthTeamName] = useState('');
  const [error, setError] = useState('');

  // Bomb State
  const [isBoxOpen, setIsBoxOpen] = useState(false);
  const [unscrewed, setUnscrewed] = useState([false, false, false, false]);

  const handleLogout = () => {
    localStorage.removeItem('rcgc_session');
    setActiveDashboard(null);
    setTeamData(null);
    setCurrentView('landing');
    setAuthStep('initial');
    setAuthTeamName('');
    setIsBoxOpen(false);
    setUnscrewed([false, false, false, false]);
  };

  const handleProceed = () => {
    setAuthStep('teamName');
    setError('');
  };

  const handleCheckTeam = async (e) => {
    e.preventDefault();
    const teamName = e.target.teamName.value;
    if (!teamName) return;

    try {
      const resp = await fetch(`${API_URL}/api/check-team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName })
      });
      const data = await resp.json();
      setAuthTeamName(teamName);
      if (data.isAdmin) {
        setAuthStep('adminPassword');
      } else if (data.exists) {
        setAuthStep('login');
      } else {
        setAuthStep('register');
      }
    } catch (err) { setError('Connection failed'); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const password = e.target.password.value;
    try {
      const resp = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName: authTeamName, password })
      });
      const data = await resp.json();
      if (data.success) {
        if (data.isAdmin) {
          setActiveDashboard('admin');
          const session = { type: 'admin', view: 'admin' };
          localStorage.setItem('rcgc_session', JSON.stringify(session));
        } else {
          setActiveDashboard('user');
          const tData = { ...data.player, teamId: data.player._id, round1: data.player.round1Progress };
          setTeamData(tData);
          socket.emit('joinTeam', tData.teamId);
          setCurrentView('dashboard');
          const session = { type: 'user', teamData: tData, view: 'dashboard' };
          localStorage.setItem('rcgc_session', JSON.stringify(session));
        }
        setAuthStep('initial');
      } else {
        setError('Invalid Password');
      }
    } catch (err) { setError('Login failed'); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const formData = {
      teamName: authTeamName,
      password: e.target.password.value,
      m1Name: e.target.m1Name.value,
      m1Reg: e.target.m1Reg.value,
      m1Email: e.target.m1Email.value,
      m2Name: e.target.m2Name.value,
      m2Reg: e.target.m2Reg.value,
      m2Email: e.target.m2Email.value,
    };

    try {
      const resp = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (resp.ok) {
        const data = await resp.json();
        setActiveDashboard('user');
        const tData = { ...data.player, teamId: data.player._id, round1: data.player.round1Progress };
        setTeamData(tData);
        socket.emit('joinTeam', tData.teamId);
        setCurrentView('dashboard');
        const session = { type: 'user', teamData: tData, view: 'dashboard' };
        localStorage.setItem('rcgc_session', JSON.stringify(session));
        setAuthStep('initial');
      } else {
        const data = await resp.json();
        setError(data.error || 'Registration failed');
      }
    } catch (err) { setError('Registration failed'); }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`${API_URL}/api/leaderboard`);
      const data = await response.json();
      setLeaderboard(data);
    } catch (err) { console.error(err); }
  };

  const selectRole = (role) => {
    if (!teamData) return;
    const teamId = teamData.teamId || teamData._id;
    socket.emit('selectRole', { teamId, memberIndex: 0, role });
  };

  const startRound1 = () => {
    if (!teamData) return;
    const teamId = teamData.teamId || teamData._id;
    socket.emit('startRound1', teamId);
    setCurrentView('round1');
  };

  const selectModule = (index) => {
    if (!teamData) return;
    const teamId = teamData.teamId || teamData._id;
    socket.emit('selectModule', { teamId, moduleIndex: index });
  };

  const submitPuzzleResult = (success, index = null) => {
    if (!teamData) return;
    const teamId = teamData.teamId || teamData._id;
    const finalIndex = index !== null ? index : teamData.round1.selectedModuleIndex;
    socket.emit('submitPuzzle', {
      teamId,
      puzzleIndex: finalIndex,
      success
    });
  };

  const handleScrewClick = (index) => {
    const newUnscrewed = [...unscrewed];
    newUnscrewed[index] = true;
    setUnscrewed(newUnscrewed);
    if (newUnscrewed.every(v => v === true)) setTimeout(() => setIsBoxOpen(true), 1000);
  };

  useEffect(() => {
    const saved = localStorage.getItem('rcgc_session');
    if (saved) {
      const session = JSON.parse(saved);
      if (session.type === 'admin') {
        setActiveDashboard('admin');
        setCurrentView('admin');
      } else {
        setActiveDashboard('user');
        setTeamData(session.teamData);
        setCurrentView(session.view || 'dashboard');
        socket.emit('joinTeam', session.teamData.teamId);
      }
    }
  }, []);

  useEffect(() => {
    if (activeDashboard) {
      const session = {
        type: activeDashboard,
        teamData,
        view: currentView
      };
      localStorage.setItem('rcgc_session', JSON.stringify(session));
    }
  }, [currentView, teamData, activeDashboard]);

  useEffect(() => {
    socket.on('gameUpdate', (state) => {
      setIsRedCode(state.status === 'RED');
    });
    socket.on('teamUpdate', (data) => {
      setTeamData({ ...data, teamId: data._id, round1: data.round1Progress });
    });
    socket.on('adminLeaderboardUpdate', () => fetchLeaderboard());
    return () => {
      socket.off('gameUpdate');
      socket.off('teamUpdate');
      socket.off('adminLeaderboardUpdate');
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  return (
    <>
      <Navbar activeDashboard={activeDashboard} authStep={authStep} onLogout={handleLogout} />

      {/* AUTH FLOW */}
      {!activeDashboard && (
        <>
          {authStep === 'initial' && <Index handleProceed={handleProceed} />}
          {authStep === 'teamName' && <TeamIdentify handleCheckTeam={handleCheckTeam} error={error} />}
          {(authStep === 'login' || authStep === 'adminPassword') && (
            <LoginPage
              handleLogin={handleLogin}
              authTeamName={authTeamName}
              error={error}
              setAuthStep={setAuthStep}
              authStep={authStep}
            />
          )}
          {authStep === 'register' && (
            <RegisterPage
              handleRegister={handleRegister}
              authTeamName={authTeamName}
              error={error}
              setAuthStep={setAuthStep}
            />
          )}
        </>
      )}

      {/* USER DASHBOARD & GAMES */}
      {activeDashboard === 'user' && (
        <>
          {currentView === 'dashboard' && <Dashboard setCurrentView={setCurrentView} />}
          {currentView === 'role_select' && (
            <RoleSelect
              activeDashboard={activeDashboard}
              authStep={authStep}
              handleLogout={handleLogout}
              teamData={teamData}
              selectRole={selectRole}
              startRound1={startRound1}
              setCurrentView={setCurrentView}
            />
          )}
          {currentView === 'round1' && (
            <>
              {teamData?.round1?.roleSelection?.member1 === 'defuser' ? (
                <DefuserPage
                  teamData={teamData}
                  isBoxOpen={isBoxOpen}
                  unscrewed={unscrewed}
                  handleScrewClick={handleScrewClick}
                  setCurrentView={setCurrentView}
                  submitPuzzleResult={submitPuzzleResult}
                  selectModule={selectModule}
                  isRedCode={isRedCode}
                />
              ) : (
                <InstructorPage
                  teamData={teamData}
                  setCurrentView={setCurrentView}
                  selectModule={selectModule}
                  isRedCode={isRedCode}
                />
              )}
            </>
          )}
          {currentView === 'round2' && (
            <Round2Page
              activeDashboard={activeDashboard}
              authStep={authStep}
              handleLogout={handleLogout}
              setCurrentView={setCurrentView}
            />
          )}
        </>
      )}

      {/* ADMIN DASHBOARD */}
      {activeDashboard === 'admin' && (
        <AdminDashboard
          activeDashboard={activeDashboard}
          authStep={authStep}
          handleLogout={handleLogout}
          socket={socket}
          isRedCode={isRedCode}
        />
      )}
    </>
  );
};

export default App;


