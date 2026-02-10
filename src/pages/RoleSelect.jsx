import React from 'react';
import { Bomb, Shield } from 'lucide-react';

const RoleSelect = ({
    teamData,
    selectRole,
    startRound1,
    setCurrentView,
    memberIdentifier,
    setMemberIdentifier
}) => {
    if (!memberIdentifier) {
        return (
            <div className="lobby-view squid-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/bg.png" className="hero-bg-image" alt="background" />
                <h2 className="pink-text" style={{ fontSize: '2.5rem', marginBottom: '3rem', zIndex: 10 }}>IDENTIFY_OPERATIVE</h2>
                <div className="role-cards" style={{ display: 'flex', gap: '2rem', zIndex: 10 }}>
                    <div className="role-card"
                        onClick={() => setMemberIdentifier('member1')}
                        style={{ background: '#111', border: '2px solid #333', padding: '3rem', width: '320px', textAlign: 'center', cursor: 'pointer', borderRadius: '20px' }}>
                        <h1>01</h1>
                        <h3>{teamData?.member1?.name}</h3>
                        <p style={{ color: '#666' }}>LEAD OPERATIVE</p>
                    </div>
                    <div className="role-card"
                        onClick={() => setMemberIdentifier('member2')}
                        style={{ background: '#111', border: '2px solid #333', padding: '3rem', width: '320px', textAlign: 'center', cursor: 'pointer', borderRadius: '20px' }}>
                        <h1>02</h1>
                        <h3>{teamData?.member2?.name}</h3>
                        <p style={{ color: '#666' }}>SUPPORT OPERATIVE</p>
                    </div>
                </div>
                <button className="btn btn-secondary" onClick={() => setCurrentView('dashboard')} style={{ marginTop: '3rem', padding: '1rem 3rem', background: '#333', color: '#fff', fontWeight: 900, zIndex: 10 }}>GO BACK</button>
            </div>
        );
    }

    const currentRole = teamData?.round1?.roleSelection?.[memberIdentifier];

    return (
        <div className="lobby-view squid-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/bg.png" className="hero-bg-image" alt="background" />

            <h2 className="green-text" style={{ fontSize: '2.5rem', marginBottom: '1rem', zIndex: 10 }}>
                MISSION_READY: {memberIdentifier?.toUpperCase()}
            </h2>
            <p style={{ color: '#888', marginBottom: '3rem', zIndex: 10 }}>SELECT YOUR ROLE FOR THE ARENA</p>

            <div className="role-cards" style={{ display: 'flex', gap: '2rem', zIndex: 10 }}>
                <div className="role-card"
                    onClick={() => selectRole('defuser')}
                    style={{
                        background: currentRole === 'defuser' ? 'rgba(0, 255, 102, 0.1)' : '#111',
                        border: currentRole === 'defuser' ? '2px solid #00ff66' : '2px solid #333',
                        padding: '3rem', width: '320px', textAlign: 'center', cursor: 'pointer',
                        transition: 'all 0.3s', borderRadius: '20px',
                        transform: currentRole === 'defuser' ? 'scale(1.05)' : 'scale(1)'
                    }}>
                    <Bomb size={64} color="#00ff66" />
                    <h3 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>BOMB_DEFUSER</h3>
                    <p style={{ fontSize: '0.7rem', color: '#666', marginBottom: '1rem' }}>SITS AT THE BOMB CHASSIS</p>
                    {currentRole === 'defuser' && <p className="green-text" style={{ fontSize: '0.8rem', marginTop: '1rem', fontWeight: 900 }}>ROLE_ASSIGNED</p>}
                </div>

                <div className="role-card"
                    onClick={() => selectRole('giver')}
                    style={{
                        background: currentRole === 'giver' ? 'rgba(0, 255, 102, 0.1)' : '#111',
                        border: currentRole === 'giver' ? '2px solid #00ff66' : '2px solid #333',
                        padding: '3rem', width: '320px', textAlign: 'center', cursor: 'pointer',
                        transition: 'all 0.3s', borderRadius: '20px',
                        transform: currentRole === 'giver' ? 'scale(1.05)' : 'scale(1)'
                    }}>
                    <Shield size={64} color="#00ff66" />
                    <h3 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>INSTRUCTION_GIVER</h3>
                    <p style={{ fontSize: '0.7rem', color: '#666', marginBottom: '1rem' }}>PROVIDES INTEL FROM MANUAL</p>
                    {currentRole === 'giver' && <p className="green-text" style={{ fontSize: '0.8rem', marginTop: '1rem', fontWeight: 900 }}>ROLE_ASSIGNED</p>}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', zIndex: 10 }}>
                <button className="btn btn-secondary" onClick={() => setMemberIdentifier(null)} style={{ marginTop: '3rem', padding: '1rem 3rem', background: '#333', color: '#fff', fontWeight: 900 }}>CHANGE IDENTITY</button>
                <button className="btn btn-primary" onClick={startRound1} style={{ marginTop: '3rem', padding: '1rem 4rem', background: '#00ff66', color: '#000', fontWeight: 900 }}>START MISSION</button>
            </div>
        </div>
    );
};

export default RoleSelect;
