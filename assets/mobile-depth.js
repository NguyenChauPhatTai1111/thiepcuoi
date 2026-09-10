// Native scroll drives the scene; no scroll interception or motion sensors.
(() => {
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const deck = document.querySelector('.memory-deck');
    const cards = [...document.querySelectorAll('.couple-envelope, .eventgrid .card, .voice-player, .gift-envelope')];
    cards.forEach(card => card.classList.add('depth-card'));
    const visible = new Set();
    let frame = 0;
    let touch = null;
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const blocked = () => motion.matches || document.hidden || document.body.classList.contains('lock');
    function render() {
        frame = 0;
        if (blocked()) return;
        const height = innerHeight;
        const geometry = [...visible].map(area => ({ area, rect: area.getBoundingClientRect() }));
        geometry.forEach(({ area, rect }) => {
            if (area === deck) {
                const travel = Math.max(1, rect.height - height);
                const progress = clamp((height * .18 - rect.top) / (travel + height * .18), 0, 1);
                deck.style.setProperty('--deck-progress', (progress * progress * (3 - 2 * progress)).toFixed(4));
            } else {
                const progress = clamp((rect.top + rect.height / 2 - height / 2) / height, -.65, .65);
                area.style.setProperty('--depth-scroll', `${(-progress * 7).toFixed(2)}deg`);
                area.style.setProperty('--depth-lift', `${((1 - Math.abs(progress) / .65) * 10).toFixed(2)}px`);
            }
        });
        if (touch) {
            const { card, rect, x, y } = touch;
            card.style.setProperty('--depth-x', `${clamp((.5 - (y - rect.top) / rect.height) * 9, -4.5, 4.5)}deg`);
            card.style.setProperty('--depth-y', `${clamp(((x - rect.left) / rect.width - .5) * 9, -4.5, 4.5)}deg`);
            card.style.setProperty('--depth-light', `${clamp((x - rect.left) / rect.width * 100, 0, 100)}%`);
        }
    }
    function schedule() { if (!frame && !blocked()) frame = requestAnimationFrame(render); }
    function releaseTouch() {
        if (!touch) return;
        touch.card.classList.remove('depth-touch');
        ['--depth-x', '--depth-y', '--depth-light'].forEach(property => touch.card.style.removeProperty(property));
        touch = null;
    }
    const observer = new IntersectionObserver(entries => {
        entries.forEach(({ target, isIntersecting }) => {
            if (target === deck) document.body.classList.toggle('viewing-memory-deck', isIntersecting);
            if (isIntersecting) visible.add(target);
            else {
                visible.delete(target);
                if (touch?.card === target) releaseTouch();
                target.style.removeProperty('--depth-scroll');
                target.style.removeProperty('--depth-lift');
            }
        });
        schedule();
    });
    [deck, ...cards].filter(Boolean).forEach(area => observer.observe(area));
    cards.forEach(card => {
        card.addEventListener('pointerdown', event => {
            if (blocked() || !event.isPrimary || event.target.closest('a, input, select, textarea')) return;
            releaseTouch();
            touch = { card, id: event.pointerId, rect: card.getBoundingClientRect(), x: event.clientX, y: event.clientY };
            card.classList.add('depth-touch');
            schedule();
        }, { passive: true });
    });
    const deckScene = deck?.querySelector('.memory-deck-scene');
    let deckPointer = null;
    deckScene?.addEventListener('pointerdown', event => {
        if (blocked() || !event.isPrimary) return;
        const rect = deckScene.getBoundingClientRect();
        deckPointer = event.pointerId;
        deck.style.setProperty('--deck-touch-x', `${clamp((.5 - (event.clientY - rect.top) / rect.height) * 5, -2.5, 2.5)}deg`);
        deck.style.setProperty('--deck-touch-y', `${clamp(((event.clientX - rect.left) / rect.width - .5) * 7, -3.5, 3.5)}deg`);
    }, { passive: true });
    window.addEventListener('pointermove', event => {
        if (deckPointer === event.pointerId && deckScene) {
            const rect = deckScene.getBoundingClientRect();
            deck.style.setProperty('--deck-touch-x', `${clamp((.5 - (event.clientY - rect.top) / rect.height) * 5, -2.5, 2.5)}deg`);
            deck.style.setProperty('--deck-touch-y', `${clamp(((event.clientX - rect.left) / rect.width - .5) * 7, -3.5, 3.5)}deg`);
        }
        if (!touch || touch.id !== event.pointerId) return;
        touch.x = event.clientX; touch.y = event.clientY;
        schedule();
    }, { passive: true });
    function releaseDeck() {
        deckPointer = null;
        deck?.style.removeProperty('--deck-touch-x');
        deck?.style.removeProperty('--deck-touch-y');
    }
    window.addEventListener('pointerup', () => { releaseTouch(); releaseDeck(); }, { passive: true });
    window.addEventListener('pointercancel', () => { releaseTouch(); releaseDeck(); }, { passive: true });
    window.addEventListener('blur', releaseTouch);
    window.addEventListener('scroll', () => { releaseTouch(); releaseDeck(); schedule(); }, { passive: true });
    window.addEventListener('resize', () => { releaseTouch(); schedule(); }, { passive: true });
    window.addEventListener('pageshow', schedule);
    document.addEventListener('invitation:opened', schedule);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) { releaseTouch(); cancelAnimationFrame(frame); frame = 0; }
        else schedule();
    });
    new ResizeObserver(schedule).observe(document.body);
    motion.addEventListener('change', () => {
        releaseTouch(); cancelAnimationFrame(frame); frame = 0;
        deck?.style.removeProperty('--deck-progress');
        cards.forEach(card => card.style.removeProperty('--depth-scroll'));
        cards.forEach(card => card.style.removeProperty('--depth-lift'));
        releaseDeck();
        schedule();
    });
    document.querySelectorAll('[data-depth-photo]').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelector(`.album-item[data-full="${button.dataset.depthPhoto}"]`)?.click();
        });
    });
    schedule();
})();
