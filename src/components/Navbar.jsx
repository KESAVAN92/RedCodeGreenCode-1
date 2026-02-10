import React from 'react';

const Navbar = ({ activeDashboard, authStep, onLogout }) => (
    <nav className="navbar" style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 1000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255, 75, 145, 0.2)' }}>
        <div className="container nav-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem' }}>
            <div className="logo" style={{ color: 'var(--squid-pink)', fontWeight: 900, fontSize: '1.5rem', letterSpacing: '2px' }}>
                IGNITA <span style={{ color: '#fff' }}>'26</span> <span style={{ fontSize: '1rem', marginLeft: '10px', opacity: 0.8 }}>RED CODE GREEN CODE</span>
            </div>
            <div className="nav-links">
                {(activeDashboard || authStep !== 'initial') && (
                    <button className="cta-small" onClick={onLogout} style={{ background: 'var(--squid-pink)', border: 'none', color: '#fff', padding: '0.5rem 1.5rem', borderRadius: '4px', fontWeight: 800 }}>
                        {activeDashboard ? 'LOGOUT' : 'EXIT'}
                    </button>
                )}
            </div>
        </div>
    </nav>
);

export default Navbar;
