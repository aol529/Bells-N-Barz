(function(){
  window.BNB_MIGRATE = window.BNB_MIGRATE || {};

  window.BNB_MIGRATE.runAll = async function(){
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    const staff = ['admin','trainer','staff'];
    if (!me || !(me.roles || []).some(r => staff.includes(r))){
      alert('Log in as a coach/staff account first, then run this again.');
      return;
    }
    if (!confirm('This pushes all built-in demo/seed data into Supabase as real rows. Safe to re-run (it skips anything already migrated by matching on email/name/slug). Continue?')) return;

    console.log('=== Seed data migration starting ===');
    const results = {};

    results.users = await window.BNB_MIGRATE.users();
    console.log('Users migrated:', Object.keys(results.users).length);

    results.checkins = await window.BNB_MIGRATE.checkins(results.users);
    console.log('Checkins migrated:', results.checkins);

    results.assessments = await window.BNB_MIGRATE.assessments(results.users);
    console.log('Assessments migrated:', results.assessments);

    results.invoices = await window.BNB_MIGRATE.invoices(results.users);
    console.log('Invoices migrated:', Object.keys(results.invoices).length);

    results.payments = await window.BNB_MIGRATE.payments(results.users, results.invoices);
    console.log('Payments migrated:', results.payments);

    results.products = await window.BNB_MIGRATE.products();
    console.log('Products migrated:', results.products);

    results.scheduling = await window.BNB_MIGRATE.scheduling(results.users);
    console.log('Scheduling migrated:', results.scheduling);

    results.gallery = await window.BNB_MIGRATE.gallery();
    console.log('Gallery images migrated:', Object.keys(results.gallery).length);

    results.megatron = await window.BNB_MIGRATE.megatron(results.gallery);
    console.log('Megatron slides migrated:', results.megatron);

    results.posts = await window.BNB_MIGRATE.posts();
    console.log('Blog posts migrated:', results.posts);

    console.log('=== Seed data migration complete ===', results);
    alert(
      'Migration complete!\n\n' +
      'Users: ' + Object.keys(results.users).length + '/' + 5 + '\n' +
      'Checkins: ' + results.checkins + '\n' +
      'Assessments: ' + results.assessments + '\n' +
      'Invoices: ' + Object.keys(results.invoices).length + '\n' +
      'Payments: ' + results.payments + '\n' +
      'Products: ' + results.products + '\n' +
      'Classes/Sessions/Bookings/Slots/PT: ' + JSON.stringify(results.scheduling) + '\n' +
      'Gallery images: ' + Object.keys(results.gallery).length + '\n' +
      'Megatron slides: ' + results.megatron + '\n' +
      'Blog posts: ' + results.posts + '\n\n' +
      'Full details logged to the browser console.'
    );

    // Refresh every module's in-memory view of the world so the freshly
    // migrated rows show up immediately without a manual page reload.
    location.reload();
  };

  // UI trigger (ADMIN > Users) — runAll() already handles its own role
  // check, confirm() gate, and result alert; this just adds a loading
  // state around the async call and resets the button if the person
  // cancels or isn't staff (both of which resolve without a page reload).
  const migrateBtn = document.getElementById('run-migration-btn');
  if (migrateBtn){
    migrateBtn.addEventListener('click', async () => {
      const original = migrateBtn.textContent;
      migrateBtn.disabled = true;
      migrateBtn.textContent = 'Migrating…';
      try {
        await window.BNB_MIGRATE.runAll();
      } finally {
        migrateBtn.disabled = false;
        migrateBtn.textContent = original;
      }
    });
  }
})();
