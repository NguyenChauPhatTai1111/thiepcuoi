// Update only on scroll/resize, and keep movement inside the image overscan.
(() => {
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const items = [
        { area: document.querySelector('.hero'), layer: document.querySelector('.hero-bg'), amount: 24 },
        { area: document.querySelector('.quote'), layer: document.querySelector('.quote'), amount: 24 },
        { area: document.querySelector('.photo'), layer: document.querySelector('.photo'), amount: 22 },
        { area: document.querySelector('#albumSlider'), layer: document.querySelector('#albumSlider'), amount: 9 }
    ].filter(item => item.area && item.layer);
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
        items.forEach((item, index) => {
            if (positions[index] !== null) item.layer.style.setProperty('--photo-shift', positions[index].toFixed(2) + 'px');
        });
    }
    function schedule() {
        if (!frame && !motion.matches && !document.hidden) frame = requestAnimationFrame(render);
    }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    document.addEventListener('visibilitychange', schedule);
    motion.addEventListener('change', () => {
        cancelAnimationFrame(frame);
        frame = 0;
        items.forEach(item => item.layer.style.removeProperty('--photo-shift'));
        schedule();
    });
    schedule();
})();
