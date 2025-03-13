    // Ambil canvas dan context
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    // Variabel status game: "start", "running", "paused", "gameover"
    let gameState = "start";

    // Variabel skor, kill count, dan high score
    let score = 0;
    let killCount = 0;
    let highScore = localStorage.getItem("highScore") ? Number(localStorage.getItem("highScore")) : 0;

    // Pengaturan spawn musuh
    const initialEnemySpawnInterval = 500; // interval awal 2000ms
    let enemySpawnInterval = initialEnemySpawnInterval;
    let lastEnemySpawn = 0;

    // Objek player (segitiga biru) berada di sisi kiri
    const player = {
      x: 50,
      y: canvas.height / 2,
      width: 20,    // lebar dasar segitiga
      height: 30,   // tinggi segitiga
      speed: 5
    };

    // Array untuk peluru dan musuh
    let bullets = [];
    let enemies = [];

    // Penanganan input keyboard
    let keys = {};
    document.addEventListener("keydown", function(e) {
      keys[e.code] = true;

      // Tombol Enter untuk memulai game (pada state start) atau restart (gameover)
      if (gameState === "start" && e.code === "Enter") {
        startGame();
      }
      if (gameState === "gameover" && e.code === "Enter") {
        resetGame();
      }
      // Tombol P untuk pause/resume game
      if (e.code === "KeyP") {
        if (gameState === "running") {
          pauseGame();
        } else if (gameState === "paused") {
          resumeGame();
        }
      }
      // Tombol Space untuk menembak ketika game berjalan
      if (e.code === "Space" && gameState === "running") {
        bullets.push({
          x: player.x + player.width,
          y: player.y,
          radius: 5,
          speed: 7
        });
      }
    });

    document.addEventListener("keyup", function(e) {
      keys[e.code] = false;
    });

    // Fungsi untuk memulai game
    function startGame() {
      gameState = "running";
      lastEnemySpawn = Date.now();
      gameLoop();
    }

    // Fungsi untuk mereset game ketika game over
    function resetGame() {
      gameState = "running";
      score = 0;
      killCount = 0;
      bullets = [];
      enemies = [];
      player.x = 50;
      player.y = canvas.height / 2;
      lastEnemySpawn = Date.now();
      enemySpawnInterval = initialEnemySpawnInterval;
      gameLoop();
    }

    // Fungsi untuk pause game
    function pauseGame() {
      gameState = "paused";
      draw(); // tampilkan overlay pause
    }

    // Fungsi untuk resume game
    function resumeGame() {
      gameState = "running";
      lastEnemySpawn = Date.now();
      gameLoop();
    }

    // Game loop menggunakan requestAnimationFrame
    function gameLoop() {
      if (gameState === "running") {
        update();
        draw();
        requestAnimationFrame(gameLoop);
      }
    }

    // Update posisi dan logika game
    function update() {
      // Update spawn interval berdasarkan kill count:
      let level = Math.floor(killCount / 10) + 1;
      enemySpawnInterval = Math.max(100, initialEnemySpawnInterval - level * 500);

      // Gerakan player dengan panah dan WASD
      if ((keys["ArrowUp"] || keys["KeyW"]) && player.y - player.speed > 0) {
        player.y -= player.speed;
      }
      if ((keys["ArrowDown"] || keys["KeyS"]) && player.y + player.speed < canvas.height) {
        player.y += player.speed;
      }
      if ((keys["ArrowLeft"] || keys["KeyA"]) && player.x - player.speed > 0) {
        player.x -= player.speed;
      }
      if ((keys["ArrowRight"] || keys["KeyD"]) && player.x + player.speed < canvas.width) {
        player.x += player.speed;
      }

      // Update peluru: bergerak ke kanan
      for (let i = 0; i < bullets.length; i++) {
        bullets[i].x += bullets[i].speed;
        if (bullets[i].x > canvas.width) {
          bullets.splice(i, 1);
          i--;
        }
      }

      // Spawn musuh secara berkala
      if (Date.now() - lastEnemySpawn > enemySpawnInterval) {
        spawnEnemy();
        lastEnemySpawn = Date.now();
      }

      // Update posisi musuh: bergerak ke kiri
      for (let i = 0; i < enemies.length; i++) {
        enemies[i].x -= enemies[i].speed;
        // Cek tabrakan antara musuh dan player (game over)
        if (checkCollisionPlayer(enemies[i])) {
          gameState = "gameover";
          if (score > highScore) {
            highScore = score;
          }
        }
        if (enemies[i].x < -enemies[i].size) {
          enemies.splice(i, 1);
          i--;
        }
      }

      // Deteksi tabrakan peluru dengan musuh
      for (let i = 0; i < bullets.length; i++) {
        for (let j = 0; j < enemies.length; j++) {
          if (checkCollision(bullets[i], enemies[j])) {
            enemies.splice(j, 1);
            bullets.splice(i, 1);
            score += 2;
            killCount += 1;
            i--;
            break;
          }
        }
      }
    }
    function updateHighScore(score) {
      if (score > highScore) {
          highScore = score;
          localStorage.setItem("highScore", highScore);
      }
    }

    // Fungsi untuk menggambar elemen-elemen game
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Gambar player sebagai segitiga biru
      ctx.fillStyle = "blue";
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(player.x - player.width, player.y + player.height / 2);
      ctx.lineTo(player.x - player.width, player.y - player.height / 2);
      ctx.closePath();
      ctx.fill();

      // Gambar peluru sebagai lingkaran merah
      ctx.fillStyle = "red";
      bullets.forEach(function(bullet) {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Gambar musuh sebagai segilima ungu
      ctx.fillStyle = "purple";
      enemies.forEach(function(enemy) {
        drawPentagon(enemy.x, enemy.y, enemy.size, enemy.rotation);
      });

      // Tampilkan skor, kill count, dan high score
      ctx.fillStyle = "black";
      ctx.font = "20px Arial";
      ctx.textAlign = "left";
      ctx.fillText("Score: " + score, 10, 30);
      ctx.fillText("Kill Count: " + killCount, 10, 60);
      ctx.fillText("High Score: " + highScore, 10, 90);

      // Tampilkan overlay sesuai state game
      ctx.textAlign = "center";
      if (gameState === "start") {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "40px Arial";
        ctx.fillText("Tekan Enter untuk Mulai", canvas.width / 2, canvas.height / 2);
      } else if (gameState === "paused") {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "40px Arial";
        ctx.fillText("Pause", canvas.width / 2, canvas.height / 2);
      } else if (gameState === "gameover") {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "40px Arial";
        ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = "30px Arial";
        ctx.fillText("Tekan Enter untuk Restart", canvas.width / 2, canvas.height / 2 + 20);
      }
    }

    // Fungsi untuk memunculkan musuh secara acak di sisi kanan canvas
    function spawnEnemy() {
      let enemy = {
        x: canvas.width + 50,
        y: Math.random() * canvas.height,
        size: 20,
        speed: 2 + Math.random() * 2,
        rotation: Math.random() * Math.PI * 2
      };
      enemies.push(enemy);
    }

    // Fungsi menggambar segilima (musuh)
    function drawPentagon(x, y, size, rotation) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        let angle = i * 2 * Math.PI / 5 - Math.PI / 2;
        let dx = size * Math.cos(angle);
        let dy = size * Math.sin(angle);
        if (i === 0) {
          ctx.moveTo(dx, dy);
        } else {
          ctx.lineTo(dx, dy);
        }
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Fungsi deteksi tabrakan antara peluru (lingkaran) dengan musuh (dianggap lingkaran)
    function checkCollision(bullet, enemy) {
      let dx = bullet.x - enemy.x;
      let dy = bullet.y - enemy.y;
      let distance = Math.sqrt(dx * dx + dy * dy);
      return distance < bullet.radius + enemy.size;
    }

    // Fungsi deteksi tabrakan antara player dan musuh (perkiraan dengan radius)
    function checkCollisionPlayer(enemy) {
      let dx = player.x - enemy.x;
      let dy = player.y - enemy.y;
      let distance = Math.sqrt(dx * dx + dy * dy);
      return distance < enemy.size + 5;
    }

    // Gambar layar awal
    draw();