/* =========================================================================
   BLOG EDITOR — staff portal (Admin > Blog): posts and the hero slider.
   Loaded on demand after js/bells-n-barz-blog.js, whose shared pieces come
   from BNB_BLOG_INT.
   ========================================================================= */
(function(){
  const I = window.BNB_BLOG_INT;
  if (!I) return;
  const { savePosts, loadGalleryImages, saveMegatron, renderMegatron, mdToHtml, slugify, fmtDate, esc, escAttr } = I;

  function renderMegatronAdmin(){
    const heroCount = document.getElementById('blog-admin-hero-count');
    if (heroCount) heroCount.textContent = I.megatronSlides.length + ' slide' + (I.megatronSlides.length===1?'':'s');
    const gallery = loadGalleryImages();
    const list = document.getElementById('megatron-slide-list');
    if (!I.megatronSlides.length){
      list.innerHTML = '<div class="field-hint">No slides yet — add one below.</div>';
    } else {
      list.innerHTML = I.megatronSlides.map((s,i)=>{
        const img = gallery.find(g=>g.id===s.imageId);
        const url = img ? img.url : '';
        const label = s.caption || (img ? img.title : 'Missing image');
        return `<div class="megatron-slide-row">
          <img src="${escAttr(url)}" alt="">
          <div class="msr-cap">${esc(label)}</div>
          <div class="msr-actions">
            <button data-act="up" data-i="${i}" type="button" ${i===0?'disabled':''}>↑</button>
            <button data-act="down" data-i="${i}" type="button" ${i===I.megatronSlides.length-1?'disabled':''}>↓</button>
            <button data-act="remove" data-i="${i}" type="button">✕</button>
          </div>
        </div>`;
      }).join('');
    }
    list.querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const i = parseInt(btn.dataset.i, 10);
        const act = btn.dataset.act;
        if (act === 'remove'){ I.megatronSlides.splice(i,1); }
        else if (act === 'up' && i>0){ const tmp=I.megatronSlides[i-1]; I.megatronSlides[i-1]=I.megatronSlides[i]; I.megatronSlides[i]=tmp; }
        else if (act === 'down' && i<I.megatronSlides.length-1){ const tmp=I.megatronSlides[i+1]; I.megatronSlides[i+1]=I.megatronSlides[i]; I.megatronSlides[i]=tmp; }
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
    I.megatronSlides.push({ id: window.BNB_UUID(), imageId, caption: capInput.value.trim() });
    capInput.value = '';
    saveMegatron();
    renderMegatronAdmin();
    renderMegatron();
  });


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
  // Scroll so el sits just below the sticky site nav and this page's own
  // sticky header (both vary in height, so measure them at click time).
  function scrollBelowHeaders(el){
    if (!el) return;
    const nav = document.querySelector('.outer-header');
    const head = el.closest('.site-page') && el.closest('.site-page').querySelector('header.site');
    const offset = (nav ? nav.getBoundingClientRect().height : 0) + (head ? head.getBoundingClientRect().height : 0) + 12;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
  }

  // Admin cards: Posts / Hero Slider, one section at a time.
  document.querySelectorAll('#blog-admin-subtabs [data-blog-admin]').forEach(card=>{
    card.addEventListener('click', ()=>{
      const key = card.dataset.blogAdmin;
      document.querySelectorAll('#blog-admin-subtabs [data-blog-admin]').forEach(c=> c.classList.toggle('active', c===card));
      document.getElementById('blog-admin-posts-panel').style.display = key === 'posts' ? '' : 'none';
      document.getElementById('blog-admin-hero-panel').style.display = key === 'hero' ? '' : 'none';
      scrollBelowHeaders(document.getElementById('blog-admin-' + key + '-panel'));
    });
  });
  document.querySelectorAll('#admin-thead-row th[data-sort]').forEach(th=>{
    th.addEventListener('click', ()=>{
      const key = th.dataset.sort;
      if (blogSort.key === key) blogSort.dir = blogSort.dir === 'asc' ? 'desc' : 'asc';
      else { blogSort.key = key; blogSort.dir = 'asc'; }
      renderAdmin();
    });
  });
  function renderAdmin(){
    const postsCount = document.getElementById('blog-admin-posts-count');
    if (postsCount) postsCount.textContent = I.posts.length + ' post' + (I.posts.length===1?'':'s');
    const tbody = document.getElementById('admin-tbody');
    tbody.innerHTML = '';
    updateSortHeaderUI(document.getElementById('admin-thead-row'), blogSort);
    const sorted = applySort(I.posts, blogSort);
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
        I.posts = I.posts.filter(x=>x.id!==p.id); savePosts(); renderAdmin();
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
    I.editingId = id || null;
    slugManuallyEdited = false;
    const p = id ? I.posts.find(x=>x.id===id) : null;
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
    showCover();
    setBodyView('write');
    updateCount();
    openedWith = editorState();
    backdrop.classList.add('show');
  }
  // Ask before throwing away typing (Cancel, or a click outside the panel).
  let openedWith = '';
  function editorState(){
    return JSON.stringify([fTitle.value, fSlug.value, fCategory.value, fDate.value, fAuthor.value, fCover.value, fTags.value, fExcerpt.value, fBody.value, currentStatus]);
  }
  function closeEditor(){
    if (editorState() !== openedWith && !confirm('Close without saving? Your changes to this post will be lost.')) return;
    backdrop.classList.remove('show');
  }
  document.getElementById('new-post-btn').addEventListener('click', ()=> openEditor(null));
  document.getElementById('panel-cancel').addEventListener('click', closeEditor);
  backdrop.addEventListener('click', (e)=>{ if (e.target === backdrop) closeEditor(); });

  /* ---- Pictures: upload to the public 'blog-images' bucket (sql/79-blog-images.sql) ---- */
  const BUCKET = 'blog-images';
  async function uploadImage(file, btn){
    if (!file) return null;
    if (file.size > 5 * 1024 * 1024){ alert('That picture is over 5 MB. Pick a smaller one.'); return null; }
    const label = btn.textContent;
    btn.disabled = true; btn.textContent = 'Uploading…';
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = 'post-' + Date.now() + '-' + Math.random().toString(36).slice(2,8) + '.' + ext;
    const { error } = await bnbClient.storage.from(BUCKET).upload(path, file);
    btn.disabled = false; btn.textContent = label;
    if (error){
      console.error('Blog image upload failed:', error);
      alert('Upload failed: ' + (error.message || 'try again.') + '\n\nIf this keeps happening, sql/79-blog-images.sql may not have been run yet.');
      return null;
    }
    return bnbClient.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }
  const coverPreview = document.getElementById('f-cover-preview');
  const coverFile = document.getElementById('f-cover-file');
  function showCover(){
    const src = fCover.value.trim();
    coverPreview.hidden = !/^(https?:|\/)/i.test(src);
    if (!coverPreview.hidden) coverPreview.src = src;
  }
  coverPreview.addEventListener('error', ()=> coverPreview.hidden = true);
  fCover.addEventListener('input', showCover);
  document.getElementById('f-cover-upload').addEventListener('click', ()=> coverFile.click());
  coverFile.addEventListener('change', async ()=>{
    const url = await uploadImage(coverFile.files[0], document.getElementById('f-cover-upload'));
    coverFile.value = '';
    if (url){ fCover.value = url; showCover(); }
  });

  /* ---- Formatting buttons: write the Markdown for the owner ---- */
  function wrapSelection(before, after, placeholder){
    const a = fBody.selectionStart, b = fBody.selectionEnd;
    const picked = fBody.value.slice(a, b) || placeholder;
    fBody.setRangeText(before + picked + after, a, b, 'end');
    fBody.setSelectionRange(a + before.length, a + before.length + picked.length);
  }
  // Puts a prefix on every line the selection touches (headings, lists, quotes).
  function prefixLines(prefix, placeholder){
    const v = fBody.value;
    const a = v.lastIndexOf('\n', fBody.selectionStart - 1) + 1;
    let b = v.indexOf('\n', fBody.selectionEnd); if (b < 0) b = v.length;
    const block = v.slice(a, b) || placeholder;
    const out = block.split('\n').map(l => prefix + l.replace(/^(#{1,3} |- |> )/, '')).join('\n');
    fBody.setRangeText(out, a, b, 'end');
  }
  // Goes at the end of the current line (never over the selection or
  // inside a link or bold), on lines of its own.
  function insertBlock(text){
    let a = fBody.value.indexOf('\n', fBody.selectionEnd);
    if (a < 0) a = fBody.value.length;
    const pre = a > 0 && fBody.value[a-1] !== '\n' ? '\n\n' : '';
    fBody.setRangeText(pre + text + '\n\n', a, a, 'end');
  }
  const bodyFile = document.getElementById('f-body-file');
  document.querySelectorAll('#f-body-bar [data-md]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      setBodyView('write');
      fBody.focus();
      const kind = btn.dataset.md;
      if (kind === 'h2') prefixLines('## ', 'Heading');
      else if (kind === 'h3') prefixLines('### ', 'Subheading');
      else if (kind === 'bold') wrapSelection('**', '**', 'bold text');
      else if (kind === 'italic') wrapSelection('*', '*', 'italic text');
      else if (kind === 'list') prefixLines('- ', 'List item');
      else if (kind === 'quote') prefixLines('> ', 'Quote');
      else if (kind === 'hr') insertBlock('---');
      else if (kind === 'link'){
        const url = prompt('Link address (starts with https://):', 'https://');
        if (!url || url === 'https://') return;
        wrapSelection('[', '](' + url.trim() + ')', 'link text');
      }
      else if (kind === 'image') bodyFile.click();
      updateCount();
    });
  });
  bodyFile.addEventListener('change', async ()=>{
    const url = await uploadImage(bodyFile.files[0], document.querySelector('#f-body-bar [data-md=image]'));
    bodyFile.value = '';
    if (!url) return;
    const caption = (prompt('Caption for the picture (optional):', '') || '').replace(/[\[\]]/g, '');
    setBodyView('write');
    insertBlock('![' + caption + '](' + url + ')');
    updateCount();
  });

  /* ---- Write / Preview ---- */
  const bodyPreview = document.getElementById('f-body-preview');
  function setBodyView(view){
    document.querySelectorAll('#f-body-mode button').forEach(x=> x.classList.toggle('active', x.dataset.view === view));
    fBody.hidden = view === 'preview';
    bodyPreview.hidden = view !== 'preview';
    if (view === 'preview') bodyPreview.innerHTML = mdToHtml(fBody.value) || '<p class="field-hint">Nothing written yet.</p>';
  }
  document.querySelectorAll('#f-body-mode button').forEach(b=> b.addEventListener('click', ()=> setBodyView(b.dataset.view)));
  const bodyCount = document.getElementById('f-body-count');
  function updateCount(){
    const words = (fBody.value.match(/[A-Za-z0-9\u00C0-\u024F'’]+/g) || []).length;
    bodyCount.textContent = words + ' word' + (words === 1 ? '' : 's') + (words ? ' · about ' + Math.max(1, Math.round(words / 200)) + ' min read' : '');
  }
  fBody.addEventListener('input', updateCount);

  document.getElementById('panel-save').addEventListener('click', ()=>{
    if (!fTitle.value.trim()){ alert('Give the post a title first.'); return; }
    const tags = fTags.value.split(',').map(t=>t.trim()).filter(Boolean);
    const slug = slugify(fSlug.value) || slugify(fTitle.value);
    // The slug is the post's link (#blog:slug) and must be unique in the database.
    if (I.posts.some(x => x.slug === slug && x.id !== I.editingId)){
      alert('Another post already uses the link "' + slug + '". Change the slug (or the title) a little.');
      fSlug.focus(); return;
    }
    if (currentStatus === 'published' && !fBody.value.trim() && !confirm('This post has no body yet. Publish it anyway?')) return;
    const data = {
      title: fTitle.value.trim(),
      slug: slug,
      category: fCategory.value.trim() || 'General',
      date: fDate.value || new Date().toISOString().slice(0,10),
      author: fAuthor.value.trim() || 'Coach KA',
      cover: fCover.value.trim(),
      tags: tags,
      excerpt: fExcerpt.value.trim(),
      body: fBody.value,
      status: currentStatus
    };
    if (I.editingId){
      const idx = I.posts.findIndex(x=>x.id===I.editingId);
      // Keep the view count (it isn't on the form, so it would reset to 0).
      I.posts[idx] = Object.assign({id: I.editingId, views: I.posts[idx].views || 0}, data);
    } else {
      data.id = window.BNB_UUID();
      I.posts.push(data);
    }
    savePosts();
    backdrop.classList.remove('show');
    renderAdmin();
  });

  /* ---------------- IMPORT / EXPORT ---------------- */
  document.getElementById('export-btn').addEventListener('click', ()=>{
    const blob = new Blob([JSON.stringify(I.posts, null, 2)], {type:'application/json'});
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
        // Merge, don't replace: a post missing from the file stays (a
        // straight replace would delete it from the database on save).
        // A post matches by id, then by slug; anything new gets a fresh id.
        let added = 0, updated = 0;
        parsed.forEach(raw=>{
          if (!raw || !raw.title) return;
          const idx = I.posts.findIndex(x => (raw.id && x.id === raw.id) || (raw.slug && x.slug === raw.slug));
          if (idx >= 0){ I.posts[idx] = Object.assign({}, I.posts[idx], raw, { id: I.posts[idx].id }); updated++; }
          else { I.posts.push(Object.assign({ status: 'draft', tags: [] }, raw, { id: window.BNB_UUID(), slug: raw.slug || slugify(raw.title) })); added++; }
        });
        savePosts(); renderAdmin();
        alert('Imported: ' + added + ' new, ' + updated + ' updated. Posts not in the file were left alone.');
      } catch(err){ alert('That file could not be read as a valid posts JSON export.'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  });


  // The hero slider picks from the gallery, which may load after this.
  document.addEventListener('bnb-gallery-updated', renderMegatronAdmin);

  window.bnbBlogAdmin = {
    render(){ renderAdmin(); renderMegatronAdmin(); },
    openEditor: openEditor
  };
  renderAdmin();
  renderMegatronAdmin();
})();
