import React, { useState, useEffect } from 'react';

const AdminDashboard = ({ socket, isRedCode, handleLogout }) => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [view, setView] = useState('round1'); // 'round1', 'round2', 'users'

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/leaderboard');
                const data = await res.json();
                setLeaderboard(data);
            } catch (err) { console.error(err); }
        };
        fetchLeaderboard();

        socket.on('adminLeaderboardUpdate', fetchLeaderboard);
        return () => socket.off('adminLeaderboardUpdate', fetchLeaderboard);
    }, [socket]);

    const handleReset = (teamId) => {
        if (window.confirm('Reset this team\'s bomb?')) {
            socket.emit('adminResetTeam', teamId);
        }
    };

    const toggleGameLight = () => {
        socket.emit('toggleRedLight', { status: isRedCode ? 'GREEN' : 'RED' });
    };

    return (
        <div className="admin-view" style={{ minHeight: '100vh', background: '#000' }}>
            {/* STICKY HEADER */}
            <header className="admin-header">
                <div className="admin-brand">
                    <h1 className="red-text" style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900 }}>ADMIN_CORE</h1>
                </div>

                <nav className="admin-nav">
                    <button
                        className={`admin-nav-btn ${view === 'round1' ? 'active' : ''}`}
                        onClick={() => setView('round1')}
                    >
                        MONITOR_ROUND_1
                    </button>
                    <button
                        className={`admin-nav-btn ${view === 'round2' ? 'active' : ''}`}
                        onClick={() => setView('round2')}
                    >
                        MONITOR_ROUND_2
                    </button>
                    <button
                        className={`admin-nav-btn ${view === 'users' ? 'active' : ''}`}
                        onClick={() => setView('users')}
                    >
                        TEAM_DETAILS
                    </button>
                </nav>

                <div className="admin-actions" style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className={`red-green-toggle ${isRedCode ? 'green' : 'red'}`}
                        onClick={toggleGameLight}
                    >
                        {isRedCode ? 'SWITCH_TO_GREEN' : 'ACTIVATE_RED_CODE'}
                    </button>
                    <button
                        className="admin-nav-btn logout-btn"
                        onClick={() => {
                            if (window.confirm("Logout from Administrative panel?")) {
                                handleLogout();
                            }
                        }}
                        style={{ borderColor: '#ff3c3c', color: '#ff3c3c' }}
                    >
                        LOGOUT
                    </button>
                </div>
            </header>

            <main className="admin-page-content">
                <img src="/bg.png" className="hero-bg-image" alt="background" style={{ opacity: 0.1 }} />

                {view === 'round1' && (
                    <div className="round-view">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ color: '#fff', fontSize: '2rem' }}>SQUAD_STATUS [ROUND_1]</h2>
                            <button className="squid-btn-small" onClick={() => socket.emit('adminStartEvent')}>START_EVENT_NOW</button>
                        </div>
                        <div className="team-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
                            {leaderboard.map(team => (
                                <div key={team._id} style={{
                                    background: '#111', padding: '1.5rem', borderRadius: '12px', border: '1px solid #222',
                                    borderLeft: `5px solid ${team.round1Progress?.status === 'exploded' ? '#ff3c3c' : (team.round1Progress?.status === 'completed' ? '#00ff66' : '#555')}`
                                }}>
                                    <h3 style={{ margin: 0, color: '#fff' }}>{team.teamName}</h3>
                                    <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.9rem' }}>
                                        <div style={{ color: '#666' }}>STATUS: <span style={{ color: '#fff' }}>{team.round1Progress?.status?.toUpperCase()}</span></div>
                                        <div style={{ color: '#666' }}>LIVES: <span style={{ color: team.round1Progress?.lives === 0 ? '#ff3c3c' : '#fff' }}>{team.round1Progress?.lives}/3</span></div>
                                        <div style={{ color: '#666' }}>PROGRESS: <span style={{ color: '#fff' }}>{team.round1Progress?.puzzles?.filter(p => p.solved).length}/3 Solved</span></div>
                                        <div style={{ color: '#666' }}>SCORE: <span style={{ color: 'var(--squid-mint)' }}>{team.score || 0}</span></div>
                                    </div>
                                    <button
                                        onClick={() => handleReset(team.teamName)}
                                        style={{ marginTop: '1.5rem', width: '100%', padding: '0.5rem', background: 'transparent', border: '1px solid #ff3c3c', color: '#ff3c3c', fontWeight: 800, cursor: 'pointer' }}
                                    >
                                        RESET_TEAM_BOMB
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {view === 'round2' && (
                    <div className="round-view">
                        <h2 style={{ color: '#fff', fontSize: '2rem', marginBottom: '2rem' }}>SQUAD_STATUS [ROUND_2]</h2>
                        <div className="team-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '1.5rem' }}>
                            {leaderboard.map(team => (
                                <div key={team._id} style={{
                                    background: '#0a0a0a', padding: '1.5rem', borderRadius: '12px', border: '1px solid #222',
                                    borderLeft: `5px solid ${team.round2Progress?.status === 'completed' ? '#00ff66' : '#555'}`
                                }}>
                                    <h3 style={{ margin: 0, color: 'var(--squid-pink)' }}>{team.teamName}</h3>
                                    <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <div style={{ background: '#111', padding: '10px', borderRadius: '4px' }}>
                                            <span style={{ fontSize: '0.7rem', color: '#666', display: 'block' }}>DEBUGGING_ACCURACY</span>
                                            <span style={{ fontSize: '1.2rem', fontWeight: 900 }}>{team.round2Progress?.problems?.filter(p => p.solved).length * 10 || 0}/30</span>
                                        </div>
                                        <div style={{ background: '#111', padding: '10px', borderRadius: '4px' }}>
                                            <span style={{ fontSize: '0.7rem', color: '#666', display: 'block' }}>MANUAL_BONUS</span>
                                            <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--squid-mint)' }}>{team.round2ManualScore || 0}/20</span>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '1.5rem', borderTop: '1px solid #222', paddingTop: '1rem' }}>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ fontSize: '0.8rem', color: '#888' }}>Bug Identification (0-10)</label>
                                            <input
                                                type="range" min="0" max="10"
                                                defaultValue={team.round2Marks?.bugId || 0}
                                                style={{ width: '100%', accentColor: 'var(--squid-pink)' }}
                                                onMouseUp={(e) => socket.emit('awardRound2Marks', { teamId: team._id, type: 'bugId', value: parseInt(e.target.value) })}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.8rem', color: '#888' }}>Coordination & Rules (0-10)</label>
                                            <input
                                                type="range" min="0" max="10"
                                                defaultValue={team.round2Marks?.coord || 0}
                                                style={{ width: '100%', accentColor: 'var(--squid-mint)' }}
                                                onMouseUp={(e) => socket.emit('awardRound2Marks', { teamId: team._id, type: 'coord', value: parseInt(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {view === 'users' && (
                    <div className="user-view">
                        <h2 style={{ color: '#fff', fontSize: '2rem', marginBottom: '2rem' }}>REGISTERED_TEAMS_DATA</h2>
                        <table className="team-details-table">
                            <thead>
                                <tr>
                                    <th>TEAM_NAME</th>
                                    <th>MEMBER_1</th>
                                    <th>MEMBER_2</th>
                                    <th>TOTAL_SCORE</th>
                                    <th>ROUND_1_TIME</th>
                                    <th>REG_DATE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboard.map(team => (
                                    <tr key={team._id}>
                                        <td style={{ fontWeight: 900 }}>{team.teamName}</td>
                                        <td>
                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>{team.member1?.name}</div>
                                            <div style={{ fontSize: '0.7rem' }}>{team.member1?.regNo}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>{team.member2?.name}</div>
                                            <div style={{ fontSize: '0.7rem' }}>{team.member2?.regNo}</div>
                                        </td>
                                        <td><span className="score-badge">{team.score || 0}</span></td>
                                        <td>{team.round1Progress?.startTime ? new Date(team.round1Progress.startTime).toLocaleTimeString() : 'N/A'}</td>
                                        <td style={{ fontSize: '0.8rem', color: '#444' }}>{new Date(team.registrationTime).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
