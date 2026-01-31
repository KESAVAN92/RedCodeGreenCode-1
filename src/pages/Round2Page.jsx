import React, { useState, useEffect } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-java';
import 'prismjs/themes/prism-tomorrow.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Code, Play, Send, Terminal, AlertCircle, CheckCircle, Lock, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

const Round2Page = ({ teamData, socket }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [code, setCode] = useState("");
    const [output, setOutput] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState(null);
    const [role, setRole] = useState(null);

    const problems = teamData?.round2Progress?.problems || [];
    const currentProblem = problems[activeTab];

    useEffect(() => {
        // Determine role based on teamData and local storage/session (simplified here)
        const storedRole = localStorage.getItem('userRole'); // 'defuser' or 'instructor'
        setRole(storedRole);

        if (currentProblem) {
            setCode(currentProblem.buggyCode);
        }
    }, [activeTab, teamData]);

    const handleRun = async () => {
        setIsRunning(true);
        setOutput("Compiling and Running...\n");
        setResults(null);

        try {
            // Run against first public test case
            const testCase = currentProblem.testCases[0];
            const res = await axios.post('http://localhost:5000/api/execute', {
                language: currentProblem.language,
                code: code,
                stdin: testCase.input
            });

            const runOutput = res.data.run.output;
            setOutput(runOutput);

            const isCorrect = runOutput.trim() === testCase.expected.trim();
            setResults({ success: isCorrect, message: isCorrect ? "Test Case Passed!" : "Wrong Answer" });
        } catch (err) {
            setOutput("Error: " + err.message);
        }
        setIsRunning(false);
    };

    const handleSubmit = async () => {
        setIsRunning(true);
        let allPassed = true;
        let feedback = [];

        for (const tc of currentProblem.testCases) {
            try {
                const res = await axios.post('http://localhost:5000/api/execute', {
                    language: currentProblem.language,
                    code: code,
                    stdin: tc.input
                });
                const out = res.data.run.output.trim();
                const passed = out === tc.expected.trim();
                if (!passed) allPassed = false;
                feedback.push({ input: tc.input, passed });
            } catch (e) {
                allPassed = false;
            }
        }

        if (allPassed) {
            // Notify server of success
            socket.emit('solveRound2Problem', { teamId: teamData._id, problemIndex: activeTab, code });
            setResults({ success: true, message: "CONGRATULATIONS! All Test Cases Passed." });
        } else {
            setResults({ success: false, message: "Failing on some test cases. Coordination is key!" });
        }
        setIsRunning(false);
    };

    // Visibility logic
    const isEyes = role === 'instructor';
    const isHands = role === 'defuser';

    return (
        <div className="round2-portal">
            <div className="portal-sidebar">
                <div className="portal-logo">
                    <Code className="logo-icon" />
                    <span>BLIND_TRUST</span>
                </div>
                <div className="problem-list">
                    {problems.map((p, i) => (
                        <div
                            key={p.id}
                            className={`problem-item ${activeTab === i ? 'active' : ''} ${p.solved ? 'solved' : ''}`}
                            onClick={() => setActiveTab(i)}
                        >
                            <div className="status-dot" />
                            <div className="problem-info">
                                <span className="p-title">{p.title}</span>
                                <span className="p-lang">{p.language.toUpperCase()}</span>
                            </div>
                            {p.solved && <CheckCircle className="solve-icon" size={16} />}
                        </div>
                    ))}
                </div>
            </div>

            <div className="portal-main">
                <div className="portal-header">
                    <div className="active-problem-title">
                        <h2>{currentProblem?.title}</h2>
                        <div className="difficulty-badge">HARD</div>
                    </div>
                    <div className="role-indicator">
                        {role === 'instructor' ? <Eye /> : <Lock />}
                        <span>ROLE: {role?.toUpperCase()}</span>
                    </div>
                </div>

                <div className="portal-content-grid">
                    {/* PROBLEM DESCRIPTION (EYES ONLY) */}
                    <div className={`description-pane ${isHands ? 'blurred' : ''}`}>
                        <h3><Terminal size={18} /> PROBLEM_SPEC</h3>
                        <div className="p-desc">
                            {currentProblem?.description}
                        </div>
                        <div className="bug-clue-box">
                            <h4>BUGGY_SOURCE_CLUE</h4>
                            <p>Initial state has logical flaws. Guide the Machinist to correct it line by line.</p>
                        </div>
                        {isHands && (
                            <div className="blind-overlay">
                                <Lock size={48} />
                                <p>BLIND DEBUGGING: ONLY THE EYES CAN SEE THE BUG</p>
                            </div>
                        )}
                    </div>

                    {/* CODE EDITOR (HANDS ONLY) */}
                    <div className="editor-pane">
                        <div className="editor-toolbar">
                            <div className="lang-tag">{currentProblem?.language}</div>
                            <div className="editor-actions">
                                <button className="run-btn" onClick={handleRun} disabled={isRunning}>
                                    <Play size={16} /> RUN
                                </button>
                                <button className="submit-btn" onClick={handleSubmit} disabled={isRunning}>
                                    <Send size={16} /> SUBMIT
                                </button>
                            </div>
                        </div>

                        <div className="editor-wrapper">
                            <Editor
                                value={code}
                                onValueChange={code => isHands ? setCode(code) : null}
                                highlight={code => highlight(code, languages[currentProblem?.language] || languages.js)}
                                padding={20}
                                className="code-editor"
                                style={{
                                    fontFamily: '"Fira code", "Fira Mono", monospace',
                                    fontSize: 14,
                                    minHeight: '100%'
                                }}
                                disabled={isEyes}
                            />
                            {isEyes && <div className="readonly-overlay">READ_ONLY / CONSULT ONLY</div>}
                        </div>

                        <div className="console-area">
                            <div className="console-header">
                                <span>CONSOLE</span>
                                {results && (
                                    <span className={`res-tag ${results.success ? 'pass' : 'fail'}`}>
                                        {results.message}
                                    </span>
                                )}
                            </div>
                            <div className="console-output">
                                {output || "Waiting for execution..."}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Round2Page;
