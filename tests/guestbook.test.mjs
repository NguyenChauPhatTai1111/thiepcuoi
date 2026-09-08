import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { once } from 'node:events';

test('shared wishes persist and keep RSVP details private', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'wedding-test-'));
    let child;
    async function start() {
        child = spawn(process.execPath, ['server.mjs'], { env: { ...process.env, PORT: '0', WEDDING_DB: join(dir, 'test.sqlite') }, stdio: ['ignore', 'pipe', 'pipe'] });
        const [output] = await once(child.stdout, 'data');
        return 'http://127.0.0.1:' + String(output).match(/port (\d+)/)[1];
    }
    async function stop() { const done = once(child, 'exit'); child.kill(); await done; }
    try {
        let base = await start();
        const send = data => fetch(base + '/api/wishes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        assert.deepEqual(await (await fetch(base + '/api/wishes')).json(), []);
        const response = await send({ name: 'Khách thử', phone: '0901234567', attendance: 'yes', guests: '2', message: 'Trăm năm hạnh phúc! <script>test</script>' });
        assert.equal(response.status, 201);
        const wishes = await response.json();
        assert.equal(wishes[0].name, 'Khách thử');
        assert.equal(wishes[0].phone, undefined);
        assert.equal(wishes[0].attendance, undefined);
        assert.equal((await send({ name: ' ', attendance: 'yes' })).status, 400);
        assert.equal((await send({ name: 'A', attendance: 'yes', message: 'a'.repeat(2001) })).status, 400);
        assert.equal((await fetch(base + '/data/wedding.sqlite')).status, 404);
        assert.equal((await fetch(base + '/server.mjs')).status, 404);
        assert.equal((await fetch(base + '/assets/flowers.svg')).status, 200);
        await stop();
        base = await start();
        assert.deepEqual(await (await fetch(base + '/api/wishes')).json(), wishes);
    } finally {
        if (child.exitCode === null) await stop();
        assert.equal(dirname(resolve(dir)), resolve(tmpdir()));
        rmSync(dir, { recursive: true, force: true });
    }
});
