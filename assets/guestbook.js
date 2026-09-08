const wishForm = document.querySelector('#form');
const wishList = document.querySelector('#wishList');
const wishStatus = document.querySelector('#wishStatus');
const wishEmpty = document.querySelector('#wishEmpty');
const wishStorageKey = 'tai-nhan-wedding-responses-v1';
function readWishes() {
    const saved = JSON.parse(localStorage.getItem(wishStorageKey) || '[]');
    if (!Array.isArray(saved)) throw new Error('Invalid saved wishes');
    return saved.filter(wish => wish && typeof wish.name === 'string' && typeof wish.message === 'string');
}

function renderWishes(wishes) {
    wishes = wishes.filter(wish => wish.message.trim());
    wishList.replaceChildren();
    wishes.forEach(wish => {
        const item = document.createElement('li');
        const name = document.createElement('h4');
        const message = document.createElement('p');
        name.textContent = wish.name;
        message.textContent = wish.message;
        item.append(name, message);
        wishList.append(item);
    });
    wishEmpty.hidden = wishes.length > 0;
    document.querySelector('#wishCount').textContent = wishes.length;
}

function loadWishes() {
    try { renderWishes(readWishes()); }
    catch { wishStatus.textContent = 'Không đọc được lời chúc đã lưu trên trình duyệt này.'; }
}

wishForm.onsubmit = event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(wishForm));
    if (!data.name.trim()) {
        wishStatus.textContent = 'Bạn điền tên trước khi gửi nhé.';
        wishForm.elements.name.focus();
        return;
    }
    try {
        const wishes = readWishes();
        wishes.unshift({ ...data, name: data.name.trim(), message: data.message.trim(), createdAt: new Date().toISOString() });
        localStorage.setItem(wishStorageKey, JSON.stringify(wishes));
        renderWishes(wishes);
        wishForm.reset();
        wishStatus.textContent = 'Cảm ơn bạn! Đã lưu lời xác nhận' +
            (data.message.trim() ? ' và lời chúc trên trình duyệt này. ♡' : ' trên trình duyệt này. ♡');
    } catch {
        wishStatus.textContent = 'Trình duyệt chưa lưu được dữ liệu. Nội dung vẫn được giữ lại; bạn kiểm tra dung lượng và quyền lưu trữ rồi thử lại nhé.';
    }
};
loadWishes();
window.addEventListener('storage', event => {
    if (event.key === wishStorageKey || event.key === null) loadWishes();
});

document.querySelector('#open').addEventListener('click', event => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const box = event.currentTarget.getBoundingClientRect();
    const layer = document.createElement('div');
    layer.className = 'flower-burst';
    layer.setAttribute('aria-hidden', 'true');
    document.body.append(layer);
    for (let i = 0; i < 64; i++) {
        const petal = document.createElement(i % 7 === 0 ? 'img' : 'span');
        if (petal.tagName === 'IMG') { petal.src = 'assets/flowers.svg'; petal.alt = ''; }
        petal.className = 'wedding-petal';
        petal.style.left = box.left + box.width / 2 + 'px';
        petal.style.top = box.top + box.height / 2 + 'px';
        petal.style.backgroundColor = ['#a51f38', '#d84c58', '#8c1830', '#e5bd95'][i % 4];
        layer.append(petal);
        const x = (Math.random() - .5) * innerWidth * 1.8;
        const y = -100 - Math.random() * innerHeight * .65;
        petal.animate([
            { transform: 'translate(-50%, -50%) scale(.2)', opacity: 0 },
            { offset: .12, opacity: 1 },
            { offset: .45, transform: `translate(${x * .65}px, ${y}px) rotate(${x}deg)`, opacity: 1 },
            { transform: `translate(${x}px, ${innerHeight}px) rotate(${x * 3}deg)`, opacity: 0 }
        ], { duration: 2300 + Math.random() * 1600, delay: Math.random() * 150, easing: 'cubic-bezier(.2,.6,.4,1)', fill: 'both' });
    }
    setTimeout(() => layer.remove(), 4200);
}, { once: true });
