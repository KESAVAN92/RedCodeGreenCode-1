import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bomb, Shield, Lock } from 'lucide-react';
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
import RoleSelectRound2 from './pages/RoleSelectRound2';
import CodeAnalystPage from './pages/CodeAnalystPage';
import DefuserPage from './pages/DefuserPage';
import InstructorPage from './pages/InstructorPage';
import Round2Page from './pages/Round2Page';
import AdminDashboard from './pages/AdminDashboard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const socket = io(API_URL);

const App = () => {
  const [activeDashboard, setActiveDashboard] = useState(null); // 'user' or 'admin'
  const [isRedCode, setIsRedCode] = useState(false);
  const [gameState, setGameState] = useState({
    status: 'GREEN',
    round1: { isStarted: false, isPaused: false },
    round2: { isStarted: false, isPaused: false }
  });
  const [teamData, setTeamData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentView, setCurrentView] = useState('landing');
  const [authStep, setAuthStep] = useState('initial');
  const [authTeamName, setAuthTeamName] = useState('');
  const [memberIdentifier, setMemberIdentifier] = useState(null); // 'member1' or 'member2'
  const [error, setError] = useState('');

  // Bomb State
  const [isBoxOpen, setIsBoxOpen] = useState(false);
  const [unscrewed, setUnscrewed] = useState([false, false, false, false]);

  const handleLogout = () => {
    sessionStorage.removeItem('rcgc_session');
    setActiveDashboard(null);
    setTeamData(null);
    setCurrentView('landing');
    setAuthStep('initial');
    setMemberIdentifier(null);
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
          sessionStorage.setItem('rcgc_session', JSON.stringify(session));
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
        sessionStorage.setItem('rcgc_session', JSON.stringify(session));
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
    if (!teamData || !memberIdentifier) return;
    const teamId = teamData.teamId || teamData._id;
    socket.emit('selectRole', { teamId, memberIdentifier, role });

    // Optimistic Update to prevent latency flicker
    setTeamData(prev => {
      const clone = { ...prev };
      if (!clone.round1) clone.round1 = {};
      if (!clone.round1.roleSelection) clone.round1.roleSelection = {};
      clone.round1.roleSelection[memberIdentifier] = role;
      return clone;
    });

    setCurrentView('round1');
  };

  const selectRoleRound2 = (role) => {
    if (!teamData || !memberIdentifier) return;
    const teamId = teamData.teamId || teamData._id;
    socket.emit('selectRoleRound2', { teamId, memberIdentifier, role });
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
    fetchLeaderboard();
    const saved = sessionStorage.getItem('rcgc_session');
    if (saved) {
      const session = JSON.parse(saved);
      if (session.type === 'admin') {
        setActiveDashboard('admin');
        setCurrentView('admin');
      } else {
        setActiveDashboard('user');
        setTeamData(session.teamData);
        setMemberIdentifier(session.memberIdentifier);
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
        view: currentView,
        memberIdentifier
      };
      sessionStorage.setItem('rcgc_session', JSON.stringify(session));
    }
  }, [currentView, teamData, activeDashboard, memberIdentifier]);

  useEffect(() => {
    socket.on('gameUpdate', (state) => {
      setGameState(state);
      setIsRedCode(state.status === 'RED');
    });
    socket.on('teamUpdate', (data) => {
      setTeamData(prev => {
        const newData = { ...data, teamId: data._id, round1: data.round1Progress };

        // Force reset box visuals if the mission start time has changed (Resume or Restart)
        // or if we are currently closed and the server says we've solved something
        const isTimeShift = newData.round1.startTime !== prev?.round1?.startTime;
        const anySolved = newData.round1.puzzles.some(p => p.solved);

        if (anySolved) {
          setIsBoxOpen(true);
        } else if (isTimeShift && newData.round1.status === 'active') {
          setIsBoxOpen(false);
          setUnscrewed([false, false, false, false]);
        }

        return newData;
      });
    });
    socket.on('adminLeaderboardUpdate', (data) => {
      setLeaderboard(data);
    });
    return () => {
      socket.off('gameUpdate');
      socket.off('teamUpdate');
      socket.off('adminLeaderboardUpdate');
    };
  }, []);



  return (
    <>
      {/* HIDE NAVBAR ON INDEX PAGE (authStep === 'initial') */}
      {(!(!activeDashboard && authStep === 'initial')) && (
        <Navbar activeDashboard={activeDashboard} authStep={authStep} onLogout={handleLogout} />
      )}

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
        <div className={`player-workspace ${isRedCode ? 'red-code-active' : ''} ${((currentView === 'round1' && gameState.round1.isPaused) || (currentView === 'round2' && gameState.round2.isPaused)) ? 'game-paused-active' : ''}`}>
          {/* RED LIGHT OVERLAY */}
          {isRedCode && (
            <div className="red-overlay">
              <div className="red-content">
                <div className="red-pulse-bg"></div>
                <h1 className="red-warning-text">RED_LIGHT: MOTION_STOPPED</h1>
                <p>Mission is currently under red-code lockdown. Wait for Green Signal.</p>
                <div className="glitch-scanner"></div>
              </div>
            </div>
          )}

          {/* PAUSE OVERLAY */}
          {((currentView === 'round1' && gameState.round1.isPaused) || (currentView === 'round2' && gameState.round2.isPaused)) && (
            <div className="pause-overlay">
              <div className="pause-content">
                <Lock size={64} className="pause-icon" />
                <h1>MISSION_PAUSED</h1>
                <p>THE GAME HAS BEEN PAUSED BY THE ADMINISTRATOR.</p>
                <p style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '1rem' }}>Stand by for mission resumption.</p>
              </div>
            </div>
          )}

          {currentView === 'dashboard' && <Dashboard setCurrentView={setCurrentView} gameState={gameState} />}
          {currentView === 'role_select' && (
            <RoleSelect
              activeDashboard={activeDashboard}
              authStep={authStep}
              handleLogout={handleLogout}
              teamData={teamData}
              selectRole={selectRole}
              startRound1={startRound1}
              setCurrentView={setCurrentView}
              gameState={gameState}
              memberIdentifier={memberIdentifier}
              setMemberIdentifier={setMemberIdentifier}
            />
          )}

          {currentView === 'role_select_r2' && (
            <RoleSelectRound2
              teamData={teamData}
              selectRole={selectRoleRound2}
              startRound2={() => setCurrentView('round2')}
              setCurrentView={setCurrentView}
              memberIdentifier={memberIdentifier}
              setMemberIdentifier={setMemberIdentifier}
            />
          )}

          {currentView === 'round1' && (
            <>
              {teamData?.round1?.roleSelection?.[memberIdentifier] === 'defuser' ? (
                <DefuserPage
                  teamData={teamData}
                  isBoxOpen={isBoxOpen}
                  unscrewed={unscrewed}
                  handleScrewClick={handleScrewClick}
                  setCurrentView={setCurrentView}
                  submitPuzzleResult={submitPuzzleResult}
                  selectModule={selectModule}
                  isRedCode={isRedCode}
                  gameState={gameState}
                  leaderboard={leaderboard}
                />
              ) : (
                <InstructorPage
                  teamData={teamData}
                  setCurrentView={setCurrentView}
                  selectModule={selectModule}
                  isRedCode={isRedCode}
                  gameState={gameState}
                  leaderboard={leaderboard}
                />
              )}
            </>
          )}
          {currentView === 'round2' && (
            <>
              {teamData?.round2Progress?.roleSelection?.[memberIdentifier] === 'analyst' ? (
                <CodeAnalystPage
                  teamData={teamData}
                  setCurrentView={setCurrentView}
                />
              ) : teamData?.round2Progress?.roleSelection?.[memberIdentifier] === 'executor' ? (
                <div className="squid-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="/bg.png" className="hero-bg-image" alt="background" />
                  <h1 className="pink-text" style={{ fontSize: '3rem', marginBottom: '2rem' }}>CODE EXECUTOR ACTIVE</h1>
                  <p style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Proceed to the HackerRank platform to execute code.</p>
                  <button className="btn-squid" onClick={() => window.open('https://www.hackerrank.com', '_blank')}>OPEN PLATFORM AGAIN</button>
                  <button className="btn-squid-secondary" onClick={() => setCurrentView('role_select_r2')} style={{ marginTop: '2rem' }}>CHANGE ROLE</button>
                </div>
              ) : (
                /* Fallback to old portal if needed or just show the new logic */
                <Round2Page
                  teamData={teamData}
                  socket={socket}
                  memberIdentifier={memberIdentifier}
                  setCurrentView={setCurrentView}
                  gameState={gameState}
                  leaderboard={leaderboard}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* ADMIN DASHBOARD */}
      {activeDashboard === 'admin' && (
        <AdminDashboard
          activeDashboard={activeDashboard}
          authStep={authStep}
          handleLogout={handleLogout}
          socket={socket}
          isRedCode={isRedCode}
          gameState={gameState}
        />
      )}
    </>
  );
};

export default App;


