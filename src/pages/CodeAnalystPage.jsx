import React, { useState } from 'react';

const CodeAnalystPage = ({ teamData, setCurrentView }) => {
    const [selectedLanguage, setSelectedLanguage] = useState(null);

    const questions = {
        c: [
            {
                id: 1,
                title: "Pointer Arithmetic",
                content: "Explain the output of the following snippet:\n\nint arr[] = {10, 20, 30};\nint *ptr = arr;\nprintf('%d', *(ptr + 1));"
            },
            {
                id: 2,
                title: "Memory Leak",
                content: "Identify the memory leak in this function:\n\nvoid func() {\n  int *p = (int*)malloc(sizeof(int));\n  *p = 10;\n  return;\n}"
            }
        ],
        cpp: [
            {
                id: 1,
                title: "Virtual Functions",
                content: "What is the role of a virtual destructor in C++? Why is it important for polymorphism?"
            },
            {
                id: 2,
                title: "Template Metaprogramming",
                content: "Write a template function to swap two variables of any type without using a temporary variable."
            }
        ],
        python: [
            {
                id: 1,
                title: "List Comprehension",
                content: "Convert the following loop into a list comprehension:\n\nsquares = []\nfor x in range(10):\n    squares.append(x**2)"
            },
            {
                id: 2,
                title: "Decorator",
                content: "Write a decorator `timer` that measures the execution time of a function."
            }
        ]
    };

    return (
        <div className="analyst-view squid-container" style={{ minHeight: '100vh', padding: '2rem', color: '#fff' }}>
            <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <h2 className="green-text" style={{ fontSize: '2rem', margin: 0 }}>CODE ANALYST INTERFACE</h2>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, color: '#888' }}>OPERATIVE: {teamData?.teamName}</p>
                    <button className="btn-squid" onClick={() => setCurrentView('role_select')} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', marginTop: '0.5rem' }}>CHANGE ROLE</button>
                </div>
            </div>

            {!selectedLanguage ? (
                <div className="language-select" style={{ textAlign: 'center', marginTop: '5rem' }}>
                    <h1 style={{ fontSize: '3rem', marginBottom: '3rem', fontWeight: 900 }}>SELECT LANGUAGE PROTOCOL</h1>
                    <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
                        {['c', 'cpp', 'python'].map(lang => (
                            <button
                                key={lang}
                                onClick={() => setSelectedLanguage(lang)}
                                className="lang-btn"
                                style={{
                                    background: '#111',
                                    border: '2px solid #333',
                                    padding: '3rem',
                                    width: '250px',
                                    fontSize: '2rem',
                                    fontWeight: 900,
                                    color: '#fff',
                                    cursor: 'pointer',
                                    borderRadius: '12px',
                                    textTransform: 'uppercase',
                                    transition: 'all 0.3s'
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.borderColor = '#00ff66'; e.currentTarget.style.color = '#00ff66'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                                onMouseOut={(e) => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'scale(1)'; }}
                            >
                                {lang === 'cpp' ? 'C++' : lang}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="questions-view">
                    <button
                        onClick={() => setSelectedLanguage(null)}
                        style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', marginBottom: '2rem', display: 'flex', alignItems: 'center' }}
                    >
                        ← BACK TO LANGUAGE SELECT
                    </button>

                    <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem', borderBottom: '1px solid #333', paddingBottom: '1rem' }}>
                        ANALYSIS TASKS: <span style={{ color: 'var(--squid-pink)' }}>{selectedLanguage.toUpperCase()}</span>
                    </h2>

                    <div className="questions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                        {questions[selectedLanguage].map((q) => (
                            <div key={q.id} className="question-card" style={{ background: '#111', border: '1px solid #333', padding: '2rem', borderRadius: '8px' }}>
                                <h3 style={{ color: '#00ff66', marginBottom: '1rem' }}>TASK_0{q.id}: {q.title}</h3>
                                <pre style={{ background: '#000', padding: '1rem', borderRadius: '4px', whiteSpace: 'pre-wrap', fontFamily: 'monospace', color: '#ddd' }}>
                                    {q.content}
                                </pre>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CodeAnalystPage;
