import type { Service } from './types';

export interface Condition {
  slug: string;
  label: string;
  type: string; // broader treatment grouping, stored on the booking
  service: Service;
  blurb: string;
}

export const PRICE: Record<Service, number> = {
  physiotherapy: 1299,
  training: 1099,
};

export const SERVICE_META: Record<
  Service,
  { path: string; title: string; tagline: string; gate: string; hub: string }
> = {
  physiotherapy: {
    path: 'physiotherapy',
    title: 'Physiotherapy',
    tagline: 'Recover from pain and injury with a physio at your door.',
    gate: 'Explore the pain areas we treat.',
    hub: 'Select card according to your needs.',
  },
  training: {
    path: 'physical-training',
    title: 'Physical Training',
    tagline: 'Move better and get stronger with a trainer in your space.',
    gate: 'Explore how a trainer can help, in your own space.',
    hub: 'Select card according to your needs.',
  },
};

const P = (slug: string, label: string, type: string, blurb: string): Condition => ({
  slug,
  label,
  type,
  service: 'physiotherapy',
  blurb,
});
const T = (slug: string, label: string, type: string, blurb: string): Condition => ({
  slug,
  label,
  type,
  service: 'training',
  blurb,
});

export const CONDITIONS: Condition[] = [
  // physiotherapy
  P('back-pain', 'Back pain, sudden or recurring', 'Orthopaedic', 'A physio finds the driver of your back pain and gives you a plan you can hold.'),
  P('sciatica-flare', 'Sciatica flare', 'Spine', 'Ease the nerve pain shooting down your leg with targeted, hands-on care.'),
  P('neck-desk', 'Neck pain from desk work', 'Orthopaedic', 'Undo the strain of long hours at a screen.'),
  P('upper-back', 'Upper back pain', 'Orthopaedic', 'Release the tension between your shoulder blades.'),
  P('shoulder-pain', 'Shoulder pain', 'Orthopaedic', 'Get your shoulder moving freely again.'),
  P('elbow', 'Tennis or golfer’s elbow', 'Orthopaedic', 'Calm the tendon and rebuild grip strength.'),
  P('wrist-typing', 'Wrist and hand strain from typing', 'Orthopaedic', 'Relief for hands that spend all day at a keyboard.'),
  P('knee-pain', 'Knee pain', 'Orthopaedic', 'Find why your knee hurts and how to load it safely.'),
  P('plantar', 'Plantar fasciitis heel pain', 'Orthopaedic', 'Take the sting out of that first step in the morning.'),
  P('ankle-sprain', 'Ankle sprain, healed stage', 'Rehab', 'Rebuild stability so it does not roll again.'),
  P('spasm', 'Muscle spasm or stiffness', 'Orthopaedic', 'Loosen a locked-up muscle and keep it that way.'),
  P('posture-headache', 'Posture-related headache', 'Orthopaedic', 'Trace headaches back to your neck and posture.'),
  P('sports-injury', 'Minor sports injury', 'Sports', 'Get back to your sport without rushing the tissue.'),
  P('wfh-aches', 'Work-from-home aches', 'Orthopaedic', 'Small aches from a home setup that was never designed for it.'),
  P('post-surgery', 'Post-surgery rehab', 'Post-op', 'Structured recovery, guided in your own home.'),
  P('frozen-shoulder', 'Frozen shoulder', 'Orthopaedic', 'Restore range in a stiff, painful shoulder, step by step.'),
  P('arthritis', 'Arthritis', 'Chronic', 'Manage joint pain and keep moving with confidence.'),
  P('spondylitis', 'Spondylitis', 'Spine', 'Care for an inflamed, stiff spine.'),
  P('disc-pain', 'Disc-related pain', 'Spine', 'A calm, careful plan for disc-driven pain.'),
  P('long-sciatica', 'Long-standing sciatica', 'Spine', 'For nerve pain that has outstayed its welcome.'),
  P('postnatal', 'Postnatal recovery', 'Women’s health', 'Rebuild your core and strength after birth.'),
  // training
  T('form-check', 'Form check on my lifts', 'Form & Technique', 'A trainer watches your lifts and fixes what the mirror can’t show you.'),
  T('mobility-screen', 'Movement and mobility screen', 'Assessment', 'Find the restrictions holding your movement back.'),
  T('stretch-routine', 'Stretching and mobility routine', 'Mobility', 'A routine built for your body, not a generic video.'),
  T('space-program', 'A program for my space and equipment', 'Programming', 'Training designed around the room and kit you actually have.'),
  T('equipment-setup', 'Equipment setup and safe use', 'Programming', 'Set up your home gym and learn to use it without hurting yourself.'),
  T('bodyweight', 'Bodyweight-only program', 'Programming', 'Serious training that needs nothing but the floor.'),
  T('home-gym-workout', 'Home gym workout', 'Programming', 'A guided workout using whatever your home gym already has.'),
  T('routine-review', 'Check the routine I already follow', 'Form & Technique', 'A second set of eyes on the plan you’re running.'),
  T('progression', 'When to add weight or reps', 'Programming', 'Learn to progress without guessing or plateauing.'),
  T('first-workout', 'Starting to exercise, first workout', 'Beginner', 'A calm, doable first session with someone who’s got you.'),
];

export const conditionBySlug = (slug: string) => CONDITIONS.find((c) => c.slug === slug);
export const conditionsFor = (service: Service) => CONDITIONS.filter((c) => c.service === service);

// Curated hub cards, short display labels shared by the hub, condition page and booking views.
export interface ServiceCard {
  slug: string;
  label: string;
  img: string;
  note?: string;
}

export const SERVICE_CARDS: Record<Service, ServiceCard[]> = {
  physiotherapy: [
    { slug: 'back-pain', label: 'Back pain', img: '/back-pain.jpg', note: 'Most people choose this for long-sitting back pain' },
    { slug: 'neck-desk', label: 'Neck pain', img: '/back-pain.jpg', note: 'Popular for desk-work strain' },
    { slug: 'shoulder-pain', label: 'Shoulder pain', img: '/back-pain.jpg' },
    { slug: 'knee-pain', label: 'Knee pain', img: '/back-pain.jpg', note: 'Common for runners and stairs' },
    { slug: 'elbow', label: 'Elbow pain', img: '/back-pain.jpg' },
    { slug: 'wrist-typing', label: 'Wrist pain', img: '/back-pain.jpg' },
    { slug: 'ankle-sprain', label: 'Ankle pain', img: '/back-pain.jpg', note: 'Most people choose this for sports injuries' },
    { slug: 'disc-pain', label: 'Disc related pain', img: '/back-pain.jpg' },
    { slug: 'sciatica-flare', label: 'Sciatica pain', img: '/back-pain.jpg' },
    { slug: 'sports-injury', label: 'Sports injury', img: '/back-pain.jpg' },
  ],
  training: [
    { slug: 'form-check', label: 'Form check', img: '/back-pain.jpg', note: 'Most people choose this to fix their lifts' },
    { slug: 'mobility-screen', label: 'Mobility exercise', img: '/back-pain.jpg' },
    { slug: 'stretch-routine', label: 'Stretching exercise', img: '/back-pain.jpg' },
    { slug: 'space-program', label: 'Home gym exercise planning', img: '/back-pain.jpg' },
    { slug: 'bodyweight', label: 'Bodyweight exercise', img: '/back-pain.jpg' },
    { slug: 'home-gym-workout', label: 'Home gym workout', img: '/back-pain.jpg' },
    { slug: 'progression', label: 'Weight and reps', img: '/back-pain.jpg' },
  ],
};

export const cardBySlug = (slug: string) =>
  SERVICE_CARDS.physiotherapy.concat(SERVICE_CARDS.training).find((c) => c.slug === slug);

// Lifestyle-led symptoms, written for a younger, desk-and-screen generation.
export const SYMPTOMS: Record<string, string[]> = {
  'back-pain': [
    'A dull lower-back ache that builds after long hours at a desk or laptop',
    'Stiffness first thing in the morning that eases once you move',
    'Worse after slouching on the couch or scrolling in bed',
    'Tightness that flares on long drives or flights',
  ],
  'neck-desk': [
    'Tightness from looking down at your phone all day, so-called tech neck',
    'Stiffness and a heavy head after back-to-back video calls',
    'Headaches that start at the base of the skull',
    'A stubborn knot between the neck and shoulder',
  ],
  'shoulder-pain': [
    'Ache from hunching over a keyboard for hours',
    'Pain when reaching overhead or fastening a seatbelt',
    'Stiffness after sleeping on one side',
    'Clicking or catching when you rotate the arm',
  ],
  'knee-pain': [
    'Soreness after a run, leg day or a weekend hike',
    'Pain going up or down stairs',
    'Stiffness after sitting cross-legged or at a desk too long',
    'A twinge when squatting or standing up from a low chair',
  ],
  elbow: [
    'Soreness from gripping a mouse or phone all day',
    'Pain on the outer elbow when lifting or typing',
    'A weak grip when carrying bags or a laptop',
    'Tenderness the day after gym or a racquet sport',
  ],
  'wrist-typing': [
    'Ache from long typing, gaming or scrolling sessions',
    'Tingling in the fingers after extended screen time',
    'Weakness when opening jars or turning door handles',
    'Soreness at the base of the thumb',
  ],
  'ankle-sprain': [
    'Instability after a twist from sport or a missed step',
    'Swelling that returns after you are active',
    'A feeling that the ankle might give way',
    'Stiffness the morning after a game',
  ],
  plantar: [
    'Sharp heel pain on your first steps in the morning',
    'Ache after long standing, walking or a day in flat shoes',
    'Worse barefoot on hard floors at home',
    'Tightness through the arch and calf',
  ],
  'disc-pain': [
    'Lower-back pain that worsens when you bend or sit for long',
    'Pain that shoots into the hip or down a leg',
    'Stiffness after long drives or desk hours',
    'Relief when you stand up and walk around',
  ],
  'sciatica-flare': [
    'Shooting pain from the lower back down one leg',
    'Tingling or numbness in the leg or foot',
    'Worse after sitting for long stretches',
    'A sharp catch when you stand up',
  ],
  'sports-injury': [
    'A tweak or strain from play that will not settle on its own',
    'Swelling or bruising after the game',
    'Pain that flares the moment you return to sport',
    'Reduced power or range in the joint',
  ],
};

// Benefits shown on each training exercise page.
export const BENEFITS: Record<string, string[]> = {
  'form-check': [
    'Lift safely with your technique checked rep by rep',
    'Get more from every set by fixing wasted effort',
    'Protect your back, knees and shoulders under load',
    'Break through plateaus caused by poor form',
  ],
  'mobility-screen': [
    'Unlock stiff joints so squats, stairs and reaching feel easy',
    'Find and fix the restrictions holding your movement back',
    'Lower your injury risk by moving through a fuller range',
    'Better posture and control in everyday movement',
  ],
  'stretch-routine': [
    'Loosen tight hips, hamstrings and shoulders from long sitting',
    'Move more freely with less day-to-day stiffness',
    'Ease everyday aches before they turn into injuries',
    'Wind down and de-stress with a routine built for your body',
  ],
  'space-program': [
    'A plan built around the space and kit you actually have',
    'No guesswork, you know exactly what to do each session',
    'Progress that fits your goals and your schedule',
    'Make the most of even a small home setup',
  ],
  'bodyweight': [
    'Get strong with zero equipment, anywhere at home',
    'Build control, balance and real core strength',
    'Joint-friendly training you can do most days',
    'Scales from beginner to genuinely challenging',
  ],
  'home-gym-workout': [
    'A guided, full workout using whatever you own',
    'Push intensity safely with a trainer watching',
    'Structure and accountability in your own space',
    'Efficient sessions that fit a busy day',
  ],
  progression: [
    'Know exactly when to add weight or reps',
    'Keep progressing without plateauing or overtraining',
    'Train to a clear, measurable plan',
    'Avoid the injuries that come from loading too fast',
  ],
};

export const SERVED_PINCODES = [
  '560001', '560002', '560008', '560011', '560025', '560034', '560038',
  '560043', '560068', '560076', '560095', '560102', '560103', '560066',
];

export const EXERCISE_LIBRARY = [
  'Cat–cow', 'Bird dog', 'Glute bridge', 'Dead bug', 'Wall slides', 'Prone press-up',
  'Nerve glide (sciatic)', 'Hamstring stretch', 'Piriformis stretch', 'Clamshell',
  'Side-lying leg raise', 'Standing calf raise', 'Towel scrunch', 'Chin tuck',
  'Scapular retraction', 'Pendulum swing', 'Shoulder external rotation', 'Wrist flexor stretch',
  'Terminal knee extension', 'Step-up', 'Single-leg balance', 'Thoracic rotation',
];

export const EQUIPMENT_LIBRARY = [
  'Resistance band, light', 'Resistance band, medium', 'Resistance band, heavy',
  'Foam roller', 'Yoga mat', 'Massage ball', 'Ankle weights', 'Dumbbell 2kg',
  'Dumbbell 5kg', 'Kettlebell 8kg', 'Swiss ball', 'TheraBand loop', 'Balance pad',
  'Wobble board', 'Chair', 'Wall', 'Towel', 'Grip trainer', 'Pulley', 'Step block',
];

export const HANDSON_LIBRARY = [
  'Soft-tissue release', 'Trigger-point therapy', 'Myofascial release', 'Joint mobilisation',
  'Muscle energy technique', 'PNF stretching', 'Manual traction', 'Neural mobilisation',
  'IASTM', 'Deep-tissue massage', 'Cupping', 'Taping', 'Dry needling', 'Positional release',
  'Cross-friction massage', 'Lymphatic drainage', 'Post-isometric relaxation', 'Passive ROM',
  'Kinesio taping', 'Manual stretching',
];
