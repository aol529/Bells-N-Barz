(function(){

  const PRODUCTS_KEY = 'bnb-shop-products-v1';

  const SEED_PRODUCTS = [
    { id:'prod1', type:'package', name:'10-Session Pack', desc:"10 one-on-one session credits · never expires", price:480, credits:10, active:true },
    { id:'prod2', type:'package', name:'5-Session Pack', desc:"5 one-on-one session credits · never expires", price:260, credits:5, active:true },
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
      checkout_url: p.checkoutUrl || null, file_url: p.fileUrl || null,
      active: p.active !== false
    };
  }
  function rowToProduct(r){
    return {
      id: r.id, type: r.type, name: r.name, desc: r.description, price: r.price,
      credits: r.credits, stock: r.stock, checkoutUrl: r.checkout_url||'',
      fileUrl: r.file_url||'', active: r.active
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
      if (typeof renderAdmin === 'function') renderAdmin();
      if (typeof renderCatalog === 'function') renderCatalog();
    }
  }
  function saveProducts(){
    // Per-row upsert — see saveUsers() for why.
    (async () => {
      const realProducts = products.filter(p => p.id && p.id.length === 36);
      const rows = realProducts.map(productToRow);
      const results = await Promise.allSettled(
        rows.map(row => bnbClient.from('products').upsert([row]))
      );
      let successCount = 0;
      results.forEach((r, i) => {
        const failed = r.status === 'rejected' || (r.value && r.value.error);
        if (!failed) { successCount++; return; }
        console.warn('Supabase: could not save product', rows[i].id, r.status === 'rejected' ? r.reason : r.value.error);
      });
      if (successCount === 0 && rows.length > 0){
        alert('Could not save to database — check your connection or Supabase setup.');
      }
    })();
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

  function money(n){ return '$' + Number(n||0).toFixed(2).replace(/\.00$/, ''); }
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

  function renderTypeTabs(){
    const bar = document.getElementById('shop-type-tabs');
    bar.innerHTML = FILTERS.map(function(f){
      return '<button data-filter="' + f[0] + '" class="' + (activeFilter===f[0]?'active':'') + '">' + f[1] + '</button>';
    }).join('');
    bar.querySelectorAll('button').forEach(function(btn){
      btn.addEventListener('click', function(){
        activeFilter = btn.dataset.filter;
        renderTypeTabs();
        renderCatalog();
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
      const hasLink = !!(p.fileUrl && p.fileUrl.trim());
      return '<div class="shop-card">' +
        '<div class="shop-card-img">&#9733;</div>' +
        '<div class="shop-card-body">' +
          '<div class="shop-card-name">' + esc(p.name) + '</div>' +
          '<div class="shop-card-desc">' + esc(p.desc) + '</div>' +
          '<div class="shop-card-foot"><div class="shop-price">' + money(p.price) + '</div><span class="shop-stock">Instant download</span></div>' +
          (hasLink
            ? '<a class="shop-buy-btn checkout" href="' + esc(p.fileUrl) + '" target="_blank" rel="noopener">Download</a>'
            : '<button class="shop-buy-btn checkout" disabled>Link not set</button>') +
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
          : (p.checkoutUrl && p.checkoutUrl.trim())
            ? '<button class="shop-buy-btn checkout" data-buy="' + p.id + '">Buy Now</button>'
            : '<button class="shop-buy-btn checkout" disabled>Checkout Not Set</button>') +
      '</div>' +
    '</div>';
  }

  function renderCatalog(){
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
  const ORDERS_KEY = 'bnb-shop-orders-v1';
  function orderToRow(o){
    return {
      id: (o.id && o.id.length === 36) ? o.id : undefined,
      product_id: (o.productId && o.productId.length === 36) ? o.productId : null,
      product_name: o.productName, product_type: o.productType,
      buyer_name: o.buyerName, buyer_email: o.buyerEmail,
      shipping_address: o.shippingAddress, quantity: o.qty,
      unit_price: o.unitPrice, amount: o.total, status: o.status
    };
  }
  function rowToOrder(r){
    return {
      id: r.id, productId: r.product_id, productName: r.product_name,
      productType: r.product_type, buyerName: r.buyer_name, buyerEmail: r.buyer_email,
      shippingAddress: r.shipping_address, qty: r.quantity, unitPrice: r.unit_price,
      total: r.amount, status: r.status, createdAt: r.created_at
    };
  }

  function loadOrders(){
    // Orders start empty locally too, same as before; real rows load in
    // once Supabase responds (see refreshOrdersFromSupabase below).
    return [];
  }
  async function refreshOrdersFromSupabase(){
    const { data, error } = await bnbClient.from('orders').select('*').order('created_at', {ascending:false});
    if (error) { console.error('Supabase load orders failed:', error); return; }
    if (data) {
      orders = data.map(rowToOrder);
      if (typeof renderAdmin === 'function') renderAdmin();
    }
  }
  function saveOrders(){
    // Per-row upsert — see saveUsers() for why.
    (async () => {
      const rows = orders.map(orderToRow);
      const results = await Promise.allSettled(
        rows.map(row => bnbClient.from('orders').upsert([row]))
      );
      let successCount = 0;
      results.forEach((r, i) => {
        const failed = r.status === 'rejected' || (r.value && r.value.error);
        if (!failed) { successCount++; return; }
        console.warn('Supabase: could not save order', rows[i].id, r.status === 'rejected' ? r.reason : r.value.error);
      });
      if (successCount === 0 && rows.length > 0){
        alert('Could not save to database — check your connection or Supabase setup.');
      }
    })();
  }
  let orders = loadOrders();
  refreshOrdersFromSupabase(); // async — replaces local (empty) start with real rows once Supabase responds

  let orderPanelProduct = null;

  function openOrderPanel(p){
    orderPanelProduct = p;
    document.getElementById('shop-order-product-summary').textContent = p.name + ' — ' + money(p.price) + ' each';
    document.getElementById('shop-order-name').value = '';
    document.getElementById('shop-order-email').value = '';
    document.getElementById('shop-order-address').value = '';
    const qtyInput = document.getElementById('shop-order-qty');
    qtyInput.value = 1;
    qtyInput.max = Number(p.stock || 0);
    updateOrderTotal();
    document.getElementById('shop-order-panel-backdrop').classList.add('show');
  }
  function closeOrderPanel(){ document.getElementById('shop-order-panel-backdrop').classList.remove('show'); orderPanelProduct = null; }

  function updateOrderTotal(){
    if (!orderPanelProduct) return;
    const qty = Math.max(1, Number(document.getElementById('shop-order-qty').value) || 1);
    document.getElementById('shop-order-total').textContent = money(orderPanelProduct.price * qty);
  }
  document.getElementById('shop-order-qty').addEventListener('input', updateOrderTotal);
  document.getElementById('shop-order-cancel').addEventListener('click', closeOrderPanel);
  document.getElementById('shop-order-panel-backdrop').addEventListener('click', function(e){ if (e.target.id==='shop-order-panel-backdrop') closeOrderPanel(); });

  document.getElementById('shop-order-submit').addEventListener('click', function(){
    const p = orderPanelProduct;
    if (!p) return;
    const name = document.getElementById('shop-order-name').value.trim();
    const email = document.getElementById('shop-order-email').value.trim();
    const address = document.getElementById('shop-order-address').value.trim();
    const stock = Number(p.stock || 0);
    let qty = Math.max(1, Number(document.getElementById('shop-order-qty').value) || 1);
    if (qty > stock) qty = stock;

    if (!name){ alert('Enter your name.'); return; }
    if (!email){ alert('Enter your email.'); return; }
    if (!address){ alert('Enter a shipping address.'); return; }
    if (stock <= 0){ alert('Sorry — this just sold out.'); closeOrderPanel(); renderCatalog(); return; }

    const order = {
      id: window.BNB_UUID(),
      productId: p.id,
      productName: p.name,
      productType: p.type,
      buyerName: name,
      buyerEmail: email,
      shippingAddress: address,
      qty: qty,
      unitPrice: p.price,
      total: p.price * qty,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    orders.push(order);
    saveOrders();
    closeOrderPanel();

    const checkoutUrl = p.checkoutUrl;
    if (checkoutUrl && checkoutUrl.trim()){
      window.open(checkoutUrl.trim(), '_blank', 'noopener');
    }
    shopToast('Order placed — redirecting to checkout. We\'ll mark it paid once payment lands.');
  });

  /* ---------------- PACKAGE CHECKOUT (session credits) ---------------- */
  let pkgPanelProduct = null;

  function openPackagePanel(p){
    pkgPanelProduct = p;
    document.getElementById('shop-pkg-summary').textContent = p.name + ' — ' + money(p.price) + ' (' + p.credits + ' credits)';
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

  function renderAdminTable(){
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
        '<td><div class="row-actions">' +
          '<button data-edit="' + p.id + '">Edit</button>' +
          '<button data-del="' + p.id + '">Delete</button>' +
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
    saveProducts();
    closeProductPanel();
    renderAdminTable();
    renderCatalog();
  }

  function deleteProduct(id){
    const p = products.find(function(x){ return x.id===id; });
    if (!p) return;
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
        '<td>' + esc(o.productName) + '</td>' +
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
  function markOrderPaid(id){
    const o = orders.find(function(x){ return x.id===id; });
    if (!o) return;
    const p = products.find(function(x){ return x.id===o.productId; });
    if (p){ p.stock = Math.max(0, Number(p.stock||0) - o.qty); saveProducts(); }
    o.status = 'paid';
    saveOrders();
    renderOrdersTable();
    renderAdminTable();
    renderCatalog();
    shopToast('Marked paid — stock updated.');
  }

  function markOrderFulfilled(id){
    const o = orders.find(function(x){ return x.id===id; });
    if (!o) return;
    o.status = 'fulfilled';
    saveOrders();
    renderOrdersTable();
    shopToast('Marked fulfilled.');
  }

  function cancelOrder(id){
    const o = orders.find(function(x){ return x.id===id; });
    if (!o) return;
    if (!confirm('Cancel this order for ' + o.buyerName + '? Stock was never reserved, so nothing needs restoring.')) return;
    orders = orders.filter(function(x){ return x.id !== id; });
    saveOrders();
    renderOrdersTable();
  }

  const adminSubtabs = document.getElementById('shop-admin-subtabs');
  adminSubtabs.querySelectorAll('button').forEach(function(btn){
    btn.addEventListener('click', function(){
      adminSubtabs.querySelectorAll('button').forEach(function(b){ b.classList.toggle('active', b===btn); });
      const isProducts = btn.dataset.adminTab === 'products';
      document.getElementById('shop-admin-products-panel').style.display = isProducts ? '' : 'none';
      document.getElementById('shop-admin-orders-panel').style.display = isProducts ? 'none' : '';
      if (!isProducts) renderOrdersTable();
    });
  });

  /* ---------------- INIT ---------------- */
  renderTypeTabs();
  renderCatalog();

})();
