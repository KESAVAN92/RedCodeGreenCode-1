import React from 'react';
import { Eye, Keyboard } from 'lucide-react';

const RoleSelectRound2 = ({
    teamData,
    selectRole,
    startRound2,
    setCurrentView,
    memberIdentifier,
    setMemberIdentifier
}) => {
    if (!memberIdentifier) {
        return (
            <div className="lobby-view squid-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/bg.png" className="hero-bg-image" alt="background" />
                <h2 className="pink-text" style={{ fontSize: '2.5rem', marginBottom: '3rem', zIndex: 10 }}>IDENTIFY_OPERATIVE_R2</h2>
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

    const currentRole = teamData?.round2Progress?.roleSelection?.[memberIdentifier];

    return (
        <div className="lobby-view squid-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/bg.png" className="hero-bg-image" alt="background" />

            <h2 className="pink-text" style={{ fontSize: '2.5rem', marginBottom: '1rem', zIndex: 10 }}>
                PROTOCOL_R2: {memberIdentifier?.toUpperCase()}
            </h2>
            <p style={{ color: '#888', marginBottom: '3rem', zIndex: 10 }}>SELECT YOUR ROLE FOR BLIND TRUST</p>

            <div className="role-cards" style={{ display: 'flex', gap: '2rem', zIndex: 10 }}>
                <div className="role-card"
                    onClick={() => selectRole('analyst')}
                    style={{
                        background: currentRole === 'analyst' ? 'rgba(255, 60, 60, 0.1)' : '#111',
                        border: currentRole === 'analyst' ? '2px solid var(--squid-pink)' : '2px solid #333',
                        padding: '3rem', width: '320px', textAlign: 'center', cursor: 'pointer',
                        transition: 'all 0.3s', borderRadius: '20px',
                        transform: currentRole === 'analyst' ? 'scale(1.05)' : 'scale(1)'
                    }}>
                    <Eye size={64} color="var(--squid-pink)" />
                    <h3 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>CODE ANALYST</h3>
                    <p style={{ fontSize: '0.7rem', color: '#666', marginBottom: '1rem' }}>ANALYZES LOGIC & PROVIDES INTEL</p>
                    {currentRole === 'analyst' && <p className="pink-text" style={{ fontSize: '0.8rem', marginTop: '1rem', fontWeight: 900 }}>ROLE_ASSIGNED</p>}
                </div>

                <div className="role-card"
                    onClick={() => {
                        selectRole('executor');
                        window.open('https://www.hackerrank.com', '_blank');
                    }}
                    style={{
                        background: currentRole === 'executor' ? 'rgba(255, 60, 60, 0.1)' : '#111',
                        border: currentRole === 'executor' ? '2px solid var(--squid-pink)' : '2px solid #333',
                        padding: '3rem', width: '320px', textAlign: 'center', cursor: 'pointer',
                        transition: 'all 0.3s', borderRadius: '20px',
                        transform: currentRole === 'executor' ? 'scale(1.05)' : 'scale(1)'
                    }}>
                    <Keyboard size={64} color="var(--squid-pink)" />
                    <h3 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>CODE EXECUTOR</h3>
                    <p style={{ fontSize: '0.7rem', color: '#666', marginBottom: '1rem' }}>EXECUTES CODE ON PLATFORM</p>
                    {currentRole === 'executor' && <p className="pink-text" style={{ fontSize: '0.8rem', marginTop: '1rem', fontWeight: 900 }}>ROLE_ASSIGNED</p>}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', zIndex: 10 }}>
                <button className="btn btn-secondary" onClick={() => setMemberIdentifier(null)} style={{ marginTop: '3rem', padding: '1rem 3rem', background: '#333', color: '#fff', fontWeight: 900 }}>CHANGE IDENTITY</button>
                <button className="btn btn-primary" onClick={startRound2} style={{ marginTop: '3rem', padding: '1rem 4rem', background: 'var(--squid-pink)', color: '#000', fontWeight: 900 }}>ENTER PORTAL</button>
            </div>
        </div>
    );
};

export default RoleSelectRound2;
