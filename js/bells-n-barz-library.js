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
  // The shelf is on the main site; the editor is in
  // js/bells-n-barz-library-admin.js on the staff portal, which loads this
  // file for its data but has none of the shelf's markup.
  const HAS_READER = !!$('lib-view-shelf');

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
    if (window.bnbLibraryAdmin) window.bnbLibraryAdmin.render();
  }

  /* ---------------- VIEW SWITCH ---------------- */
  function switchView(view){
    document.querySelectorAll('.library-scope .view').forEach(v=>v.classList.remove('active'));
    $('lib-view-' + view).classList.add('active');
    document.querySelectorAll('#lib-mode-switch button').forEach(b=>{
      b.classList.toggle('active', b.dataset.mode === view);
    });
  }
  if (HAS_READER) document.querySelectorAll('#lib-mode-switch button').forEach(b=>{
    b.addEventListener('click', ()=>{
      if (b.dataset.mode === 'admin'){
        if (typeof isSignedIn === 'function' && !isSignedIn()){ goToLoginPrompt(); return; }
        if (typeof isStaff === 'function' && !isStaff()){ showStaffOnlyToast(); return; }
        bnbLoadModule('libraryAdmin').then(()=>{ switchView('admin'); if (window.bnbLibraryAdmin) window.bnbLibraryAdmin.render(); }).catch(err => console.error(err));
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
    if (!HAS_READER) return;
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
  if (HAS_READER){
  $('lib-detail-close').addEventListener('click', closeBook);
  detail.addEventListener('click', e => { if (e.target === detail) closeBook(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && detail.classList.contains('show')) closeBook(); });
  }

  // Shared with js/bells-n-barz-library-admin.js (the editor, staff portal).
  window.BNB_LIBRARY_INT = {
    BUCKET, esc, escAttr, $, sorted, toast, load, coverHtml,
    get books(){ return books; }, set books(v){ books = v; },
    get loadError(){ return loadError; }, set loadError(v){ loadError = v; },
    get editingId(){ return editingId; }, set editingId(v){ editingId = v; },
    get pendingFile(){ return pendingFile; }, set pendingFile(v){ pendingFile = v; },
  };

  /* ---------------- INIT ---------------- */
  renderShelf();
  load();
})();
