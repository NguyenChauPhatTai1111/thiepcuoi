// Layered album: center photo opens; side photos rotate into the center.
const albumSlider = document.querySelector('#albumSlider');
const carouselCards = [...albumSlider.querySelectorAll('.album-item')];
const albumDots = document.querySelector('#albumDots');
let albumCurrent = 0;
let albumDrag = null;
let suppressAlbumClick = false;
const carouselDots = carouselCards.map((card, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', 'Xem ảnh ' + (index + 1));
    dot.addEventListener('click', () => selectAlbumPhoto(index));
    albumDots.append(dot);
    return dot;
});
function albumOffset(index, current, count) {
    const half = Math.floor(count / 2);
    return ((index - current + half + count) % count) - half;
}
function selectAlbumPhoto(index) {
    albumCurrent = (index + carouselCards.length) % carouselCards.length;
    carouselCards.forEach((card, i) => {
        const offset = albumOffset(i, albumCurrent, carouselCards.length);
        const depth = Math.abs(offset);
        card.style.transform = 'translateX(' + (offset * 60) + '%) translateZ(' +
            (-depth * 150) + 'px) rotateY(' + (offset * 45) + 'deg) scale(' +
            (depth === 0 ? 1 : depth === 1 ? .85 : .7) + ')';
        card.style.opacity = depth === 0 ? '1' : depth === 1 ? '.75' : '.5';
        card.style.zIndex = 10 - depth;
        card.classList.toggle('is-current', offset === 0);
        card.setAttribute('aria-label', (offset === 0 ? 'Phóng lớn: ' : 'Chọn ảnh: ') + card.querySelector('img').alt);
        carouselDots[i].setAttribute('aria-current', String(offset === 0));
    });
    document.querySelector('#albumPosition').textContent = (albumCurrent + 1) + ' / ' + carouselCards.length;
}
document.querySelector('#albumPrev').addEventListener('click', () => selectAlbumPhoto(albumCurrent - 1));
document.querySelector('#albumNext').addEventListener('click', () => selectAlbumPhoto(albumCurrent + 1));
albumSlider.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary) return;
    suppressAlbumClick = false;
    albumDrag = { x: event.clientX, y: event.clientY, id: event.pointerId };
});
albumSlider.addEventListener('pointermove', event => {
    if (!albumDrag || event.pointerId !== albumDrag.id) return;
    const dx = event.clientX - albumDrag.x;
    if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(event.clientY - albumDrag.y)) {
        suppressAlbumClick = true;
        albumSlider.setPointerCapture(event.pointerId);
    }
});
window.addEventListener('pointerup', event => {
    if (!albumDrag || event.pointerId !== albumDrag.id) return;
    const dx = event.clientX - albumDrag.x;
    if (suppressAlbumClick && Math.abs(dx) > 35) selectAlbumPhoto(albumCurrent + (dx < 0 ? 1 : -1));
    albumDrag = null;
});
albumSlider.addEventListener('pointercancel', () => { albumDrag = null; });
albumSlider.addEventListener('dragstart', event => event.preventDefault());
albumSlider.addEventListener('click', event => {
    if (suppressAlbumClick && event.detail !== 0) {
        event.preventDefault();
        event.stopImmediatePropagation();
        suppressAlbumClick = false;
        return;
    }
    const card = event.target.closest('.album-item');
    const index = carouselCards.indexOf(card);
    if (index >= 0 && index !== albumCurrent) {
        event.stopImmediatePropagation();
        selectAlbumPhoto(index);
    }
}, true);
albumSlider.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    selectAlbumPhoto(event.key === 'Home' ? 0 : event.key === 'End' ? carouselCards.length - 1 :
        albumCurrent + (event.key === 'ArrowRight' ? 1 : -1));
});
// Normalize wheel units and limit each transition to one photo.
let albumWheelTotal = 0;
let albumWheelLast = -Infinity;
let albumWheelChanged = -Infinity;
albumSlider.addEventListener('wheel', event => {
    if (event.ctrlKey || event.metaKey || carouselCards.length < 2) return;
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (!delta) return;
    event.preventDefault();
    const now = performance.now();
    if (now - albumWheelLast > 180 || Math.sign(delta) !== Math.sign(albumWheelTotal)) albumWheelTotal = 0;
    albumWheelLast = now;
    if (now - albumWheelChanged < 850) return;
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? albumSlider.clientHeight : 1;
    albumWheelTotal += delta * unit;
    if (Math.abs(albumWheelTotal) < 30) return;
    selectAlbumPhoto(albumCurrent + Math.sign(albumWheelTotal));
    albumWheelTotal = 0;
    albumWheelChanged = now;
}, { passive: false });
selectAlbumPhoto(0);

// Slow reading pace; user interaction always takes priority.
const autoScrollToggle = document.querySelector('#autoScrollToggle');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let autoScrolling = false;
let autoScrollFrame = 0;
let autoScrollStart = 0;
let lastScrollTime = 0;
let scrollPosition = 0;
function stopAutoScroll() {
    clearTimeout(autoScrollStart);
    cancelAnimationFrame(autoScrollFrame);
    autoScrolling = false;
    autoScrollToggle.textContent = 'Tự cuộn ↓';
    autoScrollToggle.setAttribute('aria-pressed', 'false');
}
function stepAutoScroll(time) {
    if (!autoScrolling) return;
    if (document.hidden || document.body.classList.contains('lock')) {
        stopAutoScroll();
        return;
    }
    const elapsed = lastScrollTime ? Math.min(time - lastScrollTime, 64) : 0;
    lastScrollTime = time;
    scrollPosition += elapsed * .018;
    window.scrollTo({ top: scrollPosition, behavior: 'instant' });
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
        stopAutoScroll();
        return;
    }
    autoScrollFrame = requestAnimationFrame(stepAutoScroll);
}
function startAutoScroll() {
    stopAutoScroll();
    autoScrolling = true;
    scrollPosition = window.scrollY;
    lastScrollTime = 0;
    autoScrollToggle.textContent = 'Tạm dừng Ⅱ';
    autoScrollToggle.setAttribute('aria-pressed', 'true');
    autoScrollFrame = requestAnimationFrame(stepAutoScroll);
}
document.querySelector('#open').addEventListener('click', () => {
    autoScrollToggle.hidden = false;
    if (!reducedMotion.matches) autoScrollStart = setTimeout(startAutoScroll, 3500);
});
autoScrollToggle.addEventListener('click', () => autoScrolling ? stopAutoScroll() : startAutoScroll());
window.addEventListener('wheel', stopAutoScroll, { passive: true });
window.addEventListener('pointerdown', event => {
    if (!event.target.closest('#autoScrollToggle')) stopAutoScroll();
}, { passive: true });
window.addEventListener('keydown', event => {
    if (!event.target.closest('#autoScrollToggle')) stopAutoScroll();
});
document.addEventListener('visibilitychange', () => { if (document.hidden) stopAutoScroll(); });
reducedMotion.addEventListener('change', stopAutoScroll);

const cover = document.querySelector('#cover');
addEventListener('load', () => setTimeout(() => document.querySelector('.loader').classList.add('hide'), 600));
document.querySelector('#open').onclick = () => { cover.classList.add('open'); document.body.classList.remove('lock'); setTimeout(() => cover.remove(), 1300) }; const ob = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('show'); ob.unobserve(e.target) } }), { threshold: .14 }); document.querySelectorAll('.reveal').forEach(x => ob.observe(x)); const wedding = new Date('2026-12-12T16:30:00+07:00'); function tick() { let d = Math.max(0, wedding - new Date()), v = [Math.floor(d / 864e5), Math.floor(d / 36e5) % 24, Math.floor(d / 6e4) % 60, Math.floor(d / 1e3) % 60];['days', 'hours', 'mins', 'secs'].forEach((x, i) => document.querySelector('#' + x).textContent = String(v[i]).padStart(i ? 2 : 3, '0')) } tick(); setInterval(tick, 1000); document.querySelector('#form').onsubmit = e => { e.preventDefault(); let t = document.querySelector('#toast'); t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3500); e.target.reset() }

document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', async () => {
            const original = button.textContent;
            try {
                await navigator.clipboard.writeText(button.dataset.copy);
                button.textContent = 'Đã sao chép ✓';
            } catch {
                button.textContent = button.dataset.copy;
            }
            setTimeout(() => button.textContent = original, 2500);
        }));

const secretInvite = document.querySelector('#secretInvite');
        const surprise = document.querySelector('#surprise');
        const voiceState = document.querySelector('#voiceState');
        let secretTimer;

        document.querySelector('#open').addEventListener('click', () => {
            document.body.classList.add('invite-opened');
            secretTimer = setTimeout(() => secretInvite.classList.add('show'), innerWidth <= 700 ? 1700 : 4500);


        });

        function speakThanks() {
            // ================================================================
            // NHÚNG GIỌNG THẬT TẠI: assets/loi-cam-on.mp3
            // Chỉ cần chép MP3 vào thư mục assets. Nếu chưa có file,
            // thiệp tự chuyển sang giọng máy tiếng Việt vi-VN bên dưới.
            // ================================================================
            const recordedThanks = document.querySelector('#thankYouAudio');
            if (recordedThanks && recordedThanks.readyState > 0) {
                if (playing) setMusicVolume(8);
                recordedThanks.currentTime = 0;
                recordedThanks.onplay = () => voiceState.textContent = 'Phát Tài và Mỹ Nhàn đang gửi lời cảm ơn…';
                recordedThanks.onended = () => {
                    voiceState.textContent = 'Hẹn gặp bạn tại ngày chung đôi ♡';
                    if (playing) setMusicVolume(100);
                };
                recordedThanks.play().catch(() => speakVietnameseFallback());
                return;
            }
            speakVietnameseFallback();
        }

        function speakVietnameseFallback() {
            if (!('speechSynthesis' in window)) {
                voiceState.textContent = 'Lời cảm ơn từ Phát Tài & Mỹ Nhàn ♡';
                return;
            }
            speechSynthesis.cancel();
            const musicWasPlaying = playing;
            if (musicWasPlaying) setMusicVolume(8);
            voiceState.textContent = 'Phát Tài và Mỹ Nhàn đang gửi lời cảm ơn…';
            const lines = [
                'Phát Tài và Mỹ Nhàn, xin chân thành cảm ơn bạn.',
                'Cảm ơn bạn, đã dành thời gian đến chung vui cùng chúng mình.',
                'Sự hiện diện, và tình cảm của bạn, chính là món quà ý nghĩa nhất, trong ngày đặc biệt này.',
                'Hẹn gặp bạn, tại ngày chung đôi nhé!'
            ];
            const voices = speechSynthesis.getVoices();
            // Ưu tiên giọng Google Tiếng Việt trên Chrome/Android.
            // Link translate.google.com là trang web, không phải file audio để nhúng trực tiếp.
            const vietnameseVoice = voices.find(voice =>
                voice.lang.toLowerCase().startsWith('vi') && voice.name.toLowerCase().includes('google')
            ) || voices.find(voice =>
                voice.lang.toLowerCase() === 'vi-vn' && voice.name.toLowerCase().includes('tiếng việt')
            ) || voices.find(voice => voice.lang.toLowerCase() === 'vi-vn')
                || voices.find(voice => voice.lang.toLowerCase().startsWith('vi'));
            let index = 0;
            function speakNextLine() {
                if (index >= lines.length) {
                    voiceState.textContent = 'Hẹn gặp bạn tại ngày chung đôi ♡';
                    if (musicWasPlaying) setMusicVolume(100);
                    return;
                }
                const message = new SpeechSynthesisUtterance(lines[index++]);
                message.lang = 'vi-VN'; message.rate = .72; message.pitch = 1; message.volume = 1;
                if (vietnameseVoice) message.voice = vietnameseVoice;
                message.onend = () => setTimeout(speakNextLine, 380);
                message.onerror = () => setTimeout(speakNextLine, 250);
                speechSynthesis.speak(message);
            }
            setTimeout(speakNextLine, 250);
        }

        secretInvite.addEventListener('click', () => {
            clearTimeout(secretTimer); secretInvite.classList.remove('show');
            surprise.classList.add('open'); surprise.setAttribute('aria-hidden', 'false');
            document.body.classList.add('lock'); setTimeout(speakThanks, 650);
        });
        document.querySelector('#mobileSecretTrigger')?.addEventListener('click', () => secretInvite.click());

        function closeSurprise() {
            surprise.classList.remove('open'); surprise.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('lock');
            if ('speechSynthesis' in window) speechSynthesis.cancel();
            const recordedThanks = document.querySelector('#thankYouAudio');
            if (recordedThanks) { recordedThanks.pause(); recordedThanks.currentTime = 0; }
            setMusicVolume(100);
            if (playing) setMusicVolume(100);
            setTimeout(() => secretInvite.classList.add('show'), 650);
        }
        document.querySelector('#surpriseClose').addEventListener('click', closeSurprise);
        document.addEventListener('keydown', event => { if (event.key === 'Escape' && surprise.classList.contains('open')) closeSurprise(); });


const groomVoice = document.querySelector('#groomVoice');
        const groomVoiceButton = document.querySelector('#groomVoiceButton');
        const groomVoicePlayer = document.querySelector('#groomVoicePlayer');
        const groomVoiceTime = document.querySelector('#groomVoiceTime');
        function formatAudioTime(seconds) {
            if (!Number.isFinite(seconds)) return '00:00';
            return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
        }
        groomVoiceButton.addEventListener('click', () => {
            if (groomVoice.paused) {
                if ('speechSynthesis' in window) speechSynthesis.cancel();
                setMusicVolume(8); groomVoice.play();
            } else {
                groomVoice.pause(); setMusicVolume(100);
            }
        });
        groomVoice.addEventListener('play', () => { groomVoicePlayer.classList.add('playing'); groomVoiceButton.textContent = 'Ⅱ'; });
        groomVoice.addEventListener('pause', () => { groomVoicePlayer.classList.remove('playing'); groomVoiceButton.textContent = '▶'; });
        groomVoice.addEventListener('timeupdate', () => groomVoiceTime.textContent = `${formatAudioTime(groomVoice.currentTime)} / ${formatAudioTime(groomVoice.duration)}`);
        groomVoice.addEventListener('ended', () => { setMusicVolume(100); groomVoice.currentTime = 0; });

        const albumItems = [...document.querySelectorAll('.album-item')];
        const lightbox = document.querySelector('#lightbox');
        const lightboxImage = document.querySelector('#lightboxImage');
        const lightboxCount = document.querySelector('#lightboxCount');
        let currentPhoto = 0;
        function showPhoto(index) {
            currentPhoto = (index + albumItems.length) % albumItems.length;
            lightboxImage.src = albumItems[currentPhoto].dataset.full;
            lightboxImage.alt = albumItems[currentPhoto].querySelector('img').alt;
            lightboxCount.textContent = `${String(currentPhoto + 1).padStart(2, '0')} / ${String(albumItems.length).padStart(2, '0')}`;
        }
        function openLightbox(index) { showPhoto(index); lightbox.classList.add('open'); document.body.classList.add('lock'); }
        function closeLightbox() { lightbox.classList.remove('open'); document.body.classList.remove('lock'); }
        albumItems.forEach((item, index) => item.addEventListener('click', () => openLightbox(index)));
        document.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
        document.querySelector('.lightbox-prev').addEventListener('click', () => showPhoto(currentPhoto - 1));
        document.querySelector('.lightbox-next').addEventListener('click', () => showPhoto(currentPhoto + 1));
        lightbox.addEventListener('click', event => { if (event.target === lightbox) closeLightbox(); });
        document.addEventListener('keydown', event => {
            if (!lightbox.classList.contains('open')) return;
            if (event.key === 'Escape') closeLightbox();
            if (event.key === 'ArrowLeft') showPhoto(currentPhoto - 1);
            if (event.key === 'ArrowRight') showPhoto(currentPhoto + 1);
        });

const heartLayer = document.querySelector('#heartLayer');
        const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
        let heartsStarted = false;

        function createFloatingHeart() {
            if (reduceMotion || document.hidden) return;
            const heart = document.createElement('span');
            heart.className = `floating-heart ${Math.random() > .72 ? 'gold' : Math.random() > .7 ? 'cream' : ''}`;
            heart.textContent = Math.random() > .55 ? '♡' : '♥';
            heart.style.left = `${4 + Math.random() * 92}%`;
            heart.style.fontSize = `${20 + Math.random() * 20}px`;
            heart.style.setProperty('--duration', `${8 + Math.random() * 7}s`);
            heart.style.setProperty('--sway', `${-55 + Math.random() * 110}px`);
            heart.style.setProperty('--rotate', `${-50 + Math.random() * 100}deg`);
            heartLayer.appendChild(heart);
            heart.addEventListener('animationend', () => heart.remove());
        }

        function startFloatingHearts() {
            if (heartsStarted || reduceMotion) return;
            heartsStarted = true;
            createFloatingHeart();
            setInterval(createFloatingHeart, innerWidth < 700 ? 1650 : 1100);
        }

        function burstHearts(x, y, amount = 7) {
            if (reduceMotion) return;
            for (let i = 0; i < amount; i++) {
                const heart = document.createElement('span');
                const angle = (Math.PI * 2 * i / amount) + Math.random() * .45;
                const distance = 35 + Math.random() * 55;
                heart.className = 'heart-burst';
                heart.textContent = i % 2 ? '♡' : '♥';
                heart.style.left = `${x}px`; heart.style.top = `${y}px`;
                heart.style.setProperty('--x', `${Math.cos(angle) * distance}px`);
                heart.style.setProperty('--y', `${Math.sin(angle) * distance - 20}px`);
                heart.style.setProperty('--r', `${-60 + Math.random() * 120}deg`);
                heart.style.setProperty('--size', `${11 + Math.random() * 10}px`);
                document.body.appendChild(heart);
                heart.addEventListener('animationend', () => heart.remove());
            }
        }

        let lastTrailHeart = 0;
        let lastTrailX = -100;
        let lastTrailY = -100;

        function createTrailHeart(x, y, isTouch) {
            const heart = document.createElement('span');
            heart.className = `heart-trail${isTouch ? ' touch' : ''}`;
            heart.textContent = Math.random() > .45 ? '♥' : '♡';
            heart.style.left = `${x}px`;
            heart.style.top = `${y}px`;
            heart.style.setProperty('--trail-x', `${-18 + Math.random() * 36}px`);
            heart.style.setProperty('--trail-r', `${-28 + Math.random() * 56}deg`);
            heart.style.setProperty('--trail-size', `${isTouch ? 18 + Math.random() * 10 : 15 + Math.random() * 9}px`);
            document.body.appendChild(heart);
            heart.addEventListener('animationend', () => heart.remove());
        }

        document.addEventListener('pointermove', event => {
            if (reduceMotion || !document.body.classList.contains('invite-opened')) return;
            const isTouch = event.pointerType === 'touch';
            const now = performance.now();
            const minDelay = isTouch ? 95 : 65;
            const distance = Math.hypot(event.clientX - lastTrailX, event.clientY - lastTrailY);
            if (now - lastTrailHeart < minDelay || distance < (isTouch ? 14 : 9)) return;
            lastTrailHeart = now;
            lastTrailX = event.clientX;
            lastTrailY = event.clientY;
            createTrailHeart(event.clientX, event.clientY, isTouch);
        }, { passive: true });

        function prepareTypedText(element) {
            if (reduceMotion || element.dataset.typedReady) return;
            element.dataset.typedReady = 'true';
            element.setAttribute('aria-label', element.innerText.replace(/\s+/g, ' ').trim());
            let characterIndex = 0;
            const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
            const textNodes = [];
            while (walker.nextNode()) textNodes.push(walker.currentNode);

            textNodes.forEach(node => {
                if (!node.nodeValue.trim()) return;
                const fragment = document.createDocumentFragment();
                Array.from(node.nodeValue).forEach(character => {
                    const span = document.createElement('span');
                    span.className = 'typed-character';
                    span.setAttribute('aria-hidden', 'true');
                    span.textContent = character === ' ' ? '\u00a0' : character;
                    span.style.setProperty('--character-delay', `${Math.min(characterIndex * 38, 1700)}ms`);
                    fragment.appendChild(span);
                    characterIndex++;
                });
                node.replaceWith(fragment);
            });
        }

        const typedTexts = document.querySelectorAll('main h1, main h2, main h3, main .eyebrow, footer h2, footer .eyebrow');
        typedTexts.forEach(prepareTypedText);
        if (!reduceMotion) {
            const typingObserver = new IntersectionObserver(entries => entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('typing-visible');
                typingObserver.unobserve(entry.target);
            }), { threshold: .35, rootMargin: '0px 0px -6% 0px' });
            const startTyping = () => typedTexts.forEach(element => typingObserver.observe(element));
            document.querySelector('#open').addEventListener('click', startTyping, { once: true });
        }

        document.querySelector('#open').addEventListener('click', event => {
            startFloatingHearts();
            const box = event.currentTarget.getBoundingClientRect();
            burstHearts(box.left + box.width / 2, box.top + box.height / 2, 12);
        });
        document.addEventListener('click', event => {
            const target = event.target.closest('button,.album-item,.outline,.submit');
            if (!target || target.id === 'open') return;
            burstHearts(event.clientX, event.clientY, target.classList.contains('album-item') ? 10 : 6);
        });

const scratchCard = document.querySelector('#scratchCard');
const scratchCanvas = document.querySelector('#scratchCanvas');
if (scratchCard && scratchCanvas) {
    const scratchContext = scratchCanvas.getContext('2d', { willReadFrequently: true });
    let scratching = false;
    let scratchMoves = 0;
    let scratchRevealed = false;

    function paintScratchCover() {
        if (scratchRevealed) return;
        const rect = scratchCard.getBoundingClientRect();
        const ratio = Math.min(devicePixelRatio || 1, 2);
        scratchCanvas.width = Math.round(rect.width * ratio);
        scratchCanvas.height = Math.round(rect.height * ratio);
        scratchContext.setTransform(ratio, 0, 0, ratio, 0, 0);
        const gradient = scratchContext.createLinearGradient(0, 0, rect.width, rect.height);
        gradient.addColorStop(0, '#c6ad7e'); gradient.addColorStop(.5, '#e2cfaa'); gradient.addColorStop(1, '#aa8d60');
        scratchContext.globalCompositeOperation = 'source-over';
        scratchContext.fillStyle = gradient; scratchContext.fillRect(0, 0, rect.width, rect.height);
        scratchContext.fillStyle = 'rgba(255,255,255,.16)';
        for (let i = 0; i < 130; i++) {
            scratchContext.beginPath(); scratchContext.arc(Math.random()*rect.width,Math.random()*rect.height,Math.random()*2.2,0,Math.PI*2); scratchContext.fill();
        }
        scratchContext.fillStyle = '#fffaf0'; scratchContext.textAlign = 'center';
        scratchContext.font = `italic ${Math.min(42, rect.width/16)}px Lora, Georgia, serif`;
        scratchContext.fillText('Một lời hẹn ước dành cho bạn', rect.width/2, rect.height/2);
        scratchContext.font = '500 12px "Be Vietnam Pro", Arial, sans-serif';
        scratchContext.fillText('CHẠM VÀ CÀO ĐỂ KHÁM PHÁ', rect.width/2, rect.height/2 + 38);
    }

    function scratchAt(event) {
        if (!scratching || scratchRevealed) return;
        const rect = scratchCanvas.getBoundingClientRect();
        const point = event.touches ? event.touches[0] : event;
        const x = point.clientX - rect.left, y = point.clientY - rect.top;
        scratchContext.globalCompositeOperation = 'destination-out';
        scratchContext.beginPath(); scratchContext.arc(x, y, innerWidth < 700 ? 34 : 44, 0, Math.PI*2); scratchContext.fill();
        scratchMoves++;
        if (scratchMoves % 9 === 0) checkScratchProgress();
    }

    function checkScratchProgress() {
        const pixels = scratchContext.getImageData(0,0,scratchCanvas.width,scratchCanvas.height).data;
        let clear = 0;
        for (let i = 3; i < pixels.length; i += 64) if (pixels[i] === 0) clear++;
        if (clear / (pixels.length / 64) > .38) {
            scratchRevealed = true; scratching = false; scratchCard.classList.add('revealed');
            const box = scratchCard.getBoundingClientRect();
            burstHearts(box.left + box.width/2, box.top + box.height/2, 22);
        }
    }
    scratchCanvas.addEventListener('pointerdown', event => { scratching=true;scratchCard.classList.add('scratching');scratchCanvas.setPointerCapture(event.pointerId);scratchAt(event); });
    scratchCanvas.addEventListener('pointermove', scratchAt);
    scratchCanvas.addEventListener('pointerup', () => { scratching=false;checkScratchProgress(); });
    scratchCanvas.addEventListener('pointercancel', () => scratching=false);
    addEventListener('resize', paintScratchCover);
    document.fonts.ready.then(paintScratchCover);
}

// Add the real QR image path and bank details here when available.
const weddingGifts = {
    groom: {
        name: 'Nguyễn Châu Phát Tài',
        label: 'Một lời cảm ơn từ chú rể',
        thanks: 'Tài cảm ơn bạn đã dành tình cảm cho hai đứa trong ngày đặc biệt này. Món quà và những lời chúc của bạn sẽ là một kỷ niệm thật ấm áp trên chặng đường chúng mình cùng nhau bước tới.',
        signature: 'Thân mến, Phát Tài',
        qr: '', bank: '', account: ''
    },
    bride: {
        name: 'Đặng Mỹ Nhàn',
        label: 'Một lời cảm ơn từ cô dâu',
        thanks: 'Nhàn cảm ơn bạn vì đã yêu thương và chung vui cùng chúng mình. Nhàn trân quý từng lời chúc, từng món quà và cả sự hiện diện của bạn trong ngày hạnh phúc này.',
        signature: 'Thương mến, Mỹ Nhàn',
        qr: '', bank: '', account: ''
    }
};
const giftDialog = document.querySelector('#giftDialog');
const giftCopy = document.querySelector('#giftCopy');
const giftCopyStatus = document.querySelector('#giftCopyStatus');
const giftQrImage = document.querySelector('#giftQrImage');
let selectedGift = null;
let giftOpener = null;
let giftWasLocked = false;
let giftSession = 0;

document.querySelectorAll('[data-gift]').forEach(button => {
    button.addEventListener('click', () => {
        selectedGift = weddingGifts[button.dataset.gift];
        giftSession++;
        giftOpener = button;
        giftWasLocked = document.body.classList.contains('lock');
        stopAutoScroll();
        document.querySelector('#giftDialogTitle').textContent = selectedGift.name;
        document.querySelector('#giftDialogLabel').textContent = selectedGift.label;
        document.querySelector('#giftThanks').textContent = selectedGift.thanks;
        document.querySelector('#giftSignature').textContent = selectedGift.signature;
        giftQrImage.hidden = !selectedGift.qr;
        giftQrImage.alt = 'Mã QR nhận quà cưới của ' + selectedGift.name;
        if (selectedGift.qr) giftQrImage.src = selectedGift.qr;
        else giftQrImage.removeAttribute('src');
        document.querySelector('#giftQrPending').hidden = !!selectedGift.qr;
        const bankInfo = document.querySelector('#giftBankInfo');
        bankInfo.replaceChildren();
        bankInfo.hidden = !selectedGift.account;
        if (selectedGift.account) {
            const account = document.createElement('strong');
            account.textContent = selectedGift.account;
            bankInfo.append(selectedGift.bank, account, selectedGift.name);
        }
        giftCopy.hidden = !selectedGift.account;
        giftCopy.disabled = false;
        giftCopyStatus.textContent = '';
        giftDialog.showModal();
        document.body.classList.add('lock');
    });
});
giftQrImage.addEventListener('error', () => {
    giftQrImage.hidden = true;
    document.querySelector('#giftQrPending').hidden = false;
});
document.querySelector('.gift-dialog-close').addEventListener('click', () => giftDialog.close());
giftDialog.addEventListener('click', event => {
    const rect = giftDialog.getBoundingClientRect();
    if (event.target === giftDialog &&
        (event.clientX < rect.left || event.clientX > rect.right ||
         event.clientY < rect.top || event.clientY > rect.bottom)) giftDialog.close();
});
giftDialog.addEventListener('close', () => {
    giftSession++;
    if (!giftWasLocked) document.body.classList.remove('lock');
    giftOpener?.focus({ preventScroll: true });
});
giftCopy.addEventListener('click', async () => {
    if (!selectedGift?.account) return;
    const session = giftSession;
    giftCopy.disabled = true;
    try {
        await navigator.clipboard.writeText(selectedGift.account);
        if (session === giftSession) giftCopyStatus.textContent = 'Đã sao chép số tài khoản ♡';
    } catch {
        if (session === giftSession) giftCopyStatus.textContent = 'Bạn có thể nhấn giữ số tài khoản phía trên để sao chép.';
    } finally {
        if (session === giftSession) giftCopy.disabled = false;
    }
});
