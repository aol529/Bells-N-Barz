(function(){

  const STORE_KEY = 'bnb-blog-posts-v1';

  const SEED_POSTS = [
    {
      id: 'p1', title: "Why Progressive Overload Still Wins",
      slug: 'why-progressive-overload-still-wins', category: 'Health & Appearance',
      date: '2026-08-10', author: 'Coach KA', views: 412,
      cover: '', tags: ['hypertrophy','progression','basics'],
      excerpt: "No app, gadget or trend replaces the simplest rule in the book: do a little more over time.",
      body: "## The one rule that never expires\n\nEvery program in the Bell(e)s n' Barz system is built around one non-negotiable: **progressive overload**. Whether that's more weight, more reps, better form, or less rest — the body only changes when it's asked to do something it hasn't fully adapted to yet.\n\n### What this looks like week to week\n\n- Add reps within the prescribed range before adding load\n- Once you hit the top of the rep range for all sets, add weight and drop back to the bottom of the range\n- Track everything — the [logsheet](#) exists so you're not guessing\n\nDeloads aren't a break from this rule, they're part of it — a planned dip that lets the next block of overload actually land.",
      status: 'published'
    },
    {
      id: 'p2', title: "Reading Your Own RIR Honestly",
      slug: 'reading-your-own-rir-honestly', category: 'Personal Development',
      date: '2026-08-18', author: 'Coach KA', views: 268,
      cover: '', tags: ['RIR','autoregulation'],
      excerpt: "Reps in reserve only works as a tool if you're not lying to yourself about the number.",
      body: "Most people round down when they're tired and round up when they're motivated. Both wrong.\n\n**A quick gut check:** if someone offered you $1000 for one more clean rep, could you get it? If yes, you weren't at RIR 0.",
      status: 'draft'
    },
    {
      id: 'p3', title: "The Deload Week Nobody Wants to Take",
      slug: 'the-deload-week-nobody-wants-to-take', category: 'Health & Appearance',
      date: '2026-07-22', author: 'Coach KA', views: 587,
      cover: '', tags: ['deload','recovery'],
      excerpt: "Skipping deloads doesn't make you tougher — it makes the next block shorter.",
      body: "Fatigue is cumulative long before it's visible on the bar. A planned deload every 4-6 weeks isn't lost progress, it's the mechanism that lets progress keep happening.",
      status: 'published'
    },
    {
      id: 'p4', title: "Double Progression, Explained Simply",
      slug: 'double-progression-explained-simply', category: 'Health & Appearance',
      date: '2026-07-05', author: 'Coach KA', views: 731,
      cover: '', tags: ['progression','reps'],
      excerpt: "One rule that removes almost all the guesswork from adding weight to the bar.",
      body: "Hit the top of your rep range on every set? Add weight next session and drop back to the bottom of the range. That's it — that's double progression.",
      status: 'published'
    },
    {
      id: 'p5', title: "Why Your Sleep Matters More Than Your Supplements",
      slug: 'why-your-sleep-matters-more-than-your-supplements', category: 'Health & Appearance',
      date: '2026-06-28', author: 'Coach KA', views: 449,
      cover: '', tags: ['sleep','recovery'],
      excerpt: "No stack on the market compensates for five hours of sleep, night after night.",
      body: "Recovery isn't a supplement stack — it's mostly sleep, food, and stress management, in roughly that order of leverage.",
      status: 'published'
    },
    {
      id: 'p6', title: "Building the Six-Day Split: What Changed and Why",
      slug: 'building-the-six-day-split', category: 'Community & Charity',
      date: '2026-06-14', author: 'Coach KA', views: 203,
      cover: '', tags: ['program-design','split'],
      excerpt: "A look inside the SWOT-style audit that reshaped the weekly training split.",
      body: "Every restructure starts with an audit: where's the volume stacking up, where's it thin, and what's the anterior-delt seam that keeps showing up on paper.",
      status: 'published'
    },
    {
      id: 'p7', title: "Rest Intervals: Why 90 Seconds Isn't a Universal Law",
      slug: 'rest-intervals-arent-universal', category: 'Health & Appearance',
      date: '2026-06-02', author: 'Coach KA', views: 156,
      cover: '', tags: ['rest','intensity'],
      excerpt: "Compound lifts and isolation work don't need the same clock.",
      body: "Heavier compounds recruiting more muscle mass generally need longer rest to keep quality high across sets; isolation work can often run tighter.",
      status: 'published'
    },
    {
      id: 'p8', title: "Tempo Training: When It Helps and When It's Just Noise",
      slug: 'tempo-training-when-it-helps', category: 'Health & Appearance',
      date: '2026-05-19', author: 'Coach KA', views: 98,
      cover: '', tags: ['tempo','technique'],
      excerpt: "Slowing the eccentric isn't magic — but it fixes specific, common problems.",
      body: "Tempo is a tool for a problem, not a default setting. Use it when bar speed is masking poor control, not on every set of every lift.",
      status: 'published'
    },
    {
      id: 'p9', title: "Kenyan MMFs, SACCOs and T-Bills: A Quick Primer",
      slug: 'kenyan-mmfs-saccos-tbills-primer', category: 'Wealth & Finance',
      date: '2026-05-03', author: 'Coach KA', views: 812,
      cover: '', tags: ['finance','kenya'],
      excerpt: "Liquidity, income, and long-term growth — three buckets, three vehicles.",
      body: "Money Market Funds cover liquidity, SACCOs and T-Bills via DhowCSD cover income, and long-term growth needs its own separate bucket entirely.",
      status: 'published'
    },
    {
      id: 'p10', title: "Copenhagen Planks and the Adductor Gap",
      slug: 'copenhagen-planks-adductor-gap', category: 'Health & Appearance',
      date: '2026-04-20', author: 'Coach KA', views: 341,
      cover: '', tags: ['adductors','core'],
      excerpt: "The one anti-lateral-flexion drill most leg days quietly skip.",
      body: "Adductors get hit incidentally by squats and rarely get trained directly — which is exactly why they show up as the weak link during change-of-direction work.",
      status: 'published'
    },
    {
      id: 'p11', title: "The Bring Sally Up Challenge: What It Actually Trains",
      slug: 'bring-sally-up-challenge', category: 'Health & Appearance',
      date: '2026-09-20', author: 'Coach KA', views: 0,
      cover: '', tags: ['challenge','push-ups','core','conditioning'],
      excerpt: "A 3:32 song turned into a push-up gauntlet — the real difficulty isn't the rep count, it's the hold.",
      body: "## The workout hiding inside a song\n\nThe Bring Sally Up challenge isn't a program, it's a single track (Moby's \"Flower\") turned into a push-up gauntlet. The premise is almost insultingly simple: on the \"up\" cue, you push up. On the \"down\" cue, you lower until your chest is hovering an inch off the floor, and you hold there, dead still, until the next \"up.\" Repeat until the song ends.\n\n### Why it's harder than it sounds\n\nTotal rep count over the full track lands around 30 — nothing to write home about on its own. The actual demand is time under tension: every \"down\" is an isometric hold in the bottom position, not a rest. By the second half of the song, the chest, triceps, and front delts are fighting to stay stable in a dead hang above the floor, over and over, with no real recovery window.\n\n### What it trains\n\n- **Pressing strength-endurance** — not max strength, but the ability to keep producing force under fatigue\n- **Core bracing** — a sagging hip line in that hover position turns the challenge into a bad plank\n- **Pacing discipline** — the track sets the tempo, not you, so sandbagging the holds isn't an option\n\n### A caution worth saying out loud\n\nThis isn't a beginner drill. If a strict push-up plank can't be held for 60+ seconds, or 15+ strict push-ups can't be done unbroken, the hold-heavy structure here will break form long before the song ends — and bad form under fatigue is exactly how shoulders get hurt. Build the base first.\n\n### Try it in the app\n\nThere's a Bring Sally Up pacer under **Challenges** in the Members area — it calls \"Up\" and \"Down\" on a comparable cadence so the same up/down/hold structure can be run with any music playing, no need to track the original song down. Push-ups are the classic version, but the same up/down pattern works for squats or pull-ups too.",
      status: 'published'
    }
  ];

  function postToRow(p){
    return {
      id: (p.id && p.id.length === 36) ? p.id : undefined,
      title: p.title, slug: p.slug, category: p.category, date: p.date,
      author: p.author, views: p.views || 0, cover: p.cover,
      tags: p.tags || [], excerpt: p.excerpt, body: p.body, status: p.status
    };
  }
  function rowToPost(r){
    return {
      id: r.id, title: r.title, slug: r.slug, category: r.category||'',
      date: r.date, author: r.author||'', views: r.views||0, cover: r.cover||'',
      tags: r.tags||[], excerpt: r.excerpt||'', body: r.body||'', status: r.status
    };
  }

  async function migrateSeedPosts(){
    let ok = 0;
    for (const p of SEED_POSTS){
      const { data: existing } = await bnbClient.from('blog_posts').select('id').eq('slug', p.slug);
      if (existing && existing.length) continue; // already migrated
      const row = postToRow(p);
      delete row.id;
      const { error } = await bnbClient.from('blog_posts').insert([row]);
      if (error){ console.warn('Seed migration: post failed', p.slug, error); continue; }
      ok++;
    }
    return ok;
  }
  window.BNB_MIGRATE = window.BNB_MIGRATE || {};
  window.BNB_MIGRATE.posts = migrateSeedPosts;

  let postsSnapshot = [];
  function loadPosts(){
    // Instant first paint using seed data; real rows replace it once
    // Supabase responds (see refreshPostsFromSupabase below).
    return SEED_POSTS.slice();
  }
  async function refreshPostsFromSupabase(){
    const { data, error } = await bnbClient.from('blog_posts').select('*');
    if (error) { console.error('Supabase load blog_posts failed:', error); return; }
    if (data && data.length) {
      posts = data.map(rowToPost);
      postsSnapshot = posts.slice();
      if (typeof renderList === 'function') renderList();
      if (typeof renderAdmin === 'function') renderAdmin();
    }
  }
  function savePosts(){
    const oldIds = new Set(postsSnapshot.map(x=>x.id));
    const newIds = new Set(posts.map(x=>x.id));
    const removedIds = [...oldIds].filter(id => !newIds.has(id));
    postsSnapshot = posts.slice();
    (async () => {
      const realRows = posts.filter(p => p.id && p.id.length === 36);
      const rows = realRows.map(postToRow);
      const results = await Promise.allSettled(rows.map(row => bnbClient.from('blog_posts').upsert([row])));
      await Promise.allSettled(removedIds.map(id => bnbClient.from('blog_posts').delete().eq('id', id)));
      const successCount = results.filter(r => r.status === 'fulfilled' && !(r.value && r.value.error)).length;
      if (successCount === 0 && rows.length > 0){
        alert('Could not save to database — check your connection or Supabase setup.');
      }
    })();
  }

  /* ---------------- MEGATRON (hero slider) ---------------- */
  const GALLERY_STORE_KEY = 'bnb-gallery-images-v1';
  const GALLERY_SEED_IMAGES = [
    { id:'g1', url:'https://picsum.photos/seed/bnb1/800/800', title:'Deadlift Day, Block A' },
    { id:'g2', url:'https://picsum.photos/seed/bnb2/800/800', title:'12-Week Transformation — J.M.' },
    { id:'g3', url:'https://picsum.photos/seed/bnb3/800/800', title:'Facility — Free Weight Floor' },
    { id:'g4', url:'https://picsum.photos/seed/bnb4/800/800', title:'Group Session — Saturday AM' },
    { id:'g5', url:'https://picsum.photos/seed/bnb5/800/800', title:'Coach KA Coaching a Set' },
    { id:'g6', url:'https://picsum.photos/seed/bnb6/800/800', title:'Progress Check — 6 Weeks In' }
  ];
  function loadGalleryImages(){
    // Gallery is now Supabase-backed and defined later in the document —
    // read its live data once available; fall back to seed images for
    // the brief window before that module has loaded/fetched.
    if (window.BNB_GALLERY && window.BNB_GALLERY.getImages){
      const real = window.BNB_GALLERY.getImages();
      if (real.length) return real;
    }
    return GALLERY_SEED_IMAGES.slice();
  }

  const MEGATRON_STORE_KEY = 'bnb-blog-megatron-v1';
  const MEGATRON_SEED = [
    { id:'m1', imageId:'g1', caption:'' },
    { id:'m2', imageId:'g4', caption:'' },
    { id:'m3', imageId:'g2', caption:'' }
  ];
  function megatronToRow(s, idx){
    return {
      id: (s.id && s.id.length === 36) ? s.id : undefined,
      image_id: (s.imageId && s.imageId.length === 36) ? s.imageId : null,
      caption: s.caption, sort_order: idx
    };
  }
  function rowToMegatron(r){
    return { id: r.id, imageId: r.image_id, caption: r.caption||'' };
  }

  async function migrateSeedMegatron(galleryIdMap){
    let ok = 0, idx = 0;
    for (const s of MEGATRON_SEED){
      const newImageId = galleryIdMap[s.imageId];
      if (!newImageId) { idx++; continue; }
      const row = megatronToRow(s, idx);
      delete row.id;
      row.image_id = newImageId;
      const { error } = await bnbClient.from('megatron_slides').insert([row]);
      if (!error) ok++;
      idx++;
    }
    return ok;
  }
  window.BNB_MIGRATE = window.BNB_MIGRATE || {};
  window.BNB_MIGRATE.megatron = migrateSeedMegatron;

  let megatronSnapshot = [];
  function loadMegatron(){
    // Instant first paint using seed data; real rows replace it once
    // Supabase responds (see refreshMegatronFromSupabase below).
    return MEGATRON_SEED.slice();
  }
  async function refreshMegatronFromSupabase(){
    const { data, error } = await bnbClient.from('megatron_slides').select('*').order('sort_order');
    if (error) { console.error('Supabase load megatron_slides failed:', error); return; }
    if (data && data.length) {
      megatronSlides = data.map(rowToMegatron);
      megatronSnapshot = megatronSlides.slice();
      renderMegatron();
    }
  }
  function saveMegatron(){
    const oldIds = new Set(megatronSnapshot.map(x=>x.id));
    const newIds = new Set(megatronSlides.map(x=>x.id));
    const removedIds = [...oldIds].filter(id => !newIds.has(id));
    megatronSnapshot = megatronSlides.slice();
    (async () => {
      const realSlides = megatronSlides.filter(s => s.id && s.id.length === 36);
      const rows = realSlides.map(megatronToRow);
      await Promise.allSettled(rows.map(row => bnbClient.from('megatron_slides').upsert([row])));
      await Promise.allSettled(removedIds.map(id => bnbClient.from('megatron_slides').delete().eq('id', id)));
    })();
  }
  let megatronSlides = loadMegatron();
  megatronSnapshot = megatronSlides.slice();
  refreshMegatronFromSupabase(); // async — replaces seed data once Supabase responds
  let megatronIndex = 0;
  let megatronTimer = null;

  function renderMegatron(){
    const el = document.getElementById('megatron');
    if (!el) return;
    const gallery = loadGalleryImages();
    const slides = megatronSlides.map(s => {
      const img = gallery.find(g=>g.id===s.imageId);
      return img ? Object.assign({}, s, {url: img.url, title: img.title}) : null;
    }).filter(Boolean);
    if (megatronTimer){ clearInterval(megatronTimer); megatronTimer = null; }
    if (!slides.length){
      el.innerHTML = '<div class="megatron-empty">No hero slides yet — add some from Admin.</div>';
      return;
    }
    if (megatronIndex >= slides.length) megatronIndex = 0;
    el.innerHTML = slides.map((s,i)=>`
      <div class="megatron-slide${i===megatronIndex?' active':''}" style="background-image:url('${escAttr(s.url)}')">
        ${s.caption ? `<div class="megatron-caption">${esc(s.caption)}</div>` : ''}
      </div>
    `).join('') + (slides.length > 1 ? `
      <button class="megatron-arrow prev" id="megatron-prev" type="button">‹</button>
      <button class="megatron-arrow next" id="megatron-next" type="button">›</button>
      <div class="megatron-dots">${slides.map((_,i)=>`<button class="megatron-dot${i===megatronIndex?' active':''}" data-i="${i}" type="button"></button>`).join('')}</div>
    ` : '');
    if (slides.length > 1){
      document.getElementById('megatron-prev').onclick = ()=>{ megatronIndex = (megatronIndex - 1 + slides.length) % slides.length; renderMegatron(); };
      document.getElementById('megatron-next').onclick = ()=>{ megatronIndex = (megatronIndex + 1) % slides.length; renderMegatron(); };
      el.querySelectorAll('.megatron-dot').forEach(d=>{
        d.onclick = ()=>{ megatronIndex = parseInt(d.dataset.i,10); renderMegatron(); };
      });
      megatronTimer = setInterval(()=>{ megatronIndex = (megatronIndex + 1) % slides.length; renderMegatron(); }, 6000);
    }
  }

  function renderMegatronAdmin(){
    const gallery = loadGalleryImages();
    const list = document.getElementById('megatron-slide-list');
    if (!megatronSlides.length){
      list.innerHTML = '<div class="field-hint">No slides yet — add one below.</div>';
    } else {
      list.innerHTML = megatronSlides.map((s,i)=>{
        const img = gallery.find(g=>g.id===s.imageId);
        const url = img ? img.url : '';
        const label = s.caption || (img ? img.title : 'Missing image');
        return `<div class="megatron-slide-row">
          <img src="${escAttr(url)}" alt="">
          <div class="msr-cap">${esc(label)}</div>
          <div class="msr-actions">
            <button data-act="up" data-i="${i}" type="button" ${i===0?'disabled':''}>↑</button>
            <button data-act="down" data-i="${i}" type="button" ${i===megatronSlides.length-1?'disabled':''}>↓</button>
            <button data-act="remove" data-i="${i}" type="button">✕</button>
          </div>
        </div>`;
      }).join('');
    }
    list.querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const i = parseInt(btn.dataset.i, 10);
        const act = btn.dataset.act;
        if (act === 'remove'){ megatronSlides.splice(i,1); }
        else if (act === 'up' && i>0){ const tmp=megatronSlides[i-1]; megatronSlides[i-1]=megatronSlides[i]; megatronSlides[i]=tmp; }
        else if (act === 'down' && i<megatronSlides.length-1){ const tmp=megatronSlides[i+1]; megatronSlides[i+1]=megatronSlides[i]; megatronSlides[i]=tmp; }
        saveMegatron();
        renderMegatronAdmin();
        renderMegatron();
      });
    });

    const sel = document.getElementById('megatron-image-select');
    sel.innerHTML = gallery.map(g=>`<option value="${escAttr(g.id)}">${esc(g.title)}</option>`).join('');
  }

  document.getElementById('megatron-add-btn').addEventListener('click', ()=>{
    const sel = document.getElementById('megatron-image-select');
    const capInput = document.getElementById('megatron-caption-input');
    const imageId = sel.value;
    if (!imageId) return;
    megatronSlides.push({ id: window.BNB_UUID(), imageId, caption: capInput.value.trim() });
    capInput.value = '';
    saveMegatron();
    renderMegatronAdmin();
    renderMegatron();
  });

  let posts = loadPosts();
  postsSnapshot = posts.slice();
  refreshPostsFromSupabase(); // async — replaces seed data once Supabase responds
  let activeCategory = 'all';
  let searchTerm = '';
  let currentPostId = null;
  let editingId = null;

  /* ---------------- tiny markdown renderer (no deps) ---------------- */
  function mdToHtml(md){
    if (!md) return '';
    const lines = md.split('\n');
    let html = ''; let inList = false;
    function inline(t){
      t = t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      t = t.replace(/\*(.+?)\*/g, '<em>$1</em>');
      // Markdown links: escape quotes in the URL (otherwise a crafted URL
      // like `" onmouseover="...` breaks out of the href attribute and
      // injects arbitrary attributes/event handlers), and only allow
      // http(s)/mailto/relative links — javascript: and other schemes
      // would otherwise execute on click.
      t = t.replace(/\[(.+?)\]\((.+?)\)/g, (match, label, url) => {
        const safeUrl = /^(https?:|mailto:|\/|#)/i.test(url)
          ? url.replace(/"/g, '&quot;')
          : '#';
        return '<a href="' + safeUrl + '" target="_blank" rel="noopener">' + label + '</a>';
      });
      return t;
    }
    lines.forEach(raw=>{
      const line = raw.trim();
      if (line === ''){ if(inList){ html+='</ul>'; inList=false; } return; }
      if (line.startsWith('### ')){ if(inList){html+='</ul>';inList=false;} html += '<h3>'+inline(line.slice(4))+'</h3>'; return; }
      if (line.startsWith('## ')){ if(inList){html+='</ul>';inList=false;} html += '<h2>'+inline(line.slice(3))+'</h2>'; return; }
      if (line.startsWith('# ')){ if(inList){html+='</ul>';inList=false;} html += '<h2>'+inline(line.slice(2))+'</h2>'; return; }
      if (line.startsWith('- ')){ if(!inList){html+='<ul>';inList=true;} html += '<li>'+inline(line.slice(2))+'</li>'; return; }
      if(inList){ html+='</ul>'; inList=false; }
      html += '<p>'+inline(line)+'</p>';
    });
    if (inList) html += '</ul>';
    return html;
  }

  function slugify(s){
    return (s||'').toLowerCase().trim().replace(/[^\w\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-');
  }
  function fmtDate(d){
    if (!d) return '';
    const dt = new Date(d + 'T00:00:00');
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString('en-GB', {day:'numeric', month:'short', year:'numeric'});
  }

  /* ---------------- VIEW SWITCH ---------------- */
  function switchView(view){
    document.querySelectorAll('.blog-scope .view').forEach(v=>v.classList.remove('active'));
    document.getElementById('view-' + view).classList.add('active');
    document.querySelectorAll('.blog-scope #mode-switch button').forEach(b=>{
      b.classList.toggle('active', b.dataset.mode === (view === 'admin' ? 'admin' : 'read'));
    });
  }
  document.querySelectorAll('.blog-scope #mode-switch button').forEach(b=>{
    b.addEventListener('click', ()=>{
      if (b.dataset.mode === 'admin'){
        if (typeof isSignedIn === 'function' && !isSignedIn()){ goToLoginPrompt(); return; }
        if (typeof isStaff === 'function' && !isStaff()){ showStaffOnlyToast(); return; }
        switchView('admin'); renderAdmin(); renderMegatronAdmin();
      }
      else { switchView('list'); renderList(); renderMegatron(); }
    });
  });

  /* ---------------- CATEGORY CHIPS ---------------- */
  const BLOG_TOPICS = ['Recreation', 'Health & Appearance', 'Wealth & Finance', 'Love & Relationships', 'Community & Charity', 'Career', 'Personal Development'];
  function renderCategoryChips(){
    const cats = ['all', ...BLOG_TOPICS];
    const bar = document.getElementById('cat-filter');
    bar.innerHTML = '';
    cats.forEach(c=>{
      const btn = document.createElement('button');
      btn.textContent = c === 'all' ? 'All' : c;
      btn.className = c === activeCategory ? 'active' : '';
      btn.onclick = ()=>{ activeCategory = c; renderList(); };
      bar.appendChild(btn);
    });
  }

  function openPost(id){
    currentPostId = id;
    const p = posts.find(x=>x.id===id);
    if (p){ p.views = (p.views||0) + 1; savePosts(); }
    renderPost();
    switchView('post');
  }

  /* ---------------- SIDEBAR: TRENDING / NEWEST ---------------- */
  let sideSort = 'popular';

  function renderSideList(){
    const list = document.getElementById('side-post-list');
    list.innerHTML = '';
    let items = posts.filter(p => p.status === 'published');
    if (sideSort === 'popular'){
      items = items.slice().sort((a,b)=> (b.views||0) - (a.views||0));
    } else {
      items = items.slice().sort((a,b)=> (b.date||'').localeCompare(a.date||''));
    }
    items = items.slice(0, 9);

    items.forEach((p, i)=>{
      const li = document.createElement('li');
      li.className = 'side-post-item';
      const metaHtml = sideSort === 'popular'
        ? `<span>${(p.views||0).toLocaleString()} views</span>`
        : `<span>${fmtDate(p.date)}</span>`;
      li.innerHTML = `
        <span class="side-post-rank">${String(i+1).padStart(2,'0')}</span>
        <div class="side-post-body">
          <span class="side-post-title">${esc(p.title)}</span>
          <div class="side-post-meta">${metaHtml}</div>
        </div>`;
      li.onclick = ()=> openPost(p.id);
      list.appendChild(li);
    });
  }

  const sortToggle = document.getElementById('sort-toggle');
  sortToggle.querySelectorAll('button').forEach(b=>{
    b.addEventListener('click', ()=>{
      sideSort = b.dataset.sort;
      sortToggle.setAttribute('data-value', sideSort);
      sortToggle.querySelectorAll('button').forEach(x=>x.classList.toggle('active', x===b));
      renderSideList();
    });
  });

  /* ---------------- LIST VIEW ---------------- */
  function renderList(){
    renderCategoryChips();
    renderSideList();
    const grid = document.getElementById('post-grid');
    const emptyMsg = document.getElementById('empty-msg');
    grid.innerHTML = '';
    let visible = posts.filter(p => p.status === 'published');
    if (activeCategory !== 'all') visible = visible.filter(p => p.category === activeCategory);
    if (searchTerm){
      const s = searchTerm.toLowerCase();
      visible = visible.filter(p => (p.title+p.excerpt+p.body).toLowerCase().includes(s));
    }
    visible.sort((a,b)=> (b.date||'').localeCompare(a.date||''));

    if (visible.length === 0){ emptyMsg.style.display = 'block'; return; }
    emptyMsg.style.display = 'none';

    visible.forEach(p=>{
      const card = document.createElement('div');
      card.className = 'post-card';
      const coverHtml = p.cover
        ? `<div class="cover" style="background-image:url('${escAttr(p.cover)}')"></div>`
        : `<div class="cover empty">No Cover Image</div>`;
      card.innerHTML = `
        ${coverHtml}
        <div class="body">
          <div class="cat">${esc(p.category||'General')}</div>
          <h3>${esc(p.title)}</h3>
          <div class="excerpt">${esc(p.excerpt||'')}</div>
          <button class="read-more">Read more <span class="arrow">→</span></button>
          <div class="meta"><span>${esc(p.author||'')}</span><span>${fmtDate(p.date)}</span></div>
        </div>`;
      card.onclick = ()=> openPost(p.id);
      grid.appendChild(card);
    });
  }
  document.getElementById('search-input').addEventListener('input', e=>{
    searchTerm = e.target.value; renderList();
  });

  /* ---------------- SINGLE POST VIEW ---------------- */
  function renderPost(){
    const p = posts.find(x=>x.id===currentPostId);
    const wrap = document.getElementById('post-reader-content');
    if (!p){ wrap.innerHTML = '<p>Post not found.</p>'; return; }
    const coverHtml = p.cover ? `<img class="cover" src="${escAttr(p.cover)}" alt="">` : '';
    const tagsHtml = (p.tags||[]).map(t=>`<span class="tag-pill">#${esc(t)}</span>`).join('');
    wrap.innerHTML = `
      ${coverHtml}
      <div class="cat">${esc(p.category||'General')}</div>
      <h1>${esc(p.title)}</h1>
      <div class="meta">${esc(p.author||'')} &nbsp;·&nbsp; ${fmtDate(p.date)}</div>
      <div class="post-body">${mdToHtml(p.body)}</div>
      ${tagsHtml ? `<div class="post-tags">${tagsHtml}</div>` : ''}
    `;
  }
  document.getElementById('back-to-list').addEventListener('click', ()=>{ switchView('list'); renderList(); });

  /* ---------------- ADMIN TABLE ---------------- */
  let blogSort = { key: 'date', dir: 'desc' };
  function applySort(list, sort){
    return list.slice().sort((a,b)=>{
      const av = (a[sort.key]||'').toString().toLowerCase();
      const bv = (b[sort.key]||'').toString().toLowerCase();
      if (av < bv) return sort.dir === 'asc' ? -1 : 1;
      if (av > bv) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }
  function updateSortHeaderUI(rowEl, sort){
    rowEl.querySelectorAll('th[data-sort]').forEach(th=>{
      const active = th.dataset.sort === sort.key;
      th.classList.toggle('sort-active', active);
      const arrow = th.querySelector('.sort-arrow');
      if (arrow) arrow.textContent = active ? (sort.dir === 'asc' ? '▴' : '▾') : '▾';
    });
  }
  document.querySelectorAll('#admin-thead-row th[data-sort]').forEach(th=>{
    th.addEventListener('click', ()=>{
      const key = th.dataset.sort;
      if (blogSort.key === key) blogSort.dir = blogSort.dir === 'asc' ? 'desc' : 'asc';
      else { blogSort.key = key; blogSort.dir = 'asc'; }
      renderAdmin();
    });
  });
  function renderAdmin(){
    const tbody = document.getElementById('admin-tbody');
    tbody.innerHTML = '';
    updateSortHeaderUI(document.getElementById('admin-thead-row'), blogSort);
    const sorted = applySort(posts, blogSort);
    if (sorted.length === 0){
      tbody.innerHTML = '<tr><td colspan="5" style="color:var(--muted);text-align:center;padding:30px;">No posts yet — click "+ New Post" to write one.</td></tr>';
      return;
    }
    sorted.forEach(p=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><b>${esc(p.title)}</b></td>
        <td>${esc(p.category||'—')}</td>
        <td class="mono">${fmtDate(p.date)}</td>
        <td><span class="status-pill ${p.status}">${p.status}</span></td>
        <td><div class="row-actions">
          <button class="edit-btn">Edit</button>
          <button class="del del-btn">Delete</button>
        </div></td>
      `;
      tr.querySelector('.edit-btn').onclick = ()=> openEditor(p.id);
      tr.querySelector('.del-btn').onclick = ()=>{
        if (!confirm('Delete "' + p.title + '"? This cannot be undone.')) return;
        posts = posts.filter(x=>x.id!==p.id); savePosts(); renderAdmin();
      };
      tbody.appendChild(tr);
    });
  }

  /* ---------------- EDITOR PANEL ---------------- */
  const backdrop = document.getElementById('panel-backdrop');
  const fTitle = document.getElementById('f-title');
  const fSlug = document.getElementById('f-slug');
  const fCategory = document.getElementById('f-category');
  const fDate = document.getElementById('f-date');
  const fAuthor = document.getElementById('f-author');
  const fCover = document.getElementById('f-cover');
  const fTags = document.getElementById('f-tags');
  const fExcerpt = document.getElementById('f-excerpt');
  const fBody = document.getElementById('f-body');
  let slugManuallyEdited = false;
  let currentStatus = 'draft';

  fTitle.addEventListener('input', ()=>{
    if (!slugManuallyEdited) fSlug.value = slugify(fTitle.value);
  });
  fSlug.addEventListener('input', ()=> slugManuallyEdited = true);

  document.querySelectorAll('#status-toggle button').forEach(b=>{
    b.addEventListener('click', ()=>{
      currentStatus = b.dataset.status;
      document.querySelectorAll('#status-toggle button').forEach(x=>x.classList.toggle('active', x===b));
    });
  });

  function openEditor(id){
    editingId = id || null;
    slugManuallyEdited = false;
    const p = id ? posts.find(x=>x.id===id) : null;
    document.getElementById('panel-title').textContent = p ? 'Edit Post' : 'New Post';
    fTitle.value = p ? p.title : '';
    fSlug.value = p ? p.slug : '';
    if (p) slugManuallyEdited = true;
    fCategory.value = p ? p.category : 'Recreation';
    fDate.value = p ? p.date : new Date().toISOString().slice(0,10);
    fAuthor.value = p ? p.author : 'Coach KA';
    fCover.value = p ? p.cover : '';
    fTags.value = p ? (p.tags||[]).join(', ') : '';
    fExcerpt.value = p ? p.excerpt : '';
    fBody.value = p ? p.body : '';
    currentStatus = p ? p.status : 'draft';
    document.querySelectorAll('#status-toggle button').forEach(x=>x.classList.toggle('active', x.dataset.status===currentStatus));
    backdrop.classList.add('show');
  }
  document.getElementById('new-post-btn').addEventListener('click', ()=> openEditor(null));
  document.getElementById('panel-cancel').addEventListener('click', ()=> backdrop.classList.remove('show'));
  backdrop.addEventListener('click', (e)=>{ if (e.target === backdrop) backdrop.classList.remove('show'); });

  document.getElementById('panel-save').addEventListener('click', ()=>{
    if (!fTitle.value.trim()){ alert('Give the post a title first.'); return; }
    const tags = fTags.value.split(',').map(t=>t.trim()).filter(Boolean);
    const data = {
      title: fTitle.value.trim(),
      slug: fSlug.value.trim() || slugify(fTitle.value),
      category: fCategory.value.trim() || 'General',
      date: fDate.value || new Date().toISOString().slice(0,10),
      author: fAuthor.value.trim() || 'Coach KA',
      cover: fCover.value.trim(),
      tags: tags,
      excerpt: fExcerpt.value.trim(),
      body: fBody.value,
      status: currentStatus
    };
    if (editingId){
      const idx = posts.findIndex(x=>x.id===editingId);
      posts[idx] = Object.assign({id: editingId}, data);
    } else {
      data.id = window.BNB_UUID();
      posts.push(data);
    }
    savePosts();
    backdrop.classList.remove('show');
    renderAdmin();
  });

  /* ---------------- IMPORT / EXPORT ---------------- */
  document.getElementById('export-btn').addEventListener('click', ()=>{
    const blob = new Blob([JSON.stringify(posts, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'wkab-blog-posts-export.json'; a.click();
    URL.revokeObjectURL(url);
  });
  document.getElementById('import-btn').addEventListener('click', ()=> document.getElementById('import-file').click());
  document.getElementById('import-file').addEventListener('change', (e)=>{
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ()=>{
      try {
        const parsed = JSON.parse(reader.result);
        if (!Array.isArray(parsed)) throw new Error('not an array');
        posts = parsed; savePosts(); renderAdmin();
        alert('Posts imported.');
      } catch(err){ alert('That file could not be read as a valid posts JSON export.'); }
    };
    reader.readAsText(file);
  });

  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function escAttr(s){ return String(s||'').replace(/"/g,'&quot;'); }

  /* ---------------- INIT ---------------- */
  document.addEventListener('bnb-gallery-updated', renderMegatron);
  renderList();
  renderMegatron();
  renderAdmin();
  renderMegatronAdmin();

})();
