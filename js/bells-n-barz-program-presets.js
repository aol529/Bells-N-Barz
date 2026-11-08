/* =========================================================================
   BELL(E)S N' BARZ — PRESET PROGRAM LIBRARY (Coach > Programs)
   Loaded only on staff.html, before js/bells-n-barz-training-core.js, which
   reads window.BNB_PROGRAM_PRESETS. Moved out of training-core so the main
   page doesn't download ~1,400 lines it never uses.
   ========================================================================= */
(function(){
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
  // The rest of 1% Fitness's phases (Mike Sheridan), from the book's own
  // tables. Phase 1 is a bodyweight circuit; Phases 2 and 3 follow
  // Principle #5's pairing (bend with pull, extend with push, legs first)
  // with a tempo on every lift; Phase 3 adds a weekly HIIT or sprint day.
  // Each sub-phase runs two weeks.
  const ONE_PERCENT_PHASES = (function(){
    const ex = (name, sets, reps, rest, tempo, equipment, alternates) => ({ name, rest: rest || '', tempo: tempo || '', equipment: equipment || '', alternates: alternates || '', sets, reps });
    const warm = { name:'A — Dynamic Warm-Up', exercises:[ ex('1% Fitness Dynamic Warm-Up', '1', '5 each drill', '120 sec', '1-1-1-1', 'Bodyweight') ] };
    const strength = (b1, b2, c1, c2, d) => [ warm,
      { name:'B — ' + b1[6] + ' + ' + b2[6], exercises:[ ex(...b1.slice(0, 6)), ex(...b2.slice(0, 6)) ]},
      { name:'C — ' + c1[6] + ' + ' + c2[6], exercises:[ ex(...c1.slice(0, 6)), ex(...c2.slice(0, 6)) ]},
      { name:'D', exercises:[ ex(...d) ]} ];
    const cond = (title, blocks) => [ warm, ...blocks.map((rows, i) => ({ name: 'BCD'[i] + ' — ' + title, exercises: rows.map(r => ex(...r)) })) ];
    const twice = (w) => ({ mon: clone(w), tue: [], wed: [], thu: clone(w), fri: [], sat: [], sun: [] });
    const twicePlus = (w, c) => ({ mon: clone(w), tue: [], wed: [], thu: clone(w), fri: [], sat: clone(c), sun: [] });

    // Phase 1 (2 weeks): one bodyweight circuit, 30 sec on / 30 sec off, 3 rounds, under 15 minutes.
    const lvl = (n, alts) => ex(n, '3 rounds', '30 sec work', '30 sec', '', 'Bodyweight', alts);
    const p1 = [{ name:'A — Circuit: A1 to A5, three rounds', exercises:[
      lvl('Push-Up', 'Levels 1–4 — start at Level 1; move up only after 30 clean seconds'),
      lvl('Dead Bug — Bent Knees', 'Level 2: Bent-to-Straight · Level 3: Straight Legs · Level 4: Crossover Crunches'),
      lvl('Bodyweight Squat', 'Levels 1–4'),
      lvl('Partial Bird Dog', 'Level 2: Full Bird Dog · Level 3: RKC Plank · Level 4: Plank Limb Lifts'),
      lvl('Glute Bridge', 'Levels 1–4') ]}];

    const t4 = '4-0-1-0', t3 = '3-0-1-0';
    return {
      p1: twice(p1),
      p21: twice(strength(
        ['Front Squat — 1 Dumbbell, Goblet Grip', '3', '10–12', '30 sec', t4, 'Dumbbell', 'Bend'],
        ['Seated Overhead Pulldown — Supinated Grip', '3', '10–12', '30 sec', t4, 'Cable', 'Pull'],
        ['Straight-Leg Deadlift — Low Pulley, Sumo Grip', '3', '10–12', '0 sec', t4, 'Cable', 'Extend'],
        ['Seated 45° Chest Press — 2 Dumbbells, Neutral Grip', '3', '10–12', '60 sec', t4, 'Dumbbell/Bench', 'Push'],
        ['Standing Pallof Press — Mid Pulley', '3', '10–12 /side', '60 sec', 'slow', 'Cable'])),
      p22: twice(strength(
        ['Bent-Knee Deadlift — 2 Dumbbells, Suitcase Grip', '3', '6–8', '60 sec', t3, 'Dumbbell', 'Bend'],
        ['1-Arm Row From All 4s — 2 Dumbbells, Alternating', '3', '6–8 /side', '60 sec', t3, 'Dumbbell', 'Pull'],
        ['Straight-Leg Deadlift — 1 Dumbbell, Sumo Grip', '3', '6–8', '0 sec', t3, 'Dumbbell', 'Extend'],
        ['Flat Chest Press — 2 Dumbbells, Pronated Grip', '3', '6–8', '120 sec', t3, 'Dumbbell/Bench', 'Push'],
        ['1-Arm Low Farmer’s Carry — 1 Dumbbell', '3', '20 yd /side', '60 sec', 'slow', 'Dumbbell'])),
      p32: twicePlus(strength(
        ['Straight-Leg Deadlift (Hip Hinge) — 2 Dumbbells, Suitcase Grip', '3', '6–8', '60 sec', t3, 'Dumbbell', 'Extend'],
        ['Flat Chest Press — 2 Dumbbells, Neutral-to-Pronated Twist', '3', '6–8', '60 sec', t3, 'Dumbbell/Bench', 'Push'],
        ['Inverted Row — Supinated Grip (Incline or Flat)', '3', '6–8', '0 sec', t3, 'Bar', 'Pull'],
        ['Lunge — 2 Dumbbells, Front Foot Elevated', '3', '6–8 /side', '120 sec', t3, 'Dumbbell/Step', 'Bend'],
        ['45° Iso Hold — Bodyweight (Levels 1–3)', '3', '30 sec /side', '60 sec', 'hold', 'Bench/GHD']),
        cond('HIIT', [
          [['Speed Skaters or Sprinter Starts', '4', '20 sec work', '10 sec', '', 'Bodyweight'], ['V-Ups (Levels 1–4)', '4', '20 sec work', '70 sec', '', 'Bodyweight']],
          [['Elevated Burpee + Step or Jump Up', '4', '30 sec work', '90 sec', '', 'Bench/Box']] ])),
      p33: twicePlus(strength(
        ['Front Squat — 2 Dumbbells, Neutral Grip', '4', '8–10', '30 sec', t4, 'Dumbbell', 'Bend'],
        ['15° Prone Row — 2 Dumbbells, Neutral Grip', '4', '8–10', '30 sec', t4, 'Dumbbell/Bench', 'Pull'],
        ['Seated Overhead Press (Unsupported) — 2 Dumbbells, Pronated Grip', '4', '8–10', '0 sec', t4, 'Dumbbell/Bench', 'Push'],
        ['Glute Bridge — 1 Dumbbell, Back on Bench', '4', '8–10', '60 sec', t4, 'Dumbbell/Bench', 'Extend'],
        ['Hanging Iso-Hold — Knees at 90°', '3', '30 sec', '60 sec', 'hold', 'Bar']),
        cond('Sprint Intervals (SIT)', [
          [['Build-Up Sprints — 40–90% effort', '4', '30 sec work', '130 sec', '', 'None']],
          [['All-Out Sprints — 90–110% effort', '6', '15 sec work', '165 sec', '', 'None']] ])),
      p34: twicePlus(strength(
        ['Bent-Knee Deadlift (to Rack or Step) — Barbell', '4', '4–6', '30 sec', t3, 'Barbell', 'Bend'],
        ['45° Chest Press — Barbell', '4', '4–6', '90 sec', t3, 'Barbell/Bench', 'Push'],
        ['Assisted Pull-Up — Neutral Grip', '4', '4–6', '60 sec', t3, 'Bar/Band', 'Pull'],
        ['Split Squat — 2 Dumbbells, Front Foot Elevated or Flat', '4', '4–6 /side', '60 sec', t3, 'Dumbbell', 'Bend'],
        ['1-Arm Overhead Farmer’s Carry — 1 Dumbbell', '3', '40 yd /side', '60 sec', 'slow', 'Dumbbell']),
        cond('HIIT', [
          [['Sumo Deadlift + Overhead Press — 1 Dumbbell or Med Ball', '3', '20 sec work', '10 sec', '', 'Dumbbell'], ['Active Plank — 1 Dumbbell Pull-Across', '3', '20 sec work', '70 sec', '', 'Dumbbell']],
          [['Skier on Step or Standard Step-Ups', '3', '20 sec work', '10 sec', '', 'Step'], ['V-Sit + Med Ball Hold or Press', '3', '20 sec work', '70 sec', '', 'Med ball']] ]))
    };
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
      id: 'one-percent-phase-1',
      name: "1% Fitness — Phase 1: Bodyweight Foundations",
      description: "Two weeks, twice a week with at least two days between. One bodyweight circuit — push-up, dead bug, bodyweight squat, bird dog, glute bridge — each for 30 seconds with 30 seconds' rest, three rounds, under 15 minutes. Every exercise has four levels: start at Level 1 and move up only after 30 clean seconds; drop a level if you can't last 30. You'll likely end up at different levels for different exercises. Source: Mike Sheridan, 1% Fitness: Move Better. Train Smarter. Live Longer. — adapted; see Sources & Credits.",
      data: ONE_PERCENT_PHASES.p1
    },
    {
      id: 'one-percent-phase-2-1',
      name: "1% Fitness — Phase 2.1: Bend + Pull, Extend + Push",
      description: "Weeks 1–2 of Phase 2, twice a week. The first loaded phase, built on Principle #5: a goblet front squat paired with an overhead pulldown, a low-pulley straight-leg deadlift paired with a 45° dumbbell chest press, then a Pallof press. 3 × 10–12 with a slow 4-second lowering (tempo 4-0-1-0). Source: Mike Sheridan, 1% Fitness: Move Better. Train Smarter. Live Longer. — adapted; see Sources & Credits.",
      data: ONE_PERCENT_PHASES.p21
    },
    {
      id: 'one-percent-phase-2-2',
      name: "1% Fitness — Phase 2.2: Heavier Bend + Pull, Extend + Push",
      description: "Weeks 3–4 of Phase 2, twice a week. Heavier and shorter: a suitcase-grip bent-knee deadlift with a one-arm row from all fours, a sumo straight-leg deadlift with a flat dumbbell press, then a one-arm low farmer's carry. 3 × 6–8 at tempo 3-0-1-0, with up to two minutes' rest after the press. Source: Mike Sheridan, 1% Fitness: Move Better. Train Smarter. Live Longer. — adapted; see Sources & Credits.",
      data: ONE_PERCENT_PHASES.p22
    },
    {
      id: 'one-percent-superset-upper-lower',
      name: "1% Fitness — Phase 3.1: Superset Upper With Lower & Push With Pull (+ HIIT)",
      description: "Mike Sheridan's Principle #5 as a program. Every superset pairs a leg movement with an upper-body one: upper pulls go with lower 'bends' (squat and knee-dominant moves), upper pushes with lower 'extends' (hinge and hip-dominant moves), so the grip never has to work twice in a row, and the legs always go first. Alternate the two exercises of each pair until all sets are done (in this phase with 30 seconds between them), then move to the next pair. This is the book's Phase 3.1 (two weeks): the strength workout Monday and Thursday with a slow 4-second lowering (tempo 4-0-1-0), 3 × 10–12, and a HIIT day on Saturday. The book then moves through Phase 3.2 (hinge + chest press, inverted row + front-foot-elevated lunge, 6–8 reps), 3.3 (front squat + prone row, overhead press + glute bridge, 4 × 8–10, sprint intervals) and 3.4 (barbell deadlift + 45° press, assisted pull-up + split squat, 4 × 4–6) — swap the exercises every two weeks to follow it. Source: Mike Sheridan, 1% Fitness: Move Better. Train Smarter. Live Longer. — adapted; see Sources & Credits.",
      data: ONE_PERCENT_SUPERSET_DAYS
    },
    {
      id: 'one-percent-phase-3-2',
      name: "1% Fitness — Phase 3.2: Extend + Push, Pull + Bend (+ HIIT)",
      description: "Weeks 3–4 of Phase 3: strength Monday and Thursday — a suitcase straight-leg deadlift with a flat dumbbell press, an inverted row with a front-foot-elevated lunge, then a 45° iso hold; 3 × 6–8 at tempo 3-0-1-0 — and a HIIT day on Saturday (speed skaters or sprinter starts with V-ups, then elevated burpees). Source: Mike Sheridan, 1% Fitness: Move Better. Train Smarter. Live Longer. — adapted; see Sources & Credits.",
      data: ONE_PERCENT_PHASES.p32
    },
    {
      id: 'one-percent-phase-3-3',
      name: "1% Fitness — Phase 3.3: Bend + Pull, Push + Extend (+ Sprints)",
      description: "Weeks 5–6 of Phase 3: strength Monday and Thursday — a dumbbell front squat with a 15° prone row, an unsupported seated overhead press with a bench glute bridge, then a hanging knees-at-90° iso hold; 4 × 8–10 at tempo 4-0-1-0 — and sprint intervals on Saturday (four build-up sprints, then six all-out 15-second sprints with long rests). Source: Mike Sheridan, 1% Fitness: Move Better. Train Smarter. Live Longer. — adapted; see Sources & Credits.",
      data: ONE_PERCENT_PHASES.p33
    },
    {
      id: 'one-percent-phase-3-4',
      name: "1% Fitness — Phase 3.4: Heavy Bend + Push, Pull + Bend (+ HIIT)",
      description: "Weeks 7–8 of Phase 3, the heaviest block: a barbell bent-knee deadlift (to a rack or step) with a 45° barbell press, an assisted pull-up with a split squat, then a one-arm overhead farmer's carry; 4 × 4–6 at tempo 3-0-1-0. HIIT on Saturday: sumo deadlift + press with plank pull-across, then skier steps with V-sits. Source: Mike Sheridan, 1% Fitness: Move Better. Train Smarter. Live Longer. — adapted; see Sources & Credits.",
      data: ONE_PERCENT_PHASES.p34
    },
    {
      id: 'one-percent-fitness-ab',
      name: "1% Fitness — Push/Pull Template (A/B): Bend + Pull, Extend + Push",
      description: "Another \"choose your movement pattern\" full-body A/B template, paired as supersets (A1+A2, B1+B2, etc.) rather than straight sets. Workout A leans lower-body push / upper-body pull (squat, vertical pull, lunge, horizontal pull); Workout B mirrors it as lower-body pull / upper-body push (deadlift, vertical push, reverse lunge, horizontal push) — alternate the two and every major pattern gets trained across the week. Ends with a high-rep ankle + elbow finisher pairing (7 sets, 12/side and 100+ reps). As with the exercise slots, the coach picks the specific movement that fits each named pattern. Alternates Mon/Fri A, Wed B — swap to strict A/B/A/B if preferred. Source: Mike Sheridan, 1% Fitness: Move Better. Train Smarter. Live Longer. — a purchased book, not a free article, so no companion blog post accompanies this preset.",
      data: ONE_PERCENT_FITNESS_AB_DAYS
    }
  ];
  window.BNB_PROGRAM_PRESETS = PROGRAM_PRESETS;
})();
