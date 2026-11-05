(function(){

  const PRODUCTS_KEY = 'bnb-shop-products-v1';

  const SEED_PRODUCTS = [
    { id:'prod1', type:'package', name:'10-Session Pack', desc:"10 one-on-one session credits · never expires", price:480, credits:10, active:true },
    { id:'prod2', type:'package', name:'5-Session Pack', desc:"5 one-on-one session credits · never expires", price:260, credits:5, active:true },
    { id:'prod9', type:'package', name:'Intro Session', desc:'1 one-on-one taster session with a coach · new members', price:35, credits:1, active:true },
    { id:'prod10', type:'package', name:'Starter 3-Pack', desc:'3 sessions: assessment, program walkthrough and technique check · never expires', price:150, credits:3, active:true },
    { id:'prod11', type:'package', name:'20-Session Pack', desc:'20 one-on-one session credits · best per-session price · never expires', price:880, credits:20, active:true },
    { id:'prod12', type:'package', name:'Partner Pack', desc:'10 sessions for two people training together · booked by the buyer · never expires', price:720, credits:10, active:true },
    { id:'prod13', type:'package', name:'Transformation 12-Week', desc:'24 sessions (2 a week for 12 weeks) with body-fat and measurement checks at start and finish', price:1080, credits:24, active:true },
    { id:'prod3', type:'merch', name:"Bell(e)s N' Barz Tee", desc:'Heavyweight cotton, gold logo print', price:32, stock:14, checkoutUrl:'', active:true },
    { id:'prod4', type:'merch', name:'Gym Tote Bag', desc:'Canvas, reinforced straps', price:24, stock:3, checkoutUrl:'', active:true },
    { id:'prod5', type:'merch', name:'Lifting Straps', desc:'Cotton, gold-stitched', price:18, stock:22, checkoutUrl:'', active:true },
    { id:'prod6', type:'supplement', name:'Whey Isolate — Vanilla', desc:'900g · 30 servings', price:45, stock:9, checkoutUrl:'', active:true },
    { id:'prod7', type:'supplement', name:'Creatine Monohydrate', desc:'300g · unflavored', price:22, stock:2, checkoutUrl:'', active:true },
    { id:'prod8', type:'digital', name:'Off-Season Nutrition Guide', desc:'28-page PDF — fuelling strategy between blocks', price:15, fileUrl:'', active:true }
  ];

  function productToRow(p){
    return {
      id: (p.id && p.id.length === 36) ? p.id : undefined,
      type: p.type, name: p.name, description: p.desc, price: p.price,
      credits: p.credits || null, stock: (p.stock === undefined ? null : p.stock),
      checkout_url: p.checkoutUrl || null,
      active: p.active !== false
    };
  }
  function rowToProduct(r){
    return {
      id: r.id, type: r.type, name: r.name, desc: r.description, price: r.price,
      credits: r.credits, stock: r.stock, checkoutUrl: r.checkout_url||'',
      fileUrl: '', active: r.active
    };
  }

  async function migrateSeedProducts(){
    let ok = 0;
    for (const p of SEED_PRODUCTS){
      const { data: existing } = await bnbClient.from('products').select('id').eq('name', p.name);
      if (existing && existing.length) continue; // already migrated
      const row = productToRow(p);
      delete row.id;
      const { error } = await bnbClient.from('products').insert([row]);
      if (error){ console.warn('Seed migration: product failed', p.name, error); continue; }
      ok++;
    }
    return ok;
  }
  window.BNB_MIGRATE = window.BNB_MIGRATE || {};
  window.BNB_MIGRATE.products = migrateSeedProducts;

  function loadProducts(){
    // Instant first paint using seed data; real rows replace it once
    // Supabase responds (see refreshProductsFromSupabase below).
    return SEED_PRODUCTS.slice();
  }
  async function refreshProductsFromSupabase(){
    const { data, error } = await bnbClient.from('products').select('*');
    if (error) { console.error('Supabase load products failed:', error); return; }
    if (data && data.length) {
      products = data.map(rowToProduct);
      productsSync.reset(products.filter(p => p.id && p.id.length === 36).map(productToRow));
      await loadProductFiles();
      if (typeof renderAdmin === 'function') renderAdmin();
      if (typeof renderCatalog === 'function') renderCatalog();
    }
  }
  // Download links are private to staff (sql/98); buyers get theirs after paying.
  async function loadProductFiles(){
    const { data, error } = await bnbClient.from('product_files').select('product_id, file_url');
    if (error) return;
    products.forEach(function(p){ const f = (data || []).find(function(x){ return x.product_id === p.id; }); p.fileUrl = f ? f.file_url : ''; });
  }
  async function saveProductFile(id, url){
    const { error } = url ? await bnbClient.from('product_files').upsert({ product_id: id, file_url: url, updated_at: new Date().toISOString() })
      : await bnbClient.from('product_files').delete().eq('product_id', id);
    if (error) shopToast('The download link could not be saved: ' + error.message);
  }
  // Sends only changed products and deletes removed ones (bnbTableSync,
  // main HTML) — deleting a product used to vanish locally only.
  const productsSync = bnbTableSync('products');
  function saveProducts(){
    return productsSync.save(products.filter(p => p.id && p.id.length === 36).map(productToRow));
  }

  let products = loadProducts();
  refreshProductsFromSupabase(); // async — replaces seed data once Supabase responds

  const TYPE_LABELS = { merch:'Merch', supplement:'Supplement', package:'Session Package', digital:'Digital / Ebook' };

  // Exposed for later build stages (booking-tab credit deduction, invoice
  // wiring) the same way BNB_USERS is exposed for cross-module reads.
  window.BNB_PRODUCTS = {
    getAll: function(){ return products.slice(); },
    getById: function(id){ return products.find(function(p){ return p.id===id; }); }
  };

  // USD prices, shown in the visitor's chosen currency (js/bells-n-barz-currency.js).
  // money() is HTML; moneyText() is for textContent.
  function money(n){ return BNB_CURRENCY.html(n, { short:true }); }
  function moneyText(n){ return BNB_CURRENCY.format(n, { short:true }); }
  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  let shopToastTimer = null;
  function shopToast(msg){
    let el = document.getElementById('shop-toast');
    if (!el){
      el = document.createElement('div');
      el.id = 'shop-toast';
      el.className = 'gal-toast';
      document.querySelector('#site-shop .shop-scope').appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(shopToastTimer);
    shopToastTimer = setTimeout(()=> el.classList.remove('show'), 2600);
  }

  /* ---------------- MODE SWITCH ---------------- */
  const modeSwitch = document.getElementById('shop-mode-switch');
  const views = { view: document.getElementById('shop-view-shop'), admin: document.getElementById('shop-view-admin') };
  modeSwitch.querySelectorAll('button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      if (btn.dataset.mode === 'admin'){
        if (typeof isSignedIn === 'function' && !isSignedIn()){ goToLoginPrompt(); return; }
        if (typeof isStaff === 'function' && !isStaff()){ showStaffOnlyToast(); return; }
      }
      modeSwitch.querySelectorAll('button').forEach(b=> b.classList.toggle('active', b===btn));
      Object.keys(views).forEach(k=> views[k].classList.toggle('active', k===btn.dataset.mode));
      if (btn.dataset.mode === 'admin'){ renderAdminTable(); renderOrdersTable(); }
    });
  });

  /* ---------------- PUBLIC CATALOG ---------------- */
  let activeFilter = 'all';
  const FILTERS = [ ['all','All'], ['package','Session Packages'], ['merch','Merch'], ['supplement','Supplements'], ['digital','Digital / Ebooks'] ];

  // Scroll so el sits just below the sticky site nav and this page's own
  // sticky header (both vary in height, so measure them at click time).
  function scrollBelowHeaders(el){
    if (!el) return;
    const nav = document.querySelector('.outer-header');
    const head = el.closest('.site-page') && el.closest('.site-page').querySelector('header.site');
    const offset = (nav ? nav.getBoundingClientRect().height : 0) + (head ? head.getBoundingClientRect().height : 0) + 12;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
  }

  // Shop opens on its category cards (like the Gym sections); a card swaps
  // them for that category's products plus "Back to Shop".
  function openShopCategory(filter){
    activeFilter = filter;
    renderCatalog();
    document.getElementById('shop-view-shop').classList.add('shop-browse');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function showShopCards(){
    document.getElementById('shop-view-shop').classList.remove('shop-browse');
  }
  document.getElementById('shop-back-btn').addEventListener('click', ()=>{ showShopCards(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  window.bnbShopShowCards = showShopCards;
  window.bnbShopOpen = openShopCategory;

  // Category cards (icon, name, item count) — same look as Blog/Gallery.
  const FILTER_ICONS = { all:'🛍️', package:'🎟️', merch:'👕', supplement:'💊', digital:'📱' };
  function renderTypeTabs(){
    const bar = document.getElementById('shop-type-tabs');
    const live = products.filter(function(p){ return p.active; });
    bar.innerHTML = FILTERS.map(function(f){
      const n = f[0] === 'all' ? live.length : live.filter(function(p){ return p.type === f[0]; }).length;
      return '<button type="button" data-filter="' + f[0] + '" class="cat-card' + (activeFilter===f[0]?' active':'') + (n===0?' empty':'') + '">' +
        '<span class="cat-card-icon" aria-hidden="true">' + FILTER_ICONS[f[0]] + '</span>' +
        '<span class="cat-card-name">' + f[1] + '</span>' +
        '<span class="cat-card-count">' + n + ' item' + (n===1?'':'s') + '</span></button>';
    }).join('');
    bar.querySelectorAll('button').forEach(function(btn){
      btn.addEventListener('click', function(){
        openShopCategory(btn.dataset.filter);
      });
    });
  }

  function productCardHtml(p){
    if (p.type === 'package'){
      return '<div class="shop-pkg-card">' +
        '<div class="shop-pkg-left">' +
          '<div class="shop-pkg-badge">' + esc(p.credits||'?') + '</div>' +
          '<div><div class="shop-pkg-name">' + esc(p.name) + '</div><div class="shop-pkg-desc">' + esc(p.desc) + '</div></div>' +
        '</div>' +
        '<div class="shop-pkg-right">' +
          '<div class="shop-pkg-price">' + money(p.price) + '</div>' +
          '<button class="shop-buy-btn invoice" style="margin-top:8px;" data-buy="' + p.id + '">Buy → Creates Invoice</button>' +
        '</div>' +
      '</div>';
    }
    const stock = Number(p.stock||0);
    const stockHtml = stock <= 0 ? '<span class="shop-stock out">Out of stock</span>'
      : stock <= 3 ? '<span class="shop-stock low">' + stock + ' left</span>'
      : '<span class="shop-stock">' + stock + ' in stock</span>';

    if (p.type === 'digital'){
      return '<div class="shop-card">' +
        '<div class="shop-card-img">&#9733;</div>' +
        '<div class="shop-card-body">' +
          '<div class="shop-card-name">' + esc(p.name) + '</div>' +
          '<div class="shop-card-desc">' + esc(p.desc) + '</div>' +
          '<div class="shop-card-foot"><div class="shop-price">' + money(p.price) + '</div><span class="shop-stock">Download after payment</span></div>' +
          '<button class="shop-buy-btn checkout" data-buy="' + p.id + '">Buy Now</button>' +
        '</div>' +
      '</div>';
    }

    return '<div class="shop-card">' +
      '<div class="shop-card-img">&#9733;</div>' +
      '<div class="shop-card-body">' +
        '<div class="shop-card-name">' + esc(p.name) + '</div>' +
        '<div class="shop-card-desc">' + esc(p.desc) + '</div>' +
        '<div class="shop-card-foot"><div class="shop-price">' + money(p.price) + '</div>' + stockHtml + '</div>' +
        (stock<=0
          ? '<button class="shop-buy-btn checkout" disabled>Sold Out</button>'
          : '<button class="shop-buy-btn checkout" data-buy="' + p.id + '">Buy Now</button>') +
      '</div>' +
    '</div>';
  }

  function renderCatalog(){
    renderTypeTabs(); // keeps the category card counts in step with the products
    const visible = products.filter(function(p){ return p.active && (activeFilter==='all' || p.type===activeFilter); });
    const body = document.getElementById('shop-catalog-body');
    document.getElementById('shop-empty-msg').style.display = visible.length ? 'none' : 'block';

    const groups = activeFilter === 'all' ? ['package','merch','supplement','digital'] : [activeFilter];
    let html = '';
    groups.forEach(function(type){
      const items = visible.filter(function(p){ return p.type===type; });
      if (!items.length) return;
      html += '<div class="shop-section-label">' + TYPE_LABELS[type] + '</div>';
      if (type === 'package'){
        html += '<div>' + items.map(productCardHtml).join('') + '</div>';
      } else {
        html += '<div class="shop-grid">' + items.map(productCardHtml).join('') + '</div>';
      }
    });
    body.innerHTML = html;
    // Digital cards use a real <a href> Download link — no toast needed, it
    // just works. Merch/supplement now open a real order form (Stage 2).
    // Package still shows the "not wired up yet" toast — that's Stage 3.
    body.querySelectorAll('[data-buy]').forEach(function(btn){
      btn.addEventListener('click', function(){
        const p = products.find(function(x){ return x.id===btn.dataset.buy; });
        if (!p) return;
        if (p.type === 'package'){
          openPackagePanel(p);
        } else {
          openOrderPanel(p);
        }
      });
    });
  }

  /* ---------------- ORDERS (merch/supplement) ---------------- */
  // One orders table for the website and app: names come from the member and product it points to.
  function rowToOrder(r){
    return {
      id: r.id, userId: r.user_id, productId: r.product_id,
      productName: (r.products && r.products.name) || 'Product', productType: (r.products && r.products.type) || '',
      buyerName: (r.users && r.users.full_name) || 'Member', buyerEmail: (r.users && r.users.email) || '',
      qty: r.quantity, total: r.amount, status: r.status || 'pending', createdAt: r.created_at,
      fulfilment: r.fulfilment || 'pickup', zone: r.delivery_zone || '', fee: Number(r.delivery_fee || 0),
      address: r.delivery_address || '', phone: r.delivery_phone || ''
    };
  }
  async function refreshOrdersFromSupabase(){
    const { data, error } = await bnbClient.from('orders').select('*, products(name,type), users(full_name,email)').order('created_at', {ascending:false});
    if (error) { console.error('Supabase load orders failed:', error); return; }
    orders = (data || []).map(rowToOrder);
    if (typeof renderAdmin === 'function') renderAdmin();
    renderMyOrders();
  }
  async function setOrderStatus(o, status){
    const { error } = await bnbClient.from('orders').update({ status: status }).eq('id', o.id);
    if (error) { shopToast(error.message || 'Could not update that order.'); return false; }
    o.status = status;
    return true;
  }
  let orders = [];

  /* ---------------- DELIVERY ZONES (sql/97) ---------------- */
  let zones = [];
  async function refreshZones(){
    const { data, error } = await bnbClient.from('delivery_zones').select('*').order('fee').order('name'); // cheapest first
    if (error) { console.warn('Supabase load delivery_zones failed:', error); return; }
    zones = data || [];
    renderZonesTable();
  }
  function selectedZone(){
    const on = document.getElementById('shop-fulfil-delivery').checked;
    return on ? zones.find(function(z){ return z.id === document.getElementById('shop-order-zone').value; }) || null : null;
  }
  function syncFulfilment(){
    const delivery = document.getElementById('shop-fulfil-delivery').checked;
    document.getElementById('shop-order-delivery-fields').style.display = delivery ? '' : 'none';
    updateOrderTotal();
  }
  function isPhysical(p){ return p.type !== 'digital' && p.type !== 'package'; }

  let orderPanelProduct = null;

  function renderOrderSummary(){
    const p = orderPanelProduct;
    document.getElementById('shop-order-product-summary').textContent = p.name + ' — ' + moneyText(p.price) + ' each';
  }
  function openOrderPanel(p){
    if (!(window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf())){ shopToast('Please log in to order.'); return; }
    orderPanelProduct = p;
    renderOrderSummary();
    const physical = isPhysical(p), live = zones.filter(function(z){ return z.active; });
    const qtyInput = document.getElementById('shop-order-qty');
    qtyInput.value = 1;
    qtyInput.max = physical ? Number(p.stock || 0) : 1;
    document.getElementById('shop-order-qty-field').style.display = physical ? '' : 'none';
    document.getElementById('shop-order-fulfil').style.display = physical ? '' : 'none';
    document.getElementById('shop-fulfil-delivery-row').style.display = physical && live.length ? '' : 'none';
    document.getElementById('shop-fulfil-pickup').checked = true;
    document.getElementById('shop-order-zone').innerHTML = live.map(function(z){
      return '<option value="' + esc(z.id) + '">' + esc(z.name) + ' (' + esc(moneyText(z.fee)) + ')</option>';
    }).join('');
    document.getElementById('shop-order-address').value = '';
    document.getElementById('shop-order-phone').value = '';
    syncFulfilment();
    document.getElementById('shop-order-panel-backdrop').classList.add('show');
  }
  function closeOrderPanel(){ document.getElementById('shop-order-panel-backdrop').classList.remove('show'); orderPanelProduct = null; }

  function updateOrderTotal(){
    if (!orderPanelProduct) return;
    const qty = Math.max(1, Number(document.getElementById('shop-order-qty').value) || 1);
    const z = selectedZone();
    document.getElementById('shop-order-total').textContent = moneyText(orderPanelProduct.price * qty + (z ? Number(z.fee) : 0));
  }
  document.getElementById('shop-order-qty').addEventListener('input', updateOrderTotal);
  document.getElementById('shop-order-zone').addEventListener('change', updateOrderTotal);
  document.getElementById('shop-fulfil-pickup').addEventListener('change', syncFulfilment);
  document.getElementById('shop-fulfil-delivery').addEventListener('change', syncFulfilment);
  // USD/KES switch flipped while a checkout panel is open.
  document.addEventListener('bnb-currency-change', ()=>{
    if (orderPanelProduct){ renderOrderSummary(); updateOrderTotal(); }
    if (pkgPanelProduct) renderPackageSummary();
  });
  document.getElementById('shop-order-cancel').addEventListener('click', closeOrderPanel);
  document.getElementById('shop-order-panel-backdrop').addEventListener('click', function(e){ if (e.target.id==='shop-order-panel-backdrop') closeOrderPanel(); });

  document.getElementById('shop-order-submit').addEventListener('click', async function(){
    const p = orderPanelProduct;
    if (!p) return;
    const physical = isPhysical(p), z = physical ? selectedZone() : null;
    const delivery = document.getElementById('shop-fulfil-delivery').checked;
    const address = document.getElementById('shop-order-address').value.trim();
    const phone = document.getElementById('shop-order-phone').value.trim();
    const qty = physical ? Math.max(1, Number(document.getElementById('shop-order-qty').value) || 1) : 1;
    if (physical && qty > Number(p.stock || 0)){ alert('Only ' + Number(p.stock || 0) + ' left in stock.'); return; }
    if (physical && delivery && !z){ alert('Choose a delivery area.'); return; }
    if (z && !address){ alert('Enter your delivery address.'); return; }
    if (z && !phone){ alert('Enter a phone number for delivery.'); return; }

    this.disabled = true;
    // The database works out the total, so what's shown here can't decide the price.
    const { data: id, error } = await bnbClient.rpc('place_shop_order', {
      p_product: p.id, p_qty: qty, p_zone: z ? z.id : null, p_address: z ? address : null, p_phone: z ? phone : null
    });
    this.disabled = false;
    if (error){ alert(error.message || 'Could not place that order.'); return; }
    closeOrderPanel();
    await refreshOrdersFromSupabase();
    const o = orders.find(function(x){ return x.id === id; });
    if (p.checkoutUrl && p.checkoutUrl.trim()){
      window.open(p.checkoutUrl.trim(), '_blank', 'noopener');
      shopToast('Order placed. We\'ll mark it paid once payment lands.');
    } else if (window.BNB_BILLING && window.BNB_BILLING.payOrder && o){
      window.BNB_BILLING.payOrder(o.id, o.total, p.name);
    } else {
      shopToast('Order placed. Pay at the front desk.');
    }
  });

  /* ---------------- MY ORDERS ---------------- */
  function renderMyOrders(){
    const box = document.getElementById('shop-my-orders');
    if (!box) return;
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    const mine = me ? orders.filter(function(o){ return o.userId === me.id; }) : [];
    box.innerHTML = !mine.length ? '' : '<div class="shop-section-label">Your orders</div>' + mine.map(function(o){
      const paid = o.status === 'paid' || o.status === 'fulfilled';
      return '<div class="shop-pkg-card"><div class="shop-pkg-left"><div><div class="shop-pkg-name">' + esc(o.productName) + ' × ' + o.qty + '</div>' +
        '<div class="shop-pkg-desc">' + esc(fulfilmentText(o)) + ' · ' + (ORDER_STATUS_LABELS[o.status] || esc(o.status)) + '</div></div></div>' +
        '<div class="shop-pkg-right"><div class="shop-pkg-price">' + money(o.total) + '</div>' +
        (o.status === 'pending' ? '<button class="shop-buy-btn invoice" style="margin-top:8px;" data-my-pay="' + o.id + '">Pay by M-Pesa</button>' : '') +
        (paid && o.productType === 'digital' ? '<button class="shop-buy-btn invoice" style="margin-top:8px;" data-my-file="' + o.id + '">Download</button>' : '') +
        '</div></div>';
    }).join('');
    box.querySelectorAll('[data-my-pay]').forEach(function(b){ b.addEventListener('click', function(){
      const o = orders.find(function(x){ return x.id === b.dataset.myPay; });
      if (o && window.BNB_BILLING.payOrder) window.BNB_BILLING.payOrder(o.id, o.total, o.productName);
    }); });
    box.querySelectorAll('[data-my-file]').forEach(function(b){ b.addEventListener('click', async function(){
      const { data, error } = await bnbClient.rpc('my_digital_link', { p_order: b.dataset.myFile });
      if (error || !data){ shopToast((error && error.message) || 'That file isn\'t ready yet. Please ask the front desk.'); return; }
      window.open(data, '_blank', 'noopener');
    }); });
  }
  function fulfilmentText(o){
    if (o.productType === 'digital') return 'Download';
    if (o.productType === 'package') return 'Session credits';
    return o.fulfilment === 'delivery' ? 'Delivery to ' + o.zone : 'Pick up at the gym';
  }

  /* ---------------- PACKAGE CHECKOUT (session credits) ---------------- */
  let pkgPanelProduct = null;

  function renderPackageSummary(){
    const p = pkgPanelProduct;
    document.getElementById('shop-pkg-summary').textContent = p.name + ' — ' + moneyText(p.price) + ' (' + p.credits + ' credits)';
  }
  function openPackagePanel(p){
    pkgPanelProduct = p;
    renderPackageSummary();
    document.getElementById('shop-pkg-name').value = '';
    document.getElementById('shop-pkg-email').value = '';
    document.getElementById('shop-pkg-phone').value = '';
    document.getElementById('shop-pkg-panel-backdrop').classList.add('show');
  }
  function closePackagePanel(){ document.getElementById('shop-pkg-panel-backdrop').classList.remove('show'); pkgPanelProduct = null; }
  document.getElementById('shop-pkg-cancel').addEventListener('click', closePackagePanel);
  document.getElementById('shop-pkg-panel-backdrop').addEventListener('click', function(e){ if (e.target.id==='shop-pkg-panel-backdrop') closePackagePanel(); });

  document.getElementById('shop-pkg-submit').addEventListener('click', function(){
    const p = pkgPanelProduct;
    if (!p) return;
    const name = document.getElementById('shop-pkg-name').value.trim();
    const email = document.getElementById('shop-pkg-email').value.trim();
    const phone = document.getElementById('shop-pkg-phone').value.trim();

    if (!name){ alert('Enter your name.'); return; }
    if (!email){ alert('Enter your email.'); return; }
    if (!window.BNB_USERS || !window.BNB_BILLING){ alert('Checkout is unavailable right now — try again shortly.'); return; }

    // Returning buyer: use their existing account so the invoice lands where
    // they'll actually see it. New buyer: create a lightweight lead account.
    let member = window.BNB_USERS.getByEmail(email);
    let isNew = false;
    if (!member){
      member = window.BNB_USERS.createLead({ fullName: name, email: email, phone: phone });
      isNew = true;
    }

    window.BNB_BILLING.createInvoice({
      userId: member.id,
      amount: p.price,
      type: 'package',
      credits: p.credits,
      productId: p.id,
      notes: 'Shop purchase: ' + p.name
    });

    closePackagePanel();
    shopToast('Invoice created for ' + member.fullName + (isNew ? ' (new account)' : '') + ' — credits post once it\'s marked paid in Billing.');
  });

  /* ---------------- ADMIN CRUD ---------------- */
  function statusPillHtml(active){
    return active ? '<span class="status-pill active">Active</span>' : '<span class="status-pill hidden">Hidden</span>';
  }

  // Products are admin-only (sql/80-shop-admin-only.sql); other staff see
  // them and handle orders.
  function isAdmin(){
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    return !!(me && me.roles && me.roles.includes('admin'));
  }

  function renderAdminTable(){
    updateAdminCounts();
    const admin = isAdmin();
    document.getElementById('shop-admin-only-note').style.display = admin ? 'none' : '';
    document.getElementById('shop-new-product-btn').style.display = admin ? '' : 'none';
    const tbody = document.getElementById('shop-admin-tbody');
    if (!products.length){
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px 0; color:var(--muted);">No products yet — add your first one above.</td></tr>';
      return;
    }
    tbody.innerHTML = products.map(function(p){
      const secondary = p.type === 'package' ? (p.credits||0) + ' credits'
        : p.type === 'digital' ? ((p.fileUrl && p.fileUrl.trim()) ? 'Link set' : 'Link not set')
        : (p.stock||0) + ' in stock';
      return '<tr>' +
        '<td>' + esc(p.name) + '</td>' +
        '<td>' + TYPE_LABELS[p.type] + '</td>' +
        '<td class="mono">' + money(p.price) + '</td>' +
        '<td>' + secondary + '</td>' +
        '<td>' + statusPillHtml(p.active) + '</td>' +
        '<td><div class="row-actions">' + (admin ?
          '<button data-edit="' + p.id + '">Edit</button>' +
          '<button data-del="' + p.id + '">Delete</button>' : '') +
        '</div></td>' +
      '</tr>';
    }).join('');
    tbody.querySelectorAll('[data-edit]').forEach(function(b){ b.addEventListener('click', function(){ openProductPanel(b.dataset.edit); }); });
    tbody.querySelectorAll('[data-del]').forEach(function(b){ b.addEventListener('click', function(){ deleteProduct(b.dataset.del); }); });
  }

  let editingProductId = null;

  function syncFieldsForType(){
    const type = document.getElementById('shop-f-type').value;
    document.getElementById('shop-f-stock-wrap').style.display = (type==='package' || type==='digital') ? 'none' : '';
    document.getElementById('shop-f-credits-wrap').style.display = (type==='package') ? '' : 'none';
    document.getElementById('shop-f-checkout-wrap').style.display = (type==='package' || type==='digital') ? 'none' : '';
    document.getElementById('shop-f-download-wrap').style.display = (type==='digital') ? '' : 'none';
  }
  document.getElementById('shop-f-type').addEventListener('change', syncFieldsForType);

  function openProductPanel(id){
    if (!isAdmin()){ shopToast('Only admins can add or change products.'); return; }
    editingProductId = id || null;
    const p = id ? products.find(function(x){ return x.id===id; }) : null;
    document.getElementById('shop-panel-title').textContent = p ? 'Edit Product' : 'Add Product';
    document.getElementById('shop-f-type').value = p ? p.type : 'merch';
    document.getElementById('shop-f-name').value = p ? p.name : '';
    document.getElementById('shop-f-desc').value = p ? p.desc : '';
    document.getElementById('shop-f-price').value = p ? p.price : '';
    document.getElementById('shop-f-stock').value = p ? (p.stock!=null?p.stock:'') : '';
    document.getElementById('shop-f-credits').value = p ? (p.credits!=null?p.credits:'') : '';
    document.getElementById('shop-f-checkout').value = p ? (p.checkoutUrl||'') : '';
    document.getElementById('shop-f-download').value = p ? (p.fileUrl||'') : '';
    document.getElementById('shop-f-active').value = (!p || p.active) ? '1' : '0';
    syncFieldsForType();
    document.getElementById('shop-panel-backdrop').classList.add('show');
  }
  function closeProductPanel(){ document.getElementById('shop-panel-backdrop').classList.remove('show'); editingProductId = null; }

  function saveProduct(){
    const type = document.getElementById('shop-f-type').value;
    const name = document.getElementById('shop-f-name').value.trim();
    if (!name){ alert('Give the product a name.'); return; }
    const price = Number(document.getElementById('shop-f-price').value) || 0;
    const data = {
      type: type,
      name: name,
      desc: document.getElementById('shop-f-desc').value.trim(),
      price: price,
      active: document.getElementById('shop-f-active').value === '1'
    };
    if (type === 'package'){
      data.credits = Math.max(1, Number(document.getElementById('shop-f-credits').value) || 1);
    } else if (type === 'digital'){
      data.fileUrl = document.getElementById('shop-f-download').value.trim();
    } else {
      data.stock = Math.max(0, Number(document.getElementById('shop-f-stock').value) || 0);
      data.checkoutUrl = document.getElementById('shop-f-checkout').value.trim();
    }
    if (editingProductId){
      const idx = products.findIndex(function(x){ return x.id===editingProductId; });
      if (idx !== -1) products[idx] = Object.assign({ id: editingProductId }, data);
    } else {
      products.push(Object.assign({ id: window.BNB_UUID() }, data));
    }
    const saved = editingProductId ? products.find(function(x){ return x.id===editingProductId; }) : products[products.length - 1];
    Promise.resolve(saveProducts()).then(function(){ if (type === 'digital') saveProductFile(saved.id, data.fileUrl); });
    closeProductPanel();
    renderAdminTable();
    renderCatalog();
  }

  function deleteProduct(id){
    const p = products.find(function(x){ return x.id===id; });
    if (!p || !isAdmin()) return;
    if (!confirm('Delete "' + p.name + '"? This cannot be undone.')) return;
    products = products.filter(function(x){ return x.id !== id; });
    saveProducts();
    renderAdminTable();
    renderCatalog();
  }

  document.getElementById('shop-new-product-btn').addEventListener('click', function(){ openProductPanel(null); });
  document.getElementById('shop-f-cancel').addEventListener('click', closeProductPanel);
  document.getElementById('shop-f-save').addEventListener('click', saveProduct);
  document.getElementById('shop-panel-backdrop').addEventListener('click', function(e){ if (e.target.id==='shop-panel-backdrop') closeProductPanel(); });

  /* ---------------- ADMIN: ORDERS ---------------- */
  const ORDER_STATUS_LABELS = { pending:'Pending Payment', paid:'Paid', fulfilled:'Fulfilled', cancelled:'Cancelled' };
  function orderStatusPillHtml(status){
    const cls = status==='paid' ? 'active' : status==='fulfilled' ? 'active' : status==='cancelled' ? 'hidden' : '';
    return '<span class="status-pill ' + cls + '">' + ORDER_STATUS_LABELS[status] + '</span>';
  }
  function fmtOrderDate(iso){
    try { return new Date(iso).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' }); }
    catch(e){ return ''; }
  }

  function renderOrdersTable(){
    updateAdminCounts();
    const tbody = document.getElementById('shop-orders-tbody');
    if (!orders.length){
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px 0; color:var(--muted);">No orders yet.</td></tr>';
      return;
    }
    const sorted = orders.slice().sort(function(a,b){ return new Date(b.createdAt) - new Date(a.createdAt); });
    tbody.innerHTML = sorted.map(function(o){
      let actions = '';
      if (o.status === 'pending'){
        actions = '<button data-mark-paid="' + o.id + '">Mark Paid</button><button data-cancel-order="' + o.id + '">Cancel</button>';
      } else if (o.status === 'paid'){
        actions = '<button data-mark-fulfilled="' + o.id + '">Mark Fulfilled</button>';
      }
      return '<tr>' +
        '<td>' + esc(o.buyerName) + '<div class="field-hint">' + esc(o.buyerEmail) + '</div></td>' +
        '<td>' + esc(o.productName) + '<div class="field-hint">' + esc(fulfilmentText(o)) +
          (o.fulfilment === 'delivery' ? ' · fee ' + moneyText(o.fee) + '<br>' + esc(o.address) + '<br>' + esc(o.phone) : '') + '</div></td>' +
        '<td>' + o.qty + '</td>' +
        '<td class="mono">' + money(o.total) + '</td>' +
        '<td>' + orderStatusPillHtml(o.status) + '</td>' +
        '<td>' + fmtOrderDate(o.createdAt) + '</td>' +
        '<td><div class="row-actions">' + actions + '</div></td>' +
      '</tr>';
    }).join('');
    tbody.querySelectorAll('[data-mark-paid]').forEach(function(b){ b.addEventListener('click', function(){ markOrderPaid(b.dataset.markPaid); }); });
    tbody.querySelectorAll('[data-mark-fulfilled]').forEach(function(b){ b.addEventListener('click', function(){ markOrderFulfilled(b.dataset.markFulfilled); }); });
    tbody.querySelectorAll('[data-cancel-order]').forEach(function(b){ b.addEventListener('click', function(){ cancelOrder(b.dataset.cancelOrder); }); });
  }

  // Stock only decrements here — the moment payment is actually confirmed —
  // not when the order is first placed. Keeps an unpaid "reservation" from
  // blocking someone else from buying the last unit.
  // Goes through shop_take_stock() so coaches (who can't edit products)
  // can still mark orders paid.
  async function takeStock(p, qty){
    if (!(p.id && p.id.length === 36)){ p.stock = Math.max(0, Number(p.stock||0) - qty); return; }
    const { data, error } = await bnbClient.rpc('shop_take_stock', { p_product: p.id, p_qty: qty });
    if (error){
      console.error('shop_take_stock failed:', error);
      // Before sql/80-shop-admin-only.sql runs there's no function yet:
      // an admin can still save the stock directly, as before.
      if (isAdmin()){ p.stock = Math.max(0, Number(p.stock||0) - qty); saveProducts(); }
      else shopToast('Order marked paid, but the stock could not be updated. Ask an admin to check it.');
      return;
    }
    p.stock = data;
    productsSync.reset(products.filter(x => x.id && x.id.length === 36).map(productToRow));
  }
  async function markOrderPaid(id){
    const o = orders.find(function(x){ return x.id===id; });
    if (!o) return;
    const p = products.find(function(x){ return x.id===o.productId; });
    if (p && p.type !== 'package' && p.type !== 'digital') await takeStock(p, o.qty);
    if (!await setOrderStatus(o, 'paid')) return;
    renderOrdersTable();
    renderMyOrders();
    renderAdminTable();
    renderCatalog();
    shopToast('Marked paid — stock updated.');
  }

  async function markOrderFulfilled(id){
    const o = orders.find(function(x){ return x.id===id; });
    if (!o) return;
    if (!await setOrderStatus(o, 'fulfilled')) return;
    renderOrdersTable();
    shopToast('Marked fulfilled.');
  }

  async function cancelOrder(id){
    const o = orders.find(function(x){ return x.id===id; });
    if (!o) return;
    if (!confirm('Cancel this order for ' + o.buyerName + '? Stock was never reserved, so nothing needs restoring.')) return;
    const { error } = await bnbClient.from('orders').delete().eq('id', id);
    if (error){ shopToast(error.message || 'Could not cancel that order.'); return; }
    orders = orders.filter(function(x){ return x.id !== id; });
    renderOrdersTable();
    renderMyOrders();
  }

  // Counts on the Admin Products / Orders cards.
  function updateAdminCounts(){
    const p = document.getElementById('shop-admin-products-count');
    const o = document.getElementById('shop-admin-orders-count');
    if (p) p.textContent = products.length + ' product' + (products.length===1?'':'s');
    if (o) o.textContent = orders.length + ' order' + (orders.length===1?'':'s');
  }

  const adminSubtabs = document.getElementById('shop-admin-subtabs');
  adminSubtabs.querySelectorAll('button').forEach(function(btn){
    btn.addEventListener('click', function(){
      adminSubtabs.querySelectorAll('button').forEach(function(b){ b.classList.toggle('active', b===btn); });
      const tab = btn.dataset.adminTab;
      ['products', 'orders', 'delivery'].forEach(function(t){
        document.getElementById('shop-admin-' + t + '-panel').style.display = t === tab ? '' : 'none';
      });
      if (tab === 'orders') renderOrdersTable();
      if (tab === 'delivery') renderZonesTable();
      scrollBelowHeaders(document.getElementById('shop-admin-' + tab + '-panel'));
    });
  });

  /* ---------------- DELIVERY ZONES ADMIN ---------------- */
  function renderZonesTable(){
    const tbody = document.getElementById('shop-zones-tbody');
    if (!tbody) return;
    const admin = isAdmin();
    document.getElementById('shop-zone-form').style.display = admin ? '' : 'none';
    tbody.innerHTML = !zones.length ? '<tr><td colspan="4" style="text-align:center; padding:30px 0; color:var(--muted);">No delivery areas yet. Until you add one, buyers can only pick up at the gym.</td></tr>' :
      zones.map(function(z){
        return '<tr><td>' + esc(z.name) + '</td><td class="mono">' + money(z.fee) + '</td><td>' + statusPillHtml(z.active) + '</td><td><div class="row-actions">' + (admin ?
          '<button data-zone-edit="' + z.id + '">Edit</button><button data-zone-toggle="' + z.id + '">' + (z.active ? 'Hide' : 'Show') + '</button><button data-zone-del="' + z.id + '">Delete</button>' : '') +
          '</div></td></tr>';
      }).join('');
    tbody.querySelectorAll('[data-zone-edit]').forEach(function(b){ b.addEventListener('click', function(){
      const z = zones.find(function(x){ return x.id === b.dataset.zoneEdit; });
      editingZoneId = z.id;
      document.getElementById('shop-zone-name').value = z.name;
      document.getElementById('shop-zone-fee').value = z.fee;
      syncZoneKes();
      document.getElementById('shop-zone-save').textContent = 'Save changes';
    }); });
    tbody.querySelectorAll('[data-zone-toggle]').forEach(function(b){ b.addEventListener('click', async function(){
      const z = zones.find(function(x){ return x.id === b.dataset.zoneToggle; });
      const { error } = await bnbClient.from('delivery_zones').update({ active: !z.active }).eq('id', z.id);
      if (error){ shopToast(error.message); return; }
      refreshZones();
    }); });
    tbody.querySelectorAll('[data-zone-del]').forEach(function(b){ b.addEventListener('click', async function(){
      const z = zones.find(function(x){ return x.id === b.dataset.zoneDel; });
      if (!confirm('Delete "' + z.name + '"? Past orders keep their area and fee.')) return;
      const { error } = await bnbClient.from('delivery_zones').delete().eq('id', z.id);
      if (error){ shopToast(error.message); return; }
      refreshZones();
    }); });
  }
  let editingZoneId = null;
  function syncZoneKes(){
    const usd = Number(document.getElementById('shop-zone-fee').value) || 0;
    const rate = (window.BNB_CURRENCY && window.BNB_CURRENCY.rate()) || 129;
    document.getElementById('shop-zone-kes').textContent = 'About KSh ' + Math.round(usd * rate).toLocaleString('en-US');
  }
  document.getElementById('shop-zone-fee').addEventListener('input', syncZoneKes);
  document.getElementById('shop-zone-save').addEventListener('click', async function(){
    const name = document.getElementById('shop-zone-name').value.trim();
    const fee = Number(document.getElementById('shop-zone-fee').value);
    if (!name){ alert('Name the delivery area.'); return; }
    if (!(fee >= 0)){ alert('Enter the fee in dollars.'); return; }
    const row = { name: name, fee: fee };
    const { error } = editingZoneId ? await bnbClient.from('delivery_zones').update(row).eq('id', editingZoneId)
      : await bnbClient.from('delivery_zones').insert([row]);
    if (error){ shopToast(error.message); return; }
    editingZoneId = null;
    document.getElementById('shop-zone-name').value = '';
    document.getElementById('shop-zone-fee').value = '';
    syncZoneKes();
    this.textContent = 'Add area';
    refreshZones();
  });

  /* ---------------- INIT ---------------- */
  refreshOrdersFromSupabase();
  refreshZones();
  renderTypeTabs();
  renderCatalog();

})();
