// Run with node tests/mobile-depth.browser.mjs. Uses local Chrome, no packages.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const artifacts = await mkdtemp(resolve(tmpdir(), 'wedding-mobile-depth-'));
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg' };
const server = createServer(async (req, res) => {
    const path = resolve(root, '.' + (new URL(req.url, 'http://localhost').pathname === '/' ? '/index.html' : new URL(req.url, 'http://localhost').pathname));
    if (!path.startsWith(root.endsWith(sep) ? root : root + sep)) { res.writeHead(403).end(); return; }
    try { res.setHeader('Content-Type', mime[extname(path)] || 'application/octet-stream'); res.end(await readFile(path)); }
    catch { res.writeHead(404).end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=0', `--user-data-dir=${resolve(artifacts, 'profile')}`, 'about:blank'
], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
let socket;
try {
    const endpoint = await new Promise((done, reject) => {
        let output = '';
        const timeout = setTimeout(() => reject(new Error('Chrome startup timeout')), 20000);
        chrome.on('error', reject);
        chrome.stderr.on('data', chunk => {
            output += chunk;
            const found = output.match(/DevTools listening on (ws:\/\/\S+)/);
            if (found) { clearTimeout(timeout); done(found[1]); }
        });
    });
    socket = new WebSocket(endpoint);
    await new Promise((done, reject) => { socket.onopen = done; socket.onerror = reject; });
    let serial = 0;
    const pending = new Map(), errors = [];
    socket.onmessage = event => {
        const message = JSON.parse(event.data);
        if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
        const call = pending.get(message.id);
        if (call) { pending.delete(message.id); clearTimeout(call.timer); message.error ? call.reject(message.error) : call.done(message.result); }
    };
    const send = (method, params = {}, sessionId) => new Promise((done, reject) => {
        const id = ++serial;
        pending.set(id, { done, reject, timer: setTimeout(() => reject(new Error(method + ' timeout')), 15000) });
        socket.send(JSON.stringify({ id, method, params, sessionId }));
    });
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    const cdp = (method, params) => send(method, params, sessionId);
    const evaluate = async expression => {
        const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
        if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
        return result.result.value;
    };
    await cdp('Runtime.enable');
    await cdp('Page.enable');
    await cdp('Emulation.setTouchEmulationEnabled', { enabled: true });
    await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await cdp('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/` });
    await evaluate(`new Promise(resolve => { const check = () => document.querySelector('.depth-card') ? resolve(true) : setTimeout(check, 50); check(); })`);
    await evaluate(`document.querySelector('#open').click(); clearTimeout(openingTimer);
        document.querySelector('.loader').classList.add('hide');
        document.querySelector('#cover').getAnimations({subtree:true}).forEach(animation => {animation.pause(); animation.currentTime=5000;});`);
    for (const [width, height] of [[320,740], [390,844], [430,932], [1280,900]]) {
        await cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 900 });
        const invitation = await evaluate(`(async () => {
            await new Promise(r=>setTimeout(r,150));
            const paper=document.querySelector('.invitation-paper').getBoundingClientRect();
            const letter=document.querySelector('.invitation-letter').getBoundingClientRect();
            const children=[...document.querySelector('.invitation-letter').children].filter(el=>getComputedStyle(el).display!=='none');
            return {clipped:children.some(el=>{const r=el.getBoundingClientRect();return r.bottom>paper.bottom-2 || r.top<letter.top-1 || r.left<paper.left || r.right>paper.right}),
                nameSize:parseFloat(getComputedStyle(document.querySelector('.invitation-names')).fontSize)};
        })()`);
        assert.equal(invitation.clipped, false, `${width}: invitation text must stay inside the paper`);
        assert.ok(invitation.nameSize >= 21, `${width}: names must be readable`);
        if (width===390 || width===1280) {
            const {data}=await cdp('Page.captureScreenshot',{format:'png'});
            await writeFile(resolve(artifacts, `opening-${width}.png`), Buffer.from(data,'base64'));
        }
        console.log(`${width}: open invitation typography and paper bounds passed`);
    }
    await evaluate(`document.querySelector('#skipOpening').click(); document.dispatchEvent(new Event('invitation:pause-scroll'));`);
    for (const [width, height] of [[320, 740], [390, 844], [430, 932], [844, 390], [1280, 900]]) {
        await cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 900 });
        const layout = await evaluate(`(async () => {
            const deck = document.querySelector('.memory-deck');
            window.scrollTo({top: scrollY + deck.getBoundingClientRect().top + (deck.offsetHeight - innerHeight) * .65, behavior: 'instant'});
            await new Promise(r => setTimeout(r, 400));
            const sticky = document.querySelector('.memory-deck-sticky').getBoundingClientRect();
            return {width: innerWidth, documentWidth: document.documentElement.scrollWidth, stickyTop: sticky.top,
                transform: getComputedStyle(document.querySelector('.memory-print-left')).transform,
                progress: getComputedStyle(deck).getPropertyValue('--deck-progress')};
        })()`);
        assert.ok(layout.documentWidth <= layout.width + 1, `${width}: horizontal overflow ${JSON.stringify(layout)}`);
        assert.notEqual(layout.transform, 'none', `${width}: missing 3D transform`);
        if (height > 600) assert.ok(Math.abs(layout.stickyTop) < 2, `${width}: sticky scene not pinned ${JSON.stringify(layout)}`);
        if (width === 390) {
            await evaluate(`new Promise(r=>setTimeout(r,2000))`);
            const { data } = await cdp('Page.captureScreenshot', { format: 'png' });
            await writeFile(resolve(artifacts, 'mobile-390.png'), Buffer.from(data, 'base64'));
            const before = await evaluate('scrollY');
            await cdp('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 580 }] });
            for (const y of [550, 515, 475, 435, 395]) {
                await cdp('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y }] });
                await evaluate(`new Promise(r=>setTimeout(r,25))`);
            }
            await cdp('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
            await evaluate(`new Promise(r=>setTimeout(r,300))`);
            assert.ok(await evaluate('scrollY') > before + 50, 'Touch swipe must scroll the page over the photo cards');
            assert.equal(await evaluate(`document.querySelector('#lightbox').classList.contains('open')`), false, 'Swipe must not open a photo');
            console.log('Mobile touch swipe: native scroll preserved, no accidental photo opening');
        }
        console.log(`${width}x${height}: layout, 3D transform, sticky scene passed`);
    }
    await evaluate(`document.querySelector('.memory-print-center').click()`);
    assert.equal(await evaluate(`document.querySelector('#lightbox').classList.contains('open') && document.body.classList.contains('lock')`), true);
    await evaluate(`document.querySelector('.lightbox-close').click()`);
    const tilt = await evaluate(`(async () => {
        const card = document.querySelector('.depth-card'); card.scrollIntoView({block:'center', behavior:'instant'});
        await new Promise(r=>setTimeout(r,100)); const rect=card.getBoundingClientRect();
        card.dispatchEvent(new PointerEvent('pointerdown', {bubbles:true, pointerId:7, isPrimary:true, pointerType:'touch', clientX:rect.left+10, clientY:rect.top+10}));
        await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
        const changed=card.style.getPropertyValue('--depth-x');
        window.dispatchEvent(new PointerEvent('pointercancel', {pointerId:7}));
        return {changed, reset:!card.classList.contains('depth-touch') && !card.style.getPropertyValue('--depth-x')};
    })()`);
    assert.ok(tilt.changed); assert.ok(tilt.reset);
    await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await evaluate(`new Promise(r=>setTimeout(r,100))`);
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('.depth-card')).transform`), 'none');
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('.memory-deck-sticky')).position`), 'relative');
    assert.deepEqual(errors, []);
    await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await cdp('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/?full-opening=1` });
    const fullOpening = await evaluate(`new Promise(resolve => {
        const ready = () => {
            const button = document.querySelector('#open');
            if (!button || !document.querySelector('.loader')?.classList.contains('hide')) return setTimeout(ready, 50);
            const started = performance.now();
            button.click();
            const check = () => {
                if (!document.querySelector('#cover') && document.body.classList.contains('invite-opened')) {
                    document.dispatchEvent(new Event('invitation:pause-scroll'));
                    resolve({elapsed: performance.now() - started, heroOpacity: getComputedStyle(document.querySelector('.hero-content')).opacity});
                } else setTimeout(check, 50);
            };
            check();
        };
        ready();
    })`);
    assert.ok(fullOpening.elapsed > 7000 && fullOpening.elapsed < 10000, `Unexpected opening duration: ${fullOpening.elapsed}`);
    assert.equal(fullOpening.heroOpacity, '1');
    assert.deepEqual(errors, []);
    console.log(`Full cinematic opening completed in ${Math.round(fullOpening.elapsed)}ms.`);
    console.log('Photo lightbox, touch cancel, reduced motion and browser runtime checks passed.');
    console.log(`Screenshot: ${resolve(artifacts, 'mobile-390.png')}`);
} finally {
    socket?.close();
    chrome.kill();
    server.closeAllConnections();
    server.close();
}
