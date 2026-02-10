const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// CORS and Socket.IO configuration
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://redcode-greencode.vercel.app',
    process.env.APPLICATION_URL
].filter(Boolean);

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"]
    }
});

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// --- DATABASE STATE ---
let useMemoryFallback = false;
let memoryPlayers = []; // For demo if MongoDB fails

// Player Schema
const playerSchema = new mongoose.Schema({
    teamName: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    member1: { name: String, regNo: String, email: String, phone: String },
    member2: { name: String, regNo: String, email: String, phone: String },
    round1Progress: {
        currentPuzzle: { type: Number, default: 0 },
        selectedModuleIndex: { type: Number, default: -1 },
        lives: { type: Number, default: 3 },
        status: { type: String, default: 'active' },
        startTime: { type: Date },
        endTime: { type: Date },
        roleSelection: { member1: String, member2: String },
        puzzles: [{
            puzzleType: String,
            solved: { type: Boolean, default: false },
            data: mongoose.Schema.Types.Mixed
        }]
    },
    round2Progress: {
        problems: [{
            id: String,
            title: String,
            description: String,
            buggyCode: String,
            language: String,
            solutionId: String,
            testCases: [{ input: String, expected: String, isPublic: Boolean }],
            solved: { type: Boolean, default: false },
            attempts: { type: Number, default: 0 },
            score: { type: Number, default: 0 }
        }],
        roleSelection: { member1: String, member2: String },
        currentProblemIndex: { type: Number, default: 0 },
        status: { type: String, default: 'waiting' },
        startTime: { type: Date },
        endTime: { type: Date }
    },
    round2Marks: { bugId: { type: Number, default: 0 }, coord: { type: Number, default: 0 } },
    round2ManualScore: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    registrationTime: { type: Date, default: Date.now }
});

const Player = mongoose.model('Player', playerSchema);

// --- ROUND 2 PROBLEMS ---
const ROUND_2_PROBLEMS = [
    {
        id: "p1",
        title: "The Faulty Summation",
        language: "python",
        description: "The following code is supposed to calculate the sum of all even numbers in a list, but it fails for some inputs. Find and fix the bug.",
        buggyCode: "def sum_evens(nums):\n    total = 0\n    for n in nums:\n        if n % 2 == 1: # BUG HERE\n            total += n\n    return total",
        testCases: [
            { input: "[1, 2, 3, 4]", expected: "6", isPublic: true },
            { input: "[10, 15, 20]", expected: "30", isPublic: false }
        ]
    },
    {
        id: "p2",
        title: "Palindrome Paradox",
        language: "cpp",
        description: "A C++ function to check if a string is a palindrome. It seems to miss the middle character check or fails on case sensitivity. Fix it to be case-insensitive.",
        buggyCode: "#include <iostream>\n#include <string>\n#include <algorithm>\n\nbool isPalindrome(std::string s) {\n    std::string rev = s;\n    std::reverse(rev.begin(), rev.end());\n    return s == rev;\n}",
        testCases: [
            { input: "Racecar", expected: "true", isPublic: true },
            { input: "level", expected: "true", isPublic: false }
        ]
    },
    {
        id: "p3",
        title: "Array Index out of Bounds",
        language: "java",
        description: "This Java snippet finds the maximum value in an array. It crashes with an exception. Locate the boundary error.",
        buggyCode: "public class Solution {\n    public static int findMax(int[] arr) {\n        int max = arr[0];\n        for (int i = 0; i <= arr.length; i++) {\n            if (arr[i] > max) max = arr[i];\n        }\n        return max;\n    }\n}",
        testCases: [
            { input: "[1, 5, 3]", expected: "5", isPublic: true },
            { input: "[-10, 0, -5]", expected: "0", isPublic: false }
        ]
    }
];

const generateRound2 = () => {
    return ROUND_2_PROBLEMS.map(p => ({ ...p, solved: false, attempts: 0, score: 0 }));
};

// --- HELPERS ---
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

const getRandomPattern = () => {
    const indices = Object.keys(ACCORDING_TO_NUMBER_PATTERNS);
    const startIndex = parseInt(indices[Math.floor(Math.random() * indices.length)]);
    return { startIndex, sequence: ACCORDING_TO_NUMBER_PATTERNS[startIndex] };
};

const getAdvancedWireSolution = (wires) => {
    const redCount = wires.filter(c => c === 'red').length;
    const blackCount = wires.filter(c => c === 'black').length;

    // Rule 1: If the last wire is white, cut the 4th wire. (index 3)
    if (wires[4] === 'white') return 3;
    // Rule 2: If there are exactly 2 red wires, cut the first red wire.
    if (redCount === 2) return wires.indexOf('red');
    // Rule 3: If there are no black wires, cut the 2nd wire. (index 1)
    if (blackCount === 0) return 1;
    // Rule 4: Otherwise, cut the first wire.
    return 0;
};

const generatePuzzles = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const getRandomWord = (len) => Array(len).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
    const wireColors = ['red', 'blue', 'yellow', 'white', 'black'];

    const pool = [
        { type: 'grid_number', getData: () => getRandomPattern() },
        { type: 'morse_symbols', getData: () => ({ word: getRandomWord(5) }) },
        { type: 'memory', getData: () => ({ displays: Array(4).fill(0).map(() => Math.floor(Math.random() * 3) + 1) }) },
        {
            type: 'advanced_wires',
            getData: () => {
                const config = Array(5).fill(0).map(() => wireColors[Math.floor(Math.random() * 5)]);
                return { wires: config, solution: getAdvancedWireSolution(config) };
            }
        }
    ];

    // Shuffle and pick 3
    const shuffled = pool.sort(() => 0.5 - Math.random()).slice(0, 3);
    return shuffled.map(p => ({
        puzzleType: p.type,
        solved: false,
        data: p.getData()
    }));
};

const findTeam = async (id) => {
    if (useMemoryFallback) return memoryPlayers.find(p => p._id === id || p.teamName === id);
    if (mongoose.Types.ObjectId.isValid(id)) return await Player.findById(id);
    return await Player.findOne({ teamName: id });
};

// --- ROUTES ---
app.post('/api/check-team', async (req, res) => {
    const { teamName } = req.body;
    if (teamName === 'rcgc@admin2026') return res.json({ exists: true, isAdmin: true });
    const team = await findTeam(teamName);
    res.json({ exists: !!team, isAdmin: false });
});

app.post('/api/login', async (req, res) => {
    const { teamName, password } = req.body;
    if (teamName === 'rcgc@admin2026' && password === 'squidfest@rcgc') {
        return res.json({ success: true, isAdmin: true });
    }
    const team = await findTeam(teamName);
    if (team && team.password === password) {
        res.json({ success: true, isAdmin: false, player: team });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

app.post('/api/register', async (req, res) => {
    try {
        const { teamName, password, m1Name, m1Reg, m1Email, m2Name, m2Reg, m2Email } = req.body;
        const playerObj = {
            teamName, password,
            member1: { name: m1Name, regNo: m1Reg, email: m1Email },
            member2: { name: m2Name, regNo: m2Reg, email: m2Email },
            round1Progress: {
                puzzles: generatePuzzles(),
                currentPuzzle: 0,
                selectedModuleIndex: -1,
                roleSelection: { member1: null, member2: null },
                lives: 3,
                status: 'active'
            },
            round2Progress: {
                problems: generateRound2(),
                roleSelection: { member1: null, member2: null },
                status: 'waiting'
            }
        };

        if (useMemoryFallback) {
            const memoryObj = { ...playerObj, _id: Date.now().toString() };
            memoryPlayers.push(memoryObj);
            res.status(201).json({ message: 'Memory Reg OK', player: memoryObj });
        } else {
            const newPlayer = new Player(playerObj);
            await newPlayer.save();
            res.status(201).json({ message: 'DB Reg OK', player: newPlayer });
        }
    } catch (err) { res.status(400).json({ error: err.message }); }
});

const axios = require('axios');
app.post('/api/execute', async (req, res) => {
    const { language, code, stdin } = req.body;
    const langMap = { 'python': 'python3', 'c': 'c', 'cpp': 'cpp', 'java': 'java' };
    try {
        const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
            language: langMap[language] || language,
            version: "*",
            files: [{ content: code }],
            stdin: stdin || ""
        });
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: 'Execution failed' });
    }
});

app.get('/api/leaderboard', async (req, res) => {
    if (useMemoryFallback) return res.json(memoryPlayers);
    const players = await Player.find().sort({ score: -1 });
    res.json(players);
});

// --- SOCKETS ---
let globalGameState = {
    status: 'GREEN',
    round1: { isStarted: false, isPaused: false, startTime: null, pauseStartTime: null },
    round2: { isStarted: false, isPaused: false, startTime: null, pauseStartTime: null }
};

const getSortedPlayers = async () => {
    let players = useMemoryFallback ? [...memoryPlayers] : await Player.find({});

    return players.sort((a, b) => {
        // 1. Alive status (exploded is last)
        const aAlive = a.round1Progress?.status !== 'exploded';
        const bAlive = b.round1Progress?.status !== 'exploded';
        if (aAlive !== bAlive) return aAlive ? -1 : 1;

        // 2. Completed / Solved count
        const aSolved = a.round1Progress?.puzzles?.filter(p => p.solved).length || 0;
        const bSolved = b.round1Progress?.puzzles?.filter(p => p.solved).length || 0;
        if (aSolved !== bSolved) return bSolved - aSolved;

        // 3. Time taken (if started)
        const aTime = (a.round1Progress?.endTime && a.round1Progress?.startTime)
            ? (new Date(a.round1Progress.endTime) - new Date(a.round1Progress.startTime))
            : (a.round1Progress?.startTime ? (Date.now() - new Date(a.round1Progress.startTime)) : Infinity);

        const bTime = (b.round1Progress?.endTime && b.round1Progress?.startTime)
            ? (new Date(b.round1Progress.endTime) - new Date(b.round1Progress.startTime))
            : (b.round1Progress?.startTime ? (Date.now() - new Date(b.round1Progress.startTime)) : Infinity);

        if (aTime !== bTime) return aTime - bTime;

        // 4. Hearts/Lives
        const aLives = a.round1Progress?.lives || 0;
        const bLives = b.round1Progress?.lives || 0;
        return bLives - aLives;
    });
};

io.on('connection', (socket) => {
    socket.emit('gameUpdate', globalGameState);
    socket.on('joinTeam', async (teamId) => {
        socket.join(teamId);

        // Refresh puzzles on screen refresh if game is not finished/exploded
        const player = await findTeam(teamId);
        if (player && player.round1Progress.status === 'active' && !player.round1Progress.puzzles.some(p => p.solved)) {
            player.round1Progress.puzzles = generatePuzzles();
            if (!useMemoryFallback) {
                await Player.findByIdAndUpdate(player._id, { 'round1Progress.puzzles': player.round1Progress.puzzles });
            }
            io.to(teamId).emit('teamUpdate', player);
        }
    });

    socket.on('toggleRedLight', (data) => {
        globalGameState.status = data.status;
        io.emit('gameUpdate', globalGameState);
    });

    // ADMIN CONTROLS
    socket.on('adminAction', async ({ round, action }) => {
        console.log(`[ADMIN_ACTION] Round: ${round}, Action: ${action}`);
        const rKey = round === 1 ? 'round1' : 'round2';

        if (action === 'start') {
            globalGameState[rKey].isStarted = true;
            globalGameState[rKey].isPaused = false;

            const now = new Date();
            globalGameState[rKey].startTime = now;

            const players = useMemoryFallback ? memoryPlayers : await Player.find({});

            for (let p of players) {
                const progress = round === 1 ? p.round1Progress : p.round2Progress;

                progress.startTime = now;
                progress.status = 'active';

                if (!useMemoryFallback) {
                    await Player.findByIdAndUpdate(p._id, {
                        [round === 1 ? 'round1Progress' : 'round2Progress']: progress
                    });
                }
            }
            // Broadcast updates
            for (let p of players) {
                io.to(p._id.toString()).emit('teamUpdate', p);
            }
        } else if (action === 'pause') {
            globalGameState[rKey].isPaused = true;
            globalGameState[rKey].pauseStartTime = new Date();
        } else if (action === 'resume') {
            globalGameState[rKey].isPaused = false;
            if (globalGameState[rKey].pauseStartTime) {
                const pauseDuration = new Date().getTime() - new Date(globalGameState[rKey].pauseStartTime).getTime();
                const players = useMemoryFallback ? memoryPlayers : await Player.find({});

                for (let p of players) {
                    const progress = round === 1 ? p.round1Progress : p.round2Progress;
                    if (progress.status === 'active' && progress.startTime) {
                        const originalStart = new Date(progress.startTime).getTime();
                        progress.startTime = new Date(originalStart + pauseDuration);

                        if (!useMemoryFallback) {
                            await Player.findByIdAndUpdate(p._id, {
                                [round === 1 ? 'round1Progress' : 'round2Progress']: progress
                            });
                        }
                    }
                }
                globalGameState[rKey].pauseStartTime = null; // Reset

                // Broadcast updates
                for (let p of players) {
                    io.to(p._id.toString()).emit('teamUpdate', p);
                }
            }
        } else if (action === 'stop') {
            globalGameState[rKey].isStarted = false;
            globalGameState[rKey].isPaused = false;
            io.emit('gameUpdate', globalGameState);

            // End the round for everyone
            const players = await (useMemoryFallback ? memoryPlayers : Player.find({}));
            for (let p of players) {
                const progress = round === 1 ? p.round1Progress : p.round2Progress;
                if (progress.status === 'active' || progress.status === 'waiting') {
                    progress.status = 'completed';
                    progress.endTime = new Date();

                    // Award points for what they finished if stopping early
                    if (round === 1) {
                        const solvedCount = progress.puzzles.filter(pz => pz.solved).length;
                        p.score = (p.score || 0) + (solvedCount * 100);
                        if (solvedCount >= progress.puzzles.length) p.score += 200;
                    }
                }
                if (!useMemoryFallback) {
                    await Player.findByIdAndUpdate(p._id, {
                        [round === 1 ? 'round1Progress' : 'round2Progress']: progress,
                        score: p.score
                    });
                }
            }
        } else if (action === 'restart') {
            const now = new Date();
            if (round === 1) {
                globalGameState.round1.startTime = now;
                if (useMemoryFallback) {
                    memoryPlayers.forEach(p => {
                        p.round1Progress = {
                            puzzles: generatePuzzles(),
                            currentPuzzle: 0,
                            selectedModuleIndex: -1,
                            roleSelection: p.round1Progress.roleSelection,
                            lives: p.round1Progress.lives || 3, // Preserve lives
                            status: 'active',
                            startTime: now,
                            endTime: null
                        };
                        p.score = 0;
                    });
                } else {
                    const players = await Player.find({});
                    for (let p of players) {
                        p.round1Progress = {
                            puzzles: generatePuzzles(),
                            currentPuzzle: 0,
                            selectedModuleIndex: -1,
                            roleSelection: p.round1Progress.roleSelection,
                            lives: p.round1Progress.lives || 3, // Preserve lives
                            status: 'active',
                            startTime: now,
                            endTime: null
                        };
                        p.score = 0;
                        await p.save();
                    }
                }
            } else if (round === 2) {
                globalGameState.round2.startTime = now;
                if (useMemoryFallback) {
                    memoryPlayers.forEach(p => {
                        p.round2Progress = {
                            problems: generateRound2(),
                            status: 'active',
                            startTime: now,
                            endTime: null
                        };
                    });
                } else {
                    const players = await Player.find({});
                    for (let p of players) {
                        p.round2Progress = {
                            problems: generateRound2(),
                            status: 'active',
                            startTime: now,
                            endTime: null
                        };
                        await p.save();
                    }
                }
            }
            globalGameState[rKey].isStarted = true;
            globalGameState[rKey].isPaused = false;
        }

        io.emit('gameUpdate', globalGameState);
        const allPlayers = useMemoryFallback ? memoryPlayers : await Player.find({});
        for (let p of allPlayers) {
            io.to(p._id.toString()).emit('teamUpdate', p);
        }
        const sorted = await getSortedPlayers();
        io.emit('adminLeaderboardUpdate', sorted);
    });

    socket.on('selectRole', async ({ teamId, memberIdentifier, role }) => {
        const player = await findTeam(teamId);
        if (player) {
            if (!player.round1Progress.roleSelection) player.round1Progress.roleSelection = { member1: null, member2: null };

            player.round1Progress.roleSelection[memberIdentifier] = role;

            if (!useMemoryFallback) await Player.findByIdAndUpdate(player._id, { 'round1Progress.roleSelection': player.round1Progress.roleSelection });
            io.to(teamId).emit('teamUpdate', player);
        }
    });

    socket.on('selectRoleRound2', async ({ teamId, memberIdentifier, role }) => {
        const player = await findTeam(teamId);
        if (player) {
            if (!player.round2Progress.roleSelection) player.round2Progress.roleSelection = { member1: null, member2: null };

            player.round2Progress.roleSelection[memberIdentifier] = role;

            if (!useMemoryFallback) await Player.findByIdAndUpdate(player._id, { 'round2Progress.roleSelection': player.round2Progress.roleSelection });
            io.to(teamId).emit('teamUpdate', player);
        }
    });

    socket.on('resetTeamBomb', async ({ teamId }) => {
        const player = await findTeam(teamId);
        if (player) {
            player.round1Progress = {
                puzzles: generatePuzzles(),
                currentPuzzle: 0,
                selectedModuleIndex: -1,
                roleSelection: player.round1Progress.roleSelection, // Maintain role selection
                lives: 3, // Reset lives to 3 for individual team reset
                status: 'active',
                startTime: globalGameState.round1.startTime || new Date(), // Use global start time if available
                endTime: null
            };

            if (!useMemoryFallback) {
                await Player.findByIdAndUpdate(player._id, {
                    round1Progress: player.round1Progress
                });
            }

            io.to(player._id.toString()).emit('teamUpdate', player);
            const sorted = await getSortedPlayers();
            io.emit('adminLeaderboardUpdate', sorted);
        }
    });

    socket.on('startRound1', async (teamId) => {
        const player = await findTeam(teamId);
        if (player) {
            player.round1Progress.startTime = new Date();
            if (!useMemoryFallback) await Player.findByIdAndUpdate(player._id, { 'round1Progress.startTime': player.round1Progress.startTime });
            io.to(teamId).emit('teamUpdate', player);
        }
    });

    socket.on('selectModule', async ({ teamId, moduleIndex }) => {
        const player = await findTeam(teamId);
        if (player) {
            player.round1Progress.selectedModuleIndex = moduleIndex;
            if (!useMemoryFallback) await Player.findByIdAndUpdate(player._id, { 'round1Progress.selectedModuleIndex': moduleIndex });
            io.to(teamId).emit('teamUpdate', player);
        }
    });

    socket.on('submitPuzzle', async ({ teamId, puzzleIndex, success }) => {
        const player = await findTeam(teamId);
        if (player) {
            // Safety check for valid puzzle index
            if (!player.round1Progress || !player.round1Progress.puzzles || !player.round1Progress.puzzles[puzzleIndex]) {
                console.error(`[ERROR] Invalid puzzle submission: teamId=${teamId}, puzzleIndex=${puzzleIndex}`);
                return;
            }

            if (success) {
                if (!player.round1Progress.puzzles[puzzleIndex].solved) {
                    player.round1Progress.puzzles[puzzleIndex].solved = true;
                    player.round1Progress.selectedModuleIndex = -1;
                    player.score = (player.score || 0) + 100;

                    const solvedCount = player.round1Progress.puzzles.filter(p => p.solved).length;
                    if (solvedCount >= player.round1Progress.puzzles.length) {
                        player.round1Progress.status = 'completed';
                        player.round1Progress.endTime = new Date();
                        player.score += 200;
                    }
                }
            } else {
                player.round1Progress.lives -= 1;
                if (player.round1Progress.lives <= 0) {
                    player.round1Progress.status = 'exploded';
                    player.round1Progress.endTime = new Date();
                } else {
                    const pType = player.round1Progress.puzzles[puzzleIndex].puzzleType;
                    if (pType === 'grid_number') player.round1Progress.puzzles[puzzleIndex].data = getRandomPattern();
                    else if (pType === 'memory') player.round1Progress.puzzles[puzzleIndex].data = { displays: Array(4).fill(0).map(() => Math.floor(Math.random() * 3) + 1) };
                    else if (pType === 'advanced_wires') {
                        const wireColors = ['red', 'blue', 'yellow', 'white', 'black'];
                        const config = Array(5).fill(0).map(() => wireColors[Math.floor(Math.random() * 5)]);
                        player.round1Progress.puzzles[puzzleIndex].data = { wires: config, solution: getAdvancedWireSolution(config) };
                    }
                }
            }
            if (!useMemoryFallback) await Player.findByIdAndUpdate(player._id, {
                round1Progress: player.round1Progress,
                score: player.score
            });
            io.to(teamId).emit('teamUpdate', player);
            const sorted = await getSortedPlayers();
            io.emit('adminLeaderboardUpdate', sorted);
        }
    });

    socket.on('solveRound2Problem', async ({ teamId, problemIndex, code }) => {
        const player = await findTeam(teamId);
        if (player) {
            const prob = player.round2Progress.problems[problemIndex];
            if (prob && !prob.solved) {
                prob.solved = true;
                prob.score = 100;
                player.score = (player.score || 0) + 100;

                const allSolved = player.round2Progress.problems.every(p => p.solved);
                if (allSolved) {
                    player.round2Progress.status = 'completed';
                    player.round2Progress.endTime = new Date();
                    player.score += 500;
                }

                if (!useMemoryFallback) await Player.findByIdAndUpdate(player._id, {
                    round2Progress: player.round2Progress,
                    score: player.score
                });
                io.to(teamId).emit('teamUpdate', player);
                const sorted = await getSortedPlayers();
                io.emit('adminLeaderboardUpdate', sorted);
            }
        }
    });

    socket.on('awardRound2Marks', async ({ teamId, type, value }) => {
        const player = await findTeam(teamId);
        if (player) {
            if (!player.round2Marks) player.round2Marks = { bugId: 0, coord: 0 };
            player.round2Marks[type] = value;
            player.round2ManualScore = (player.round2Marks.bugId || 0) + (player.round2Marks.coord || 0);

            if (!useMemoryFallback) await Player.findByIdAndUpdate(player._id, {
                round2Marks: player.round2Marks,
                round2ManualScore: player.round2ManualScore
            });

            const sorted = await getSortedPlayers();
            io.emit('adminLeaderboardUpdate', sorted);
        }
    });

    socket.on('adminResetTeam', async (teamId) => {
        let player = await findTeam(teamId);
        if (player) {
            player.round1Progress = {
                puzzles: generatePuzzles(),
                currentPuzzle: 0,
                selectedModuleIndex: -1,
                roleSelection: player.round1Progress.roleSelection,
                lives: player.round1Progress.lives, // Preserve lives
                status: 'active',
                startTime: globalGameState.round1.startTime || null,
                endTime: null
            };
            if (!useMemoryFallback) await player.save();
            io.to(player._id.toString()).emit('teamUpdate', player);
            const sorted = await getSortedPlayers();
            io.emit('adminLeaderboardUpdate', sorted);
        }
    });
});

    app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "UP",
        service: "redcodegreencode-1",
        timestamp: new Date().toISOString()
    });
    });


app.get('/api/leaderboard', async (req, res) => {
    try {
        const allPlayers = useMemoryFallback ? playersMemory : await Player.find({});
        res.json(allPlayers);
    } catch (err) { res.status(500).json({ error: 'Failed to fetch' }); }
});

// --- STARTUP ---
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 3000 })
    .then(() => {
        console.log('✅ Connected to Atlas');
        server.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));
    })
    .catch(() => {
        console.warn('⚠️ Atlas Connection Failed. Switching to MEMORY_FALLBACK mode.');
        useMemoryFallback = true;
        server.listen(PORT, () => console.log(`🚀 Server (MEMORY_MODE) on http://localhost:${PORT}`));
    });
