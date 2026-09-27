
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
  const PROGRAM_PRESETS = [
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
      id: 'mens-health-total-body-ab',
      name: "Men's Health Total-Body Template (A/B)",
      description: "A modern \"choose your own exercise\" full-body template, not tied to a specific historical lifter like the Old School presets above. Two alternating workouts (A and B) each cover the whole body — core, one lower-body pattern, one upper-body pull or push — with a named exercise category per slot (e.g. \"Quadriceps, single-leg\") rather than one fixed movement, so pick whichever listed alternate suits the client's equipment and experience. 3 sets of 12 reps per exercise, 1 minute rest, a cardio finisher after every session. This preset alternates A/Wed-B/A across the week (Mon/Fri A, Wed B) — swap it to A/B/A/B if you'd rather alternate strictly workout-to-workout regardless of the calendar. Source: Adam Campbell, The Men's Health Big Book of Exercises (Rodale Books) — a purchased book, not a free article, so no companion blog post accompanies this preset.",
      data: MENS_HEALTH_AB_DAYS
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
  async function refreshProgramFromSupabase(){
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (!me) return; // nobody logged in yet
    const { data, error } = await bnbClient.from('programs').select('*').eq('owner_id', me.id);
    if (error) { console.error('Supabase load programs failed:', error); return; }
    if (data && data.length){
      programRowId = data[0].id;
      programData = data[0].data;
      if (typeof render === 'function') render();
      renderTodayProgram();
    }
  }
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
  let adminNotifiedThisLoad = false; // saveAdminProgram() fires on every keystroke — only notify once per client selected, not once per edit

  function populateAdminClientPicker(){
    const sel = document.getElementById('admin-client-picker');
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (!sel || !me) return;
    const members = window.BNB_USERS.getMembers().slice().sort((a,b)=>a.fullName.localeCompare(b.fullName));
    sel.innerHTML = '<option value="' + me.id + '">Myself</option>' +
      members.filter(u=>u.id!==me.id).map(u=>'<option value="'+u.id+'">'+esc(u.fullName)+'</option>').join('');
    sel.value = adminOwnerId || me.id;
    sel.onchange = () => loadAdminProgramFor(sel.value);
    if (!adminOwnerId) loadAdminProgramFor(me.id);
  }
  // Exposed so the Coach sub-switcher (a separate <script> block/closure)
  // can refresh the picker's member list each time Program Builder is
  // opened — same cross-closure export pattern already used by
  // mlsOnTabShown/schedOnTabShown/bnbAccountabilityOnTabShown.
  window.bnbProgramBuilderOnShown = populateAdminClientPicker;

  async function loadAdminProgramFor(ownerId){
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
    container.innerHTML = '';
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
    blocksEl.innerHTML = '';
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
    const wrap = document.getElementById('admin-blocks');
    wrap.innerHTML = '';
    const blocks = adminProgramData[adminDay] || [];

    blocks.forEach((block, bIdx)=>{
      const bDiv = document.createElement('div');
      bDiv.className = 'crud-block';

      const head = document.createElement('div');
      head.className = 'crud-block-head';
      const nameInput = document.createElement('input');
      nameInput.value = block.name;
      nameInput.oninput = ()=>{ block.name = nameInput.value; saveAdminProgram(); };
      const headBtns = document.createElement('div');
      headBtns.style.cssText = 'display:flex;gap:6px;';
      const addExBtn = document.createElement('button');
      addExBtn.className = 'btn2'; addExBtn.textContent = '+ Exercise';
      addExBtn.onclick = ()=>{
        block.exercises.push({name:'New Exercise', sets:'3', reps:'10', rest:'', tempo:'', equipment:'', alternates:''});
        saveAdminProgram(); renderAdminBlocks();
      };
      const delBlockBtn = document.createElement('button');
      delBlockBtn.className = 'crud-remove'; delBlockBtn.title = 'Delete block'; delBlockBtn.textContent = '✕';
      delBlockBtn.onclick = ()=>{
        if(!confirm('Delete "' + block.name + '" and all its exercises?')) return;
        blocks.splice(bIdx,1); saveAdminProgram(); renderAdminBlocks();
      };
      headBtns.appendChild(addExBtn); headBtns.appendChild(delBlockBtn);
      head.appendChild(nameInput); head.appendChild(headBtns);
      bDiv.appendChild(head);

      block.exercises.forEach((ex, eIdx)=>{
        const row = document.createElement('div');
        row.className = 'crud-ex-row';
        row.innerHTML = `
          <div class="crud-col"><label>Exercise</label><input data-f="name" value="${esc(ex.name)}"></div>
          <div class="crud-col"><label>Sets</label><input data-f="sets" value="${esc(ex.sets)}"></div>
          <div class="crud-col"><label>Reps</label><input data-f="reps" value="${esc(ex.reps)}"></div>
          <div class="crud-col"><label>Rest</label><input data-f="rest" value="${esc(ex.rest)}" placeholder="e.g. 90s"></div>
          <div class="crud-col"><label>Tempo</label><input data-f="tempo" value="${esc(ex.tempo)}" placeholder="e.g. 3-1-1"></div>
          <div class="crud-col"><label>Equipment</label><input data-f="equipment" value="${esc(ex.equipment)}" placeholder="e.g. Barbell"></div>
          <div class="crud-col"><label>Alternates</label><input data-f="alternates" value="${esc(ex.alternates)}" placeholder="comma, separated"></div>
          <div class="crud-col"><label>&nbsp;</label><button class="crud-remove" title="Remove exercise">✕</button></div>
        `;
        row.querySelectorAll('input').forEach(inp=>{
          inp.oninput = ()=>{ ex[inp.dataset.f] = inp.value; saveAdminProgram(); };
        });
        row.querySelector('.crud-remove').onclick = ()=>{
          block.exercises.splice(eIdx,1); saveAdminProgram(); renderAdminBlocks();
        };
        bDiv.appendChild(row);
      });

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
        if (!confirm('Load "' + preset.name + '" for the client currently selected above? This replaces every day of their current program.')) return;
        adminProgramData = clone(preset.data);
        saveAdminProgram(); renderAdminBlocks(); renderMlsDay();
        alert('Preset loaded.');
      };
    });
  })();
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
    return [ blankFreeformExercise() ];
  }
  function saveFreeformExercises(slot, day, arr){
    sessionStore[freeformKey(slot, day)] = JSON.stringify(arr);
    saveSession();
  }

  /* Whether a slot+day's freeform log has anything a coach would mind
     overwriting — i.e. more than the untouched single blank placeholder row
     getFreeformExercises() hands back by default. */
  function freeformHasRealData(slot, day){
    const list = getFreeformExercises(slot, day);
    return list.some(ex => (ex.name && ex.name.trim()) || (ex.sets||[]).some(s => s.wt || s.reps || s.done));
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
      name: ex.name,
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
        exHead.innerHTML = `<div class="ls-ex-name">${esc(ex.name)}</div><div class="ls-ex-presc">${esc(prescString(ex))}</div>`;
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
      const exDiv = document.createElement('div');
      exDiv.className = 'ls-exercise cs-freeform-exercise';

      const exHead = document.createElement('div');
      exHead.className = 'ls-ex-head cs-freeform-ex-head';

      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.className = 'cs-freeform-name';
      nameInput.placeholder = 'Exercise name…';
      nameInput.value = ex.name || '';
      nameInput.oninput = ()=>{ ex.name = nameInput.value; saveFreeformExercises(csSlot, csDay, list); };
      exHead.appendChild(nameInput);

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
          return { name: ex.name, presc: prescString(ex), meta: metaLine(ex).replace(/&nbsp;/g,' ').replace(/•/g,'|'), sets };
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
    if (!owner) return; // nothing to load until someone is signed in
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
    return [ blankMlsFreeformExercise() ];
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
        exHead.innerHTML = `<div class="ls-ex-name">${esc(ex.name)}</div><div class="ls-ex-presc">${esc(prescString(ex))}</div>`;
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
      const exDiv = document.createElement('div');
      exDiv.className = 'ls-exercise cs-freeform-exercise';

      const exHead = document.createElement('div');
      exHead.className = 'ls-ex-head cs-freeform-ex-head';

      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.className = 'cs-freeform-name';
      nameInput.placeholder = 'Exercise name…';
      nameInput.value = ex.name || '';
      nameInput.oninput = ()=>{ ex.name = nameInput.value; saveMlsFreeformExercises(day, list); };
      exHead.appendChild(nameInput);

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
          return { name: ex.name, presc: prescString(ex), meta: metaLine(ex).replace(/&nbsp;/g,' ').replace(/•/g,'|'), sets };
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

    const W=700,H=320,padL=50,padR=20,padT=20,padB=36;
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

