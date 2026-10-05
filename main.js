import { createTempleNightRenderer } from './templeNightRenderer.js';
const canvas = document.querySelector('#temple');
const control = document.querySelector('#motion');
let gardenOpen = false;
let renderer, frame = 0, paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
function schedule() { if (!paused && !gardenOpen && !document.hidden && !frame) frame = requestAnimationFrame(draw); }
function draw(time) { frame = 0; renderer.render(time); schedule(); }
function updateControl() { control.textContent = paused ? 'Play scene' : 'Pause scene'; control.setAttribute('aria-pressed',String(paused)); }
// Let the connection links paint before initializing the supplied world.
setTimeout(() => {
 try {
  renderer = createTempleNightRenderer(canvas);
  renderer.resize(); renderer.render(0);
  document.querySelector('.scene').classList.add('ready');
  control.disabled = false; updateControl(); schedule();
  new ResizeObserver(() => { renderer.resize(); if (paused) renderer.render(performance.now()); }).observe(canvas);
  document.addEventListener('pointermove', e => { renderer.setPointer(e.clientX / innerWidth * 2 - 1, 1 - e.clientY / innerHeight * 2, true); }, {passive:true});
  document.addEventListener('visibilitychange',() => { if (document.hidden) { cancelAnimationFrame(frame); frame=0; } else schedule(); });
  control.addEventListener('click', () => { paused=!paused; cancelAnimationFrame(frame); frame=0; updateControl(); schedule(); });
  window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);renderer.dispose();},{once:true});
 } catch (error) { console.error(error); control.textContent='Still night'; control.title='The animated scene is unavailable on this device.'; }
}, 150);

// Suspend the original WebGL scene while the garden is on top.
document.addEventListener('gardenchange', e => {
 gardenOpen = e.detail.open;
 if (gardenOpen) { cancelAnimationFrame(frame); frame = 0; } else if (renderer) schedule();
});
