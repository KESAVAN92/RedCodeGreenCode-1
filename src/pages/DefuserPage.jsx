import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdvancedWirePuzzle, SymbolPuzzle, GridNumberPuzzle, MorseSymbolPuzzle, MemoryPuzzle } from '../components/Round1Puzzles';
import { Heart, HeartOff } from 'lucide-react';
import LeaderboardBoard from '../components/LeaderboardBoard';

const DefuserPage = ({
    teamData,
    isBoxOpen,
    unscrewed,
    handleScrewClick,
    setCurrentView,
    submitPuzzleResult,
    selectModule,
    isRedCode,
    gameState,
    leaderboard
}) => {
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes default
    const [showHeartBreak, setShowHeartBreak] = useState(false);
    const [prevLives, setPrevLives] = useState(teamData?.round1?.lives || 3);
    const gameStatus = teamData?.round1?.status;

    useEffect(() => {
        if (!teamData?.round1?.startTime) return;
        const interval = setInterval(() => {
            if (gameState.round1.isPaused) return;
            const start = new Date(teamData.round1.startTime).getTime();
            const now = new Date().getTime();
            const elapsed = Math.floor((now - start) / 1000);
            const remaining = 600 - elapsed;
            if (remaining <= 0) {
                setTimeLeft(0);
                clearInterval(interval);
            } else {
                setTimeLeft(remaining);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [teamData?.round1?.startTime, gameState.round1.isPaused]);

    useEffect(() => {
        const currentLives = teamData?.round1?.lives;
        if (currentLives < prevLives) {
            setShowHeartBreak(true);
            setTimeout(() => setShowHeartBreak(false), 2000);
        }
        setPrevLives(currentLives);
    }, [teamData?.round1?.lives, prevLives]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (gameStatus === 'exploded' || timeLeft === 0 || gameStatus === 'completed') {
        return <LeaderboardBoard leaderboard={leaderboard} currentTeamName={teamData?.teamName} setCurrentView={setCurrentView} />;
    }

    const renderPuzzle = (puzzle, index) => {
        const props = {
            onSolved: () => submitPuzzleResult(true, index),
            onFailed: () => submitPuzzleResult(false, index),
            data: puzzle.data
        };
        switch (puzzle.puzzleType) {
            case 'grid_number': return <GridNumberPuzzle {...props} />;
            case 'symbols': return <SymbolPuzzle {...props} />;
            case 'advanced_wires': return <AdvancedWirePuzzle {...props} />;
            case 'morse_symbols': return <MorseSymbolPuzzle {...props} />;
            case 'memory': return <MemoryPuzzle {...props} />;
            default: return null;
        }
    };

    const activeIndex = teamData?.round1?.selectedModuleIndex ?? -1;

    return (
        <div className={`arena-floor ${activeIndex !== -1 ? 'module-zoom-active' : ''}`}>
            <AnimatePresence mode="wait">
                {!isBoxOpen ? (
                    <motion.div key="box" className="bomb-box-outer" exit={{ scale: 1.1, opacity: 0, rotateX: -60, y: -100 }} transition={{ duration: 0.8 }}>
                        <div className="box-lid">
                            <div className="warning-diamond"></div>
                            {[0, 1, 2, 3].map(i => (
                                <motion.div key={i} className={`screw screw-${i}`} onClick={() => handleScrewClick(i)} animate={unscrewed[i] ? { rotate: 360 * 3, z: 200, opacity: 0 } : {}}>
                                    <div className="screw-slot"></div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="internal" className="internal-arena" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                        <div className="industrial-case">
                            <div className="case-header">
                                <span className="serial-no">Z-22286-WTYK</span>
                                <div className="status-lights">
                                    <div className="lives-mini-display" style={{ display: 'flex', gap: '8px', marginRight: '20px' }}>
                                        {[...Array(3)].map((_, i) => (
                                            <Heart
                                                key={i}
                                                fill={i < teamData?.round1?.lives ? "var(--squid-pink)" : "none"}
                                                color="var(--squid-pink)"
                                                size={18}
                                            />
                                        ))}
                                    </div>
                                    <div className="light green"></div>
                                    <div className="light red pulse" style={{ width: '15px', height: '15px', borderRadius: '50%', background: '#ff3c3c' }}></div>
                                </div>
                            </div>
                            <div className="puzzle-container">
                                {teamData?.round1?.puzzles?.map((puzzle, i) => (
                                    <div
                                        key={i}
                                        className={`puzzle ${i === activeIndex ? 'active-module' : ''} ${puzzle.solved ? 'puzzle-done' : ''}`}
                                        onClick={(e) => {
                                            if (gameState.round1.isPaused || isRedCode) return;

                                            // Ignore single click for ALL modules when not zoomed
                                            if (activeIndex !== i) {
                                                return;
                                            }

                                            if (!puzzle.solved) {
                                                e.stopPropagation();
                                                selectModule(i);
                                            }
                                        }}
                                        onDoubleClick={(e) => {
                                            if (gameState.round1.isPaused || isRedCode) return;
                                            // Allow double click to open any module
                                            if (!puzzle.solved && activeIndex !== i) {
                                                e.stopPropagation();
                                                selectModule(i);
                                            }
                                        }}
                                        data-id={`MODULE_${i + 1}`}
                                        style={{
                                            cursor: puzzle.solved ? 'default' : (activeIndex === i ? 'default' : 'pointer'),
                                            pointerEvents: (gameState.round1.isPaused || isRedCode) ? 'none' : 'auto'
                                        }}
                                    >
                                        {puzzle.solved ? (
                                            <div className="module-solved-overlay">
                                                <motion.div
                                                    initial={{ scaleX: 0 }}
                                                    animate={{ scaleX: 1 }}
                                                    transition={{ duration: 0.5, ease: "circOut" }}
                                                    className="module-hatch-left"
                                                />
                                                <motion.div
                                                    initial={{ scaleX: 0 }}
                                                    animate={{ scaleX: 1 }}
                                                    transition={{ duration: 0.5, ease: "circOut" }}
                                                    className="module-hatch-right"
                                                />
                                                <div className="solved-seal">SOLVED</div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="module-tag" style={
                                                    (activeIndex !== i)
                                                        ? { fontSize: '4rem', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'auto', height: 'auto', background: 'none', border: 'none' }
                                                        : {}
                                                }>{String.fromCharCode(65 + i)}</div>

                                                {/* Hide content until active */}
                                                <div style={{
                                                    pointerEvents: activeIndex === i ? 'auto' : 'none',
                                                    opacity: (activeIndex !== i) ? 0 : 1,
                                                    transition: 'opacity 0.3s'
                                                }}>
                                                    {renderPuzzle(puzzle, i)}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="bottom-bay">
                                <div className="battery-pack"></div>
                                <div className="timer-display-main" style={{
                                    background: '#0a1a0f', border: '4px solid #1a2e1d', borderRadius: '4px',
                                    padding: '5px 20px', color: '#ff3c3c', fontFamily: 'var(--font-mono)',
                                    fontSize: '3rem', fontWeight: 900, textShadow: '0 0 20px #ff3c3c',
                                    letterSpacing: '5px', display: 'flex', alignItems: 'center'
                                }}>
                                    {formatTime(timeLeft)}
                                </div>
                                <div className="dynamite-rods">
                                    {[1, 2, 3].map(i => <div key={i} className="dynamite-rod"></div>)}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {showHeartBreak && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1.2 }}
                        exit={{ opacity: 0, scale: 2 }}
                        style={{
                            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 1000, pointerEvents: 'none', background: 'rgba(255,0,0,0.1)'
                        }}
                    >
                        <motion.div
                            animate={{
                                x: [0, -10, 10, -10, 10, 0],
                                rotate: [0, -5, 5, -5, 5, 0]
                            }}
                            transition={{ duration: 0.5 }}
                        >
                            <HeartOff size={200} color="#ff3c3c" strokeWidth={3} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default DefuserPage;
