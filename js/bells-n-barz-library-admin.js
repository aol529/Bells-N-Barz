/* =========================================================================
   LIBRARY EDITOR — staff portal (Admin > Library). Loaded on demand after
   js/bells-n-barz-library.js, whose shared pieces come from BNB_LIBRARY_INT.
   ========================================================================= */
(function(){
  const I = window.BNB_LIBRARY_INT;
  if (!I) return;
  const { BUCKET, esc, escAttr, $, sorted, toast, load, coverHtml } = I;

  /* ---------------- ADMIN ---------------- */
  function renderAdmin(){
    const tbody = $('lib-admin-tbody');
    if (!tbody) return;
    $('lib-admin-error').style.display = I.loadError ? 'block' : 'none';
    $('lib-admin-error').textContent = I.loadError ? 'Could not load the library: ' + I.loadError + ' — has sql/77-library.sql been run?' : '';
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
      .filter(u => I.books.find(b => b.id === u.id).sort_order !== u.sort_order);
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

  /* ---------------- LOOK UP ---------------- */
  // Free book databases, no key: Open Library and Google Books. Only the
  // search text is sent.
  function isbnOf(q){
    const digits = q.replace(/[\s-]/g, '');
    return /^(\d{9}[\dXx]|\d{13})$/.test(digits) ? digits : '';
  }
  function joinTitle(title, subtitle){
    return subtitle ? title + ': ' + subtitle : title;
  }

  async function searchOpenLibrary(q){
    const isbn = isbnOf(q);
    const url = 'https://openlibrary.org/search.json?limit=8&fields=key,title,subtitle,author_name,first_publish_year,cover_i&' +
      (isbn ? 'isbn=' + isbn : 'q=' + encodeURIComponent(q));
    const res = await fetch(url);
    if (!res.ok) throw new Error('Open Library ' + res.status);
    const data = await res.json();
    return (data.docs || []).map(d => ({
      title: joinTitle(d.title || '', d.subtitle),
      author: (d.author_name || []).slice(0, 3).join(' & '),
      year: d.first_publish_year || '',
      cover: d.cover_i ? 'https://covers.openlibrary.org/b/id/' + d.cover_i + '-L.jpg' : '',
      link: d.key ? 'https://openlibrary.org' + d.key : '',
      source: 'Open Library'
    }));
  }

  async function searchGoogleBooks(q){
    const isbn = isbnOf(q);
    const res = await fetch('https://www.googleapis.com/books/v1/volumes?maxResults=8&q=' + encodeURIComponent(isbn ? 'isbn:' + isbn : q));
    if (!res.ok) throw new Error('Google Books ' + res.status);
    const data = await res.json();
    return (data.items || []).map(it => {
      const v = it.volumeInfo || {};
      const img = (v.imageLinks && (v.imageLinks.thumbnail || v.imageLinks.smallThumbnail)) || '';
      return {
        title: joinTitle(v.title || '', v.subtitle),
        author: (v.authors || []).slice(0, 3).join(' & '),
        year: (v.publishedDate || '').slice(0, 4),
        cover: img.replace(/^http:/, 'https:').replace('&edge=curl', ''),
        link: v.canonicalVolumeLink || v.infoLink || '',
        source: 'Google Books'
      };
    });
  }

  let lookupResults = [];
  async function lookUp(){
    const q = $('lib-lookup-q').value.trim() || f.title.value.trim();
    const box = $('lib-lookup-results');
    if (!q){ toast('Type a title, author or ISBN first.'); $('lib-lookup-q').focus(); return; }
    const btn = $('lib-lookup-btn');
    btn.disabled = true;
    box.innerHTML = '<div class="lib-lookup-msg">Searching…</div>';
    // Both at once: Open Library's matches first, then Google Books' (which
    // often has a cover when Open Library doesn't). Without a key Google
    // Books shares one daily quota with everyone, so it's a bonus: null
    // means it failed.
    const [ol, gb] = await Promise.all([
      searchOpenLibrary(q).catch(e => { console.warn('Open Library lookup failed', e); return null; }),
      searchGoogleBooks(q).catch(e => { console.warn('Google Books lookup failed', e); return null; })
    ]);
    const down = [ol ? '' : 'Open Library', gb ? '' : 'Google Books'].filter(Boolean);
    const downNote = down.length ? '<div class="lib-lookup-msg">' + down.join(' and ') + (down.length > 1 ? ' are' : ' is') + ' not answering right now' + (down.length > 1 ? '. Try again later.' : ', so these are ' + (ol ? 'Open Library' : 'Google Books') + ' matches only.') + '</div>' : '';
    const results = (ol || []).slice(0, 6).concat((gb || []).slice(0, 4));
    btn.disabled = false;
    lookupResults = results.filter(r => r.title);
    if (!lookupResults.length){
      box.innerHTML = '<div class="lib-lookup-msg">No matches' + (down.length ? ' (' + down.join(' and ') + (down.length > 1 ? ' are' : ' is') + ' not answering right now)' : '') + '. Try fewer words, the author\'s name, or the ISBN.</div>';
      return;
    }
    box.innerHTML = lookupResults.map((r, i) =>
      '<button type="button" class="lib-lookup-item" data-i="' + i + '">' +
        '<div class="lib-thumb">' + (r.cover ? '<img src="' + escAttr(r.cover) + '" alt="" loading="lazy">' : '<div class="lib-cover-plain"></div>') + '</div>' +
        '<div><div class="lib-lookup-title">' + esc(r.title) + '</div>' +
        '<div class="lib-admin-author">' + esc([r.author, r.year].filter(Boolean).join(' · ')) + '</div>' +
        '<div class="lib-lookup-src">' + esc(r.source) + (r.cover ? '' : ' · no cover') + '</div></div>' +
      '</button>').join('') + downNote;
    box.querySelectorAll('.lib-lookup-item').forEach(el => {
      el.addEventListener('click', () => useResult(lookupResults[Number(el.dataset.i)]));
    });
  }

  // Fills the book's facts. Leaves the why/takeaways/quote alone, keeps a
  // buy link already typed in, and keeps the cover when the match has none.
  function useResult(r){
    f.title.value = r.title;
    if (r.author) f.author.value = r.author;
    if (r.cover){ f.cover.value = r.cover; I.pendingFile = null; f.file.value = ''; showPreview(r.cover); }
    if (r.link && !f.buy.value.trim()) f.buy.value = r.link;
    $('lib-lookup-results').innerHTML = '';
    toast('Filled in from ' + r.source + '. Check it, then Save Book.');
  }

  $('lib-lookup-btn').addEventListener('click', lookUp);
  $('lib-lookup-q').addEventListener('keydown', e => { if (e.key === 'Enter'){ e.preventDefault(); lookUp(); } });

  function openEditor(id){
    I.editingId = id || null;
    const b = id ? I.books.find(x => x.id === id) : null;
    $('lib-panel-title').textContent = b ? 'Edit Book' : 'Add Book';
    $('lib-lookup-q').value = b ? [b.title.split(':')[0], b.author.split(/ (?:&|with) /)[0]].filter(Boolean).join(' ') : '';
    $('lib-lookup-results').innerHTML = '';
    I.pendingFile = null;
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
  f.cover.addEventListener('input', ()=>{ I.pendingFile = null; showPreview(f.cover.value.trim()); });
  $('lib-upload-btn').addEventListener('click', ()=> f.file.click());
  f.file.addEventListener('change', ()=>{
    const file = f.file.files[0];
    if (!file) return;
    I.pendingFile = file;
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
    if (I.pendingFile){
      btn.textContent = 'Uploading…';
      const ext = (I.pendingFile.name.split('.').pop() || 'jpg').toLowerCase();
      const path = 'cover-' + Date.now() + '-' + Math.random().toString(36).slice(2,8) + '.' + ext;
      const { error: upErr } = await bnbClient.storage.from(BUCKET).upload(path, I.pendingFile);
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
    if (I.editingId){
      ok = await save(I.editingId, row, 'Book saved.');
    } else {
      row.sort_order = (I.books.reduce((m, b) => Math.max(m, b.sort_order), 0)) + 10;
      const { error } = await bnbClient.from('library_books').insert([row]);
      ok = !error;
      if (error) toast('Could not save — ' + (error.message || 'try again.'));
      else { toast('Book added.'); await load(); }
    }
    btn.disabled = false; btn.textContent = 'Save Book';
    if (ok) closeEditor();
  });


  window.bnbLibraryAdmin = { render: renderAdmin, openEditor: openEditor };
  renderAdmin();
})();
