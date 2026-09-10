// Resume after two quiet minutes, or a deliberate click on page content.
(() => {
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const interactive = 'a,button,input,textarea,select,label,form,dialog,[role="dialog"],[contenteditable],#albumSlider';
    let opened = false;
    let frame = 0;
    let timer = 0;
    let lastTime = 0;
    let position = 0;
    let pointer = null;
    let lastActivity = 0;
    const pointers = new Set();
    const blocked = () => !opened || document.hidden || motion.matches || pointers.size > 0 ||
        document.body.classList.contains('lock') || document.querySelector('dialog[open],.surprise.open,.lightbox.open') ||
        document.activeElement?.matches('input,textarea,select,[contenteditable]');
    function stop() {
        cancelAnimationFrame(frame);
        clearTimeout(timer);
        frame = timer = 0;
        lastTime = 0;
    }
    function step(time) {
        frame = 0;
        if (blocked()) return;
        const elapsed = lastTime ? Math.min(time - lastTime, 64) : 0;
        lastTime = time;
        position += elapsed * .018;
        window.scrollTo({ top: position, behavior: 'instant' });
        if (window.scrollY + innerHeight < document.documentElement.scrollHeight - 2) frame = requestAnimationFrame(step);
    }
    function start() {
        stop();
        if (blocked()) return;
        position = window.scrollY;
        frame = requestAnimationFrame(step);
    }
    function pause() {
        stop();
        lastActivity = Date.now();
        if (opened) timer = setTimeout(start, 120000);
    }
    document.addEventListener('invitation:opened', () => {
        opened = true;
        timer = setTimeout(start, 1400);
    });
    window.addEventListener('wheel', pause, { passive: true });
    window.addEventListener('keydown', pause);
    window.addEventListener('pointerdown', event => {
        pointers.add(event.pointerId);
        pointer = { x: event.clientX, y: event.clientY, dragged: false };
        pause();
    }, { passive: true });
    window.addEventListener('pointermove', event => {
        if (pointer && Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) > 8) pointer.dragged = true;
        // Mouse movement also counts as activity; throttle timer updates.
        if (Date.now() - lastActivity > 200) pause();
    }, { passive: true });
    window.addEventListener('pointerup', event => { pointers.delete(event.pointerId); pause(); }, { passive: true });
    window.addEventListener('pointercancel', event => { pointers.delete(event.pointerId); pointer = null; pause(); }, { passive: true });
    document.addEventListener('click', event => {
        if (!opened || event.target.closest(interactive) || pointer?.dragged || window.getSelection()?.toString()) return;
        start();
    });
    document.addEventListener('focusin', event => { if (event.target.closest(interactive)) pause(); });
    document.addEventListener('focusout', pause);
    document.addEventListener('invitation:pause-scroll', pause);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else pause(); });
    motion.addEventListener('change', () => { if (motion.matches) stop(); else pause(); });
})();
