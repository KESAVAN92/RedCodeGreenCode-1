import React from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AdminDashboard = ({ socket, isRedCode }) => {
    const [leaderboard, setLeaderboard] = React.useState([]);

    React.useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await fetch(`${API_URL}/api/leaderboard`);
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

    return (
        <div className="admin-view squid-container" style={{ minHeight: '100vh', padding: '5rem' }}>
            <img src="/bg.png" className="hero-bg-image" alt="background" />
            <div style={{ zIndex: 10, width: '100%' }}>
                <h1 className="red-text" style={{ fontSize: '3rem', fontWeight: 900 }}>ADMIN_CORE</h1>
                <div className="global-controls" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem', marginTop: '3rem' }}>
                    <div className="control-card" style={{ background: '#111', padding: '2rem', border: '1px solid #333', borderRadius: '12px' }}>
                        <h3 style={{ marginBottom: '1.5rem', opacity: 0.8 }}>GLOBAL_LIGHTS_CONTROL</h3>
                        <button
                            onClick={() => socket.emit('toggleRedLight', { status: isRedCode ? 'GREEN' : 'RED' })}
                            style={{
                                width: '100%',
                                padding: '1.5rem',
                                background: isRedCode ? '#00ff66' : '#ff3c3c',
                                color: '#000',
                                fontWeight: 900,
                                fontSize: '1.2rem',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: 'pointer'
                            }}>
                            {isRedCode ? 'SWITCH_TO_GREEN' : 'ACTIVATE_RED_CODE'}
                        </button>
                    </div>

                    <div className="control-card" style={{ background: '#111', padding: '2rem', border: '1px solid #333', borderRadius: '12px' }}>
                        <h3 style={{ marginBottom: '1.5rem', opacity: 0.8 }}>EVENT_CONTROL</h3>
                        <button
                            onClick={() => socket.emit('adminStartEvent')}
                            style={{
                                width: '100%',
                                padding: '1.5rem',
                                background: '#00ff66',
                                color: '#000',
                                fontWeight: 900,
                                fontSize: '1.2rem',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: 'pointer'
                            }}>
                            START_EVENT_NOW
                        </button>
                    </div>

                    <div className="control-card" style={{ background: '#111', padding: '2rem', border: '1px solid #333', borderRadius: '12px', opacity: 0.5 }}>
                        <h3 style={{ marginBottom: '1.5rem', opacity: 0.8 }}>BROADCAST_MESSAGE</h3>
                        <input className="squid-input" placeholder="UNDER_MAINTENANCE" disabled style={{ background: '#050505' }} />
                    </div>
                </div>

                <div className="leaderboard-section" style={{ marginTop: '4rem' }}>
                    <h2 style={{ color: '#fff', marginBottom: '2rem' }}>LIVE_SQUAD_STATUS</h2>
                    <div className="team-list" style={{ display: 'grid', gap: '1rem' }}>
                        {leaderboard.map(team => (
                            <div key={team._id || team.teamName} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                background: '#1a1a1a', padding: '1.5rem', borderRadius: '8px', borderLeft: `5px solid ${team.round1Progress?.status === 'exploded' ? '#ff3c3c' : '#00ff66'}`
                            }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{team.teamName}</h3>
                                    <p style={{ margin: '0.5rem 0 0', color: '#666' }}>
                                        STATUS: <span style={{ color: '#fff' }}>{team.round1Progress?.status.toUpperCase()}</span> |
                                        PUZZLE: {team.round1Progress?.currentPuzzle + 1}/3 |
                                        LIVES: {team.round1Progress?.lives}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleReset(team.teamName)}
                                    style={{
                                        background: 'transparent', border: '1px solid #ff3c3c', color: '#ff3c3c',
                                        padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 800
                                    }}>
                                    RESET_BOMB
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
