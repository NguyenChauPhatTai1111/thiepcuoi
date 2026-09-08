import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const databasePath = process.env.WEDDING_DB || resolve(root, 'data/wedding.sqlite');
mkdirSync(dirname(databasePath), { recursive: true });
const db = new DatabaseSync(databasePath);
db.exec(`PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS responses (
        id INTEGER PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL,
        attendance TEXT NOT NULL, guests INTEGER, message TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
const list = db.prepare("SELECT id, name, message, created_at FROM responses WHERE message != '' ORDER BY id DESC");
const insert = db.prepare('INSERT INTO responses (name, phone, attendance, guests, message) VALUES (?, ?, ?, ?, ?)');
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg' };
function json(res, status, body) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(JSON.stringify(body));
}
const server = http.createServer(async (req, res) => {
    try {
        const pathname = new URL(req.url, 'http://localhost').pathname;
        if (pathname === '/api/wishes') {
            if (req.method === 'GET') return json(res, 200, list.all());
            if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
            if (!req.headers['content-type']?.startsWith('application/json')) return json(res, 415, { error: 'JSON required' });
            let body = '';
            for await (const chunk of req) {
                body += chunk;
                if (Buffer.byteLength(body) > 16000) return json(res, 413, { error: 'Message too long' });
            }
            let data;
            try { data = JSON.parse(body); } catch { return json(res, 400, { error: 'Invalid JSON' }); }
            if (!data || typeof data !== 'object') return json(res, 400, { error: 'Invalid response' });
            const { name, phone = '', attendance, guests = '', message = '' } = data;
            if (typeof name !== 'string' || !name.trim() || name.length > 100 ||
                typeof phone !== 'string' || phone.length > 30 ||
                typeof message !== 'string' || message.length > 2000 ||
                !['yes', 'no'].includes(attendance) ||
                (guests !== '' && (!Number.isInteger(Number(guests)) || Number(guests) < 1 || Number(guests) > 10))) {
                return json(res, 400, { error: 'Invalid response' });
            }
            insert.run(name.trim(), phone.trim(), attendance, guests === '' ? null : Number(guests), message.trim());
            return json(res, 201, list.all());
        }
        if (!['GET', 'HEAD'].includes(req.method)) return json(res, 405, { error: 'Method not allowed' });
        // Only public invitation assets are served; the guest database stays private.
        const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
        if (relative !== 'index.html' && !/^assets\/[a-zA-Z0-9_.-]+$/.test(relative)) return json(res, 404, { error: 'Not found' });
        let content;
        try { content = readFileSync(resolve(root, relative)); } catch { return json(res, 404, { error: 'Not found' }); }
        res.writeHead(200, { 'Content-Type': mime[extname(relative)] || 'application/octet-stream', 'Content-Length': content.length, 'X-Content-Type-Options': 'nosniff' });
        res.end(req.method === 'HEAD' ? undefined : content);
    } catch (error) {
        console.error(error.message);
        if (!res.headersSent) json(res, 500, { error: 'Unable to save response' });
        else res.end();
    }
});
server.listen(Number(process.env.PORT || 3000), process.env.HOST || '127.0.0.1', () => {
    console.log('Wedding invitation listening on port ' + server.address().port);
});
