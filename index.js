        // Canvas setup - fullscreen
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas to fullscreen
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Create jump sound using Web Audio API
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

        // Game state
        let gameState = 'start'; // 'start', 'playing', 'gameover'
        let score = 0;
        let animationId;

        // Bird object
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

        // Pipes array
        let pipes = [];
        const pipeWidth = 80;
        const pipeGap = 200;
        const pipeSpeed = 3;
        let frameCount = 0;
        const maxVisiblePipes = 3; // Show only next 3 pipes

        // Start the game
        function startGame() {
            document.getElementById('startScreen').classList.add('hidden');
            gameState = 'playing';
            resetGame();
            gameLoop();
        }

        // Reset game variables
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

        // Restart after game over
        function restartGame() {
            document.getElementById('gameOverScreen').classList.add('hidden');
            gameState = 'playing';
            resetGame();
            gameLoop();
        }

        // Handle input (click and spacebar)
        document.addEventListener('click', () => {
            if (gameState === 'playing') {
                bird.velocity = bird.jump;
                playJumpSound();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && gameState === 'playing') {
                e.preventDefault();
                bird.velocity = bird.jump;
                playJumpSound();
            }
        });

        // Update bird physics
        function updateBird() {
            bird.velocity += bird.gravity;
            bird.y += bird.velocity;

            // Calculate rotation based on velocity
            bird.rotation = Math.min(Math.max(bird.velocity * 3, -25), 90);

            // Check ground and ceiling collision
            const groundY = canvas.height - canvas.height * 0.15;
            if (bird.y + bird.height > groundY || bird.y < 0) {
                endGame();
            }
        }

        // Create new pipes
        function createPipe() {
            const minHeight = 100;
            const maxHeight = canvas.height - pipeGap - canvas.height * 0.25;
            const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
            
            pipes.push({
                x: canvas.width,
                topHeight: topHeight,
                bottomY: topHeight + pipeGap,
                counted: false
            });
        }

        // Update pipes
        function updatePipes() {
            // Create new pipe every 120 frames (more spacing)
            if (frameCount % 120 === 0) {
                createPipe();
            }

            // Move and check pipes
            for (let i = pipes.length - 1; i >= 0; i--) {
                pipes[i].x -= pipeSpeed;

                // Check collision
                if (checkCollision(bird, pipes[i])) {
                    endGame();
                }

                // Update score when bird passes pipe
                if (!pipes[i].counted && pipes[i].x + pipeWidth < bird.x) {
                    pipes[i].counted = true;
                    score++;
                    updateScore();
                }

                // Remove off-screen pipes
                if (pipes[i].x + pipeWidth < 0) {
                    pipes.splice(i, 1);
                }
            }

            frameCount++;
            updateDistance();
        }

        // Update distance display to next pipe
        function updateDistance() {
            let nextPipe = null;
            for (let pipe of pipes) {
                if (pipe.x + pipeWidth > bird.x) {
                    nextPipe = pipe;
                    break;
                }
            }
            
            if (nextPipe) {
                const distance = Math.max(0, Math.floor((nextPipe.x - bird.x - bird.width) / 10));
                document.getElementById('distanceDisplay').textContent = `Next Pipe: ${distance}m`;
            } else {
                document.getElementById('distanceDisplay').textContent = `Next Pipe: --m`;
            }
        }

        // Collision detection
        function checkCollision(bird, pipe) {
            // Bird boundaries with slight padding for more forgiving gameplay
            const padding = 2;
            const birdLeft = bird.x + padding;
            const birdRight = bird.x + bird.width - padding;
            const birdTop = bird.y + padding;
            const birdBottom = bird.y + bird.height - padding;

            // Pipe boundaries
            const pipeLeft = pipe.x;
            const pipeRight = pipe.x + pipeWidth;

            // Check if bird is within pipe's x range
            if (birdRight > pipeLeft && birdLeft < pipeRight) {
                // Check if bird hits top or bottom pipe
                if (birdTop < pipe.topHeight || birdBottom > pipe.bottomY) {
                    return true;
                }
            }
            return false;
        }

        // Draw bird
        function drawBird() {
            ctx.save();
            ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
            ctx.rotate(bird.rotation * Math.PI / 180);
            
            // Bird body (yellow circle) - larger
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(0, 0, 14, 0, Math.PI * 2);
            ctx.fill();
            
            // Bird outline
            ctx.strokeStyle = '#FFA500';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Bird eye (white)
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(5, -4, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Bird pupil (black)
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(6, -4, 2.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Bird beak (orange)
            ctx.fillStyle = '#FF8C00';
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(18, -2);
            ctx.lineTo(18, 2);
            ctx.closePath();
            ctx.fill();
            
            // Bird wing (darker yellow)
            ctx.fillStyle = '#FFA500';
            ctx.beginPath();
            ctx.ellipse(-4, 3, 10, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }

        // Draw pipes (only show next 3)
        function drawPipes() {
            let visibleCount = 0;
            pipes.forEach(pipe => {
                // Only draw pipes that are ahead of the bird and limit to 3
                if (pipe.x + pipeWidth > bird.x && visibleCount < maxVisiblePipes) {
                    visibleCount++;
                    
                    const groundY = canvas.height - canvas.height * 0.15;
                    
                    // Top pipe
                    ctx.fillStyle = '#228B22';
                    ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight);
                    
                    // Pipe gradient effect
                    const gradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipeWidth, 0);
                    gradient.addColorStop(0, '#2ba02b');
                    gradient.addColorStop(0.5, '#228B22');
                    gradient.addColorStop(1, '#1a6b1a');
                    ctx.fillStyle = gradient;
                    ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight);
                    
                    ctx.strokeStyle = '#1a6b1a';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(pipe.x, 0, pipeWidth, pipe.topHeight);
                    
                    // Top pipe cap
                    ctx.fillStyle = '#2ba02b';
                    ctx.fillRect(pipe.x - 8, pipe.topHeight - 40, pipeWidth + 16, 40);
                    ctx.strokeStyle = '#1a6b1a';
                    ctx.strokeRect(pipe.x - 8, pipe.topHeight - 40, pipeWidth + 16, 40);

                    // Bottom pipe
                    ctx.fillStyle = gradient;
                    ctx.fillRect(pipe.x, pipe.bottomY, pipeWidth, groundY - pipe.bottomY);
                    ctx.strokeStyle = '#1a6b1a';
                    ctx.strokeRect(pipe.x, pipe.bottomY, pipeWidth, groundY - pipe.bottomY);
                    
                    // Bottom pipe cap
                    ctx.fillStyle = '#2ba02b';
                    ctx.fillRect(pipe.x - 8, pipe.bottomY, pipeWidth + 16, 40);
                    ctx.strokeRect(pipe.x - 8, pipe.bottomY, pipeWidth + 16, 40);
                }
            });
        }

        // Draw background elements
        function drawBackground() {
            const groundY = canvas.height - canvas.height * 0.15;
            
            // Sky gradient
            const skyGradient = ctx.createLinearGradient(0, 0, 0, groundY);
            skyGradient.addColorStop(0, '#4ec0ca');
            skyGradient.addColorStop(1, '#87ceeb');
            ctx.fillStyle = skyGradient;
            ctx.fillRect(0, 0, canvas.width, groundY);
            
            // Ground
            ctx.fillStyle = '#DEB887';
            ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
            
            // Ground grass pattern
            ctx.fillStyle = '#90EE90';
            for (let i = 0; i < canvas.width; i += 30) {
                ctx.fillRect(i, groundY, 15, 8);
            }
            
            // Ground dirt pattern
            ctx.fillStyle = '#8B7355';
            for (let i = 10; i < canvas.width; i += 40) {
                ctx.beginPath();
                ctx.arc(i, groundY + 30, 5, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Clouds
            drawCloud(canvas.width * 0.15, 120, 1);
            drawCloud(canvas.width * 0.45, 180, 1.2);
            drawCloud(canvas.width * 0.75, 100, 0.9);
        }

        function drawCloud(x, y, scale) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.arc(x, y, 30 * scale, 0, Math.PI * 2);
            ctx.arc(x + 30 * scale, y, 40 * scale, 0, Math.PI * 2);
            ctx.arc(x + 60 * scale, y, 30 * scale, 0, Math.PI * 2);
            ctx.fill();
        }

        // Update score display
        function updateScore() {
            document.getElementById('scoreDisplay').textContent = score;
        }

        // End game
        function endGame() {
            gameState = 'gameover';
            cancelAnimationFrame(animationId);
            document.getElementById('finalScore').textContent = `Score: ${score}`;
            document.getElementById('gameOverScreen').classList.remove('hidden');
        }

        // Main game loop
        function gameLoop() {
            if (gameState !== 'playing') return;

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw everything
            drawBackground();
            drawPipes();
            drawBird();

            // Update game objects
            updateBird();
            updatePipes();

            animationId = requestAnimationFrame(gameLoop);
        }

        drawBackground();
        bird.y = canvas.height / 2;
        drawBird();
    