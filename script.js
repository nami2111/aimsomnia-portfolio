      document.addEventListener('DOMContentLoaded', () => {
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
          const cw = 12, ch = 20; // approx char cell
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
          const flips = Math.floor(Math.random() * 20) + 10; // 10-30 flips
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
        window.addEventListener('resize', makeField);
        makeField();
        setInterval(randomFlip, 700);

        const grid = document.getElementById('collection-grid');
        fetch('./collections.json')
          .then(r => r.json())
          .then(data => {
            const items = data.collections || [];
            const frag = document.createDocumentFragment();
            items.forEach(item => {
              const a = document.createElement('article');
              a.className = 'group bg-zinc-900 rounded-xl overflow-hidden shadow-lg shadow-black/40 ring-1 ring-white/5 transition transform hover:-translate-y-1 hover:shadow-black/60 flex flex-col';
              a.innerHTML = `
                <div class="relative h-48 overflow-hidden">
                  <img src="${item.image}" alt="${item.name}" class="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                </div>
                <div class="p-5 flex-1 flex flex-col">
                  <h3 class="text-xl font-semibold text-white">${item.name}</h3>
                  <p class="mt-2 text-sm text-gray-300 line-clamp-3 min-h-[3.5rem]">${item.description || ''}</p>
                  <div class="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-400 min-h-[1.25rem] items-end">
                    <div class="truncate">${item.type || ''}</div>
                    <div class="text-right">${item.year || ''}</div>
                  </div>
                  <div class="mt-auto pt-4">
                    <a href="${item.externalUrl}" target="_blank" rel="noopener" class="inline-flex items-center justify-center w-full rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 transition">Check It!</a>
                  </div>
                </div>`;
              frag.appendChild(a);
            });
            grid.appendChild(frag);
          })
          .catch(() => {
            const div = document.createElement('div');
            div.className = 'col-span-full text-center text-sm text-gray-400';
            div.textContent = 'Failed to load collections.';
            grid.appendChild(div);
          });

        // Vibe-Project Section
        const vibeProjectContainer = document.getElementById('vibe-project-container');
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
                  <img src="${item.preview}" alt="${item.title} preview" class="rounded-lg shadow-lg object-contain w-full h-auto" style="max-height: 700px;">
                </div>
                <div class="md:w-[30%] flex flex-col justify-start pt-0">
                  <h3 class="text-2xl font-bold text-white mb-4">${item.title}</h3>
                  <p class="text-gray-300 mb-6">${item.project_description}</p>
                  <a href="${item.project_url}" target="_blank" rel="noopener" class="inline-flex items-center justify-center rounded-lg bg-white/10 px-6 py-3 text-sm font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 transition w-fit">
                    Visit Project
                  </a>
                </div>`;
              frag.appendChild(projectDiv);
            });
            vibeProjectContainer.appendChild(frag);
          })
          .catch(() => {
            const div = document.createElement('div');
            div.className = 'text-center text-sm text-gray-400';
            div.textContent = 'Failed to load projects.';
            vibeProjectContainer.appendChild(div);
          });
      });
