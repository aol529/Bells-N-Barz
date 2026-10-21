
/* =========================================================================
   BELL(E)S N' BARZ — PROGRAM DATA / ADMIN CRUD / LOGSHEET / PDF+ODT EXPORT
   ========================================================================= */
(function(){

  const DEFAULT_PROGRAM = {"mon": [{"name": "Block A", "exercises": [{"name": "Incline Barbell Bench Press", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "4", "reps": "8\u201310"}, {"name": "Chest Supported Dumbbell Row", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "4", "reps": "8\u201310"}]}, {"name": "Block B", "exercises": [{"name": "Decline Dumbbell Bench Press", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "10"}, {"name": "T-Bar Row", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "10"}]}, {"name": "Block C", "exercises": [{"name": "Flat Dumbbell Bench Press", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "10"}, {"name": "Barbell Row", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "8\u201310"}]}, {"name": "Block D", "exercises": [{"name": "Cable Flyes", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "12\u201315"}, {"name": "Single-Arm Dumbbell Row", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "10 /side"}]}], "tue": [{"name": "Block A", "exercises": [{"name": "Heel Elevated Goblet Squats (later Zercher Squats)", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "4", "reps": "8\u201310"}, {"name": "Sumo Squats", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "10\u201312"}]}, {"name": "Block B", "exercises": [{"name": "Landmine Static Split Squats (or Walking Lunges)", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "10 /leg"}, {"name": "Leg Extensions", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "15"}]}, {"name": "Block C", "exercises": [{"name": "Pendulum Leg Press", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "12\u201315"}, {"name": "Cossack Squats", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "10 /leg"}]}, {"name": "Block DNew \u2014 v2.8", "exercises": [{"name": "Seated Dumbbell Hip Adduction", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "15"}, {"name": "Standing Cable Hip Flexion", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "12\u201315"}]}, {"name": "Block E", "exercises": [{"name": "Copenhagen Plank", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "20\u201330 sec /side"}, {"name": "Lying Leg Curls", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "2", "reps": "12\u201315"}]}, {"name": "Block F \u2014 Accessory", "exercises": [{"name": "Standing Calf Raises", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "15\u201320"}]}], "wed": [], "thu": [{"name": "Block A", "exercises": [{"name": "Military Press (alt: Arnold Press)", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "4", "reps": "6\u20138"}, {"name": "Curls \u2014 E-Z Bar Standing / Incline Bench (alternate variations)", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "10\u201312"}]}, {"name": "Block B", "exercises": [{"name": "Shrugs", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "12\u201315"}]}, {"name": "Block C", "exercises": [{"name": "Lateral Flyes", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "12\u201315"}, {"name": "Front Raises (alt: High Rows)", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "12\u201315"}]}, {"name": "Block D", "exercises": [{"name": "Weighted Pull-ups (alt: Weighted Chin-ups)", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "4", "reps": "6\u20138"}, {"name": "Lateral Raises", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "15"}]}, {"name": "Block E", "exercises": [{"name": "Wide Cable Lat Pulldowns", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "10\u201312"}, {"name": "Rear Delt Flyes", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "15"}]}, {"name": "Block F", "exercises": [{"name": "Pullovers (alt: Straight-arm Pulldowns)", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "12\u201315"}, {"name": "Face Pulls", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "15"}]}], "fri": [{"name": "Block A", "exercises": [{"name": "Romanian Deadlifts", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "4", "reps": "8\u201310"}, {"name": "Reverse Lunges (alt: Bulgarian Split Squats)", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "10 /leg"}]}, {"name": "Block B", "exercises": [{"name": "Hip Thrusts (alt: Stiff Leg Deadlifts)", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "4", "reps": "10"}, {"name": "Leg Curls \u2014 Lying / Standing / Seated (alternate variations)", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "12\u201315"}]}, {"name": "Block C", "exercises": [{"name": "Step Ups", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "10 /leg"}, {"name": "Hip Abductions", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "15"}]}, {"name": "Block D", "exercises": [{"name": "Nordic Curls", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "4", "reps": "3\u20135"}, {"name": "Seated Calf Raises", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "15\u201320"}]}, {"name": "Block E", "exercises": [{"name": "Back Extensions", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "12\u201315"}]}], "sat": [{"name": "Block A", "exercises": [{"name": "Push-ups", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "15\u201320"}, {"name": "Dips (alt: Bench Dips)", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "10\u201312"}]}, {"name": "Block B", "exercises": [{"name": "Overhead Tricep Extensions", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "12"}, {"name": "Spider Curls (alt: Preacher Curls)", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "10\u201312"}]}, {"name": "Block C", "exercises": [{"name": "Cable Tricep Kickbacks", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "15"}, {"name": "Incline Bench Curls", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "10\u201312"}]}], "sun": [{"name": "Movement Practice", "exercises": [{"name": "Deep Squat Hold", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "", "reps": "90 sec"}, {"name": "Dead Hang", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "", "reps": "60\u201390 sec"}]}, {"name": "Core Finisher (New \u2014 v1.6.1)", "exercises": [{"name": "Cable Crunches", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "2", "reps": "10\u201312"}, {"name": "Back Extensions", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "2", "reps": "10\u201312"}, {"name": "Cable Side Bends", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "2", "reps": "10\u201312 /side"}]}, {"name": "Breath Work", "exercises": [{"name": "Box Breathing", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "", "reps": "\u2014"}]}]};
  const DAY_META = {"mon": {"title": "Monday \u2014 Rows & Bench Presses", "duration": "~80 min", "hold": "Dead Hang"}, "tue": {"title": "Tuesday \u2014 Quads, Adductors & Hip Flexors", "duration": "~80 min", "hold": "Horse Stance"}, "wed": {"title": "Wednesday \u2014 Rest", "duration": "Rest Day", "hold": "\u2014"}, "thu": {"title": "Thursday \u2014 Vertical Push & Pull", "duration": "~65 min", "hold": "Scapular Hang"}, "fri": {"title": "Friday \u2014 Glutes, Hamstrings & Low Back", "duration": "~60 min", "hold": "Single-Leg Glute Bridge Hold"}, "sat": {"title": "Saturday \u2014 Chest & Arms", "duration": "~50 min", "hold": "Push-up Plank Hold"}, "sun": {"title": "Sunday \u2014 Recovery", "duration": "~35 min", "hold": "Box Breathing"}};
  const DAY_ORDER = ["mon","tue","wed","thu","fri","sat","sun"];
  const PROGRAM_KEY = "bnb-perform-program-v1";

  function clone(o){ return JSON.parse(JSON.stringify(o)); }

  /* ---------------- PRESET PROGRAMS (Program Builder) ----------------
     Read-only starter templates a coach can load onto a client's own
     program (same effect as Import Program JSON, just from a built-in
     library instead of a file) — see the "Load Preset for Selected
     Client" wiring further down. Each day-key array below is cloned
     per weekday rather than shared by reference, so editing one day
     afterward in the builder can never silently mutate another. */
  const OLD_SCHOOL_70S_DAYS = (function(){
    const chestBack = [
      {name:'Chest', exercises:[
        {name:'Flat Barbell Bench Press', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'5', reps:'1–12, pyramiding up in weight each set'},
        {name:'Incline Barbell Bench Press', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'5', reps:'5–12'},
        {name:'Flat Bench Dumbbell Flyes', rest:'1 min', tempo:'', equipment:'Dumbbell', alternates:'', sets:'5', reps:'8–12'}
      ]},
      {name:'Back', exercises:[
        {name:'Chinups', rest:'1 min', tempo:'', equipment:'Bodyweight', alternates:'', sets:'', reps:'50 total reps, however many sets that takes'},
        {name:'Bent Rows', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'5', reps:'8–12'},
        {name:'T-Bar Rows', rest:'1 min', tempo:'', equipment:'T-Bar', alternates:'', sets:'5', reps:'8–12'}
      ]}
    ];
    const shouldersArms = [
      {name:'Shoulders', exercises:[
        {name:'Behind the Neck Barbell Press', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'Standing Military Press (shoulder-friendlier)', sets:'5', reps:'5–12, pyramiding up in weight each set'},
        {name:'Arnold Press', rest:'1 min', tempo:'', equipment:'Dumbbell', alternates:'Scott Press', sets:'5', reps:'8–12'},
        {name:'Lateral Dumbbell Raises', rest:'1 min', tempo:'', equipment:'Dumbbell', alternates:'', sets:'5', reps:'8–12'}
      ]},
      {name:'Biceps', exercises:[
        {name:'Barbell Curls', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'5', reps:'8–12'},
        {name:'Incline Dumbbell Curls', rest:'1 min', tempo:'', equipment:'Dumbbell', alternates:'', sets:'5', reps:'8–12'},
        {name:'Concentration Curls', rest:'1 min', tempo:'', equipment:'Dumbbell', alternates:'', sets:'5', reps:'8–12'}
      ]},
      {name:'Triceps', exercises:[
        {name:'Close Grip Bench Press', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'5', reps:'8–12'},
        {name:'Standing French Press', rest:'1 min', tempo:'', equipment:'Barbell/EZ-Bar', alternates:'', sets:'5', reps:'8–12'},
        {name:'Cable/Rope Pushdowns', rest:'1 min', tempo:'', equipment:'Cable', alternates:'', sets:'5', reps:'8–12'}
      ]}
    ];
    const legs = [
      {name:'Legs', exercises:[
        {name:'Squats', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'5', reps:'5–20, starting empty-bar and pyramiding up'},
        {name:'Hack Squats', rest:'1 min', tempo:'', equipment:'Machine', alternates:'', sets:'5', reps:'8–20'},
        {name:'Lying Leg Curls', rest:'1 min', tempo:'', equipment:'Machine', alternates:'', sets:'5', reps:'8–20'},
        {name:'Leg Extensions', rest:'1 min', tempo:'', equipment:'Machine', alternates:'', sets:'5', reps:'8–20'}
      ]}
    ];
    return {
      mon: clone(chestBack), tue: clone(shouldersArms), wed: clone(legs),
      thu: clone(chestBack), fri: clone(shouldersArms), sat: clone(legs),
      sun: []
    };
  })();
  const OLD_SCHOOL_IRON_GRIT_DAYS = (function(){
    const chestBack = [
      {name:'Chest', exercises:[
        {name:'Barbell Bench Press', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'5', reps:'5–12'},
        {name:'Incline Dumbbell Press', rest:'1 min', tempo:'', equipment:'Dumbbell', alternates:'', sets:'5', reps:'5–12'},
        {name:'Dumbbell Pullovers', rest:'1 min', tempo:'', equipment:'Dumbbell', alternates:'', sets:'3', reps:'8–12'},
        {name:'Cable Cross Over', rest:'1 min', tempo:'', equipment:'Cable', alternates:'Dumbbell Flyes', sets:'5', reps:'10–20'}
      ]},
      {name:'Back', exercises:[
        {name:'Chin Ups', rest:'1 min', tempo:'', equipment:'Bodyweight', alternates:'', sets:'', reps:'50 total reps, using as few sets as possible'},
        {name:'Bent Over Barbell Rows', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'5', reps:'5–12'},
        {name:'Deadlifts', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'4', reps:'10, 6, 4, 2 — each set to failure'}
      ]},
      {name:'Abs', exercises:[
        {name:'Leg Raises', rest:'1 min', tempo:'', equipment:'Bodyweight', alternates:'Incline Sit Ups', sets:'5', reps:'25'}
      ]}
    ];
    const legs = [
      {name:'Legs', exercises:[
        {name:'Back Squat', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'5', reps:'5–20'},
        {name:'Lunges', rest:'1 min', tempo:'', equipment:'Dumbbell/Barbell', alternates:'', sets:'5', reps:'8–12'},
        {name:'Leg Curl', rest:'1 min', tempo:'', equipment:'Machine', alternates:'', sets:'5', reps:'8–20'},
        {name:'Straight Leg Deadlifts', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'3', reps:'10, to failure'}
      ]},
      {name:'Calves', exercises:[
        {name:'Standing Calf Raises', rest:'1 min', tempo:'', equipment:'Machine', alternates:'', sets:'5', reps:'15'},
        {name:'Seated Calf Raises', rest:'1 min', tempo:'', equipment:'Machine', alternates:'Calf Raises on Leg Press', sets:'3', reps:'20'}
      ]},
      {name:'Abs', exercises:[
        {name:'Leg Raises', rest:'1 min', tempo:'', equipment:'Bodyweight', alternates:'', sets:'5', reps:'25'}
      ]}
    ];
    const shouldersArms = [
      {name:'Shoulders', exercises:[
        {name:'Standing Military Press', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'5', reps:'5–12'},
        {name:'Dumbbell Side Lateral Raises', rest:'1 min', tempo:'', equipment:'Dumbbell', alternates:'', sets:'5', reps:'8–12'},
        {name:'Heavy Upright Rows', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'3', reps:'10, 6, 4 — each set to failure'}
      ]},
      {name:'Arms', exercises:[
        {name:'Standing Barbell Curls', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'5', reps:'8–12'},
        {name:'Seated Dumbbell Curls', rest:'1 min', tempo:'', equipment:'Dumbbell', alternates:'', sets:'5', reps:'8–12'},
        {name:'Narrow-Grip Bench Press', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'5', reps:'8–12'},
        {name:'Standing Triceps Extensions', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'5', reps:'8–12'},
        {name:'Reverse EZ Bar Curl', rest:'1 min', tempo:'', equipment:'EZ-Bar', alternates:'', sets:'5', reps:'8–12'},
        {name:'Wrist Curls', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'5', reps:'8–12'},
        {name:'Reverse Wrist Curls', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'5', reps:'8–12'}
      ]},
      {name:'Abs', exercises:[
        {name:'Incline Sit-Ups', rest:'1 min', tempo:'', equipment:'Bodyweight', alternates:'', sets:'5', reps:'25'}
      ]}
    ];
    return {
      mon: clone(chestBack), tue: clone(legs), wed: clone(shouldersArms),
      thu: clone(chestBack), fri: clone(legs), sat: clone(shouldersArms),
      sun: []
    };
  })();
  const SERGE_NUBRET_DAYS = (function(){
    const quadsChest = [
      {name:'Quads', exercises:[
        {name:'Squats', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'8', reps:'12'},
        {name:'Leg Press', rest:'1 min', tempo:'', equipment:'Machine', alternates:'', sets:'6', reps:'12'},
        {name:'Leg Extension', rest:'1 min', tempo:'', equipment:'Machine', alternates:'', sets:'6', reps:'12'}
      ]},
      {name:'Chest', exercises:[
        {name:'Bench Press', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'8', reps:'12'},
        {name:'Flat Bench Flyes', rest:'1 min', tempo:'', equipment:'Dumbbell', alternates:'', sets:'6', reps:'12'},
        {name:'Incline Bench Press', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'6', reps:'12'},
        {name:'Incline Flyes', rest:'1 min', tempo:'', equipment:'Dumbbell', alternates:'', sets:'6', reps:'12'},
        {name:'Dumbbell Pullovers', rest:'1 min', tempo:'', equipment:'Dumbbell', alternates:'', sets:'6', reps:'12'}
      ]}
    ];
    const backHams = [
      {name:'Back', exercises:[
        {name:'Chin-ups', rest:'1 min', tempo:'', equipment:'Bodyweight', alternates:'', sets:'6', reps:'12'},
        {name:'Behind the Neck Lat Pulldowns', rest:'1 min', tempo:'', equipment:'Cable', alternates:'', sets:'8', reps:'12'},
        {name:'Lat Pulldowns to the Front', rest:'1 min', tempo:'', equipment:'Cable', alternates:'', sets:'6', reps:'12'},
        {name:'Barbell Bent-over Rows', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'6', reps:'12'}
      ]},
      {name:'Hamstrings', exercises:[
        {name:'Lying Leg Curl', rest:'1 min', tempo:'', equipment:'Machine', alternates:'', sets:'8', reps:'15'},
        {name:'Standing Leg Curl', rest:'1 min', tempo:'', equipment:'Machine', alternates:'', sets:'8', reps:'15'}
      ]}
    ];
    const shouldersArmsCalves = [
      {name:'Shoulders', exercises:[
        {name:'Behind the Neck Barbell Press', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'6', reps:'12'},
        {name:'Alternate Dumbbell Front Raise', rest:'1 min', tempo:'', equipment:'Dumbbell', alternates:'', sets:'6', reps:'12'},
        {name:'Barbell Upright Row', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'6', reps:'12'},
        {name:'Cable Lateral Raise', rest:'1 min', tempo:'', equipment:'Cable', alternates:'', sets:'6', reps:'12'}
      ]},
      {name:'Arms', exercises:[
        {name:'Barbell Curl superset with Triceps Pushdowns', rest:'1 min', tempo:'', equipment:'Barbell/Cable', alternates:'', sets:'8', reps:'12'},
        {name:'Dumbbell Curl superset with Triceps Dips', rest:'1 min', tempo:'', equipment:'Dumbbell/Bodyweight', alternates:'', sets:'8', reps:'12'}
      ]},
      {name:'Calves', exercises:[
        {name:'Standing Calf Raises', rest:'1 min', tempo:'', equipment:'Machine', alternates:'', sets:'8', reps:'12'},
        {name:'Seated Calf Raises', rest:'1 min', tempo:'', equipment:'Machine', alternates:'', sets:'8', reps:'12'}
      ]}
    ];
    return {
      mon: clone(quadsChest), tue: clone(backHams), wed: clone(shouldersArmsCalves),
      thu: clone(quadsChest), fri: clone(backHams), sat: clone(shouldersArmsCalves),
      sun: []
    };
  })();
  const LEE_HANEY_DAYS = (function(){
    const chestArms = [
      {name:'Chest & Arms', exercises:[
        {name:'Bench Press', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'4', reps:'6–8'},
        {name:'Dumbbell Bench Press', rest:'1 min', tempo:'', equipment:'Dumbbell', alternates:'', sets:'3', reps:'8–10'},
        {name:'Incline Bench Press', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'4', reps:'6–8'},
        {name:'Incline Dumbbell Bench Press', rest:'1 min', tempo:'', equipment:'Dumbbell', alternates:'', sets:'3', reps:'8–10'},
        {name:'Barbell Curl', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'4', reps:'8–10'},
        {name:'Preacher Curl', rest:'1 min', tempo:'', equipment:'Barbell/EZ-Bar', alternates:'', sets:'4', reps:'8–10'},
        {name:'Cable Tricep Extensions', rest:'1 min', tempo:'', equipment:'Cable', alternates:'', sets:'4', reps:'10–12'},
        {name:'Skullcrushers', rest:'1 min', tempo:'', equipment:'Barbell/EZ-Bar', alternates:'', sets:'4', reps:'6–8'}
      ]}
    ];
    const legs = [
      {name:'Legs', exercises:[
        {name:'Leg Extension', rest:'1 min', tempo:'', equipment:'Machine', alternates:'', sets:'4', reps:'12–15'},
        {name:'Leg Press', rest:'1 min', tempo:'', equipment:'Machine', alternates:'', sets:'4', reps:'10–12, one workout in three'},
        {name:'Squats', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'4–5', reps:'8–10'},
        {name:'Leg Curl', rest:'1 min', tempo:'', equipment:'Machine', alternates:'', sets:'4', reps:'8–10'},
        {name:'Stiff Leg Deadlift', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'3–4', reps:'8–10, one workout in three'}
      ]}
    ];
    const backShoulders = [
      {name:'Back & Shoulders', exercises:[
        {name:'Front Lat Pull Down', rest:'1 min', tempo:'', equipment:'Cable', alternates:'', sets:'4', reps:'8–10'},
        {name:'Barbell or T-Bar Row', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'4', reps:'6–8'},
        {name:'Cable Rows', rest:'1 min', tempo:'', equipment:'Cable', alternates:'', sets:'4', reps:'8–10'},
        {name:'Military Press', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'4–5', reps:'6–8'},
        {name:'Side Lateral', rest:'1 min', tempo:'', equipment:'Dumbbell', alternates:'', sets:'4', reps:'8–10'},
        {name:'Upright Row', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'4', reps:'6–8'}
      ]}
    ];
    const absCalves = [
      {name:'Abs & Calves', exercises:[
        {name:'Standing Calf Raise', rest:'1 min', tempo:'', equipment:'Machine', alternates:'Donkey Calf Raise', sets:'6', reps:'15–20'},
        {name:'Seated Calf Raise', rest:'1 min', tempo:'', equipment:'Machine', alternates:'', sets:'3–4', reps:'15–20'},
        {name:'Vertical Leg Raise', rest:'1 min', tempo:'', equipment:'Bodyweight', alternates:'', sets:'4', reps:'15–20'},
        {name:'Incline Sit Ups', rest:'1 min', tempo:'', equipment:'Bodyweight', alternates:'', sets:'4', reps:'15–20'},
        {name:'Seated Leg Raise', rest:'1 min', tempo:'', equipment:'Bodyweight', alternates:'', sets:'4', reps:'15–20'}
      ]}
    ];
    return {
      mon: clone(chestArms).concat(clone(absCalves)),
      tue: clone(legs).concat(clone(absCalves)),
      wed: clone(backShoulders).concat(clone(absCalves)),
      thu: [],
      fri: clone(chestArms).concat(clone(absCalves)),
      sat: clone(legs).concat(clone(absCalves)),
      sun: clone(backShoulders).concat(clone(absCalves))
    };
  })();
  const KAZMAIER_DAYS = (function(){
    const chestShouldersTricepsHeavy = [
      {name:'Chest (Heavy Day)', exercises:[
        {name:'Bench Press', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'4', reps:'10'},
        {name:'Wide-Grip Bench Press', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'3', reps:'10'},
        {name:'Narrow-Grip Bench Press', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'3', reps:'10'}
      ]},
      {name:'Shoulders', exercises:[
        {name:'Front Deltoid Dumbbell Raise', rest:'1 min', tempo:'', equipment:'Dumbbell', alternates:'', sets:'4', reps:'8'},
        {name:'Dumbbell Seated Shoulder Press', rest:'1 min', tempo:'', equipment:'Dumbbell', alternates:'', sets:'4', reps:'10'},
        {name:'Dumbbell Side Deltoid Raise', rest:'1 min', tempo:'', equipment:'Dumbbell', alternates:'', sets:'4', reps:'10'}
      ]},
      {name:'Triceps', exercises:[
        {name:'Lying Triceps Press', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'6', reps:'10'},
        {name:'Triceps Cable Pressdown', rest:'1 min', tempo:'', equipment:'Cable', alternates:'', sets:'4', reps:'10'}
      ]}
    ];
    const legsBackBiceps = [
      {name:'Legs', exercises:[
        {name:'Squats (Heavy Day)', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'4', reps:'10'},
        {name:'Deadlifts (Light Day)', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'3', reps:'10'},
        {name:'Leg Extensions', rest:'1 min', tempo:'', equipment:'Machine', alternates:'', sets:'3', reps:'10'},
        {name:'Leg Curls', rest:'1 min', tempo:'', equipment:'Machine', alternates:'', sets:'3', reps:'10'},
        {name:'Standing Calf Raises', rest:'1 min', tempo:'', equipment:'Machine', alternates:'', sets:'3', reps:'15–25'}
      ]},
      {name:'Back & Traps', exercises:[
        {name:'Barbell Shrugs', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'3', reps:'10–40'},
        {name:'Close-Grip Chin-Ups', rest:'1 min', tempo:'', equipment:'Bodyweight', alternates:'', sets:'3', reps:'to failure'},
        {name:'Seated Cable Rows', rest:'1 min', tempo:'', equipment:'Cable', alternates:'', sets:'4', reps:'10'}
      ]},
      {name:'Biceps', exercises:[
        {name:'Seated Hammer Curls', rest:'1 min', tempo:'', equipment:'Dumbbell', alternates:'', sets:'4', reps:'12'},
        {name:'Standing Barbell Curls', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'4', reps:'10'}
      ]}
    ];
    const chestShouldersTricepsLight = [
      {name:'Chest (Light Day)', exercises:[
        {name:'Bench Press', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'3', reps:'10'},
        {name:'Wide-Grip Bench Press', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'3', reps:'10'},
        {name:'Narrow-Grip Bench Press', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'3', reps:'10'}
      ]},
      {name:'Shoulders (Heavy Day)', exercises:[
        {name:'Dumbbell Seated Shoulder Press', rest:'1 min', tempo:'', equipment:'Dumbbell', alternates:'', sets:'4', reps:'8'},
        {name:'Front Deltoid Raise', rest:'1 min', tempo:'', equipment:'Dumbbell', alternates:'', sets:'4', reps:'10'},
        {name:'Rear Deltoid Cable Extensions', rest:'1 min', tempo:'', equipment:'Cable', alternates:'', sets:'4', reps:'10'}
      ]},
      {name:'Triceps', exercises:[
        {name:'Lying Triceps Barbell Extension', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'4', reps:'10'}
      ]}
    ];
    const legsBackArmsHeavyDeadlift = [
      {name:'Legs', exercises:[
        {name:'Deadlifts (Heavy Day)', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'4', reps:'8'},
        {name:'Squat (Light Day)', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'4', reps:'10'},
        {name:'Leg Extensions', rest:'1 min', tempo:'', equipment:'Machine', alternates:'', sets:'3', reps:'10'},
        {name:'Leg Curls', rest:'1 min', tempo:'', equipment:'Machine', alternates:'', sets:'3', reps:'10'},
        {name:'Standing Calf Raises', rest:'1 min', tempo:'', equipment:'Machine', alternates:'', sets:'3', reps:'15–25'}
      ]},
      {name:'Back & Traps', exercises:[
        {name:'Shrugs (Heavy Day)', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'4', reps:'10–15'},
        {name:'Single-Arm Dumbbell Rows', rest:'1 min', tempo:'', equipment:'Dumbbell', alternates:'', sets:'3', reps:'10'},
        {name:'Wide-Grip Lat Pulldowns', rest:'1 min', tempo:'', equipment:'Cable', alternates:'', sets:'4', reps:'10'}
      ]},
      {name:'Arms', exercises:[
        {name:'Seated Hammer Curls', rest:'1 min', tempo:'', equipment:'Dumbbell', alternates:'', sets:'4', reps:'8'},
        {name:'Concentration Curls', rest:'1 min', tempo:'', equipment:'Dumbbell', alternates:'', sets:'4', reps:'12'}
      ]}
    ];
    return {
      mon: clone(chestShouldersTricepsHeavy), tue: clone(legsBackBiceps), wed: [],
      thu: clone(chestShouldersTricepsLight), fri: [],
      sat: clone(legsBackArmsHeavyDeadlift), sun: []
    };
  })();
  const HEPBURN_PROGRAM_A_DAYS = (function(){
    const progNote = '2 reps/set, turning one more 2-rep set into a 3-rep set each subsequent workout (see companion blog post) — once all 8 sets read 3 reps, add 10 lb and restart at 2s';
    const squatBench = [
      {name:'Squat & Bench Day', exercises:[
        {name:'Squat', rest:'2 min', tempo:'', equipment:'Barbell', alternates:'', sets:'8', reps:progNote},
        {name:'Bench Press', rest:'2 min', tempo:'', equipment:'Barbell', alternates:'', sets:'8', reps:progNote}
      ]}
    ];
    const deadliftDay = [
      {name:'Deadlift Day', exercises:[
        {name:'Deadlift', rest:'2 min', tempo:'', equipment:'Barbell', alternates:'', sets:'8', reps:progNote}
      ]}
    ];
    return {
      mon: clone(squatBench), tue: clone(deadliftDay), wed: [],
      thu: clone(squatBench), fri: clone(deadliftDay), sat: [], sun: []
    };
  })();
  const GIRONDA_8X8_DAYS = (function(){
    const day1 = [
      {name:'Chest', exercises:[
        {name:'Decline Low Cable Crossover', rest:'20 sec', tempo:'', equipment:'Cable', alternates:'', sets:'8', reps:'8'},
        {name:'Bench Press to Neck', rest:'20 sec', tempo:'', equipment:'Barbell', alternates:'', sets:'8', reps:'8'},
        {name:'Incline Dumbbell Press (palms facing each other)', rest:'20 sec', tempo:'', equipment:'Dumbbell', alternates:'', sets:'8', reps:'8'},
        {name:'Wide-Grip V-Bar Dips', rest:'20 sec', tempo:'', equipment:'Bodyweight', alternates:'', sets:'8', reps:'8'}
      ]},
      {name:'Biceps', exercises:[
        {name:'Drag Curl', rest:'20 sec', tempo:'', equipment:'Barbell', alternates:'', sets:'8', reps:'8'},
        {name:'Preacher Curl (top of bench at low pec line)', rest:'20 sec', tempo:'', equipment:'Barbell/EZ-Bar', alternates:'', sets:'8', reps:'8'},
        {name:'Incline Dumbbell Curl', rest:'20 sec', tempo:'', equipment:'Dumbbell', alternates:'', sets:'8', reps:'8'}
      ]},
      {name:'Forearms', exercises:[
        {name:'Zottman Curl', rest:'20 sec', tempo:'', equipment:'Dumbbell', alternates:'', sets:'8', reps:'8'},
        {name:'Barbell Wrist Curl', rest:'20 sec', tempo:'', equipment:'Barbell', alternates:'', sets:'8', reps:'8'}
      ]}
    ];
    const day2 = [
      {name:'Shoulders', exercises:[
        {name:'Seated Dumbbell Side Lateral Raise', rest:'20 sec', tempo:'', equipment:'Dumbbell', alternates:'', sets:'8', reps:'8'},
        {name:'Wide-Grip Upright Row', rest:'20 sec', tempo:'', equipment:'Barbell', alternates:'', sets:'8', reps:'8'},
        {name:'Front-to-Back Barbell Shoulder Press', rest:'20 sec', tempo:'', equipment:'Barbell', alternates:'', sets:'8', reps:'8'},
        {name:'Dumbbell Bent-Over Rear Deltoid Lateral', rest:'20 sec', tempo:'', equipment:'Dumbbell', alternates:'', sets:'8', reps:'8'}
      ]},
      {name:'Triceps', exercises:[
        {name:'Kneeling Rope Extension', rest:'20 sec', tempo:'', equipment:'Cable', alternates:'', sets:'8', reps:'8'},
        {name:'Lying Triceps Extension', rest:'20 sec', tempo:'', equipment:'Barbell/EZ-Bar', alternates:'', sets:'8', reps:'8'},
        {name:'2-Dumbbell Triceps Kickback', rest:'20 sec', tempo:'', equipment:'Dumbbell', alternates:'', sets:'8', reps:'8'}
      ]}
    ];
    const day3 = [
      {name:'Back', exercises:[
        {name:'Sternum Chin-Up', rest:'20 sec', tempo:'', equipment:'Bodyweight', alternates:'', sets:'8', reps:'8'},
        {name:'High Bench Two-Dumbbell Rowing', rest:'20 sec', tempo:'', equipment:'Dumbbell', alternates:'', sets:'8', reps:'8'},
        {name:'Low Cable Row (18" high pulley)', rest:'20 sec', tempo:'', equipment:'Cable', alternates:'', sets:'8', reps:'8'},
        {name:'Medium-Grip Lat Pulldown to Chest', rest:'20 sec', tempo:'', equipment:'Cable', alternates:'', sets:'8', reps:'8'}
      ]},
      {name:'Abs', exercises:[
        {name:'Double Crunch (pull knees and elbows together)', rest:'20 sec', tempo:'', equipment:'Bodyweight', alternates:'', sets:'8', reps:'8'},
        {name:'Weighted Crunch', rest:'20 sec', tempo:'', equipment:'Bodyweight', alternates:'', sets:'8', reps:'8'},
        {name:'Lying Bent-Knee Leg Raise', rest:'20 sec', tempo:'', equipment:'Bodyweight', alternates:'', sets:'8', reps:'8'}
      ]}
    ];
    const day4 = [
      {name:'Quads', exercises:[
        {name:'Front Squat', rest:'20 sec', tempo:'', equipment:'Barbell', alternates:'Hack Squat Machine', sets:'8', reps:'8'},
        {name:'Hack Machine Squat', rest:'20 sec', tempo:'', equipment:'Machine', alternates:'', sets:'8', reps:'8'},
        {name:'Sissy Squat', rest:'20 sec', tempo:'', equipment:'Bodyweight', alternates:'', sets:'8', reps:'8'},
        {name:'Leg Extension', rest:'20 sec', tempo:'', equipment:'Machine', alternates:'', sets:'8', reps:'8'}
      ]},
      {name:'Hamstrings', exercises:[
        {name:'Supine Leg Curl', rest:'20 sec', tempo:'', equipment:'Machine', alternates:'', sets:'8', reps:'8'},
        {name:'Seated Leg Curl Machine', rest:'20 sec', tempo:'', equipment:'Machine', alternates:'', sets:'8', reps:'8'}
      ]},
      {name:'Calves', exercises:[
        {name:'Standing Calf Raise', rest:'20 sec', tempo:'', equipment:'Machine', alternates:'', sets:'8', reps:'20'},
        {name:'Seated Calf Raise', rest:'20 sec', tempo:'', equipment:'Machine', alternates:'', sets:'8', reps:'20'}
      ]}
    ];
    return {
      mon: clone(day1), tue: clone(day2), wed: clone(day3), thu: clone(day4),
      fri: [], sat: [], sun: []
    };
  })();
  const GVT_DAYS = (function(){
    const chestBack = [
      {name:'Chest & Back', exercises:[
        {name:'Decline Dumbbell Press', rest:'90 sec', tempo:'4-0-2-0', equipment:'Dumbbell', alternates:'', sets:'10', reps:'10'},
        {name:'Chin-Ups', rest:'90 sec', tempo:'4-0-2-0', equipment:'Bodyweight', alternates:'', sets:'10', reps:'10'},
        {name:'Incline Dumbbell Flyes', rest:'60 sec', tempo:'3-0-2-0', equipment:'Dumbbell', alternates:'', sets:'3', reps:'10–12'},
        {name:'One-Arm Dumbbell Row', rest:'60 sec', tempo:'3-0-2-0', equipment:'Dumbbell', alternates:'', sets:'3', reps:'10–12'}
      ]}
    ];
    const legsAbs = [
      {name:'Legs & Abs', exercises:[
        {name:'Barbell Squat', rest:'90 sec', tempo:'4-0-2-0', equipment:'Barbell', alternates:'', sets:'10', reps:'10'},
        {name:'Lying Leg Curls', rest:'90 sec', tempo:'4-0-2-0', equipment:'Machine', alternates:'', sets:'10', reps:'10'},
        {name:'Leg Pull-In', rest:'60 sec', tempo:'2-0-2-0', equipment:'Bodyweight', alternates:'Low-Cable Pull-Ins', sets:'3', reps:'15–20'},
        {name:'Seated Calf Raise', rest:'60 sec', tempo:'2-0-2-0', equipment:'Machine', alternates:'', sets:'3', reps:'15–20'}
      ]}
    ];
    const armsShoulders = [
      {name:'Arms & Shoulders', exercises:[
        {name:'Parallel Bar Dips', rest:'90 sec', tempo:'4-0-2-0', equipment:'Bodyweight', alternates:'', sets:'10', reps:'10'},
        {name:'Incline Hammer Curls', rest:'90 sec', tempo:'4-0-2-0', equipment:'Dumbbell', alternates:'', sets:'10', reps:'10'},
        {name:'Dumbbell Lying Rear Lateral Raise', rest:'60 sec', tempo:'2-0-x-0', equipment:'Dumbbell', alternates:'Bent-Over or Seated Lateral Raises', sets:'3', reps:'10–12'},
        {name:'Seated Dumbbell Lateral Raises', rest:'60 sec', tempo:'2-0-x-0', equipment:'Dumbbell', alternates:'', sets:'3', reps:'10–12'}
      ]}
    ];
    return {
      mon: clone(chestBack), tue: clone(legsAbs), wed: [],
      thu: clone(armsShoulders), fri: [], sat: [], sun: []
    };
  })();
  const REEVES_CLASSIC_PHYSIQUE_DAYS = (function(){
    const fullBody = [
      {name:'Full Body', exercises:[
        {name:'Incline Dumbbell Press', rest:'45–60 sec', tempo:'2-0-3-0', equipment:'Dumbbell', alternates:'', sets:'3', reps:'8–12, descending weight each set'},
        {name:'Breathing Front Squat', rest:'45–60 sec', tempo:'2-0-3-0', equipment:'Barbell', alternates:'', sets:'3', reps:'15, supersetted with Dumbbell Laterals/Flyes'},
        {name:'Dumbbell Laterals/Flyes', rest:'45–60 sec', tempo:'2-0-3-0', equipment:'Dumbbell', alternates:'', sets:'3', reps:'15'},
        {name:'Seated Barbell Curls', rest:'45–60 sec', tempo:'2-0-3-0', equipment:'Barbell', alternates:'', sets:'3', reps:'12, emphasizing the negative'},
        {name:'Alternate Dumbbell Forward Raise', rest:'45–60 sec', tempo:'2-0-3-0', equipment:'Dumbbell', alternates:'', sets:'2', reps:'15'},
        {name:'Bent-Over Rows', rest:'45–60 sec', tempo:'2-0-3-0', equipment:'Barbell', alternates:'', sets:'2', reps:'12'},
        {name:'One-Arm Rows', rest:'45–60 sec', tempo:'2-0-3-0', equipment:'Dumbbell', alternates:'', sets:'2', reps:'12'},
        {name:'Splits with Barbell', rest:'45–60 sec', tempo:'2-0-3-0', equipment:'Barbell', alternates:'', sets:'1', reps:'until breathless'},
        {name:'Alternate Raise Lying', rest:'45–60 sec', tempo:'2-0-3-0', equipment:'Dumbbell', alternates:'', sets:'2', reps:'15'},
        {name:'Good Mornings', rest:'45–60 sec', tempo:'2-0-3-0', equipment:'Barbell', alternates:'', sets:'1', reps:'15'},
        {name:'Dumbbell French Press', rest:'45–60 sec', tempo:'2-0-3-0', equipment:'Dumbbell', alternates:'', sets:'3', reps:'12'},
        {name:'Calf Raises (leg press machine)', rest:'45–60 sec', tempo:'2-0-3-0', equipment:'Machine', alternates:'', sets:'1', reps:'30–40'},
        {name:'Bench Press', rest:'45–60 sec', tempo:'2-0-3-0', equipment:'Barbell', alternates:'', sets:'2', reps:'12'}
      ]}
    ];
    return {
      mon: clone(fullBody), tue: [], wed: clone(fullBody), thu: [],
      fri: [], sat: clone(fullBody), sun: []
    };
  })();
  const ZANE_EXPERIENCE_DAYS = (function(){
    const torso = [
      {name:'Back', exercises:[
        {name:'Front Pulldown (neutral grip)', rest:'stretch, ~15 sec', tempo:'', equipment:'Cable', alternates:'', sets:'2', reps:'12 then 10, increasing weight'},
        {name:'Low Cable Row', rest:'stretch, ~15 sec', tempo:'', equipment:'Cable', alternates:'', sets:'2', reps:'12 then 10, increasing weight'},
        {name:'One-Arm Dumbbell Row', rest:'stretch, ~15 sec', tempo:'', equipment:'Dumbbell', alternates:'', sets:'2', reps:'12 then 10, increasing weight'}
      ]},
      {name:'Shoulders', exercises:[
        {name:'Overhead Press (arcing machine or Smith)', rest:'stretch, ~15 sec', tempo:'', equipment:'Machine', alternates:'', sets:'2', reps:'12 then 10, increasing weight'},
        {name:'Rear Deltoid Machine', rest:'stretch, ~15 sec', tempo:'', equipment:'Machine', alternates:'Bent-Over Dumbbell Lateral Raise', sets:'2', reps:'15 then 12, increasing weight'},
        {name:'Dumbbell Lateral Raise', rest:'stretch, ~15 sec', tempo:'', equipment:'Dumbbell', alternates:'', sets:'2', reps:'12 then 10, increasing weight'}
      ]},
      {name:'Chest', exercises:[
        {name:'Dumbbell Pullover', rest:'stretch, ~15 sec', tempo:'', equipment:'Dumbbell', alternates:'Pullover Machine', sets:'2', reps:'12 then 10, increasing weight'},
        {name:'Incline Dumbbell Press, 70° (neutral grip)', rest:'stretch, ~15 sec', tempo:'', equipment:'Dumbbell', alternates:'', sets:'2', reps:'12 then 10, increasing weight'},
        {name:'Incline Dumbbell Press, 30° (neutral grip)', rest:'stretch, ~15 sec', tempo:'', equipment:'Dumbbell', alternates:'', sets:'2', reps:'12 then 10, increasing weight'},
        {name:'Pec Deck / Dumbbell Flyes', rest:'stretch, ~15 sec', tempo:'', equipment:'Machine/Dumbbell', alternates:'', sets:'2', reps:'12 then 10, increasing weight'}
      ]},
      {name:'Abs', exercises:[
        {name:'Hanging Knee-Ups tri-set with Crunches', rest:'none (tri-set)', tempo:'', equipment:'Bodyweight', alternates:'', sets:'3', reps:'25–30'},
        {name:'One-Arm Cable Crunch', rest:'1 min', tempo:'', equipment:'Cable', alternates:'', sets:'3', reps:'10–15 each side'}
      ]}
    ];
    const legs = [
      {name:'Thighs', exercises:[
        {name:'Leg Curl superset with Hyperextension', rest:'stretch, ~15 sec', tempo:'', equipment:'Machine', alternates:'', sets:'2', reps:'12 then 10 (leg curl), 12–15 (hyperextension)'},
        {name:'Leg Extension superset with Leg Press', rest:'3 min after both supersets', tempo:'', equipment:'Machine', alternates:'', sets:'2', reps:'12 then 10, increasing weight'},
        {name:'Squat (or Hack Squat / Front Squat)', rest:'stretch, ~15 sec', tempo:'', equipment:'Barbell/Machine', alternates:'Front Squat, Hack Squat', sets:'2', reps:'12 then 10, increasing weight'}
      ]},
      {name:'Calves', exercises:[
        {name:'Standing Calf Raise', rest:'burn-to-failure, ~15 sec', tempo:'', equipment:'Machine', alternates:'Donkey Calf Raise, Leg Press Calf Raise', sets:'2', reps:'15–20'},
        {name:'Seated Calf Raise', rest:'burn-to-failure, ~15 sec', tempo:'', equipment:'Machine', alternates:'', sets:'2', reps:'15–20'}
      ]},
      {name:'Abs', exercises:[
        {name:'Leg Raise superset with Crunches', rest:'none (superset)', tempo:'', equipment:'Bodyweight', alternates:'', sets:'3', reps:'25–30'},
        {name:'One-Arm Cable Crunch', rest:'1 min', tempo:'', equipment:'Cable', alternates:'', sets:'1', reps:'25 each side'}
      ]}
    ];
    const arms = [
      {name:'Triceps', exercises:[
        {name:'Close-Grip Bench Press', rest:'stretch, ~15 sec', tempo:'', equipment:'Barbell/Smith Machine', alternates:'', sets:'2', reps:'12 then 10, increasing weight'},
        {name:'Dip Machine superset with Overhead Cable Extension', rest:'3 min after both supersets', tempo:'', equipment:'Machine/Cable', alternates:'Parallel Dips', sets:'2', reps:'12 then 10, increasing weight'}
      ]},
      {name:'Biceps', exercises:[
        {name:'One-Arm Curl (machine or cable)', rest:'stretch, ~15 sec', tempo:'', equipment:'Machine/Cable', alternates:'One-Arm Dumbbell Concentration Curl', sets:'2', reps:'12 then 10, increasing weight'},
        {name:'Incline Dumbbell Curl (face-down, 70°)', rest:'stretch, ~15 sec', tempo:'', equipment:'Dumbbell', alternates:'', sets:'2', reps:'12 then 10, increasing weight'},
        {name:'Preacher Cable Curl (drop set)', rest:'seconds between drops', tempo:'', equipment:'Cable', alternates:'', sets:'1', reps:'6, 5–6, 4–5, 4 — dropping weight each stage'}
      ]},
      {name:'Forearms', exercises:[
        {name:'Reverse Curl (rope or barbell, drop set)', rest:'none (drop)', tempo:'', equipment:'Rope/Barbell', alternates:'', sets:'1', reps:'8 then drop weight for 7 more'},
        {name:'Barbell Wrist Curl', rest:'—', tempo:'', equipment:'Barbell', alternates:'', sets:'1', reps:'35'}
      ]},
      {name:'Abs', exercises:[
        {name:'Leg Raises, Crunches, Hanging Knee-Ups & One-Arm Cable Crunch circuit', rest:'as needed', tempo:'', equipment:'Bodyweight/Cable', alternates:'', sets:'2', reps:'30, 30, 30, 10 each arm — repeat circuit twice'}
      ]}
    ];
    return {
      mon: clone(torso), tue: [], wed: clone(legs), thu: [],
      fri: clone(arms), sat: [], sun: []
    };
  })();
  const RONNIE_COLEMAN_DAYS = (function(){
    const backBiceps = [
      {name:'Back', exercises:[
        {name:'Deadlift', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'4', reps:'2'},
        {name:'Bent-Over Row', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'3', reps:'10'},
        {name:'T-Bar Row', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'3', reps:'10'},
        {name:'Lat Pulldown', rest:'1 min', tempo:'', equipment:'Cable', alternates:'', sets:'3', reps:'10'},
        {name:'Seated V-Bar Cable Row', rest:'1 min', tempo:'', equipment:'Cable', alternates:'', sets:'3', reps:'10'}
      ]},
      {name:'Biceps', exercises:[
        {name:'Barbell Curl', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'4', reps:'8'},
        {name:'Seated Dumbbell Curl', rest:'1 min', tempo:'', equipment:'Dumbbell', alternates:'', sets:'3', reps:'8'},
        {name:'Preacher Curl', rest:'1 min', tempo:'', equipment:'Barbell/EZ-Bar', alternates:'', sets:'3', reps:'8'},
        {name:'Cable Curl', rest:'1 min', tempo:'', equipment:'Cable', alternates:'', sets:'3', reps:'8'}
      ]}
    ];
    const chestTriceps = [
      {name:'Chest', exercises:[
        {name:'Bench Press', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'5', reps:'6'},
        {name:'Incline Bench Press', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'3', reps:'8'},
        {name:'Dumbbell Bench Press', rest:'1 min', tempo:'', equipment:'Dumbbell', alternates:'', sets:'3', reps:'8'},
        {name:'Decline Bench Press', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'3', reps:'8'}
      ]},
      {name:'Triceps', exercises:[
        {name:'Tricep Dip Machine', rest:'1 min', tempo:'', equipment:'Machine', alternates:'', sets:'3', reps:'8'},
        {name:'Overhead Dumbbell Tricep Extension', rest:'1 min', tempo:'', equipment:'Dumbbell', alternates:'', sets:'3', reps:'8'},
        {name:'Behind-Head Skull Crusher', rest:'1 min', tempo:'', equipment:'Barbell/EZ-Bar', alternates:'', sets:'3', reps:'8'},
        {name:'Reverse-Grip Tricep Pushdown', rest:'1 min', tempo:'', equipment:'Cable', alternates:'', sets:'3', reps:'8'}
      ]}
    ];
    const shouldersTraps = [
      {name:'Shoulders', exercises:[
        {name:'Military Press', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'4', reps:'8'},
        {name:'Seated Dumbbell Military Press', rest:'1 min', tempo:'', equipment:'Dumbbell', alternates:'', sets:'3', reps:'8'},
        {name:'Alternating Dumbbell Front Raise (superset)', rest:'1 min', tempo:'', equipment:'Dumbbell', alternates:'', sets:'3', reps:'8'},
        {name:'Lateral Raise (superset)', rest:'1 min', tempo:'', equipment:'Dumbbell', alternates:'', sets:'3', reps:'8'},
        {name:'Machine Reverse Fly', rest:'1 min', tempo:'', equipment:'Machine', alternates:'', sets:'4', reps:'8'}
      ]},
      {name:'Traps', exercises:[
        {name:'Shrug', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'4', reps:'8'}
      ]}
    ];
    const legs = [
      {name:'Legs', exercises:[
        {name:'Squat', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'5', reps:'2'},
        {name:'Seated Leg Press', rest:'1 min', tempo:'', equipment:'Machine', alternates:'', sets:'4', reps:'8'},
        {name:'Walking Bodyweight Lunge', rest:'1 min', tempo:'', equipment:'Bodyweight', alternates:'', sets:'2', reps:'50'},
        {name:'Leg Extension', rest:'1 min', tempo:'', equipment:'Machine', alternates:'', sets:'4', reps:'8'},
        {name:'Straight-Leg Deadlift', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'3', reps:'8'},
        {name:'Seated Leg Curl', rest:'1 min', tempo:'', equipment:'Machine', alternates:'', sets:'3', reps:'8'},
        {name:'Standing Leg Curl', rest:'1 min', tempo:'', equipment:'Machine', alternates:'', sets:'3', reps:'8'},
        {name:'Standing Barbell Calf Raise', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'', sets:'4', reps:'10'},
        {name:'Donkey Calf Raise', rest:'1 min', tempo:'', equipment:'Machine', alternates:'', sets:'4', reps:'12'},
        {name:'Seated Machine Calf Raise', rest:'1 min', tempo:'', equipment:'Machine', alternates:'', sets:'4', reps:'12'}
      ]}
    ];
    return {
      mon: clone(backBiceps), tue: clone(chestTriceps), wed: clone(shouldersTraps), thu: clone(legs),
      fri: [], sat: [], sun: []
    };
  })();
  const MENS_HEALTH_AB_DAYS = (function(){
    const workoutA = [
      {name:'Core & Lower Body', exercises:[
        {name:'Core (choose any)', rest:'1 min', tempo:'', equipment:'Varies', alternates:'Plank, Side Plank, Mountain Climber, Swiss-Ball Jackknife', sets:'3', reps:'12 (or hold for time if the chosen move is a hold)'},
        {name:'Glutes & Hamstrings, single-leg (choose any)', rest:'1 min', tempo:'', equipment:'Barbell/Dumbbell', alternates:'Single-Leg Barbell Straight-Leg Deadlift, Single-Leg Hip Raise, Dumbbell Stepup', sets:'3', reps:'12'},
        {name:'Upper Back (choose any)', rest:'1 min', tempo:'', equipment:'Barbell/Dumbbell/Cable', alternates:'Dumbbell Row, Barbell Row, Cable Row', sets:'3', reps:'12'}
      ]},
      {name:'Quads & Chest', exercises:[
        {name:'Quadriceps, both legs (choose any)', rest:'1 min', tempo:'', equipment:'Barbell/Dumbbell', alternates:'Dumbbell Squat, Goblet Squat, Barbell Front Squat', sets:'3', reps:'12'},
        {name:'Chest (choose any)', rest:'1 min', tempo:'', equipment:'Bodyweight/Barbell/Dumbbell', alternates:'Pushup, Dumbbell Bench Press, Swiss-Ball Dumbbell Chest Press', sets:'3', reps:'12'}
      ]},
      {name:'Cardio', exercises:[
        {name:'Cardio Finisher (choose any)', rest:'—', tempo:'', equipment:'Varies', alternates:'Any "Finisher" cardio move, or any cardio workout the client already uses', sets:'1', reps:'to taste, done immediately after the weight workout'}
      ]}
    ];
    const workoutB = [
      {name:'Core & Legs', exercises:[
        {name:'Core (choose any)', rest:'1 min', tempo:'', equipment:'Varies', alternates:'Plank, Side Plank, Mountain Climber, Swiss-Ball Jackknife', sets:'3', reps:'12 (or hold for time if the chosen move is a hold)'},
        {name:'Quadriceps, single-leg (choose any)', rest:'1 min', tempo:'', equipment:'Barbell/Dumbbell', alternates:'Barbell/Dumbbell Lunge, Barbell/Dumbbell Split Squat, Single-Leg Squat', sets:'3', reps:'12'},
        {name:'Lats (choose any)', rest:'1 min', tempo:'', equipment:'Bodyweight/Cable/Dumbbell', alternates:'Chinup, Lat Pulldown, Pullover', sets:'3', reps:'12'}
      ]},
      {name:'Posterior Chain & Shoulders', exercises:[
        {name:'Glutes & Hamstrings, both legs (choose any)', rest:'1 min', tempo:'', equipment:'Barbell/Dumbbell', alternates:'Barbell Deadlift, Dumbbell Straight-Leg Deadlift, Swiss-Ball Hip Raise & Leg Curl', sets:'3', reps:'12'},
        {name:'Shoulders (choose any)', rest:'1 min', tempo:'', equipment:'Dumbbell', alternates:'Dumbbell Shoulder Press, Lateral Raise, Scaption & Shrug', sets:'3', reps:'12'}
      ]},
      {name:'Cardio', exercises:[
        {name:'Cardio Finisher (choose any)', rest:'—', tempo:'', equipment:'Varies', alternates:'Any "Finisher" cardio move, or any cardio workout the client already uses', sets:'1', reps:'to taste, done immediately after the weight workout'}
      ]}
    ];
    return {
      mon: clone(workoutA), tue: [], wed: clone(workoutB), thu: [],
      fri: clone(workoutA), sat: [], sun: []
    };
  })();
  const ONE_PERCENT_FITNESS_AB_DAYS = (function(){
    const workoutA = [
      {name:'Squat & Vertical Pull (A1/A2)', exercises:[
        {name:'Squat Variation', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'Coach picks any squat-pattern variation suited to the client', sets:'4', reps:'5'},
        {name:'Vertical Pull Variation', rest:'1 min', tempo:'', equipment:'Bodyweight/Cable', alternates:'Coach picks any vertical-pull variation (e.g. pulldown, pull-up family)', sets:'4', reps:'5'}
      ]},
      {name:'Lunge & Horizontal Pull (B1/B2)', exercises:[
        {name:'Lunge Variation', rest:'1 min', tempo:'', equipment:'Barbell/Dumbbell', alternates:'Coach picks any lunge-pattern variation', sets:'4', reps:'5'},
        {name:'Horizontal Pull Variation', rest:'1 min', tempo:'', equipment:'Barbell/Dumbbell/Cable', alternates:'Coach picks any horizontal-pull (row-family) variation', sets:'3', reps:'8 /side'}
      ]},
      {name:'Knee Extension & Single-Arm Pull (C1/C2)', exercises:[
        {name:'Knee Extension Variation', rest:'1 min', tempo:'', equipment:'Machine/Bodyweight', alternates:'Coach picks any knee-extension-dominant variation', sets:'3', reps:'6–8 /side'},
        {name:'Single-Arm Horizontal Pull Variation', rest:'1 min', tempo:'', equipment:'Dumbbell/Cable', alternates:'Coach picks any single-arm row variation', sets:'3', reps:'10'}
      ]},
      {name:'Ankle & Elbow Finisher (D1/D2)', exercises:[
        {name:'Ankle Plantar Flexion', rest:'1 min', tempo:'', equipment:'Bodyweight/Machine', alternates:'Standing or seated calf raise family', sets:'7', reps:'12 /side'},
        {name:'Elbow Flexion', rest:'1 min', tempo:'', equipment:'Barbell/Dumbbell', alternates:'Any curl variation, high-rep burnout style', sets:'7', reps:'100+ total'}
      ]}
    ];
    const workoutB = [
      {name:'Deadlift & Vertical Push (A1/A2)', exercises:[
        {name:'Deadlift Variation', rest:'1 min', tempo:'', equipment:'Barbell', alternates:'Coach picks any deadlift-pattern variation suited to the client', sets:'4', reps:'5'},
        {name:'Vertical Push Variation', rest:'1 min', tempo:'', equipment:'Barbell/Dumbbell', alternates:'Coach picks any vertical-push (overhead press family) variation', sets:'4', reps:'5'}
      ]},
      {name:'Reverse Lunge & Horizontal Push (B1/B2)', exercises:[
        {name:'Reverse Lunge Variation', rest:'1 min', tempo:'', equipment:'Barbell/Dumbbell', alternates:'Coach picks any reverse-lunge-pattern variation', sets:'4', reps:'5'},
        {name:'Horizontal Push Variation', rest:'1 min', tempo:'', equipment:'Barbell/Dumbbell/Bodyweight', alternates:'Coach picks any horizontal-push (press family) variation', sets:'3', reps:'8 /side'}
      ]},
      {name:'Knee Flexion & Single-Arm Push (C1/C2)', exercises:[
        {name:'Knee Flexion Variation', rest:'1 min', tempo:'', equipment:'Machine/Bodyweight', alternates:'Coach picks any knee-flexion-dominant (hamstring) variation', sets:'3', reps:'6–8 /side'},
        {name:'Single-Arm Horizontal Push Variation', rest:'1 min', tempo:'', equipment:'Dumbbell', alternates:'Coach picks any single-arm press variation', sets:'3', reps:'10'}
      ]},
      {name:'Ankle & Elbow Finisher (D1/D2)', exercises:[
        {name:'Ankle Dorsiflexion', rest:'1 min', tempo:'', equipment:'Bodyweight/Band', alternates:'Banded or bodyweight dorsiflexion work', sets:'7', reps:'12 /side'},
        {name:'Elbow Extension', rest:'1 min', tempo:'', equipment:'Barbell/Dumbbell/Cable', alternates:'Any triceps extension variation, high-rep burnout style', sets:'7', reps:'100+ total'}
      ]}
    ];
    return {
      mon: clone(workoutA), tue: [], wed: clone(workoutB), thu: [],
      fri: clone(workoutA), sat: [], sun: []
    };
  })();
  // Bell(e)s N' Barz's own way of training (Pulse → Mobilize → Core →
  // Activate → Potentiate warm-up, lettered superset blocks, a Signature
  // Hold, Hepburn progression on each day's A1) with only dumbbells, a
  // bench and the floor. Same plan as the "Full-Body Dumbbell Workout"
  // write-up: Day A Monday, Day B Wednesday, Day C Friday, Sunday recovery.
  const FULL_BODY_DUMBBELL_DAYS = (function(){
    const ex = (name, sets, reps, rest, alternates, equipment) =>
      ({ name, rest: rest || '', tempo: '', equipment: equipment || 'Dumbbell', alternates: alternates || '', sets: sets || '', reps: reps || '' });
    const A = '90–120 sec', BC = '60–90 sec', DE = '45–60 sec';
    const dayA = [
      {name:'Warm-up', exercises:[
        ex('Jump Rope', '', '5 min', '', 'Jumping Jacks', 'Bodyweight'),
        ex("World's Greatest Stretch", '1', '5 /side', '', 'Hip CARs, 90/90 Switches', 'Bodyweight'),
        ex('Dead Bug', '2', '10', '30–45 sec', '', 'Bodyweight'),
        ex('Suitcase Carry', '2', '20 m /side', '30–45 sec', ''),
        ex('Glute Bridges', '1', '15', '', 'Scapular Push-ups, Tibialis Raises', 'Bodyweight'),
        ex('Jump Squats', '3', '5', '2 min', '', 'Bodyweight')
      ]},
      {name:'Block A', exercises:[
        ex('Heel-Elevated Goblet Squat', '4', '8–10', A, 'Goblet Squat'),
        ex('Chest-Supported Dumbbell Row', '4', '8–10', A, 'Bent-Over Dumbbell Row', 'Dumbbell/Bench')
      ]},
      {name:'Block B', exercises:[
        ex('Flat Dumbbell Bench Press', '3', '10', BC, 'Dumbbell Floor Press', 'Dumbbell/Bench'),
        ex('Single-Arm Dumbbell Row', '3', '10 /side', BC, 'Kroc Row')
      ]},
      {name:'Block C', exercises:[
        ex('Goblet Cossack Squat', '3', '8 /leg', BC, 'Lateral Lunge'),
        ex('Dumbbell Lateral Raise', '3', '12–15', BC, 'Leaning Lateral Raise')
      ]},
      {name:'Block D', exercises:[
        ex('Copenhagen Plank', '3', '20–30 sec /side', DE, 'Short-Lever Copenhagen Plank', 'Bench'),
        ex('Standing Dumbbell Calf Raise', '3', '15–20', DE, 'Single-Leg Calf Raise')
      ]},
      {name:'★ Signature Hold', exercises:[ ex('Goblet Squat Bottom Hold', '', '45–60 sec', '', 'Horse Stance') ]}
    ];
    const dayB = [
      {name:'Warm-up', exercises:[
        ex('Shadow Boxing', '', '5 min (30 s on / 15 s off)', '', 'High Knees', 'Bodyweight'),
        ex('Cat-Cow', '1', '8', '', 'Pelvic Tilts, Hip CARs, Pigeon Stretch', 'Bodyweight'),
        ex('Leg Drops', '2', '10', '30–45 sec', '', 'Bodyweight'),
        ex('Dumbbell Torso Rotations', '2', '10 /side', '30–45 sec', ''),
        ex('Single-Leg Glute Bridges', '1', '10 /side', '', 'Hamstring Walkouts, Prone Y-T-W Raises', 'Bodyweight'),
        ex('Broad Jumps', '3', '3', '2 min', 'Dumbbell Hang High Pull', 'Bodyweight')
      ]},
      {name:'Block A', exercises:[
        ex('Dumbbell Romanian Deadlift', '4', '8–10', A, 'Single-Leg RDL'),
        ex('Half-Kneeling Single-Arm Dumbbell Press', '4', '8 /side', A, 'Seated Arnold Press')
      ]},
      {name:'Block B', exercises:[
        ex('Bulgarian Split Squat', '3', '10 /leg', BC, 'Dumbbell Reverse Lunge', 'Dumbbell/Bench'),
        ex('Dumbbell Pullover', '3', '12–15', BC, 'Floor Pullover', 'Dumbbell/Bench')
      ]},
      {name:'Block C', exercises:[
        ex('Dumbbell Hip Thrust', '3', '10–12', BC, 'Dumbbell Glute Bridge', 'Dumbbell/Bench'),
        ex('Bent-Over Rear Delt Fly', '3', '15', BC, 'Chest-Supported Rear Delt Fly')
      ]},
      {name:'Block D', exercises:[
        ex('Nordic Curls', '4', '3–5', BC, 'Slider Leg Curl', 'Bodyweight (feet anchored)'),
        ex('Dumbbell Shrug', '3', '12–15', DE, "Farmer's Hold")
      ]},
      {name:'Block E', exercises:[
        ex('Seated Knee Raise (dumbbell on thigh)', '3', '12 /side', DE, 'Standing Knee Drive'),
        ex('Prone Superman', '3', '12–15', DE, 'Dumbbell Good Morning', 'Bodyweight')
      ]},
      {name:'★ Signature Hold', exercises:[ ex('Single-Leg Glute Bridge Hold', '', '30–45 sec /side', '', 'Hip Airplane Hold', 'Bodyweight') ]}
    ];
    const dayC = [
      {name:'Warm-up', exercises:[
        ex('Jump Rope', '', '5 min', '', 'Jumping Jacks', 'Bodyweight'),
        ex('Thoracic Rotations', '1', '8 /side', '', 'Neck CARs, Shoulder CARs, Wall Slides, Wrist CARs', 'Bodyweight'),
        ex('Dead Bug', '2', '10', '30–45 sec', '', 'Bodyweight'),
        ex('Suitcase Carry', '2', '20 m /side', '30–45 sec', ''),
        ex('Scapular Push-ups', '1', '10', '', 'Prone Y-T-W Raises, Serratus Punches, Bear Crawl Hold', 'Bodyweight'),
        ex('Plyometric Push-ups', '3', '5', '2 min', 'Dumbbell Push Press', 'Bodyweight')
      ]},
      {name:'Block A', exercises:[
        ex('Incline Dumbbell Press', '4', '8–10', A, 'Floor Press (feet up)', 'Dumbbell/Bench'),
        ex('Bent-Over Dumbbell Row', '4', '8–10', A, 'Chest-Supported Dumbbell Row')
      ]},
      {name:'Block B', exercises:[
        ex('Dumbbell Step-Up', '3', '10 /leg', BC, 'Reverse Lunge', 'Dumbbell/Bench'),
        ex('Dumbbell Lateral Raise', '3', '15', BC, 'Seated Lateral Raise')
      ]},
      {name:'Block C', exercises:[
        ex('Overhead Dumbbell Triceps Extension', '3', '12', BC, 'Lying Dumbbell Skull Crusher'),
        ex('Incline Dumbbell Curl', '3', '10–12', BC, 'Standing Alternating Curl', 'Dumbbell/Bench')
      ]},
      {name:'Block D', exercises:[
        ex('Deficit Push-ups (hands on dumbbells)', '3', '15–20', DE, 'Push-ups'),
        ex('Hammer Curl', '3', '12', DE, 'Cross-Body Hammer Curl')
      ]},
      {name:'Block E', exercises:[ ex("Farmer's Carry", '3', '40 m', DE, "Farmer's Hold (45 sec)") ]},
      {name:'★ Signature Hold', exercises:[ ex('Push-up Plank Hold', '', '45–60 sec', '', '', 'Bodyweight') ]}
    ];
    const recovery = [
      {name:'Movement Practice', exercises:[
        ex('Deep Squat Hold', '', '90 sec', '', '', 'Bodyweight'),
        ex('Dead Hang', '', '60–90 sec', '', "Farmer's Hold (no bar)", 'Bar')
      ]},
      {name:'Core Finisher', exercises:[
        ex('Dumbbell Crunch', '2', '10–12', '', ''),
        ex('Prone Superman', '2', '10–12', '', '', 'Bodyweight'),
        ex('Dumbbell Side Bend', '2', '10–12 /side', '', '')
      ]},
      {name:'Breath Work', exercises:[ ex('Box Breathing', '', '3–5 min', '', '', 'None') ]}
    ];
    return { mon: clone(dayA), tue: [], wed: clone(dayB), thu: [], fri: clone(dayC), sat: [], sun: clone(recovery) };
  })();
  // StrongLifts 5×5 (Mehdi Hadim): two full-body workouts alternated three
  // days a week, barbell compounds only, a little more weight every session.
  const STRONGLIFTS_5X5_DAYS = (function(){
    const ex = (name, sets, reps, rest, alternates) => ({ name, rest: rest || '3 min', tempo: '', equipment: 'Barbell', alternates: alternates || '', sets, reps });
    const prog = '5 — add 2.5 kg next session when all 5×5 are done (miss 3 sessions in a row: drop 10% and build back)';
    const A = [{ name:'Workout A', exercises:[
      ex('Squat', '5', prog), ex('Bench Press', '5', prog), ex('Barbell Row', '5', prog, '3 min', 'Pendlay Row')
    ]}];
    const B = [{ name:'Workout B', exercises:[
      ex('Squat', '5', prog), ex('Overhead Press', '5', prog),
      ex('Deadlift', '1', '5 — add 5 kg next session when the set of 5 is done', '3 min')
    ]}];
    // Week 1 is A/B/A; week 2 starts with B (B/A/B), and so on.
    return { mon: clone(A), tue: [], wed: clone(B), thu: [], fri: clone(A), sat: [], sun: [] };
  })();
  // PHUL — Power Hypertrophy Upper Lower (Brandon Campbell): two heavy days
  // and two hypertrophy days, every muscle twice a week.
  const PHUL_DAYS = (function(){
    const ex = (name, sets, reps, rest, equipment, alternates) => ({ name, rest: rest || '', tempo: '', equipment: equipment || '', alternates: alternates || '', sets, reps });
    const H = '3–5 min', AC = '2–3 min', HY = '60–90 sec';
    return {
      mon: [{ name:'Upper Power', exercises:[
        ex('Barbell Bench Press', '3–4', '3–5', H, 'Barbell'), ex('Incline Dumbbell Bench Press', '3–4', '6–10', AC, 'Dumbbell'),
        ex('Bent Over Row', '3–4', '3–5', H, 'Barbell'), ex('Lat Pulldown', '3–4', '6–10', AC, 'Cable', 'Pull-ups'),
        ex('Overhead Press', '2–3', '5–8', AC, 'Barbell'), ex('Barbell Curl', '2–3', '6–10', AC, 'Barbell'), ex('Skullcrusher', '2–3', '6–10', AC, 'EZ-Bar')
      ]}],
      tue: [{ name:'Lower Power', exercises:[
        ex('Squat', '3–4', '3–5', H, 'Barbell'), ex('Deadlift', '3–4', '3–5', H, 'Barbell'), ex('Leg Press', '3–5', '10–15', AC, 'Machine'),
        ex('Leg Curl', '3–4', '6–10', AC, 'Machine'), ex('Calf Raise', '4', '6–10', AC, 'Machine')
      ]}],
      wed: [],
      thu: [{ name:'Upper Hypertrophy', exercises:[
        ex('Incline Barbell Bench Press', '3–4', '8–12', HY, 'Barbell'), ex('Flat Bench Dumbbell Flye', '3–4', '8–12', HY, 'Dumbbell'),
        ex('Seated Cable Row', '3–4', '8–12', HY, 'Cable'), ex('One Arm Dumbbell Row', '3–4', '8–12', HY, 'Dumbbell'),
        ex('Dumbbell Lateral Raise', '3–4', '8–12', HY, 'Dumbbell'), ex('Seated Incline Dumbbell Curl', '3–4', '8–12', HY, 'Dumbbell'),
        ex('Cable Tricep Extension', '3–4', '8–12', HY, 'Cable')
      ]}],
      fri: [{ name:'Lower Hypertrophy', exercises:[
        ex('Front Squat', '3–4', '8–12', HY, 'Barbell'), ex('Barbell Lunge', '3–4', '8–12', HY, 'Barbell'),
        ex('Leg Extension', '3–4', '10–15', HY, 'Machine'), ex('Leg Curl', '3–4', '10–15', HY, 'Machine'),
        ex('Seated Calf Raise', '3–4', '8–12', HY, 'Machine'), ex('Calf Press', '3–4', '8–12', HY, 'Machine')
      ]}],
      sat: [], sun: []
    };
  })();
  // PHAT — Power Hypertrophy Adaptive Training (Layne Norton): two power
  // days, then three hypertrophy days that open with speed work.
  const PHAT_DAYS = (function(){
    const ex = (name, sets, reps, rest, equipment, alternates) => ({ name, rest: rest || '', tempo: '', equipment: equipment || '', alternates: alternates || '', sets, reps });
    const P = 'full recovery (up to 5–6 min)', HY = '1–2 min', SP = '90 sec max';
    const speed = 'explosive — 65–70% of your 3–5 rep max';
    return {
      mon: [{ name:'Upper Body Power', exercises:[
        ex('Bent Over or Pendlay Rows', '3', '3–5', P, 'Barbell'), ex('Weighted Pull-ups', '2', '6–10', P, 'Bodyweight + load'),
        ex('Rack Chins', '2', '6–10', P, 'Bar'), ex('Flat Dumbbell Press', '3', '3–5', P, 'Dumbbell'),
        ex('Weighted Dips', '2', '6–10', P, 'Bodyweight + load'), ex('Seated Dumbbell Shoulder Press', '3', '6–10', P, 'Dumbbell'),
        ex('Cambered Bar Curls', '3', '6–10', P, 'EZ-Bar'), ex('Skull Crushers', '3', '6–10', P, 'EZ-Bar')
      ]}],
      tue: [{ name:'Lower Body Power', exercises:[
        ex('Squats', '3', '3–5', P, 'Barbell'), ex('Hack Squats', '2', '6–10', P, 'Machine'), ex('Leg Extensions', '2', '6–10', P, 'Machine'),
        ex('Stiff-Legged Deadlifts', '3', '5–8', P, 'Barbell'), ex('Glute Ham Raises', '2', '6–10', P, 'GHD', 'Lying Leg Curls'),
        ex('Standing Calf Raises', '3', '6–10', P, 'Machine'), ex('Seated Calf Raises', '2', '6–10', P, 'Machine')
      ]}],
      wed: [],
      thu: [{ name:'Back & Shoulders Hypertrophy', exercises:[
        ex('Bent Over Rows — speed work', '6', '3 (' + speed + ')', SP, 'Barbell'), ex('Rack Chins', '3', '8–12', HY, 'Bar'),
        ex('Seated Cable Rows', '3', '8–12', HY, 'Cable'), ex('Dumbbell Rows (chest on an incline bench)', '2', '12–15', HY, 'Dumbbell', 'Shrugs'),
        ex('Close-Grip Pulldowns', '2', '15–20', HY, 'Cable'), ex('Seated Dumbbell Shoulder Press', '3', '8–12', HY, 'Dumbbell'),
        ex('Upright Rows', '2', '12–15', HY, 'Barbell'), ex('Side Lateral Raises', '3', '12–20', HY, 'Dumbbell/Cable')
      ]}],
      fri: [{ name:'Lower Body Hypertrophy', exercises:[
        ex('Squats — speed work', '6', '3 (' + speed + ')', SP, 'Barbell'), ex('Hack Squats', '3', '8–12', HY, 'Machine'),
        ex('Leg Presses', '2', '12–15', HY, 'Machine'), ex('Leg Extensions', '3', '15–20', HY, 'Machine'),
        ex('Romanian Deadlifts', '3', '8–12', HY, 'Barbell'), ex('Lying Leg Curls', '2', '12–15', HY, 'Machine'),
        ex('Seated Leg Curls', '2', '15–20', HY, 'Machine'), ex('Donkey Calf Raises', '4', '10–15', HY, 'Machine'),
        ex('Seated Calf Raises', '3', '15–20', HY, 'Machine')
      ]}],
      sat: [{ name:'Chest & Arms Hypertrophy', exercises:[
        ex('Flat Dumbbell Press — speed work', '6', '3 (' + speed + ')', SP, 'Dumbbell'), ex('Incline Dumbbell Press', '3', '8–12', HY, 'Dumbbell'),
        ex('Hammer Strength Chest Press', '3', '12–15', HY, 'Machine'), ex('Incline Cable Flyes', '2', '15–20', HY, 'Cable'),
        ex('Cambered Bar Preacher Curls', '3', '8–12', HY, 'EZ-Bar'), ex('Dumbbell Concentration Curls', '2', '12–15', HY, 'Dumbbell'),
        ex('Spider Curls (on an incline bench)', '2', '15–20', HY, 'Dumbbell'), ex('Seated Cambered Bar Tricep Extension', '3', '8–12', HY, 'EZ-Bar'),
        ex('Rope Cable Pressdowns', '2', '12–15', HY, 'Cable'), ex('Cable Kickbacks', '2', '15–20', HY, 'Cable')
      ]}],
      sun: []
    };
  })();
  // Doug Hepburn's Program B: heavy singles for power, then fives for pump,
  // on each main lift — the companion to Program A's 2s-and-3s.
  const HEPBURN_PROGRAM_B_DAYS = (function(){
    const power = 'Singles — start with 5 sets of 1 at a weight you could lift 3 times; add one single each workout up to 8, then add 5–10 lb and start again at 5';
    const pump = '3 → 5 — start at 6 sets of 3 with a weight you could lift 8 times; add a rep to one set each workout up to 6 × 5, then add weight and start again at 3s';
    const lift = (name) => [
      { name, rest:'3–5 min', tempo:'', equipment:'Barbell', alternates:'', sets:'5 → 8', reps: power },
      { name: name + ' (pump)', rest:'2 min', tempo:'', equipment:'Barbell', alternates:'', sets:'6', reps: pump }
    ];
    const day1 = [{ name:'Squat & Bench Day', exercises:[ ...lift('Squat'), ...lift('Bench Press') ]}];
    const day2 = [{ name:'Deadlift & Press Day', exercises:[ ...lift('Deadlift'), ...lift('Overhead Press') ]}];
    return { mon: clone(day1), tue: clone(day2), wed: [], thu: clone(day1), fri: clone(day2), sat: [], sun: [] };
  })();
  // Bill Starr's 5×5 ("The Big Three," The Strongest Shall Survive, 1976):
  // power cleans, bench and squats as a circuit, Mon heavy / Wed light /
  // Fri medium, every one of the five sets a little heavier than the last.
  const STARR_5X5_DAYS = (function(){
    const ramp = (load) => '5 — each set heavier than the last' + (load ? '; top set ' + load : '');
    const ex = (name, sets, reps, rest, equipment, alternates) => ({ name, rest: rest || '', tempo: '', equipment: equipment || 'Barbell', alternates: alternates || '', sets, reps });
    const warm = [
      ex('Leg Extensions', '1–2', '12–15 (warm-up)', '', 'Machine'),
      ex('Leg Curls', '1–2', '12–15 (warm-up)', '', 'Machine')
    ];
    const core = { name:'Abs', exercises:[ ex('Sit-ups', '2', '20–25', '', 'Bodyweight'), ex('Leg Raises', '2', '15–20', '', 'Bodyweight') ]};
    const day = (title, press, load, note) => [
      { name:'Warm-up', exercises: clone(warm) },
      { name: title + ' — circuit: one set of each, then repeat', exercises:[
        ex('Power Clean', '5', ramp(load), '2–3 min'),
        ex(press, '5', ramp(load), '2–3 min'),
        ex('Back Squat (as deep as you can)', '5', ramp(load) + (note || ''), '2–3 min')
      ]},
      clone(core)
    ];
    return {
      mon: day('Heavy Day', 'Bench Press', 'near your best for 5'),
      tue: [],
      wed: day('Light Day', 'Overhead Press', 'about 80% of Monday’s'),
      thu: [],
      fri: day('Medium Day', 'Bench Press', 'about 90% of Monday’s'),
      sat: [], sun: []
    };
  })();
  // Reg Park's 5×5 (Strength and Bulk Training, 1960): three phases of
  // three months each, three days a week. "5×5" means two warm-up sets,
  // then three work sets of five at one weight.
  const PARK_5X5 = (function(){
    const five = '5 — sets 1–2 warm-ups, sets 3–5 at one weight; all three done → add 5–10 lb';
    const ex = (name, sets, reps, rest, equipment) => ({ name, rest: rest || '', tempo: '', equipment: equipment || 'Barbell', alternates: '', sets, reps });
    const backExt = (sets) => ex('45° Back Extension', sets, '10 (bodyweight first; add weight once all sets are done)', '', 'Bench');
    const phases = {
      1: [ backExt('3'), ex('Back Squat', '5', five, '3–5 min'), ex('Bench Press', '5', five, '3–5 min'), ex('Deadlift', '5', five, '3–5 min') ],
      2: [ backExt('3–4'), ex('Front Squat', '5', five, '2 min'), ex('Back Squat', '5', five, '2 min'), ex('Bench Press', '5', five, '2 min'),
           ex('Standing Barbell Press', '5', five, '2 min'), ex('High Pull', '5', five, '2 min'), ex('Deadlift', '5', five, '2 min'),
           ex('Standing Barbell Calf Raise', '5', '25', '2 min') ],
      3: [ backExt('4'), ex('Front Squat', '5', five, '2 min'), ex('Back Squat', '5', five, '2 min'), ex('Standing Barbell Press', '5', five, '2 min'),
           ex('Bench Press', '5', five, '2 min'), ex('Bent-Over Barbell Row', '5', five, '2 min'),
           ex('Deadlift', '5', '3 — warm up over the first sets, then work sets at one weight', '2 min'),
           ex('Behind-the-Neck Press', '5', five, '2 min', 'Barbell (alt: One-Arm Dumbbell Press)'),
           ex('Barbell Curl', '5', five, '2 min'), ex('Lying Triceps Extension', '5', '8', '2 min', 'Barbell/EZ-Bar'),
           ex('Standing Barbell Calf Raise', '5', '25', '2 min') ]
    };
    const week = n => { const d = [{ name:'Phase ' + n, exercises: phases[n] }];
      return { mon: clone(d), tue: [], wed: clone(d), thu: [], fri: clone(d), sat: [], sun: [] }; };
    return { 1: week(1), 2: week(2), 3: week(3) };
  })();
  // The New Rules of Lifting Supercharged (Lou Schuler & Alwyn Cosgrove,
  // 2012): ten programs in three families. The book gives a template per
  // workout — movement categories with sets and reps — and lets the lifter
  // choose the exercises; we fill them with the authors' own sample picks
  // where the book shows them (Basic Training I–IV, Hypertrophy I,
  // Strength & Power I) and similar choices elsewhere. Each exercise's
  // Alternates field names its category, so any exercise from it fits.
  // Rest follows the book: about 30 sec after sets of 12+, 60 sec after
  // 8–10, 90 sec after 4–6.
  const NROL = (function(){
    const restFor = reps => /\b(4|5|6)\b|3–6|5–10|Wave|Set 1/.test(reps) ? '90 sec' : /\b(8|10|8–10)\b/.test(reps) && !/1[2-9]|20/.test(reps) ? '60 sec' : '30 sec';
    const ex = (cat, name, sets, reps, equipment, rest) => ({ name, rest: rest || restFor(reps), tempo: '', equipment: equipment || '', alternates: cat, sets, reps });
    const ramp = { name:'RAMP Warm-up', exercises:[ ex('Alwyn Cosgrove’s RAMP: Range of motion, Activation, Movement Preparation (the book, Chapter 17)', 'RAMP Warm-up', '', 'about 10 min', 'Bodyweight', '') ] };
    const stab = (name, sets, reps) => ex('Core: stability', name, sets, reps || '30 sec', 'Bodyweight', '45 sec');
    const dyn = (name, sets, reps, eq) => ex('Core: dynamic stability', name, sets, reps || '10', eq || 'Bodyweight', '45 sec');
    const finish = (name, rows) => ({ name, exercises: rows });
    const wk = (a, b) => ({ mon: clone(a), tue: [], wed: clone(b), thu: [], fri: clone(a), sat: [], sun: [] });
    const four = (a, b, c, d) => ({ mon: clone(a), tue: clone(b), wed: [], thu: clone(c), fri: clone(d), sat: [], sun: [] });
    // Hypertrophy: the same exercise, a different set/rep scheme each time through (1st & 4th, 2nd & 5th, 3rd & 6th).
    const rot = (cat, name, schemes, eq) => ex(cat, name, schemes.map(x => x[0]).join(' / '),
      schemes.map(x => x[1]).join(' / ') + ' — 1st & 4th time ' + schemes[0].join('×') + ', 2nd & 5th ' + schemes[1].join('×') + ', 3rd & 6th ' + schemes[2].join('×'), eq, '30–90 sec (longer for the heavy sets)');
    const freeZone = finish('Free Zone', [ ex('Free Zone: any two exercises you like', 'Free Zone — two exercises of your choice', 'as many as possible', '8–10 reps, as many sets as you can in 5 min', '', 'as needed') ]);
    const wave = 'Wave — 1st time: 7, 5, 3, 7, 5, 3 · 2nd time: 6, 4, 2, 6, 4, 2 · 3rd time: 5, 3, 1, 5, 3, 1 (heavier each wave)';
    const fiveFiveEight = '5, 5, 5, 5, then 8 at about 90% of your 5-rep weight (rest 2–4 min before the set of 8)';

    const BT = {
      1: wk(
        [ ramp, { name:'Core', exercises:[ stab('Plank', '1–2'), dyn('Side Plank and Row', '1–2', '10 /side', 'Cable/Band') ]},
          { name:'Power', exercises:[ ex('Power', 'Box Jump', '2', '5', 'Box', '60 sec') ]},
          { name:'Block 1', exercises:[ ex('Squat', 'Goblet Squat', '1–2', '15', 'Dumbbell/Kettlebell'), ex('Pull', 'Standing Cable Row', '1–2', '15 /side', 'Cable') ]},
          { name:'Block 2', exercises:[ ex('Single-leg stance', 'Step-Up', '1–2', '15 /side', 'Bench/Box'), ex('Push', 'Push-up', '1–2', '15', 'Bodyweight') ]},
          finish('Intervals', [ ex('Intervals: any cardio machine or movement', 'Intervals', '2–4', '1 min hard / 2 min easy', '', '') ]) ],
        [ ramp, { name:'Core', exercises:[ stab('Side Plank', '1–2', '30 sec /side'), dyn('Plank with Pulldown', '2', '10 /side', 'Cable/Band') ]},
          { name:'Combination', exercises:[ ex('Combination', 'Reverse Lunge and Shoulder Press', '2', '5–8 /side', 'Dumbbell', '60 sec') ]},
          { name:'Block 1', exercises:[ ex('Hinge', 'Swiss-Ball Supine Hip Extension', '1–2', '15', 'Swiss ball'), ex('Push', 'Jackknife Push-up', '1–2', '15', 'Bodyweight') ]},
          { name:'Block 2', exercises:[ ex('Lunge', 'Split Squat', '1–2', '15 /side', 'Bodyweight/Dumbbell'), ex('Pull', 'Kneeling Lat Pulldown', '1–2', '15', 'Cable') ]},
          finish('Intervals', [ ex('Intervals: any cardio machine or movement', 'Intervals', '2–4', '1 min hard / 2 min easy', '', '') ]) ]),
      2: wk(
        [ ramp, { name:'Core', exercises:[ stab('Cable Tall-Kneeling Static Hold', '2', '30 sec') ]},
          { name:'Combination', exercises:[ ex('Combination', 'Romanian Deadlift and Row', '2', '10', 'Dumbbell', '60 sec') ]},
          { name:'Block 1', exercises:[ ex('Lunge', 'Reverse Lunge', '2–4', '10 /side', 'Dumbbell'), ex('Pull', 'Split-Stance Cable Row', '2–4', '10 /side', 'Cable') ]},
          { name:'Block 2', exercises:[ ex('Hinge', 'Swiss-Ball Supine Hip Extension and Leg Curl', '2–4', '10', 'Swiss ball'), ex('Push', 'Push-up (any variation)', '2–4', '10', 'Bodyweight') ]},
          finish('Intervals', [ ex('Intervals: any cardio machine or movement', 'Intervals', '3–6', '30 sec hard / 60 sec easy', '', '') ]) ],
        [ ramp, { name:'Core', exercises:[ dyn('Push-Away', '2', '10', 'Swiss ball') ]},
          { name:'Power', exercises:[ ex('Power', 'Jump Squat', '2', '5–8', 'Bodyweight', '60 sec') ]},
          { name:'Block 1', exercises:[ ex('Single-leg stance', 'Offset-Loaded Step-Up', '2–4', '10 /side', 'Dumbbell/Bench'), ex('Push', 'Jackknife Push-up, Feet Elevated', '2–4', '10', 'Bodyweight') ]},
          { name:'Block 2', exercises:[ ex('Squat', 'Front Squat', '2–4', '10', 'Barbell'), ex('Pull', 'Single-Arm Half-Kneeling Lat Pulldown', '2–4', '10 /side', 'Cable') ]},
          finish('Intervals', [ ex('Intervals: any cardio machine or movement', 'Intervals', '3–6', '30 sec hard / 60 sec easy', '', '') ]) ]),
      3: wk(
        [ ramp, { name:'Core', exercises:[ dyn('Mountain Climber', '2–3', '10 /side') ]},
          { name:'Power', exercises:[ ex('Power', 'Kettlebell Swing', '2', '5–8', 'Kettlebell (no kettlebell: Jump Squats)', '60 sec') ]},
          { name:'Block 1', exercises:[ ex('Hinge', 'Romanian Deadlift', '2–3', '12', 'Barbell/Dumbbell'), ex('Push', 'Push-up (any variation)', '2–3', '12', 'Bodyweight'), ex('Lunge', 'Reverse Lunge (any variation)', '2–3', '12 /side', 'Dumbbell') ]},
          { name:'Block 2', exercises:[ ex('Pull', 'Dumbbell Two-Point Row', '2–3', '12 /side', 'Dumbbell'), ex('Combination', 'Squat and Press', '2–3', '12', 'Dumbbell') ]},
          finish('Intervals', [ ex('Intervals: any cardio machine or movement', 'Intervals', '4–6', '30 sec hard / 30 sec easy', '', '') ]) ],
        [ ramp, { name:'Core', exercises:[ dyn('Cable Tall-Kneeling Chop', '2–3', '10 /side', 'Cable') ]},
          { name:'Power', exercises:[ ex('Power', 'Explosive Push-up', '2', '5–8', 'Bodyweight', '60 sec') ]},
          { name:'Block 1', exercises:[ ex('Squat', 'Offset Overhead Squat', '2–3', '12', 'Dumbbell'), ex('Pull', 'Standing Lat Pulldown', '2–3', '12', 'Cable'), ex('Single-leg stance', 'Single-Leg Romanian Deadlift', '2–3', '12 /side', 'Dumbbell') ]},
          { name:'Block 2', exercises:[ ex('Push', 'Dumbbell Shoulder Press', '2–3', '12', 'Dumbbell'), ex('Combination', 'Push-up and One-Arm Row', '2–3', '12 /side', 'Dumbbell') ]},
          finish('Intervals', [ ex('Intervals: any cardio machine or movement', 'Intervals', '4–6', '30 sec hard / 30 sec easy', '', '') ]) ]),
      4: wk(
        [ ramp, { name:'Core', exercises:[ dyn('Swiss-Ball Rollout', '2', '10', 'Swiss ball') ]},
          { name:'Combination', exercises:[ ex('Combination', 'Squat and Press', '2', '8–10', 'Dumbbell', '60 sec') ]},
          { name:'Block 1', exercises:[ ex('Hinge', 'Rack Deadlift', '3–4', '10', 'Barbell'), ex('Push', 'Standing Single-Arm Cable Chest Press', '3–4', '10 /side', 'Cable') ]},
          { name:'Block 2', exercises:[ ex('Single-leg stance', 'Step-Up (any variation)', '3–4', '10 /side', 'Dumbbell/Bench'), ex('Pull', 'Inverted Row', '3–4', '10', 'Bar') ]},
          { name:'Metabolic — circuit, 15–20 sec each', exercises:[ ex('Hinge', 'Romanian Deadlift', '1–2', '15–20 sec', 'Dumbbell', '—'), ex('Push', 'Push-up (any variation)', '1–2', '15–20 sec', 'Bodyweight', '—'),
            ex('Locomotion', 'Loaded Carry (any)', '1–2', '15–20 sec', 'Dumbbell', '—'), ex('Pull', 'Standing Cable Row', '1–2', '15–20 sec', 'Cable', '90 sec after the round') ]} ],
        [ ramp, { name:'Core', exercises:[ stab('Side Plank (any variation)', '2', '30 sec /side') ]},
          { name:'Combination', exercises:[ ex('Combination', 'Romanian Deadlift and Row', '2', '8–10', 'Dumbbell', '60 sec') ]},
          { name:'Block 1', exercises:[ ex('Squat', 'Front Squat', '3–4', '10', 'Barbell'), ex('Pull', 'Dumbbell Three-Point Row', '3–4', '10 /side', 'Dumbbell') ]},
          { name:'Block 2', exercises:[ ex('Lunge', 'Rear-Foot-Elevated Split Squat', '3–4', '10 /side', 'Dumbbell/Bench'), ex('Push', 'Dumbbell Bench Press', '3–4', '10', 'Dumbbell/Bench') ]},
          { name:'Metabolic — circuit, 15–20 sec each', exercises:[ ex('Squat', 'Goblet Squat', '1–2', '15–20 sec', 'Dumbbell', '—'), ex('Pull', 'Kneeling Lat Pulldown', '1–2', '15–20 sec', 'Cable', '—'),
            ex('Locomotion', 'Bear Crawl', '1–2', '15–20 sec', 'Bodyweight', '—'), ex('Push', 'Dumbbell Shoulder Press', '1–2', '15–20 sec', 'Dumbbell', '90 sec after the round') ]} ])
    };
    const H1a = [['4','6'], ['2','20'], ['3','12']], H1b = [['3','12'], ['4','6'], ['2','20']];
    const H2a = [['4','4'], ['2','12'], ['3','8']], H2b = [['3','8'], ['4','4'], ['2','12']];
    const H3a = [['4','5'], ['2','15'], ['3','10']], H3b = [['3','10'], ['4','5'], ['2','15']];
    const hcore = [ stab('Plank (any variation)', '1–2'), dyn('Cable Half-Kneeling Chop', '1–2', '10 /side', 'Cable') ];
    const hcoreB = [ stab('Side Plank (any variation)', '1–2', '30 sec /side'), dyn('Swiss-Ball Mountain Climber', '1–2', '10 /side', 'Swiss ball') ];
    const complex = (sets, reps) => finish('Complex', [ ex('Complex: three exercises back to back with one weight', 'Complex — e.g. Romanian Deadlift → Bent-Over Row → Squat and Press', sets, reps + ' each exercise, no rest between them', 'Barbell/Dumbbell', '90 sec after the round') ]);
    const HY = {
      1: wk(
        [ ramp, { name:'Core', exercises: hcore },
          { name:'Block 1', exercises:[ rot('Single-leg stance', 'Single-Leg Romanian Deadlift', H1a, 'Dumbbell'), rot('Push', 'Dumbbell Bench Press', H1a, 'Dumbbell/Bench') ]},
          { name:'Block 2', exercises:[ rot('Hinge', 'Deadlift', H1a, 'Barbell'), rot('Pull', 'Dumbbell Three-Point Row', H1a, 'Dumbbell') ]}, complex('3–4', '8') ],
        [ ramp, { name:'Core', exercises: hcoreB },
          { name:'Block 1', exercises:[ rot('Lunge', 'Bulgarian Split Squat', H1b, 'Dumbbell/Bench'), rot('Push', 'Dumbbell Shoulder Press', H1b, 'Dumbbell') ]},
          { name:'Block 2', exercises:[ rot('Squat', 'Front Squat', H1b, 'Barbell'), rot('Pull', 'Inverted Row', H1b, 'Bar') ]}, complex('3–4', '8') ]),
      2: wk(
        [ ramp, { name:'Core', exercises: hcore },
          { name:'Block 1', exercises:[ rot('Squat', 'Back Squat', H2a, 'Barbell'), rot('Pull', 'Chin-up', H2a, 'Bar') ]},
          { name:'Block 2', exercises:[ rot('Lunge', 'Reverse Lunge', H2a, 'Dumbbell'), rot('Push', 'Dumbbell Bench Press', H2a, 'Dumbbell/Bench') ]}, complex('4–5', '5') ],
        [ ramp, { name:'Core', exercises: hcoreB },
          { name:'Block 1', exercises:[ rot('Hinge', 'Romanian Deadlift', H2b, 'Barbell'), rot('Pull', 'Dumbbell Three-Point Row', H2b, 'Dumbbell') ]},
          { name:'Block 2', exercises:[ rot('Single-leg stance', 'Single-Leg Romanian Deadlift', H2b, 'Dumbbell'), rot('Push', 'Dumbbell Shoulder Press', H2b, 'Dumbbell') ]}, complex('4–5', '5') ]),
      3: wk(
        [ ramp, { name:'Core', exercises:[ dyn('Swiss-Ball Jackknife', '2', '10', 'Swiss ball') ]},
          { name:'Block 1', exercises:[ rot('Lunge', 'Bulgarian Split Squat', H3a, 'Dumbbell/Bench'), rot('Push', 'Incline Dumbbell Press', H3a, 'Dumbbell/Bench') ]},
          { name:'Block 2', exercises:[ rot('Hinge', 'Deadlift', H3a, 'Barbell'), rot('Pull', 'Inverted Row', H3a, 'Bar') ]}, complex('4–5', '6') ],
        [ ramp, { name:'Core', exercises:[ dyn('Cable Tall-Kneeling Chop', '2', '10 /side', 'Cable') ]},
          { name:'Block 1', exercises:[ rot('Single-leg stance', 'Step-Up', H3b, 'Dumbbell/Bench'), rot('Push', 'Dumbbell Bench Press', H3b, 'Dumbbell/Bench') ]},
          { name:'Block 2', exercises:[ rot('Squat', 'Front Squat', H3b, 'Barbell'), rot('Pull', 'Chin-up', H3b, 'Bar') ]}, complex('4–5', '6') ])
    };
    const spCore = [ stab('Plank (any variation)', '2'), dyn('Swiss-Ball Jackknife', '2', '10', 'Swiss ball') ];
    const spCoreB = [ stab('Side Plank (any variation)', '2', '30 sec /side'), dyn('Suspended Fallout', '2', '10', 'Suspension trainer') ];
    const dynOnly = [ dyn('Swiss-Ball Rollout', '2', '10', 'Swiss ball') ];
    const max = (cat, name, sets, reps, eq) => ex(cat, name, sets, reps, eq, '2 min (full recovery)');
    const SP = {
      1: wk(
        [ ramp, { name:'Core', exercises: spCore },
          { name:'Maximum Strength & Power', exercises:[ max('Hinge', 'Deadlift', '2–3', '6', 'Barbell'), max('Push', 'Dumbbell Bench Press', '2–3', '6', 'Dumbbell/Bench') ]},
          { name:'Muscle Hypertrophy & Endurance — 2a to 2d in a row', exercises:[ ex('Lunge', 'Forward Lunge', '2', '15 /side', 'Dumbbell', '60 sec after the round'), ex('Pull', 'Standing Lat Pulldown', '2', '15', 'Cable', '—'),
            ex('Single-leg stance', 'Overhead Step-Up', '2', '15 /side', 'Dumbbell/Bench', '—'), ex('Push', 'Modified Handstand Push-up', '2', '15', 'Bodyweight', '—') ]}, freeZone ],
        [ ramp, { name:'Core', exercises: spCoreB },
          { name:'Maximum Strength & Power', exercises:[ max('Squat', 'Front Squat', '2–3', '6', 'Barbell'), max('Pull', 'Chin-up', '2–3', '6', 'Bar') ]},
          { name:'Muscle Hypertrophy & Endurance — 2a to 2d in a row', exercises:[ ex('Single-leg stance', 'Single-Leg Romanian Deadlift', '2', '15 /side', 'Dumbbell', '60 sec after the round'), ex('Push', 'Dumbbell Shoulder Press', '2', '15', 'Dumbbell', '—'),
            ex('Lunge', 'Reverse Lunge (any variation)', '2', '15 /side', 'Dumbbell', '—'), ex('Pull', 'Dumbbell Three-Point Row', '2', '15 /side', 'Dumbbell', '—') ]}, freeZone ]),
      2: (function(){
        const hypAC = { name:'Muscle Hypertrophy', exercises:[ ex('Push', 'Dumbbell Shoulder Press', '2–3', '8', 'Dumbbell'), ex('Single-leg stance', 'Step-Up', '2–3', '8 /side', 'Dumbbell/Bench'),
          ex('Pull', 'Dumbbell Three-Point Row', '3', '8 /side', 'Dumbbell'), ex('Locomotion', "Farmer's Walk", '2', '20–30 sec', 'Dumbbell', '60 sec') ]};
        const hypBD = { name:'Muscle Hypertrophy', exercises:[ ex('Lunge', 'Reverse Lunge', '3', '8 /side', 'Dumbbell'), ex('Push', 'Push-up (any variation)', '3', '8', 'Bodyweight'),
          ex('Pull', 'Standing Cable Row', '2–3', '12', 'Cable'), ex('Hinge', 'Romanian Deadlift', '2–3', '8', 'Barbell/Dumbbell') ]};
        const day = (cat, name, sets, reps, eq, hyp) => [ ramp, { name:'Core', exercises: clone(dynOnly) },
          { name:'Maximum Strength & Power', exercises:[ max(cat, name, sets, reps, eq) ]}, clone(hyp), freeZone ];
        return four(day('Squat', 'Back Squat', '5', fiveFiveEight, 'Barbell', hypAC), day('Pull', 'Chin-up (weighted when you can)', '3', '3–6 — your best three sets', 'Bar', hypBD),
                    day('Hinge', 'Deadlift', '5', fiveFiveEight, 'Barbell', hypAC), day('Push', 'Bench Press or Shoulder Press', '5', fiveFiveEight, 'Barbell', hypBD));
      })(),
      3: (function(){
        const hypAC = { name:'Muscle Hypertrophy', exercises:[ ex('Pull', 'Inverted Row', '2–3', '10', 'Bar'), ex('Lunge', 'Reverse Lunge', '2–3', '10 /side', 'Dumbbell'),
          ex('Push', 'Push-up (any variation)', '2–3', '12', 'Bodyweight'), ex('Mobility', 'Mobility drill from the RAMP warm-up', '2', '10–12', 'Bodyweight') ]};
        const hypBD = { name:'Muscle Hypertrophy', exercises:[ ex('Single-leg stance', 'Single-Leg Romanian Deadlift', '3', '10 /side', 'Dumbbell'), ex('Pull', 'Dumbbell Three-Point Row', '3', '10 /side', 'Dumbbell'),
          ex('Hinge', 'Swiss-Ball Supine Hip Extension and Leg Curl', '3', '10', 'Swiss ball'), ex('Push', 'Dumbbell Shoulder Press', '3', '10', 'Dumbbell') ]};
        const day = (cat, name, sets, reps, eq, hyp) => [ ramp, { name:'Core', exercises: clone(dynOnly) },
          { name:'Maximum Strength & Power', exercises:[ max(cat, name, sets, reps, eq) ]}, clone(hyp), freeZone ];
        return four(day('Hinge', 'Deadlift', '6', wave, 'Barbell', hypAC), day('Push', 'Bench Press', '6', wave, 'Barbell', hypBD),
                    day('Squat', 'Back Squat', '6', wave, 'Barbell', hypAC), day('Pull', 'Chin-up', '3', '5–10 — beat last time’s reps with the same load', 'Bar', hypBD));
      })()
    };
    return { BT, HY, SP };
  })();
  // 1% Fitness, Principle #5 — "Superset Upper With Lower & Push With
  // Pull" (Mike Sheridan): every superset pairs a leg movement with an
  // upper-body one, upper pulls with lower "bends" (squat/knee-dominant),
  // upper pushes with lower "extends" (hinge/hip-dominant) so grip never
  // fails twice, and the legs go first; the two exercises of a pair
  // alternate set by set. This is the book's Phase 3.1 (weeks 1–2): the strength
  // workout twice a week, a HIIT day once a week.
  const ONE_PERCENT_SUPERSET_DAYS = (function(){
    const ex = (name, sets, reps, rest, tempo, equipment, alternates) => ({ name, rest, tempo: tempo || '', equipment: equipment || '', alternates: alternates || '', sets, reps });
    const warm = { name:'A — Dynamic Warm-Up', exercises:[ ex('1% Fitness Dynamic Warm-Up', '1', '5 each drill', '120 sec', '1-1-1-1', 'Bodyweight') ] };
    const strength = [
      warm,
      { name:'B — Bend + Pull (legs first)', exercises:[
        ex('Bent-Knee Deadlift — 1 Dumbbell, Sumo Grip', '3', '10–12', '30 sec', '4-0-1-0', 'Dumbbell', 'Bend (knee-dominant)'),
        ex('Seated Row — Low Pulley, Neutral Grip', '3', '10–12', '30 sec', '4-0-1-0', 'Cable', 'Upper-body pull')
      ]},
      { name:'C — Push + Extend', exercises:[
        ex('1-Arm Standing Overhead Press — 1 Dumbbell, Neutral Grip', '3', '10–12 /side', '30 sec', '4-0-1-0', 'Dumbbell', 'Upper-body push'),
        ex('45° Back Extension — Dumbbell or Bodyweight', '3', '10–12', '30 sec', '4-0-1-0', 'Bench/GHD', 'Extend (hip-dominant)')
      ]},
      { name:'D — Carry', exercises:[ ex('High Farmer’s Carry — 1 Dumbbell, Goblet Grip', '3', '80 yd (about 73 m)', '60 sec', 'slow', 'Dumbbell') ]}
    ];
    const hiit = [
      warm,
      { name:'B — HIIT', exercises:[
        ex('Step-Up + Knee Drive', '3', '20 sec work', '20 sec', '', 'Bench/Box'),
        ex('Active Plank — Foot Walks', '3', '20 sec work', '60 sec', '', 'Bodyweight')
      ]},
      { name:'C — HIIT', exercises:[
        ex('Sumo Squat + Kick or Knee Drive', '3', '20 sec work', '20 sec', '', 'Bodyweight'),
        ex('Active Plank — Triceps Get-Ups', '3', '20 sec work', '60 sec', '', 'Bodyweight')
      ]}
    ];
    return { mon: clone(strength), tue: [], wed: [], thu: clone(strength), fri: [], sat: clone(hiit), sun: [] };
  })();
  // The Women's Health Big Book of Exercises (Rodale, 2010), Chapter 3,
  // "The Exercise Plan" by Craig Rasmussen: a choose-your-own fat-loss
  // workout. A core straight set, two pairs by body part, 3 × 12 with a
  // minute's rest throughout, then a cardio finisher. Workouts A and B
  // alternate three days a week. The book names the category for each slot
  // and a few examples; we fill each slot with one of them and list the
  // others (or "any ...") as alternates.
  const WH_EXERCISE_PLAN_DAYS = (function(){
    const ex = (name, equipment, alternates, reps) => ({ name, rest:'1 min', tempo:'', equipment, alternates, sets:'3', reps: reps || '12' });
    const warm = { name:'Warm-up', exercises:[ { name:'Warm-up of your choice', rest:'', tempo:'', equipment:'Bodyweight', alternates:'Build it from the book’s Chapter 12 warm-up exercises', sets:'', reps:'5–10 min' } ] };
    const cardio = { name:'Cardio Finisher — straight after the weights', exercises:[ { name:'Cardio Finisher', rest:'', tempo:'', equipment:'Any', alternates:'Any finisher from the book’s Chapter 14 (e.g. 400 Repeats, In-and-Outs) or sprints, bike or rower intervals', sets:'', reps:'as the finisher you choose sets out' } ] };
    const A = [ warm,
      { name:'1 — Core (straight sets)', exercises:[ ex('Plank', 'Bodyweight', 'Any core stability exercise: Side Plank, Mountain Climber, Swiss-Ball Jackknife', 'hold for the time the exercise calls for') ]},
      { name:'2A/2B — Glutes & Hamstrings (one leg) + Upper Back', exercises:[
        ex('Dumbbell Stepup', 'Dumbbell/Bench', 'Any single-leg glutes/hamstrings move: Single-Leg Barbell Straight-Leg Deadlift, Single-Leg Hip Raise', '12 /leg'),
        ex('Dumbbell Row', 'Dumbbell', 'Any upper-back row: Barbell Row, Cable Row') ]},
      { name:'3A/3B — Quadriceps (both legs) + Chest', exercises:[
        ex('Goblet Squat', 'Dumbbell', 'Any two-leg squat: Dumbbell Squat, Barbell Front Squat'),
        ex('Dumbbell Bench Press', 'Dumbbell/Bench', 'Any chest exercise: Pushup, Swiss-Ball Dumbbell Chest Press') ]},
      cardio ];
    const B = [ warm,
      { name:'1 — Core (straight sets)', exercises:[ ex('Side Plank', 'Bodyweight', 'Any core stability exercise: Plank, Mountain Climber, Swiss-Ball Jackknife', 'hold for the time the exercise calls for, each side') ]},
      { name:'2A/2B — Quadriceps (one leg) + Lats', exercises:[
        ex('Dumbbell Split Squat', 'Dumbbell', 'Any single-leg quad move: Barbell or Dumbbell Lunge, Barbell Split Squat, Single-Leg Squat', '12 /leg'),
        ex('Lat Pulldown', 'Cable', 'Any lats exercise: Chinup, Pullover') ]},
      { name:'3A/3B — Glutes & Hamstrings (both legs) + Shoulders', exercises:[
        ex('Dumbbell Straight-Leg Deadlift', 'Dumbbell', 'Any two-leg glutes/hamstrings move: Barbell Deadlift, Swiss-Ball Hip Raise and Leg Curl'),
        ex('Dumbbell Shoulder Press', 'Dumbbell', 'Any shoulder exercise: Lateral Raise, Scaption and Shrug') ]},
      cardio ];
    // Week 1 is A/B/A; week 2 is B/A/B, and so on.
    return { mon: clone(A), tue: [], wed: clone(B), thu: [], fri: clone(A), sat: [], sun: [] };
  })();
  const PROGRAM_PRESETS = [
    {
      id: 'bnb-full-body-dumbbell',
      name: "Full-Body Dumbbell (3 Days)",
      description: "Bell(e)s N' Barz's own way of training with nothing but dumbbells, a bench and the floor. Three full-body days (Mon squat & horizontal push/pull, Wed hinge, single leg & overhead, Fri chest, shoulders & arms + carry) and a Sunday recovery. Each day opens with a Warm-up block (Pulse, Mobilize, Core, Activate, Potentiate), runs lettered A1/A2 superset blocks, and ends with a Signature Hold. Rest 90–120 sec on Block A, 60–90 on B/C, 45–60 on D/E. Each day's Block A1 (Goblet Squat, Romanian Deadlift, Incline Press) runs a Hepburn double progression: add a rep per session until all sets hit 10, then the next dumbbells. Every bench move has a floor alternate.",
      data: FULL_BODY_DUMBBELL_DAYS
    },
    {
      id: 'old-school-70s',
      name: "Old School 70’s Split",
      description: "High-volume 3-day body-part split (Chest/Back → Shoulders/Arms → Legs, each repeated twice a week, Sunday off) built around the training approach of 1970s golden-era bodybuilders — Arnold Schwarzenegger, Frank Zane, Franco Columbu, and others. 5 sets per exercise, pyramiding weight up each set, ~1 minute rest. Source: Gustavo Mirabal Castro, “The Old School 70’s Bodybuilding Routine” (see Sources & Credits).",
      data: OLD_SCHOOL_70S_DAYS
    },
    {
      id: 'old-school-70s-iron-grit',
      name: "Old School 70’s Routine (Iron & Grit)",
      description: "A second take on the same golden-era split, order swapped to Chest/Back → Legs → Shoulders/Arms (each repeated twice a week, Sunday off). 5 sets per exercise, ~1 minute rest, built for high volume and training to failure — pair with forced reps, drop sets, rest-pause, and other techniques described in the companion blog post. Source: Jordan, “The Old School 70’s Bodybuilding Routine,” Iron & Grit (see Sources & Credits).",
      data: OLD_SCHOOL_IRON_GRIT_DAYS
    },
    {
      id: 'serge-nubret-high-volume',
      name: "Serge Nubret’s High-Volume Routine",
      description: "Extreme-volume 3-day split (Chest/Quads → Back/Hamstrings → Shoulders/Arms/Calves, each repeated twice a week, Sunday full rest) built around Serge Nubret's \"pump\" training — moderate weight, 6–8 sets of 12+ reps per exercise, short (30–60s) rest, no true 1-rep-max attempts. A very different volume-and-load profile than the other Old School presets — read the companion blog post before assigning it. Source: “Serge Nubret’s Old School Workout Routine,” Cast Iron Strength (see Sources & Credits).",
      data: SERGE_NUBRET_DAYS
    },
    {
      id: 'lee-haney-3-on-1-off',
      name: "Lee Haney’s 3-On-1-Off Split",
      description: "8-time Mr. Olympia Lee Haney's rotating split: Chest/Arms → Legs → Back/Shoulders → Rest, repeating continuously every 4 days rather than locking to specific weekdays (calves/abs trained on every training day). This preset fits one pass of that cycle into a calendar week for convenience — see the companion blog post for how the true rest day drifts if you keep the exact 4-day rotation going. Moderate 4–5 sets of 6–15 reps per exercise. Source: “Old School Workout: Lee Haney,” Generation Iron (see Sources & Credits).",
      data: LEE_HANEY_DAYS
    },
    {
      id: 'kazmaier-power-building',
      name: "Bill Kazmaier’s Power-Building Split",
      description: "Strongman/powerlifter Bill Kazmaier's 4-day \"heavy/light\" hybrid: Chest/Shoulders/Triceps and Legs/Back/Arms each trained twice a week, alternating a heavy day and a light day per lift (e.g. heavy squats paired with light deadlifts, then flipped later in the week). Mostly moderate 8-10 rep sets rather than max-effort singles. Source: Evette Hinzman, “Classic Strength Training with Bill Kazmaier” (see Sources & Credits).",
      data: KAZMAIER_DAYS
    },
    {
      id: 'hepburn-program-a',
      name: "Doug Hepburn’s Program A",
      description: "1953 Weightlifting World Champion Doug Hepburn's double-progression strength method: squat, bench press, and deadlift each trained twice a week, 8 sets per lift starting at 2 reps a set. Each workout, one more 2-rep set becomes a 3-rep set — once all 8 sets read 3 reps, add 10 lb and restart at 2s. A slow, steady, low-drama way to add weight to the bar every month. Source: “Extreme Powerbuilding: The Hepburn Method,” Muscle & Strength (see Sources & Credits).",
      data: HEPBURN_PROGRAM_A_DAYS
    },
    {
      id: 'hepburn-program-b',
      name: "Doug Hepburn’s Program B",
      description: "The companion to Program A: each main lift gets a power part and a pump part. Power — singles at a weight you could lift 3 times, starting with 5 and adding one each workout until you reach 8; then add 5–10 lb and go back to 5. Pump — 6 sets of 3 at a weight you could lift 8 times, adding a rep to one set each workout until 6 × 5; then add weight and go back to 3s. Squat & Bench on Mon/Thu, Deadlift & Overhead Press on Tue/Fri. Hepburn himself described his bench routine as singles followed by fives. Demanding: run it for about six weeks, then switch to something lighter. Sources: Mike Mahler's summary of Hepburn's method (T-Nation), and Hepburn's own description quoted by Breaking Muscle; the details vary between sources (see Sources & Credits).",
      data: HEPBURN_PROGRAM_B_DAYS
    },
    {
      id: 'stronglifts-5x5',
      name: "StrongLifts 5×5",
      description: "Mehdi Hadim's 5×5: two full-body barbell workouts alternated three days a week — Workout A (Squat, Bench Press, Barbell Row) and Workout B (Squat, Overhead Press, Deadlift 1×5). Mon/Wed/Fri as A/B/A, then B/A/B the next week. 5 sets of 5 at the same weight, about 3 minutes' rest (5 after a failed set), and 2.5 kg more every session you complete all reps (5 kg on the deadlift). Fail a weight three sessions in a row: drop it 10% and build back. Simple linear progression for beginners and anyone returning to the barbell. Source: Mehdi Hadim, StrongLifts.com (see Sources & Credits).",
      data: STRONGLIFTS_5X5_DAYS
    },
    {
      id: 'bill-starr-5x5',
      name: "Bill Starr’s 5×5 (The Big Three)",
      description: "Strength coach Bill Starr's original 5×5 from The Strongest Shall Survive (1976): power cleans, bench press and deep back squats, done as a circuit (one set of each, then repeat) on Monday (heavy), Wednesday (light, about 80% of Monday's weights, with the overhead press in place of the bench) and Friday (medium, about 90%). Unlike Reg Park's version, every one of the five sets is a little heavier than the last. Leg extensions and leg curls warm the legs up; sit-ups and leg raises finish. When you get all 5 reps on the fifth set, raise every set next time — small jumps, as little as 2.5 lb a week. Sources: Breaking Muscle and The Barbell summaries of Starr's book; details vary between later versions (see Sources & Credits).",
      data: STARR_5X5_DAYS
    },
    {
      id: 'reg-park-5x5-phase-1',
      name: "Reg Park’s 5×5 — Phase 1",
      description: "Three-time Mr Universe Reg Park's 5×5 from Strength and Bulk Training for Weight Lifters and Body Builders (1960) — the routine Arnold grew up on. Phase 1 (three months, three days a week): 45° back extensions 3×10, then back squat, bench press and deadlift 5×5. Sets 1–2 are warm-ups, sets 3–5 work sets at one weight; when all three work sets reach 5, add 5–10 lb. 3–5 min between work sets, no training to failure. At the end of the phase, test a single, take four days off, then move to Phase 2. Sources: Breaking Muscle's summary and a transcription of the book (see Sources & Credits).",
      data: PARK_5X5[1]
    },
    {
      id: 'reg-park-5x5-phase-2',
      name: "Reg Park’s 5×5 — Phase 2",
      description: "Phase 2 of Reg Park's 5×5 (three more months, three days a week), for bodybuilders: back extensions 3–4×10, front squat, back squat, bench press, standing barbell press, high pull and deadlift at 5×5, and standing calf raises 5×25. Same 2 warm-up + 3 work set rule, 2 min rest. Park gave lifters aiming at Olympic weightlifting a different Phase 2 with lunges and power cleans; this is the bodybuilder version. Sources: Breaking Muscle's summary and a transcription of the book (see Sources & Credits).",
      data: PARK_5X5[2]
    },
    {
      id: 'reg-park-5x5-phase-3',
      name: "Reg Park’s 5×5 — Phase 3",
      description: "Phase 3 of Reg Park's 5×5 (three months, three days a week): back extensions 4×10, front squat, back squat, standing press, bench press, bent-over row, behind-the-neck press (or one-arm dumbbell press) and barbell curl at 5×5, deadlift 5×3, lying triceps extension 5×8 and calf raises 5×25. 2 min rest. After Phase 3, test your singles and start again at Phase 1 with heavier weights. Sources: Breaking Muscle's summary and a transcription of the book; secondary sources differ on some set counts in this phase (see Sources & Credits).",
      data: PARK_5X5[3]
    },
    {
      id: 'phul',
      name: "PHUL — Power Hypertrophy Upper Lower",
      description: "Brandon Campbell's 4-day upper/lower split: Upper Power (Mon) and Lower Power (Tue) with heavy compounds at 3–5 reps, then Upper Hypertrophy (Thu) and Lower Hypertrophy (Fri) at 8–15 reps — every muscle trained twice a week, once heavy and once for size. Leave at least one rep in the tank on every set; rest 3–5 min on the heavy compounds. Don't put the two power days or the two hypertrophy days back to back without rest. Usually run in 4-week blocks. Source: Brandon Campbell, “PHUL Workout,” Muscle & Strength (see Sources & Credits).",
      data: PHUL_DAYS
    },
    {
      id: 'phat',
      name: "PHAT — Layne Norton's Power Hypertrophy Adaptive Training",
      description: "Dr Layne Norton's 5-day power/hypertrophy split: Upper Power and Lower Power (3–5 rep compounds, full rest — up to 5–6 min), a rest day, then Back & Shoulders, Lower Body and Chest & Arms hypertrophy days that each open with speed work (6 × 3 at 65–70% of the 3–5 rep max, no more than 90 sec rest) before 8–20 rep work at 1–2 min rest. Stop 1–2 reps short of failure early on; failure only on the last 1–2 sets, and not in the first 2–4 weeks. Rotate the power movements every 2–3 weeks; deload every 6–12 weeks at 60–70% for 1–3 weeks. Beginners: drop one assistance exercise per day. Source: Layne Norton, “PHAT — Power Hypertrophy Adaptive Training,” biolayne.com (see Sources & Credits).",
      data: PHAT_DAYS
    },
    {
      id: 'nrol-basic-training-1',
      name: "NROL Supercharged — Basic Training I",
      description: "The starting point for most lifters. Two full-body workouts (A and B) alternated three days a week, each workout done about six times (four if you've trained this way before). A RAMP warm-up, two core exercises, a power or combination move, then two pairs of strength exercises at 1–2 × 15 — squat/pull and single-leg/push on A, hinge/push and lunge/pull on B — and 2–4 one-minute intervals with two minutes' easy recovery. Source: Lou Schuler & Alwyn Cosgrove, The New Rules of Lifting Supercharged (Avery, 2012) — adapted; see Sources & Credits.",
      data: NROL.BT[1]
    },
    {
      id: 'nrol-basic-training-2',
      name: "NROL Supercharged — Basic Training II",
      description: "Basic Training II: the same A/B structure with heavier work — four strength exercises at 2–4 × 10 (lunge/pull and hinge/push on A, single-leg/push and squat/pull on B), a combination or power move, and 3–6 intervals of 30 seconds hard and 60 seconds easy. To make it tougher, do a mobility or core exercise between pairs instead of resting. Source: Lou Schuler & Alwyn Cosgrove, The New Rules of Lifting Supercharged (Avery, 2012) — adapted; see Sources & Credits.",
      data: NROL.BT[2]
    },
    {
      id: 'nrol-basic-training-3',
      name: "NROL Supercharged — Basic Training III",
      description: "Basic Training III: two alternating trios and pairs of strength exercises at 2–3 × 12, ending each workout with a combination exercise (squat and press, push-up and row), plus a power move and 4–6 intervals of 30 seconds on, 30 off. For more, run 1a/1b/1c with no rest between them, then rest at least a minute. Source: Lou Schuler & Alwyn Cosgrove, The New Rules of Lifting Supercharged (Avery, 2012) — adapted; see Sources & Credits.",
      data: NROL.BT[3]
    },
    {
      id: 'nrol-basic-training-4',
      name: "NROL Supercharged — Basic Training IV",
      description: "Basic Training IV: strength pairs at 3–4 × 10, then a metabolic circuit instead of intervals — three strength moves and one locomotion move (a carry or a crawl) for 15–20 seconds each. Start here if you've already done the NROL for Life programs. For more, run 1a/1b/2a/2b as one giant set with 90 seconds' rest. Source: Lou Schuler & Alwyn Cosgrove, The New Rules of Lifting Supercharged (Avery, 2012) — adapted; see Sources & Credits.",
      data: NROL.BT[4]
    },
    {
      id: 'nrol-hypertrophy-1',
      name: "NROL Supercharged — Hypertrophy I",
      description: "Hypertrophy I brings in undulating periodization: every strength exercise rotates through three schemes — 4 × 6, 2 × 20 and 3 × 12 — so the 1st and 4th time you do a workout use one scheme, the 2nd and 5th another, and the 3rd and 6th the third. A and B run out of step, so each session has a different feel. Core work first and a three-exercise barbell or dumbbell complex (3–4 × 8) to finish. Source: Lou Schuler & Alwyn Cosgrove, The New Rules of Lifting Supercharged (Avery, 2012) — adapted; see Sources & Credits.",
      data: NROL.HY[1]
    },
    {
      id: 'nrol-hypertrophy-2',
      name: "NROL Supercharged — Hypertrophy II",
      description: "Hypertrophy II: the same rotating system with sets of 4, 8 and 12 (4 × 4, 3 × 8, 2 × 12), heavier than Hypertrophy I. The finishing complex moves to 4–5 × 5. Keep the same exercises through the program so you can see the numbers climb. Source: Lou Schuler & Alwyn Cosgrove, The New Rules of Lifting Supercharged (Avery, 2012) — adapted; see Sources & Credits.",
      data: NROL.HY[2]
    },
    {
      id: 'nrol-hypertrophy-3',
      name: "NROL Supercharged — Hypertrophy III",
      description: "Hypertrophy III: the rotation becomes 4 × 5, 3 × 10 and 2 × 15, with the complex at 4–5 × 6. By the end of the three Hypertrophy programs most lifters handle their old heavy weights for double the reps. Source: Lou Schuler & Alwyn Cosgrove, The New Rules of Lifting Supercharged (Avery, 2012) — adapted; see Sources & Credits.",
      data: NROL.HY[3]
    },
    {
      id: 'nrol-strength-power-1',
      name: "NROL Supercharged — Strength & Power I",
      description: "Strength & Power I: each workout opens with two maximum-strength lifts at 2–3 × 6 (deadlift and bench on A, front squat and chin-ups on B) with thorough warm-up sets and full rest, then four hypertrophy-and-endurance exercises at 2 × 15 done back to back, and a Free Zone finish: any two exercises, 8–10 reps, as many sets as you can in 5 minutes. Each workout six times. Source: Lou Schuler & Alwyn Cosgrove, The New Rules of Lifting Supercharged (Avery, 2012) — adapted; see Sources & Credits.",
      data: NROL.SP[1]
    },
    {
      id: 'nrol-strength-power-2',
      name: "NROL Supercharged — Strength & Power II",
      description: "Strength & Power II: four workouts (A–D), each built on one max-strength lift — squat, chin-up, deadlift, bench or shoulder press. The big lifts go 5, 5, 5, 5, then a set of 8 at about 90% of the 5-rep weight; the chin-up is three best sets of 3–6. Muscle-building pairs and the Free Zone follow. Each workout three times. Source: Lou Schuler & Alwyn Cosgrove, The New Rules of Lifting Supercharged (Avery, 2012) — adapted; see Sources & Credits.",
      data: NROL.SP[2]
    },
    {
      id: 'nrol-strength-power-3',
      name: "NROL Supercharged — Strength & Power III",
      description: "Strength & Power III: the same four-workout layout with wave loading on the main lift — 7, 5, 3 and the wave again heavier; then 6, 4, 2; then 5, 3, 1 — a neural trick that makes heavy weights feel lighter and builds toward a true one-rep max. The chin-up goes for more reps (5–10) at last program's load. Source: Lou Schuler & Alwyn Cosgrove, The New Rules of Lifting Supercharged (Avery, 2012) — adapted; see Sources & Credits.",
      data: NROL.SP[3]
    },
    {
      id: 'gironda-8x8',
      name: "Vince Gironda’s 8 X 8",
      description: "Legendary trainer Vince Gironda's \"honest workout\": 8 sets of 8 reps per exercise, 2-4 exercises per muscle group, only 15-30 seconds rest between sets — the whole point is condensing more work into less time rather than adding weight. An advanced \"shock routine\" Gironda didn't recommend using constantly; not for beginners. 4-day split (Chest/Biceps/Forearms → Shoulders/Triceps → Back/Abs → Quads/Hamstrings/Calves). Source: “Vince Gironda's 8 X 8 Workout,” Old School Trainer (see Sources & Credits).",
      data: GIRONDA_8X8_DAYS
    },
    {
      id: 'german-volume-training',
      name: "German Volume Training (10×10)",
      description: "The classic \"Ten Sets Method,\" popularized in German weightlifting circles in the 1970s and written up by Charles Poliquin: one exercise per body part, 10 straight sets of 10 reps at a weight you could otherwise lift for 20, 90 seconds rest, one session per body part every 4-5 days. Brutally simple, famous for fast size gains — and famous for extreme soreness. 5-day cycle (Chest/Back → Legs/Abs → Off → Arms/Shoulders → Off) mapped onto Monday-Friday, weekends free. Source: Charles Poliquin, “German Volume Training!”, Bodybuilding.com (see Sources & Credits).",
      data: GVT_DAYS
    },
    {
      id: 'steve-reeves-classic-physique',
      name: "Steve Reeves’ Classic Physique Routine",
      description: "Mr. Universe Steve Reeves' 1951 full-body routine, trained 3 non-consecutive days a week (e.g. Monday, Wednesday, Saturday) rather than split by body part — the pre-steroid-era standard. All sets to failure, 45-60 seconds between sets, 2 minutes between exercises, emphasizing a slow negative. The same full workout is repeated each session. Source: “The Steve Reeves 'Classic Physique' Routine,” GymTalk (see Sources & Credits).",
      data: REEVES_CLASSIC_PHYSIQUE_DAYS
    },
    {
      id: 'zane-experience-split',
      name: "Frank Zane’s Torso/Legs/Arms Split",
      description: "3x Mr. Olympia Frank Zane's \"Zane Experience\" routine: Torso (back, shoulders, chest) → Legs (thighs, calves) → Arms (triceps, biceps, forearms), abs trained every session, a brief stretch between sets on every exercise instead of a timed rest. Just 2 working sets per exercise (first set ~12 reps, second set ~10 reps at a heavier weight) — quality and mind-muscle focus over sheer volume. This preset uses Zane's own recommended maintenance cycle (each body part once every 7 days: Monday/Wednesday/Friday) — his book also describes faster 4, 5, and 6-day cycles for in-season training. Source: Frank Zane, “The Zane Body Training Manual” (see Sources & Credits); exercise names generalized from Zane's personal home-gym equipment.",
      data: ZANE_EXPERIENCE_DAYS
    },
    {
      id: 'ronnie-coleman-split',
      name: "Ronnie Coleman’s Power-Building Split",
      description: "8-time Mr. Olympia Ronnie Coleman's 4-day split (Back/Biceps → Chest/Triceps → Shoulders/Traps → Legs), combining a very heavy, low-rep compound lift (deadlift or squat for singles/doubles) with higher-rep accessory work for everything else. This preset uses Week 1 of the source's multi-week template — the original plan calls for the compound lift's rep count to climb in later weeks (e.g. squat moves from 2 reps up toward 6-10) as the accessory work stays constant, so treat this as a starting point rather than a routine to repeat unchanged for months. Source: exercise.com, “Ronnie Coleman Workout Plan” (see Sources & Credits).",
      data: RONNIE_COLEMAN_DAYS
    },
    {
      id: 'womens-health-exercise-plan',
      name: "Women's Health: The 4-Week Exercise Plan",
      description: "Craig Rasmussen's plug-and-play fat-loss workout from The Women's Health Big Book of Exercises — you choose the exercises, the plan sets the structure. Three days a week, alternating Workout A and Workout B (Mon/Wed/Fri as A/B/A, then B/A/B the next week), at least a day off after each. After a 5–10 minute warm-up: a core stability exercise as a straight set, then two pairs — A: single-leg glutes/hamstrings with an upper-back row, then a two-leg squat with a chest press; B: a single-leg quad move with a lats exercise, then a two-leg hinge with a shoulder exercise. Everything is 3 × 12 with 1 minute's rest between every set, using the heaviest weight that lets you finish all the reps. Do one set of the first exercise in a pair, rest, one set of the second, rest, and repeat. A cardio finisher follows straight after. Each slot shows one of the book's suggested exercises, with the others as alternates. Source: The Women's Health Big Book of Exercises (Adam Campbell and the editors of Women's Health, Rodale, 2010), workout by Craig Rasmussen, CSCS — adapted; see Sources & Credits.",
      data: WH_EXERCISE_PLAN_DAYS
    },
    {
      id: 'mens-health-total-body-ab',
      name: "Men's Health Total-Body Template (A/B)",
      description: "A modern \"choose your own exercise\" full-body template, not tied to a specific historical lifter like the Old School presets above. Two alternating workouts (A and B) each cover the whole body — core, one lower-body pattern, one upper-body pull or push — with a named exercise category per slot (e.g. \"Quadriceps, single-leg\") rather than one fixed movement, so pick whichever listed alternate suits the client's equipment and experience. 3 sets of 12 reps per exercise, 1 minute rest, a cardio finisher after every session. This preset alternates A/Wed-B/A across the week (Mon/Fri A, Wed B) — swap it to A/B/A/B if you'd rather alternate strictly workout-to-workout regardless of the calendar. Source: Adam Campbell, The Men's Health Big Book of Exercises (Rodale Books) — a purchased book, not a free article, so no companion blog post accompanies this preset.",
      data: MENS_HEALTH_AB_DAYS
    },
    {
      id: 'one-percent-superset-upper-lower',
      name: "1% Fitness: Superset Upper With Lower & Push With Pull",
      description: "Mike Sheridan's Principle #5 as a program. Every superset pairs a leg movement with an upper-body one: upper pulls go with lower 'bends' (squat and knee-dominant moves), upper pushes with lower 'extends' (hinge and hip-dominant moves), so the grip never has to work twice in a row, and the legs always go first. Alternate the two exercises of each pair until all sets are done (in this phase with 30 seconds between them), then move to the next pair. This is the book's Phase 3.1 (two weeks): the strength workout Monday and Thursday with a slow 4-second lowering (tempo 4-0-1-0), 3 × 10–12, and a HIIT day on Saturday. The book then moves through Phase 3.2 (hinge + chest press, inverted row + front-foot-elevated lunge, 6–8 reps), 3.3 (front squat + prone row, overhead press + glute bridge, 4 × 8–10, sprint intervals) and 3.4 (barbell deadlift + 45° press, assisted pull-up + split squat, 4 × 4–6) — swap the exercises every two weeks to follow it. Source: Mike Sheridan, 1% Fitness: Move Better. Train Smarter. Live Longer. — adapted; see Sources & Credits.",
      data: ONE_PERCENT_SUPERSET_DAYS
    },
    {
      id: 'one-percent-fitness-ab',
      name: "1% Fitness Push/Pull Template (A/B)",
      description: "Another \"choose your movement pattern\" full-body A/B template, paired as supersets (A1+A2, B1+B2, etc.) rather than straight sets. Workout A leans lower-body push / upper-body pull (squat, vertical pull, lunge, horizontal pull); Workout B mirrors it as lower-body pull / upper-body push (deadlift, vertical push, reverse lunge, horizontal push) — alternate the two and every major pattern gets trained across the week. Ends with a high-rep ankle + elbow finisher pairing (7 sets, 12/side and 100+ reps). As with the exercise slots, the coach picks the specific movement that fits each named pattern. Alternates Mon/Fri A, Wed B — swap to strict A/B/A/B if preferred. Source: Mike Sheridan, 1% Fitness: Move Better. Train Smarter. Live Longer. — a purchased book, not a free article, so no companion blog post accompanies this preset.",
      data: ONE_PERCENT_FITNESS_AB_DAYS
    }
  ];

  document.addEventListener('click', ()=>{
    document.querySelectorAll('.cs-freeform-copy-menu').forEach(m => { m.style.display = 'none'; });
  });

  let programRowId = null; // the Supabase row id for this user's program, once known

  function loadProgram(){
    // Instant start with the built-in default; real saved program replaces
    // it once refreshProgramFromSupabase() responds (see below).
    return clone(DEFAULT_PROGRAM);
  }
  // Runs at load and again on every sign-in / sign-out ('bnb-auth-changed'
  // from js/bells-n-barz-users.js): at load the signed-in person usually
  // isn't known yet, so that first call alone would leave the default
  // program showing. Signed out: back to the default.
  async function refreshProgramFromSupabase(){
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (!me){
      if (programRowId){ programRowId = null; programData = clone(DEFAULT_PROGRAM); rerenderProgramViews(); }
      return;
    }
    const { data, error } = await bnbClient.from('programs').select('*').eq('owner_id', me.id);
    if (error) { console.error('Supabase load programs failed:', error); return; }
    if (data && data.length){
      programRowId = data[0].id;
      programData = data[0].data;
      rerenderProgramViews();
    }
  }
  // Everything drawn from programData: the Manual's day pages, Today's
  // Program, and both Live Sessions.
  function rerenderProgramViews(){
    renderAllPerform();
    renderTodayProgram();
    renderMlsDay();
    renderSessionDay();
  }
  document.addEventListener('bnb-auth-changed', refreshProgramFromSupabase);
  function saveProgram(){
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (!me) return; // guest / nobody logged in — local-only for this session
    (async () => {
      try {
        const row = { owner_id: me.id, name: 'Default Program', data: programData, updated_at: new Date().toISOString() };
        if (programRowId) row.id = programRowId;
        const { data, error } = await bnbClient.from('programs').upsert([row], { onConflict: 'owner_id' }).select();
        if (error) throw error;
        if (data && data[0]) programRowId = data[0].id;
      } catch(e){
        console.warn('Supabase save programs failed:', e);
      }
    })();
  }

  let programData = loadProgram();
  refreshProgramFromSupabase(); // async — replaces default start once Supabase responds

  /* ---------------- PROGRAM BUILDER: PER-CLIENT EDITING ---------------- */
  // A coach editing a specific client's program uses this SEPARATE state,
  // not programData/programRowId above — those stay tied to whoever is
  // actually logged in and drive the public Manual, the Overview preview,
  // and Live Session Log. Without this split, a coach browsing to a
  // different client mid-edit here would also temporarily hijack what
  // the Manual shows in that same browser tab. The one exception: saving
  // your OWN program through this picker (adminOwnerId === your own id)
  // re-syncs programData too, so self-edits still show up immediately
  // elsewhere in the app, same as before this feature existed.
  let adminOwnerId = null;
  let adminProgramData = clone(DEFAULT_PROGRAM); // never null — renderAdminBlocks() runs at init, before any real load
  let adminProgramRowId = null;
  let adminLoading = Promise.resolve();  // the client load in flight (see loadAdminProgramFor)
  let adminNotifiedThisLoad = false; // saveAdminProgram() fires on every keystroke — only notify once per client selected, not once per edit

  function populateAdminClientPicker(){
    const sel = document.getElementById('admin-client-picker');
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (!sel || !me) return;
    const members = window.BNB_USERS.getMembers().slice().sort((a,b)=>a.fullName.localeCompare(b.fullName));
    sel.innerHTML = '<option value="' + me.id + '">Myself</option>' +
      members.filter(u=>u.id!==me.id).map(u=>'<option value="'+u.id+'">'+esc(u.fullName)+'</option>').join('');
    sel.value = adminOwnerId || me.id;
    sel.onchange = () => { syncProgramsPicker(); loadAdminProgramFor(sel.value); };
    if (!adminOwnerId) loadAdminProgramFor(me.id);
    syncProgramsPicker();
  }
  // Coach > Programs has its own "Program for" picker: the same list, kept
  // in step with Program Builder's, so a program loads for the client
  // chosen on either page.
  function syncProgramsPicker(){
    const from = document.getElementById('admin-client-picker');
    const to = document.getElementById('programs-client-picker');
    if (!from || !to) return;
    to.innerHTML = from.innerHTML;
    to.value = from.value;
    to.onchange = () => { from.value = to.value; loadAdminProgramFor(to.value); };
  }
  window.bnbProgramsOnShown = populateAdminClientPicker;
  // After a program is loaded on the Programs page: straight to Program Builder.
  function openProgramBuilder(){
    const btn = document.querySelector('#coach-section-switch [data-coach-section="program"]');
    if (btn) btn.click();
  }
  window.bnbOpenProgramBuilder = openProgramBuilder;
  const programsLink = document.getElementById('open-programs-link');
  if (programsLink) programsLink.onclick = (e)=>{
    e.preventDefault();
    const btn = document.querySelector('#coach-section-switch [data-coach-section="programs"]');
    if (btn) btn.click();
  };
  // Exposed so the Coach sub-switcher (a separate <script> block/closure)
  // can refresh the picker's member list each time Program Builder is
  // opened — same cross-closure export pattern already used by
  // mlsOnTabShown/schedOnTabShown/bnbAccountabilityOnTabShown.
  window.bnbProgramBuilderOnShown = function(){
    populateAdminClientPicker();
    // Re-draw once the coach's Workouts to Try are in, for the blocks'
    // "From: …" links and Update buttons.
    fillAdminLoadWorkout().then(renderAdminBlocks);
  };

  // Picking a client loads their program; anything that saves over it
  // (loading a preset or a built program) waits for that to finish, so it
  // never saves onto the previous client's row.
  function loadAdminProgramFor(ownerId){
    adminLoading = fetchAdminProgramFor(ownerId);
    return adminLoading;
  }
  async function fetchAdminProgramFor(ownerId){
    adminOwnerId = ownerId;
    const { data, error } = await bnbClient.from('programs').select('*').eq('owner_id', ownerId);
    if (error) { console.error('Supabase load programs failed:', error); return; }
    if (data && data.length){ adminProgramRowId = data[0].id; adminProgramData = data[0].data; }
    else { adminProgramRowId = null; adminProgramData = clone(DEFAULT_PROGRAM); }
    adminNotifiedThisLoad = false;
    renderAdminDayTabs(); renderAdminBlocks();
  }

  function saveAdminProgram(){
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (!me || !adminOwnerId) return;
    (async () => {
      try {
        const row = { owner_id: adminOwnerId, name: 'Default Program', data: adminProgramData, updated_at: new Date().toISOString() };
        if (adminProgramRowId) row.id = adminProgramRowId;
        if (adminOwnerId !== me.id){ row.assigned_by = me.id; row.assigned_at = new Date().toISOString(); }
        const { data, error } = await bnbClient.from('programs').upsert([row], { onConflict: 'owner_id' }).select();
        if (error) throw error;
        if (data && data[0]) adminProgramRowId = data[0].id;
        // Editing your own program through this picker is functionally
        // the same program the Manual/Overview/Live Session Log render —
        // keep them in sync immediately rather than waiting for a reload.
        if (adminOwnerId === me.id){
          programData = adminProgramData;
          renderAllPerform(); renderTodayProgram();
        } else if (!adminNotifiedThisLoad){
          // Once per client selected, not once per edit — saveAdminProgram()
          // fires on every keystroke while editing.
          adminNotifiedThisLoad = true;
          bnbClient.from('notifications').insert([{
            user_id: adminOwnerId, type: 'program_assigned',
            message: 'Your coach updated your training program.', link_tab: 'overview'
          }]).then(({ error: notifErr }) => { if (notifErr) console.warn('Supabase insert notification failed:', notifErr); });
        }
      } catch(e){
        console.warn('Supabase save programs failed:', e);
      }
    })();
  }

  function ytLink(name){
    const clean = name.split('(')[0].trim();
    return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(clean + ' exercise tutorial');
  }

  function prescString(ex){
    if (ex.sets && ex.reps) return ex.sets + ' × ' + ex.reps;
    if (ex.reps) return ex.reps;
    if (ex.sets) return ex.sets + ' sets';
    return '';
  }

  function metaLine(ex){
    const parts = [];
    if (ex.load) parts.push('Load ' + ex.load);
    if (ex.rest) parts.push('Rest ' + ex.rest);
    if (ex.tempo) parts.push('Tempo ' + ex.tempo);
    if (ex.equipment) parts.push('Equip: ' + ex.equipment);
    if (ex.alternates) parts.push('Alt: ' + ex.alternates);
    return parts.join(' &nbsp;•&nbsp; ');
  }

  /* ---------------- RENDER: PERFORM BLOCKS (Mon–Sun tabs) ---------------- */
  function renderPerform(day){
    const container = document.querySelector('.perform-render[data-day="' + day + '"]');
    if (!container) return;
    container.innerHTML = dayStatsLine(programData[day]);
    const blocks = (programData[day] || []);
    blocks.forEach(block => {
      const table = document.createElement('table');
      table.className = 'block';
      const cap = document.createElement('caption');
      cap.textContent = block.name;
      table.appendChild(cap);
      block.exercises.forEach(ex => {
        const tr = document.createElement('tr');
        const tdName = document.createElement('td');
        const a = document.createElement('a');
        a.href = ytLink(ex.name);
        a.target = '_blank'; a.rel = 'noopener';
        a.textContent = ex.name;
        tdName.appendChild(a);
        const ml = metaLine(ex);
        if (ml){
          const small = document.createElement('div');
          small.className = 'mono';
          small.style.cssText = 'font-size:11px;color:var(--muted);margin-top:3px;';
          small.innerHTML = ml;
          tdName.appendChild(small);
        }
        const tdPresc = document.createElement('td');
        tdPresc.textContent = prescString(ex);
        tr.appendChild(tdName); tr.appendChild(tdPresc);
        table.appendChild(tr);
      });
      container.appendChild(table);
    });
  }
  function renderAllPerform(){ DAY_ORDER.forEach(renderPerform); }

  // Today's Program preview on Overview (phone-width only, see CSS) — the
  // same block/exercise data and rendering the weekday tabs use via
  // renderPerform, just targeting a dedicated container instead of the
  // per-weekday .perform-render element (renderPerform's own querySelector
  // only ever finds the first match for a given day, so a second copy of
  // that same [data-day] element couldn't coexist with the real one).
  function renderTodayProgram(){
    const titleEl = document.getElementById('overview-today-title');
    const blocksEl = document.getElementById('overview-today-blocks');
    const viewFullEl = document.getElementById('overview-today-viewfull');
    if (!titleEl || !blocksEl) return;

    const idx = new Date().getDay(); // 0=Sun..6=Sat
    const todayKey = DAY_ORDER[idx === 0 ? 6 : idx - 1];
    const meta = DAY_META[todayKey];

    titleEl.textContent = 'Today — ' + meta.title.split('—')[1].trim() + ' (' + meta.duration + ')';
    if (viewFullEl) viewFullEl.onclick = (e) => { e.preventDefault(); if (typeof switchTab === 'function') switchTab(todayKey); };

    const blocks = programData[todayKey] || [];
    blocksEl.innerHTML = dayStatsLine(blocks);
    if (!blocks.length){
      const p = document.createElement('p');
      p.style.cssText = 'color:var(--muted);font-size:14px;';
      p.textContent = 'Rest day — no Perform blocks scheduled.';
      blocksEl.appendChild(p);
      return;
    }
    blocks.forEach(block => {
      const table = document.createElement('table');
      table.className = 'block';
      const cap = document.createElement('caption');
      cap.textContent = block.name;
      table.appendChild(cap);
      block.exercises.forEach(ex => {
        const tr = document.createElement('tr');
        const tdName = document.createElement('td');
        const a = document.createElement('a');
        a.href = ytLink(ex.name);
        a.target = '_blank'; a.rel = 'noopener';
        a.textContent = ex.name;
        tdName.appendChild(a);
        const tdPresc = document.createElement('td');
        tdPresc.textContent = prescString(ex);
        tr.appendChild(tdName); tr.appendChild(tdPresc);
        table.appendChild(tr);
      });
      blocksEl.appendChild(table);
    });
  }

  /* ================================ ADMIN ================================ */
  let adminDay = "mon";

  function renderAdminDayTabs(){
    const bar = document.getElementById('admin-day-tabs');
    bar.innerHTML = '';
    // Phone-width stand-in: same day list as the button row below, kept in sync.
    const select = document.createElement('select');
    select.className = 'day-tabs-dropdown';
    select.setAttribute('aria-label', 'Select day to edit');
    DAY_ORDER.forEach(d=>{
      const opt = document.createElement('option');
      opt.value = d;
      opt.textContent = DAY_META[d].title.split('—')[0].trim();
      if (d===adminDay) opt.selected = true;
      select.appendChild(opt);
    });
    select.onchange = ()=>{ adminDay = select.value; renderAdminDayTabs(); renderAdminBlocks(); };
    bar.appendChild(select);
    DAY_ORDER.forEach(d=>{
      const b = document.createElement('button');
      b.className = 'subtab-btn' + (d===adminDay ? ' active' : '');
      b.textContent = DAY_META[d].title.split('—')[0].trim();
      b.onclick = ()=>{ adminDay = d; renderAdminDayTabs(); renderAdminBlocks(); };
      bar.appendChild(b);
    });
  }

  function renderAdminBlocks(){
    renderBlockEditor(document.getElementById('admin-blocks'), adminProgramData[adminDay] || [], saveAdminProgram, renderAdminBlocks,
      { blockExtras: blockWorkoutLink, stats: true, onChange: renderAdminDayStats, splitBlocks: true });
    renderAdminDayStats();
  }
  // The whole day's summary, under the blocks.
  function renderAdminDayStats(){
    const el = document.getElementById('admin-day-stats');
    if (!el) return;
    const blocks = adminProgramData[adminDay] || [];
    const all = { exercises: blocks.flatMap(b => b.exercises || []) };
    el.innerHTML = blocks.length > 0 && all.exercises.length
      ? '<div class="admin-day-stats-head">' + esc(DAY_META[adminDay].title.split('—')[0].trim()) + ' total</div>' + workoutStatsHtml(all)
      : '';
  }

  /* Block/exercise editor shared by Program Builder (blocks of one day)
     and Coach > Workouts to Try (versions of one workout). Edits change
     `blocks` in place; save() runs after each one, rerender() after rows
     are added or removed. opts.noun names a block ("Version"). */
  function blankExercise(){
    return { name:'New Exercise', sets:'3', reps:'10', load:'', rest:'', tempo:'', equipment:'', alternates:'' };
  }
  // In a split version, "+ Exercise" adds to the last block.
  function addExerciseRow(exercises){
    const last = exercises[exercises.length - 1];
    exercises.push(Object.assign(blankExercise(), last && last.block ? { block: last.block } : {}));
  }
  // Header where a block starts inside a version: its name (rename it
  // there) and ✕, which merges its rows into the block above — or into the
  // one below for the first block. With one block left, the split goes.
  function subBlockHeader(exercises, start, save, rerender){
    const name = exercises[start].block;
    let end = start;
    while (end + 1 < exercises.length && exercises[end + 1].block === name) end++;
    const head = document.createElement('div');
    head.className = 'crud-sub-head';
    const input = document.createElement('input');
    input.value = name;
    input.setAttribute('aria-label', 'Block name');
    input.onchange = ()=>{
      const v = input.value.trim();
      if (!v){ input.value = name; return; }
      for (let i = start; i <= end; i++) exercises[i].block = v;
      save(); rerender();
    };
    const del = document.createElement('button');
    del.type = 'button'; del.className = 'crud-remove'; del.title = 'Remove this block break'; del.textContent = '✕';
    del.onclick = ()=>{
      const into = start > 0 ? exercises[start - 1].block : (end + 1 < exercises.length ? exercises[end + 1].block : '');
      for (let i = start; i <= end; i++) exercises[i].block = into;
      if (new Set(exercises.map(ex => ex.block || '')).size <= 1) exercises.forEach(ex => { ex.block = ''; });
      save(); rerender();
    };
    head.appendChild(input); head.appendChild(del);
    return head;
  }
  // "+ Insert block here" after row i: opens a small name box with the
  // next free name. The rest of row i's block moves into the new block;
  // after the last row of a block, the new block starts with a blank row.
  // The first break also names the rows above it (Block A / Block 1).
  function insertBlockLine(exercises, i, save, rerender){
    const line = document.createElement('div');
    line.className = 'crud-insert-block';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '+ Insert block here';
    btn.onclick = ()=>{
      line.innerHTML = '';
      line.classList.add('open');
      const input = document.createElement('input');
      input.value = nextBlockName(exercises);
      input.setAttribute('aria-label', 'New block name');
      const ok = document.createElement('button');
      ok.type = 'button'; ok.className = 'btn2 primary'; ok.textContent = 'Add Block';
      const cancel = document.createElement('button');
      cancel.type = 'button'; cancel.className = 'btn2'; cancel.textContent = 'Cancel';
      const label = document.createElement('span');
      label.textContent = 'Name the new block';
      line.appendChild(label); line.appendChild(input); line.appendChild(ok); line.appendChild(cancel);
      input.focus(); input.select();
      const go = ()=>{
        const name = input.value.trim();
        if (!name){ input.focus(); return; }
        if (!exercises.some(ex => ex.block)){
          const first = /\d/.test(blockToken(name)) ? 'Block 1' : 'Block A';
          exercises.forEach(ex => { ex.block = first; });
        }
        const cur = exercises[i].block;
        let j = i + 1;
        if (j < exercises.length && exercises[j].block === cur){
          for (; j < exercises.length && exercises[j].block === cur; j++) exercises[j].block = name;
        } else {
          exercises.splice(i + 1, 0, Object.assign(blankExercise(), { name: '', block: name }));
        }
        save(); rerender();
      };
      ok.onclick = go;
      input.onkeydown = e => { if (e.key === 'Enter'){ e.preventDefault(); go(); } if (e.key === 'Escape') rerender(); };
      cancel.onclick = rerender;
    };
    line.appendChild(btn);
    return line;
  }

  // Program Builder: "✂ Split into a new block here" after row i (not the
  // last) opens a name box. Rows below move into a new block after this
  // one. Names follow the block's own: "Leg day" splits into "Leg day —
  // Block A" and "Leg day — Block B"; a further split takes the next free
  // letter or number. A split block loses its Workouts to Try link (the
  // saved workout no longer matches either half).
  function splitBase(name){
    return String(name || '').replace(/\s*[—–-]?\s*(?:block|superset|circuit|part|section|round)\s+(?:[a-z]|\d{1,2})$/i, '').trim();
  }
  function splitBlockLine(blocks, bIdx, i, save, rerender){
    const block = blocks[bIdx];
    const line = document.createElement('div');
    line.className = 'crud-insert-block';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '\u2702 Split into a new block here';
    btn.onclick = ()=>{
      const base = splitBase(block.name);
      const named = !!blockToken(block.name);
      const siblings = blocks.filter(b => splitBase(b.name) === base && blockToken(b.name)).map(b => ({ block: b.name }));
      const tok = nextBlockName(siblings);
      const join = n => base ? base + ' \u2014 ' + n : n;
      line.innerHTML = '';
      line.classList.add('open');
      const label = document.createElement('span');
      label.textContent = 'Name the new block' + (block.src ? ' (this unlinks it from Workouts to Try)' : '');
      const input = document.createElement('input');
      input.value = join(tok);
      input.setAttribute('aria-label', 'New block name');
      const ok = document.createElement('button');
      ok.type = 'button'; ok.className = 'btn2 primary'; ok.textContent = 'Split';
      const cancel = document.createElement('button');
      cancel.type = 'button'; cancel.className = 'btn2'; cancel.textContent = 'Cancel';
      line.appendChild(label); line.appendChild(input); line.appendChild(ok); line.appendChild(cancel);
      input.focus(); input.select();
      const go = ()=>{
        const name = input.value.trim();
        if (!name){ input.focus(); return; }
        if (!named) block.name = join(/\d/.test(blockToken(name)) ? 'Block 1' : 'Block A');
        const rest = block.exercises.splice(i + 1);
        delete block.src;
        blocks.splice(bIdx + 1, 0, { name, exercises: rest });
        save(); rerender();
      };
      ok.onclick = go;
      input.onkeydown = e => { if (e.key === 'Enter'){ e.preventDefault(); go(); } if (e.key === 'Escape') rerender(); };
      cancel.onclick = rerender;
    };
    line.appendChild(btn);
    return line;
  }

  function renderBlockEditor(wrap, blocks, save, rerender, opts){
    const noun = (opts && opts.noun) || 'Block';
    wrap.innerHTML = '';

    blocks.forEach((block, bIdx)=>{
      const bDiv = document.createElement('div');
      bDiv.className = 'crud-block';

      const head = document.createElement('div');
      head.className = 'crud-block-head';
      const nameInput = document.createElement('input');
      nameInput.value = block.name;
      nameInput.setAttribute('aria-label', noun + ' name');
      nameInput.oninput = ()=>{ block.name = nameInput.value; save(); };
      const headBtns = document.createElement('div');
      headBtns.style.cssText = 'display:flex;gap:6px;';
      const addExBtn = document.createElement('button');
      addExBtn.className = 'btn2'; addExBtn.type = 'button'; addExBtn.textContent = '+ Exercise';
      addExBtn.onclick = ()=>{
        addExerciseRow(block.exercises);
        save(); rerender();
      };
      const delBlockBtn = document.createElement('button');
      delBlockBtn.className = 'crud-remove'; delBlockBtn.type = 'button'; delBlockBtn.title = 'Delete ' + noun.toLowerCase(); delBlockBtn.textContent = '✕';
      delBlockBtn.onclick = ()=>{
        if(!confirm('Delete "' + block.name + '" and all its exercises?')) return;
        blocks.splice(bIdx,1); save(); rerender();
      };
      headBtns.appendChild(addExBtn);
      // Program Builder: undo a split — this block's rows join the one above.
      if (opts && opts.splitBlocks && bIdx > 0){
        const mergeBtn = document.createElement('button');
        mergeBtn.className = 'btn2'; mergeBtn.type = 'button'; mergeBtn.textContent = '\u2191 Merge';
        mergeBtn.title = 'Move these exercises into "' + blocks[bIdx - 1].name + '" above';
        mergeBtn.onclick = ()=>{
          const above = blocks[bIdx - 1];
          above.exercises.push(...block.exercises);
          if (above.src || block.src) delete above.src;
          blocks.splice(bIdx, 1); save(); rerender();
        };
        headBtns.appendChild(mergeBtn);
      }
      headBtns.appendChild(delBlockBtn);
      head.appendChild(nameInput); head.appendChild(headBtns);
      bDiv.appendChild(head);
      if (opts && opts.blockExtras) opts.blockExtras(block, bDiv);
      // Per-block summary, redrawn as rows are typed into (opts.stats).
      const statsEl = document.createElement('div');
      const drawBlockStats = ()=>{ statsEl.innerHTML = workoutStatsHtml(block); };
      const changed = ()=>{ save(); if (opts && opts.stats){ drawBlockStats(); if (opts.onChange) opts.onChange(); } };

      // opts.subBlocks (Workouts to Try): rows split into blocks by their
      // `block` field — a header where each block starts, an "Insert block
      // here" line between rows, and A1/A2 labels by the names.
      const sub = !!(opts && opts.subBlocks);
      const labels = sub ? exerciseLabels(block.exercises) : [];
      block.exercises.forEach((ex, eIdx)=>{
        if (sub && ex.block && (eIdx === 0 || block.exercises[eIdx - 1].block !== ex.block)){
          bDiv.appendChild(subBlockHeader(block.exercises, eIdx, save, rerender));
        }
        const row = document.createElement('div');
        row.className = 'crud-ex-row';
        row.innerHTML = `
          <div class="crud-col crud-col-name"><label>Exercise</label><input data-f="name" value="${esc(ex.name)}" placeholder="Exercise name"></div>
          <div class="crud-col"><label>Sets</label><input data-f="sets" value="${esc(ex.sets)}"></div>
          <div class="crud-col"><label>Reps</label><input data-f="reps" value="${esc(ex.reps)}"></div>
          <div class="crud-col"><label>Load</label><input data-f="load" value="${esc(ex.load)}" placeholder="e.g. 80kg"></div>
          <div class="crud-col"><label>Rest</label><input data-f="rest" value="${esc(ex.rest)}" placeholder="e.g. 90s"></div>
          <div class="crud-col"><label>Tempo</label><input data-f="tempo" value="${esc(ex.tempo)}" placeholder="e.g. 3-1-1"></div>
          <div class="crud-col"><label>Equipment</label><input data-f="equipment" value="${esc(ex.equipment)}" placeholder="e.g. Barbell"></div>
          <div class="crud-col"><label>Alternates</label><input data-f="alternates" value="${esc(ex.alternates)}" placeholder="comma, separated"></div>
          <div class="crud-col crud-col-del"><label>&nbsp;</label><button class="crud-remove" type="button" title="Remove exercise">✕</button></div>
        `;
        row.querySelectorAll('input').forEach(inp=>{
          inp.oninput = ()=>{ ex[inp.dataset.f] = inp.value; changed(); };
        });
        row.querySelector('.crud-remove').onclick = ()=>{
          block.exercises.splice(eIdx,1); save(); rerender();
        };
        // ⇄ next to the name: swap this exercise for one of its alternatives
        // (rebuilt when the name or Alternates change, so the list follows).
        const nameInp = row.querySelector('input[data-f="name"]');
        const nameLine = document.createElement('div');
        nameLine.className = 'crud-name-line';
        nameInp.replaceWith(nameLine);
        if (labels[eIdx]){
          const tag = document.createElement('span');
          tag.className = 'crud-ex-label';
          tag.textContent = labels[eIdx];
          nameLine.appendChild(tag);
        }
        nameLine.appendChild(nameInp);
        let picker = null;
        const placePicker = ()=>{
          const next = buildAltPicker({ name: ex.name, baseAlts: ex.alternates }, val => {
            ex.name = val; nameInp.value = val; changed(); placePicker();
          });
          if (picker) picker.remove();
          picker = next;
          if (picker) nameLine.appendChild(picker);
        };
        placePicker();
        nameInp.onchange = placePicker;
        row.querySelector('input[data-f="alternates"]').onchange = placePicker;
        bDiv.appendChild(row);
        if (sub) bDiv.appendChild(insertBlockLine(block.exercises, eIdx, save, rerender));
        if (opts && opts.splitBlocks && eIdx < block.exercises.length - 1) bDiv.appendChild(splitBlockLine(blocks, bIdx, eIdx, save, rerender));
      });

      if (opts && opts.stats && block.exercises.length){
        statsEl.className = 'crud-block-stats';
        drawBlockStats();
        bDiv.appendChild(statsEl);
      }
      wrap.appendChild(bDiv);
    });
  }

  function esc(s){
    return (s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  }

  document.getElementById('admin-add-block').onclick = ()=>{
    (adminProgramData[adminDay] = adminProgramData[adminDay] || []).push({name:'New Block', exercises:[]});
    saveAdminProgram(); renderAdminBlocks();
  };
  document.getElementById('admin-reset-day').onclick = ()=>{
    if(!confirm('Reset ' + DAY_META[adminDay].title + ' back to the manual\u2019s original Perform blocks? This discards your edits for this day.')) return;
    adminProgramData[adminDay] = clone(DEFAULT_PROGRAM[adminDay]);
    saveAdminProgram(); renderAdminBlocks();
  };
  (function(){
    const grid = document.getElementById('admin-preset-grid');
    if (!grid) return;
    grid.innerHTML = PROGRAM_PRESETS.map(p =>
      '<div class="format-card" data-preset-id="' + esc(p.id) + '">' +
        '<div class="format-tag">PRESET</div>' +
        '<h4>' + esc(p.name) + '</h4>' +
        '<p>' + esc(p.description) + '</p>' +
        '<div class="format-setup">' +
          '<button class="format-load-btn" type="button">Load for Client</button>' +
        '</div>' +
      '</div>'
    ).join('');
    grid.querySelectorAll('.format-card').forEach(card => {
      card.querySelector('.format-load-btn').onclick = ()=>{
        const preset = PROGRAM_PRESETS.find(p => p.id === card.dataset.presetId);
        if (!preset) return;
        const picker = document.getElementById('programs-client-picker');
        const who = picker && picker.selectedOptions[0] ? picker.selectedOptions[0].textContent.trim() : 'the client chosen above';
        if (!confirm('Load "' + preset.name + '" for ' + who + '? This replaces every day of their current program.')) return;
        loadProgramForClient(preset.data).then(()=>{ alert('Preset loaded — opening it in Program Builder.'); openProgramBuilder(); });
      };
    });
  })();
  // Replace the selected client's whole program (a preset, or one made by
  // Build a Program in js/bells-n-barz-program-generator.js).
  async function loadProgramForClient(data){
    await adminLoading;
    adminProgramData = clone(data);
    saveAdminProgram(); renderAdminBlocks(); renderMlsDay();
  }
  window.bnbLoadProgramForClient = loadProgramForClient;
  document.getElementById('admin-export').onclick = ()=>{
    const blob = new Blob([JSON.stringify(adminProgramData, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'bnb-program-export.json'; a.click();
    URL.revokeObjectURL(url);
  };
  document.getElementById('admin-import-btn').onclick = ()=> document.getElementById('admin-import-file').click();
  document.getElementById('admin-import-file').onchange = (e)=>{
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = ()=>{
      try {
        const parsed = JSON.parse(reader.result);
        adminProgramData = parsed; saveAdminProgram();
        renderAdminBlocks(); renderMlsDay();
        alert('Program imported.');
      } catch(err){ alert('That file could not be read as valid program JSON.'); }
    };
    reader.readAsText(file);
  };

  /* ============================== LOGSHEET =============================== */
  /* ------------------------------- PDF EXPORT ------------------------------ */
  function loadScript(src){
    return new Promise((resolve,reject)=>{
      const s = document.createElement('script');
      s.src = src; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  let jsPdfLoaded = false;
  async function ensureJsPdf(){
    if (jsPdfLoaded || (window.jspdf && window.jspdf.jsPDF)) { jsPdfLoaded = true; return; }
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    jsPdfLoaded = true;
  }

  /* jsPDF's built-in fonts (Helvetica/Courier/Times) only support WinAnsi
     encoding — there's no ★ glyph, so doc.text('★ ...') silently substitutes
     the wrong character (renders as '&'). Draw an actual 5-point star as a
     small filled vector instead, so it's guaranteed correct regardless of
     font/encoding. Returns the x-position where text should resume. */
  function drawPdfStar(doc, x, yBaseline, color, size){
    size = size || 5;
    const cx = x + size, cy = yBaseline - size*0.62;
    const outerR = size, innerR = size * 0.42;
    const pts = [];
    for (let i=0;i<10;i++){
      const angle = (Math.PI/5)*i - Math.PI/2;
      const r = i%2===0 ? outerR : innerR;
      pts.push([cx + r*Math.cos(angle), cy + r*Math.sin(angle)]);
    }
    const deltas = [];
    for (let i=1;i<pts.length;i++) deltas.push([pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]]);
    doc.setFillColor(...color);
    doc.lines(deltas, pts[0][0], pts[0][1], [1,1], 'F', true);
    return x + size*2 + 6;
  }

  /* Renders one exercise's sets as a row of small chips instead of a single
     monospace bracket string. Each chip is a dot (filled = logged, hollow =
     not done) plus a wt × reps label. A set that's checked done but is
     missing weight or reps gets a rust underline so it reads as flagged at a
     glance, rather than looking identical to a fully-logged set. Wraps to a
     new line if it would run past the right margin. Returns the y position
     after the row. */
  function drawPdfSetChips(doc, sets, startX, startY, rightEdge, colors){
    const dotR = 2.6;
    let sx = startX, y = startY;
    sets.forEach(s=>{
      const notDone = !s.done;
      const flagged = s.done && (!s.wt || !s.reps);
      const color = notDone ? colors.muted : (flagged ? colors.rust : colors.green);
      const label = (s.wt || '\u2014') + ' \u00d7 ' + (s.reps || '\u2014');
      doc.setFont('helvetica', flagged ? 'bold' : 'normal'); doc.setFontSize(9);
      const w = doc.getTextWidth(label);
      const chipW = dotR*2 + 4 + w + 14;
      if (sx + chipW - 14 > rightEdge){ sx = startX; y += 15; }
      doc.setFillColor(...color); doc.setDrawColor(...color);
      doc.circle(sx + dotR, y - dotR*0.9, dotR, notDone ? 'S' : 'F');
      sx += dotR*2 + 4;
      doc.setTextColor(...color);
      doc.text(label, sx, y);
      if (flagged){
        doc.setDrawColor(...colors.rust); doc.setLineWidth(0.6);
        doc.line(sx, y+2, sx+w, y+2);
      }
      sx += w + 14;
    });
    return y;
  }

  /* ------------------------------- ODT EXPORT ------------------------------ */
  let jsZipLoaded = false;
  async function ensureJsZip(){
    if (jsZipLoaded || window.JSZip) { jsZipLoaded = true; return; }
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
    jsZipLoaded = true;
  }

  function xmlEsc(s){
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function buildOdtContentXml(snap){
    let body = '';
    body += `<text:h text:style-name="Title">${xmlEsc(snap.title)}</text:h>`;
    body += `<text:p text:style-name="Sub">${xmlEsc(snap.duration)}  ·  Date: ${xmlEsc(snap.date||'____________')}  ·  Bodyweight: ${xmlEsc(snap.bw||'______')}</text:p>`;
    snap.blocks.forEach(block=>{
      body += `<text:h text:style-name="BlockHead">${xmlEsc(block.name.toUpperCase())}</text:h>`;
      block.exercises.forEach(ex=>{
        body += `<text:p text:style-name="ExName">${xmlEsc(ex.name)}  —  ${xmlEsc(ex.presc)}</text:p>`;
        if (ex.meta) body += `<text:p text:style-name="ExMeta">${xmlEsc(ex.meta)}</text:p>`;
        const line = ex.sets.map((s,i)=> 'Set '+(i+1)+' ['+(s.done?'X':' ')+']  Wt: '+(s.wt||'____')+'  Reps: '+(s.reps||'____')).join('   |   ');
        body += `<text:p text:style-name="SetLine">${xmlEsc(line)}</text:p>`;
      });
    });
    body += `<text:h text:style-name="BlockHead">SIGNATURE HOLD</text:h>`;
    body += `<text:p text:style-name="ExName">${xmlEsc(snap.hold)}</text:p>`;
    body += `<text:h text:style-name="BlockHead">SESSION NOTES / RPE</text:h>`;
    body += `<text:p text:style-name="ExMeta">${xmlEsc(snap.notes || '(none logged)')}</text:p>`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
  xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
  office:version="1.2">
  <office:automatic-styles>
    <style:style style:name="Title" style:family="paragraph"><style:text-properties fo:font-weight="bold" fo:font-size="20pt"/></style:style>
    <style:style style:name="Sub" style:family="paragraph"><style:text-properties fo:font-size="10pt" fo:color="#6b6355"/></style:style>
    <style:style style:name="BlockHead" style:family="paragraph"><style:text-properties fo:font-weight="bold" fo:font-size="12pt" fo:color="#8a7350"/></style:style>
    <style:style style:name="ExName" style:family="paragraph"><style:text-properties fo:font-weight="bold" fo:font-size="11pt"/></style:style>
    <style:style style:name="ExMeta" style:family="paragraph"><style:text-properties fo:font-style="italic" fo:font-size="9pt" fo:color="#6b6355"/></style:style>
    <style:style style:name="SetLine" style:family="paragraph"><style:text-properties fo:font-family="Courier New" fo:font-size="9pt"/></style:style>
  </office:automatic-styles>
  <office:body><office:text>${body}</office:text></office:body>
</office:document-content>`;
  }

  /* ========================= COACH — LIVE SESSION ========================= */
  /* Separate from the member-facing Logsheet: own storage key, own day state,
     own "who is this for" field. Nothing here reads from or writes to the
     member's logStore, so a coach's in-session logging never touches (or gets
     touched by) whatever a member has open on their own device.

     Up to 5 independent trainee "slots" live side by side — each keeps its
     own name, sets, weight/reps and notes. The day selector is shared across
     all 5 slots (a coach running back-to-back 1-on-1s is almost always on the
     same day's program each time), so switching slots only changes *whose*
     data you're looking at, not which day is loaded. */
  const SESSION_KEY = "bnb-coach-session-v1";
  const CS_SLOT_COUNT = 5;
  // Was hardcoded to "mon" — always opened on Monday regardless of the
  // actual day. Now detects today the same way Member Live Session already
  // does, so a coach opening this on a Wednesday sees Wednesday by default.
  let csDay = (function(){
    const idx = new Date().getDay(); // 0=Sun..6=Sat
    return DAY_ORDER[idx===0 ? 6 : idx-1];
  })();
  let csSlot = 0;

  function loadSession(){
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "{}"); }
    catch(e){ return {}; }
  }
  function saveSession(){
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(sessionStore)); }
    catch(e){ /* storage unavailable */ }
  }
  let sessionStore = loadSession();

  /* Slot-scoped key helper — mirrors the member Logsheet's fKey() but with a
     slot prefix, so all 5 trainees' data can share one storage object without
     colliding. */
  function csKey(slot, ...rest){ return 's' + slot + ':' + rest.join(':'); }

  function slotTraineeName(slot){ return sessionStore[csKey(slot,'trainee')] || ''; }

  /* ---- Freeform: start from the program, swap via alternatives ----
     Freeform opens with the day's program exercises already listed (the
     "general idea"), each with blank sets matching its prescription. Next to
     every name is a small ⇄ dropdown: the program exercise first, then its
     known alternatives — the program's own Alternates field, any "(alt: …)"
     in the name, and the movement family below. Families are checked in
     order, so the more specific ones (decline press, leg curl, split squat)
     sit above the general ones (bench press, curl, squat). */
  const EXERCISE_FAMILIES = [
    [/decline[\w\s-]*\b(bench|press)\b/, ['Decline Barbell Bench Press', 'Decline Dumbbell Press', 'Decline Smith Machine Press', 'Decline Machine Press', 'Chest Dips', 'High-to-Low Cable Fly']],
    [/incline[\w\s-]*\bpress\b/, ['Incline Barbell Bench Press', 'Incline Dumbbell Press', 'Incline Smith Machine Press', 'Incline Machine Press', 'Low-to-High Cable Fly', 'Landmine Press']],
    [/close.?grip/, ['Close-Grip Bench Press', 'Close-Grip Smith Machine Press', 'JM Press', 'Diamond Push-up', 'Parallel Bar Dips']],
    [/bench press|chest press|floor press/, ['Barbell Bench Press', 'Dumbbell Bench Press', 'Smith Machine Bench Press', 'Machine Chest Press', 'Floor Press', 'Push-up']],
    [/rear delt|reverse fl|face pull|pull.?apart/, ['Rear Delt Dumbbell Fly', 'Reverse Pec Deck', 'Cable Rear Delt Fly', 'Face Pull', 'Band Pull-Apart']],
    [/lateral (raise|fl)/, ['Dumbbell Lateral Raise', 'Cable Lateral Raise', 'Machine Lateral Raise', 'Lean-Away Lateral Raise']],
    [/\bfl(y|ies|yes)\b|cross ?over|pec deck/, ['Cable Fly', 'Dumbbell Fly', 'Pec Deck', 'Cable Crossover', 'Svend Press']],
    [/push.?ups?\b/, ['Push-up', 'Knee Push-up', 'Incline Push-up', 'Decline Push-up', 'Weighted Push-up']],
    [/\bdips?\b/, ['Parallel Bar Dips', 'Assisted Dip Machine', 'Bench Dips', 'Weighted Dips']],
    [/upright row/, ['Barbell Upright Row', 'Cable Upright Row', 'Dumbbell Upright Row', 'Dumbbell Lateral Raise']],
    [/(single|one).?arm[\w\s-]*row/, ['Single-Arm Dumbbell Row', 'Single-Arm Cable Row', 'Kroc Row', 'Meadows Row']],
    [/\brows?\b/, ['Barbell Row', 'Dumbbell Row', 'Chest-Supported Dumbbell Row', 'Seated Cable Row', 'T-Bar Row', 'Machine Row', 'Pendlay Row', 'Inverted Row']],
    [/pullover|straight.?arm/, ['Dumbbell Pullover', 'Straight-Arm Cable Pulldown', 'Machine Pullover', 'Rope Pullover']],
    [/pull.?ups?\b|chin.?ups?\b|chinups|pulldown/, ['Pull-up', 'Chin-up', 'Weighted Pull-up', 'Assisted Pull-up', 'Wide-Grip Lat Pulldown', 'Close-Grip Lat Pulldown', 'Single-Arm Lat Pulldown']],
    [/military press|overhead press|shoulder press|arnold|behind the neck|scott press|vertical push/, ['Standing Military Press', 'Seated Dumbbell Shoulder Press', 'Arnold Press', 'Machine Shoulder Press', 'Landmine Press', 'Push Press']],
    [/front raise/, ['Dumbbell Front Raise', 'Cable Front Raise', 'Plate Front Raise', 'Barbell Front Raise']],
    [/shrug/, ['Barbell Shrug', 'Dumbbell Shrug', 'Trap Bar Shrug', 'Cable Shrug', 'Smith Machine Shrug']],
    [/leg curl|hamstring curl|nordic/, ['Lying Leg Curl', 'Seated Leg Curl', 'Standing Leg Curl', 'Nordic Curl', 'Stability Ball Leg Curl', 'Sliding Leg Curl']],
    [/wrist curl|wrist roller/, ['Barbell Wrist Curl', 'Dumbbell Wrist Curl', 'Reverse Wrist Curl', 'Wrist Roller']],
    [/hammer|reverse curl/, ['Hammer Curl', 'Rope Hammer Curl', 'Cross-Body Hammer Curl', 'Reverse EZ-Bar Curl']],
    [/preacher|spider|concentration/, ['Preacher Curl', 'Machine Preacher Curl', 'Spider Curl', 'Concentration Curl']],
    [/\bcurls?\b/, ['Barbell Curl', 'EZ-Bar Curl', 'Dumbbell Curl', 'Incline Dumbbell Curl', 'Cable Curl', 'Preacher Curl', 'Hammer Curl']],
    [/skull|french press|extension.*tricep|tricep.*extension|overhead[\w\s-]*extension/, ['Overhead Dumbbell Extension', 'Overhead Cable Extension', 'EZ-Bar Skull Crusher', 'Dumbbell Skull Crusher', 'French Press']],
    [/pushdown|kickback/, ['Rope Pushdown', 'Straight-Bar Pushdown', 'Reverse-Grip Pushdown', 'Cable Kickback', 'Dumbbell Kickback']],
    [/split squat|lunge|step.?ups?\b|stepup/, ['Bulgarian Split Squat', 'Static Split Squat', 'Walking Lunge', 'Reverse Lunge', 'Step-up', 'Landmine Split Squat']],
    [/leg press/, ['Leg Press', 'Pendulum Squat', 'Hack Squat', 'Belt Squat', 'Smith Machine Squat']],
    [/squat/, ['Back Squat', 'Front Squat', 'Goblet Squat', 'Hack Squat', 'Smith Machine Squat', 'Zercher Squat', 'Leg Press']],
    [/leg extension/, ['Leg Extension', 'Single-Leg Extension', 'Sissy Squat', 'Reverse Nordic', 'Spanish Squat']],
    [/romanian|stiff.?leg|straight.?leg deadlift|good morning|\brdl\b/, ['Romanian Deadlift', 'Dumbbell Romanian Deadlift', 'Stiff-Leg Deadlift', 'Single-Leg Romanian Deadlift', 'Good Morning', 'Cable Pull-Through']],
    [/deadlift/, ['Conventional Deadlift', 'Sumo Deadlift', 'Trap Bar Deadlift', 'Rack Pull', 'Deficit Deadlift']],
    [/hip thrust|glute bridge|hip raise/, ['Barbell Hip Thrust', 'Smith Machine Hip Thrust', 'Machine Hip Thrust', 'Single-Leg Hip Thrust', 'Glute Bridge', 'Cable Pull-Through']],
    [/abduct/, ['Machine Hip Abduction', 'Cable Hip Abduction', 'Banded Lateral Walk', 'Side-Lying Leg Raise']],
    [/adduct|copenhagen/, ['Machine Hip Adduction', 'Seated Dumbbell Hip Adduction', 'Cable Hip Adduction', 'Copenhagen Plank']],
    [/calf|calves/, ['Standing Calf Raise', 'Seated Calf Raise', 'Leg Press Calf Raise', 'Smith Machine Calf Raise', 'Single-Leg Calf Raise', 'Donkey Calf Raise']],
    [/back extension|hyperextension/, ['45° Back Extension', 'Reverse Hyperextension', 'Good Morning', 'Bird Dog']],
    [/crunch/, ['Cable Crunch', 'Machine Crunch', 'Decline Crunch', 'Ab Wheel Rollout']],
    [/leg raise|knee.?ups?\b|knee raise/, ['Hanging Leg Raise', 'Hanging Knee Raise', "Captain's Chair Knee Raise", 'Lying Leg Raise', 'Reverse Crunch']],
    [/side bend/, ['Cable Side Bend', 'Dumbbell Side Bend', 'Suitcase Carry', 'Pallof Press']],
    [/plank/, ['Front Plank', 'Side Plank', 'RKC Plank', 'Ab Wheel Rollout', 'Dead Bug']],
    [/hip flex/, ['Standing Cable Hip Flexion', 'Hanging Knee Raise', 'Banded Psoas March', 'Lying Leg Raise']]
  ];
  const ALT_IN_NAME = /\s*\((?:alt|or)[:.]?\s+([^)]+)\)/i;

  // "Military Press (alt: Arnold Press)" → name "Military Press", alts ["Arnold Press"].
  function splitAltFromName(name){
    const m = String(name || '').match(ALT_IN_NAME);
    if (!m) return { name: String(name || '').trim(), alts: [] };
    return { name: String(name).replace(ALT_IN_NAME, '').trim(), alts: m[1].split(/\s*[\/,]\s*/).filter(Boolean) };
  }

  // The program's free-text Alternates field, when it's a list of named
  // exercises (not "Coach picks any …" guidance).
  function namedAlternates(text){
    const t = String(text || '').trim();
    if (!t || /\b(any|coach|choose|picks?)\b/i.test(t)) return [];
    return t.split(/\s*,\s*/).filter(s => s && s.length <= 60);
  }

  function exerciseAlternatives(base, programAlts){
    const { name, alts } = splitAltFromName(base);
    const plain = name.toLowerCase().replace(/\([^)]*\)/g, ' ');
    const family = (/\b(hold|hang|breath|breathing|stretch|mobility)\b/.test(plain) ? null
      : EXERCISE_FAMILIES.find(([re]) => re.test(plain)));
    const out = [], seen = new Set();
    const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/e?s$/, '');
    [name, ...alts, ...namedAlternates(programAlts), ...(family ? family[1] : [])].forEach(n => {
      const k = norm(n);
      if (n && k && !seen.has(k)){ seen.add(k); out.push(n); }
    });
    return out;
  }

  // A day's program as a freeform list: one entry per exercise, sets left
  // blank to match the prescription. base/baseAlts keep the dropdown's list
  // fixed to the program exercise even after it's been swapped. swapOf(b, e)
  // returns any swap already picked in Program mode for that log, so a
  // switch to Freeform keeps it; seed is the name it started with.
  function freeformFromProgram(day, swapOf){
    const list = [];
    (programData[day] || []).forEach((block, bIdx) => (block.exercises || []).forEach((ex, eIdx) => {
      if (!ex || !String(ex.name || '').trim()) return;
      const nSets = Math.min(parseInt(ex.sets, 10) || 3, 10);
      const start = (swapOf && swapOf(bIdx, eIdx)) || splitAltFromName(ex.name).name;
      const tok = blockToken(block.name);
      const sep = /^\d/.test(tok) ? '.' : '';
      list.push({
        name: start, seed: start,
        base: ex.name, baseAlts: ex.alternates || '', presc: prescString(ex),
        group: block.name || '', label: tok ? tok + sep + (eIdx + 1) : '',
        sets: Array.from({ length: nSets }, () => ({ wt:'', reps:'', done:false }))
      });
    }));
    return list;
  }

  // Anything beyond an untouched program-seeded or blank list?
  function freeformListHasRealData(list){
    return list.some(ex => {
      const name = (ex.name || '').trim();
      const untouched = ex.base ? name === (ex.seed || splitAltFromName(ex.base).name) : !name;
      return !untouched || (ex.sets || []).some(s => s.wt || s.reps || s.done);
    });
  }

  /* The ⇄ dropdown: a compact icon with a native <select> laid over it, so
     phones get their own picker. Returns null when there's nothing to pick. */
  function buildAltPicker(ex, onPick){
    const opts = exerciseAlternatives(ex.base || ex.name, ex.baseAlts);
    if (opts.length < 2) return null;
    const wrap = document.createElement('label');
    wrap.className = 'ff-alt';
    wrap.title = 'Swap for an alternative';
    const sel = document.createElement('select');
    sel.setAttribute('aria-label', 'Alternatives for ' + (ex.name || 'this exercise'));
    const cur = (ex.name || '').trim();
    if (cur && !opts.some(o => o.toLowerCase() === cur.toLowerCase())){
      sel.add(new Option(cur + ' (current)', cur, true, true));
    }
    opts.forEach((o, i) => {
      const opt = new Option(i === 0 && ex.base ? o + (ex.from === 'workout' ? ' — original' : ' — program') : o, o);
      if (o.toLowerCase() === cur.toLowerCase()) opt.selected = true;
      sel.add(opt);
    });
    sel.onchange = () => onPick(sel.value);
    const icon = document.createElement('span');
    icon.className = 'ff-alt-icon';
    icon.textContent = '⇄';
    wrap.appendChild(icon);
    wrap.appendChild(sel);
    return wrap;
  }

  /* Name row for one freeform exercise: name input, ⇄ alternatives, and
     the prescription underneath when it came from the program. A typed-in
     exercise with no program base gets its dropdown once the name is set. */
  function buildFreeformNameRow(ex, exHead, save){
    if (ex.label){
      const tag = document.createElement('span');
      tag.className = 'crud-ex-label';
      tag.textContent = ex.label;
      exHead.appendChild(tag);
    }
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'cs-freeform-name';
    nameInput.placeholder = 'Exercise name…';
    nameInput.value = ex.name || '';
    nameInput.oninput = ()=>{ ex.name = nameInput.value; save(); };
    exHead.appendChild(nameInput);
    let picker = null;
    const placePicker = ()=>{
      const next = buildAltPicker(ex, val => { ex.name = val; nameInput.value = val; save(); placePicker(); });
      if (picker) picker.remove();
      picker = next;
      if (picker) nameInput.after(picker);
    };
    placePicker();
    if (!ex.base) nameInput.onchange = placePicker;
    return nameInput;
  }

  /* Program mode: same ⇄ dropdown, but the program itself never changes —
     the pick is stored per day/exercise in that log (swapKey) and shows as
     the exercise's name there, in exports and in history. Picking the
     program exercise again clears it. */
  function programExName(ex, swapped){ return swapped || ex.name; }
  function fillProgramExHead(exHead, ex, swapped, onPick){
    const cur = swapped || splitAltFromName(ex.name).name;
    exHead.innerHTML = `<div class="ls-ex-name">${esc(programExName(ex, swapped))}${swapped ? `<span class="ls-ex-swapped">swapped from ${esc(splitAltFromName(ex.name).name)}</span>` : ''}</div>`;
    const picker = buildAltPicker({ name: cur, base: ex.name, baseAlts: ex.alternates }, val => {
      onPick(val.toLowerCase() === splitAltFromName(ex.name).name.toLowerCase() ? '' : val);
    });
    if (picker) exHead.appendChild(picker);
    const presc = document.createElement('div');
    presc.className = 'ls-ex-presc';
    presc.textContent = prescString(ex);
    exHead.appendChild(presc);
  }

  /* ---- Freeform logging (per slot, per day) ----
     A coach running a real 1-on-1 often doesn't follow the written program
     block-for-block — they call out exercises as the session unfolds. Mode is
     stored per slot+day so a coach can mix: e.g. Program for Trainee A's
     Monday, Freeform for Trainee B's same slot when they go off-script. */
  function csModeKey(slot, day){ return csKey(slot, day, 'mode'); }
  function getCsMode(slot, day){ return sessionStore[csModeKey(slot, day)] === 'freeform' ? 'freeform' : 'program'; }
  function setCsMode(slot, day, mode){ sessionStore[csModeKey(slot, day)] = mode; saveSession(); }

  function freeformKey(slot, day){ return csKey(slot, day, 'freeform'); }
  function blankFreeformExercise(){ return { name:'', sets:[{ wt:'', reps:'', done:false }] }; }
  function getFreeformExercises(slot, day){
    try {
      const arr = JSON.parse(sessionStore[freeformKey(slot, day)] || 'null');
      if (Array.isArray(arr) && arr.length) return arr;
    } catch(e){ /* fall through to default below */ }
    const seeded = freeformFromProgram(day, (b, e) => sessionStore[csKey(slot, day, b, e, 'swap')]);
    return seeded.length ? seeded : [ blankFreeformExercise() ];
  }
  function saveFreeformExercises(slot, day, arr){
    sessionStore[freeformKey(slot, day)] = JSON.stringify(arr);
    saveSession();
  }

  /* Whether a slot+day's freeform log has anything a coach would mind
     overwriting — i.e. more than the untouched program-seeded (or blank)
     list getFreeformExercises() hands back by default. */
  function freeformHasRealData(slot, day){
    return freeformListHasRealData(getFreeformExercises(slot, day));
  }

  /* Copies just the exercise names & order from one slot's freeform list to
     another, same day — each landing with fresh blank sets so the receiving
     trainee logs their own weight/reps. Used for back-to-back trainees doing
     the same freeform workout. */
  function copyFreeformToSlot(fromSlot, toSlot, day){
    const source = getFreeformExercises(fromSlot, day).filter(ex => ex.name && ex.name.trim());
    if (!source.length){ showToast('Nothing to copy yet — add exercise names first'); return; }
    if (freeformHasRealData(toSlot, day)){
      const targetLabel = slotTraineeName(toSlot).trim() || ('Slot ' + (toSlot+1));
      if (!confirm("This will overwrite " + targetLabel + "'s existing freeform log for today. Continue?")) return;
    }
    const copied = source.map(ex => ({
      name: ex.name, seed: ex.seed, base: ex.base, baseAlts: ex.baseAlts, from: ex.from, presc: ex.presc,
      group: ex.group || '', label: ex.label || '',
      sets: (ex.sets && ex.sets.length ? ex.sets : [{}]).map(()=> ({ wt:'', reps:'', done:false }))
    }));
    saveFreeformExercises(toSlot, day, copied);
    setCsMode(toSlot, day, 'freeform');
    const targetLabel = slotTraineeName(toSlot).trim() || ('Slot ' + (toSlot+1));
    showToast('Copied ' + source.length + ' exercise' + (source.length===1?'':'s') + ' to ' + targetLabel);
  }

  function renderSlotSwitch(){
    const bar = document.getElementById('cs-slot-switch');
    if (!bar) return;
    bar.innerHTML = '';
    for (let i=0; i<CS_SLOT_COUNT; i++){
      const name = slotTraineeName(i);
      const b = document.createElement('button');
      b.className = 'cs-slot-btn' + (i===csSlot ? ' active' : '') + (name ? '' : ' cs-slot-empty');
      b.innerHTML = `<span class="cs-slot-num">${i+1}</span><span>${esc(name || 'Empty slot')}</span>`;
      b.onclick = ()=>{ csSlot = i; renderSlotSwitch(); renderSessionDay(); };
      bar.appendChild(b);
    }
  }

  function renderSessionDayTabs(){
    const bar = document.getElementById('cs-day-tabs');
    if (!bar) return;
    bar.innerHTML = '';
    const select = document.createElement('select');
    select.className = 'day-tabs-dropdown';
    select.setAttribute('aria-label', 'Select day for this session');
    DAY_ORDER.forEach(d=>{
      const opt = document.createElement('option');
      opt.value = d;
      opt.textContent = DAY_META[d].title.split('—')[0].trim();
      if (d===csDay) opt.selected = true;
      select.appendChild(opt);
    });
    select.onchange = ()=>{ csDay = select.value; renderSessionDayTabs(); renderSessionDay(); };
    bar.appendChild(select);
    DAY_ORDER.forEach(d=>{
      const b = document.createElement('button');
      b.className = 'subtab-btn' + (d===csDay ? ' active' : '');
      b.textContent = DAY_META[d].title.split('—')[0].trim();
      b.onclick = ()=>{ csDay = d; renderSessionDayTabs(); renderSessionDay(); };
      bar.appendChild(b);
    });
  }

  function renderSessionDay(){
    const traineeEl = document.getElementById('cs-trainee');
    if (!traineeEl) return;
    traineeEl.value = slotTraineeName(csSlot);
    document.getElementById('cs-date').value = sessionStore[csKey(csSlot,csDay,'meta','date')] || '';
    document.getElementById('cs-bw').value = sessionStore[csKey(csSlot,csDay,'meta','bw')] || '';
    document.getElementById('cs-notes').value = sessionStore[csKey(csSlot,csDay,'notes')] || '';

    const mode = getCsMode(csSlot, csDay);
    const progBtn = document.getElementById('cs-mode-program');
    const freeBtn = document.getElementById('cs-mode-freeform');
    if (progBtn && freeBtn){
      progBtn.classList.toggle('active', mode === 'program');
      freeBtn.classList.toggle('active', mode === 'freeform');
    }

    const syncBtn = document.getElementById('cs-sync-member');
    if (syncBtn){
      const tName = slotTraineeName(csSlot).trim();
      syncBtn.textContent = tName ? ('Sync to ' + tName + "'s Log") : 'Sync to Member Log';
    }

    const wrap = document.getElementById('cs-blocks');
    wrap.innerHTML = '';

    if (mode === 'freeform'){
      renderFreeformBlocks(wrap);
      return;
    }

    const blocks = programData[csDay] || [];

    blocks.forEach((block, bIdx)=>{
      const bDiv = document.createElement('div');
      bDiv.className = 'ls-block';
      const head = document.createElement('div');
      head.className = 'ls-block-head';
      head.textContent = block.name;
      bDiv.appendChild(head);

      block.exercises.forEach((ex, eIdx)=>{
        const nSets = parseInt(ex.sets, 10) || 3;
        const exDiv = document.createElement('div');
        exDiv.className = 'ls-exercise';
        const exHead = document.createElement('div');
        exHead.className = 'ls-ex-head';
        const swapKey = csKey(csSlot,csDay,bIdx,eIdx,'swap');
        fillProgramExHead(exHead, ex, sessionStore[swapKey], val => {
          if (val) sessionStore[swapKey] = val; else delete sessionStore[swapKey];
          saveSession(); renderSessionDay();
        });
        exDiv.appendChild(exHead);
        const ml = metaLine(ex);
        if (ml){
          const metaDiv = document.createElement('div');
          metaDiv.className = 'ls-ex-meta';
          metaDiv.innerHTML = ml;
          exDiv.appendChild(metaDiv);
        }
        const setsDiv = document.createElement('div');
        setsDiv.className = 'ls-sets';
        for(let s=0; s<nSets; s++){
          const doneKey = csKey(csSlot,csDay,bIdx,eIdx,s,'done');
          const wtKey = csKey(csSlot,csDay,bIdx,eIdx,s,'wt');
          const repsKey = csKey(csSlot,csDay,bIdx,eIdx,s,'reps');
          const setDiv = document.createElement('div');
          setDiv.className = 'ls-set' + (sessionStore[doneKey] ? ' done' : '');
          setDiv.innerHTML = `
            <input type="checkbox" ${sessionStore[doneKey] ? 'checked' : ''}>
            <span class="ls-set-label">S${s+1}</span>
            <input type="text" inputmode="decimal" placeholder="wt" value="${esc(sessionStore[wtKey]||'')}">
            <span class="ls-slash">/</span>
            <input type="text" inputmode="numeric" placeholder="reps" value="${esc(sessionStore[repsKey]||'')}">
          `;
          const cb = setDiv.querySelector('input[type=checkbox]');
          const inputs = setDiv.querySelectorAll('input[type=text]');
          cb.onchange = ()=>{ sessionStore[doneKey]=cb.checked; setDiv.classList.toggle('done', cb.checked); saveSession(); };
          inputs[0].oninput = ()=>{ sessionStore[wtKey]=inputs[0].value; saveSession(); };
          inputs[1].oninput = ()=>{ sessionStore[repsKey]=inputs[1].value; saveSession(); };
          setsDiv.appendChild(setDiv);
        }
        exDiv.appendChild(setsDiv);
        bDiv.appendChild(exDiv);
      });
      wrap.appendChild(bDiv);
    });
  }

  /* Freeform rendering: no program blocks — the coach builds the exercise
     list live. Same ls-block/ls-exercise/ls-sets shell as the program view
     (so it looks and behaves consistently), but exercise name is an editable
     input and exercises/sets can be added or removed on the fly. */
  function renderFreeformBlocks(wrap){
    const list = getFreeformExercises(csSlot, csDay);

    const bDiv = document.createElement('div');
    bDiv.className = 'ls-block';
    const head = document.createElement('div');
    head.className = 'ls-block-head';
    head.textContent = 'Freeform';
    bDiv.appendChild(head);

    list.forEach((ex, eIdx)=>{
      if (!ex.sets || !ex.sets.length) ex.sets = [{ wt:'', reps:'', done:false }];
      const groupHead = freeformGroupHead(list, eIdx);
      if (groupHead) bDiv.appendChild(groupHead);
      const exDiv = document.createElement('div');
      exDiv.className = 'ls-exercise cs-freeform-exercise';

      const exHead = document.createElement('div');
      exHead.className = 'ls-ex-head cs-freeform-ex-head';

      buildFreeformNameRow(ex, exHead, ()=> saveFreeformExercises(csSlot, csDay, list));

      const removeExBtn = document.createElement('button');
      removeExBtn.type = 'button';
      removeExBtn.className = 'cs-freeform-remove-ex';
      removeExBtn.title = 'Remove exercise';
      removeExBtn.textContent = '✕';
      removeExBtn.onclick = ()=>{
        if (list.length <= 1){
          list[eIdx] = blankFreeformExercise();
        } else {
          list.splice(eIdx, 1);
        }
        saveFreeformExercises(csSlot, csDay, list);
        renderSessionDay();
      };
      exHead.appendChild(removeExBtn);
      exDiv.appendChild(exHead);
      if (ex.presc){
        const prescDiv = document.createElement('div');
        prescDiv.className = 'ls-ex-presc cs-freeform-presc';
        prescDiv.textContent = (ex.from === 'workout' ? 'Plan: ' : 'Program: ') + ex.presc;
        exDiv.appendChild(prescDiv);
      }

      const setsDiv = document.createElement('div');
      setsDiv.className = 'ls-sets';
      ex.sets.forEach((set, sIdx)=>{
        const setDiv = document.createElement('div');
        setDiv.className = 'ls-set' + (set.done ? ' done' : '');
        setDiv.innerHTML = `
          <input type="checkbox" ${set.done ? 'checked' : ''}>
          <span class="ls-set-label">S${sIdx+1}</span>
          <input type="text" inputmode="decimal" placeholder="wt" value="${esc(set.wt||'')}">
          <span class="ls-slash">/</span>
          <input type="text" inputmode="numeric" placeholder="reps" value="${esc(set.reps||'')}">
        `;
        const cb = setDiv.querySelector('input[type=checkbox]');
        const inputs = setDiv.querySelectorAll('input[type=text]');
        cb.onchange = ()=>{ set.done = cb.checked; setDiv.classList.toggle('done', cb.checked); saveFreeformExercises(csSlot, csDay, list); };
        inputs[0].oninput = ()=>{ set.wt = inputs[0].value; saveFreeformExercises(csSlot, csDay, list); };
        inputs[1].oninput = ()=>{ set.reps = inputs[1].value; saveFreeformExercises(csSlot, csDay, list); };

        if (ex.sets.length > 1){
          const rmSetBtn = document.createElement('button');
          rmSetBtn.type = 'button';
          rmSetBtn.className = 'cs-freeform-remove-set';
          rmSetBtn.title = 'Remove this set';
          rmSetBtn.textContent = '−';
          rmSetBtn.onclick = ()=>{
            ex.sets.splice(sIdx, 1);
            saveFreeformExercises(csSlot, csDay, list);
            renderSessionDay();
          };
          setDiv.appendChild(rmSetBtn);
        }
        setsDiv.appendChild(setDiv);
      });
      exDiv.appendChild(setsDiv);

      const addSetBtn = document.createElement('button');
      addSetBtn.type = 'button';
      addSetBtn.className = 'btn2 cs-freeform-add-set';
      addSetBtn.textContent = '+ Add Set';
      addSetBtn.onclick = ()=>{
        ex.sets.push({ wt:'', reps:'', done:false });
        saveFreeformExercises(csSlot, csDay, list);
        renderSessionDay();
      };
      exDiv.appendChild(addSetBtn);

      bDiv.appendChild(exDiv);
    });

    wrap.appendChild(bDiv);

    const addExBtn = document.createElement('button');
    addExBtn.type = 'button';
    addExBtn.className = 'btn2 primary cs-freeform-add-ex';
    addExBtn.textContent = '+ Add Exercise';
    addExBtn.onclick = ()=>{
      list.push(blankFreeformExercise());
      saveFreeformExercises(csSlot, csDay, list);
      renderSessionDay();
      const names = wrap.querySelectorAll('.cs-freeform-name');
      if (names.length) names[names.length-1].focus();
    };
    wrap.appendChild(addExBtn);

    const copyWrap = document.createElement('div');
    copyWrap.className = 'cs-freeform-copy-wrap';
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'btn2 cs-freeform-copy-btn';
    copyBtn.textContent = 'Copy Exercises To…';
    const copyMenu = document.createElement('div');
    copyMenu.className = 'cs-freeform-copy-menu';
    copyMenu.style.display = 'none';
    for (let i=0; i<CS_SLOT_COUNT; i++){
      if (i === csSlot) continue;
      const name = slotTraineeName(i).trim();
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'cs-freeform-copy-item';
      item.textContent = name || ('Slot ' + (i+1) + ' — Empty');
      item.onclick = ()=>{
        copyMenu.style.display = 'none';
        copyFreeformToSlot(csSlot, i, csDay);
      };
      copyMenu.appendChild(item);
    }
    copyBtn.onclick = (e)=>{
      e.stopPropagation();
      copyMenu.style.display = copyMenu.style.display === 'none' ? 'block' : 'none';
    };
    copyWrap.appendChild(copyBtn);
    copyWrap.appendChild(copyMenu);
    wrap.appendChild(copyWrap);
  }

  /* Placeholder for member-side sync — pushes a coach's logged sets into
     that trainee's own Session Log storage. Only meaningful when coach and
     trainee share the same device/browser (this file has no server, so
     localStorage can't cross devices) — left as a stub until the sync
     approach (same-device vs. some future backend) is decided. */
  function syncFreeformToMemberLog(slot, day){
    const name = slotTraineeName(slot).trim() || 'this trainee';
    alert("Sync to Member Log isn't wired up yet — this will push " + name + "'s logged sets from this session into their own Session Log. Coming soon.");
  }

  function wireSessionOnce(){
    const traineeEl = document.getElementById('cs-trainee');
    if (!traineeEl || traineeEl.dataset.wired) return;
    traineeEl.dataset.wired = '1';
    traineeEl.addEventListener('input', e=>{
      sessionStore[csKey(csSlot,'trainee')]=e.target.value;
      saveSession();
      renderSlotSwitch(); // keep the slot pill label in sync as the coach types
      const syncBtn = document.getElementById('cs-sync-member');
      if (syncBtn){
        const tName = e.target.value.trim();
        syncBtn.textContent = tName ? ('Sync to ' + tName + "'s Log") : 'Sync to Member Log';
      }
    });
    document.getElementById('cs-date').addEventListener('input', e=>{ sessionStore[csKey(csSlot,csDay,'meta','date')]=e.target.value; saveSession(); });
    document.getElementById('cs-bw').addEventListener('input', e=>{ sessionStore[csKey(csSlot,csDay,'meta','bw')]=e.target.value; saveSession(); });
    document.getElementById('cs-notes').addEventListener('input', e=>{ sessionStore[csKey(csSlot,csDay,'notes')]=e.target.value; saveSession(); });

    document.getElementById('cs-clear').onclick = ()=>{
      const name = slotTraineeName(csSlot) || ('Slot ' + (csSlot+1));
      if(!confirm("Clear " + name + "'s slot — name, all days' sets, weight, reps and notes for this slot only? The other slots are untouched. Do this once you're done saving a copy for this trainee.")) return;
      const prefix = 's' + csSlot + ':';
      Object.keys(sessionStore).forEach(k=>{ if (k.startsWith(prefix)) delete sessionStore[k]; });
      saveSession();
      renderSlotSwitch();
      renderSessionDay();
    };

    document.getElementById('cs-save-pdf').onclick = ()=> saveSessionAs('pdf');
    document.getElementById('cs-save-md').onclick = ()=> saveSessionAs('md');
    document.getElementById('cs-save-txt').onclick = ()=> saveSessionAs('txt');
    document.getElementById('cs-sync-member').onclick = ()=> syncFreeformToMemberLog(csSlot, csDay);

    document.getElementById('cs-mode-program').onclick = ()=>{
      setCsMode(csSlot, csDay, 'program');
      renderSessionDay();
    };
    document.getElementById('cs-mode-freeform').onclick = ()=>{
      setCsMode(csSlot, csDay, 'freeform');
      renderSessionDay();
    };
  }

  /* Snapshot of the active slot's current-day session — same shape as the
     member Logsheet's snapshotDay(), plus the trainee name, so the PDF/MD/TXT
     builders below can stay close cousins of the existing Logsheet export code. */
  function snapshotSessionDay(slot, day){
    const meta = DAY_META[day];
    const mode = getCsMode(slot, day);
    let blocks;
    if (mode === 'freeform'){
      const list = getFreeformExercises(slot, day).filter(ex => (ex.name||'').trim());
      blocks = [{
        name: 'Freeform',
        exercises: list.map(ex => ({
          name: ex.name,
          presc: '',
          meta: '',
          sets: (ex.sets||[]).map(s => ({ done: !!s.done, wt: s.wt||'', reps: s.reps||'' }))
        }))
      }];
    } else {
      blocks = (programData[day]||[]).map((block,bIdx)=>({
        name: block.name,
        exercises: block.exercises.map((ex,eIdx)=>{
          const nSets = parseInt(ex.sets,10) || 3;
          const sets = [];
          for(let s=0;s<nSets;s++){
            sets.push({
              done: !!sessionStore[csKey(slot,day,bIdx,eIdx,s,'done')],
              wt: sessionStore[csKey(slot,day,bIdx,eIdx,s,'wt')] || '',
              reps: sessionStore[csKey(slot,day,bIdx,eIdx,s,'reps')] || ''
            });
          }
          return { name: programExName(ex, sessionStore[csKey(slot,day,bIdx,eIdx,'swap')]), presc: prescString(ex), meta: metaLine(ex).replace(/&nbsp;/g,' ').replace(/•/g,'|'), sets };
        })
      }));
    }
    return {
      trainee: slotTraineeName(slot),
      title: meta.title, duration: meta.duration, hold: meta.hold,
      date: sessionStore[csKey(slot,day,'meta','date')]||'', bw: sessionStore[csKey(slot,day,'meta','bw')]||'',
      notes: sessionStore[csKey(slot,day,'notes')]||'', blocks
    };
  }

  function slugify(s){ return String(s||'').trim().replace(/[^\w]+/g,'_').replace(/^_+|_+$/g,'') || 'Unnamed_Trainee'; }

  /* Trainee name is a prominent, expected field — not a hard block. If it's
     empty we just confirm once before saving under a generic label, so a
     coach mid-session can still move fast without losing data. */
  function confirmTraineeName(){
    const name = slotTraineeName(csSlot).trim();
    if (name) return name;
    const proceed = confirm("No trainee name entered for Slot " + (csSlot+1) + " — save this file as 'Unnamed Trainee'?");
    if (!proceed){
      const el = document.getElementById('cs-trainee');
      if (el) el.focus();
      return null;
    }
    return 'Unnamed Trainee';
  }

  function buildSessionMarkdown(snap){
    let out = `# ${snap.title}\n\n`;
    out += `**Trainee:** ${snap.trainee}  \n`;
    out += `**Date:** ${snap.date || '____________'}  \n`;
    out += `**Bodyweight:** ${snap.bw || '______'}  \n`;
    out += `**Duration:** ${snap.duration}\n\n`;
    snap.blocks.forEach(block=>{
      out += `## ${block.name}\n\n`;
      block.exercises.forEach(ex=>{
        out += `**${ex.name}**`;
        if (ex.presc) out += ` — _${ex.presc}_`;
        if (ex.meta) out += `  \n${ex.meta}`;
        out += '\n\n';
        out += '| Set | Done | Weight | Reps |\n|---|---|---|---|\n';
        ex.sets.forEach((s,i)=>{
          out += `| S${i+1} | ${s.done?'x':' '} | ${s.wt||'—'} | ${s.reps||'—'} |\n`;
        });
        out += '\n';
      });
    });
    out += `**Signature Hold:** ${snap.hold}\n\n`;
    out += `## Session Notes / RPE\n\n${snap.notes || '_(none logged)_'}\n`;
    return out;
  }

  function buildSessionText(snap){
    let out = "BELL(E)S N' BARZ — LIVE SESSION LOG\n";
    out += "===================================\n\n";
    out += `Trainee:     ${snap.trainee}\n`;
    out += `Day:         ${snap.title}\n`;
    out += `Date:        ${snap.date || '____________'}\n`;
    out += `Bodyweight:  ${snap.bw || '______'}\n`;
    out += `Duration:    ${snap.duration}\n\n`;
    snap.blocks.forEach(block=>{
      out += `-- ${block.name.toUpperCase()} --\n`;
      block.exercises.forEach(ex=>{
        out += ex.presc ? `${ex.name}  (${ex.presc})\n` : `${ex.name}\n`;
        if (ex.meta) out += `  ${ex.meta}\n`;
        ex.sets.forEach((s,i)=>{
          out += `  S${i+1} [${s.done?'x':' '}] ${s.wt||'__'} / ${s.reps||'__'}\n`;
        });
        out += '\n';
      });
    });
    out += `Signature Hold: ${snap.hold}\n\n`;
    out += `SESSION NOTES / RPE\n${snap.notes || '(none logged)'}\n`;
    return out;
  }

  function downloadTextFile(filename, content, mime){
    const blob = new Blob([content], {type: mime});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  async function saveSessionAs(format){
    const traineeName = confirmTraineeName();
    if (!traineeName) return;

    const snap = snapshotSessionDay(csSlot, csDay);
    snap.trainee = traineeName;
    const fileBase = 'BnB_Session_' + slugify(traineeName) + '_' + snap.title.replace(/[^\w]+/g,'_');

    if (format === 'md'){
      downloadTextFile(fileBase + '.md', buildSessionMarkdown(snap), 'text/markdown');
      return;
    }
    if (format === 'txt'){
      downloadTextFile(fileBase + '.txt', buildSessionText(snap), 'text/plain');
      return;
    }

    // PDF — same rendering approach as the member Logsheet's Download PDF,
    // with the trainee's name added to the header.
    const btn = document.getElementById('cs-save-pdf');
    const orig = btn.textContent; btn.textContent = 'Building PDF…'; btn.disabled = true;
    try {
      await ensureJsPdf();
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit:'pt', format:'letter' });
      const gold = [201,169,79], ink = [20,18,16], muted = [110,102,88];
      const green = [15,110,86], rust = [153,60,29];
      const pageW = doc.internal.pageSize.getWidth();
      let y = 40;

      doc.setProperties({ title: "Bell(e)s N' Barz \u2014 " + snap.title + ' \u2014 ' + (snap.trainee || 'Session') });

      doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...gold);
      doc.text("BELL(E)S N' BARZ  •  LIVE SESSION LOG", 40, y);
      doc.setFontSize(20); doc.setTextColor(...ink);
      y += 26; doc.text(snap.title, 40, y);
      doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(...muted);
      y += 16; doc.text('Trainee: ' + snap.trainee, 40, y);
      y += 14; doc.text(snap.duration + '   ·   Date: ' + (snap.date||'____________') + '   ·   Bodyweight: ' + (snap.bw||'______'), 40, y);
      y += 10; doc.setDrawColor(...gold); doc.line(40, y, pageW-40, y);
      y += 20;

      snap.blocks.forEach(block=>{
        if (y > 700){ doc.addPage(); y = 40; }
        doc.setFillColor(20,18,16); doc.rect(40, y-12, pageW-80, 18, 'F');
        doc.setFont('helvetica','bold'); doc.setFontSize(10.5); doc.setTextColor(255,255,255);
        doc.text(block.name.toUpperCase(), 46, y+1);
        y += 20;
        block.exercises.forEach(ex=>{
          if (y > 700){ doc.addPage(); y = 40; }
          doc.setFont('helvetica','bold'); doc.setFontSize(10.5); doc.setTextColor(...ink);
          doc.text(ex.name, 44, y);
          if (ex.presc){
            doc.setFont('helvetica','italic'); doc.setFontSize(8.5); doc.setTextColor(...muted);
            doc.text(ex.presc, pageW-44, y, {align:'right'});
          }
          y += 12;
          if (ex.meta){
            doc.setFont('helvetica','italic'); doc.setFontSize(7.5); doc.setTextColor(...muted);
            doc.text(ex.meta, 44, y);
            y += 11;
          }
          y = drawPdfSetChips(doc, ex.sets, 44, y, pageW-44, { green, rust, muted });
          y += 16;
        });
        y += 6;
      });

      if (y > 680){ doc.addPage(); y = 40; }
      doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...ink);
      const holdTextX1 = drawPdfStar(doc, 40, y, gold);
      doc.text('Signature Hold: ' + snap.hold, holdTextX1, y);
      y += 20;
      doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...muted);
      doc.text('SESSION NOTES / RPE', 40, y);
      y += 14;
      doc.setDrawColor(200,195,180); doc.rect(40, y-10, pageW-80, 50);
      doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...ink);
      doc.text(doc.splitTextToSize(snap.notes || '', pageW-96), 46, y+2);

      doc.save(fileBase + '.pdf');
    } catch(err){
      alert('PDF export needs an internet connection the first time (to load the PDF library). Please check your connection and try again.');
      console.error(err);
    } finally {
      btn.textContent = orig; btn.disabled = false;
    }
  }

  /* ========================= MEMBER — LIVE SESSION LOG ========================= */
  /* Replaces the old flat Session Log ("Sesh"). Shares the same mode toggle
     (Day's Program / Freeform), dynamic set add/remove, and PDF/md/txt export
     as the Coach Live Session above — same live-logging tool, single member
     instead of 5 trainee slots. No slot switcher, no trainee field.

     "Signed in" is silent and inferred, not asked for: this app has no real
     login, so we reuse the same self-member selection Schedule/Billing/Coach
     already rely on (window.BNB_USERS.getSignedInMember). If a real member
     record is selected, sets saved here can also be committed to a
     date-stamped history + progress graph for that member. If there's no
     member to be signed in as, the live logger still works fully — it just
     behaves like the coach's model: one live slot per day-of-week, overwritten
     each week, export-to-file if you want a copy — nothing is retained as
     long-term history for a guest. */
  const MLS_KEY = "bnb-member-livesession-v1";
  const MLS_PENDING_KEY = "bnb-member-livesession-pending-v1";
  let mlsDay = (function(){
    const idx = new Date().getDay(); // 0=Sun..6=Sat
    return DAY_ORDER[idx===0 ? 6 : idx-1];
  })();

  /* Resilience buffer: every edit is written to localStorage synchronously
     (see saveMlsStore below), so typed-but-unsynced data survives a reload
     or a dropped connection instead of vanishing with whatever was still
     in-flight to Supabase. MLS_PENDING_KEY tracks whether the local copy
     has edits Supabase hasn't confirmed yet, so a refresh from the server
     never clobbers data the member just typed. */
  function loadMlsStore(){
    try {
      const raw = localStorage.getItem(MLS_KEY);
      if (raw) return JSON.parse(raw);
    } catch(e){ /* corrupt/unavailable — start fresh */ }
    return {};
  }
  function persistMlsStoreLocal(){
    try { localStorage.setItem(MLS_KEY, JSON.stringify(mlsStore)); }
    catch(e){ /* storage unavailable (private mode, full, etc.) */ }
  }
  function isMlsPending(){
    try { return localStorage.getItem(MLS_PENDING_KEY) === '1'; }
    catch(e){ return false; }
  }
  function setMlsPending(flag){
    try {
      if (flag) localStorage.setItem(MLS_PENDING_KEY, '1');
      else localStorage.removeItem(MLS_PENDING_KEY);
    } catch(e){ /* storage unavailable */ }
  }

  let mlsSaveStatus = isMlsPending() ? 'offline' : 'idle'; // idle|saving|saved|offline
  function setMlsSaveStatus(status){
    mlsSaveStatus = status;
    renderMlsSaveStatus();
  }
  function renderMlsSaveStatus(){
    const el = document.getElementById('mls-save-status');
    if (!el) return;
    const label = { saving: 'Saving…', saved: 'All changes saved', offline: 'Not synced yet — saved on this device', idle: '' }[mlsSaveStatus] || '';
    el.textContent = label;
    el.className = 'mls-save-status' + (mlsSaveStatus ? ' is-' + mlsSaveStatus : '');
  }

  async function refreshMlsStoreFromSupabase(){
    const owner = mlsSignedInMember();
    // Nothing to load until someone is signed in — and not for a seed
    // placeholder ('u1') still standing in before the real users load.
    if (!owner || String(owner.id).length !== 36) return;
    const { data, error } = await bnbClient.from('mls_live_store').select('*').eq('owner_id', owner.id);
    if (error) { console.error('Supabase load mls_live_store failed:', error); return; }
    if (isMlsPending()){
      // This device has edits Supabase hasn't confirmed yet (e.g. it was
      // offline when they were made) — push those instead of overwriting
      // them with what might be stale server data.
      pushMlsStoreToSupabase(owner);
      return;
    }
    if (data && data.length && data[0].data) {
      mlsStore = data[0].data;
      persistMlsStoreLocal();
      if (typeof renderMlsDay === 'function') renderMlsDay();
    }
  }

  let mlsSyncTimer = null;
  let mlsHistoryAutoTimer = null;
  function saveMlsStore(){
    persistMlsStoreLocal(); // instant, always succeeds — the sticky buffer
    const owner = mlsSignedInMember();
    if (!owner) { setMlsSaveStatus('idle'); return; } // guest — local-only, nothing to sync
    setMlsPending(true);
    setMlsSaveStatus('saving');
    clearTimeout(mlsSyncTimer);
    mlsSyncTimer = setTimeout(() => pushMlsStoreToSupabase(owner), 600);
    clearTimeout(mlsHistoryAutoTimer);
    mlsHistoryAutoTimer = setTimeout(() => autoCommitMlsDayToHistory(), 2500);
  }
  async function pushMlsStoreToSupabase(owner){
    try {
      const { error } = await bnbClient.from('mls_live_store')
        .upsert([{ owner_id: owner.id, data: mlsStore, updated_at: new Date().toISOString() }], { onConflict: 'owner_id' });
      if (error) throw error;
      setMlsPending(false);
      setMlsSaveStatus('saved');
    } catch(e){
      console.warn('Supabase save mls_live_store failed:', e);
      setMlsSaveStatus('offline');
    }
  }
  let mlsStore = loadMlsStore();
  refreshMlsStoreFromSupabase(); // async — reconciles with the server once it responds
  // That first call usually runs before the Supabase session is restored
  // and fails; try again once sign-in has finished (and on every later
  // sign-in), same as the program (refreshProgramFromSupabase).
  document.addEventListener('bnb-auth-changed', e => { if (e.detail && e.detail.signedIn) refreshMlsStoreFromSupabase(); });
  function mlsKey(...rest){ return rest.join(':'); }

  /* One-time migration: LOGSHEET used to be a separate tab/store with the
     identical day:block:exercise:set:field key shape. Fold any legacy data
     into the merged Live Session store (without overwriting anything already
     there) so nobody's previously-logged sets disappear when LOGSHEET goes
     away, then retire the old key. */
  (function migrateLegacyLogsheet(){
    const OLD_LOG_KEY = "bnb-logsheet-v1";
    try {
      const raw = localStorage.getItem(OLD_LOG_KEY);
      if (!raw) return;
      const legacy = JSON.parse(raw);
      let changed = false;
      Object.keys(legacy).forEach(k=>{
        if (!(k in mlsStore)) { mlsStore[k] = legacy[k]; changed = true; }
      });
      if (changed) saveMlsStore();
      localStorage.removeItem(OLD_LOG_KEY);
    } catch(e){ /* nothing to migrate */ }
  })();

  function mlsSignedInMember(){
    return (window.BNB_USERS && window.BNB_USERS.getSignedInMember) ? window.BNB_USERS.getSignedInMember() : null;
  }

  function mlsModeKey(day){ return mlsKey(day, 'mode'); }
  function getMlsMode(day){ return mlsStore[mlsModeKey(day)] === 'freeform' ? 'freeform' : 'program'; }
  function setMlsMode(day, mode){ mlsStore[mlsModeKey(day)] = mode; saveMlsStore(); }

  function mlsFreeformKey(day){ return mlsKey(day, 'freeform'); }
  function blankMlsFreeformExercise(){ return { name:'', sets:[{ wt:'', reps:'', done:false }] }; }
  function getMlsFreeformExercises(day){
    try {
      const arr = JSON.parse(mlsStore[mlsFreeformKey(day)] || 'null');
      if (Array.isArray(arr) && arr.length) return arr;
    } catch(e){ /* fall through to default below */ }
    const seeded = freeformFromProgram(day, (b, e) => mlsStore[mlsKey(day, b, e, 'swap')]);
    return seeded.length ? seeded : [ blankMlsFreeformExercise() ];
  }
  function saveMlsFreeformExercises(day, arr){
    mlsStore[mlsFreeformKey(day)] = JSON.stringify(arr);
    saveMlsStore();
  }

  function mlsHistoryToRow(h){
    return {
      id: (h.id && h.id.length === 36) ? h.id : undefined,
      member_id: h.memberId, date_iso: h.dateIso, display_date: h.displayDate,
      day: h.day, mode: h.mode, bw: h.bw, notes: h.notes, exercises: h.exercises || []
    };
  }
  function rowToMlsHistory(r){
    return {
      id: r.id, memberId: r.member_id, dateIso: r.date_iso, displayDate: r.display_date||'',
      day: r.day, mode: r.mode, bw: r.bw||'', notes: r.notes||'', exercises: r.exercises || []
    };
  }

  let mlsHistoryCache = null; // populated by refreshMlsHistoryFromSupabase
  refreshMlsHistoryFromSupabase(); // async — populates cache once Supabase responds

  function loadMlsHistory(){
    // Synchronous read for existing call sites — served from cache once
    // refreshMlsHistoryFromSupabase() has run at least once. Starts empty.
    return mlsHistoryCache ? mlsHistoryCache.slice() : [];
  }
  async function refreshMlsHistoryFromSupabase(){
    const { data, error } = await bnbClient.from('mls_history').select('*');
    if (error) { console.error('Supabase load mls_history failed:', error); return; }
    mlsHistoryCache = (data || []).map(rowToMlsHistory);
    if (typeof renderMlsHistoryTable === 'function') renderMlsHistoryTable();
    if (typeof renderMlsGraphOptions === 'function') renderMlsGraphOptions();
    if (typeof renderMlsGraph === 'function') renderMlsGraph();
  }
  function saveMlsHistoryArr(arr){
    // Diff against the previous cache so entries removed from the array
    // (via the per-row delete button or "Clear History") actually get
    // deleted from Supabase too — upsert alone would leave them behind.
    const oldIds = new Set((mlsHistoryCache || []).map(h => h.id));
    const newIds = new Set(arr.map(h => h.id));
    const removedIds = [...oldIds].filter(id => !newIds.has(id));

    mlsHistoryCache = arr;
    (async () => {
      const rows = arr.map(mlsHistoryToRow);
      await Promise.allSettled(rows.map(row => bnbClient.from('mls_history').upsert([row])));
      await Promise.allSettled(removedIds.map(id => bnbClient.from('mls_history').delete().eq('id', id)));
    })();
  }

  function renderMlsDayTabs(){
    const bar = document.getElementById('mls-day-tabs');
    if (!bar) return;
    bar.innerHTML = '';
    const select = document.createElement('select');
    select.className = 'day-tabs-dropdown';
    select.setAttribute('aria-label', 'Select day for this session');
    DAY_ORDER.forEach(d=>{
      const opt = document.createElement('option');
      opt.value = d;
      opt.textContent = DAY_META[d].title.split('—')[0].trim();
      if (d===mlsDay) opt.selected = true;
      select.appendChild(opt);
    });
    select.onchange = ()=>{ mlsDay = select.value; renderMlsDayTabs(); renderMlsDay(); };
    bar.appendChild(select);
    DAY_ORDER.forEach(d=>{
      const b = document.createElement('button');
      b.className = 'subtab-btn' + (d===mlsDay ? ' active' : '');
      b.textContent = DAY_META[d].title.split('—')[0].trim();
      b.onclick = ()=>{ mlsDay = d; renderMlsDayTabs(); renderMlsDay(); };
      bar.appendChild(b);
    });
  }

  function renderMlsProgramBlocks(wrap, day){
    const blocks = programData[day] || [];
    wrap.insertAdjacentHTML('beforeend', dayStatsLine(blocks));
    blocks.forEach((block, bIdx)=>{
      const bDiv = document.createElement('div');
      bDiv.className = 'ls-block';
      const head = document.createElement('div');
      head.className = 'ls-block-head';
      head.textContent = block.name;
      bDiv.appendChild(head);

      block.exercises.forEach((ex, eIdx)=>{
        const nSets = parseInt(ex.sets, 10) || 3;
        const exDiv = document.createElement('div');
        exDiv.className = 'ls-exercise';
        const exHead = document.createElement('div');
        exHead.className = 'ls-ex-head';
        const swapKey = mlsKey(day,bIdx,eIdx,'swap');
        fillProgramExHead(exHead, ex, mlsStore[swapKey], val => {
          if (val) mlsStore[swapKey] = val; else delete mlsStore[swapKey];
          saveMlsStore(); renderMlsDay();
        });
        exDiv.appendChild(exHead);
        const ml = metaLine(ex);
        if (ml){
          const metaDiv = document.createElement('div');
          metaDiv.className = 'ls-ex-meta';
          metaDiv.innerHTML = ml;
          exDiv.appendChild(metaDiv);
        }
        const setsDiv = document.createElement('div');
        setsDiv.className = 'ls-sets';
        for(let s=0; s<nSets; s++){
          const doneKey = mlsKey(day,bIdx,eIdx,s,'done');
          const wtKey = mlsKey(day,bIdx,eIdx,s,'wt');
          const repsKey = mlsKey(day,bIdx,eIdx,s,'reps');
          const setDiv = document.createElement('div');
          setDiv.className = 'ls-set' + (mlsStore[doneKey] ? ' done' : '');
          setDiv.innerHTML = `
            <input type="checkbox" ${mlsStore[doneKey] ? 'checked' : ''}>
            <span class="ls-set-label">S${s+1}</span>
            <input type="text" inputmode="decimal" placeholder="wt or BW" value="${esc(mlsStore[wtKey]||'')}">
            <span class="ls-slash">/</span>
            <input type="text" inputmode="numeric" placeholder="reps" value="${esc(mlsStore[repsKey]||'')}">
          `;
          const cb = setDiv.querySelector('input[type=checkbox]');
          const inputs = setDiv.querySelectorAll('input[type=text]');
          cb.onchange = ()=>{ mlsStore[doneKey]=cb.checked; setDiv.classList.toggle('done', cb.checked); saveMlsStore(); };
          inputs[0].oninput = ()=>{ mlsStore[wtKey]=inputs[0].value; saveMlsStore(); };
          inputs[1].oninput = ()=>{ mlsStore[repsKey]=inputs[1].value; saveMlsStore(); };
          setsDiv.appendChild(setDiv);
        }
        exDiv.appendChild(setsDiv);
        bDiv.appendChild(exDiv);
      });
      wrap.appendChild(bDiv);
    });
  }

  function renderMlsFreeformBlocks(wrap, day){
    const list = getMlsFreeformExercises(day);

    const bDiv = document.createElement('div');
    bDiv.className = 'ls-block';
    const head = document.createElement('div');
    head.className = 'ls-block-head';
    head.textContent = 'Freeform';
    bDiv.appendChild(head);

    list.forEach((ex, eIdx)=>{
      if (!ex.sets || !ex.sets.length) ex.sets = [{ wt:'', reps:'', done:false }];
      const groupHead = freeformGroupHead(list, eIdx);
      if (groupHead) bDiv.appendChild(groupHead);
      const exDiv = document.createElement('div');
      exDiv.className = 'ls-exercise cs-freeform-exercise';

      const exHead = document.createElement('div');
      exHead.className = 'ls-ex-head cs-freeform-ex-head';

      buildFreeformNameRow(ex, exHead, ()=> saveMlsFreeformExercises(day, list));

      const removeExBtn = document.createElement('button');
      removeExBtn.type = 'button';
      removeExBtn.className = 'cs-freeform-remove-ex';
      removeExBtn.title = 'Remove exercise';
      removeExBtn.textContent = '✕';
      removeExBtn.onclick = ()=>{
        if (list.length <= 1){
          list[eIdx] = blankMlsFreeformExercise();
        } else {
          list.splice(eIdx, 1);
        }
        saveMlsFreeformExercises(day, list);
        renderMlsDay();
      };
      exHead.appendChild(removeExBtn);
      exDiv.appendChild(exHead);
      if (ex.presc){
        const prescDiv = document.createElement('div');
        prescDiv.className = 'ls-ex-presc cs-freeform-presc';
        prescDiv.textContent = (ex.from === 'workout' ? 'Plan: ' : 'Program: ') + ex.presc;
        exDiv.appendChild(prescDiv);
      }

      const setsDiv = document.createElement('div');
      setsDiv.className = 'ls-sets';
      ex.sets.forEach((set, sIdx)=>{
        const setDiv = document.createElement('div');
        setDiv.className = 'ls-set' + (set.done ? ' done' : '');
        setDiv.innerHTML = `
          <input type="checkbox" ${set.done ? 'checked' : ''}>
          <span class="ls-set-label">S${sIdx+1}</span>
          <input type="text" inputmode="decimal" placeholder="wt or BW" value="${esc(set.wt||'')}">
          <span class="ls-slash">/</span>
          <input type="text" inputmode="numeric" placeholder="reps" value="${esc(set.reps||'')}">
        `;
        const cb = setDiv.querySelector('input[type=checkbox]');
        const inputs = setDiv.querySelectorAll('input[type=text]');
        cb.onchange = ()=>{ set.done = cb.checked; setDiv.classList.toggle('done', cb.checked); saveMlsFreeformExercises(day, list); };
        inputs[0].oninput = ()=>{ set.wt = inputs[0].value; saveMlsFreeformExercises(day, list); };
        inputs[1].oninput = ()=>{ set.reps = inputs[1].value; saveMlsFreeformExercises(day, list); };

        if (ex.sets.length > 1){
          const rmSetBtn = document.createElement('button');
          rmSetBtn.type = 'button';
          rmSetBtn.className = 'cs-freeform-remove-set';
          rmSetBtn.title = 'Remove this set';
          rmSetBtn.textContent = '−';
          rmSetBtn.onclick = ()=>{
            ex.sets.splice(sIdx, 1);
            saveMlsFreeformExercises(day, list);
            renderMlsDay();
          };
          setDiv.appendChild(rmSetBtn);
        }
        setsDiv.appendChild(setDiv);
      });
      exDiv.appendChild(setsDiv);

      const addSetBtn = document.createElement('button');
      addSetBtn.type = 'button';
      addSetBtn.className = 'btn2 cs-freeform-add-set';
      addSetBtn.textContent = '+ Add Set';
      addSetBtn.onclick = ()=>{
        ex.sets.push({ wt:'', reps:'', done:false });
        saveMlsFreeformExercises(day, list);
        renderMlsDay();
      };
      exDiv.appendChild(addSetBtn);

      bDiv.appendChild(exDiv);
    });

    wrap.appendChild(bDiv);

    const addExBtn = document.createElement('button');
    addExBtn.type = 'button';
    addExBtn.className = 'btn2 primary cs-freeform-add-ex';
    addExBtn.textContent = '+ Add Exercise';
    addExBtn.onclick = ()=>{
      list.push(blankMlsFreeformExercise());
      saveMlsFreeformExercises(day, list);
      renderMlsDay();
      const names = wrap.querySelectorAll('.cs-freeform-name');
      if (names.length) names[names.length-1].focus();
    };
    wrap.appendChild(addExBtn);
  }

  /* Guest vs signed-in only changes what's shown below the logger — the
     logger itself (mode toggle, sets, export) is identical either way. */
  function updateMlsIdentityUI(){
    const guestNotice = document.getElementById('mls-guest-notice');
    const signedInNotice = document.getElementById('mls-signedin-notice');
    const historySection = document.getElementById('mls-history-section');
    const graphSection = document.getElementById('mls-graph-section');
    if (!guestNotice) return;
    const member = mlsSignedInMember();
    guestNotice.style.display = member ? 'none' : 'block';
    signedInNotice.style.display = member ? 'block' : 'none';
    if (member) document.getElementById('mls-signedin-name').textContent = member.name;
    historySection.style.display = member ? '' : 'none';
    graphSection.style.display = member ? '' : 'none';
    renderMlsSaveStatus();
    if (member){
      renderMlsHistoryTable();
      renderMlsGraphOptions();
      renderMlsGraph();
    }
  }
  window.mlsOnTabShown = updateMlsIdentityUI;

  function renderMlsDay(){
    const dateEl = document.getElementById('mls-date');
    if (!dateEl) return;
    dateEl.value = mlsStore[mlsKey(mlsDay,'meta','date')] || '';
    document.getElementById('mls-bw').value = mlsStore[mlsKey(mlsDay,'meta','bw')] || '';
    document.getElementById('mls-notes').value = mlsStore[mlsKey(mlsDay,'notes')] || '';

    const mode = getMlsMode(mlsDay);
    document.getElementById('mls-mode-program').classList.toggle('active', mode === 'program');
    document.getElementById('mls-mode-freeform').classList.toggle('active', mode === 'freeform');

    const wrap = document.getElementById('mls-blocks');
    wrap.innerHTML = '';
    if (mode === 'freeform') renderMlsFreeformBlocks(wrap, mlsDay);
    else renderMlsProgramBlocks(wrap, mlsDay);

    updateMlsIdentityUI();
  }

  /* Same shape as the Coach Live Session's snapshotSessionDay(), minus the
     trainee/slot concept, so it can reuse the same md/txt export builders. */
  function snapshotMlsDay(day){
    const meta = DAY_META[day];
    const mode = getMlsMode(day);
    let blocks;
    if (mode === 'freeform'){
      const list = getMlsFreeformExercises(day).filter(ex => (ex.name||'').trim());
      blocks = [{
        name: 'Freeform',
        exercises: list.map(ex => ({
          name: ex.name,
          presc: '',
          meta: '',
          sets: (ex.sets||[]).map(s => ({ done: !!s.done, wt: s.wt||'', reps: s.reps||'' }))
        }))
      }];
    } else {
      blocks = (programData[day]||[]).map((block,bIdx)=>({
        name: block.name,
        exercises: block.exercises.map((ex,eIdx)=>{
          const nSets = parseInt(ex.sets,10) || 3;
          const sets = [];
          for(let s=0;s<nSets;s++){
            sets.push({
              done: !!mlsStore[mlsKey(day,bIdx,eIdx,s,'done')],
              wt: mlsStore[mlsKey(day,bIdx,eIdx,s,'wt')] || '',
              reps: mlsStore[mlsKey(day,bIdx,eIdx,s,'reps')] || ''
            });
          }
          return { name: programExName(ex, mlsStore[mlsKey(day,bIdx,eIdx,'swap')]), presc: prescString(ex), meta: metaLine(ex).replace(/&nbsp;/g,' ').replace(/•/g,'|'), sets };
        })
      }));
    }
    return {
      title: meta.title, duration: meta.duration, hold: meta.hold,
      date: mlsStore[mlsKey(day,'meta','date')]||'', bw: mlsStore[mlsKey(day,'meta','bw')]||'',
      notes: mlsStore[mlsKey(day,'notes')]||'', mode, blocks
    };
  }

  /* Guests: export-to-file only, nothing retained beyond this device's live
     slot. Signed-in members: committing to history is automatic, not an
     extra step — every time saveMlsStore settles (see the debounce there),
     the current day's live log is upserted into that member's history for
     today's date. Re-running this for the same member+day+date updates the
     existing row instead of appending a new one, so editing a set after the
     first auto-commit corrects today's entry rather than duplicating it. */
  function mlsUuid(){
    return crypto.randomUUID ? crypto.randomUUID() :
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c=>{
        const r = Math.random()*16|0; return (c==='x'?r:(r&0x3|0x8)).toString(16);
      });
  }
  function autoCommitMlsDayToHistory(){
    const member = mlsSignedInMember();
    if (!member) return; // guests: nothing server-side to commit to
    const day = mlsDay;
    const snap = snapshotMlsDay(day);
    const exercises = snap.blocks.flatMap(b => b.exercises).filter(ex => ex.sets.some(s => s.wt || s.reps || s.done));
    if (!exercises.length) return; // nothing logged yet — don't create an empty history row
    const dateIso = new Date().toISOString().slice(0,10);
    const history = loadMlsHistory();
    const existing = history.find(h => h.memberId === member.id && h.day === day && h.dateIso === dateIso);
    const entry = {
      id: existing ? existing.id : mlsUuid(),
      memberId: member.id, dateIso, displayDate: snap.date || '',
      day, mode: snap.mode, bw: snap.bw, notes: snap.notes, exercises
    };
    const nextHistory = existing
      ? history.map(h => h.id === entry.id ? entry : h)
      : history.concat([entry]);
    saveMlsHistoryArr(nextHistory);
    renderMlsHistoryTable();
    renderMlsGraphOptions();
    renderMlsGraph();
  }

  function mlsHistoryRowHtml(h){
    const exList = (h.exercises||[]).map(ex=>ex.name).filter(Boolean).join(', ') || '—';
    const dayTitle = (DAY_META[h.day]||{}).title ? DAY_META[h.day].title.split('—')[0].trim() : (h.day||'');
    return `<tr>
      <td class="mono">${esc(h.displayDate || h.dateIso)}</td>
      <td>${esc(dayTitle)}</td>
      <td>${h.mode==='freeform' ? 'Freeform' : "Day's Program"}</td>
      <td>${esc(exList)}</td>
      <td>${h.notes ? esc(h.notes) : '—'}</td>
      <td><button type="button" class="sesh-del-btn" data-id="${h.id}" title="Delete">×</button></td>
    </tr>`;
  }

  function renderMlsHistoryTable(){
    const member = mlsSignedInMember();
    const table = document.getElementById('mls-history-table');
    const empty = document.getElementById('mls-history-empty');
    const body = document.getElementById('mls-history-body');
    if (!table) return;
    body.innerHTML = '';
    if (!member){ table.style.display='none'; empty.style.display='none'; return; }
    const history = loadMlsHistory().filter(h=>h.memberId===member.id).sort((a,b)=> b.dateIso.localeCompare(a.dateIso));
    if (!history.length){ table.style.display='none'; empty.style.display='block'; return; }
    table.style.display=''; empty.style.display='none';
    history.forEach(h => body.insertAdjacentHTML('beforeend', mlsHistoryRowHtml(h)));
    body.querySelectorAll('.sesh-del-btn').forEach(btn=>{
      btn.onclick = ()=>{
        const remaining = loadMlsHistory().filter(x=>x.id!==btn.dataset.id);
        saveMlsHistoryArr(remaining);
        renderMlsHistoryTable();
        renderMlsGraphOptions();
        renderMlsGraph();
      };
    });
  }

  function renderMlsGraphOptions(){
    const exSel = document.getElementById('mls-graph-exercise');
    if (!exSel) return;
    const member = mlsSignedInMember();
    const prevVal = exSel.value;
    exSel.innerHTML = '';
    if (!member) return;
    const names = new Set();
    loadMlsHistory().filter(h=>h.memberId===member.id).forEach(h=>(h.exercises||[]).forEach(ex=>{
      if ((ex.name||'').trim()) names.add(ex.name.trim());
    }));
    [...names].sort().forEach(n=>{
      const o = document.createElement('option'); o.value = n; o.textContent = n; exSel.appendChild(o);
    });
    if ([...names].includes(prevVal)) exSel.value = prevVal;
  }

  /* Simple line chart in the same visual language as the Weight tab's
     .weight-chart-svg — plots the heaviest numeric set weight logged per
     saved session for the selected exercise. Sets logged as "BW" (bodyweight)
     have no numeric value, so they're skipped in the trend line rather than
     parsed as 0 or NaN. */
  function renderMlsGraph(){
    const svg = document.getElementById('mls-graph-svg');
    const empty = document.getElementById('mls-graph-empty');
    const exSel = document.getElementById('mls-graph-exercise');
    if (!svg || !exSel) return;
    const exName = exSel.value;
    const member = mlsSignedInMember();
    if (!member || !exName){ svg.style.display='none'; empty.style.display='block'; return; }

    const history = loadMlsHistory().filter(h=>h.memberId===member.id).sort((a,b)=> a.dateIso.localeCompare(b.dateIso));
    const points = [];
    history.forEach(h=>{
      (h.exercises||[]).forEach(ex=>{
        if ((ex.name||'').trim().toLowerCase() !== exName.trim().toLowerCase()) return;
        let maxWt = null;
        (ex.sets||[]).forEach(s=>{
          const n = parseFloat(s.wt);
          if (!isNaN(n) && (maxWt===null || n>maxWt)) maxWt = n;
        });
        if (maxWt !== null) points.push({ date: h.dateIso, wt: maxWt });
      });
    });

    if (points.length < 2){ svg.style.display='none'; empty.style.display='block'; return; }
    empty.style.display='none'; svg.style.display='block';

    const W=bnbChartWidth(svg),H=230,padL=50,padR=20,padT=20,padB=36;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    const ys = points.map(p=>p.wt);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const yRange = (maxY - minY) || 1;
    const xStep = (W-padL-padR) / Math.max(points.length-1,1);
    const xAt = i => padL + i*xStep;
    const yAt = v => H-padB - ((v-minY)/yRange)*(H-padT-padB);

    let gridSvg = '';
    for(let i=0;i<=4;i++){
      const gy = padT + i*((H-padT-padB)/4);
      gridSvg += `<line class="grid-line" x1="${padL}" y1="${gy}" x2="${W-padR}" y2="${gy}"></line>`;
      const val = maxY - i*(yRange/4);
      gridSvg += `<text class="axis-label" x="${padL-8}" y="${gy+3}" text-anchor="end">${val.toFixed(1)}</text>`;
    }
    const pathD = points.map((p,i)=> (i===0?'M':'L') + xAt(i).toFixed(1) + ',' + yAt(p.wt).toFixed(1)).join(' ');
    const dots = points.map((p,i)=> `<circle class="data-dot" cx="${xAt(i).toFixed(1)}" cy="${yAt(p.wt).toFixed(1)}" r="3.5"><title>${esc(p.date)}: ${p.wt}</title></circle>`).join('');
    const xLabels = points.map((p,i)=> (i===0 || i===points.length-1 || i===Math.floor(points.length/2))
      ? `<text class="axis-label" x="${xAt(i).toFixed(1)}" y="${H-12}" text-anchor="middle">${esc(p.date.slice(5))}</text>`
      : '').join('');

    svg.innerHTML = gridSvg + `<path class="data-line" d="${pathD}"></path>` + dots + xLabels;
  }

  function saveMlsAs(format){
    const snap = snapshotMlsDay(mlsDay);
    const member = mlsSignedInMember();
    snap.trainee = member ? member.name : 'Guest';
    const fileBase = 'BnB_Session_' + slugify(snap.trainee) + '_' + snap.title.replace(/[^\w]+/g,'_');

    if (format === 'md'){
      downloadTextFile(fileBase + '.md', buildSessionMarkdown(snap), 'text/markdown');
      return;
    }
    if (format === 'txt'){
      downloadTextFile(fileBase + '.txt', buildSessionText(snap), 'text/plain');
      return;
    }

    // PDF — same rendering approach as the Coach Live Session's export.
    (async ()=>{
      const btn = document.getElementById('mls-save-pdf');
      const orig = btn.textContent; btn.textContent = 'Building PDF…'; btn.disabled = true;
      try {
        await ensureJsPdf();
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit:'pt', format:'letter' });
        const gold = [201,169,79], ink = [20,18,16], muted = [110,102,88];
        const green = [15,110,86], rust = [153,60,29];
        const pageW = doc.internal.pageSize.getWidth();
        let y = 40;

        doc.setProperties({ title: "Bell(e)s N' Barz \u2014 " + snap.title + ' \u2014 ' + (snap.trainee || 'Session') });

        doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...gold);
        doc.text("BELL(E)S N' BARZ  •  LIVE SESSION LOG", 40, y);
        doc.setFontSize(20); doc.setTextColor(...ink);
        y += 26; doc.text(snap.title, 40, y);
        doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(...muted);
        y += 16; doc.text('Logged by: ' + snap.trainee, 40, y);
        y += 14; doc.text(snap.duration + '   ·   Date: ' + (snap.date||'____________') + '   ·   Bodyweight: ' + (snap.bw||'______'), 40, y);
        y += 10; doc.setDrawColor(...gold); doc.line(40, y, pageW-40, y);
        y += 20;

        snap.blocks.forEach(block=>{
          if (y > 700){ doc.addPage(); y = 40; }
          doc.setFillColor(20,18,16); doc.rect(40, y-12, pageW-80, 18, 'F');
          doc.setFont('helvetica','bold'); doc.setFontSize(10.5); doc.setTextColor(255,255,255);
          doc.text(block.name.toUpperCase(), 46, y+1);
          y += 20;
          block.exercises.forEach(ex=>{
            if (y > 700){ doc.addPage(); y = 40; }
            doc.setFont('helvetica','bold'); doc.setFontSize(10.5); doc.setTextColor(...ink);
            doc.text(ex.name, 44, y);
            if (ex.presc){
              doc.setFont('helvetica','italic'); doc.setFontSize(8.5); doc.setTextColor(...muted);
              doc.text(ex.presc, pageW-44, y, {align:'right'});
            }
            y += 12;
            if (ex.meta){
              doc.setFont('helvetica','italic'); doc.setFontSize(7.5); doc.setTextColor(...muted);
              doc.text(ex.meta, 44, y);
              y += 11;
            }
            y = drawPdfSetChips(doc, ex.sets, 44, y, pageW-44, { green, rust, muted });
            y += 16;
          });
          y += 6;
        });

        if (y > 680){ doc.addPage(); y = 40; }
        doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...ink);
        const holdTextX2 = drawPdfStar(doc, 40, y, gold);
        doc.text('Signature Hold: ' + snap.hold, holdTextX2, y);
        y += 20;
        doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...muted);
        doc.text('SESSION NOTES / RPE', 40, y);
        y += 14;
        doc.setDrawColor(200,195,180); doc.rect(40, y-10, pageW-80, 50);
        doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...ink);
        doc.text(doc.splitTextToSize(snap.notes || '', pageW-96), 46, y+2);

        doc.save(fileBase + '.pdf');
      } catch(err){
        alert('PDF export needs an internet connection the first time (to load the PDF library). Please check your connection and try again.');
        console.error(err);
      } finally {
        btn.textContent = orig; btn.disabled = false;
      }
    })();
  }

  function wireMlsOnce(){
    const dateEl = document.getElementById('mls-date');
    if (!dateEl || dateEl.dataset.wired) return;
    dateEl.dataset.wired = '1';
    dateEl.addEventListener('input', e=>{ mlsStore[mlsKey(mlsDay,'meta','date')]=e.target.value; saveMlsStore(); });
    document.getElementById('mls-bw').addEventListener('input', e=>{ mlsStore[mlsKey(mlsDay,'meta','bw')]=e.target.value; saveMlsStore(); });
    document.getElementById('mls-notes').addEventListener('input', e=>{ mlsStore[mlsKey(mlsDay,'notes')]=e.target.value; saveMlsStore(); });

    document.getElementById('mls-clear').onclick = ()=>{
      const dayTitle = DAY_META[mlsDay].title.split('—')[0].trim();
      if(!confirm("Clear this day's live log — sets, weight, reps and notes for " + dayTitle + "? Anything already saved to History is untouched.")) return;
      const prefix = mlsDay + ':';
      Object.keys(mlsStore).forEach(k=>{ if (k.startsWith(prefix)) delete mlsStore[k]; });
      saveMlsStore();
      renderMlsDay();
    };

    document.getElementById('mls-save-pdf').onclick = ()=> saveMlsAs('pdf');
    document.getElementById('mls-save-md').onclick = ()=> saveMlsAs('md');
    document.getElementById('mls-save-txt').onclick = ()=> saveMlsAs('txt');

    document.getElementById('mls-print').onclick = ()=>{
      document.querySelectorAll('.tab-panel').forEach(sec=>sec.classList.remove('active'));
      document.getElementById('tab-session').classList.add('active');
      window.print();
    };

    document.getElementById('mls-save-odt').onclick = async ()=>{
      const btn = document.getElementById('mls-save-odt');
      const orig = btn.textContent; btn.textContent = 'Building ODT…'; btn.disabled = true;
      try {
        await ensureJsZip();
        const snap = snapshotMlsDay(mlsDay);
        const member = mlsSignedInMember();
        const fileBase = 'BnB_Session_' + slugify(member ? member.name : 'Guest') + '_' + snap.title.replace(/[^\w]+/g,'_');
        const zip = new JSZip();
        zip.file('mimetype', 'application/vnd.oasis.opendocument.text', {compression:"STORE"});
        zip.file('META-INF/manifest.xml', `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">
  <manifest:file-entry manifest:full-path="/" manifest:version="1.2" manifest:media-type="application/vnd.oasis.opendocument.text"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`);
        zip.file('content.xml', buildOdtContentXml(snap));
        const blob = await zip.generateAsync({type:'blob', mimeType:'application/vnd.oasis.opendocument.text'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = fileBase + '.odt'; a.click();
        URL.revokeObjectURL(url);
      } catch(err){
        alert('ODT export needs an internet connection the first time (to load the zip library). Please check your connection and try again.');
        console.error(err);
      } finally {
        btn.textContent = orig; btn.disabled = false;
      }
    };

    document.getElementById('mls-mode-program').onclick = ()=>{ setMlsMode(mlsDay, 'program'); renderMlsDay(); };
    document.getElementById('mls-mode-freeform').onclick = ()=>{ setMlsMode(mlsDay, 'freeform'); renderMlsDay(); };

    document.getElementById('mls-history-clear-btn').addEventListener('click', ()=>{
      const member = mlsSignedInMember();
      if (!member) return;
      if (!confirm("Clear all of your saved session history? This can't be undone.")) return;
      saveMlsHistoryArr(loadMlsHistory().filter(h=>h.memberId!==member.id));
      renderMlsHistoryTable();
      renderMlsGraphOptions();
      renderMlsGraph();
    });

    document.getElementById('mls-graph-exercise').addEventListener('change', renderMlsGraph);
  }

  // Read-only cross-module export — lets the Coach Dashboard's Client
  // Progress panel chart a specific member's logged exercise loads without
  // duplicating the history storage or its parsing logic. Mirrors exactly
  // what renderMlsGraph() already computes for the member's own view above.
  window.BNB_MLS = {
    getExerciseNames: function(memberId){
      const names = {};
      loadMlsHistory().filter(h=>h.memberId===memberId).forEach(h=>{
        (h.exercises||[]).forEach(ex=>{ if ((ex.name||'').trim()) names[ex.name.trim()] = true; });
      });
      return Object.keys(names).sort();
    },
    getExerciseSeries: function(memberId, exerciseName){
      const history = loadMlsHistory().filter(h=>h.memberId===memberId).sort((a,b)=> a.dateIso.localeCompare(b.dateIso));
      const points = [];
      history.forEach(h=>{
        (h.exercises||[]).forEach(ex=>{
          if ((ex.name||'').trim().toLowerCase() !== (exerciseName||'').trim().toLowerCase()) return;
          let maxWt = null;
          (ex.sets||[]).forEach(s=>{
            const n = parseFloat(s.wt);
            if (!isNaN(n) && (maxWt===null || n>maxWt)) maxWt = n;
          });
          if (maxWt !== null) points.push({ date: h.dateIso, wt: maxWt });
        });
      });
      return points;
    },
    // Read-only — used by the Coach Dashboard's "Today's Program" marker
    // to compare a member's assigned exercises for a given date against
    // what they actually logged. Returns null if nothing was logged that
    // day; otherwise the session's mode ('program' or 'freeform') plus
    // its exercises, so the caller can tell a real name-match apart from
    // a freeform entry that was never tied to the assigned program.
    getLoggedExercisesForDate: function(memberId, dateIso){
      const row = loadMlsHistory().find(h => h.memberId === memberId && h.dateIso === dateIso);
      return row ? { mode: row.mode, exercises: row.exercises || [] } : null;
    }
  };

  /* --------------------- COACH: WORKOUTS TO TRY ---------------------------
     A coach's own shelf of workouts they've come across and want to try
     (sql/61, coach_workouts — private to the coach who saved them). Built
     in the same editor as Program Builder: each version is a block of
     exercises with sets, reps, load, rest, tempo, equipment and alternates,
     so the card stats come from real numbers. Pasted text still works as
     a shortcut — it's split into versions at lines ending in ":"
     ("Strength:", "If your goal is Hypertrophy:"), each "Name: 3 x 8" line
     becomes a row to check. Try loads a version into the Live Session's
     current slot and day as Freeform, sets ready and ⇄ alternatives on.
     Workouts saved before the editor hold { name, presc, sets } only;
     structuredExercise() turns those into rows when they're read. */
  function showToast(msg){
    const el = document.getElementById('t-toast'); if (!el) return;
    el.textContent = msg; el.classList.add('show');
    clearTimeout(el._tcTimer);
    el._tcTimer = setTimeout(()=> el.classList.remove('show'), 2400);
  }

  function parseWorkoutText(text){
    const variants = [];
    let cur = null;
    const tidyHeading = h => {
      const t = h.replace(/:\s*$/, '').replace(/^i?f\s+your\s+goal\s+is\s+/i, '').trim();
      return t.charAt(0).toUpperCase() + t.slice(1);
    };
    let block = '';
    String(text || '').split(/\r?\n/).forEach(raw => {
      let line = raw.replace(/^\s*(?:[-*•▪◦]|\d+[.)])\s*/, '').trim();
      if (!line) return;
      if (/:\s*$/.test(line)){
        // "Block A:", "A:", "Superset 1:", "Circuit 2:" start a block in
        // the current version; any other heading starts a new version.
        const bn = blockHeadingName(line.replace(/:\s*$/, ''));
        if (bn){
          if (!cur){ cur = { name: 'Workout', exercises: [] }; variants.push(cur); }
          block = bn;
          return;
        }
        cur = { name: tidyHeading(line), exercises: [] }; variants.push(cur); block = ''; return;
      }
      // "A1. Back Squat" / "B2) RDL": Block A / Block B, prefix dropped.
      const ab = line.match(/^([A-Z])(\d{1,2})\s*[.):-]\s*(.+)$/);
      if (ab){ block = 'Block ' + ab[1]; line = ab[3].trim(); }
      let name = line, presc = '';
      const colon = line.match(/^(.+?)\s*(?::|\s[–—-]\s)\s*(.+)$/);
      const inline = line.match(/^(.*?[a-z)])\s+(\d+\s*[x×*]\s*\S.*)$/i);
      if (colon){ name = colon[1]; presc = colon[2]; }
      else if (inline){ name = inline[1]; presc = inline[2]; }
      const m = presc.match(/(\d+)\s*[x×*]\s*\d/) || presc.match(/(\d+)\s*sets?\b/i);
      const sets = Math.min(Math.max(m ? parseInt(m[1], 10) : 3, 1), 10);
      if (!cur){ cur = { name: 'Workout', exercises: [] }; variants.push(cur); }
      cur.exercises.push({ name: name.trim().slice(0, 120), presc: presc.trim().slice(0, 200), sets, block });
    });
    return variants.filter(v => v.exercises.length);
  }

  /* Blocks inside a version: each exercise row carries `block` (its block's
     name, '' when the version isn't split). Consecutive rows with the same
     name make one block — the "Insert block here" breaks in the editor.
     Names like "Block A", "B", "Superset 2" give the A1, A2… labels. */
  function blockHeadingName(text){
    const t = String(text || '').trim();
    const m = t.match(/^(block|superset|circuit|part|section|round)\s*([a-z]|\d{1,2})$/i);
    if (m) return m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase() + ' ' + m[2].toUpperCase();
    if (/^[a-z]$/i.test(t)) return 'Block ' + t.toUpperCase();
    // Named sections of one workout, not alternative versions of it.
    if (/^(warm[\s-]?up|cool[\s-]?down|finisher|core|conditioning|mobility|activation|accessor(y|ies)|main( lifts?| sets?)?|metcon|wod|cardio|abs)$/i.test(t)){
      return t.charAt(0).toUpperCase() + t.slice(1);
    }
    return '';
  }
  // "Block A", "B", "Superset 2", or a longer name ending in one of those
  // ("Leg day — Block A") → "A" / "B" / "2".
  function blockToken(name){
    const t = String(name || '').trim();
    const m = t.match(/^(?:(?:block|superset|circuit|part|section|round)\s*)?([a-z]|\d{1,2})$/i) ||
              t.match(/(?:^|\s)(?:block|superset|circuit|part|section|round)\s+([a-z]|\d{1,2})$/i);
    return m ? m[1].toUpperCase() : '';
  }
  // A1, A2, B1… for each row; 3.1, 3.2 for numbered blocks; '' when its
  // block has no letter or number.
  function exerciseLabels(exercises){
    let prev = null, n = 0;
    return (exercises || []).map(ex => {
      const b = ex.block || '';
      n = b === prev ? n + 1 : 1;
      prev = b;
      const tok = b ? blockToken(b) : '';
      return tok ? tok + (/^\d/.test(tok) ? '.' : '') + n : '';
    });
  }
  // Runs of rows with the same block, in order: [{ name, exercises }].
  function versionBlocks(exercises){
    const runs = [];
    (exercises || []).forEach(ex => {
      const b = ex.block || '';
      if (!runs.length || runs[runs.length - 1].name !== b) runs.push({ name: b, exercises: [] });
      runs[runs.length - 1].exercises.push(ex);
    });
    return runs;
  }
  // The next free block name, in the style already used: Block 1, 2, 3…
  // when every block is numbered, otherwise Block A, B, C….
  function nextBlockName(exercises){
    const toks = [...new Set((exercises || []).map(ex => blockToken(ex.block)).filter(Boolean))];
    if (toks.length && toks.every(t => /^\d+$/.test(t))){
      return 'Block ' + (Math.max(0, ...toks.filter(t => /^\d+$/.test(t)).map(Number)) + 1);
    }
    const letters = toks.filter(t => /^[A-Z]$/.test(t)).map(t => t.charCodeAt(0));
    const next = letters.length ? Math.max(...letters) + 1 : 66; // none named yet: the rows above become A
    return 'Block ' + String.fromCharCode(Math.min(next, 90));
  }

  // One exercise as editor fields. Already structured: filled out with any
  // missing fields. Saved from text ({ name, presc, sets }): "3 x 8 @ 80kg,
  // rest 90s" splits into Sets 3 / Reps 8 / Load 80kg / Rest 90s, anything
  // else stays in Reps. A line whose "3 * 15" ended up in the name (saved
  // before "*" was understood) is split back out first.
  function structuredExercise(ex){
    const base = { name:'', sets:'', reps:'', load:'', rest:'', tempo:'', equipment:'', alternates:'', block:'' };
    if (ex && 'reps' in ex){
      const out = Object.assign(base, ex);
      delete out.presc;
      return out;
    }
    let name = String((ex && ex.name) || '').trim(), presc = String((ex && ex.presc) || '').trim();
    if (!presc){
      const re = parseWorkoutText(name)[0];
      if (re && re.exercises[0] && re.exercises[0].presc){ name = re.exercises[0].name; presc = re.exercises[0].presc; }
    }
    const out = Object.assign(base, { name, block: (ex && ex.block) || '' });
    let rest = presc;
    const restM = rest.match(/,?\s*rest\s*:?\s*(\d+(?:\.\d+)?(?:\s*[-–]\s*\d+)?\s*(?:s|secs?|seconds?|m|mins?|minutes?)\b)/i) ||
                  rest.match(/,?\s*(\d+(?:\.\d+)?(?:\s*[-–]\s*\d+)?\s*(?:s|secs?|seconds?|mins?|minutes?))\s+rest\b/i);
    if (restM){ out.rest = restM[1].trim(); rest = rest.replace(restM[0], ''); }
    const loadM = rest.match(/\s*@\s*(\d+(?:\.\d+)?\s*(?:kg|kgs|lbs?|%)?)/i) || rest.match(/\s+(\d+(?:\.\d+)?\s*(?:kg|kgs|lbs?))\b/i);
    if (loadM){ out.load = loadM[1].trim(); rest = rest.replace(loadM[0], ''); }
    const sx = rest.match(/^\s*(\d+)\s*[x×*]\s*(.+)$/i);
    if (sx){ out.sets = sx[1]; out.reps = sx[2].trim(); }
    else {
      const sm = rest.match(/(\d+)\s*sets?\b/i);
      out.sets = sm ? sm[1] : String((ex && ex.sets) || '');
      out.reps = rest.trim();
    }
    out.reps = out.reps.replace(/[,;]\s*$/, '').replace(/^\((.*)\)$/, '$1').trim();
    return out;
  }
  function structuredVariants(variants){
    return (variants || []).map(v => ({ name: v.name || 'Workout', exercises: (v.exercises || []).map(structuredExercise) }));
  }
  function setsCount(ex){ return Math.min(Math.max(parseInt(ex.sets, 10) || 3, 1), 10); }

  // The plan as one line: "3 × 8 @ 80kg · rest 90s · tempo 3-1-1".
  function planString(ex){
    const main = prescString(ex) + (ex.load ? ' @ ' + ex.load : '');
    return [main, ex.rest ? 'rest ' + ex.rest : '', ex.tempo ? 'tempo ' + ex.tempo : ''].filter(Boolean).join(' · ');
  }

  // Versions back to text in a format parseWorkoutText() reads — kept as
  // the row's source, and what Copy Text copies.
  function workoutVariantsToText(variants){
    const line = ex => {
      const p = [(ex.sets && ex.reps ? ex.sets + ' x ' + ex.reps : ex.reps || (ex.sets ? ex.sets + ' sets' : '')) + (ex.load ? ' @ ' + ex.load : ''),
                 ex.rest ? 'rest ' + ex.rest : ''].filter(Boolean).join(', ');
      return p ? ex.name + ': ' + p : ex.name;
    };
    return variants.map(v => v.name + ':\n' + versionBlocks(v.exercises).map(run =>
      (run.name ? run.name + ':\n' : '') + run.exercises.map(line).join('\n')).join('\n')).join('\n\n');
  }

  // A version as a Freeform list: blank sets to match, the plan under each
  // name, and its own Alternates in the ⇄ dropdown.
  function workoutFreeformList(variant){
    const rows = (variant.exercises || []).map(structuredExercise).filter(ex => ex.name.trim());
    const labels = exerciseLabels(rows);
    return rows.map((ex, i) => ({
      name: ex.name, seed: ex.name, base: ex.name, baseAlts: ex.alternates || '', from: 'workout', presc: planString(ex),
      group: ex.block || '', label: labels[i],
      sets: Array.from({ length: setsCount(ex) }, () => ({ wt:'', reps:'', done:false }))
    }));
  }
  // Freeform: a heading where a block starts (group set by a split workout
  // or the program's blocks).
  function freeformGroupHead(list, eIdx){
    const g = list[eIdx].group;
    if (!g || (eIdx > 0 && list[eIdx - 1].group === g)) return null;
    const h = document.createElement('div');
    h.className = 'ff-group-head';
    h.textContent = g;
    return h;
  }

  // Loads one variant into the Live Session's current slot + day.
  function tryWorkoutInSession(variant, title){
    const who = slotTraineeName(csSlot).trim() || ('Slot ' + (csSlot+1));
    const dayLabel = DAY_META[csDay].title.split('—')[0].trim();
    if (freeformHasRealData(csSlot, csDay) &&
        !confirm('Replace ' + who + "'s freeform log for " + dayLabel + ' with "' + title + ' — ' + variant.name + '"?')) return;
    saveFreeformExercises(csSlot, csDay, workoutFreeformList(variant));
    setCsMode(csSlot, csDay, 'freeform');
    renderSessionDay();
    const btn = document.querySelector('#coach-section-switch [data-coach-section="session"]');
    if (btn) btn.click();
    showToast('Loaded into ' + who + ' — ' + dayLabel);
  }

  // Loads one variant into the coach's own MEMBER > Live Session as
  // Freeform on the chosen day, so they can do it themselves and it lands
  // in their own history and progress graph.
  function sendWorkoutToMyFreeform(variant, title, day){
    const dayLabel = DAY_META[day].title.split('—')[0].trim();
    if (getMlsMode(day) === 'freeform' && freeformListHasRealData(getMlsFreeformExercises(day)) &&
        !confirm('Replace your own freeform log for ' + dayLabel + ' with "' + title + ' — ' + variant.name + '"?')) return false;
    saveMlsFreeformExercises(day, workoutFreeformList(variant));
    setMlsMode(day, 'freeform');
    mlsDay = day;
    renderMlsDayTabs();
    renderMlsDay();
    if (typeof window.switchTab === 'function') window.switchTab('session');
    showToast('Loaded into your Live Session — ' + dayLabel);
    return true;
  }

  /* Summary for a list of rows (a version, a block, a day):
       exercises — rows with a name.
       sets      — the Sets fields added up (blank, e.g. a hold, is 1).
       rest      — each row's Rest × its sets, counting the rest after the
                   last set too (the move to the next exercise). With no
                   Rest set: 2½ min for 1–5 reps, 90 s for 6–12, 60 s for
                   13+ or timed/distance work.
       minutes   — work + rest. Work per set is reps × the tempo's seconds
                   (3-1-1 or 3010 = 5 s / 4 s; X = 1 s) or ~3 s a rep, the
                   time written in for timed work ("60s"), or ~45 s for
                   distance ("24m"). A rep counts for 20 s at most. */
  function workoutStats(variant){
    let exercises = 0, sets = 0, restSec = 0, seconds = 0;
    const secs = (num, unit) => num * (/^m/i.test(unit) ? 60 : 1);
    (variant.exercises || []).map(structuredExercise).forEach(ex => {
      if (!String(ex.name).trim()) return;
      exercises++;
      const n = Math.min(parseInt(ex.sets, 10) || 1, 10);
      sets += n;
      const r = String(ex.reps || '').toLowerCase().trim();
      const timeM = r.match(/^(\d+(?:\.\d+)?)(?:\s*[-–]\s*(\d+(?:\.\d+)?))?\s*(s|secs?|seconds?|mins?|minutes?)\b/);
      const distM = r.match(/^(\d+(?:\.\d+)?)\s*(m|meters?|metres?|yd|yards?|km)\b/);
      const repM = r.match(/^(\d+)(?:\s*[-–]\s*(\d+))?/);
      const tempoText = String(ex.tempo || '').trim();
      const phases = /^[\dx]{3,4}$/i.test(tempoText) ? tempoText.split('') : tempoText.split(/[-–\/\s]+/);
      const tempoSec = Math.min(phases.map(t => /^x$/i.test(t.trim()) ? 1 : parseFloat(t)).filter(x => x >= 0).reduce((a, b) => a + b, 0), 20);
      let repsPerSet = null, workSec;
      if (timeM) workSec = secs(timeM[2] ? (parseFloat(timeM[1]) + parseFloat(timeM[2])) / 2 : parseFloat(timeM[1]), timeM[3]);
      else if (distM) workSec = 45;
      else if (repM){
        repsPerSet = repM[2] ? (parseInt(repM[1], 10) + parseInt(repM[2], 10)) / 2 : parseInt(repM[1], 10);
        workSec = repsPerSet * (tempoSec || 3);
      } else workSec = 30;
      const restM = String(ex.rest || '').toLowerCase().match(/(\d+(?:\.\d+)?)(?:\s*[-–]\s*(\d+(?:\.\d+)?))?\s*(s|secs?|seconds?|m|mins?|minutes?|'|")?/);
      const rest = restM ? secs(restM[2] ? (parseFloat(restM[1]) + parseFloat(restM[2])) / 2 : parseFloat(restM[1]), restM[3] === "'" ? 'm' : (restM[3] || (parseFloat(restM[1]) <= 5 ? 'm' : 's')))
        : repsPerSet === null ? 60 : repsPerSet <= 5 ? 150 : repsPerSet <= 12 ? 90 : 60;
      restSec += n * rest;
      seconds += n * (workSec + rest);
    });
    return { exercises, sets, restMinutes: Math.round(restSec / 60), minutes: Math.round(seconds / 60) };
  }
  // "9 exercises · 29 sets · ≈ 57 min · ≈ 31 min rest"
  function workoutStatsText(st){
    return st.exercises + ' exercise' + (st.exercises === 1 ? '' : 's') + ' · ' + st.sets + ' set' + (st.sets === 1 ? '' : 's') +
      ' · ≈ ' + st.minutes + ' min · ≈ ' + st.restMinutes + ' min rest';
  }
  // One short line for client-facing day views; nothing on a rest day.
  function dayStatsLine(blocks){
    const st = workoutStats({ exercises: (blocks || []).flatMap(b => b.exercises || []) });
    return st.exercises ? '<div class="day-stats-line">' + workoutStatsText(st) + '</div>' : '';
  }
  // Coach-side: the four numbers as labelled boxes.
  function workoutStatsHtml(variant){
    const s = workoutStats(variant);
    const box = (label, val, title) => '<div class="cw-stat"' + (title ? ' title="' + esc(title) + '"' : '') + '><span class="cw-stat-label">' + label + '</span><span class="cw-stat-val">' + val + '</span></div>';
    return '<div class="cw-stats">' +
      box('Exercises', s.exercises) + box('Sets', s.sets) +
      box('Time', '≈ ' + s.minutes + ' min', 'Estimate: reps × tempo (about 3 s a rep without one), or the time written in, plus rest') +
      box('Rest', '≈ ' + s.restMinutes + ' min', 'Rest × sets, after every set. With no Rest set: 2½ min for 1–5 reps, 90 s for 6–12, 60 s for 13+') +
      '</div>';
  }

  /* Send to Program Builder: opens Program Builder with a bar on top —
     pick the client (the usual picker) and the day, then add the version
     as a new block or replace that day with it — the rows copy across
     as they are, Load and Alternates included. */
  /* Program Builder blocks and Workouts to Try. A block sent from a saved
     workout keeps src { workoutId, ownerId, version, vIdx }. Edits stay in
     the program; nothing goes back until the coach presses Update, which
     makes that version an exact copy of the block (rows added or removed
     too). The version is found by name — its index may have moved — with
     vIdx breaking ties. Another coach's link shows nothing (their
     workouts are private); a link to a deleted workout or version offers
     Save as New, and a block with no link offers Save to Workouts to Try. */
  function blockSourceIndex(w, src){
    const vs = w.variants || [];
    if (vs[src.vIdx] && vs[src.vIdx].name === src.version) return src.vIdx;
    return vs.findIndex(v => v.name === src.version);
  }
  function blockAsVariantExercises(block){
    return (block.exercises || []).filter(ex => String(ex.name || '').trim())
      .map(ex => { const out = structuredExercise(ex); out.name = String(ex.name).trim(); out.presc = planString(out); return out; });
  }
  function blockWorkoutLink(block, bDiv){
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (!me || coachWorkouts === null) return;
    const src = block.src;
    if (src && src.ownerId && src.ownerId !== me.id) return;
    const w = src && (coachWorkouts || []).find(x => x.id === src.workoutId);
    let idx = w ? blockSourceIndex(w, src) : -1;
    // Sent as one block of a split version: that block must still be there.
    if (idx >= 0 && src.block && !(w.variants[idx].exercises || []).some(ex => ex.block === src.block)) idx = -1;
    const bar = document.createElement('div');
    bar.className = 'crud-src';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn2';
    if (w && idx >= 0){
      const label = w.title + (w.variants.length > 1 || w.variants[idx].name !== 'Workout' ? ' — ' + w.variants[idx].name : '') +
        (src.block ? ' — ' + src.block : '');
      bar.innerHTML = '<span>From Workouts to Try: <b>' + esc(label) + '</b></span>';
      btn.textContent = '↻ Update Workout to Try';
      btn.title = 'Copy this block\u2019s exercises back to the saved workout';
      btn.onclick = ()=> updateWorkoutFromBlock(block, w, idx, label, btn);
    } else if (src){
      bar.innerHTML = '<span>Its saved workout (' + esc([src.version, src.block].filter(Boolean).join(' — ') || 'version') + ') was deleted.</span>';
      btn.textContent = 'Save as New Workout to Try';
      btn.onclick = ()=> saveBlockAsWorkout(block, btn);
    } else {
      bar.classList.add('crud-src-none');
      btn.textContent = 'Save to Workouts to Try';
      btn.title = 'Keep this block as one of your saved workouts';
      btn.onclick = ()=> saveBlockAsWorkout(block, btn);
    }
    bar.appendChild(btn);
    bDiv.appendChild(bar);
  }
  async function updateWorkoutFromBlock(block, w, idx, label, btn){
    const exercises = blockAsVariantExercises(block);
    if (!exercises.length){ showToast('Add an exercise with a name first.'); return; }
    if (!confirm('Replace "' + label + '" in Workouts to Try with this block\u2019s ' + exercises.length + ' exercise' + (exercises.length === 1 ? '' : 's') + '?')) return;
    // A block of a split version replaces just that block's rows, where
    // they were; otherwise the whole version.
    const sb = block.src && block.src.block;
    const variants = (w.variants || []).map((v, i) => {
      if (i !== idx) return v;
      if (!sb) return { name: v.name, exercises };
      const old = v.exercises || [];
      const first = old.findIndex(ex => ex.block === sb);
      const kept = old.filter(ex => ex.block !== sb);
      const at = old.slice(0, first).filter(ex => ex.block !== sb).length;
      kept.splice(at, 0, ...exercises.map(ex => Object.assign(ex, { block: sb })));
      return { name: v.name, exercises: kept };
    });
    btn.disabled = true;
    const { error } = await bnbClient.from('coach_workouts')
      .update({ variants, source: workoutVariantsToText(structuredVariants(variants)), updated_at: new Date().toISOString() })
      .eq('id', w.id);
    btn.disabled = false;
    if (error){ console.error('Supabase update coach_workouts failed:', error); showToast('Couldn\u2019t update — ' + (error.message || 'try again')); return; }
    block.src = Object.assign({}, block.src, { vIdx: idx });
    saveAdminProgram();
    await refreshCoachWorkouts();
    renderAdminBlocks();
    if (cwDraft && cwDraft.forId === w.id) cwDraft = null;
    renderCoachWorkouts();
    showToast('Updated "' + label + '"');
  }
  // The whole day as one new workout: a single version (a version is one
  // complete workout) split into the day's blocks, in order. Named for the
  // day and whose program it is.
  async function saveDayAsWorkout(btn){
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (!me){ showToast('Sign in to save workouts.'); return; }
    const blocks = adminProgramData[adminDay] || [];
    const exercises = blocks.flatMap((b, bi) => blockAsVariantExercises(b)
      .map(ex => Object.assign(ex, { block: blocks.length > 1 ? (String(b.name || '').trim() || 'Block ' + (bi + 1)) : '' })));
    const dayName = DAY_META[adminDay].title.split('—')[0].trim();
    if (!exercises.length){ showToast('Nothing on ' + dayName + ' to save yet.'); return; }
    const picker = document.getElementById('admin-client-picker');
    const who = adminOwnerId === me.id ? 'My program' : (picker && picker.selectedOptions[0] ? picker.selectedOptions[0].textContent : 'Client');
    const title = dayName + ' — ' + who;
    if (!confirm('Save ' + dayName + '\u2019s ' + blocks.length + ' block' + (blocks.length === 1 ? '' : 's') + ' (' + exercises.length + ' exercise' + (exercises.length === 1 ? '' : 's') + ') to Workouts to Try as "' + title + '"?')) return;
    const variants = [{ name: 'Workout', exercises }];
    btn.disabled = true;
    const { error } = await bnbClient.from('coach_workouts').insert([{
      owner_id: me.id, title, variants, source: workoutVariantsToText(variants), updated_at: new Date().toISOString()
    }]);
    btn.disabled = false;
    if (error){ console.error('Supabase insert coach_workouts failed:', error); showToast('Couldn\u2019t save — ' + (error.message || 'try again')); return; }
    await refreshCoachWorkouts();
    fillAdminLoadWorkout();
    renderCoachWorkouts();
    showToast('Saved "' + title + '" to Workouts to Try');
  }
  { const b = document.getElementById('admin-save-day-workout'); if (b) b.onclick = ()=> saveDayAsWorkout(b); }

  async function saveBlockAsWorkout(block, btn){
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (!me) return;
    const exercises = blockAsVariantExercises(block).map(ex => Object.assign(ex, { block: '' }));
    if (!exercises.length){ showToast('Add an exercise with a name first.'); return; }
    const title = String(block.name || '').trim() || 'Untitled workout';
    const variants = [{ name: 'Workout', exercises }];
    btn.disabled = true;
    const { data, error } = await bnbClient.from('coach_workouts').insert([{
      owner_id: me.id, title, variants, source: workoutVariantsToText(variants), updated_at: new Date().toISOString()
    }]).select('id');
    btn.disabled = false;
    if (error){ console.error('Supabase insert coach_workouts failed:', error); showToast('Couldn\u2019t save — ' + (error.message || 'try again')); return; }
    block.src = { workoutId: data[0].id, ownerId: me.id, version: 'Workout', vIdx: 0 };
    saveAdminProgram();
    await refreshCoachWorkouts();
    renderAdminBlocks();
    renderCoachWorkouts();
    showToast('Saved "' + title + '" to Workouts to Try');
  }

  // A version as Program Builder blocks: one per block in it (just one if
  // it isn't split). src remembers the saved workout, version and block
  // each came from, so Program Builder can offer to copy edits back
  // (blockWorkoutLink).
  function workoutVariantToBlocks(variant, title, src){
    const base = variant.name && variant.name !== 'Workout' ? title + ' — ' + variant.name : title;
    const rows = (variant.exercises || []).map(structuredExercise).filter(ex => ex.name.trim());
    return versionBlocks(rows).map(run => {
      const block = {
        name: run.name ? base + ' — ' + run.name : base,
        exercises: run.exercises.map(ex => { const out = Object.assign({}, ex); delete out.block; return out; })
      };
      if (src) block.src = Object.assign({}, src, run.name ? { block: run.name } : {});
      return block;
    });
  }
  function sendWorkoutToProgramBuilder(variants, title, vIdx, workoutId){
    vIdx = vIdx || 0;
    let variant = variants[vIdx];
    const btn = document.querySelector('#coach-section-switch [data-coach-section="program"]');
    if (btn) btn.click();
    const host = document.getElementById('coach-section-program');
    if (!host) return;
    let bar = document.getElementById('admin-incoming');
    if (!bar){
      bar = document.createElement('div');
      bar.id = 'admin-incoming';
      bar.className = 'admin-incoming';
      const picker = document.getElementById('admin-client-picker');
      (picker ? picker.closest('.field') : host.firstChild).after(bar);
    }
    const labelOf = v => v.name && v.name !== 'Workout' ? title + ' — ' + v.name : title;
    const countOf = v => v.exercises.length + ' exercise' + (v.exercises.length === 1 ? '' : 's');
    bar.innerHTML = `
      <div class="admin-incoming-text">${variants.length > 1
        ? `Add <b>${esc(title)}</b> to the program for the client picked above — which version, and on which day?`
        : `Add <b>${esc(labelOf(variant))}</b> (${countOf(variant)}) to the program for the client picked above, on`}</div>
      <div class="admin-incoming-row">
        ${variants.length > 1 ? `<select id="admin-incoming-variant">${variants.map((v, i) => `<option value="${i}"${i === vIdx ? ' selected' : ''}>${esc(v.name)} (${countOf(v)})</option>`).join('')}</select>` : ''}
        <select id="admin-incoming-day">${DAY_ORDER.map(d => `<option value="${d}"${d === adminDay ? ' selected' : ''}>${esc(DAY_META[d].title.split('—')[0].trim())}</option>`).join('')}</select>
        <button class="btn2 primary" type="button" data-inc="add">Add as New Block${variants.some(v => versionBlocks(v.exercises).length > 1) ? 's' : ''}</button>
        <button class="btn2" type="button" data-inc="replace">Replace That Day</button>
        <button class="btn2" type="button" data-inc="cancel">Cancel</button>
      </div>`;
    const daySel = bar.querySelector('#admin-incoming-day');
    const varSel = bar.querySelector('#admin-incoming-variant');
    if (varSel) varSel.onchange = ()=>{ vIdx = +varSel.value; variant = variants[vIdx]; };
    daySel.onchange = ()=>{ adminDay = daySel.value; renderAdminDayTabs(); renderAdminBlocks(); };
    daySel.onchange();
    bar.querySelectorAll('[data-inc]').forEach(b => b.onclick = ()=>{
      const act = b.dataset.inc;
      if (act === 'cancel'){ bar.remove(); return; }
      const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
      if (!me || !adminOwnerId){ showToast('Sign in and pick a client first.'); return; }
      const day = daySel.value;
      const picker = document.getElementById('admin-client-picker');
      const who = picker && picker.selectedOptions[0] ? picker.selectedOptions[0].textContent : 'this client';
      const dayLabel = DAY_META[day].title.split('—')[0].trim();
      const newBlocks = workoutVariantToBlocks(variant, title,
        workoutId ? { workoutId, ownerId: me.id, version: variant.name, vIdx } : null);
      const label = labelOf(variant);
      if (act === 'replace'){
        if ((adminProgramData[day] || []).length &&
            !confirm('Replace everything on ' + who + "'s " + dayLabel + ' with "' + label + '"?')) return;
        adminProgramData[day] = newBlocks;
      } else {
        (adminProgramData[day] = adminProgramData[day] || []).push(...newBlocks);
      }
      adminDay = day;
      saveAdminProgram(); renderAdminDayTabs(); renderAdminBlocks();
      bar.remove();
      showToast((act === 'replace' ? 'Replaced ' : 'Added to ') + who + "'s " + dayLabel);
    });
    bar.scrollIntoView({ behavior:'smooth', block:'center' });
  }

  // Program Builder's "Load a saved workout…" dropdown: every variant of
  // the coach's Workouts to Try, grouped by workout. Picking one opens the
  // same add/replace bar as Send to Program Builder.
  async function fillAdminLoadWorkout(){
    const sel = document.getElementById('admin-load-workout');
    if (!sel) return;
    await refreshCoachWorkouts();
    const list = coachWorkouts || [];
    sel.innerHTML = '<option value="">' + (list.length ? 'Load a saved workout…' : 'No saved workouts yet (Workouts to Try)') + '</option>' +
      list.map((w, wIdx) => '<optgroup label="' + esc(w.title) + '">' +
        (w.variants || []).map((v, vIdx) => '<option value="' + wIdx + ':' + vIdx + '">' + esc(v.name) + ' (' + (v.exercises || []).length + ')</option>').join('') +
        '</optgroup>').join('');
    sel.onchange = ()=>{
      const [wIdx, vIdx] = sel.value.split(':').map(Number);
      const w = list[wIdx];
      sel.value = '';
      if (w && w.variants[vIdx]) sendWorkoutToProgramBuilder(w.variants, w.title, vIdx, w.id);
    };
  }

  let coachWorkouts = null;       // null = not loaded yet
  let coachWorkoutsError = '';
  let coachWorkoutEditing = null; // id being edited, or null for a new one
  async function refreshCoachWorkouts(){
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (!me){ coachWorkouts = []; coachWorkoutsError = 'Sign in to save workouts.'; return; }
    const { data, error } = await bnbClient.from('coach_workouts').select('*')
      .eq('owner_id', me.id).order('updated_at', { ascending: false });
    if (error){
      console.error('Supabase load coach_workouts failed:', error);
      coachWorkouts = [];
      coachWorkoutsError = /coach_workouts/.test(error.message || '') && /exist|schema cache/.test(error.message || '')
        ? 'Workouts to Try needs sql/61-coach-workouts.sql run in Supabase first.'
        : 'Couldn’t load your saved workouts — check your connection and try again.';
      return;
    }
    coachWorkouts = data || [];
    coachWorkoutsError = '';
  }

  // The form's working copy — kept between renders so adding a row or a
  // version doesn't lose what's typed. forId is the workout being edited
  // (null for a new one); a different forId starts a fresh draft.
  let cwDraft = null;
  function cwDraftFor(editing){
    const forId = editing ? editing.id : null;
    if (!cwDraft || cwDraft.forId !== forId){
      cwDraft = editing
        ? { forId, title: editing.title || '', versions: JSON.parse(JSON.stringify(structuredVariants(editing.variants))) }
        : { forId, title: '', versions: [{ name: 'Workout', exercises: [Object.assign(blankExercise(), { name: '' })] }] };
    }
    return cwDraft;
  }
  function cwDraftHasContent(d){
    return !!(d.title.trim() || d.versions.some(v => v.exercises.some(ex => String(ex.name || '').trim())));
  }
  // The draft as rows to save: unnamed exercises and empty versions
  // dropped, each exercise carrying its plan line for the card.
  function cwDraftVariants(d){
    return d.versions.map(v => ({
      name: String(v.name || '').trim() || 'Workout',
      exercises: v.exercises.filter(ex => String(ex.name || '').trim())
        .map(ex => Object.assign(structuredExercise(ex), { name: String(ex.name).trim(), presc: planString(ex) }))
    })).filter(v => v.exercises.length);
  }

  function renderCoachWorkouts(){
    const body = document.getElementById('coach-workouts-body');
    if (!body) return;
    const editing = coachWorkoutEditing && (coachWorkouts || []).find(w => w.id === coachWorkoutEditing);
    const list = coachWorkouts || [];
    const draft = cwDraftFor(editing);
    body.innerHTML = `
      ${coachWorkoutsError ? `<div class="admin-notice">${esc(coachWorkoutsError)}</div>` : ''}
      <div class="cw-list">
        ${coachWorkouts === null ? '<div class="field-hint">Loading…</div>'
          : !list.length ? '<div class="field-hint">No saved workouts yet — build one below.</div>'
          : list.map(w => `
          <div class="cw-card" data-id="${esc(w.id)}">
            <div class="cw-card-head">
              <div><div class="cw-title">${esc(w.title)}</div><div class="cw-date">Saved ${esc(String(w.updated_at || w.created_at || '').slice(0, 10))}</div></div>
              <div class="cw-card-btns">
                <button class="btn2" data-cw="edit" type="button">Edit</button>
                <button class="crud-remove" data-cw="delete" type="button" title="Delete workout">✕</button>
              </div>
            </div>
            ${structuredVariants(w.variants).map((v, vIdx) => `
              <div class="cw-variant">
                <div class="cw-variant-head"><span>${esc(v.name)}</span>
                  <span class="cw-variant-btns"><button class="btn2 primary cw-try" data-cw="try" data-v="${vIdx}" type="button" title="Loads into the Live Session's current slot and day as Freeform">Try in Live Session</button><button class="btn2 cw-try" data-cw="send" data-v="${vIdx}" type="button" title="Add to a client's program in Program Builder">Send to Program Builder</button><button class="btn2 cw-try" data-cw="mine" data-v="${vIdx}" type="button" title="Loads into your own MEMBER > Live Session as Freeform, on the day you pick">Send to My Freeform</button><button class="crud-remove" data-cw="delvar" data-v="${vIdx}" type="button" title="Delete this version">✕</button></span></div>
                <ul class="cw-ex">${(()=>{ const lb = exerciseLabels(v.exercises); return v.exercises.map((ex, i) => {
                  const plan = planString(ex);
                  const head = ex.block && (i === 0 || v.exercises[i - 1].block !== ex.block) ? `<li class="cw-ex-block">${esc(ex.block)}</li>` : '';
                  return head + `<li>${lb[i] ? `<span class="crud-ex-label">${esc(lb[i])}</span>` : ''}<b>${esc(ex.name)}</b>${plan ? ` <span>${esc(plan)}</span>` : ''}</li>`;
                }).join(''); })()}</ul>
                ${workoutStatsHtml(v)}
              </div>`).join('')}
          </div>`).join('')}
      </div>
      <div class="cw-form">
        <div class="cw-form-head">${editing ? 'Edit workout' : 'Build a workout to try'}</div>
        <div class="field"><label for="cw-title">Title</label><input type="text" id="cw-title" maxlength="120" placeholder="e.g. Zercher leg day" value="${esc(draft.title)}"></div>
        <details class="cw-paste">
          <summary>Paste a workout as text</summary>
          <textarea id="cw-text" rows="7" placeholder="One exercise per line, like&#10;Strength:&#10;Back Squats: 3 x 8 @ 80kg, rest 2 min&#10;Walking Lunges: 3 x 24m"></textarea>
          <div class="cw-paste-row"><button class="btn2" id="cw-fill" type="button">Fill Rows from Text</button><span class="field-hint" id="cw-paste-hint">Lines ending in ":" start a new version. Check the rows after.</span></div>
        </details>
        <div id="cw-editor"></div>
        <div class="crud-actions" style="padding-left:0;">
          <button class="btn2" id="cw-add-version" type="button">+ Add Version</button>
        </div>
        <div id="cw-draft-stats"></div>
        <div class="crud-actions" style="padding-left:0;">
          <button class="btn2 primary" id="cw-save" type="button">${editing ? 'Save Changes' : 'Save Workout'}</button>
          <button class="btn2" id="cw-save-load" type="button">Save &amp; Load to Program Builder</button>
          <button class="btn2" id="cw-copy" type="button" title="Copy the title and workout as text to paste elsewhere">Copy Text</button>
          <button class="btn2" id="cw-cancel" type="button">${editing ? 'Cancel' : 'Clear'}</button>
        </div>
      </div>`;

    const titleEl = body.querySelector('#cw-title');
    titleEl.oninput = ()=>{ draft.title = titleEl.value; };
    const statsEl = body.querySelector('#cw-draft-stats');
    const drawStats = ()=>{
      const vs = cwDraftVariants(draft);
      statsEl.innerHTML = vs.map(v => '<div class="cw-draft-stat">' + (vs.length > 1 ? '<div class="cw-draft-stat-name">' + esc(v.name) + '</div>' : '') + workoutStatsHtml(v) + '</div>').join('');
    };
    const editorEl = body.querySelector('#cw-editor');
    const drawEditor = ()=>{ renderBlockEditor(editorEl, draft.versions, drawStats, drawEditor, { noun: 'Version', subBlocks: true }); drawStats(); };
    drawEditor();
    body.querySelector('#cw-add-version').onclick = ()=>{
      draft.versions.push({ name: 'Version ' + (draft.versions.length + 1), exercises: [Object.assign(blankExercise(), { name: '' })] });
      drawEditor();
    };

    // Paste: text into rows, through the same reader as before.
    body.querySelector('#cw-fill').onclick = ()=>{
      const text = body.querySelector('#cw-text').value;
      const vs = parseWorkoutText(text);
      if (!vs.length){ showToast('No exercises found — one per line, like "Back Squats: 3 x 8".'); return; }
      if (draft.versions.some(v => v.exercises.some(ex => String(ex.name || '').trim())) &&
          !confirm('Replace the rows below with what’s in the text?')) return;
      draft.versions = vs.map(v => ({ name: v.name, exercises: v.exercises.map(structuredExercise) }));
      body.querySelector('#cw-text').value = '';
      body.querySelector('.cw-paste').open = false;
      drawEditor();
      showToast('Filled ' + vs.reduce((n, v) => n + v.exercises.length, 0) + ' rows — check them, then save');
    };

    const saveWorkout = async (btn, thenLoad)=>{
      const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
      if (!me){ showToast('Sign in to save workouts.'); return; }
      const title = draft.title.trim();
      const variants = cwDraftVariants(draft);
      if (!title){ showToast('Give it a title first.'); titleEl.focus(); return; }
      if (!variants.length){ showToast('Add at least one exercise with a name.'); return; }
      const row = { title, source: workoutVariantsToText(variants), variants, updated_at: new Date().toISOString() };
      btn.disabled = true;
      const { data: saved, error } = editing
        ? await bnbClient.from('coach_workouts').update(row).eq('id', editing.id).select('id')
        : await bnbClient.from('coach_workouts').insert([{ ...row, owner_id: me.id }]).select('id');
      btn.disabled = false;
      if (error){ console.error('Supabase save coach_workouts failed:', error); showToast('Couldn’t save — ' + (error.message || 'try again')); return; }
      coachWorkoutEditing = null;
      cwDraft = null;
      await refreshCoachWorkouts();
      renderCoachWorkouts();
      if (thenLoad) sendWorkoutToProgramBuilder(variants, title, 0, saved && saved[0] ? saved[0].id : (editing && editing.id));
      else showToast(editing ? 'Workout updated' : 'Workout saved');
    };
    body.querySelector('#cw-save').onclick = e => saveWorkout(e.currentTarget, false);
    body.querySelector('#cw-save-load').onclick = e => saveWorkout(e.currentTarget, true);
    // Editing: leave without saving. New workout: clear the form.
    body.querySelector('#cw-cancel').onclick = ()=>{
      if (!editing && cwDraftHasContent(draft) && !confirm('Clear this workout without saving?')) return;
      coachWorkoutEditing = null;
      cwDraft = null;
      renderCoachWorkouts();
    };
    // Title + workout as text, e.g. to paste into WhatsApp or a note.
    body.querySelector('#cw-copy').onclick = async ()=>{
      const vs = cwDraftVariants(draft);
      const text = [draft.title.trim(), vs.length ? workoutVariantsToText(vs) : ''].filter(Boolean).join('\n\n');
      if (!text){ showToast('Nothing to copy yet.'); return; }
      try {
        await navigator.clipboard.writeText(text);
      } catch(e){
        // Older browsers / no clipboard permission: copy via a hidden textarea.
        const tmp = document.createElement('textarea');
        tmp.value = text; tmp.setAttribute('readonly', ''); tmp.style.position = 'fixed'; tmp.style.opacity = '0';
        document.body.appendChild(tmp); tmp.select();
        const ok = document.execCommand('copy');
        tmp.remove();
        if (!ok){ showToast('Couldn’t copy — select the text and copy it by hand.'); return; }
      }
      showToast('Workout copied');
    };

    body.querySelectorAll('.cw-card').forEach(card => {
      const w = list.find(x => x.id === card.dataset.id);
      if (!w) return;
      const variants = structuredVariants(w.variants);
      card.querySelectorAll('[data-cw]').forEach(btn => {
        btn.onclick = async ()=>{
          const act = btn.dataset.cw;
          if (act === 'try') return tryWorkoutInSession(variants[+btn.dataset.v], w.title);
          if (act === 'send') return sendWorkoutToProgramBuilder(variants, w.title, +btn.dataset.v, w.id);
          if (act === 'mine'){
            // Pick the day first, in a small row under the version's buttons.
            const variantEl = btn.closest('.cw-variant');
            const open = variantEl.querySelector('.cw-send-day');
            if (open){ open.remove(); return; }
            const row = document.createElement('div');
            row.className = 'cw-send-day';
            row.innerHTML = '<span>Load into your own Live Session (Freeform) on</span>' +
              '<select aria-label="Day">' + DAY_ORDER.map(d => '<option value="' + d + '"' + (d === mlsDay ? ' selected' : '') + '>' + esc(DAY_META[d].title.split('—')[0].trim()) + '</option>').join('') + '</select>' +
              '<button class="btn2 primary cw-try" type="button" data-go>Send</button><button class="btn2 cw-try" type="button" data-cancel>Cancel</button>';
            variantEl.querySelector('.cw-variant-head').after(row);
            row.querySelector('[data-cancel]').onclick = ()=> row.remove();
            row.querySelector('[data-go]').onclick = ()=>{
              if (sendWorkoutToMyFreeform(variants[+btn.dataset.v], w.title, row.querySelector('select').value)) row.remove();
            };
            return;
          }
          if (act === 'edit'){
            if (coachWorkoutEditing !== w.id && cwDraft && cwDraftHasContent(cwDraft) &&
                !confirm('Drop the workout you’re building and edit "' + w.title + '" instead?')) return;
            coachWorkoutEditing = w.id; renderCoachWorkouts();
            body.querySelector('.cw-form').scrollIntoView({ behavior:'smooth', block:'start' });
            body.querySelector('#cw-title').focus({ preventScroll:true });
            return;
          }
          if (act === 'delvar'){
            const v = variants[+btn.dataset.v];
            if (!v) return;
            if (variants.length <= 1){
              if (!confirm('"' + v.name + '" is the only version left — delete the whole "' + w.title + '" workout?')) return;
            } else if (!confirm('Delete "' + v.name + '" from "' + w.title + '"?')) return;
            const rest = variants.filter((_, i) => i !== +btn.dataset.v)
              .map(x => ({ name: x.name, exercises: x.exercises.map(ex => Object.assign({}, ex, { presc: planString(ex) })) }));
            const { error } = rest.length
              ? await bnbClient.from('coach_workouts').update({ variants: rest, source: workoutVariantsToText(rest), updated_at: new Date().toISOString() }).eq('id', w.id)
              : await bnbClient.from('coach_workouts').delete().eq('id', w.id);
            if (error){ console.error('Supabase update coach_workouts failed:', error); showToast('Couldn’t delete — try again'); return; }
            if (coachWorkoutEditing === w.id){ coachWorkoutEditing = null; cwDraft = null; }
            showToast('Deleted "' + v.name + '"');
            await refreshCoachWorkouts();
            renderCoachWorkouts();
            return;
          }
          if (act === 'delete'){
            if (!confirm('Delete "' + w.title + '"?')) return;
            const { error } = await bnbClient.from('coach_workouts').delete().eq('id', w.id);
            if (error){ console.error('Supabase delete coach_workouts failed:', error); showToast('Couldn’t delete — try again'); return; }
            if (coachWorkoutEditing === w.id){ coachWorkoutEditing = null; cwDraft = null; }
            await refreshCoachWorkouts();
            renderCoachWorkouts();
          }
        };
      });
    });
  }

  window.bnbCoachWorkoutsOnShown = async function(){
    renderCoachWorkouts();
    await refreshCoachWorkouts();
    renderCoachWorkouts();
  };

  /* -------------------------------- INIT ---------------------------------- */
  renderAllPerform();
  renderTodayProgram();
  populateAdminClientPicker(); // no-op if not signed in yet; the Coach sub-switcher re-calls this (via window.bnbProgramBuilderOnShown) whenever Program Builder is actually opened
  renderAdminDayTabs();
  renderAdminBlocks();
  renderSlotSwitch();
  renderSessionDayTabs();
  renderSessionDay();
  wireSessionOnce();
  renderMlsDayTabs();
  renderMlsDay();
  wireMlsOnce();

})();

