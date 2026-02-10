import React from 'react';

const Index = ({ handleProceed }) => (
    <div className="squid-container">
        <img src="/bg.png" className="hero-bg-image" alt="background" />
        <div className="geometric-shapes" style={{ marginTop: '5rem', marginBottom: '2rem' }}>
            <div className="shape circle"></div>
            <div className="shape triangle"></div>
            <div className="shape square"></div>
        </div>
        <div style={{ textAlign: 'center', zIndex: 10, padding: '2rem' }}>
            

            <div className="ignita-title-container" style={{ marginBottom: '2rem', position: 'relative' }}>
                <h1 className="ignita-text glitch-effect" style={{
                    fontSize: '7rem',
                    fontWeight: 900,
                    margin: 0,
                    letterSpacing: '10px',
                    color: '#fff',
                    textTransform: 'uppercase',
                    position: 'relative',
                    display: 'inline-block'
                }}>
                    IGNITA '26
                </h1>
            </div>

            <h1 className="poster-main-title" style={{ fontSize: '5rem', fontWeight: 900, marginBottom: '0.5rem', lineHeight: 1 }}>
                <div style={{ color: '#ff3c3c' }}>RED CODE</div>
                <div style={{ color: '#00ff66' }}>GREEN CODE</div>
            </h1>

            <h4 style={{ fontSize: '1.8rem', color: 'var(--squid-pink)', letterSpacing: '8px', marginBottom: '3rem' }}>CODE DEBUGGING</h4>

            <button className="btn-squid btn-proceed" onClick={handleProceed} style={{ fontSize: '1.5rem', padding: '1.2rem 3rem' }}>PROCEED TO PLAY</button>
        </div>
    </div>
);

export default Index;
