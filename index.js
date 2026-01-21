
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playJumpSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 400;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

let gameState = 'start';
let score = 0;
let animationId;

const bird = {
    x: 100,
    y: 0,
    width: 40,
    height: 28,
    velocity: 0,
    gravity: 0.6,
    jump: -11,
    rotation: 0
};

let pipes = [];
const pipeWidth = 80;
const pipeGap = 300;
const pipeSpeed = 3;
let frameCount = 0;
const maxVisiblePipes = 6;

function startGame() {
    document.getElementById('startScreen').classList.add('hidden');
    gameState = 'playing';
    resetGame();
    gameLoop();
}

function resetGame() {
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    bird.rotation = 0;
    pipes = [];
    score = 0;
    frameCount = 0;
    updateScore();
    updateDistance();
}

function restartGame() {
    document.getElementById('gameOverScreen').classList.add('hidden');
    gameState = 'playing';
    resetGame();
    gameLoop();
}

document.addEventListener('click', () => {
    if (gameState === 'playing') {
        bird.velocity = bird.jump;
        playJumpSound();
    }
});

document.addEventListener('keydown', e => {
    if (e.code === 'Space' && gameState === 'playing') {
        e.preventDefault();
        bird.velocity = bird.jump;
        playJumpSound();
    }
});

function updateBird() {
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;
    bird.rotation = Math.min(Math.max(bird.velocity * 3, -25), 90);
    const groundY = canvas.height - canvas.height * 0.15;
    if (bird.y + bird.height > groundY || bird.y < 0) endGame();
}

function createPipe() {
    const minHeight = 100;
    const maxHeight = canvas.height - pipeGap - canvas.height * 0.25;
    const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
    pipes.push({
        x: canvas.width,
        topHeight,
        bottomY: topHeight + pipeGap,
        counted: false
    });
}

function updatePipes() {
    if (frameCount % 120 === 0) createPipe();
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= pipeSpeed;
        if (checkCollision(bird, pipes[i])) endGame();
        if (!pipes[i].counted && pipes[i].x + pipeWidth < bird.x) {
            pipes[i].counted = true;
            score++;
            updateScore();
        }
        if (pipes[i].x + pipeWidth < 0) pipes.splice(i, 1);
    }
    frameCount++;
    updateDistance();
}

function updateDistance() {
    let nextPipe = null;
    for (let pipe of pipes) {
        if (pipe.x + pipeWidth > bird.x) {
            nextPipe = pipe;
            break;
        }
    }
    document.getElementById('distanceDisplay').textContent =
        nextPipe ? `Next Pipe: ${Math.max(0, Math.floor((nextPipe.x - bird.x - bird.width) / 10))}m` : 'Next Pipe: --m';
}

function checkCollision(bird, pipe) {
    const p = 2;
    const bl = bird.x + p;
    const br = bird.x + bird.width - p;
    const bt = bird.y + p;
    const bb = bird.y + bird.height - p;
    const pl = pipe.x;
    const pr = pipe.x + pipeWidth;
    if (br > pl && bl < pr) {
        if (bt < pipe.topHeight || bb > pipe.bottomY) return true;
    }
    return false;
}

function drawBird() {
    ctx.save();
    ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
    ctx.rotate(bird.rotation * Math.PI / 180);
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(5, -4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(6, -4, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FF8C00';
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(18, -2);
    ctx.lineTo(18, 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.ellipse(-4, 3, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawPipes() {
    let visibleCount = 0;
    pipes.forEach(pipe => {
        if (pipe.x + pipeWidth > bird.x && visibleCount < maxVisiblePipes) {
            visibleCount++;
            const groundY = canvas.height - canvas.height * 0.15;
            const gradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipeWidth, 0);
            gradient.addColorStop(0, '#2ba02b');
            gradient.addColorStop(0.5, '#228B22');
            gradient.addColorStop(1, '#1a6b1a');
            ctx.fillStyle = gradient;
            ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight);
            ctx.strokeStyle = '#1a6b1a';
            ctx.lineWidth = 3;
            ctx.strokeRect(pipe.x, 0, pipeWidth, pipe.topHeight);
            ctx.fillStyle = '#2ba02b';
            ctx.fillRect(pipe.x - 8, pipe.topHeight - 40, pipeWidth + 16, 40);
            ctx.strokeRect(pipe.x - 8, pipe.topHeight - 40, pipeWidth + 16, 40);
            ctx.fillStyle = gradient;
            ctx.fillRect(pipe.x, pipe.bottomY, pipeWidth, groundY - pipe.bottomY);
            ctx.strokeRect(pipe.x, pipe.bottomY, pipeWidth, groundY - pipe.bottomY);
            ctx.fillStyle = '#2ba02b';
            ctx.fillRect(pipe.x - 8, pipe.bottomY, pipeWidth + 16, 40);
            ctx.strokeRect(pipe.x - 8, pipe.bottomY, pipeWidth + 16, 40);
        }
    });
}

function drawBackground() {
    const groundY = canvas.height - canvas.height * 0.15;
    const skyGradient = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGradient.addColorStop(0, '#4ec0ca');
    skyGradient.addColorStop(1, '#87ceeb');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, groundY);
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
    ctx.fillStyle = '#90EE90';
    for (let i = 0; i < canvas.width; i += 30) ctx.fillRect(i, groundY, 15, 8);
    ctx.fillStyle = '#8B7355';
    for (let i = 10; i < canvas.width; i += 40) {
        ctx.beginPath();
        ctx.arc(i, groundY + 30, 5, 0, Math.PI * 2);
        ctx.fill();
    }
    drawCloud(canvas.width * 0.15, 120, 1);
    drawCloud(canvas.width * 0.45, 180, 1.2);
    drawCloud(canvas.width * 0.75, 100, 0.9);
}

function drawCloud(x, y, s) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(x, y, 30 * s, 0, Math.PI * 2);
    ctx.arc(x + 30 * s, y, 40 * s, 0, Math.PI * 2);
    ctx.arc(x + 60 * s, y, 30 * s, 0, Math.PI * 2);
    ctx.fill();
}

function updateScore() {
    document.getElementById('scoreDisplay').textContent = score;
}

function endGame() {
    gameState = 'gameover';
    cancelAnimationFrame(animationId);
    document.getElementById('finalScore').textContent = `Score: ${score}`;
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

function gameLoop() {
    if (gameState !== 'playing') return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawPipes();
    drawBird();
    updateBird();
    updatePipes();
    animationId = requestAnimationFrame(gameLoop);
}

drawBackground();
bird.y = canvas.height / 2;
drawBird();

