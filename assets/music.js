// Audio-only playback: no iframe, video player, or external navigation.
const music = document.querySelector('#music');
const backgroundMusic = document.querySelector('#backgroundMusic');
const musicStatus = document.querySelector('#musicStatus');
let playing = false;
let musicWanted = false;
let musicRequest = 0;

function updateMusicState(active) {
    playing = active;
    document.body.classList.toggle('music-active', active);
    music.classList.toggle('playing', active);
    music.setAttribute('aria-pressed', String(active));
    music.setAttribute('aria-label', active ? 'Tắt nhạc' : 'Bật nhạc');
    music.textContent = active ? '♪' : '♫';
    music.title = active ? 'Tắt nhạc nền' : 'Bật nhạc nền';
}
function setMusicVolume(volume) {
    backgroundMusic.volume = Math.max(0, Math.min(1, volume / 100));
}
async function toggle(value) {
    musicWanted = value ?? !musicWanted;
    const request = ++musicRequest;
    if (!musicWanted) {
        backgroundMusic.pause();
        updateMusicState(false);
        return;
    }
    if (!backgroundMusic.getAttribute('src') && !backgroundMusic.querySelector('source[src]')) {
        musicWanted = false;
        updateMusicState(false);
        musicStatus.textContent = 'Nhạc nền đang được cập nhật.';
        music.title = musicStatus.textContent;
        return;
    }
    backgroundMusic.muted = false;
    try {
        // Call directly from the opening/button gesture to preserve mobile activation.
        await backgroundMusic.play();
    } catch (error) {
        if (request !== musicRequest) return;
        musicWanted = false;
        updateMusicState(false);
        musicStatus.textContent = error.name === 'NotAllowedError'
            ? 'Chạm nút nhạc để bật âm thanh.'
            : 'Chưa tải được nhạc. Chạm nút nhạc để thử lại.';
        music.title = musicStatus.textContent;
    }
}
backgroundMusic.addEventListener('playing', () => {
    if (!musicWanted) { backgroundMusic.pause(); return; }
    updateMusicState(true);
    musicStatus.textContent = 'Đang phát nhạc nền.';
});
backgroundMusic.addEventListener('pause', () => updateMusicState(false));
backgroundMusic.addEventListener('waiting', () => updateMusicState(false));
backgroundMusic.addEventListener('error', () => {
    musicWanted = false;
    updateMusicState(false);
    musicStatus.textContent = 'Chưa tải được nhạc nền.';
});
document.querySelector('#open').addEventListener('click', () => toggle(true), { once: true });
music.addEventListener('click', event => {
    event.preventDefault();
    toggle();
});
