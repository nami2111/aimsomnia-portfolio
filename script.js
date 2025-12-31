let junoTrackEvent = null;

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
    a.className = 'group bg-zinc-900 rounded-xl overflow-hidden shadow-lg shadow-black/40 ring-1 ring-white/5 transition transform hover:-translate-y-1 hover:shadow-black/60 flex flex-col';
    a.innerHTML = `
      <div class="relative h-48 overflow-hidden">
        <img src="${item.image}" alt="${item.name}" loading="lazy" class="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
      </div>
      <div class="p-5 flex-1 flex flex-col">
        <h3 class="text-xl font-semibold text-white">${item.name}</h3>
        <p class="mt-2 text-sm text-gray-300 line-clamp-3 min-h-[3.5rem]">${item.description || ''}</p>
        <div class="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-400 min-h-[1.25rem] items-end">
          <div class="truncate">${item.type || ''}</div>
          <div class="text-right">${item.year || ''}</div>
        </div>
        <div class="mt-auto pt-4">
          <a href="${item.externalUrl}" target="_blank" rel="noopener" class="inline-flex items-center justify-center w-full rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 transition collection-link" data-collection="${item.name}">Check It!</a>
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
      filterButtons.innerHTML = '<button class="filter-btn active px-3 py-1.5 text-sm rounded-lg bg-white/10 text-white hover:bg-white/20 transition" data-filter="all">All</button>';
      types.forEach(type => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn px-3 py-1.5 text-sm rounded-lg bg-zinc-800 text-gray-300 hover:bg-zinc-700 transition';
        btn.dataset.filter = type;
        btn.textContent = type;
        filterButtons.appendChild(btn);
      });

      filterButtons.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-btn')) {
          document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active', 'bg-white/10', 'text-white');
            btn.classList.add('bg-zinc-800', 'text-gray-300');
          });
          e.target.classList.add('active', 'bg-white/10', 'text-white');
          e.target.classList.remove('bg-zinc-800', 'text-gray-300');
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
            <img src="${item.preview}" alt="${item.title} preview" loading="lazy" class="rounded-lg shadow-lg object-contain w-full h-auto" style="max-height: 700px;" />
          </div>
          <div class="md:w-[30%] flex flex-col justify-start pt-0">
            <h3 class="text-2xl font-bold text-white mb-4">${item.title}</h3>
            <p class="text-gray-300 mb-6">${item.project_description}</p>
            <a href="${item.project_url}" target="_blank" rel="noopener" class="inline-flex items-center justify-center rounded-lg bg-white/10 px-6 py-3 text-sm font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 transition w-fit project-link" data-project="${item.title}">
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
});
