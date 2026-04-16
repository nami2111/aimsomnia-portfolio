let junoTrackEvent = null;
let mouseX = 0, mouseY = 0;

const initAsciiCanvas = () => {
  const canvas = document.getElementById('ascii-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const isDark = () => document.documentElement.classList.contains('dark');
  
  const charSet = ['~', '`', '-', '=', '+', '*', '#', '%', '@', '█', '▓', '▒', '░', '■'];
  
  const resize = () => {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  };
  
  const cellW = 10, cellH = 16;
  let cols, rows;
  let time = 0;
  let particles = [];
  
  const initParticles = () => {
    cols = Math.ceil(canvas.width / cellW);
    rows = Math.ceil(canvas.height / cellH);
    particles = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.7,
        size: 20 + Math.random() * 40
      });
    }
  };
  
  const noise2D = (x, y, t) => {
    const n1 = Math.sin(x * 0.02 + t * 0.5) * Math.cos(y * 0.015 + t * 0.3);
    const n2 = Math.sin((x + y) * 0.01 + t * 0.7);
    const n3 = Math.sin(x * 0.03 - t * 0.4) * Math.sin(y * 0.025 + t * 0.6);
    return (n1 + n2 * 0.5 + n3 * 0.3) * 0.5 + 0.5;
  };
  
  let startTime = performance.now();
  const render = () => {
    time = (performance.now() - startTime) * 0.001;
    const dark = isDark();
    
    ctx.fillStyle = dark ? '#000000' : '#ffffff';
    ctx.globalAlpha = 1;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
    
    ctx.font = `${cellH}px monospace`;
    ctx.textBaseline = 'top';
    
    const scrollY = window.scrollY;
    
    particles.forEach(p => {
      p.x += p.vx * p.speed;
      p.y += p.vy * p.speed;
      p.phase += 0.05;
      
      if (p.x < -50) p.x = canvas.width + 50;
      if (p.x > canvas.width + 50) p.x = -50;
      if (p.y < -50) p.y = canvas.height + 50;
      if (p.y > canvas.height + 50) p.y = -50;
    });
    
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const worldY = y * cellH + scrollY * 0.1;
        
        let combined = 0;
        particles.forEach(p => {
          const dx = x * cellW - p.x;
          const dy = y * cellH - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const influence = Math.max(0, 1 - dist / p.size);
          combined += influence * (Math.sin(p.phase + dist * 0.05) * 0.5 + 0.5);
        });
        
        const n = noise2D(x + time * 0.5, y + time * 0.3, time);
        const v = (n * 0.4 + (combined / particles.length) * 0.6);
        const idx = Math.floor(v * (charSet.length - 1));
        const char = charSet[Math.min(idx, charSet.length - 1)];
        
        const alpha = dark ? 0.08 + v * 0.35 : 0.12 + v * 0.45;
        
        ctx.fillStyle = dark 
          ? `rgba(100, 200, 255, ${alpha})`
          : `rgba(80, 80, 200, ${alpha})`;
        
        ctx.fillText(char, x * cellW, y * cellH);
      }
    }
    
    requestAnimationFrame(render);
  };
  
  resize();
  initParticles();
  window.addEventListener('resize', debounce(() => { resize(); initParticles(); }, 250));
  requestAnimationFrame(render);
};

const initJunoEventTracking = async () => {
  try {
    const module = await import('https://cdn.jsdelivr.net/npm/@junobuild/analytics@0.2.0/+esm');
    if (module && typeof module.trackEvent === 'function') {
      junoTrackEvent = module.trackEvent;
    }
  } catch (error) {
  }
};

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

document.addEventListener('DOMContentLoaded', () => {
  initJunoEventTracking();
  initAsciiCanvas();

  const asciiField = document.getElementById('ascii-field');
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (asciiField) {
      asciiField.style.transform = `translateY(${scrollY * 0.3}px)`;
      asciiField.style.opacity = 0.3 + (1 - scrollY / 600) * 0.7;
    }
  });

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  const initMagnetic = (el) => {
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxDist = 30;
    
    let targetX = 0, targetY = 0;
    
    const update = () => {
      const dx = mouseX - centerX;
      const dy = mouseY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 150) {
        const t = Math.min(1, dist / 150);
        const force = (1 - t) * maxDist;
        targetX = (dx / dist) * force || 0;
        targetY = (dy / dist) * force || 0;
      } else {
        targetX *= 0.9;
        targetY *= 0.9;
      }
      
      el.style.transform = `translate(${targetX}px, ${targetY}px)`;
      requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  };

  document.querySelectorAll('.magnetic').forEach(el => {
    if (el.tagName === 'A' || el.tagName === 'BUTTON') {
      initMagnetic(el);
    }
  });

  const initTiltCard = (el) => {
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const update = () => {
      const dx = mouseX - centerX;
      const dy = mouseY - centerY;
      const rotX = -dy * 0.02;
      const rotY = dx * 0.02;
      
      el.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`;
    };
    
    el.addEventListener('mouseenter', () => {
      const loop = () => { update(); requestAnimationFrame(loop); };
      loop();
    });
    
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  };

  document.querySelectorAll('.tilt-card').forEach(el => {
    initTiltCard(el);
  });

  const cards = document.querySelectorAll('article.group');
  cards.forEach(card => {
    card.addEventListener('keydown', e => { if (e.key === 'Enter') card.querySelector('a').click(); });
    card.tabIndex = 0;
  });

  const phrases = ['PIXELART','MOTION','DRAWING','AI-GEN','VIBING']
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

  const loop = async () => {
    while (true) {
      const next = phrases[idx % phrases.length];
      await scramble(hero.textContent, next, 600);
      await new Promise(r => setTimeout(r, hold));
      idx++;
    }
  };
  loop();

  const field = document.getElementById('ascii-field');
  const makeField = () => {
    const { width, height } = field.getBoundingClientRect();
    const cw = 12, ch = 20;
    const cols = Math.ceil(width / cw);
    const rows = Math.ceil(height / ch);
    const total = cols * rows;
    const arr = new Array(total).fill('.');
    field.textContent = arr.map((c, i) => ((i % cols) === cols-1) ? c+'\n' : c).join('');
    field.dataset.cols = String(cols);
    field.dataset.rows = String(rows);
  };
  const randomFlip = () => {
    const cols = parseInt(field.dataset.cols || '0', 10);
    if (!cols) return;
    const text = field.textContent || '';
    const indices = [];
    const flips = Math.floor(Math.random() * 20) + 10;
    for (let i = 0; i < flips; i++) indices.push(Math.floor(Math.random() * text.length));
    const chars = text.split('');
    indices.forEach(idx => { if (chars[idx] === '.') chars[idx] = '+'; });
    field.textContent = chars.join('');
    setTimeout(() => {
      const back = field.textContent.split('');
      indices.forEach(idx => { if (back[idx] === '+') back[idx] = '.'; });
      field.textContent = back.join('');
    }, 400 + Math.random()*600);
  };
  const handle = () => { makeField(); randomFlip(); };
  window.addEventListener('resize', debounce(makeField, 250));
  makeField();
  setInterval(randomFlip, 700);

  const grid = document.getElementById('collection-grid');
  const loading = document.getElementById('collection-loading');
  const empty = document.getElementById('collection-empty');
  const countEl = document.getElementById('collection-count');
  const searchInput = document.getElementById('search-input');
  const filterButtons = document.getElementById('filter-buttons');

  let allItems = [];

  const handleImageError = (img) => {
    img.onerror = null;
    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%231a1a1a"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23666" font-size="16"%3ENo Image%3C/text%3E%3C/svg%3E';
  };

  const createCollectionCard = (item) => {
    const a = document.createElement('article');
    a.className = 'tilt-card group bg-gray-100 dark:bg-zinc-900 rounded-xl overflow-hidden shadow-lg shadow-black/10 dark:shadow-black/40 ring-1 ring-white/5 dark:ring-black/5 transition transform hover:-translate-y-1 hover:shadow-black/20 dark:hover:shadow-black/60 flex flex-col';
    a.innerHTML = `
      <div class="relative h-48 overflow-hidden">
        <img src="${item.image}" alt="${item.name}" loading="lazy" class="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
      </div>
      <div class="p-5 flex-1 flex flex-col">
        <h3 class="text-xl font-semibold text-black dark:text-white">${item.name}</h3>
        <p class="mt-2 text-sm text-gray-700 dark:text-gray-300 line-clamp-3 min-h-[3.5rem]">${item.description || ''}</p>
        <div class="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400 min-h-[1.25rem] items-end">
          <div class="truncate">${item.type || ''}</div>
          <div class="text-right">${item.year || ''}</div>
        </div>
        <div class="mt-auto pt-4">
          <a href="${item.externalUrl}" target="_blank" rel="noopener" class="inline-flex items-center justify-center w-full rounded-lg bg-black/10 dark:bg-white/10 px-4 py-2 text-sm font-medium text-black dark:text-white hover:bg-black/20 dark:hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 dark:focus:ring-black/30 transition collection-link" data-collection="${item.name}">Check It!</a>
        </div>
      </div>`;
    const img = a.querySelector('img');
    img.onerror = () => handleImageError(img);
    return a;
  };

  const renderCollections = (items) => {
    grid.innerHTML = '';
    const frag = document.createDocumentFragment();
    items.forEach(item => {
      frag.appendChild(createCollectionCard(item));
    });
    grid.appendChild(frag);
    countEl.textContent = items.length;

    if (items.length === 0) {
      grid.classList.add('hidden');
      empty.classList.remove('hidden');
    } else {
      grid.classList.remove('hidden');
      empty.classList.add('hidden');
    }
  };

  const filterAndSearchCollections = () => {
    const searchTerm = searchInput.value.toLowerCase();
    const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';

    const filtered = allItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm) || 
                           (item.description || '').toLowerCase().includes(searchTerm);
      const matchesFilter = activeFilter === 'all' || item.type === activeFilter;
      return matchesSearch && matchesFilter;
    });

    renderCollections(filtered);
  };

  searchInput.addEventListener('input', filterAndSearchCollections);

  fetch('./collections.json')
    .then(r => r.json())
    .then(data => {
      allItems = data.collections || [];
      
      const types = new Set(allItems.map(item => item.type).filter(Boolean));
      filterButtons.innerHTML = '<button class="filter-btn active px-3 py-1.5 text-sm rounded-lg bg-black/10 dark:bg-white/10 text-black dark:text-white hover:bg-black/20 dark:hover:bg-white/20 transition" data-filter="all">All</button>';
      types.forEach(type => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn px-3 py-1.5 text-sm rounded-lg bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-zinc-700 transition';
        btn.dataset.filter = type;
        btn.textContent = type;
        filterButtons.appendChild(btn);
      });

      filterButtons.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-btn')) {
          document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active', 'bg-black/10', 'dark:bg-white/10', 'text-black', 'dark:text-white');
            btn.classList.add('bg-gray-200', 'dark:bg-zinc-800', 'text-gray-700', 'dark:text-gray-300');
          });
          e.target.classList.add('active', 'bg-black/10', 'dark:bg-white/10', 'text-black', 'dark:text-white');
          e.target.classList.remove('bg-gray-200', 'dark:bg-zinc-800', 'text-gray-700', 'dark:text-gray-300');
          filterAndSearchCollections();
        }
      });

      renderCollections(allItems);
      loading.classList.add('hidden');
      grid.classList.remove('hidden');
    })
    .catch(() => {
      const div = document.createElement('div');
      div.className = 'col-span-full text-center text-sm text-gray-400';
      div.textContent = 'Failed to load collections.';
      loading.classList.add('hidden');
      grid.classList.remove('hidden');
      grid.appendChild(div);
    });

  grid.addEventListener('click', (e) => {
    if (e.target.classList.contains('collection-link')) {
      const collectionName = e.target.getAttribute('data-collection');
      if (collectionName && junoTrackEvent) {
        junoTrackEvent({
          name: 'collection_view',
          metadata: {
            collection: collectionName,
            url: e.target.href
          }
        });
      }
    }
  });

  const vibeProjectContainer = document.getElementById('vibe-project-container');
  const vibeLoading = document.getElementById('vibe-project-loading');

  fetch('./vibe-project.json')
    .then(r => r.json())
    .then(data => {
      const items = data.collections || [];
      const frag = document.createDocumentFragment();
      items.forEach(item => {
        const projectDiv = document.createElement('div');
        projectDiv.className = 'flex flex-col md:flex-row gap-8';
        projectDiv.innerHTML = `
          <div class="md:w-[70%] flex justify-center">
            <img src="${item.preview}" alt="${item.title} preview" loading="lazy" class="rounded-lg shadow-lg dark:shadow-lg/20 object-contain w-full h-auto" style="max-height: 700px;" />
          </div>
          <div class="md:w-[30%] flex flex-col justify-start pt-0">
            <h3 class="text-2xl font-bold text-black dark:text-white mb-4">${item.title}</h3>
            <p class="text-gray-700 dark:text-gray-300 mb-6">${item.project_description}</p>
            <a href="${item.project_url}" target="_blank" rel="noopener" class="inline-flex items-center justify-center rounded-lg bg-black/10 dark:bg-white/10 px-6 py-3 text-sm font-medium text-black dark:text-white hover:bg-black/20 dark:hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 dark:focus:ring-black/30 transition w-fit project-link" data-project="${item.title}">
              Visit Project
            </a>
          </div>`;
        const img = projectDiv.querySelector('img');
        img.onerror = () => handleImageError(img);
        frag.appendChild(projectDiv);
      });
      vibeProjectContainer.appendChild(frag);
      
      vibeLoading.classList.add('hidden');
      vibeProjectContainer.classList.remove('hidden');
    })
    .catch(() => {
      const div = document.createElement('div');
      div.className = 'text-center text-sm text-gray-400';
      div.textContent = 'Failed to load projects.';
      vibeLoading.classList.add('hidden');
      vibeProjectContainer.classList.remove('hidden');
      vibeProjectContainer.appendChild(div);
    });

  vibeProjectContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('project-link')) {
      const projectName = e.target.getAttribute('data-project');
      if (projectName && junoTrackEvent) {
        junoTrackEvent({
          name: 'project_view',
          metadata: {
            project: projectName,
            url: e.target.href
          }
        });
      }
    }
  });

  const scrollToTopBtn = document.getElementById('scroll-to-top');
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      scrollToTopBtn.classList.remove('opacity-0', 'invisible');
      scrollToTopBtn.classList.add('opacity-100', 'visible');
    } else {
      scrollToTopBtn.classList.add('opacity-0', 'invisible');
      scrollToTopBtn.classList.remove('opacity-100', 'visible');
    }
  });

  scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  const themeToggle = document.getElementById('theme-toggle');
  const html = document.documentElement;

  const savedTheme = localStorage.getItem('theme') || 'dark';
  html.classList.toggle('dark', savedTheme === 'dark');
  updateThemeIcons(savedTheme === 'light');

  themeToggle.addEventListener('click', () => {
    const isLight = html.classList.toggle('dark');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    updateThemeIcons(isLight);
  });

  function updateThemeIcons(isLight) {
    const darkIcon = themeToggle.querySelector('.dark-icon');
    const lightIcon = themeToggle.querySelector('.light-icon');
    if (isLight) {
      darkIcon.classList.remove('hidden');
      lightIcon.classList.add('hidden');
    } else {
      darkIcon.classList.add('hidden');
      lightIcon.classList.remove('hidden');
    }
  }

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);

  document.querySelectorAll('.fade-in-section').forEach(section => {
    observer.observe(section);
  });
});
