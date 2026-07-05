let junoTrackEvent = null;

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

const initAsciiCanvas = () => {
  const canvas = document.getElementById('ascii-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const isDark = () => document.documentElement.classList.contains('dark');

  const charSet = ['·', '⋅', '∘', '○', '◦', '◎', '●', '◉', '■', '█', '▓', '█'];

  const resize = () => {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  };

  const cellW = 8, cellH = 14;
  let cols, rows;
  let time = 0;
  let waves = [];
  let blobs = [];

  const initWaves = () => {
    cols = Math.ceil(canvas.width / cellW);
    rows = Math.ceil(canvas.height / cellH);
    waves = [];
    for (let i = 0; i < 6; i++) {
      waves.push({
        cx: Math.random() * canvas.width,
        cy: Math.random() * canvas.height,
        rx: 200 + Math.random() * 400,
        ry: 160 + Math.random() * 300,
        speed: 0.3 + Math.random() * 0.5,
        angle: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        phase: Math.random() * Math.PI * 2
      });
    }

    blobs = [];
    for (let i = 0; i < 25; i++) {
      blobs.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: 60 + Math.random() * 160,
        freq: 0.5 + Math.random() * 1.5,
        amp: 0.3 + Math.random() * 0.7,
        offset: Math.random() * Math.PI * 2
      });
    }
  };

  const getWaveValue = (x, y, t) => {
    let v = 0;
    waves.forEach(w => {
      const dx = x - w.cx;
      const dy = y - w.cy;
      const rotX = dx * Math.cos(w.angle) - dy * Math.sin(w.angle);
      const rotY = dx * Math.sin(w.angle) + dy * Math.cos(w.angle);
      const ellipse = Math.sqrt((rotX / w.rx) ** 2 + (rotY / w.ry) ** 2);
      v += Math.sin(ellipse * 4 - t * w.speed * 2 + w.phase) * Math.exp(-ellipse * 0.5);
    });
    return v * 0.5 + 0.5;
  };

  const getBlobValue = (x, y, t) => {
    let v = 0;
    blobs.forEach(b => {
      const dx = x - b.x;
      const dy = y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const wave = Math.sin(dist * b.freq * 0.02 - t + b.offset) * b.amp;
      v += Math.max(0, 1 - dist / b.radius) * (wave * 0.5 + 0.5);
    });
    return Math.min(1, v);
  };

  const startTime = performance.now();
  const render = () => {
    time = (performance.now() - startTime) * 0.001;
    const dark = isDark();

    ctx.fillStyle = dark ? '#000000' : '#ffffff';
    ctx.globalAlpha = 1;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = `${cellH}px monospace`;
    ctx.textBaseline = 'top';

    waves.forEach(w => {
      w.cx += Math.cos(w.angle) * w.speed * 1.5;
      w.cy += Math.sin(w.angle) * w.speed * 1.5;
      w.angle += w.rotSpeed * 1.5;

      if (w.cx < -w.rx) w.cx = canvas.width + w.rx;
      if (w.cx > canvas.width + w.rx) w.cx = -w.rx;
      if (w.cy < -w.ry) w.cy = canvas.height + w.ry;
      if (w.cy > canvas.height + w.ry) w.cy = -w.ry;
    });

    blobs.forEach(b => {
      b.x += b.vx * 2;
      b.y += b.vy * 2;

      if (b.x < -b.radius) b.x = canvas.width + b.radius;
      if (b.x > canvas.width + b.radius) b.x = -b.radius;
      if (b.y < -b.radius) b.y = canvas.height + b.radius;
      if (b.y > canvas.height + b.radius) b.y = -b.radius;
    });

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const px = x * cellW;
        const py = y * cellH;

        const waveV = getWaveValue(px, py, time);
        const blobV = getBlobValue(px, py, time);
        const noise = Math.sin(x * 0.15 + time * 0.8) * Math.cos(y * 0.12 + time * 0.6) * 0.5 + 0.5;

        const v = waveV * 0.4 + blobV * 0.4 + noise * 0.2;
        const idx = Math.floor(v * (charSet.length - 1));
        const char = charSet[Math.min(idx, charSet.length - 1)];

        const charAlpha = dark ? 0.15 + v * 0.5 : 0.2 + v * 0.55;
        const r = dark ? 80 : 40;
        const g = dark ? 180 : 60;
        const b = dark ? 255 : 140;
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${charAlpha})`;

        ctx.fillText(char, px, py);
      }
    }

    requestAnimationFrame(render);
  };

  resize();
  initWaves();
  window.addEventListener('resize', debounce(() => { resize(); initWaves(); }, 250));
  requestAnimationFrame(render);
};

const initJunoEventTracking = async () => {
  try {
    const module = await import('https://cdn.jsdelivr.net/npm/@junobuild/analytics@0.2.0/+esm');
    if (module && typeof module.trackEvent === 'function') {
      junoTrackEvent = module.trackEvent;
    }
  } catch (error) {}
};

document.addEventListener('DOMContentLoaded', () => {
  initJunoEventTracking();
  initAsciiCanvas();

  // Theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  const html = document.documentElement;
  const updateThemeIcons = (isLight) => {
    const darkIcon = themeToggle.querySelector('.dark-icon');
    const lightIcon = themeToggle.querySelector('.light-icon');
    darkIcon.classList.toggle('hidden', !isLight);
    lightIcon.classList.toggle('hidden', isLight);
  };
  const savedTheme = localStorage.getItem('theme') || 'dark';
  html.classList.toggle('dark', savedTheme === 'dark');
  updateThemeIcons(savedTheme === 'light');
  themeToggle.addEventListener('click', () => {
    const isDark = html.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIcons(!isDark);
  });

  // Hero scramble rotator
  const phrases = ['PIXELART', 'MOTION', 'DRAWING', 'AI-GEN', 'VIBING'];
  const hero = document.getElementById('hero-rotator');
  let idx = 0;
  const hold = 900;
  const scramble = (from, to, durationMs = 100) => {
    const start = performance.now();
    const maxLen = Math.max(from.length, to.length);
    const chars = "::++::|::++::|::++::|::++::|::++::|::++::|";
    const result = Array(maxLen).fill('');
    return new Promise(resolve => {
      const step = (now) => {
        const t = Math.min(1, (now - start) / durationMs);
        for (let i = 0; i < maxLen; i++) {
          const revealPoint = i / maxLen;
          if (t > revealPoint) result[i] = to[i] || '';
          else result[i] = chars[Math.floor(Math.random() * chars.length)];
        }
        hero.textContent = result.join('');
        if (t < 1) requestAnimationFrame(step); else resolve();
      };
      requestAnimationFrame(step);
    });
  };
  (async () => {
    while (true) {
      const next = phrases[idx % phrases.length];
      await scramble(hero.textContent, next, 600);
      await new Promise(r => setTimeout(r, hold));
      idx++;
    }
  })();

  // Collection: thin-line rows
  const grid = document.getElementById('collection-grid');
  const empty = document.getElementById('collection-empty');
  const countEl = document.getElementById('collection-count');

  const arrow = '<svg class="h-3.5 w-3.5 shrink-0 text-gray-400 group-hover:text-black dark:group-hover:text-white transition" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M7 17L17 7M17 7H8M17 7v9"/></svg>';

  const createCollectionRow = (item) => {
    const a = document.createElement('a');
    a.href = item.externalUrl;
    a.target = '_blank';
    a.rel = 'noopener';
    a.className = 'collection-link group flex items-baseline justify-between gap-4 border-b border-black/[0.07] dark:border-white/[0.07] py-2.5 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition';
    a.dataset.collection = item.name;
    a.innerHTML = `
      <span class="flex items-baseline gap-3 min-w-0">
        <span class="text-sm font-medium text-black dark:text-white truncate">${item.name}</span>
        <span class="text-xs text-gray-500 dark:text-gray-500 truncate">${item.type || ''}</span>
      </span>
      <span class="flex items-center gap-3 shrink-0">
        <span class="text-xs text-gray-400 dark:text-gray-600 tabular-nums">${item.year || ''}</span>
        ${arrow}
      </span>`;
    return a;
  };

  const renderCollections = (items) => {
    grid.innerHTML = '';
    const frag = document.createDocumentFragment();
    items.forEach(item => frag.appendChild(createCollectionRow(item)));
    grid.appendChild(frag);
    countEl.textContent = items.length;
    grid.classList.toggle('hidden', items.length === 0);
    empty.classList.toggle('hidden', items.length !== 0);
  };

  fetch('./collections.json')
    .then(r => r.json())
    .then(data => renderCollections(data.collections || []))
    .catch(() => {
      grid.innerHTML = '<div class="py-6 text-center text-xs text-gray-400">Failed to load collections.</div>';
    });

  grid.addEventListener('click', (e) => {
    const link = e.target.closest('.collection-link');
    if (link && junoTrackEvent) {
      junoTrackEvent({
        name: 'collection_view',
        metadata: { collection: link.dataset.collection, url: link.href }
      });
    }
  });

  // Vibe-Project: thin-line rows
  const vibeGrid = document.getElementById('vibe-project-grid');

  const createVibeRow = (item) => {
    const a = document.createElement('a');
    a.href = item.project_url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.className = 'project-link group flex items-baseline justify-between gap-4 border-b border-black/[0.07] dark:border-white/[0.07] py-2.5 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition';
    a.dataset.project = item.title;
    a.innerHTML = `
      <span class="flex items-baseline gap-3 min-w-0">
        <span class="text-sm font-medium text-black dark:text-white shrink-0">${item.title}</span>
        <span class="text-xs text-gray-500 dark:text-gray-500 truncate">${item.project_description || ''}</span>
      </span>
      ${arrow}`;
    return a;
  };

  fetch('./vibe-project.json')
    .then(r => r.json())
    .then(data => {
      const frag = document.createDocumentFragment();
      (data.collections || []).forEach(item => frag.appendChild(createVibeRow(item)));
      vibeGrid.appendChild(frag);
    })
    .catch(() => {
      vibeGrid.innerHTML = '<div class="py-3 text-center text-xs text-gray-400">Failed to load projects.</div>';
    });

  vibeGrid.addEventListener('click', (e) => {
    const link = e.target.closest('.project-link');
    if (link && junoTrackEvent) {
      junoTrackEvent({
        name: 'project_view',
        metadata: { project: link.dataset.project, url: link.href }
      });
    }
  });
});
