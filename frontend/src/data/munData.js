// ---------------------------------------------------------------------------
// Static data for the session console.
//
// Everything here is plain data with no React and no side effects, so the
// console can always be rebuilt to a known-good state (new session, reset,
// "restore default roster") without touching the engine.
//
// Flags come from flagcdn.com by ISO 3166-1 alpha-2 code. If the network is
// unavailable the <Flag /> component falls back to the Unicode emoji flag,
// which is built from the same two-letter code.
// ---------------------------------------------------------------------------

import { HCC_ROSTER } from './hccRoster';

export const FLAG_CDN = 'https://flagcdn.com';

// flagcdn only serves a fixed set of widths (20/40/80/160/320), so callers
// pass one of those and we build the 2x descriptor from the next size up.
export const flagUrl = (code, width = 40) =>
  code ? `${FLAG_CDN}/w${width}/${String(code).toLowerCase()}.png` : '';

export const flagSrcSet = (code, width = 40) =>
  code ? `${FLAG_CDN}/w${width * 2}/${String(code).toLowerCase()}.png 2x` : '';

// 'GE' -> 🇬🇪. Regional indicator symbols start at U+1F1E6, which is
// 0x1F1E6 - 'A'.charCodeAt(0) = 127397 above the ASCII letter.
export const flagEmoji = (code) => {
  if (!code || String(code).length !== 2) return '🏳️';
  return String(code)
    .toUpperCase()
    .replace(/[A-Z]/g, (ch) => String.fromCodePoint(127397 + ch.charCodeAt(0)));
};

// ---------------------------------------------------------------------------
// Country catalog
//
// `name` is the placard spelling, and is what the delegate search matches
// against, so a chair can type either the country name or its ISO code.
// ---------------------------------------------------------------------------

export const COUNTRIES = [
  { code: 'af', name: 'Afghanistan' },
  { code: 'al', name: 'Albania' },
  { code: 'dz', name: 'Algeria' },
  { code: 'ao', name: 'Angola' },
  { code: 'ar', name: 'Argentina' },
  { code: 'am', name: 'Armenia' },
  { code: 'au', name: 'Australia' },
  { code: 'at', name: 'Austria' },
  { code: 'az', name: 'Azerbaijan' },
  { code: 'bh', name: 'Bahrain' },
  { code: 'bd', name: 'Bangladesh' },
  { code: 'by', name: 'Belarus' },
  { code: 'be', name: 'Belgium' },
  { code: 'bo', name: 'Bolivia' },
  { code: 'ba', name: 'Bosnia and Herzegovina' },
  { code: 'br', name: 'Brazil' },
  { code: 'bg', name: 'Bulgaria' },
  { code: 'kh', name: 'Cambodia' },
  { code: 'cm', name: 'Cameroon' },
  { code: 'ca', name: 'Canada' },
  { code: 'cl', name: 'Chile' },
  { code: 'cn', name: 'China' },
  { code: 'co', name: 'Colombia' },
  { code: 'cd', name: 'DR Congo' },
  { code: 'cr', name: 'Costa Rica' },
  { code: 'hr', name: 'Croatia' },
  { code: 'cu', name: 'Cuba' },
  { code: 'cy', name: 'Cyprus' },
  { code: 'cz', name: 'Czechia' },
  { code: 'dk', name: 'Denmark' },
  { code: 'do', name: 'Dominican Republic' },
  { code: 'ec', name: 'Ecuador' },
  { code: 'eg', name: 'Egypt' },
  { code: 'sv', name: 'El Salvador' },
  { code: 'ee', name: 'Estonia' },
  { code: 'et', name: 'Ethiopia' },
  { code: 'fi', name: 'Finland' },
  { code: 'fr', name: 'France' },
  { code: 'ga', name: 'Gabon' },
  { code: 'ge', name: 'Georgia' },
  { code: 'de', name: 'Germany' },
  { code: 'gh', name: 'Ghana' },
  { code: 'gr', name: 'Greece' },
  { code: 'gt', name: 'Guatemala' },
  { code: 'gy', name: 'Guyana' },
  { code: 'hu', name: 'Hungary' },
  { code: 'is', name: 'Iceland' },
  { code: 'in', name: 'India' },
  { code: 'id', name: 'Indonesia' },
  { code: 'ir', name: 'Iran' },
  { code: 'iq', name: 'Iraq' },
  { code: 'ie', name: 'Ireland' },
  { code: 'il', name: 'Israel' },
  { code: 'it', name: 'Italy' },
  { code: 'jp', name: 'Japan' },
  { code: 'jo', name: 'Jordan' },
  { code: 'kz', name: 'Kazakhstan' },
  { code: 'ke', name: 'Kenya' },
  { code: 'kw', name: 'Kuwait' },
  { code: 'lv', name: 'Latvia' },
  { code: 'lb', name: 'Lebanon' },
  { code: 'lr', name: 'Liberia' },
  { code: 'ly', name: 'Libya' },
  { code: 'lt', name: 'Lithuania' },
  { code: 'lu', name: 'Luxembourg' },
  { code: 'my', name: 'Malaysia' },
  { code: 'mt', name: 'Malta' },
  { code: 'mx', name: 'Mexico' },
  { code: 'md', name: 'Moldova' },
  { code: 'mn', name: 'Mongolia' },
  { code: 'ma', name: 'Morocco' },
  { code: 'mz', name: 'Mozambique' },
  { code: 'mm', name: 'Myanmar' },
  { code: 'np', name: 'Nepal' },
  { code: 'nl', name: 'Netherlands' },
  { code: 'nz', name: 'New Zealand' },
  { code: 'ng', name: 'Nigeria' },
  { code: 'kp', name: 'North Korea' },
  { code: 'no', name: 'Norway' },
  { code: 'pk', name: 'Pakistan' },
  { code: 'ps', name: 'Palestine' },
  { code: 'pa', name: 'Panama' },
  { code: 'py', name: 'Paraguay' },
  { code: 'pe', name: 'Peru' },
  { code: 'ph', name: 'Philippines' },
  { code: 'pl', name: 'Poland' },
  { code: 'pt', name: 'Portugal' },
  { code: 'qa', name: 'Qatar' },
  { code: 'ro', name: 'Romania' },
  { code: 'ru', name: 'Russia' },
  { code: 'rw', name: 'Rwanda' },
  { code: 'sa', name: 'Saudi Arabia' },
  { code: 'sn', name: 'Senegal' },
  { code: 'rs', name: 'Serbia' },
  { code: 'sl', name: 'Sierra Leone' },
  { code: 'sg', name: 'Singapore' },
  { code: 'sk', name: 'Slovakia' },
  { code: 'si', name: 'Slovenia' },
  { code: 'so', name: 'Somalia' },
  { code: 'za', name: 'South Africa' },
  { code: 'kr', name: 'South Korea' },
  { code: 'es', name: 'Spain' },
  { code: 'lk', name: 'Sri Lanka' },
  { code: 'sd', name: 'Sudan' },
  { code: 'se', name: 'Sweden' },
  { code: 'ch', name: 'Switzerland' },
  { code: 'sy', name: 'Syria' },
  { code: 'tz', name: 'Tanzania' },
  { code: 'th', name: 'Thailand' },
  { code: 'tn', name: 'Tunisia' },
  { code: 'tr', name: 'Türkiye' },
  { code: 'ug', name: 'Uganda' },
  { code: 'ua', name: 'Ukraine' },
  { code: 'ae', name: 'United Arab Emirates' },
  { code: 'gb', name: 'United Kingdom' },
  { code: 'us', name: 'United States' },
  { code: 'uy', name: 'Uruguay' },
  { code: 'uz', name: 'Uzbekistan' },
  { code: 've', name: 'Venezuela' },
  { code: 'vn', name: 'Vietnam' },
  { code: 'ye', name: 'Yemen' },
  { code: 'zm', name: 'Zambia' },
  { code: 'zw', name: 'Zimbabwe' },
  { code: 'un', name: 'United Nations' },
  { code: 'eu', name: 'European Union' },
];

export const COUNTRY_MAP = COUNTRIES.reduce((acc, c) => {
  acc[c.code] = c;
  return acc;
}, {});

export const findCountry = (code) => COUNTRY_MAP[String(code || '').toLowerCase()] || null;

export const searchCountries = (query, limit = 8) => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return COUNTRIES.filter(
    (c) => c.name.toLowerCase().includes(q) || c.code === q
  ).slice(0, limit);
};

// ---------------------------------------------------------------------------
// Committees
//
// `rules` is what the engine reads to decide how a vote resolves:
//   voteMode  'simple'  — majority of delegates present
//             'unsc'    — 9 affirmative of 15, and any P5 "no" is a veto
//             'none'    — the body doesn't vote (Press Corps)
//   veto      list of ISO codes holding the veto
//   crisis    unlocks crisis updates and directives (HCC)
//   press     swaps draft resolutions for articles and interviews
// ---------------------------------------------------------------------------

export const SEAT_KIND = {
  COUNTRY: 'country',
  FIGURE: 'figure',
  OUTLET: 'outlet',
};

export const COMMITTEES = [
  {
    id: 'unsc',
    abbr: 'UNSC',
    name: 'United Nations Security Council',
    short: 'Security Council',
    icon: 'bi-shield-lock',
    seatKind: SEAT_KIND.COUNTRY,
    seatLabel: 'Delegation',
    defaultTopic: 'Autonomous weapons, artificial intelligence and international security',
    defaultSpeechMs: 90_000,
    rules: {
      voteMode: 'unsc',
      veto: ['cn', 'fr', 'ru', 'gb', 'us'],
      quorumRatio: 0.6,
      crisis: false,
      press: false,
    },
    // 2026 composition: five permanent members plus the ten elected seats.
    // Editable from the roster panel if your dais runs a different council.
    roster: [
      'cn', 'fr', 'ru', 'gb', 'us',
      'dk', 'gr', 'pk', 'pa', 'so',
      'bh', 'co', 'cd', 'lv', 'lr',
    ],
  },
  {
    id: 'specpol',
    abbr: 'SPECPOL',
    name: 'Special Political and Decolonization Committee',
    short: 'Special Political',
    icon: 'bi-flag',
    seatKind: SEAT_KIND.COUNTRY,
    seatLabel: 'Delegation',
    defaultTopic: 'Non-self-governing territories and the unfinished agenda of decolonization',
    defaultSpeechMs: 60_000,
    rules: {
      voteMode: 'simple',
      veto: [],
      quorumRatio: 0.25,
      crisis: false,
      press: false,
    },
    roster: [
      'ar', 'au', 'br', 'ca', 'cl', 'cn', 'cu', 'eg', 'fr', 'de',
      'in', 'id', 'ir', 'il', 'jp', 'ke', 'ma', 'mx', 'ng', 'pk',
      'ps', 'pl', 'ru', 'za', 'es', 'tr', 'ua', 'ae', 'gb', 'us',
    ],
  },
  {
    id: 'unhrc',
    abbr: 'UNHRC',
    name: 'United Nations Human Rights Council',
    short: 'Human Rights',
    icon: 'bi-people',
    seatKind: SEAT_KIND.COUNTRY,
    seatLabel: 'Delegation',
    defaultTopic: 'The rights of people displaced by the climate crisis',
    defaultSpeechMs: 60_000,
    rules: {
      voteMode: 'simple',
      veto: [],
      quorumRatio: 0.25,
      crisis: false,
      press: false,
    },
    roster: [
      'af', 'bd', 'be', 'bo', 'br', 'cm', 'cl', 'cn', 'cu', 'cz',
      'fi', 'fr', 'ge', 'de', 'gh', 'in', 'id', 'kz', 'ke', 'mx',
      'ma', 'np', 'ng', 'qa', 'ro', 'sn', 'za', 'kr', 'sd', 'ch',
    ],
  },
  {
    id: 'hcc',
    abbr: 'HCC',
    name: 'Historical Crisis Committee',
    short: 'Crisis Committee',
    icon: 'bi-hourglass-split',
    seatKind: SEAT_KIND.FIGURE,
    seatLabel: 'Portfolio',
    defaultTopic: 'Rose Revolution',
    defaultSpeechMs: 45_000,
    rules: {
      voteMode: 'simple',
      veto: [],
      quorumRatio: 0.5,
      crisis: true,
      press: false,
    },
    // The Rose Revolution cabinet (November 2003) lives in hccRoster.js, next
    // to the portrait slugs it points at. Each seat shows its portrait and
    // falls back to the flag if the image is missing.
    roster: HCC_ROSTER,
  },
  {
    id: 'disec',
    abbr: 'DISEC',
    name: 'Disarmament and International Security Committee',
    short: 'Disarmament',
    icon: 'bi-radioactive',
    seatKind: SEAT_KIND.COUNTRY,
    seatLabel: 'Delegation',
    defaultTopic: 'Preventing an arms race in outer space',
    defaultSpeechMs: 60_000,
    rules: {
      voteMode: 'simple',
      veto: [],
      quorumRatio: 0.25,
      crisis: false,
      press: false,
    },
    roster: [
      'ar', 'at', 'au', 'br', 'ca', 'cn', 'eg', 'fr', 'de', 'in',
      'id', 'ir', 'il', 'it', 'jp', 'kz', 'kp', 'mx', 'nl', 'ng',
      'no', 'pk', 'pl', 'ru', 'sa', 'kr', 'se', 'tr', 'gb', 'us',
    ],
  },
  {
    id: 'press',
    abbr: 'PRESS CORPS',
    name: 'Press Corps',
    short: 'Press Corps',
    icon: 'bi-camera-reels',
    seatKind: SEAT_KIND.OUTLET,
    seatLabel: 'Outlet',
    defaultTopic: 'GAMUN 2026 — Conference coverage',
    defaultSpeechMs: 45_000,
    rules: {
      voteMode: 'none',
      veto: [],
      quorumRatio: 0.25,
      crisis: false,
      press: true,
    },
    roster: [
      { code: 'gb', name: 'BBC News', role: 'London' },
      { code: 'us', name: 'CNN', role: 'Atlanta' },
      { code: 'us', name: 'The New York Times', role: 'New York' },
      { code: 'gb', name: 'Reuters', role: 'Wire service' },
      { code: 'qa', name: 'Al Jazeera', role: 'Doha' },
      { code: 'fr', name: 'Le Monde', role: 'Paris' },
      { code: 'fr', name: 'Agence France-Presse', role: 'Wire service' },
      { code: 'de', name: 'Der Spiegel', role: 'Hamburg' },
      { code: 'cn', name: 'Xinhua', role: 'Beijing' },
      { code: 'ru', name: 'TASS', role: 'Moscow' },
      { code: 'jp', name: 'NHK', role: 'Tokyo' },
      { code: 'in', name: 'The Hindu', role: 'Chennai' },
      { code: 'za', name: 'Mail & Guardian', role: 'Johannesburg' },
      { code: 'ge', name: 'Georgian First Channel', role: 'Tbilisi' },
    ],
  },
];

export const COMMITTEE_MAP = COMMITTEES.reduce((acc, c) => {
  acc[c.id] = c;
  return acc;
}, {});

export const getCommittee = (id) => COMMITTEE_MAP[id] || COMMITTEES[0];

// The server caps a committee's topic at 300 characters (topic in
// models/schemas/sessionFields.js). The topic inputs enforce it up front,
// because a save the server rejects is retried indefinitely and nothing
// else gets saved in the meantime.
export const TOPIC_MAX_LENGTH = 300;

// ---------------------------------------------------------------------------
// Motions
//
// `precedence` is the order of disruption: when several motions are on the
// floor the chair takes the lowest number first, exactly as in the rules of
// procedure. `fields` tells the form which inputs to render.
// ---------------------------------------------------------------------------

export const MAJORITY = {
  SIMPLE: 'simple',
  TWO_THIRDS: 'twoThirds',
  CHAIR: 'chair',
};

export const MOTION_TYPES = [
  {
    id: 'adjourn',
    label: 'Adjournment of the meeting',
    short: 'Adjourn',
    en: 'Adjournment of the meeting',
    precedence: 10,
    majority: MAJORITY.SIMPLE,
    fields: [],
    icon: 'bi-door-closed',
    hint: 'Ends the committee’s work for the conference.',
  },
  {
    id: 'suspend',
    label: 'Suspension of the meeting',
    short: 'Suspend',
    en: 'Suspension of the meeting',
    precedence: 20,
    majority: MAJORITY.SIMPLE,
    fields: ['totalMs'],
    icon: 'bi-pause-circle',
    hint: 'A break. Debate resumes after the agreed time.',
  },
  {
    id: 'closure',
    label: 'Closure of debate',
    short: 'Closure of debate',
    en: 'Closure of debate',
    precedence: 30,
    majority: MAJORITY.TWO_THIRDS,
    fields: [],
    icon: 'bi-slash-circle',
    hint: 'Ends debate and moves the committee into voting.',
  },
  {
    id: 'voting',
    label: 'Move to voting procedure',
    short: 'Voting',
    en: 'Move to voting procedure',
    precedence: 35,
    majority: MAJORITY.TWO_THIRDS,
    fields: ['subject'],
    icon: 'bi-check2-square',
    hint: 'Opens a substantive vote on a draft resolution.',
  },
  {
    id: 'unmoderated',
    label: 'Unmoderated caucus',
    short: 'Unmod caucus',
    en: 'Unmoderated caucus',
    precedence: 40,
    majority: MAJORITY.SIMPLE,
    fields: ['totalMs'],
    icon: 'bi-people',
    hint: 'Open negotiation time for forming blocs.',
  },
  {
    id: 'moderated',
    label: 'Moderated caucus',
    short: 'Mod caucus',
    en: 'Moderated caucus',
    precedence: 50,
    majority: MAJORITY.SIMPLE,
    fields: ['topic', 'totalMs', 'speechMs'],
    icon: 'bi-mic',
    hint: 'Focused debate on one topic, with the chair calling speakers.',
  },
  {
    id: 'extend',
    label: 'Extension of the caucus',
    short: 'Extension',
    en: 'Extension of the caucus',
    precedence: 55,
    majority: MAJORITY.SIMPLE,
    fields: ['totalMs'],
    icon: 'bi-plus-circle',
    hint: 'Adds time to the caucus already running.',
  },
  {
    id: 'introduceDr',
    label: 'Introduce a draft resolution',
    short: 'Resolution',
    en: 'Introduce a draft resolution',
    precedence: 60,
    majority: MAJORITY.SIMPLE,
    fields: ['title'],
    icon: 'bi-file-earmark-text',
    hint: 'Gives the sponsors the floor to present the document.',
  },
  {
    id: 'introduceWp',
    label: 'Introduce a working paper',
    short: 'Working paper',
    en: 'Introduce a working paper',
    precedence: 65,
    majority: MAJORITY.SIMPLE,
    fields: ['title'],
    icon: 'bi-file-earmark',
    hint: 'A bloc’s interim document, put to the committee.',
  },
  {
    id: 'listToggle',
    label: 'Open or close the speakers list',
    short: 'Speakers list',
    en: 'Open or close the speakers list',
    precedence: 70,
    majority: MAJORITY.SIMPLE,
    fields: [],
    icon: 'bi-list-ol',
    hint: 'While closed, no new speakers can be added.',
  },
  {
    id: 'agenda',
    label: 'Set the agenda',
    short: 'Agenda',
    en: 'Set the agenda',
    precedence: 75,
    majority: MAJORITY.SIMPLE,
    fields: ['topic'],
    icon: 'bi-journal-text',
    hint: 'Chooses which topic the committee takes first.',
  },
  {
    id: 'reply',
    label: 'Right of reply',
    short: 'Reply',
    en: 'Right of reply',
    precedence: 90,
    majority: MAJORITY.CHAIR,
    fields: [],
    icon: 'bi-reply',
    hint: 'Granted at the chair’s discretion — never voted on.',
  },
];

export const MOTION_MAP = MOTION_TYPES.reduce((acc, m) => {
  acc[m.id] = m;
  return acc;
}, {});

export const getMotionType = (id) => MOTION_MAP[id] || null;

// ---------------------------------------------------------------------------
// Points — never voted on, just logged so the minutes show who raised what.
// ---------------------------------------------------------------------------

export const POINT_TYPES = [
  {
    id: 'order',
    label: 'Point of order',
    en: 'Point of order',
    icon: 'bi-exclamation-octagon',
  },
  {
    id: 'privilege',
    label: 'Point of personal privilege',
    en: 'Point of personal privilege',
    icon: 'bi-hand-index',
  },
  {
    id: 'inquiry',
    label: 'Point of parliamentary inquiry',
    en: 'Point of parliamentary inquiry',
    icon: 'bi-question-circle',
  },
  {
    id: 'followup',
    label: 'Follow-up question',
    en: 'Follow-up question',
    icon: 'bi-arrow-return-right',
  },
];

export const POINT_MAP = POINT_TYPES.reduce((acc, p) => {
  acc[p.id] = p;
  return acc;
}, {});

// ---------------------------------------------------------------------------
// Documents on the floor. Press Corps trades resolutions for articles, HCC
// adds directives — the console shows only the types a committee can produce.
// ---------------------------------------------------------------------------

export const DOC_TYPES = [
  {
    id: 'wp',
    label: 'Working paper',
    short: 'WP',
    icon: 'bi-file-earmark',
    committees: ['unsc', 'specpol', 'unhrc', 'hcc', 'disec'],
  },
  {
    id: 'dr',
    label: 'Draft resolution',
    short: 'DR',
    icon: 'bi-file-earmark-text',
    committees: ['unsc', 'specpol', 'unhrc', 'hcc', 'disec'],
  },
  {
    id: 'amendment',
    label: 'Amendment',
    short: 'AM',
    icon: 'bi-pencil-square',
    committees: ['unsc', 'specpol', 'unhrc', 'hcc', 'disec'],
  },
  {
    id: 'directive',
    label: 'Directive',
    short: 'DIR',
    icon: 'bi-lightning-charge',
    committees: ['hcc'],
  },
  {
    id: 'article',
    label: 'Article',
    short: 'ART',
    icon: 'bi-newspaper',
    committees: ['press'],
  },
  {
    id: 'interview',
    label: 'Interview',
    short: 'INT',
    icon: 'bi-mic-fill',
    committees: ['press'],
  },
];

export const DOC_MAP = DOC_TYPES.reduce((acc, d) => {
  acc[d.id] = d;
  return acc;
}, {});

export const docTypesFor = (committeeId) =>
  DOC_TYPES.filter((d) => d.committees.includes(committeeId));

export const DOC_STATUS = [
  { id: 'draft', label: 'Drafting' },
  { id: 'introduced', label: 'Introduced' },
  { id: 'passed', label: 'Passed' },
  { id: 'failed', label: 'Failed' },
];

export const DOC_STATUS_MAP = DOC_STATUS.reduce((acc, s) => {
  acc[s.id] = s;
  return acc;
}, {});

// Preset speaking and caucus lengths, so the dais never types a number
// mid-session. Values in milliseconds.
export const SPEECH_PRESETS = [30_000, 45_000, 60_000, 90_000, 120_000];
export const CAUCUS_PRESETS = [300_000, 480_000, 600_000, 900_000, 1_200_000];