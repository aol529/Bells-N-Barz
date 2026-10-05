(function(){
  /* ============================================================
     MEAL PLAN DATA (Supabase) — the same interface as the Meal Plan
     Sandbox's localStorage store (MP_STORE), so the screens could be
     brought over from the sandbox nearly unchanged:
       * load…() fetch into a small cache before a screen renders,
       * get…() read that cache synchronously while it renders,
       * save/start/stop…() write straight to Supabase (and the cache).
     Who can read or write what is enforced by RLS (sql/45, sql/46), not
     here. Notifications are sent by database triggers.
     ============================================================ */
  const cache = { intake: {}, plans: {}, checkins: {}, goals: {}, trials: {}, shopping: {}, dietEdits: {}, visibleIntakes: [] };

  let shoppingTimer = null;
  let pendingShopping = null; // { memberId, row } waiting to be written
  function me(){ return window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf(); }
  function fail(error, fallback){
    console.error('Supabase meal plan error:', error);
    const msg = error && error.message || '';
    throw new Error(/row-level security|permission/i.test(msg) ? 'You don’t have permission to do that.' : (fallback || 'Could not save — check your connection and try again.'));
  }

  async function loadMember(memberId){
    const [intake, plan, checkins, goals, trial, shopping] = await Promise.all([
      bnbClient.from('meal_plan_intake').select('*').eq('member_id', memberId).maybeSingle(),
      bnbClient.from('meal_plans').select('*').eq('member_id', memberId).maybeSingle(),
      bnbClient.from('meal_plan_checkins').select('*').eq('member_id', memberId).order('created_at', { ascending: false }),
      bnbClient.from('nutrition_goals').select('*').eq('user_id', memberId).maybeSingle(),
      bnbClient.from('diet_trials').select('*').eq('member_id', memberId).maybeSingle(),
      bnbClient.from('meal_plan_shopping').select('*').eq('member_id', memberId).maybeSingle()
    ]);
    const err = intake.error || plan.error || checkins.error;
    if (err){ console.error('Supabase load meal plan data failed:', err); return false; }
    cache.intake[memberId] = intake.data || null;
    cache.plans[memberId] = plan.data || null;
    cache.checkins[memberId] = checkins.data || [];
    cache.goals[memberId] = (goals && goals.data) || null;
    cache.trials[memberId] = (trial && !trial.error && trial.data) || null;
    // A list with an unsaved change wins over the database copy, so a
    // re-render right after ticking/adding never loses the change.
    cache.shopping[memberId] = (pendingShopping && pendingShopping.memberId === memberId) ? pendingShopping.row
      : ((shopping && !shopping.error && shopping.data) || null);
    return true;
  }

  // Coach view: every questionnaire this coach may see (RLS limits it to
  // their own clients, or everyone for an admin), with plans and check-ins.
  async function loadCoachList(){
    const [intakes, plans, checkins] = await Promise.all([
      bnbClient.from('meal_plan_intake').select('member_id, answers, submitted_at, updated_at').order('updated_at', { ascending: false }),
      bnbClient.from('meal_plans').select('member_id, updated_at'),
      bnbClient.from('meal_plan_checkins').select('member_id, created_at').order('created_at', { ascending: false })
    ]);
    if (intakes.error){ console.error('Supabase load meal_plan_intake failed:', intakes.error); return false; }
    cache.visibleIntakes = intakes.data || [];
    cache.coachPlans = plans.data || [];
    cache.coachCheckins = checkins.data || [];
    return true;
  }

  async function loadDiets(){
    const { data, error } = await bnbClient.from('diet_edits').select('*');
    if (error){ console.warn('Supabase load diet_edits failed:', error); return; }
    cache.dietEdits = {};
    (data || []).forEach(r=>{ cache.dietEdits[r.diet_id] = Object.assign({}, r.edits, { updated_at: r.updated_at }); });
  }

  window.MP_STORE = {
    me,
    user(id){ const n = window.BNB_USERS && window.BNB_USERS.getName(id); return n ? { id, fullName: n } : null; },
    loadMember, loadCoachList, loadDiets,

    getIntake(id){ return cache.intake[id] || null; },
    getPlan(id){ return cache.plans[id] || null; },
    getCheckins(id){ return cache.checkins[id] || []; },
    getGoals(id){ return cache.goals[id] || null; },
    getTrial(id){ return cache.trials[id] || null; },
    getDietEdits(dietId){ return cache.dietEdits[dietId] || null; },
    getShopping(id){ return cache.shopping[id] || null; },
    visibleIntakes(){ return cache.visibleIntakes.slice(); },
    coachPlans(){ return (cache.coachPlans || []).slice(); },
    coachCheckins(){ return (cache.coachCheckins || []).slice(); },

    async saveIntake(answers){
      const m = me(); if (!m) throw new Error('Please sign in.');
      const { error } = await bnbClient.from('meal_plan_intake').upsert({ member_id: m.id, answers });
      if (error) fail(error);
    },
    async addCheckin(row){
      const m = me(); if (!m) throw new Error('Please sign in.');
      const { error } = await bnbClient.from('meal_plan_checkins').insert(Object.assign({ member_id: m.id }, row));
      if (error) fail(error, 'Could not send — check your connection and try again.');
    },
    async savePlan(memberId, content){
      const m = me(); if (!m) throw new Error('Please sign in.');
      const { error } = await bnbClient.from('meal_plans').upsert({ member_id: memberId, coach_id: m.id, content });
      if (error) fail(error, /row-level security/i.test(error.message || '') ? 'Only this member’s coach or an admin can write their plan.' : null);
    },

    // Shopping list (sql/47): the member's own. Updates the cache at once
    // so ticking feels instant; the write to Supabase is debounced so a
    // burst of ticks sends one save.
    saveShopping(list){
      const m = me(); if (!m) throw new Error('Please sign in.');
      const row = JSON.parse(JSON.stringify(Object.assign({}, list, { member_id: m.id })));
      cache.shopping[m.id] = row;
      pendingShopping = { memberId: m.id, row };
      clearTimeout(shoppingTimer);
      return new Promise((resolve, reject)=>{
        shoppingTimer = setTimeout(async ()=>{
          const toSave = pendingShopping.row;
          const { error } = await bnbClient.from('meal_plan_shopping').upsert({
            member_id: m.id, items: toSave.items, budget_kes: toSave.budget_kes, week_start: toSave.week_start });
          if (pendingShopping && pendingShopping.row === toSave) pendingShopping = null; // nothing newer queued
          if (error){ try { fail(error); } catch(e){ reject(e); return; } }
          resolve();
        }, 600);
      });
    },

    async startTrial(diet, variant){
      const m = me(); if (!m) throw new Error('Please sign in.');
      const prev = cache.trials[m.id];
      const row = { member_id: m.id, diet_id: diet.id, diet_name: diet.name,
        variant: variant ? variant.id : null, variant_label: variant ? variant.label : null };
      if (!(prev && prev.diet_id === diet.id)) row.started_at = new Date().toISOString();
      const { data, error } = await bnbClient.from('diet_trials').upsert(row).select().single();
      if (error) fail(error);
      cache.trials[m.id] = data;
    },
    async stopTrial(){
      const m = me(); if (!m) return;
      const { error } = await bnbClient.from('diet_trials').delete().eq('member_id', m.id);
      if (error) fail(error);
      cache.trials[m.id] = null;
    },

    async saveDietEdits(diet, edits){
      const m = me();
      if (!m || m.id !== diet.ownerId) throw new Error('Only ' + diet.author + ' can edit this diet.');
      const row = { diet_id: diet.id, owner_id: m.id, published: edits.published !== false, edits, updated_at: new Date().toISOString() };
      const { error } = await bnbClient.from('diet_edits').upsert(row);
      if (error) fail(error);
      cache.dietEdits[diet.id] = Object.assign({}, edits, { updated_at: row.updated_at });
    },
    async clearDietEdits(diet){
      const m = me();
      if (!m || m.id !== diet.ownerId) throw new Error('Only ' + diet.author + ' can edit this diet.');
      const { error } = await bnbClient.from('diet_edits').delete().eq('diet_id', diet.id);
      if (error) fail(error);
      delete cache.dietEdits[diet.id];
    }
  };
})();
