(function(){
  // The reader (gallery grid, lightbox) is on the main site; the editor is in
  // js/bells-n-barz-gallery-admin.js on the staff portal, which loads this
  // file for its data but has none of the reader's markup.
  const HAS_READER = !!document.getElementById('gal-view-gallery');

  const STORE_KEY = 'bnb-gallery-images-v1';

  const SEED_IMAGES = [
    { id:'g1', url:'https://picsum.photos/seed/bnb1/800/800', title:'Deadlift Day, Block A', category:'Sessions', date:'2026-08-12', alt:'Athlete performing a barbell deadlift', caption:'Working set 3 of 4, Romanian Deadlifts.', featured:true, likes:24 },
    { id:'g2', url:'https://picsum.photos/seed/bnb2/800/800', title:'12-Week Transformation — J.M.', category:'Transformations', date:'2026-08-01', alt:'Before and after transformation photo', caption:'Twelve weeks on the six-day split, consistent logging.', featured:true, likes:57 },
    { id:'g3', url:'https://picsum.photos/seed/bnb3/800/800', title:'Facility — Free Weight Floor', category:'Facility', date:'2026-07-20', alt:'Gym free weight floor with racks and benches', caption:'Where Monday and Saturday sessions happen.', featured:false, likes:9 },
    { id:'g4', url:'https://picsum.photos/seed/bnb4/800/800', title:'Group Session — Saturday AM', category:'Sessions', date:'2026-07-15', alt:'Group of athletes training together', caption:'Saturday morning chest & arms group block.', featured:false, likes:15 },
    { id:'g5', url:'https://picsum.photos/seed/bnb5/800/800', title:'Coach KA Coaching a Set', category:'Sessions', date:'2026-07-02', alt:'Coach spotting an athlete during a lift', caption:'Cueing bar path on the incline press.', featured:false, likes:12 },
    { id:'g6', url:'https://picsum.photos/seed/bnb6/800/800', title:'Progress Check — 6 Weeks In', category:'Transformations', date:'2026-06-18', alt:'Progress photo at the six week mark', caption:'Six weeks of double progression on the press.', featured:false, likes:31 }
  ];

  function imageToRow(img){
    return {
      id: (img.id && img.id.length === 36) ? img.id : undefined,
      url: img.url, title: img.title, category: img.category, date: img.date || null,
      alt: img.alt, caption: img.caption, featured: !!img.featured, likes: img.likes || 0
    };
  }
  function rowToImage(r){
    return {
      id: r.id, url: r.url, title: r.title, category: r.category||'',
      date: r.date||'', alt: r.alt||'', caption: r.caption||'',
      featured: !!r.featured, likes: r.likes||0
    };
  }

  async function migrateSeedGallery(){
    const idMap = {};
    for (const img of SEED_IMAGES){
      const { data: existing } = await bnbClient.from('gallery_images').select('id').eq('title', img.title);
      if (existing && existing.length){ idMap[img.id] = existing[0].id; continue; }
      const row = imageToRow(img);
      delete row.id;
      const { data, error } = await bnbClient.from('gallery_images').insert([row]).select();
      if (error){ console.warn('Seed migration: gallery image failed', img.title, error); continue; }
      idMap[img.id] = data[0].id;
    }
    return idMap;
  }
  window.BNB_MIGRATE = window.BNB_MIGRATE || {};
  window.BNB_MIGRATE.gallery = migrateSeedGallery;

  function loadImages(){
    // Instant first paint using seed data; real rows replace it once
    // Supabase responds (see refreshImagesFromSupabase below).
    return SEED_IMAGES.slice();
  }
  let imagesSnapshot = [];
  async function refreshImagesFromSupabase(){
    const { data, error } = await bnbClient.from('gallery_images').select('*');
    if (error) { console.error('Supabase load gallery_images failed:', error); return; }
    if (data && data.length) {
      images = data.map(rowToImage);
      imagesSnapshot = images.slice();
      if (window.bnbGalleryAdmin) window.bnbGalleryAdmin.render();
      if (typeof render === 'function') render();
      document.dispatchEvent(new CustomEvent('bnb-gallery-updated'));
    }
  }
  function saveImages(){
    // Per-row upsert + diff-based delete (see saveUsers()/saveClasses()
    // elsewhere for why): a batch upsert fails entirely under RLS if any
    // row is blocked, and upsert alone never removes deleted rows.
    const oldIds = new Set(imagesSnapshot.map(x=>x.id));
    const newIds = new Set(images.map(x=>x.id));
    const removedIds = [...oldIds].filter(id => !newIds.has(id));
    imagesSnapshot = images.slice();
    (async () => {
      const realImages = images.filter(img => img.id && img.id.length === 36);
      const rows = realImages.map(imageToRow);
      const results = await Promise.allSettled(rows.map(row => bnbClient.from('gallery_images').upsert([row])));
      await Promise.allSettled(removedIds.map(id => bnbClient.from('gallery_images').delete().eq('id', id)));
      const successCount = results.filter(r => r.status === 'fulfilled' && !(r.value && r.value.error)).length;
      if (successCount === 0 && rows.length > 0){
        alert('Could not save to database — check your connection or Supabase setup.');
      } else {
        document.dispatchEvent(new CustomEvent('bnb-gallery-updated'));
      }
    })();
  }

  const LIKED_KEY = 'bnb-gallery-liked-ids-v1';
  function loadLikedIds(){
    try { return new Set(JSON.parse(localStorage.getItem(LIKED_KEY) || '[]')); }
    catch(e){ return new Set(); }
  }
  function saveLikedIds(){
    try { localStorage.setItem(LIKED_KEY, JSON.stringify([...likedIds])); } catch(e){}
  }

  let images = loadImages();
  refreshImagesFromSupabase(); // async — replaces seed data once Supabase responds
  imagesSnapshot = images.slice();
  window.BNB_GALLERY = { getImages: function(){ return images.slice(); } };
  let likedIds = loadLikedIds();
  let activeCategory = 'all';
  let editingId = null;
  let currentSource = 'url';
  let lightboxIndex = 0;
  let lightboxList = [];

  function toggleLike(id){
    const img = images.find(x=>x.id===id);
    if (!img) return;
    img.likes = img.likes || 0;
    if (likedIds.has(id)){
      likedIds.delete(id);
      img.likes = Math.max(0, img.likes - 1);
    } else {
      likedIds.add(id);
      img.likes += 1;
    }
    saveImages();
    saveLikedIds();
  }

  let toastTimer = null;
  function showToast(msg){
    const t = document.getElementById('gal-toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=> t.classList.remove('show'), 2200);
  }

  function legacyCopy(text){
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch(e){ return false; }
  }

  function shareImage(img){
    const shareUrl = location.href.split('#')[0] + '#gallery-' + img.id;
    const shareData = { title: img.title, text: img.caption || img.title, url: shareUrl };
    if (navigator.share){
      navigator.share(shareData).catch(()=>{ /* user cancelled — no-op */ });
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(shareUrl)
        .then(()=> showToast('Link copied to clipboard'))
        .catch(()=>{
          if (legacyCopy(shareUrl)) showToast('Link copied to clipboard');
          else showToast(shareUrl);
        });
      return;
    }
    if (legacyCopy(shareUrl)) showToast('Link copied to clipboard');
    else showToast(shareUrl);
  }

  function fmtDate(d){
    if (!d) return '';
    const dt = new Date(d + 'T00:00:00');
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString('en-GB', {day:'numeric', month:'short', year:'numeric'});
  }
  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function escAttr(s){ return String(s||'').replace(/"/g,'&quot;'); }

  /* ---------------- VIEW SWITCH ---------------- */
  function switchView(view){
    document.querySelectorAll('.gallery-scope .view').forEach(v=>v.classList.remove('active'));
    document.getElementById('gal-view-' + view).classList.add('active');
    document.querySelectorAll('#gal-mode-switch button').forEach(b=>{
      b.classList.toggle('active', b.dataset.mode === (view === 'admin' ? 'admin' : 'view'));
    });
  }
  if (HAS_READER) document.querySelectorAll('#gal-mode-switch button').forEach(b=>{
    b.addEventListener('click', ()=>{
      if (b.dataset.mode === 'admin'){
        if (typeof isSignedIn === 'function' && !isSignedIn()){ goToLoginPrompt(); return; }
        if (typeof isStaff === 'function' && !isStaff()){ showStaffOnlyToast(); return; }
        bnbLoadModule('galleryAdmin').then(()=>{ switchView('admin'); if (window.bnbGalleryAdmin) window.bnbGalleryAdmin.render(); }).catch(err => console.error(err));
      }
      else { switchView('gallery'); renderGallery(); }
    });
  });

  /* ---------------- CATEGORY CHIPS ---------------- */
  // Category cards (icon, name, photo count) — clicking one filters the
  // grid below, same as the old pills.
  const CATEGORY_ICONS = { all: '🖼️', 'Sessions': '🏋️', 'Transformations': '🔄', 'Facility': '🏢' };
  function renderCategoryChips(){
    if (!HAS_READER) return;
    const cats = ['all', ...new Set(images.map(g=>g.category).filter(Boolean))];
    const bar = document.getElementById('gal-cat-filter');
    bar.innerHTML = '';
    cats.forEach(c=>{
      const n = c === 'all' ? images.length : images.filter(g => g.category === c).length;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cat-card' + (c === activeCategory ? ' active' : '') + (n === 0 ? ' empty' : '');
      btn.innerHTML = '<span class="cat-card-icon" aria-hidden="true">' + (CATEGORY_ICONS[c] || '📷') + '</span>'
        + '<span class="cat-card-name">' + esc(c === 'all' ? 'All' : c) + '</span>'
        + '<span class="cat-card-count">' + n + ' photo' + (n === 1 ? '' : 's') + '</span>';
      btn.onclick = ()=>{ activeCategory = c; renderGallery(); };
      bar.appendChild(btn);
    });
  }

  /* ---------------- GALLERY GRID ---------------- */
  function renderGallery(){
    if (!HAS_READER) return;
    renderCategoryChips();
    const grid = document.getElementById('gal-gallery-grid');
    const emptyMsg = document.getElementById('gal-empty-msg');
    grid.innerHTML = '';

    let visible = images.slice();
    if (activeCategory !== 'all') visible = visible.filter(g => g.category === activeCategory);
    visible.sort((a,b)=> (b.date||'').localeCompare(a.date||''));

    document.getElementById('gal-result-count').textContent = visible.length + (visible.length === 1 ? ' image' : ' images');

    if (visible.length === 0){ emptyMsg.style.display = 'block'; return; }
    emptyMsg.style.display = 'none';

    lightboxList = visible;

    visible.forEach((g, i)=>{
      const item = document.createElement('div');
      item.className = 'gallery-item' + (g.featured ? ' featured' : '');
      const isLiked = likedIds.has(g.id);
      item.innerHTML = `
        <img src="${escAttr(g.url)}" alt="${escAttr(g.alt||g.title||'')}" loading="lazy">
        <div class="card-actions">
          <button class="like-btn${isLiked ? ' liked' : ''}" title="Like" aria-label="Like">${isLiked ? '♥' : '♡'}</button>
          <button class="share-btn" title="Share" aria-label="Share">↗</button>
        </div>
        <div class="overlay">
          <div class="cap-cat">${esc(g.category||'General')}</div>
          <div class="cap-title">${esc(g.title)}</div>
          <div class="overlay-meta"><span class="like-count">♡ ${g.likes||0}</span></div>
        </div>`;
      item.onclick = ()=> openLightbox(i);
      item.querySelector('.like-btn').addEventListener('click', (e)=>{
        e.stopPropagation();
        toggleLike(g.id);
        renderGallery();
      });
      item.querySelector('.share-btn').addEventListener('click', (e)=>{
        e.stopPropagation();
        shareImage(g);
      });
      grid.appendChild(item);
    });
  }

  /* ---------------- LIGHTBOX ---------------- */
  const lbBackdrop = document.getElementById('gal-lightbox-backdrop');
  const LB_ZOOM_MIN = 1, LB_ZOOM_MAX = 3, LB_ZOOM_STEP = 0.25;
  let lbZoom = 1;
  function setLightboxZoom(z){
    lbZoom = Math.min(LB_ZOOM_MAX, Math.max(LB_ZOOM_MIN, z));
    const img = document.getElementById('gal-lightbox-img');
    img.style.transform = 'scale(' + lbZoom + ')';
    document.getElementById('gal-zoom-level').textContent = Math.round(lbZoom * 100) + '%';
    document.getElementById('gal-lightbox-img-wrap').classList.toggle('zoomed', lbZoom > 1);
  }
  if (HAS_READER){
  document.getElementById('gal-zoom-in').addEventListener('click', ()=> setLightboxZoom(lbZoom + LB_ZOOM_STEP));
  document.getElementById('gal-zoom-out').addEventListener('click', ()=> setLightboxZoom(lbZoom - LB_ZOOM_STEP));
  document.getElementById('gal-zoom-reset').addEventListener('click', ()=> setLightboxZoom(1));
  }
  function openLightbox(i){
    lightboxIndex = i;
    renderLightbox();
    lbBackdrop.classList.add('show');
  }
  function renderLightbox(){
    const g = lightboxList[lightboxIndex];
    if (!g) return;
    document.getElementById('gal-lightbox-img').src = g.url;
    document.getElementById('gal-lightbox-img').alt = g.alt || g.title || '';
    document.getElementById('gal-lightbox-cat').textContent = g.category || 'General';
    document.getElementById('gal-lightbox-title').textContent = g.title || '';
    document.getElementById('gal-lightbox-caption').textContent = g.caption || '';
    document.getElementById('gal-lightbox-counter').textContent = (lightboxIndex+1) + ' / ' + lightboxList.length;
    setLightboxZoom(1);

    const isLiked = likedIds.has(g.id);
    const likeBtn = document.getElementById('gal-lightbox-like-btn');
    likeBtn.classList.toggle('liked', isLiked);
    document.getElementById('gal-lightbox-like-icon').textContent = isLiked ? '♥' : '♡';
    document.getElementById('gal-lightbox-like-count').textContent = g.likes || 0;
  }
  function closeLightbox(){ lbBackdrop.classList.remove('show'); }
  function nextLightbox(){ lightboxIndex = (lightboxIndex+1) % lightboxList.length; renderLightbox(); }
  function prevLightbox(){ lightboxIndex = (lightboxIndex-1+lightboxList.length) % lightboxList.length; renderLightbox(); }

  if (HAS_READER){
  document.getElementById('gal-lightbox-close').addEventListener('click', closeLightbox);
  document.getElementById('gal-lightbox-next').addEventListener('click', nextLightbox);
  document.getElementById('gal-lightbox-prev').addEventListener('click', prevLightbox);
  document.getElementById('gal-lightbox-like-btn').addEventListener('click', ()=>{
    const g = lightboxList[lightboxIndex];
    if (!g) return;
    toggleLike(g.id);
    renderLightbox();
  });
  document.getElementById('gal-lightbox-share-btn').addEventListener('click', ()=>{
    const g = lightboxList[lightboxIndex];
    if (g) shareImage(g);
  });
  lbBackdrop.addEventListener('click', (e)=>{ if (e.target === lbBackdrop) closeLightbox(); });
  document.addEventListener('keydown', (e)=>{
    if (!lbBackdrop.classList.contains('show')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') nextLightbox();
    if (e.key === 'ArrowLeft') prevLightbox();
  });

  }

  // Shared with js/bells-n-barz-gallery-admin.js (the editor, staff portal).
  window.BNB_GALLERY_INT = {
    saveImages, fmtDate, esc, escAttr,
    get images(){ return images; }, set images(v){ images = v; },
    get editingId(){ return editingId; }, set editingId(v){ editingId = v; },
    get currentSource(){ return currentSource; }, set currentSource(v){ currentSource = v; },
  };

  /* ---------------- INIT ---------------- */
  renderGallery();
})();
