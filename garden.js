const dialog = document.querySelector('#night-garden');
const enter = document.querySelector('#enter-garden');
const leave = document.querySelector('#leave-garden');
const atmosphere = document.querySelector('#garden-motion');
const status = document.querySelector('#guest-status');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const songs = [...document.querySelectorAll('.song')];
const playerPanel = document.querySelector('#garden-player');
const mount = document.querySelector('#video-mount');
const hint = document.querySelector('#music-hint');
const original = document.querySelector('#watch-original');
let provider = 'spotify';
let arrivalTimer, closeTimer, activeSong = null, scenePaused = reducedMotion.matches;
let visit = 0;
const initialDescription = 'Moonlit Japanese garden of red spider lilies. Sumant’s silhouette sits at a table, with an empty chair waiting for you.';
function applyMotion() {
 dialog.classList.toggle('garden-paused', scenePaused);
 atmosphere.textContent = scenePaused ? 'Resume atmosphere' : 'Pause atmosphere';
 atmosphere.setAttribute('aria-pressed', String(scenePaused));
}
function arrive() {
 if (!dialog.open) return;
 dialog.classList.add('guest-arrived');
 status.textContent = 'You’re here. Stay as long as you like.';
 document.querySelector('.garden-art').setAttribute('aria-label', 'Two faceless silhouettes sit together at a small table in a moonlit Japanese garden of red spider lilies and mist.');
}
function stopMusic() {
 mount.replaceChildren();
 playerPanel.hidden = true;
 activeSong = null;
 songs.forEach(song => song.setAttribute('aria-pressed', 'false'));
 hint.textContent = 'Choose a song, then press play. Spotify may play a preview.';
}
async function openGarden() {
 if (dialog.open) return;
 const currentVisit = ++visit;
 clearTimeout(closeTimer); clearTimeout(arrivalTimer);
 dialog.classList.remove('guest-arrived');
 status.textContent = 'There’s a seat waiting for you.';
 document.querySelector('.garden-art').setAttribute('aria-label', initialDescription);
 applyMotion();
 dialog.showModal();
 dialog.scrollTop = 0;
 document.body.classList.add('in-garden');
 document.dispatchEvent(new CustomEvent('gardenchange', {detail:{open:true}}));
 requestAnimationFrame(() => requestAnimationFrame(() => { if (dialog.open) dialog.classList.add('is-visible'); }));
 // Decode both layers before the guest enters, avoiding a sudden image pop.
 const art = [...dialog.querySelectorAll('.garden-art img')];
 const loaded = await Promise.all(art.map(img => new Promise(resolve => {
  const finish = () => { img.onload = null; img.onerror = null; resolve(img.naturalWidth > 0); };
  img.onload = finish; img.onerror = finish; img.loading = 'eager';
  if (img.complete) finish();
 })));
 if (loaded.some(ok => !ok)) {
  if (currentVisit === visit && dialog.open) status.textContent = 'The garden image couldn’t load. Please refresh to try again.';
  return;
 }
 await Promise.allSettled(art.map(img => img.decode()));
 if (currentVisit !== visit || !dialog.open) return;
 arrivalTimer = setTimeout(arrive, scenePaused ? 0 : 1300);
}
function closeGarden() {
 if (!dialog.open) return;
 ++visit;
 clearTimeout(arrivalTimer);
 stopMusic();
 dialog.classList.remove('is-visible');
 closeTimer = setTimeout(() => {
  dialog.close();
  dialog.classList.remove('guest-arrived');
  document.body.classList.remove('in-garden');
  document.dispatchEvent(new CustomEvent('gardenchange', {detail:{open:false}}));
  enter.focus({preventScroll:true});
 }, reducedMotion.matches ? 0 : 850);
}
enter.addEventListener('click', openGarden);
leave.addEventListener('click', closeGarden);
dialog.addEventListener('cancel', e => {e.preventDefault(); closeGarden();});
atmosphere.addEventListener('click', () => {scenePaused=!scenePaused;applyMotion();if(scenePaused){clearTimeout(arrivalTimer);arrive();}});
reducedMotion.addEventListener('change', e => {scenePaused=e.matches;applyMotion();if(scenePaused && dialog.open){clearTimeout(arrivalTimer);arrive();}});
function renderPlayer() {
 const song = activeSong;
 if (!song) return;
 mount.replaceChildren();
 const title = song.querySelector('strong').textContent;
 const iframe = document.createElement('iframe');
 iframe.title = `${title} — official ${provider === 'spotify' ? 'Spotify' : 'YouTube'} player`;
 iframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture; web-share';
 iframe.allowFullscreen = true;
 iframe.referrerPolicy = 'strict-origin-when-cross-origin';
 iframe.className = provider;
 if (provider === 'spotify') {
  iframe.src = `https://open.spotify.com/embed/track/${song.dataset.track}?theme=0`;
  original.href = `https://open.spotify.com/track/${song.dataset.track}`;
  original.textContent = 'Open on Spotify';
  hint.textContent = 'Press play below. Spotify may offer a preview; sign in there for full-track availability.';
 } else {
  iframe.src = `https://www.youtube-nocookie.com/embed/${song.dataset.video}?autoplay=1&playsinline=1&rel=0`;
  original.href = `https://www.youtube.com/watch?v=${song.dataset.video}`;
  original.textContent = 'Open on YouTube';
  hint.textContent = 'Press play below. If YouTube restricts playback, try Spotify or open on YouTube.';
 }
 mount.append(iframe); playerPanel.hidden = false;
 document.querySelectorAll('[data-provider]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.provider === provider)));
}
songs.forEach(song => song.addEventListener('click', () => {
 if (activeSong === song) {stopMusic();return;}
 stopMusic(); activeSong = song;
 song.setAttribute('aria-pressed', 'true');
 renderPlayer();
}));
document.querySelectorAll('[data-provider]').forEach(button => button.addEventListener('click', () => {
 if (provider === button.dataset.provider) return;
 provider = button.dataset.provider; renderPlayer();
}));
document.querySelector('#stop-song').addEventListener('click', stopMusic);
window.addEventListener('pagehide',stopMusic);
applyMotion();
