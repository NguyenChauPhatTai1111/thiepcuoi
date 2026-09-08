// Keep playback independent of album and invitation effects.
const music = document.querySelector('#music');
const yt = document.querySelector('#yt');

const musicStatus = document.querySelector('#musicStatus');
let weddingPlayer = null;
let musicWanted = false;
let playing = false;
let musicReady = false;
let musicTimer;

function updateMusicState(active) {
    playing = active;
    document.body.classList.toggle('music-active', active);
    music.classList.toggle('playing', active);
    music.setAttribute('aria-pressed', String(active));
    music.setAttribute('aria-label', active ? 'Tắt nhạc' : 'Bật nhạc');
    music.textContent = active ? '♪' : '♫';
    music.title = active ? 'Tắt nhạc nền' : 'Bật nhạc nền';
}
function musicNeedsTap(message) {
    clearTimeout(musicTimer);

    musicWanted = false;
    updateMusicState(false);
    musicStatus.textContent = message;
    music.title = message;
}
function setMusicVolume(volume) {
    if (musicReady) weddingPlayer.setVolume(volume);
}
function toggle(value) {
    musicWanted = value ?? !musicWanted;
    clearTimeout(musicTimer);
    if (!musicWanted) {
        if (musicReady) weddingPlayer.pauseVideo();
        updateMusicState(false);
        musicStatus.textContent = 'Nhạc đã tạm dừng.';
        return;
    }

    musicStatus.textContent = musicReady ? 'Đang mở nhạc…' : 'Đang tải nhạc…';
    if (musicReady) {
        weddingPlayer.unMute();
        weddingPlayer.setVolume(100);
        weddingPlayer.playVideo();
    }
    musicTimer = setTimeout(() => {
        if (!playing && musicWanted) musicNeedsTap('Chạm nút nhạc ♫ để bắt đầu nghe nhạc.');
    }, 8000);
}
window.onYouTubeIframeAPIReady = function () {
    if (weddingPlayer) return;
    const source = new URL(yt.src);
    source.searchParams.set('playsinline', '1');
    source.searchParams.set('fs', '0');
    source.searchParams.set('disablekb', '1');
    source.searchParams.set('controls', '0');
    yt.setAttribute('allow', "autoplay; encrypted-media; fullscreen 'none'; picture-in-picture 'none'");
    if (/^https?:$/.test(location.protocol)) source.searchParams.set('origin', location.origin);
    yt.src = source.href;
    weddingPlayer = new YT.Player('yt', {
        events: {
            onReady: () => {
                musicReady = true;
                if (musicWanted) toggle(true);
            },
            onStateChange: event => {
                const active = event.data === YT.PlayerState.PLAYING;
                updateMusicState(active);
                if (active) {
                    clearTimeout(musicTimer);
                    musicWanted = true;
                    musicStatus.textContent = 'Đang phát nhạc nền thiệp cưới';
                } else if (event.data === YT.PlayerState.PAUSED) {
                    musicWanted = false;
                    clearTimeout(musicTimer);
                    musicStatus.textContent = 'Nhạc đã tạm dừng. Chạm nút nhạc để nghe tiếp.';
                } else if (event.data === YT.PlayerState.ENDED && musicWanted) {
                    weddingPlayer.playVideo();
                }
            },
            onAutoplayBlocked: () => {
                musicWanted = false;
                updateMusicState(false);
                musicNeedsTap('Chạm nút nhạc ♫ để bật âm thanh.');
            },
            onError: event => {
                musicWanted = false;
                updateMusicState(false);
                musicNeedsTap('Chưa phát được nhạc. Chạm nút nhạc để thử lại.');
            }
        }
    });
};
document.querySelector('#open').addEventListener('click', () => toggle(true), { once: true });
music.addEventListener('click', event => {
    event.preventDefault();
    toggle();
});

