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
        roleSelection: { member1: String, member2: String },
        puzzles: [{
            puzzleType: String,
            solved: { type: Boolean, default: false },
            data: mongoose.Schema.Types.Mixed
        }]
    },
    round2Progress: { code: { type: String, default: '' }, status: { type: String, default: 'waiting' } },
    score: { type: Number, default: 0 },
    registrationTime: { type: Date, default: Date.now }
});

const Player = mongoose.model('Player', playerSchema);

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
                selectedModuleIndex: 0,
                roleSelection: { member1: null, member2: null },
                lives: 3,
                status: 'active'
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

app.get('/api/leaderboard', async (req, res) => {
    if (useMemoryFallback) return res.json(memoryPlayers);
    const players = await Player.find().sort({ score: -1 });
    res.json(players);
});

// --- SOCKETS ---
let globalGameState = { status: 'GREEN', isStarted: false };
io.on('connection', (socket) => {
    socket.emit('gameUpdate', globalGameState);
    socket.on('joinTeam', (teamId) => socket.join(teamId));
    socket.on('toggleRedLight', (data) => {
        globalGameState.status = data.status;
        io.emit('gameUpdate', globalGameState);
    });

    socket.on('selectRole', async ({ teamId, memberIndex, role }) => {
        const player = await findTeam(teamId);
        if (player) {
            if (!player.round1Progress.roleSelection) player.round1Progress.roleSelection = { member1: null, member2: null };

            if (memberIndex === 0) player.round1Progress.roleSelection.member1 = role;
            else player.round1Progress.roleSelection.member2 = role;

            if (!useMemoryFallback) await Player.findByIdAndUpdate(player._id, { 'round1Progress.roleSelection': player.round1Progress.roleSelection });
            io.to(teamId).emit('teamUpdate', player);
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
            console.log(`[PUZZLE_SUBMIT] Team: ${player.teamName}, Index: ${puzzleIndex}, Success: ${success}`);

            if (success) {
                if (!player.round1Progress.puzzles[puzzleIndex].solved) {
                    player.round1Progress.puzzles[puzzleIndex].solved = true;
                    // Count how many are solved
                    const solvedCount = player.round1Progress.puzzles.filter(p => p.solved).length;
                    if (solvedCount >= player.round1Progress.puzzles.length) {
                        player.round1Progress.status = 'completed';
                    }
                }
            } else {
                player.round1Progress.lives -= 1;
                if (player.round1Progress.lives <= 0) {
                    player.round1Progress.status = 'exploded';
                } else {
                    // Reset the specific module logic
                    const pType = player.round1Progress.puzzles[puzzleIndex].puzzleType;
                    if (pType === 'grid_number') {
                        player.round1Progress.puzzles[puzzleIndex].data = getRandomPattern();
                    } else if (pType === 'memory') {
                        player.round1Progress.puzzles[puzzleIndex].data = { displays: Array(4).fill(0).map(() => Math.floor(Math.random() * 3) + 1) };
                    } else if (pType === 'advanced_wires') {
                        const wireColors = ['red', 'blue', 'yellow', 'white', 'black'];
                        const config = Array(5).fill(0).map(() => wireColors[Math.floor(Math.random() * 5)]);
                        player.round1Progress.puzzles[puzzleIndex].data = { wires: config, solution: getAdvancedWireSolution(config) };
                    }
                }
            }
            if (!useMemoryFallback) await Player.findByIdAndUpdate(player._id, { round1Progress: player.round1Progress });
            io.to(teamId).emit('teamUpdate', player);
            const allPlayers = useMemoryFallback ? playersMemory : await Player.find({});
            io.emit('adminLeaderboardUpdate', allPlayers);
        }
    });

    socket.on('adminStartEvent', () => {
        globalGameState.isStarted = true;
        io.emit('globalStateUpdate', globalGameState);
        console.log('[ADMIN] Event Started');
    });

    socket.on('adminResetTeam', async (teamId) => {
        let player = await findTeam(teamId); // This might find by ID
        if (!player && useMemoryFallback) {
            // If passed as name by mistake, handle it
            player = playersMemory.find(p => p.teamName === teamId);
        } else if (!player && !useMemoryFallback) {
            player = await Player.findOne({ teamName: teamId });
        }

        if (player) {
            player.round1Progress = {
                puzzles: generatePuzzles(),
                currentPuzzle: 0,
                selectedModuleIndex: 0,
                roleSelection: { member1: null, member2: null },
                lives: 3,
                status: 'active',
                startTime: null
            };
            if (!useMemoryFallback) await Player.findByIdAndUpdate(player._id, { round1Progress: player.round1Progress });
            io.to(player._id || player.teamId).emit('teamUpdate', player);
            const allPlayers = useMemoryFallback ? playersMemory : await Player.find({});
            io.emit('adminLeaderboardUpdate', allPlayers);
            console.log(`[ADMIN] Reset team: ${player.teamName}`);
        }
    });
});

app.get('/api/leaderboard', async (req, res) => {
    try {
        const allPlayers = useMemoryFallback ? playersMemory : await Player.find({});
        res.json(allPlayers);
    } catch (err) { res.status(500).json({ error: 'Failed to fetch' }); }
});

// --- STARTUP ---
const PORT = 5000;
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
