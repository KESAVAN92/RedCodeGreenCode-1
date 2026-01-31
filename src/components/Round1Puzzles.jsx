import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const AdvancedWirePuzzle = ({ onSolved, onFailed, data }) => {
    const [cut, setCut] = useState([]);
    const wires = data?.wires || ['red', 'blue', 'yellow', 'white', 'black'];

    const handleCut = (i) => {
        if (cut.includes(i)) return;
        setCut([...cut, i]);
        i === data.solution ? onSolved() : onFailed();
    };

    return (
        <div className="advanced-wires-bay">
            {wires.map((color, i) => (
                <div key={i} className={`wire-track ${cut.includes(i) ? 'wire-cut' : ''}`} onClick={() => handleCut(i)}>
                    <div className={`wire-strand ${color}`}></div>
                    <div className="wire-connector top"></div>
                    <div className="wire-connector bottom"></div>
                </div>
            ))}
        </div>
    );
};

export const AdvancedWireManual = () => (
    <div className="manual wire-rules">
        <h3>PROTOCOL: VOLTAGE DISRUPTION</h3>
        <p>Identify the sequence of 5 wires and apply the disruption logic:</p>
        <div className="rule-box">
            <ul>
                <li>1. If the last wire is <strong>White</strong>, cut the 4th wire.</li>
                <li>2. Else, if there are exactly <strong>2 Red wires</strong>, cut the 1st Red wire.</li>
                <li>3. Else, if there are <strong>no Black wires</strong>, cut the 2nd wire.</li>
                <li>4. Otherwise, cut the 1st wire.</li>
            </ul>
        </div>
    </div>
);

export const SymbolPuzzle = ({ onSolved, onFailed, data }) => {
    const [val, setVal] = useState('');
    const handleChange = (e) => {
        const current = e.target.value;
        setVal(current);
        if (data?.symbols && current === data.symbols[0]) onSolved();
    };
    return (
        <div className="num-selector">
            <input
                className="squid-input"
                style={{ width: '100%', textAlign: 'center', fontSize: '1.5rem', marginBottom: 0 }}
                value={val}
                onChange={handleChange}
                placeholder="TYPE CODE"
            />
        </div>
    );
};

export const SymbolManual = ({ data }) => (
    <div className="manual">
        <h3>MODULE B2: CODE VERIFICATION</h3>
        <p>Enter the master key:</p>
        <h1 style={{ color: '#00ff66', fontSize: '5rem' }}>{data.symbols[0]}</h1>
    </div>
);

export const GridNumberPuzzle = ({ onSolved, onFailed, data }) => {
    const [step, setStep] = useState(0);

    // Reset step if data changes (new random pattern after failure)
    useEffect(() => {
        setStep(0);
    }, [data]);

    const handleClick = (idx) => {
        if (!data?.sequence) return;
        if (idx === data.sequence[step]) {
            if (step === data.sequence.length - 1) {
                onSolved();
            } else {
                setStep(step + 1);
            }
        } else {
            onFailed();
        }
    };

    return (
        <div className="grid-3x3">
            {[...Array(9)].map((_, i) => (
                <div
                    key={i}
                    className={`grid-btn ${i === data?.startIndex ? 'green' : 'gray'}`}
                    onClick={() => handleClick(i)}
                >
                    {step > 0 && data.sequence.slice(0, step).includes(i) && <div className="done-dot"></div>}
                </div>
            ))}
        </div>
    );
};

export const GridNumberManual = ({ data }) => {
    // We map indices to numbers for the manual
    const grid = Array(9).fill('');
    data.sequence.forEach((idx, i) => {
        grid[idx] = i + 1;
    });

    return (
        <div className="manual">
            <h3>PROTOCOL: ACCORDING TO NUMBER</h3>
            <p>Locate the green tip and follow the sequence:</p>
            <div className="manual-grid-3x3">
                {grid.map((num, i) => (
                    <div key={i} className={`man-grid-cell ${i === data.startIndex ? 'highlight' : ''}`}>
                        {num}
                    </div>
                ))}
            </div>
        </div>
    );
};

const SYMBOL_LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split('');

const MORSE_MAP = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..', '1': '.----', '2': '..---', '3': '...--',
    '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..',
    '9': '----.', '0': '-----'
};

const SYMBOL_REPS = {
    'A': 'ᚦ', 'B': '◈', 'C': '⊞', 'D': '▼', 'E': '▣', 'F': '◬', 'G': '◍', 'H': '⌬', 'I': '⧉',
    'J': '⫽', 'K': '⋔', 'L': '⩔', 'M': '⩖', 'N': '⩓', 'O': '⚙', 'P': '⚯', 'Q': '⚔', 'R': '⚖',
    'S': '⚓', 'T': '☠', 'U': '☢', 'V': '⚛', 'W': '☣', 'X': '☤', 'Y': '☯', 'Z': '☸',
    '1': '⫷', '2': '⫸', '3': '⫹', '4': '⫺', '5': '⫻', '6': '⫼', '7': '⫽', '8': '⫾', '9': '⫿', '0': '⬟'
};

export const MorseSymbolPuzzle = ({ onSolved, onFailed, data }) => {
    const [selections, setSelections] = useState([0, 0, 0, 0, 0]);
    const targetWord = data.word || "ABCDE";

    const handleScroll = (idx, dir) => {
        const newSels = [...selections];
        newSels[idx] = (newSels[idx] + dir + 36) % 36;
        setSelections(newSels);
    };

    const checkSolution = () => {
        const currentWord = selections.map(i => SYMBOL_LABELS[i]).join('');
        if (currentWord === targetWord) onSolved();
        else onFailed();
    };

    return (
        <div className="morse-symbols-module">
            <div className="selectors-row">
                {selections.map((sel, i) => (
                    <div key={i} className="symbol-selector">
                        <button className="scroll-btn up" onClick={(e) => { e.stopPropagation(); handleScroll(i, -1); }}>▲</button>

                        <div className="morse-strip" title="SECURE_KEY">
                            {MORSE_MAP[targetWord[i]]}
                        </div>

                        <div
                            className="symbol-display"
                            onClick={(e) => { e.stopPropagation(); handleScroll(i, 1); }}
                            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); handleScroll(i, -1); }}
                        >
                            {SYMBOL_REPS[SYMBOL_LABELS[sel]]}
                        </div>
                        <button className="scroll-btn down" onClick={(e) => { e.stopPropagation(); handleScroll(i, 1); }}>▼</button>
                    </div>
                ))}
            </div>

            <button className="submit-btn-module" onClick={checkSolution}>VERIFY_SEQUENCE</button>
        </div>
    );
};

export const MorseSymbolManual = ({ data }) => {
    return (
        <div className="manual dark-manual">
            <h3>PROTOCOL: ENCRYPTED WAVEFORMS</h3>
            <div className="manual-split">
                <div className="manual-table-box">
                    <h4>MORSE TRANSLATION</h4>
                    <div className="morse-grid">
                        {Object.entries(MORSE_MAP).map(([char, code]) => (
                            <div key={char} className="morse-item">
                                <strong>{char}</strong> <span>{code}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="manual-table-box">
                    <h4>SYMBOL MAPPING</h4>
                    <div className="symbol-mapping-grid">
                        {SYMBOL_LABELS.map(char => (
                            <div key={char} className="mapping-item">
                                <div className="symbol-box">{SYMBOL_REPS[char]}</div>
                                <div className="letter-tag">{char}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const MemoryPuzzle = ({ onSolved, onFailed, data }) => {
    const [stage, setStage] = useState(0);
    const [history, setHistory] = useState([]); // Stores labels of buttons clicked

    useEffect(() => {
        setStage(0);
        setHistory([]);
    }, [data]);

    const displays = data?.displays || [1, 2, 3, 1];
    const currentDisplay = displays[stage];

    const handleClick = (label) => {
        let correctLabel = "";

        if (stage === 0) {
            if (currentDisplay === 1) correctLabel = "1";
            else if (currentDisplay === 2) correctLabel = "3";
            else if (currentDisplay === 3) correctLabel = "2";
        } else if (stage === 1) {
            if (currentDisplay === 1) correctLabel = history[0];
            else if (currentDisplay === 2) correctLabel = "1";
            else if (currentDisplay === 3) correctLabel = "3";
        } else if (stage === 2) {
            if (currentDisplay === 1) correctLabel = history[1];
            else if (currentDisplay === 2) correctLabel = "2";
            else if (currentDisplay === 3) correctLabel = history[0];
        } else if (stage === 3) {
            if (currentDisplay === 1) correctLabel = history[1];
            else if (currentDisplay === 2) correctLabel = history[2];
            else if (currentDisplay === 3) correctLabel = history[0];
        }

        if (label === correctLabel) {
            const nextHistory = [...history, label];
            if (stage === 3) {
                onSolved();
            } else {
                setHistory(nextHistory);
                setStage(stage + 1);
            }
        } else {
            onFailed();
        }
    };

    return (
        <div className="memory-module">
            <div className="memory-display-case">
                <div className="memory-display">{currentDisplay}</div>
                <div className="stage-indicators">
                    {[0, 1, 2, 3].map(i => (
                        <div key={i} className={`stage-dot ${i <= stage ? 'active' : ''}`}></div>
                    ))}
                </div>
            </div>
            <div className="memory-buttons">
                {["1", "2", "3"].map(label => (
                    <button key={label} className="mem-btn" onClick={() => handleClick(label)}>
                        {label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export const MemoryManual = () => (
    <div className="manual memory-manual-text">
        <h3>PROTOCOL: NEURAL RECALL</h3>
        <div className="stage-rules">
            <div className="rule-box">
                <strong>STAGE 1:</strong>
                <ul>
                    <li>Display 1 → Press "1"</li>
                    <li>Display 2 → Press "3"</li>
                    <li>Display 3 → Press "2"</li>
                </ul>
            </div>
            <div className="rule-box">
                <strong>STAGE 2:</strong>
                <ul>
                    <li>Display 1 → Press btn from Stage 1</li>
                    <li>Display 2 → Press "1"</li>
                    <li>Display 3 → Press "3"</li>
                </ul>
            </div>
            <div className="rule-box">
                <strong>STAGE 3:</strong>
                <ul>
                    <li>Display 1 → Press btn from Stage 2</li>
                    <li>Display 2 → Press "2"</li>
                    <li>Display 3 → Press btn from Stage 1</li>
                </ul>
            </div>
            <div className="rule-box">
                <strong>STAGE 4:</strong>
                <ul>
                    <li>Display 1 → Press btn from Stage 2</li>
                    <li>Display 2 → Press btn from Stage 3</li>
                    <li>Display 3 → Press btn from Stage 1</li>
                </ul>
            </div>
        </div>
    </div>
);
