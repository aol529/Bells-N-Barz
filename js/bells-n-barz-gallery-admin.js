/* =========================================================================
   GALLERY EDITOR — staff portal (Admin > Gallery). Loaded on demand after
   js/bells-n-barz-gallery.js, whose shared pieces come from BNB_GALLERY_INT.
   ========================================================================= */
(function(){
  const I = window.BNB_GALLERY_INT;
  if (!I) return;
  const { saveImages, fmtDate, esc, escAttr } = I;

  /* ---------------- ADMIN TABLE ---------------- */
  let galSort = { key: 'date', dir: 'desc' };
  function applyGalSort(list, sort){
    return list.slice().sort((a,b)=>{
      let av = a[sort.key], bv = b[sort.key];
      if (typeof av === 'boolean' || typeof bv === 'boolean'){ av = av ? 1 : 0; bv = bv ? 1 : 0; }
      else { av = (av||'').toString().toLowerCase(); bv = (bv||'').toString().toLowerCase(); }
      if (av < bv) return sort.dir === 'asc' ? -1 : 1;
      if (av > bv) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }
  function updateGalSortHeaderUI(rowEl, sort){
    rowEl.querySelectorAll('th[data-sort]').forEach(th=>{
      const active = th.dataset.sort === sort.key;
      th.classList.toggle('sort-active', active);
      const arrow = th.querySelector('.sort-arrow');
      if (arrow) arrow.textContent = active ? (sort.dir === 'asc' ? '▴' : '▾') : '▾';
    });
  }
  document.querySelectorAll('#gal-admin-thead-row th[data-sort]').forEach(th=>{
    th.addEventListener('click', ()=>{
      const key = th.dataset.sort;
      if (galSort.key === key) galSort.dir = galSort.dir === 'asc' ? 'desc' : 'asc';
      else { galSort.key = key; galSort.dir = 'asc'; }
      renderAdmin();
    });
  });
  function renderAdmin(){
    const tbody = document.getElementById('gal-admin-tbody');
    tbody.innerHTML = '';
    updateGalSortHeaderUI(document.getElementById('gal-admin-thead-row'), galSort);
    const sorted = applyGalSort(I.images, galSort);
    if (sorted.length === 0){
      tbody.innerHTML = '<tr><td colspan="6" style="color:var(--muted);text-align:center;padding:30px;">No images yet — click "+ Add Image" to upload one.</td></tr>';
      return;
    }
    sorted.forEach(g=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><img class="thumb-cell" src="${escAttr(g.url)}" alt=""></td>
        <td><b>${esc(g.title)}</b></td>
        <td>${esc(g.category||'—')}</td>
        <td class="mono">${fmtDate(g.date)}</td>
        <td>${g.featured ? '<span class="status-pill featured">Featured</span>' : ''}</td>
        <td><div class="row-actions">
          <button class="edit-btn">Edit</button>
          <button class="del del-btn">Delete</button>
        </div></td>
      `;
      tr.querySelector('.edit-btn').onclick = ()=> openEditor(g.id);
      tr.querySelector('.del-btn').onclick = ()=>{
        if (!confirm('Delete "' + g.title + '"? This cannot be undone.')) return;
        I.images = I.images.filter(x=>x.id!==g.id); saveImages(); renderAdmin();
      };
      tbody.appendChild(tr);
    });
  }

  /* ---------------- EDITOR PANEL ---------------- */
  const backdrop = document.getElementById('gal-panel-backdrop');
  const fUrl = document.getElementById('gal-f-url');
  const fFile = document.getElementById('gal-f-file');
  const fTitle = document.getElementById('gal-f-title');
  const fCategory = document.getElementById('gal-f-category');
  const fDate = document.getElementById('gal-f-date');
  const fAlt = document.getElementById('gal-f-alt');
  const fCaption = document.getElementById('gal-f-caption');
  const fFeatured = document.getElementById('gal-f-featured');
  const previewWrap = document.getElementById('gal-preview-wrap');
  const previewImg = document.getElementById('gal-preview-img');
  let pendingDataUrl = '';
  let pendingFile = null; // the real File object, uploaded to Storage on save

  document.querySelectorAll('#gal-source-toggle button').forEach(b=>{
    b.addEventListener('click', ()=>{
      I.currentSource = b.dataset.source;
      document.querySelectorAll('#gal-source-toggle button').forEach(x=>x.classList.toggle('active', x===b));
      document.getElementById('gal-url-field').style.display = I.currentSource === 'url' ? 'block' : 'none';
      document.getElementById('gal-upload-field').style.display = I.currentSource === 'upload' ? 'block' : 'none';
    });
  });

  fUrl.addEventListener('input', ()=>{
    if (fUrl.value.trim()){ previewImg.src = fUrl.value.trim(); previewWrap.style.display = 'block'; }
  });
  document.getElementById('gal-upload-drop').addEventListener('click', ()=> fFile.click());
  fFile.addEventListener('change', (e)=>{
    const file = e.target.files[0]; if (!file) return;
    pendingFile = file;
    // Base64 preview only — NOT what gets saved. The actual file bytes
    // get uploaded to Supabase Storage on save (see gal-panel-save below).
    const reader = new FileReader();
    reader.onload = ()=>{
      pendingDataUrl = reader.result;
      previewImg.src = pendingDataUrl;
      previewWrap.style.display = 'block';
    };
    reader.readAsDataURL(file);
  });

  function openEditor(id){
    I.editingId = id || null;
    const g = id ? I.images.find(x=>x.id===id) : null;
    document.getElementById('gal-panel-title').textContent = g ? 'Edit Image' : 'Add Image';
    pendingDataUrl = '';
    pendingFile = null;
    fTitle.value = g ? g.title : '';
    fCategory.value = g ? g.category : '';
    fDate.value = g ? g.date : new Date().toISOString().slice(0,10);
    fAlt.value = g ? g.alt : '';
    fCaption.value = g ? g.caption : '';
    fFeatured.checked = g ? !!g.featured : false;
    fUrl.value = g ? g.url : '';
    if (g && g.url){ previewImg.src = g.url; previewWrap.style.display = 'block'; }
    else { previewWrap.style.display = 'none'; previewImg.src = ''; }
    I.currentSource = 'url';
    document.querySelectorAll('#gal-source-toggle button').forEach(x=>x.classList.toggle('active', x.dataset.source==='url'));
    document.getElementById('gal-url-field').style.display = 'block';
    document.getElementById('gal-upload-field').style.display = 'none';
    fFile.value = '';
    backdrop.classList.add('show');
  }
  document.getElementById('gal-new-img-btn').addEventListener('click', ()=> openEditor(null));
  document.getElementById('gal-panel-cancel').addEventListener('click', ()=> backdrop.classList.remove('show'));
  backdrop.addEventListener('click', (e)=>{ if (e.target === backdrop) backdrop.classList.remove('show'); });

  document.getElementById('gal-panel-save').addEventListener('click', async ()=>{
    if (!fTitle.value.trim()){ alert('Give the image a title first.'); return; }

    let finalUrl;
    if (I.currentSource === 'upload' && pendingFile){
      const saveBtn = document.getElementById('gal-panel-save');
      saveBtn.disabled = true; saveBtn.textContent = 'Uploading…';

      // Real upload to Supabase Storage — not base64 into the database.
      const ext = (pendingFile.name.split('.').pop() || 'jpg').toLowerCase();
      const path = 'g-' + Date.now() + '-' + Math.random().toString(36).slice(2,8) + '.' + ext;
      const { error: upErr } = await bnbClient.storage.from('gallery-images').upload(path, pendingFile);

      saveBtn.disabled = false; saveBtn.textContent = 'Save Image';

      if (upErr){
        alert('Upload failed: ' + (upErr.message || 'check your connection or Supabase setup.'));
        return;
      }
      const { data: pub } = bnbClient.storage.from('gallery-images').getPublicUrl(path);
      finalUrl = pub.publicUrl;
    } else {
      finalUrl = fUrl.value.trim();
    }

    if (!finalUrl){ alert('Add an image URL or upload a file first.'); return; }

    const data = {
      url: finalUrl,
      title: fTitle.value.trim(),
      category: fCategory.value.trim() || 'General',
      date: fDate.value || new Date().toISOString().slice(0,10),
      alt: fAlt.value.trim(),
      caption: fCaption.value.trim(),
      featured: fFeatured.checked
    };
    if (I.editingId){
      const idx = I.images.findIndex(x=>x.id===I.editingId);
      I.images[idx] = Object.assign({id: I.editingId}, data);
    } else {
      data.id = window.BNB_UUID();
      I.images.push(data);
    }
    saveImages();
    pendingFile = null;
    backdrop.classList.remove('show');
    renderAdmin();
  });

  /* ---------------- IMPORT / EXPORT ---------------- */
  document.getElementById('gal-export-btn').addEventListener('click', ()=>{
    const blob = new Blob([JSON.stringify(I.images, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'wkab-gallery-export.json'; a.click();
    URL.revokeObjectURL(url);
  });
  document.getElementById('gal-import-btn').addEventListener('click', ()=> document.getElementById('gal-import-file').click());
  document.getElementById('gal-import-file').addEventListener('change', (e)=>{
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ()=>{
      try {
        const parsed = JSON.parse(reader.result);
        if (!Array.isArray(parsed)) throw new Error('not an array');
        I.images = parsed; saveImages(); renderAdmin();
        alert('Gallery imported.');
      } catch(err){ alert('That file could not be read as a valid gallery JSON export.'); }
    };
    reader.readAsText(file);
  });


  window.bnbGalleryAdmin = { render: renderAdmin, openEditor: openEditor };
  renderAdmin();
})();
