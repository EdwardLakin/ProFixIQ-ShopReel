-- Seed default ShopReel content templates for every existing shop
-- Safe to run multiple times

insert into public.content_templates (
  shop_id,
  key,
  name,
  description,
  default_hook,
  default_cta,
  script_guidance,
  visual_guidance,
  is_system,
  is_active
)
select
  s.id,
  t.key,
  t.name,
  t.description,
  t.default_hook,
  t.default_cta,
  t.script_guidance,
  t.visual_guidance,
  true,
  true
from public.shops s
cross join (
  values
    (
      'workflow_demo',
      'Workflow Demo',
      'Show the smooth workflow, speed, transparency, and automation of the shop.',
      'See how this job moved through the shop without the usual chaos.',
      'Want your shop running smoother? Follow for more.',
      'Focus on process clarity, speed, checkpoints, and how the team moves the vehicle through inspection, approval, repair, and delivery.',
      'Use real shop footage, status moments, inspection screens, parts flow, and clean transitions.'
    ),
    (
      'repair_story',
      'Repair Story',
      'Tell the story of a problem found, explained, approved, and fixed.',
      'This vehicle came in with a problem that could have turned into something much worse.',
      'Need repairs done right the first time? Reach out today.',
      'Structure as problem, findings, recommendation, repair, result. Keep it easy for customers to understand.',
      'Show concern item, technician findings, before/after condition, and final repaired state.'
    ),
    (
      'inspection_highlight',
      'Inspection Highlight',
      'Highlight one inspection finding and explain why it matters.',
      'This is exactly why inspections matter.',
      'Book your next inspection before small issues become expensive ones.',
      'Focus on one concrete failed or recommended item, why it matters, and the benefit of catching it early.',
      'Use inspection images, close-ups, measurement visuals, and on-screen labels.'
    ),
    (
      'before_after',
      'Before / After',
      'Simple transformation content that compares the problem state to the repaired state.',
      'Before and after tells the whole story.',
      'Follow for more real repair transformations.',
      'Keep copy tight and visual-first. Explain what changed and why it matters.',
      'Use split views, quick cuts, freeze frames, and strong end-state visuals.'
    ),
    (
      'educational_tip',
      'Educational Tip',
      'Teach one practical maintenance or repair lesson customers should know.',
      'Most drivers do not realize this until it is too late.',
      'Save this tip and share it with someone who needs it.',
      'Make it simple, useful, and trustworthy. One lesson per video.',
      'Use clean visuals, simple overlays, and a calm expert tone.'
    ),
    (
      'how_to',
      'How To',
      'Show how the shop performs or explains a process in a customer-friendly way.',
      'Here is how we handle this the right way.',
      'Want to see more shop processes explained clearly? Follow along.',
      'Walk through the steps simply. Show professionalism and consistency.',
      'Use step-by-step visuals, labels, and clean pacing.'
    ),
    (
      'findings_on_vehicle',
      'Findings on Vehicle',
      'Summarize what was found on a customer vehicle today in a clear and helpful way.',
      'Here is what we found on this vehicle today.',
      'Think your vehicle might have similar issues? Let us take a look.',
      'Explain findings simply, avoid fear tactics, and connect findings to safety, reliability, or cost avoidance.',
      'Use real vehicle footage, problem close-ups, and inspection or estimate screenshots when available.'
    )
) as t(
  key,
  name,
  description,
  default_hook,
  default_cta,
  script_guidance,
  visual_guidance
)
on conflict (shop_id, key) do update
set
  name = excluded.name,
  description = excluded.description,
  default_hook = excluded.default_hook,
  default_cta = excluded.default_cta,
  script_guidance = excluded.script_guidance,
  visual_guidance = excluded.visual_guidance,
  is_system = true,
  is_active = true,
  updated_at = now();