/* =========================================================================
   SHOP EDITOR — staff portal (Admin > Shop): products, orders and delivery
   areas. Loaded on demand after js/bells-n-barz-shop.js, whose shared
   pieces come from BNB_SHOP_INT.
   ========================================================================= */
(function(){
  const I = window.BNB_SHOP_INT;
  if (!I) return;
  const { productToRow, saveProductFile, productsSync, saveProducts, TYPE_LABELS, money, moneyText, esc, shopToast, scrollBelowHeaders, renderCatalog, setOrderStatus, refreshZones, renderMyOrders, fulfilmentText, ORDER_STATUS_LABELS } = I;

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
    if (!I.products.length){
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px 0; color:var(--muted);">No products yet — add your first one above.</td></tr>';
      return;
    }
    tbody.innerHTML = I.products.map(function(p){
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
    const p = id ? I.products.find(function(x){ return x.id===id; }) : null;
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
      const idx = I.products.findIndex(function(x){ return x.id===editingProductId; });
      if (idx !== -1) I.products[idx] = Object.assign({ id: editingProductId }, data);
    } else {
      I.products.push(Object.assign({ id: window.BNB_UUID() }, data));
    }
    const saved = editingProductId ? I.products.find(function(x){ return x.id===editingProductId; }) : I.products[I.products.length - 1];
    Promise.resolve(saveProducts()).then(function(){ if (type === 'digital') saveProductFile(saved.id, data.fileUrl); });
    closeProductPanel();
    renderAdminTable();
    renderCatalog();
  }

  function deleteProduct(id){
    const p = I.products.find(function(x){ return x.id===id; });
    if (!p || !isAdmin()) return;
    if (!confirm('Delete "' + p.name + '"? This cannot be undone.')) return;
    I.products = I.products.filter(function(x){ return x.id !== id; });
    saveProducts();
    renderAdminTable();
    renderCatalog();
  }

  document.getElementById('shop-new-product-btn').addEventListener('click', function(){ openProductPanel(null); });
  document.getElementById('shop-f-cancel').addEventListener('click', closeProductPanel);
  document.getElementById('shop-f-save').addEventListener('click', saveProduct);
  document.getElementById('shop-panel-backdrop').addEventListener('click', function(e){ if (e.target.id==='shop-panel-backdrop') closeProductPanel(); });


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
    if (!I.orders.length){
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px 0; color:var(--muted);">No orders yet.</td></tr>';
      return;
    }
    const sorted = I.orders.slice().sort(function(a,b){ return new Date(b.createdAt) - new Date(a.createdAt); });
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
    productsSync.reset(I.products.filter(x => x.id && x.id.length === 36).map(productToRow));
  }
  async function markOrderPaid(id){
    const o = I.orders.find(function(x){ return x.id===id; });
    if (!o) return;
    const p = I.products.find(function(x){ return x.id===o.productId; });
    if (p && p.type !== 'package' && p.type !== 'digital') await takeStock(p, o.qty);
    if (!await setOrderStatus(o, 'paid')) return;
    renderOrdersTable();
    renderMyOrders();
    renderAdminTable();
    renderCatalog();
    shopToast('Marked paid — stock updated.');
  }

  async function markOrderFulfilled(id){
    const o = I.orders.find(function(x){ return x.id===id; });
    if (!o) return;
    if (!await setOrderStatus(o, 'fulfilled')) return;
    renderOrdersTable();
    shopToast('Marked fulfilled.');
  }

  async function cancelOrder(id){
    const o = I.orders.find(function(x){ return x.id===id; });
    if (!o) return;
    if (!confirm('Cancel this order for ' + o.buyerName + '? Stock was never reserved, so nothing needs restoring.')) return;
    const { error } = await bnbClient.from('orders').delete().eq('id', id);
    if (error){ shopToast(error.message || 'Could not cancel that order.'); return; }
    I.orders = I.orders.filter(function(x){ return x.id !== id; });
    renderOrdersTable();
    renderMyOrders();
  }

  // Counts on the Admin Products / Orders cards.
  function updateAdminCounts(){
    const p = document.getElementById('shop-admin-products-count');
    const o = document.getElementById('shop-admin-orders-count');
    if (p) p.textContent = I.products.length + ' product' + (I.products.length===1?'':'s');
    if (o) o.textContent = I.orders.length + ' order' + (I.orders.length===1?'':'s');
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
    tbody.innerHTML = !I.zones.length ? '<tr><td colspan="4" style="text-align:center; padding:30px 0; color:var(--muted);">No delivery areas yet. Until you add one, buyers can only pick up at the gym.</td></tr>' :
      I.zones.map(function(z){
        return '<tr><td>' + esc(z.name) + '</td><td class="mono">' + money(z.fee) + '</td><td>' + statusPillHtml(z.active) + '</td><td><div class="row-actions">' + (admin ?
          '<button data-zone-edit="' + z.id + '">Edit</button><button data-zone-toggle="' + z.id + '">' + (z.active ? 'Hide' : 'Show') + '</button><button data-zone-del="' + z.id + '">Delete</button>' : '') +
          '</div></td></tr>';
      }).join('');
    tbody.querySelectorAll('[data-zone-edit]').forEach(function(b){ b.addEventListener('click', function(){
      const z = I.zones.find(function(x){ return x.id === b.dataset.zoneEdit; });
      editingZoneId = z.id;
      document.getElementById('shop-zone-name').value = z.name;
      document.getElementById('shop-zone-fee').value = z.fee;
      syncZoneKes();
      document.getElementById('shop-zone-save').textContent = 'Save changes';
    }); });
    tbody.querySelectorAll('[data-zone-toggle]').forEach(function(b){ b.addEventListener('click', async function(){
      const z = I.zones.find(function(x){ return x.id === b.dataset.zoneToggle; });
      const { error } = await bnbClient.from('delivery_zones').update({ active: !z.active }).eq('id', z.id);
      if (error){ shopToast(error.message); return; }
      refreshZones();
    }); });
    tbody.querySelectorAll('[data-zone-del]').forEach(function(b){ b.addEventListener('click', async function(){
      const z = I.zones.find(function(x){ return x.id === b.dataset.zoneDel; });
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


  window.bnbShopAdmin = {
    render(){ renderAdminTable(); renderOrdersTable(); renderZonesTable(); },
    renderZones: renderZonesTable,
    openProductPanel: openProductPanel
  };
  window.bnbShopAdmin.render();
})();
