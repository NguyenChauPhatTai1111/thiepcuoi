// Update only on scroll/resize, and keep movement inside the image overscan.
(() => {
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const items = [
        { area: document.querySelector('.hero'), layer: document.querySelector('.hero-bg'), amount: 24 },
        { area: document.querySelector('.quote'), layer: document.querySelector('.quote'), amount: 24 },
        { area: document.querySelector('.photo'), layer: document.querySelector('.photo'), amount: 22 },
        { area: document.querySelector('#albumSlider'), layer: document.querySelector('#albumSlider'), amount: 9 }
    ].filter(item => item.area && item.layer);
    const memories = [
        ['.intro', 'd76767fa5ebedee087af5.jpg', 'center 62%', 'right'],
        ['.names', '1a4e30d0099489cad0854.jpg', 'center 40%', 'left'],
        ['.event', '299dd102e846681831573.jpg', 'center 50%', 'right'],
        ['.itinerary', 'a12a15b32cf7aca9f5e62.jpg', 'center 48%', 'left'],
        ['.countdown', 'd76767fa5ebedee087af5.jpg', 'center 66%', ''],
        ['.scratch-section', '19e4f461cd254d7b14341.jpg', 'center 40%', 'right'],
        ['.groom-voice', '1a4e30d0099489cad0854.jpg', 'center 46%', 'left'],
        ['.album', '299dd102e846681831573.jpg', 'center 48%', ''],
        ['.gift', 'a12a15b32cf7aca9f5e62.jpg', 'center 52%', 'right'],
        ['.rsvp', 'd76767fa5ebedee087af5.jpg', 'center 62%', 'left']
    ].flatMap(([selector, photo, position, side]) => {
        const area = document.querySelector(selector);
        if (!area) return [];
        const layer = document.createElement('div');
        layer.className = 'section-memory';
        layer.setAttribute('aria-hidden', 'true');
        const img = document.createElement('img');
        img.alt = '';
        img.decoding = 'async';
        img.loading = 'lazy';
        img.src = `assets/${photo}`;
        layer.append(img);
        area.prepend(layer);
        area.classList.add('memory-section');
        if (side) area.classList.add(`memory-${side}`);
        area.style.setProperty('--memory-position', position);
        return [{ area }];
    });
    const visibleMemories = new Set();
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) visibleMemories.add(entry.target);
            else {
                visibleMemories.delete(entry.target);
                entry.target.style.removeProperty('--memory-opacity');
                entry.target.style.removeProperty('--memory-shift');
            }
        });
        schedule();
    }, { rootMargin: '80px 0px' });
    memories.forEach(({ area }) => observer.observe(area));
    let frame = 0;
    function render() {
        frame = 0;
        if (motion.matches || document.hidden) return;
        const height = window.innerHeight;
        const mobile = window.innerWidth <= 700 ? .65 : 1;
        // Read all geometry before applying styles.
        const positions = items.map(item => {
            const rect = item.area.getBoundingClientRect();
            if (rect.bottom < 0 || rect.top > height) return null;
            const progress = (height / 2 - (rect.top + rect.height / 2)) / ((height + rect.height) / 2);
            return Math.max(-1, Math.min(1, progress)) * item.amount * mobile;
        });
        const clamp = value => Math.max(0, Math.min(1, value));
        const smooth = value => value * value * (3 - 2 * value);
        const memoryPositions = [...visibleMemories].map(area => {
            const rect = area.getBoundingClientRect();
            // Fade both on entry and exit, so scrolling back reveals the photo again.
            const edge = Math.min(height * .65, rect.height * .75);
            const opacity = smooth(clamp((height - rect.top) / edge)) * smooth(clamp(rect.bottom / edge));
            const progress = clamp((height - rect.top) / (height + rect.height));
            return { area, opacity, shift: (progress - .5) * 56 * mobile };
        });
        items.forEach((item, index) => {
            if (positions[index] !== null) item.layer.style.setProperty('--photo-shift', positions[index].toFixed(2) + 'px');
        });
        memoryPositions.forEach(({ area, opacity, shift }) => {
            area.style.setProperty('--memory-opacity', opacity.toFixed(3));
            area.style.setProperty('--memory-shift', `${shift.toFixed(2)}px`);
        });
    }
    function schedule() {
        if (!frame && !motion.matches && !document.hidden) frame = requestAnimationFrame(render);
    }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    document.addEventListener('visibilitychange', schedule);
    document.addEventListener('invitation:opened', schedule);
    window.addEventListener('pageshow', schedule);
    window.addEventListener('load', schedule);
    new ResizeObserver(schedule).observe(document.body);
    motion.addEventListener('change', () => {
        cancelAnimationFrame(frame);
        frame = 0;
        items.forEach(item => item.layer.style.removeProperty('--photo-shift'));
        memories.forEach(({ area }) => {
            area.style.removeProperty('--memory-opacity');
            area.style.removeProperty('--memory-shift');
        });
        schedule();
    });
    schedule();
})();
