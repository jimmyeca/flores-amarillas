// script.js
(() => {
  // Canvas fireworks
  const canvas = document.getElementById('fireworks-canvas');
  const ctx = canvas.getContext('2d');
  let cw, ch, DPR;

  function resize() {
    DPR = window.devicePixelRatio || 1;
    cw = canvas.width = Math.floor(window.innerWidth * DPR);
    ch = canvas.height = Math.floor(window.innerHeight * DPR);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  // Utility
  function rand(min, max) { return Math.random() * (max - min) + min; }
  function randomColorHue(yellowish = true) {
    // Prefer yellow tones but include warm complements
    if (yellowish) return `hsl(${rand(45, 60)}, ${rand(80, 100)}%, ${rand(50, 60)}%)`;
    return `hsl(${rand(30, 70)}, ${rand(70, 100)}%, ${rand(45, 60)}%)`;
  }

  // Partículas y cohetes
  const rockets = [];
  const particles = [];

  class Rocket {
    constructor(x, y, tx, ty) {
      this.x = x; this.y = y;
      this.vx = (tx - x) / rand(20, 30);
      this.vy = (ty - y) / rand(20, 30);
      this.life = 0;
      this.ttl = rand(40, 70);
      this.color = randomColorHue(true);
    }
    step() {
      this.x += this.vx; this.y += this.vy;
      this.vy += 0.12; // gravity
      this.life++;
      // Trail particles
      if (Math.random() < 0.35) {
        particles.push(new Particle(this.x, this.y, rand(-0.8,0.8), rand(-0.8,0.8), this.color, 14, true));
      }
      if (this.life > this.ttl) {
        // explode
        explode(this.x, this.y, this.color);
        return false;
      }
      return true;
    }
    draw(ctx){ ctx.beginPath(); ctx.fillStyle = this.color; ctx.arc(this.x, this.y, 3, 0, Math.PI*2); ctx.fill(); }
  }

  class Particle {
    constructor(x,y,vx,vy,color,size,fade=false){
      this.x = x; this.y = y;
      this.vx = vx; this.vy = vy;
      this.color = color;
      this.size = size;
      this.life = 0;
      this.ttl = rand(40, 90);
      this.fade = fade;
      this.alpha = 1;
    }
    step(){
      this.x += this.vx;
      this.y += this.vy;
      this.vy += 0.06; // gravity
      this.vx *= 0.99;
      this.vy *= 0.99;
      this.life++;
      if (this.fade) {
        this.alpha = Math.max(0, 1 - this.life / this.ttl);
      } else {
        // color fade
        this.alpha = Math.max(0, 1 - this.life / this.ttl);
      }
      return this.life < this.ttl && this.alpha > 0.01;
    }
    draw(ctx){
      ctx.beginPath();
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = this.color;
      ctx.arc(this.x, this.y, Math.max(0.8, this.size * (this.alpha)), 0, Math.PI*2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function explode(x,y,color){
    const count = Math.floor(rand(30, 80));
    for(let i=0;i<count;i++){
      const angle = Math.random()*Math.PI*2;
      const speed = rand(1.6, 5.6);
      const vx = Math.cos(angle)*speed;
      const vy = Math.sin(angle)*speed;
      const hueVariation = rand(-8, 8);
      const c = `hsl(${Number(color.match(/hsl\((\d+)/)[1]) + hueVariation}, ${rand(70,100)}%, ${rand(45,60)}%)`;
      particles.push(new Particle(x, y, vx, vy, c, rand(1.6,3.5)));
    }
    // small shock wave particle
    particles.push(new Particle(x,y,0,0,'rgba(255,240,200,0.7)', 18, true));
  }

  // Render loop
  function loop(){
    // fondo con leve persistencia (trails)
    ctx.fillStyle = 'rgba(6,8,16,0.35)';
    ctx.fillRect(0,0, canvas.width/DPR, canvas.height/DPR);

    // update rockets
    for(let i = rockets.length-1; i >= 0; i--){
      const r = rockets[i];
      if(!r.step()) rockets.splice(i,1);
      else r.draw(ctx);
    }

    // update particles
    for(let i = particles.length-1; i >= 0; i--){
      const p = particles[i];
      if(!p.step()) particles.splice(i,1);
      else p.draw(ctx);
    }

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // Utilities to create random showers
  function launchRandom() {
    // random start bottom center-ish to a random target upper area
    const startX = rand(window.innerWidth*0.2, window.innerWidth*0.8);
    const startY = window.innerHeight + 10;
    const targetX = rand(window.innerWidth*0.25, window.innerWidth*0.75);
    const targetY = rand(window.innerHeight*0.08, window.innerHeight*0.45);
    rockets.push(new Rocket(startX, startY, targetX, targetY));
  }

  // Launch multiple quickly
  function grandShow(count = 8) {
    for(let i=0;i<count;i++){
      setTimeout(()=> launchRandom(), i*220 + Math.random()*120);
    }
  }

  // Interactions: button and click
  document.getElementById('send-emoji').addEventListener('click', () => {
    grandShow(9);
    // pulse the card visually
    const btn = document.getElementById('send-emoji');
    btn.animate([{transform:'scale(1)'},{transform:'scale(0.96)'},{transform:'scale(1)'}], {duration:220});
  });

  // also allow clicking anywhere to fire a show
  window.addEventListener('click', (e) => {
    // protect clicks on button (already handled)
    if(e.target && e.target.id === 'send-emoji') return;
    // target near click
    const startX = rand(window.innerWidth*0.2, window.innerWidth*0.8);
    const startY = window.innerHeight + 10;
    rockets.push(new Rocket(startX, startY, e.clientX, e.clientY));
  });

  // Auto-start a gentle show after load
  setTimeout(()=>grandShow(5), 800);

  // Small accessibility / reduce-motion respect
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mq.matches) {
    // remove animation loops from CSS (best-effort)
    document.querySelectorAll('.flower .petal-shape').forEach(el => el.style.animation = 'none');
    document.querySelectorAll('.stem, .leaf, .ribbon').forEach(el => el.style.animation = 'none');
  }

})();
