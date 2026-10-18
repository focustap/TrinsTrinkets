export const PALETTE = [
  '#fff2df',
  '#f5d3be',
  '#efb2ba',
  '#d28eaa',
  '#b19ecb',
  '#8896bd',
  '#78afc3',
  '#88bbb1',
  '#a6c79d',
  '#d3d79e',
  '#e9c676',
  '#c7a078',
  '#9a7d75',
  '#696b83',
  '#504c5c',
  '#ffffff',
];
export function openPainting(container, initial, onSave) {
  let pixels = initial ? [...initial] : Array(1024).fill(PALETTE[0]),
    undo = [],
    redo = [],
    color = PALETTE[3],
    size = 1,
    erase = false,
    down = false;
  container.innerHTML =
    '<p class="lead">A little painting for your cottage. Drag to paint; save it to hang it on the wall.</p><canvas class="paint-canvas" width="512" height="512" aria-label="Painting canvas"></canvas><div class="paint-palette">' +
    PALETTE.map(
      (c) =>
        `<button aria-label="Paint ${c}" data-color="${c}" style="background:${c}"></button>`,
    ).join('') +
    '</div><div class="paint-tools"><button data-tool="brush" class="active">Brush</button><button data-tool="eraser">Eraser</button><label>Size <select aria-label="Brush size"><option>1</option><option>2</option><option>4</option><option>8</option></select></label><button data-tool="undo">Undo</button><button data-tool="redo">Redo</button><button data-tool="clear">Clear</button><button data-tool="save">Save & hang ♡</button></div><p class="tiny" role="status">Your artwork saves in this browser.</p>';
  const canvas = container.querySelector('canvas'),
    ctx = canvas.getContext('2d');
  canvas.style.touchAction = 'none';
  const draw = () => {
    for (let y = 0; y < 32; y++)
      for (let x = 0; x < 32; x++) {
        ctx.fillStyle = pixels[y * 32 + x];
        ctx.fillRect(x * 16, y * 16, 16, 16);
      }
    container.querySelector('[data-tool="undo"]').disabled = !undo.length;
    container.querySelector('[data-tool="redo"]').disabled = !redo.length;
  };
  const snapshot = () => {
    undo.push([...pixels]);
    if (undo.length > 40) undo.shift();
    redo = [];
  };
  let last = null;
  function paint(e) {
    const r = canvas.getBoundingClientRect(),
      x = Math.floor(((e.clientX - r.left) / r.width) * 32),
      y = Math.floor(((e.clientY - r.top) / r.height) * 32);
    const start = last || { x, y },
      steps = Math.max(1, Math.abs(x - start.x), Math.abs(y - start.y));
    for (let k = 0; k <= steps; k++) {
      const px = Math.round(start.x + ((x - start.x) * k) / steps),
        py = Math.round(start.y + ((y - start.y) * k) / steps);
      for (let dy = 0; dy < size; dy++)
        for (let dx = 0; dx < size; dx++) {
          const xx = px + dx - Math.floor(size / 2),
            yy = py + dy - Math.floor(size / 2);
          if (xx >= 0 && xx < 32 && yy >= 0 && yy < 32)
            pixels[yy * 32 + xx] = erase ? PALETTE[0] : color;
        }
    }
    last = { x, y };
    draw();
  }
  canvas.onpointerdown = (e) => {
    snapshot();
    down = true;
    last = null;
    canvas.setPointerCapture(e.pointerId);
    paint(e);
  };
  canvas.onpointermove = (e) => {
    if (down) paint(e);
  };
  canvas.onpointerup = canvas.onpointercancel = () => {
    down = false;
    last = null;
  };
  container.querySelector('select').onchange = (e) =>
    (size = Number(e.target.value));
  container.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.color) {
      color = b.dataset.color;
      erase = false;
      container
        .querySelectorAll('[data-color]')
        .forEach((o) => o.classList.toggle('active', o === b));
    }
    const t = b.dataset.tool;
    if (t === 'brush' || t === 'eraser') {
      erase = t === 'eraser';
      container
        .querySelectorAll('[data-tool="brush"],[data-tool="eraser"]')
        .forEach((o) => o.classList.toggle('active', o === b));
    }
    if (t === 'undo' && undo.length) {
      redo.push([...pixels]);
      pixels = undo.pop();
    }
    if (t === 'redo' && redo.length) {
      undo.push([...pixels]);
      pixels = redo.pop();
    }
    if (t === 'clear') {
      snapshot();
      pixels.fill(PALETTE[0]);
    }
    if (t === 'save') {
      const ok = onSave([...pixels]);
      container.querySelector('[role="status"]').textContent = ok
        ? 'Saved and hung on your cottage wall ♡'
        : 'Hung for this session. Export your save to keep it.';
    }
    draw();
  };
  draw();
  return () => {
    container.onclick = null;
  };
}
