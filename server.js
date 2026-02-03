import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());

// Helper to read DB
const readDb = () => {
    if (!fs.existsSync(DB_FILE)) {
        return { catalog: [] };
    }
    const data = fs.readFileSync(DB_FILE);
    try {
        return JSON.parse(data);
    } catch (err) {
        return { catalog: [] };
    }
};

// Helper to write DB
const writeDb = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// GET Catalog
app.get('/api/catalog', (req, res) => {
    const db = readDb();
    res.json(db.catalog);
});

// POST Add to Catalog
app.post('/api/catalog', (req, res) => {
    const { name, section } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }

    const db = readDb();
    const newItem = {
        id: Date.now(),
        name,
        section: section || 'Fridge'
    };

    db.catalog.push(newItem);
    writeDb(db);
    res.json(newItem);
});

// DELETE from Catalog
app.delete('/api/catalog/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const db = readDb();

    db.catalog = db.catalog.filter(item => item.id !== id);
    writeDb(db);
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
