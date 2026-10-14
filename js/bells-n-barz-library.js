(function(){

  // Library: the books that inspired Bells n Barz. A shelf, not a reader —
  // the books are still in copyright, so each one gets its cover, why it
  // matters to us, a few takeaways in our own words, an optional short
  // quote and a link to buy it. Rows live in library_books
  // (sql/77-library.sql); staff manage them from Library > Admin.

  const BUCKET = 'library-covers';

  let books = [];
  let loadError = '';
  let editingId = null;
  let pendingFile = null;

  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function escAttr(s){ return esc(s).replace(/"/g,'&quot;'); }
  function $(id){ return document.getElementById(id); }

  function rowToBook(r){
    return {
      id: r.id, title: r.title || '', author: r.author || '', cover_url: r.cover_url || '',
      why: r.why || '', takeaways: r.takeaways || [], quote: r.quote || '', buy_url: r.buy_url || '',
      sort_order: r.sort_order || 0, hidden: !!r.hidden
    };
  }
  function sorted(){
    return books.slice().sort((a,b)=> (a.sort_order - b.sort_order) || a.title.localeCompare(b.title));
  }

  let toastTimer = null;
  function toast(msg){
    const t = $('lib-toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=> t.classList.remove('show'), 2400);
  }

  async function load(){
    const { data, error } = await bnbClient.from('library_books').select('*');
    if (error){
      loadError = error.message || 'Could not load the library.';
      console.error('Supabase load library_books failed:', error);
    } else {
      loadError = '';
      books = (data || []).map(rowToBook);
    }
    renderShelf();
    renderAdmin();
  }

  /* ---------------- VIEW SWITCH ---------------- */
  function switchView(view){
    document.querySelectorAll('.library-scope .view').forEach(v=>v.classList.remove('active'));
    $('lib-view-' + view).classList.add('active');
    document.querySelectorAll('#lib-mode-switch button').forEach(b=>{
      b.classList.toggle('active', b.dataset.mode === view);
    });
  }
  document.querySelectorAll('#lib-mode-switch button').forEach(b=>{
    b.addEventListener('click', ()=>{
      if (b.dataset.mode === 'admin'){
        if (typeof isSignedIn === 'function' && !isSignedIn()){ goToLoginPrompt(); return; }
        if (typeof isStaff === 'function' && !isStaff()){ showStaffOnlyToast(); return; }
        switchView('admin'); renderAdmin();
      } else { switchView('shelf'); renderShelf(); }
    });
  });

  /* ---------------- SHELF ---------------- */
  // No cover yet: a plain typeset cover with the title and author.
  function coverHtml(b){
    if (b.cover_url) return '<img src="' + escAttr(b.cover_url) + '" alt="Cover of ' + escAttr(b.title) + '" loading="lazy">';
    return '<div class="lib-cover-plain"><span class="lib-cover-title">' + esc(b.title) + '</span><span class="lib-cover-author">' + esc(b.author) + '</span></div>';
  }

  function renderShelf(){
    const grid = $('lib-shelf');
    const empty = $('lib-empty');
    const visible = sorted().filter(b => !b.hidden);
    $('lib-count').textContent = visible.length + (visible.length === 1 ? ' book' : ' books');
    grid.innerHTML = '';
    if (!visible.length){
      empty.textContent = loadError ? 'The library could not be loaded. Try again later.' : 'Books are on their way. Check back soon.';
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';
    visible.forEach(b=>{
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'lib-book';
      card.innerHTML = '<div class="lib-cover">' + coverHtml(b) + '</div>' +
        '<div class="lib-book-title">' + esc(b.title) + '</div>' +
        '<div class="lib-book-author">' + esc(b.author) + '</div>';
      card.addEventListener('click', ()=> openBook(b.id));
      grid.appendChild(card);
    });
  }

  /* ---------------- BOOK DETAIL ---------------- */
  const detail = $('lib-detail-backdrop');
  function openBook(id){
    const b = books.find(x => x.id === id);
    if (!b) return;
    let html = '<div class="lib-detail-head"><div class="lib-cover">' + coverHtml(b) + '</div>' +
      '<div><h2>' + esc(b.title) + '</h2><div class="lib-detail-author">' + esc(b.author) + '</div>' +
      (b.buy_url ? '<a class="btn2 primary lib-buy" href="' + escAttr(b.buy_url) + '" target="_blank" rel="noopener">Get the book ↗</a>' : '') +
      '</div></div>';
    if (b.why) html += '<h3>Why this book</h3><p class="lib-why">' + esc(b.why) + '</p>';
    if (b.takeaways.length) html += '<h3>Takeaways</h3><ul class="lib-takeaways">' + b.takeaways.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul>';
    if (b.quote) html += '<blockquote class="lib-quote">“' + esc(b.quote) + '”<cite>' + esc(b.author) + '</cite></blockquote>';
    $('lib-detail-body').innerHTML = html;
    detail.classList.add('show');
  }
  function closeBook(){ detail.classList.remove('show'); }
  $('lib-detail-close').addEventListener('click', closeBook);
  detail.addEventListener('click', e => { if (e.target === detail) closeBook(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && detail.classList.contains('show')) closeBook(); });

  /* ---------------- ADMIN ---------------- */
  function renderAdmin(){
    const tbody = $('lib-admin-tbody');
    if (!tbody) return;
    $('lib-admin-error').style.display = loadError ? 'block' : 'none';
    $('lib-admin-error').textContent = loadError ? 'Could not load the library: ' + loadError + ' — has sql/77-library.sql been run?' : '';
    const list = sorted();
    tbody.innerHTML = '';
    if (!list.length){
      tbody.innerHTML = '<tr><td colspan="5" class="lib-admin-empty">No books yet — click "+ Add Book".</td></tr>';
      return;
    }
    list.forEach((b, i)=>{
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td><div class="lib-thumb">' + coverHtml(b) + '</div></td>' +
        '<td><b>' + esc(b.title) + '</b><div class="lib-admin-author">' + esc(b.author) + '</div></td>' +
        '<td>' + (b.hidden ? '<span class="status-pill">Hidden</span>' : '<span class="status-pill on">Showing</span>') + '</td>' +
        '<td><div class="row-actions">' +
          '<button class="up" title="Move up" aria-label="Move up"' + (i === 0 ? ' disabled' : '') + '>↑</button>' +
          '<button class="down" title="Move down" aria-label="Move down"' + (i === list.length - 1 ? ' disabled' : '') + '>↓</button>' +
        '</div></td>' +
        '<td><div class="row-actions">' +
          '<button class="edit">Edit</button>' +
          '<button class="hide">' + (b.hidden ? 'Show' : 'Hide') + '</button>' +
          '<button class="del">Delete</button>' +
        '</div></td>';
      tr.querySelector('.up').onclick = ()=> move(list, i, -1);
      tr.querySelector('.down').onclick = ()=> move(list, i, 1);
      tr.querySelector('.edit').onclick = ()=> openEditor(b.id);
      tr.querySelector('.hide').onclick = ()=> save(b.id, { hidden: !b.hidden }, b.hidden ? 'Book is showing.' : 'Book hidden.');
      tr.querySelector('.del').onclick = ()=> remove(b);
      tbody.appendChild(tr);
    });
  }

  async function save(id, fields, msg){
    const { error } = await bnbClient.from('library_books')
      .update(Object.assign({}, fields, { updated_at: new Date().toISOString() })).eq('id', id);
    if (error){ toast('Could not save — ' + (error.message || 'try again.')); return false; }
    if (msg) toast(msg);
    await load();
    return true;
  }

  // Renumber the whole list in steps of 10 so a swap never collides.
  async function move(list, i, dir){
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const order = list.slice();
    [order[i], order[j]] = [order[j], order[i]];
    const updates = order.map((b, k) => ({ id: b.id, sort_order: (k + 1) * 10 }))
      .filter(u => books.find(b => b.id === u.id).sort_order !== u.sort_order);
    const results = await Promise.all(updates.map(u =>
      bnbClient.from('library_books').update({ sort_order: u.sort_order }).eq('id', u.id)));
    const failed = results.find(r => r.error);
    if (failed) toast('Could not reorder — ' + (failed.error.message || 'try again.'));
    await load();
  }

  async function remove(b){
    if (!confirm('Delete "' + b.title + '"? This cannot be undone. (Hide keeps it but takes it off the shelf.)')) return;
    const { error } = await bnbClient.from('library_books').delete().eq('id', b.id);
    if (error){ toast('Could not delete — ' + (error.message || 'try again.')); return; }
    toast('Book deleted.');
    await load();
  }

  /* ---------------- EDITOR ---------------- */
  const editor = $('lib-panel-backdrop');
  const f = {
    title: $('lib-f-title'), author: $('lib-f-author'), cover: $('lib-f-cover'), file: $('lib-f-file'),
    why: $('lib-f-why'), takeaways: $('lib-f-takeaways'), quote: $('lib-f-quote'), buy: $('lib-f-buy'),
    hidden: $('lib-f-hidden')
  };

  function showPreview(src){
    $('lib-preview-wrap').style.display = src ? 'block' : 'none';
    $('lib-preview-img').src = src || '';
  }

  function openEditor(id){
    editingId = id || null;
    const b = id ? books.find(x => x.id === id) : null;
    $('lib-panel-title').textContent = b ? 'Edit Book' : 'Add Book';
    pendingFile = null;
    f.file.value = '';
    f.title.value = b ? b.title : '';
    f.author.value = b ? b.author : '';
    f.cover.value = b ? b.cover_url : '';
    f.why.value = b ? b.why : '';
    f.takeaways.value = b ? b.takeaways.join('\n') : '';
    f.quote.value = b ? b.quote : '';
    f.buy.value = b ? b.buy_url : '';
    f.hidden.checked = b ? b.hidden : false;
    showPreview(b ? b.cover_url : '');
    editor.classList.add('show');
  }
  function closeEditor(){ editor.classList.remove('show'); }

  $('lib-new-btn').addEventListener('click', ()=> openEditor(null));
  $('lib-panel-cancel').addEventListener('click', closeEditor);
  editor.addEventListener('click', e => { if (e.target === editor) closeEditor(); });
  f.cover.addEventListener('input', ()=>{ pendingFile = null; showPreview(f.cover.value.trim()); });
  $('lib-upload-btn').addEventListener('click', ()=> f.file.click());
  f.file.addEventListener('change', ()=>{
    const file = f.file.files[0];
    if (!file) return;
    pendingFile = file;
    const reader = new FileReader();
    reader.onload = ()=> showPreview(reader.result);
    reader.readAsDataURL(file);
  });

  $('lib-panel-save').addEventListener('click', async ()=>{
    const title = f.title.value.trim();
    if (!title){ toast('Give the book a title first.'); f.title.focus(); return; }
    const btn = $('lib-panel-save');
    btn.disabled = true;

    let cover = f.cover.value.trim();
    if (pendingFile){
      btn.textContent = 'Uploading…';
      const ext = (pendingFile.name.split('.').pop() || 'jpg').toLowerCase();
      const path = 'cover-' + Date.now() + '-' + Math.random().toString(36).slice(2,8) + '.' + ext;
      const { error: upErr } = await bnbClient.storage.from(BUCKET).upload(path, pendingFile);
      if (upErr){
        btn.disabled = false; btn.textContent = 'Save Book';
        toast('Cover upload failed — ' + (upErr.message || 'try again.'));
        return;
      }
      cover = bnbClient.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    }

    const row = {
      title,
      author: f.author.value.trim(),
      cover_url: cover,
      why: f.why.value.trim(),
      takeaways: f.takeaways.value.split('\n').map(s => s.trim()).filter(Boolean),
      quote: f.quote.value.trim().replace(/^["“]|["”]$/g, ''),
      buy_url: f.buy.value.trim(),
      hidden: f.hidden.checked
    };
    btn.textContent = 'Saving…';
    let ok;
    if (editingId){
      ok = await save(editingId, row, 'Book saved.');
    } else {
      row.sort_order = (books.reduce((m, b) => Math.max(m, b.sort_order), 0)) + 10;
      const { error } = await bnbClient.from('library_books').insert([row]);
      ok = !error;
      if (error) toast('Could not save — ' + (error.message || 'try again.'));
      else { toast('Book added.'); await load(); }
    }
    btn.disabled = false; btn.textContent = 'Save Book';
    if (ok) closeEditor();
  });

  /* ---------------- INIT ---------------- */
  renderShelf();
  load();
})();
