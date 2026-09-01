let weddingPlayer = null;
        let musicWanted = false;
        function onYouTubeIframeAPIReady() {
            weddingPlayer = new YT.Player('yt', {
                events: {
                    onReady: event => {
                        if (musicWanted) {
                            event.target.unMute();
                            event.target.setVolume(100);
                            event.target.playVideo();
                        }
                    }
                }
            });
        }

const cover = document.querySelector('#cover'), music = document.querySelector('#music'), yt = document.querySelector('#yt'); let playing = false; addEventListener('load', () => setTimeout(() => document.querySelector('.loader').classList.add('hide'), 600)); function cmd(f) { yt.contentWindow.postMessage(JSON.stringify({ event: 'command', func: f, args: [] }), '*') } function toggle(v) { playing = v ?? !playing; cmd(playing ? 'playVideo' : 'pauseVideo'); music.classList.toggle('playing', playing); music.textContent = playing ? '♪' : '♫' } document.querySelector('#open').onclick = () => { cover.classList.add('open'); document.body.classList.remove('lock'); toggle(true); setTimeout(() => cover.remove(), 1300) }; music.onclick = () => toggle(); const ob = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('show'); ob.unobserve(e.target) } }), { threshold: .14 }); document.querySelectorAll('.reveal').forEach(x => ob.observe(x)); const wedding = new Date('2026-12-12T16:30:00+07:00'); function tick() { let d = Math.max(0, wedding - new Date()), v = [Math.floor(d / 864e5), Math.floor(d / 36e5) % 24, Math.floor(d / 6e4) % 60, Math.floor(d / 1e3) % 60];['days', 'hours', 'mins', 'secs'].forEach((x, i) => document.querySelector('#' + x).textContent = String(v[i]).padStart(i ? 2 : 3, '0')) } tick(); setInterval(tick, 1000); document.querySelector('#form').onsubmit = e => { e.preventDefault(); let t = document.querySelector('#toast'); t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3500); e.target.reset() }

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
            musicWanted = true;
            if (weddingPlayer && typeof weddingPlayer.playVideo === 'function') {
                weddingPlayer.unMute();
                weddingPlayer.setVolume(100);
                weddingPlayer.playVideo();
            }
            document.body.classList.add('invite-opened');
            secretTimer = setTimeout(() => secretInvite.classList.add('show'), innerWidth <= 700 ? 1700 : 4500);
            setTimeout(() => { cmd('playVideo'); setMusicVolume(100); }, 450);
            setTimeout(() => { if (playing) cmd('playVideo'); }, 1400);
        });

        function setMusicVolume(volume) {
            if (weddingPlayer && typeof weddingPlayer.setVolume === 'function') {
                weddingPlayer.setVolume(volume);
            } else {
                yt.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [volume] }), '*');
            }
        }

        music.addEventListener('click', () => {
            musicWanted = playing;
            if (!weddingPlayer || typeof weddingPlayer.playVideo !== 'function') return;
            if (playing) {
                weddingPlayer.unMute(); weddingPlayer.setVolume(100); weddingPlayer.playVideo();
            } else {
                weddingPlayer.pauseVideo();
            }
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
        yt.addEventListener('load', () => { if (playing) setTimeout(() => cmd('playVideo'), 300); });

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
            heart.style.fontSize = `${12 + Math.random() * 17}px`;
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
        scratchContext.font = `italic ${Math.min(54, rect.width/11)}px Cormorant Garamond`;
        scratchContext.fillText('Một lời hẹn ước dành cho bạn', rect.width/2, rect.height/2);
        scratchContext.font = '500 10px Be Vietnam Pro';
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
