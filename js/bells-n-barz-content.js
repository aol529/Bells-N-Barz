/* ============================================================
   ADMIN > CONTENT
   One place for the gym owner to look after everything visitors read
   and see: blog posts, the blog's hero slider, the library, the gallery
   and the shop. Each card shows what's there and opens that section's
   own Admin editor (the editors themselves stay in their own modules),
   and draft posts are listed so unfinished work isn't forgotten.
   ============================================================ */
(function(){
  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function $(id){ return document.getElementById(id); }
  function plural(n, one, many){ return n + ' ' + (n === 1 ? one : (many || one + 's')); }
  function fmtDate(d){
    const dt = d ? new Date(d + 'T00:00:00') : null;
    return dt && !isNaN(dt) ? dt.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) : '';
  }

  // site: outer site page; mod: its lazy module; admin: its Read/Admin switch.
  const AREAS = {
    blog:    { site: 'blog',    mod: 'blog',    admin: '.blog-scope #mode-switch [data-mode=admin]' },
    hero:    { site: 'blog',    mod: 'blog',    admin: '.blog-scope #mode-switch [data-mode=admin]', card: '#blog-admin-subtabs [data-blog-admin=hero]' },
    library: { site: 'library', mod: 'library', admin: '#lib-mode-switch [data-mode=admin]', add: '#lib-new-btn' },
    gallery: { site: 'gallery', mod: 'gallery', admin: '#gal-mode-switch [data-mode=admin]', add: '#gal-new-img-btn' },
    shop:    { site: 'shop',    mod: 'shop',    admin: '#shop-mode-switch [data-mode=admin]', card: '#shop-admin-subtabs [data-admin-tab=products]', add: '#shop-new-product-btn' }
  };

  // Leaves the gym app for that site page, in Admin mode; then optionally
  // a sub-card, a "+ Add" button, or a callback once the module is ready.
  async function open(key, action){
    const a = AREAS[key];
    window.switchSite(a.site);
    try { await bnbLoadModule(a.mod); }
    catch(err){ console.error(err); toast('Could not open that editor — check your connection.'); return; }
    const btn = document.querySelector(a.admin);
    if (btn) btn.click();
    if (a.card){ const c = document.querySelector(a.card); if (c) c.click(); }
    if (action === 'add' && a.add){ const add = document.querySelector(a.add); if (add) add.click(); }
    if (typeof action === 'function') action();
  }
  async function openBlog(fn){
    await open('blog');
    if (!window.BNB_BLOG) return;
    if (fn === 'new') window.BNB_BLOG.newPost();
    else if (fn){ await window.BNB_BLOG.ready; window.BNB_BLOG.showAdmin(); window.BNB_BLOG.edit(fn); }
  }

  function toast(msg){
    const el = $('t-toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._contentTimer);
    el._contentTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  let data = null, loadError = '', loading = false;

  async function load(){
    if (loading) return;
    loading = true;
    const q = (table, cols) => bnbClient.from(table).select(cols);
    const [posts, slides, books, images, products] = await Promise.all([
      q('blog_posts', 'id, title, slug, status, date, category, cover, excerpt, body'),
      q('megatron_slides', 'id'),
      q('library_books', 'id, hidden'),
      q('gallery_images', 'id'),
      q('products', 'id, type, active, stock')
    ]);
    loading = false;
    const failed = [posts, slides, books, images, products].filter(r => r.error);
    failed.forEach(r => console.error('Content load failed:', r.error));
    loadError = failed.length ? (failed[0].error.message || 'Could not load everything.') : '';
    data = {
      posts: posts.data || [], slides: slides.data || [], books: books.data || [],
      images: images.data || [], products: products.data || []
    };
    render();
  }

  // What a post still needs before it's ready to go out.
  function missing(p){
    const out = [];
    if (!(p.body || '').trim()) out.push('no body');
    if (!(p.excerpt || '').trim()) out.push('no excerpt');
    if (!(p.cover || '').trim()) out.push('no cover');
    return out;
  }

  function card(key, icon, title, stats, desc, buttons){
    return '<div class="ct-card">' +
      '<div class="ct-card-head"><span class="ct-card-icon" aria-hidden="true">' + icon + '</span><h3>' + esc(title) + '</h3></div>' +
      '<div class="ct-card-stats">' + stats + '</div>' +
      '<p class="ct-card-desc">' + esc(desc) + '</p>' +
      '<div class="ct-card-actions">' + buttons.map(b =>
        '<button type="button" class="btn2' + (b[2] ? ' primary' : '') + '" data-ct-open="' + key + '" data-ct-action="' + b[1] + '">' + esc(b[0]) + '</button>'
      ).join('') + '</div></div>';
  }

  function render(){
    const body = $('content-body');
    if (!body) return;
    if (!data){ body.innerHTML = '<p class="ct-empty">Loading…</p>'; return; }
    const d = data;
    const published = d.posts.filter(p => p.status === 'published');
    const drafts = d.posts.filter(p => p.status !== 'published').sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const hiddenBooks = d.books.filter(b => b.hidden).length;
    const onSale = d.products.filter(p => p.active !== false);
    const lowStock = onSale.filter(p => p.type === 'merch' && p.stock != null && p.stock <= 3).length;
    const libraryOff = window.BNB_FEATURES && !window.BNB_FEATURES.on('library');
    // Shop products are admin-only (sql/80-shop-admin-only.sql).
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    const admin = !!(me && me.roles && me.roles.includes('admin'));
    const stat = (n, label, warn) => '<span class="ct-stat' + (warn ? ' warn' : '') + '"><b>' + n + '</b> ' + esc(label) + '</span>';

    let html = '';
    if (loadError) html += '<div class="admin-notice">Some numbers could not load: ' + esc(loadError) + '</div>';
    html += '<div class="ct-grid">' +
      card('blog', '📝', 'Blog posts',
        stat(published.length, 'published') + stat(drafts.length, drafts.length === 1 ? 'draft' : 'drafts', drafts.length > 0),
        'Articles on the Blog page. Write with the formatting buttons, add pictures, preview, then publish.',
        [['+ New post', 'new', true], ['All posts', 'manage']]) +
      card('hero', '🖼️', 'Blog banner',
        stat(d.slides.length, d.slides.length === 1 ? 'slide' : 'slides', d.slides.length === 0),
        'The sliding pictures at the top of the Blog page, picked from the gallery.',
        [['Edit slides', 'manage']]) +
      card('library', '📚', 'Library',
        stat(d.books.length - hiddenBooks, 'on the shelf') + (hiddenBooks ? stat(hiddenBooks, 'hidden') : '') +
          (libraryOff ? '<span class="ct-stat warn">Switched off in Switchboard</span>' : ''),
        'The books behind the gym: cover, why it matters, takeaways and where to buy it.',
        [['+ Add book', 'add', true], ['All books', 'manage']]) +
      card('gallery', '📷', 'Gallery',
        stat(d.images.length, d.images.length === 1 ? 'photo' : 'photos'),
        'Photos on the Gallery page. These are also the pictures the blog banner can use.',
        [['+ Add photo', 'add', true], ['All photos', 'manage']]) +
      card('shop', '🛍️', 'Shop',
        stat(onSale.length, 'on sale') + (d.products.length - onSale.length ? stat(d.products.length - onSale.length, 'hidden') : '') +
          (lowStock ? stat(lowStock, 'low on stock', true) : ''),
        admin ? 'Session packages, merch, supplements and downloads, with prices and stock.'
          : 'Session packages, merch, supplements and downloads. Only admins can change products; you can see them and handle orders.',
        admin ? [['+ Add product', 'add', true], ['All products', 'manage']] : [['Products and orders', 'manage']]) +
      '</div>';

    html += '<h3 class="ct-subhead">Drafts waiting</h3>';
    if (!drafts.length){
      html += '<p class="ct-empty">No drafts. Every post is published.</p>';
    } else {
      html += '<ul class="ct-drafts">' + drafts.map(p => {
        const gaps = missing(p);
        return '<li><div class="ct-draft-text"><b>' + esc(p.title) + '</b>' +
          '<span class="ct-draft-meta">' + esc(p.category || 'No topic') + (p.date ? ' · ' + fmtDate(p.date) : '') +
          (gaps.length ? ' · <span class="ct-gap">' + esc(gaps.join(', ')) + '</span>' : ' · ready to publish') + '</span></div>' +
          '<button type="button" class="btn2" data-ct-edit="' + esc(p.id) + '">Edit</button></li>';
      }).join('') + '</ul>';
    }

    html += '<details class="ct-help"><summary>Writing a blog post, step by step</summary><ol>' +
      '<li>Press <b>+ New post</b> and give it a title. The link (slug) fills itself in.</li>' +
      '<li>Pick a topic, then write a one or two sentence <b>excerpt</b>: it shows on the post’s card.</li>' +
      '<li>Add a <b>cover</b>: press Upload and pick a photo from your phone or computer.</li>' +
      '<li>Write the body. Select some words and press <b>B</b> for bold, or <b>H2</b> to turn a line into a heading. <b>Picture</b> puts a photo inside the post.</li>' +
      '<li>Press <b>Preview</b> to see it as visitors will.</li>' +
      '<li>Leave it as <b>Draft</b> to finish later, or choose <b>Published</b> and Save Post to put it live.</li>' +
      '</ol></details>';

    body.innerHTML = html;
    body.querySelectorAll('[data-ct-open]').forEach(b => b.addEventListener('click', () => {
      const key = b.dataset.ctOpen, action = b.dataset.ctAction;
      if (key === 'blog') openBlog(action === 'new' ? 'new' : null);
      else open(key, action);
    }));
    body.querySelectorAll('[data-ct-edit]').forEach(b => b.addEventListener('click', () => openBlog(b.dataset.ctEdit)));
  }

  // Re-read every time the page opens: posts may have changed in the editors.
  window.bnbContentOnTabShown = function(){ render(); load(); };
  window.bnbContentOnTabShown();
})();
