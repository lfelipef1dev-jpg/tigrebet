// Sound engine using static WAV files from /sounds/
// new Audio('/sounds/x.wav').play() inside a click handler = works in all browsers

let _enabled = true;

function play(file: string, vol = 0.7) {
  if (!_enabled || typeof window === 'undefined') return;
  try {
    const a = new Audio(`/sounds/${file}`);
    a.volume = vol;
    a.play().then(() => {
      console.log(`[SOM] ${file} OK`);
    }).catch(e => {
      console.error(`[SOM] ${file} ERRO:`, e);
    });
  } catch (e) {
    console.error(`[SOM] ${file} exceção:`, e);
  }
}

export const sounds = {
  get enabled() { return _enabled; },
  toggle(val?: boolean) { _enabled = val !== undefined ? val : !_enabled; return _enabled; },

  spin()       { play('spin.wav',      0.75); },
  win()        { play('win.wav',       0.80); },
  bigWin()     { play('bigwin.wav',    0.85); },
  tigerLuck()  { play('tigerluck.wav', 0.90); },
  loss()       { play('loss.wav',      0.55); },
  click()      { play('click.wav',     0.65); },
  reveal()     { play('reveal.wav',    0.60); },
  bomb()       { play('bomb.wav',      0.85); },
  cashout()    { play('cashout.wav',   0.80); },
  crash()      { play('crash.wav',     0.85); },
  tick()       { play('tick.wav',      0.55); },
  rocketRise() { play('rocket.wav',    0.65); },
};
