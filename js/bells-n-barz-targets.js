(function(){
  /* ============================================================
     DAILY CALORIE & MACRO TARGETS — one formula for the whole app.
     Used by the Food Log calculator (Me > Food Log), the Meal Plan's
     suggested targets for the coach and "How it works", and Coach KA's
     diet (its maintenance estimate), so one person never gets three
     different answers.

     Mifflin-St Jeor x activity factor = maintenance, then:
       lose      -500 kcal, never below 1500 (men) / 1200 (women), and
                 no deficit at all below a BMI of 20;
       maintain  maintenance;
       gain      +250 kcal (a modest surplus).
     Protein 1.6 g/kg (1.8 g/kg when gaining), fat 30% of calories,
     carbs the rest. Calories rounded to the nearest 50.
     ============================================================ */
  const FLOOR = { male: 1500, female: 1200 };
  const r50 = x => Math.round(x / 50) * 50;

  function bmr(sex, weightKg, heightCm, age){
    return 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'male' ? 5 : -161);
  }

  // p: { sex: 'male'|'female', age, heightCm, weightKg, factor, goal: 'lose'|'maintain'|'gain' }
  function calc(p){
    const maintenance = bmr(p.sex, p.weightKg, p.heightCm, p.age) * p.factor;
    const bmi = p.weightKg / Math.pow(p.heightCm / 100, 2);
    let calories = maintenance, note = null;
    if (p.goal === 'lose'){
      if (bmi < 20){ note = 'Your weight is already in a healthy range (BMI about ' + bmi.toFixed(1) + '), so this is a maintenance target, not a deficit.'; }
      else {
        calories = maintenance - 500;
        const floor = FLOOR[p.sex] || 1200;
        if (calories < floor){ calories = floor; note = 'Held at the safe minimum of ' + floor + ' kcal — ask your coach before going lower.'; }
      }
    } else if (p.goal === 'gain'){
      calories = maintenance + 250;
    }
    calories = r50(calories);
    const protein = Math.round(p.weightKg * (p.goal === 'gain' ? 1.8 : 1.6));
    const fat = Math.round(calories * 0.30 / 9);
    const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
    return { calories, protein_g: protein, carbs_g: carbs, fat_g: fat, maintenance: r50(maintenance), note };
  }

  // Workouts a week from the questionnaire's exercise answer: "Monday
  // Tuesday and Wednesday", "gym 4x a week", "twice a week", "Mon-Fri",
  // "weekdays", "every day"; "twice a month" is under one. Same parser
  // as the Meal Plan Sandbox's plan program.
  const WORD_NUM = { once: 1, twice: 2, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7 };
  const DAY_NAME = /^(mon(day)?|tue(s(day)?)?|wed(nesday)?|thu(r(s(day)?)?)?|fri(day)?|sat(urday)?|sun(day)?)s?$/;
  function exerciseDays(ex){
    ex = String(ex || '').trim().toLowerCase();
    if (!ex || /^\s*(none|no|nothing|n\/a|not sure)\b/.test(ex)) return 0;
    if (/every ?day|daily/.test(ex)) return 7;
    const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const range = ex.match(/\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*\s*(?:-|–|to|through|till)\s*(mon|tue|wed|thu|fri|sat|sun)[a-z]*/);
    if (range) return (DAYS.indexOf(range[2]) - DAYS.indexOf(range[1]) + 7) % 7 + 1;
    const named = new Set((ex.match(/\b[a-z]+\b/g) || []).filter(w => DAY_NAME.test(w)).map(w => w.slice(0, 3)));
    if (/weekends?/.test(ex)) named.add('sat').add('sun');
    if (named.size) return named.size;
    const m = ex.match(/\b(\d+|one|two|three|four|five|six|seven)\s*(x|×|times?|days?|sessions?)|\b(once|twice)\b/);
    const n = m ? WORD_NUM[m[3] || m[1]] || Number(m[1]) : 0;
    if (n && /month/.test(ex)) return Math.round(n / 4.3);
    return Math.min(7, n || (/weekdays/.test(ex) ? 5 : 2));
  }

  // Activity from Meal Plan questionnaire answers: workouts per week,
  // bumped up for a physical job.
  function activityFromAnswers(a){
    const perWeek = exerciseDays(a && a.exercise);
    let factor = perWeek >= 6 ? 1.725 : perWeek >= 3 ? 1.55 : perWeek >= 1 ? 1.375 : 1.2;
    if (a && a.job_activity === 'Physically demanding') factor = Math.min(1.9, factor + 0.175);
    else if (a && a.job_activity === 'On my feet some of the day') factor = Math.max(factor, 1.375);
    const label = factor >= 1.725 ? 'Very active' : factor >= 1.55 ? 'Active' : factor >= 1.375 ? 'Lightly active' : 'Sedentary';
    return { factor, perWeek, label };
  }

  // The questionnaire's goal ticks -> lose / maintain / gain.
  function goalFromAnswers(a){
    const goals = (a && a.goals) || [];
    return goals.includes('Lose fat') ? 'lose' : goals.includes('Build muscle') ? 'gain' : 'maintain';
  }

  // Targets straight from questionnaire answers, or null if age, sex,
  // height or weight is missing.
  function fromAnswers(a){
    const age = Number(a && a.age), h = Number(a && a.height_cm), w = Number(a && a.weight_kg);
    if (!age || !h || !w || !a.sex) return null;
    const act = activityFromAnswers(a);
    return Object.assign(calc({ sex: a.sex === 'Male' ? 'male' : 'female', age, heightCm: h, weightKg: w, factor: act.factor, goal: goalFromAnswers(a) }),
      { activity: act, goal: goalFromAnswers(a) });
  }

  window.BNB_TARGETS = { bmr, calc, exerciseDays, activityFromAnswers, goalFromAnswers, fromAnswers };
})();
