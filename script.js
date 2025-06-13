// --- Canvas and context setup ---
const canvas = document.getElementById('animation-canvas');
const ctx = canvas.getContext('2d');
let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

// --- DOM Elements ---
const messagePrompt = document.getElementById('message-prompt');
const heartButton = document.getElementById('heart-button');
const finalMessage = document.getElementById('final-message');

// --- Animation State ---
let branchDrawn = false;
let blossoms = [];
let plums = [];
const NUM_BLOSSOMS = 50; // Increased for a fuller tree

// --- Event Listeners ---
window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    // Reset and redraw everything on resize
    branchDrawn = false;
    blossoms = [];
    plums = [];
    ctx.clearRect(0, 0, width, height); 
});

heartButton.addEventListener('click', () => {
    messagePrompt.classList.remove('visible');
    setTimeout(() => {
        finalMessage.classList.add('visible');
    }, 500); // Delay to allow prompt to fade out
});

// --- Helper Functions ---
function random(min, max) {
    return Math.random() * (max - min) + min;
}

// --- Classes for Animation Objects ---

/**
 * Represents a single plum particle floating on the screen.
 * REWORKED: Now has a "detaching" phase before floating freely.
 */
class Plum {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = random(4, 8);
        this.color = `hsl(${random(300, 340)}, 85%, 65%)`;
        
        // Initial state: gentle detachment
        this.vx = random(-0.2, 0.2); // Very little initial horizontal speed
        this.vy = random(0.1, 0.5);  // Start by falling slowly
        
        this.gravity = 0.015;
        this.wind = 0; // Wind doesn't affect it at the start
        this.drag = 0.98;
        
        // Timer to control when it starts drifting
        this.life = 0;
        this.driftLife = random(60, 120); // Time before it starts drifting freely
    }

    update() {
        this.life++;

        // After a short time, the plum detaches and is caught by the wind
        if (this.life > this.driftLife) {
            this.wind = (Math.sin(this.life / 50) + random(-0.2, 0.2)) * 0.15;
        }

        this.vy += this.gravity;
        this.vx += this.wind;
        this.vx *= this.drag;

        this.x += this.vx;
        this.y += this.vy;

        // Reset particle if it goes off-screen
        if (this.y > height + this.size) {
            this.x = random(0, width);
            this.y = -this.size; // Restart from the top
            this.life = 0; // Reset life to restart detachment behavior
            this.vx = random(-0.2, 0.2);
            this.vy = random(0.1, 0.5);
            this.wind = 0;
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

/**
 * Represents a single blooming blossom. (No changes here)
 */
class Blossom {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.maxSize = random(12, 22);
        this.size = 0;
        this.growthRate = random(0.1, 0.25);
        this.isGrown = false;
        this.color = `rgba(255, 192, 203, ${random(0.6, 1)})`; // Pink
        this.centerColor = '#FFFDD0'; // Cream
    }

    update() {
        if (this.size < this.maxSize) {
            this.size += this.growthRate;
        } else {
            this.isGrown = true;
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        for (let i = 0; i < 5; i++) {
            ctx.rotate(Math.PI * 2 / 5);
            ctx.beginPath();
            ctx.ellipse(this.size * 0.7, 0, this.size * 0.6, this.size * 0.3, 0, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = this.centerColor;
        ctx.fill();
        ctx.restore();
    }
}

/**
 * REWORKED: Draws a more visible and structured tree.
 */
function drawBranch(startX, startY, length, angle, width, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    
    // Add a shadow for depth
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 10;
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    const endX = startX + length * Math.cos(angle);
    const endY = startY + length * Math.sin(angle);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    ctx.restore(); // Restore to remove shadow for next branches

    // Place blossoms along the branch
    if (length > 20 && blossoms.length < NUM_BLOSSOMS) {
         blossoms.push(new Blossom(endX, endY));
    }
    
    if (length < 15) return; // Stop branching when branches are too short

    // Create 2 to 3 new branches
    const newBranches = random(2, 3);
    for (let i = 0; i < newBranches; i++) {
        let newAngle = angle + random(-0.4, 0.4); // Control branch spread
        let newLength = length * random(0.7, 0.85);
        let newWidth = width * 0.7;
        drawBranch(endX, endY, newLength, newAngle, newWidth, color);
    }
}


/**
 * Main animation loop.
 */
function animate() {
    // A slightly less transparent background to make trails shorter
    ctx.fillStyle = 'rgba(255, 240, 245, 0.3)';
    ctx.fillRect(0, 0, width, height);
    
    // Step 1: Draw the branch and let blossoms grow
    if (!branchDrawn) {
        // Start from bottom-center for a more prominent tree
        drawBranch(width / 2, height, height * 0.2, -Math.PI / 2, 25, '#664229');
        branchDrawn = true;
    }

    let allGrown = true;
    blossoms.forEach(blossom => {
        blossom.update();
        blossom.draw();
        if (!blossom.isGrown) {
            allGrown = false;
        }
    });
    
    // Step 2: Once blossoms are grown, show the prompt and create plums
    if (allGrown && !messagePrompt.classList.contains('visible') && plums.length === 0) {
        messagePrompt.classList.add('visible');
        blossoms.forEach(b => {
            plums.push(new Plum(b.x, b.y));
        });
    }
    
    // Step 3: Animate plums indefinitely
    if (plums.length > 0) {
        plums.forEach(plum => {
            plum.update();
            plum.draw();
        });
    }

    requestAnimationFrame(animate);
}

// --- Start the animation ---
window.onload = function() {
    animate();
};
