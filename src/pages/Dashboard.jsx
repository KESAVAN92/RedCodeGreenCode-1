import React from 'react';

const Dashboard = ({ setCurrentView }) => (
    <div className="dashboard-wrapper squid-container" style={{ minHeight: '100vh', padding: '6rem 2rem 2rem' }}>
        <img src="/bg.png" className="hero-bg-image" alt="background" />

        <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', textAlign: 'center', zIndex: 10 }}>
            <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '4rem', letterSpacing: '5px' }}>
                CHOOSE YOUR <span style={{ color: 'var(--squid-pink)' }}>FATE</span>
            </h2>

            <div className="rounds-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                {/* Round 1 Card */}
                <div className="round-card-large" style={{ background: 'rgba(20, 20, 20, 0.8)', border: '2px solid var(--squid-mint)', padding: '3rem', borderRadius: '20px', backdropFilter: 'blur(10px)', textAlign: 'left' }}>
                    <h3 style={{ color: 'var(--squid-mint)', fontSize: '2rem', marginBottom: '1.5rem' }}>ROUND 01: LOGIC ARENA</h3>
                    <p style={{ opacity: 0.8, fontSize: '1.2rem', lineHeight: '1.6', marginBottom: '2.5rem' }}>
                        Step into a high-stakes bomb defusal simulation. One player provides instructions while the other interacts with the circuitry. Cooperation is the only way to survive the countdown.
                    </p>
                    <button className="btn-squid" onClick={() => setCurrentView('role_select')} style={{ background: 'var(--squid-mint)', color: '#000' }}>
                        STEP INTO THE GAME
                    </button>
                </div>

                {/* Round 2 Card */}
                <div className="round-card-large" style={{ background: 'rgba(20, 20, 20, 0.8)', border: '2px solid var(--squid-pink)', padding: '3rem', borderRadius: '20px', backdropFilter: 'blur(10px)', textAlign: 'left', cursor: 'default' }}>
                    <h3 style={{ color: 'var(--squid-pink)', fontSize: '2rem', marginBottom: '1.5rem' }}>ROUND 02: BLIND TRUST</h3>
                    <p style={{ opacity: 0.8, fontSize: '1.2rem', lineHeight: '1.6', marginBottom: '2.5rem' }}>
                        The ultimate test of coding trust! Member 1 identifies the bugs and guides the fix, while Member 2 implements blindly on the keyboard. One has the sight, the other has the hand. Collaboration is the only way to survive.
                    </p>
                    <button className="btn-squid" onClick={() => setCurrentView('round2')} style={{ background: 'var(--squid-pink)', color: '#fff' }}>
                        ACCEPT THE INVITATION
                    </button>
                </div>
            </div>
        </div>
    </div>
);

export default Dashboard;
