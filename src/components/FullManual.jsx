import React from 'react';

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
    '1': '✦', '2': '✥', '3': '✺', '4': '❈', '5': '❉', '6': '❊', '7': '❋', '8': '❂', '9': '⋆', '0': '⛬'
};

const ACCORDING_TO_NUMBER_PATTERNS = {
    0: [0, 4, 2, 5, 6, 1, 8, 3, 7],
    1: [1, 3, 6, 2, 8, 0, 5, 7, 4],
    3: [3, 5, 1, 8, 0, 7, 4, 6, 2],
    4: [4, 1, 3, 2, 8, 6, 5, 0, 7],
    5: [5, 6, 0, 3, 7, 2, 1, 4, 8],
    6: [6, 2, 1, 5, 4, 0, 7, 3, 8],
    7: [7, 0, 4, 3, 2, 5, 1, 6, 8],
    8: [8, 3, 5, 4, 0, 6, 1, 7, 2]
};

const GridPattern = ({ startIndex, sequence }) => {
    const grid = Array(9).fill('');
    sequence.forEach((idx, i) => {
        grid[idx] = i + 1;
    });
    return (
        <div className="manual-grid-small">
            {grid.map((num, i) => (
                <div key={i} className={`man-grid-cell-small ${i === startIndex ? 'highlight' : ''}`}>
                    {num}
                </div>
            ))}
        </div>
    );
};

const FullManual = () => {
    return (
        <div className="pdf-manual">
            <div className="manual-page">
                <header>
                    <h1>BOMB DEFUSAL MANUAL</h1>
                    <div className="revision">REV 2.0 - SECURE PROTOCOL</div>
                </header>

                {/* MODULE: ACCORDING TO NUMBER */}
                <section className="manual-section">
                    <h2>MODULE: ACCORDING TO NUMBER</h2>
                    <p>Locate the <strong>Green Tip</strong> in the defuser's grid. Match the grid below to find the sequence of buttons to press (1 to 9).</p>
                    <div className="grid-solutions-container">
                        {Object.entries(ACCORDING_TO_NUMBER_PATTERNS).map(([start, seq]) => (
                            <div key={start} className="grid-solution-item">
                                <GridPattern startIndex={parseInt(start)} sequence={seq} />
                            </div>
                        ))}
                    </div>
                </section>

                <div className="page-break" />

                {/* MODULE: VOLTAGE DISRUPTION */}
                <section className="manual-section">
                    <h2>MODULE: VOLTAGE DISRUPTION (WIRES)</h2>
                    <p>Analyze the 5 wires from top to bottom and follow the FIRST rule that applies:</p>
                    <div className="manual-rules-list">
                        <ul>
                            <li>1. If the last wire is <strong>White</strong>, cut the 4th wire.</li>
                            <li>2. Else, if there are exactly <strong>2 Red wires</strong>, cut the 1st Red wire.</li>
                            <li>3. Else, if there are <strong>no Black wires</strong>, cut the 2nd wire.</li>
                            <li>4. Otherwise, cut the 1st wire.</li>
                        </ul>
                    </div>
                </section>

                {/* MODULE: NEURAL RECALL */}
                <section className="manual-section">
                    <h2>MODULE: NEURAL RECALL (MEMORY)</h2>
                    <p>Press buttons based on the display number. There are 4 stages.</p>
                    <div className="memory-rules-grid">
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
                </section>

                <div className="page-break" />

                {/* MODULE: ENCRYPTED WAVEFORMS */}
                <section className="manual-section">
                    <h2>MODULE: ENCRYPTED WAVEFORMS</h2>
                    <p>The defuser sees Morse code strips above symbols. Translate the Morse code to find the correct letter/number for each symbol.</p>

                    <div className="mapping-container">
                        <div className="mapping-table">
                            <h3>MORSE ALPHABET</h3>
                            <div className="morse-manual-grid">
                                {Object.entries(MORSE_MAP).map(([char, code]) => (
                                    <div key={char} className="morse-manual-item">
                                        <strong>{char}</strong> <span>{code}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mapping-table">
                            <h3>SYMBOL VERIFICATION</h3>
                            <div className="symbols-manual-grid">
                                {SYMBOL_LABELS.map(char => (
                                    <div key={char} className="symbol-manual-item">
                                        <div className="sym-box">{SYMBOL_REPS[char]}</div>
                                        <div className="sym-label">{char}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default FullManual;
