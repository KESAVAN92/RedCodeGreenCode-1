import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartOff } from 'lucide-react';
import FullManual from '../components/FullManual';
import LeaderboardBoard from '../components/LeaderboardBoard';

const InstructorPage = ({
    teamData,
    setCurrentView,
    selectModule,
    isRedCode,
    gameState,
    leaderboard
}) => {
    const [timeLeft, setTimeLeft] = useState(600);
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

    return (
        <div className="arena-floor">
            <div className="instructor-header" style={{ width: '100%', left: 0, display: 'flex', justifyContent: 'center' }}>
                <div className="timer-led-big">{formatTime(timeLeft)}</div>
            </div>

            <motion.div key="internal" className="internal-arena" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: '1000px', margin: '140px auto 40px' }}>
                <FullManual />
            </motion.div>

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

        </div>
    );
};

export default InstructorPage;
