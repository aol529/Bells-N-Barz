-- ============================================================
-- EXERCISE GUIDES (drafted 2026-11-07, not yet run)
-- Run after gym.sql. Safe to re-run: the starter guides only fill
-- in names that are missing, so a coach's edits are never overwritten.
--
-- exercise_guides  how to do each exercise: form cues, the muscles it
--                  works, the usual mistake, and an optional video link.
--                  Everyone signed in reads them (the app shows one when
--                  a member taps an exercise). Admins and coaches
--                  (trainer role) add, change and delete them.
--                  Front desk (staff role) can read but not edit.
-- ============================================================

create table if not exists public.exercise_guides (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  muscles text not null default '' check (char_length(muscles) <= 300),
  cues text not null default '' check (char_length(cues) <= 2000),
  mistakes text not null default '' check (char_length(mistakes) <= 1000),
  video_url text check (video_url is null or video_url ~* '^https://'),
  updated_by uuid references public.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create unique index if not exists exercise_guides_name_key on public.exercise_guides (lower(trim(name)));

alter table public.exercise_guides enable row level security;

drop policy if exists "signed in read exercise guides" on public.exercise_guides;
create policy "signed in read exercise guides"
  on public.exercise_guides for select
  to authenticated
  using (true);

drop policy if exists "coaches manage exercise guides" on public.exercise_guides;
create policy "coaches manage exercise guides"
  on public.exercise_guides for all
  to authenticated
  using (is_admin() or exists (select 1 from public.users where auth_id = auth.uid() and 'trainer' = any(roles)))
  with check (is_admin() or exists (select 1 from public.users where auth_id = auth.uid() and 'trainer' = any(roles)));

revoke all on public.exercise_guides from anon;
grant select, insert, update, delete on public.exercise_guides to authenticated;

-- Who changed it last, and when, set by the database so the app can't fake it.
create or replace function exercise_guides_stamp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  new.updated_by := my_user_id();
  return new;
end;
$$;

drop trigger if exists exercise_guides_stamp on public.exercise_guides;
create trigger exercise_guides_stamp before insert or update on public.exercise_guides
  for each row execute function exercise_guides_stamp();

-- Starter guides for the gym's default program. Cues are one per line.
insert into public.exercise_guides (name, muscles, cues, mistakes) values
('Incline Barbell Bench Press', 'Upper chest, front delts, triceps',
 E'Bench at 30 to 45 degrees\nShoulder blades back and down, feet planted\nLower to the upper chest, elbows about 45 degrees from the body\nPress up and slightly back over the shoulders',
 'Bench set too steep, which turns it into a shoulder press.'),
('Chest Supported Dumbbell Row', 'Lats, mid back, rear delts, biceps',
 E'Chest on an incline bench, arms hanging straight\nPull elbows back towards the hips\nSqueeze the shoulder blades together at the top\nLower all the way under control',
 'Lifting the chest off the pad to swing the weight up.'),
('Decline Dumbbell Bench Press', 'Lower chest, triceps, front delts',
 E'Hook the feet securely before taking the dumbbells\nShoulder blades pinned to the bench\nLower to the sides of the lower chest\nPress up and together without clanking the bells',
 'Bouncing the dumbbells off the chest.'),
('T-Bar Row', 'Lats, mid back, rear delts, lower back',
 E'Hinge until the torso is about 45 degrees, back flat\nKnees soft, weight in the mid foot\nPull the handle to the lower chest\nPause, then lower until the arms are straight',
 'Standing up taller each rep to heave the weight.'),
('Flat Dumbbell Bench Press', 'Chest, front delts, triceps',
 E'Kick the dumbbells up from the knees as you lie back\nShoulder blades back, slight arch, feet down\nLower until the elbows are just below the bench\nPress up in a slight arc',
 'Elbows flared straight out to the sides, which strains the shoulders.'),
('Barbell Row', 'Lats, mid back, rear delts, biceps, lower back',
 E'Hinge to about 45 degrees, bar hanging at the knees\nBrace the core and keep the back flat\nPull the bar to the belly button\nLower with control, no bounce',
 'Rounding the lower back as the set gets hard.'),
('Cable Flyes', 'Chest, front delts',
 E'Step forward with a staggered stance\nSoft bend in the elbows, kept the same all through\nBring the hands together in a wide hugging arc\nStretch back slowly until you feel the chest open',
 'Bending the elbows and turning it into a press.'),
('Single-Arm Dumbbell Row', 'Lats, mid back, rear delts, biceps',
 E'One hand and knee on the bench, back flat\nLet the dumbbell hang straight down\nPull it towards the hip, not the armpit\nLower to a full stretch',
 'Twisting the torso open to lift more.'),
('Heel Elevated Goblet Squats', 'Quads, glutes, core',
 E'Heels on a plate or wedge, dumbbell held at the chest\nChest up, elbows inside the knees\nSit straight down as deep as you can stay upright\nDrive up through the whole foot',
 'Letting the knees cave in on the way up.'),
('Sumo Squats', 'Inner thighs, glutes, quads',
 E'Wide stance, toes turned out\nHold a dumbbell or kettlebell between the legs\nPush the knees out over the toes as you sit down\nStand tall and squeeze the glutes',
 'Knees falling inward instead of tracking over the toes.'),
('Landmine Static Split Squats', 'Quads, glutes',
 E'Hold the end of the bar at the chest\nSplit stance, feet hip width apart, both pointing forward\nDrop the back knee straight down towards the floor\nPush through the front foot to stand',
 'Feet in one line like a tightrope, which wrecks the balance.'),
('Leg Extensions', 'Quads',
 E'Knee joint lined up with the machine''s pivot\nPad just above the ankles\nKick up until the legs are straight, squeeze one second\nLower slowly',
 'Swinging the weight up with momentum.'),
('Pendulum Leg Press', 'Quads, glutes',
 E'Back flat against the pad, feet mid platform\nUnlock and lower until the knees are deeply bent\nKeep the hips down on the pad\nPress up without locking the knees hard',
 'Cutting the depth short to load more weight.'),
('Cossack Squats', 'Adductors, glutes, quads, hip mobility',
 E'Very wide stance, toes slightly out\nShift into one leg and sit down into it\nOther leg straight, toes pointing up\nKeep the working heel down, then switch sides',
 'Lifting the heel of the working leg.'),
('Seated Dumbbell Hip Adduction', 'Inner thighs (adductors)',
 E'Sit on the edge of the bench, dumbbell between the knees\nSqueeze the knees together against it\nHold the squeeze one second\nOpen slowly',
 'Rushing the reps with no squeeze.'),
('Standing Cable Hip Flexion', 'Hip flexors, lower abs',
 E'Ankle strap on, facing away from the stack\nStand tall and hold on for balance\nDrive the knee up to hip height\nLower slowly without leaning back',
 'Leaning the torso back to lift the knee higher.'),
('Copenhagen Plank', 'Adductors, obliques, core',
 E'Side plank with the top leg on the bench\nInside of the knee or ankle on the bench\nLift the hips into a straight line\nHold, breathing steadily',
 'Hips sagging towards the floor.'),
('Lying Leg Curls', 'Hamstrings, calves',
 E'Knees just off the edge of the pad\nHips pressed down into the bench\nCurl the heels towards the glutes\nLower slowly to almost straight',
 'Hips lifting off the pad as you curl.'),
('Standing Calf Raises', 'Calves (gastrocnemius)',
 E'Balls of the feet on the edge, knees straight\nDrop the heels into a full stretch, pause\nRise as high as you can on the toes\nHold the top one second',
 'Bouncing short reps without the stretch or the squeeze.'),
('Military Press', 'Shoulders, triceps, upper chest, core',
 E'Bar on the front of the shoulders, grip just outside them\nSqueeze glutes and brace the core\nPress straight up, moving the head back out of the way\nFinish with the bar over the middle of the head',
 'Leaning back hard and turning it into an incline press.'),
('Curls', 'Biceps, forearms',
 E'Elbows pinned to the sides\nCurl up without the elbows drifting forward\nSqueeze at the top\nLower all the way to straight arms',
 'Swinging the body to throw the weight up.'),
('Shrugs', 'Upper traps',
 E'Stand tall, weight hanging at the sides or in front\nLift the shoulders straight up towards the ears\nHold the top one second\nLower to a full stretch',
 'Rolling the shoulders in circles.'),
('Lateral Flyes', 'Side delts',
 E'Slight bend in the elbows, slight lean forward\nRaise the arms out to the sides\nLead with the elbows, stop at shoulder height\nLower slowly',
 'Using momentum and shrugging the weight up with the traps.'),
('Front Raises', 'Front delts',
 E'Stand tall, weights in front of the thighs\nRaise straight ahead to shoulder height\nKeep the arms nearly straight\nLower under control',
 'Leaning back to swing the weight up.'),
('Weighted Pull-ups', 'Lats, biceps, mid back',
 E'Start from a full dead hang\nPull the chest towards the bar, elbows down and back\nChin clears the bar\nLower all the way to straight arms',
 'Half reps that never reach a full hang.'),
('Lateral Raises', 'Side delts',
 E'Slight bend in the elbows\nRaise the arms out to the sides to shoulder height\nThink "push the weights out", not up\nLower slowly',
 'Going too heavy and shrugging every rep.'),
('Wide Cable Lat Pulldowns', 'Lats, biceps, mid back',
 E'Grip wider than the shoulders, thighs under the pad\nLean back slightly, chest up\nPull the bar to the upper chest, elbows down\nLet it rise until the arms are straight',
 'Pulling the bar behind the neck or leaning far back.'),
('Rear Delt Flyes', 'Rear delts, upper back',
 E'Hinge forward or lie chest down on an incline bench\nArms hanging, slight elbow bend\nOpen the arms out wide, little fingers up\nPause, then lower slowly',
 'Squeezing the shoulder blades and turning it into a row.'),
('Pullovers', 'Lats, chest, triceps',
 E'Lie across or along a bench holding one dumbbell over the chest\nSlight bend in the elbows, kept fixed\nLower the weight back behind the head to a deep stretch\nPull it back over the chest',
 'Bending the elbows more each rep, which turns it into a tricep extension.'),
('Face Pulls', 'Rear delts, upper back, rotator cuff',
 E'Rope at upper chest to face height\nPull towards the forehead, splitting the rope apart\nFinish with the hands beside the ears, thumbs back\nReturn slowly',
 'Pulling too heavy so the torso leans back.'),
('Romanian Deadlifts', 'Hamstrings, glutes, lower back',
 E'Bar close to the legs, knees soft\nPush the hips back, keep the back flat\nLower until you feel a deep hamstring stretch, about mid shin\nDrive the hips forward to stand',
 'Rounding the back to reach lower.'),
('Reverse Lunges', 'Quads, glutes',
 E'Stand tall, step one foot back\nDrop the back knee towards the floor\nFront shin stays nearly upright\nPush through the front heel to return',
 'Short steps that push the front knee far past the toes.'),
('Hip Thrusts', 'Glutes, hamstrings',
 E'Upper back on the bench edge, bar over the hips with a pad\nFeet flat, shins vertical at the top\nDrive the hips up until the body is flat from knees to shoulders\nTuck the chin, squeeze the glutes one second',
 'Arching the lower back instead of finishing with the glutes.'),
('Leg Curls', 'Hamstrings',
 E'Line the knee up with the machine''s pivot\nCurl the heel towards the glutes\nSqueeze one second\nLower slowly to almost straight',
 'Letting the hips lift or twist to finish the rep.'),
('Step Ups', 'Quads, glutes',
 E'Whole foot on the box\nLean slightly forward and drive through that heel\nStand fully on top\nStep down slowly with the same leg in control',
 'Pushing off the bottom foot to bounce up.'),
('Hip Abductions', 'Outer glutes (glute medius)',
 E'Sit tall in the machine or lie on your side\nPush the knees out against the pads\nHold the open position one second\nReturn slowly',
 'Letting the weight slam back between reps.'),
('Nordic Curls', 'Hamstrings',
 E'Kneel with the ankles locked under a pad or held by a partner\nBody straight from knees to head\nLower forward as slowly as you can\nCatch with the hands and push back up',
 'Bending at the hips so the hamstrings stop working.'),
('Seated Calf Raises', 'Calves (soleus)',
 E'Pad on the lower thighs, balls of the feet on the edge\nDrop the heels into a deep stretch\nRise all the way up\nHold the top one second',
 'Bouncing out of the bottom.'),
('Back Extensions', 'Lower back, glutes, hamstrings',
 E'Hips just in front of the pad\nArms crossed or hands behind the head\nLower with a flat back\nRise until the body is straight, no further',
 'Swinging up and arching hard past straight.'),
('Push-ups', 'Chest, triceps, front delts, core',
 E'Hands just outside the shoulders\nBody in one straight line, glutes tight\nLower until the chest nearly touches the floor\nPush the floor away',
 'Hips sagging or piking up.'),
('Dips', 'Chest, triceps, front delts',
 E'Start at the top, arms straight, shoulders down\nLean forward slightly for chest, stay upright for triceps\nLower until the upper arms are about parallel to the floor\nPress back up',
 'Dropping too deep with shrugged shoulders, which strains the front of the shoulder.'),
('Overhead Tricep Extensions', 'Triceps (long head)',
 E'Hold one dumbbell or a rope overhead\nElbows pointing forward, close to the head\nLower behind the head to a deep stretch\nStraighten the arms without the elbows flaring',
 'Elbows drifting wide apart.'),
('Spider Curls', 'Biceps',
 E'Chest down on an incline bench, arms hanging straight\nCurl up without moving the upper arms\nSqueeze hard at the top\nLower all the way down',
 'Swinging the elbows forward to cheat the weight up.'),
('Cable Tricep Kickbacks', 'Triceps',
 E'Hinge forward, upper arm tight to the side and parallel to the floor\nStraighten the arm back fully\nSqueeze one second\nReturn until the forearm hangs',
 'Swinging the upper arm instead of keeping it still.'),
('Incline Bench Curls', 'Biceps (long head)',
 E'Lie back on a bench at about 45 degrees\nArms hanging straight down behind the body\nCurl up keeping the elbows back\nLower to a full stretch',
 'Lifting the shoulders off the bench to help.'),
('Deep Squat Hold', 'Hips, ankles, lower back mobility',
 E'Feet shoulder width, toes slightly out\nSink as low as you can, heels down\nElbows push the knees out, chest up\nBreathe slowly and relax into it',
 'Forcing depth with the heels lifted.'),
('Dead Hang', 'Grip, shoulders, spine decompression',
 E'Grip the bar shoulder width\nLet the body hang fully, feet off the floor\nKeep a slight tension in the shoulders\nBreathe and hold for the time set',
 'Kicking and swinging instead of hanging still.'),
('Cable Crunches', 'Abs',
 E'Kneel facing the stack, rope beside the head\nHips stay still\nCurl the ribs down towards the hips\nReturn slowly to a stretch',
 'Sitting back on the heels so the hips do the work.'),
('Cable Side Bends', 'Obliques',
 E'Stand side on to the cable, handle in the far hand\nBend sideways away from the stack\nOnly bend at the waist, no twisting\nReturn under control',
 'Leaning forward or twisting the torso.'),
('Box Breathing', 'Recovery, calm, breath control',
 E'Sit or lie comfortably\nBreathe in through the nose for 4 counts\nHold for 4, out for 4, hold for 4\nRepeat for the time set',
 'Straining on the holds. Keep it relaxed.'),
('Zercher Squats', 'Quads, glutes, upper back, core',
 E'Bar in the crooks of the elbows, hands together\nChest up, brace hard\nSquat down between the knees\nDrive up keeping the elbows high',
 'Letting the elbows drop and the back round.')
on conflict ((lower(trim(name)))) do nothing;
