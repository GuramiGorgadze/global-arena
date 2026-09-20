import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  COUNTRY_MAP,
  DOC_MAP,
  MOTION_MAP,
  MAJORITY,
  POINT_MAP,
  getCommittee,
} from '../data/munData';

// ---------------------------------------------------------------------------
// The session engine. One reducer holds everything the dais touches during a
// committee session: the roster, the speakers list, the clock, motions,
// votes, documents and the running minutes.
//
// Three rules keep it honest:
//   1. There is exactly ONE timer. `speech` is "the clock on the stage",
//      whatever it happens to be timing. A moderated caucus does not get its
//      own clock — its block is the sum of the speeches inside it, which is
//      what a moderated caucus actually is. An unmoderated caucus has no
//      speeches, so the stage clock simply times the whole block.
//   2. Timers are stored as {durationMs, elapsedMs, running, startedAt} and
//      the remaining time is always derived from Date.now(). Nothing counts
//      down in state, so a dropped frame or a backgrounded tab can't drift.
//   3. Every action that changes the floor writes a log entry. The minutes
//      export is just the log, so if it isn't logged it didn't happen.
// ---------------------------------------------------------------------------

export const SESSION_VERSION = 2;

export const ATTENDANCE = {
  PRESENT: 'present',
  VOTING: 'voting',
  ABSENT: 'absent',
};

export const ATTENDANCE_LABELS = {
  [ATTENDANCE.PRESENT]: 'Present',
  [ATTENDANCE.VOTING]: 'Present and voting',
  [ATTENDANCE.ABSENT]: 'Absent',
};

export const ATTENDANCE_SHORT = {
  [ATTENDANCE.PRESENT]: 'P',
  [ATTENDANCE.VOTING]: 'P&V',
  [ATTENDANCE.ABSENT]: 'A',
};

export const BALLOT_LABELS = {
  yes: 'In favour',
  no: 'Against',
  abstain: 'Abstain',
};

// What the floor is doing right now. Replaces the old `caucus` object and
// its separate timer: the mode decides which list is live, which clock the
// ring shows, and whether a block budget applies at all.
export const FLOOR_MODE = {
  GSL: 'gsl',
  MODERATED: 'moderated',
  UNMODERATED: 'unmoderated',
};

let seq = 0;
const uid = (prefix = 'id') => `${prefix}_${Date.now().toString(36)}_${(seq++).toString(36)}`;

// --- formatting -------------------------------------------------------------

export const pad2 = (n) => String(Math.max(0, Math.floor(n))).padStart(2, '0');

// 04:30 for anything under an hour, 1:04:30 above it.
export function formatClock(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) return `${hours}:${pad2(minutes)}:${pad2(seconds)}`;
  return `${pad2(minutes)}:${pad2(seconds)}`;
}

export function formatDuration(ms) {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  if (minutes === 0) return `${seconds} sec`;
  if (seconds === 0) return `${minutes} min`;
  return `${minutes} min ${seconds} sec`;
}

export function formatTimeOfDay(iso) {
  const date = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

export function formatDate(iso) {
  const date = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('ka-GE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// --- timers -----------------------------------------------------------------

export const makeTimer = (durationMs = 0) => ({
  durationMs,
  elapsedMs: 0,
  running: false,
  startedAt: null,
});

export const timerElapsed = (timer, now) => {
  if (!timer) return 0;
  return timer.elapsedMs + (timer.running ? Math.max(0, now - timer.startedAt) : 0);
};

export const timerRemaining = (timer, now) => {
  if (!timer) return 0;
  return Math.max(0, timer.durationMs - timerElapsed(timer, now));
};

export const timerExpired = (timer, now) =>
  !!timer && timer.durationMs > 0 && timerRemaining(timer, now) === 0;

export const timerProgress = (timer, now) => {
  if (!timer || timer.durationMs <= 0) return 0;
  return Math.min(1, timerElapsed(timer, now) / timer.durationMs);
};

const startTimer = (timer, now) =>
  timer.running ? timer : { ...timer, running: true, startedAt: now };

const pauseTimer = (timer, now) =>
  timer.running
    ? {
        ...timer,
        running: false,
        startedAt: null,
        elapsedMs: timer.elapsedMs + Math.max(0, now - timer.startedAt),
      }
    : timer;

const resetTimer = (timer, durationMs) => ({
  durationMs: durationMs ?? timer.durationMs,
  elapsedMs: 0,
  running: false,
  startedAt: null,
});

const addTimerTime = (timer, ms) => ({
  ...timer,
  durationMs: Math.max(0, timer.durationMs + ms),
});

// --- the floor --------------------------------------------------------------

export const makeFloor = () => ({
  mode: FLOOR_MODE.GSL,
  topic: '',
  totalMs: 0, // the block the committee voted for
  consumedMs: 0, // time already burned by finished speeches inside it
  speakers: 0, // how many have spoken inside it, for the closing log line
  speechMs: 0, // per-speaker length inside this block
  proposerId: null,
});

export const makeList = (open = true) => ({ open, queue: [] });

// A moderated caucus runs off its own list so the general speakers list is
// still sitting there, untouched, when the caucus ends.
export const activeListKey = (session) =>
  session?.floor?.mode === FLOOR_MODE.MODERATED ? 'caucus' : 'gsl';

export const activeList = (session) =>
  session?.lists?.[activeListKey(session)] || makeList();

// Inside a moderated caucus the per-speaker length governs the floor;
// everywhere else the committee's default applies.
export const activeSpeechMs = (session) => {
  if (!session) return 0;
  if (session.floor?.mode === FLOOR_MODE.MODERATED) {
    return session.floor.speechMs || session.settings.speechMs || 0;
  }
  return session.settings?.speechMs || 0;
};

// How much of the caucus block is left. Never stored — always derived, so
// the block and the speech can't drift apart the way two clocks did.
//   moderated   → budget minus finished speeches minus the live one
//   unmoderated → the stage clock IS the block
//   gsl         → there is no block
export function blockRemaining(session, now) {
  const floor = session?.floor;
  if (!floor || floor.mode === FLOOR_MODE.GSL) return 0;
  if (floor.mode === FLOOR_MODE.UNMODERATED) return timerRemaining(session.speech, now);
  const live = session.speaker ? timerElapsed(session.speech, now) : 0;
  return Math.max(0, floor.totalMs - floor.consumedMs - live);
}

export function blockProgress(session, now) {
  const floor = session?.floor;
  if (!floor || floor.mode === FLOOR_MODE.GSL || floor.totalMs <= 0) return 0;
  if (floor.mode === FLOOR_MODE.UNMODERATED) return timerProgress(session.speech, now);
  return Math.min(1, 1 - blockRemaining(session, now) / floor.totalMs);
}

// Roughly how many more speakers fit in what's left of the block. This is
// the number a chair actually wants when deciding whether to take another
// motion, and it only exists because the block and the speeches share a
// budget now.
export function speakersLeftInBlock(session, now) {
  const speechMs = activeSpeechMs(session);
  if (session?.floor?.mode !== FLOOR_MODE.MODERATED || speechMs <= 0) return 0;
  return Math.floor(blockRemaining(session, now) / speechMs);
}

// --- audio ------------------------------------------------------------------

let audioCtx = null;

// A short two-note fall when time runs out. Chairs need an audible cue they
// can hear over a room, and WebAudio avoids shipping an mp3.
export function playChime(kind = 'end') {
  if (typeof window === 'undefined') return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  try {
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const notes = kind === 'warn' ? [880] : [988, 659];
    const now = audioCtx.currentTime;

    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const at = now + i * 0.18;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, at);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.22, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.45);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(at);
      osc.stop(at + 0.5);
    });
  } catch {
    // Autoplay policy or no audio device — the visual timer still works.
  }
}

// --- roster -----------------------------------------------------------------

function seatFromEntry(entry) {
  if (typeof entry === 'string') {
    const country = COUNTRY_MAP[entry];
    return {
      id: uid('d'),
      code: entry,
      name: country ? country.name : entry.toUpperCase(),
      role: '',
      photo: '',
      status: ATTENDANCE.PRESENT,
      speeches: 0,
      speakingMs: 0,
      points: 0,
      note: '',
    };
  }
  return {
    id: uid('d'),
    code: entry.code || '',
    name: entry.name || '',
    role: entry.role || '',
    // Crisis cabinets seat people, not countries, so a portrait carries far
    // more than a flag would. Empty for country committees, which fall back
    // to the flag on their own.
    photo: entry.photo || '',
    status: ATTENDANCE.PRESENT,
    speeches: 0,
    speakingMs: 0,
    points: 0,
    note: '',
  };
}

export function buildRoster(committee) {
  return committee.roster.map((entry) => seatFromEntry(entry)).sort(byName);
}

const byName = (a, b) => a.name.localeCompare(b.name, 'ka');

export const seatName = (delegate) => delegate?.name || '';

// Countries carry no subtitle unless a chair typed one; crisis portfolios and
// press outlets use it for the role they hold.
export const seatSubtitle = (delegate) => delegate?.role || '';

// --- session factory --------------------------------------------------------

// customDelegates lets the roster-setup screen hand in the exact seats a
// chair picked (once, the first time their committee ever logs in) instead
// of always deriving them from the hardcoded default. Each entry is either a
// country code string or a {code, name, role, photo} object, the same shapes
// seatFromEntry already accepts.
//
// customTopic is the agenda the chair wrote on that same screen. A blank one
// falls back to the committee's default, so a session never opens with an
// empty agenda in the top bar.
export function createSession(committeeId, customDelegates, customTopic) {
  const committee = getCommittee(committeeId);
  const delegates =
    customDelegates && customDelegates.length > 0
      ? customDelegates.map((entry) => seatFromEntry(entry)).sort(byName)
      : buildRoster(committee);
  const written = typeof customTopic === 'string' ? customTopic.trim() : '';

  return {
    version: SESSION_VERSION,
    id: uid('s'),
    committeeId: committee.id,
    topic: written || committee.defaultTopic,
    phase: 'rollcall', // rollcall | session | closed
    createdAt: Date.now(),
    openedAt: null,
    closedAt: null,
    delegates,
    floor: makeFloor(),
    lists: { gsl: makeList(), caucus: makeList() },
    speaker: null, // { delegateId, source }
    speech: makeTimer(committee.defaultSpeechMs),
    motions: [],
    vote: null,
    documents: [],
    log: [],
    settings: {
      chime: true,
      autoPause: true,
      speechMs: committee.defaultSpeechMs,
      quorumRatio: committee.rules.quorumRatio,
    },
  };
}

// --- log --------------------------------------------------------------------

const LOG_LIMIT = 500;

function log(state, kind, text, meta = {}) {
  const entry = {
    id: uid('log'),
    at: meta.at || Date.now(),
    kind,
    text,
    delegateId: meta.delegateId || null,
  };
  return { ...state, log: [entry, ...state.log].slice(0, LOG_LIMIT) };
}

const nameOf = (state, delegateId) => {
  const delegate = state.delegates.find((d) => d.id === delegateId);
  return delegate ? seatName(delegate) : 'Unknown delegate';
};

// --- reducer ----------------------------------------------------------------

function reducer(state, action) {
  const now = action.now || Date.now();

  switch (action.type) {
    // -- lifecycle ----------------------------------------------------------
    case 'session/create':
      return createSession(action.committeeId, action.customDelegates, action.customTopic);

    case 'session/load':
      return action.session;

    // Deliberately no local reset case: resetting strips live stats but
    // keeps the roster, and that roster lives on the server, not here. A
    // local-only reset could drift from what's actually persisted, so
    // resetSession() (see the bottom of this file) always goes through the
    // API and only updates state from what the server actually saved.
    case 'session/clear':
      return null;

    case 'session/setTopic':
      return log({ ...state, topic: action.topic }, 'agenda', `Agenda: ${action.topic}`);

    case 'session/setSetting':
      return {
        ...state,
        settings: { ...state.settings, [action.key]: action.value },
      };

    case 'session/open': {
      const present = state.delegates.filter((d) => d.status !== ATTENDANCE.ABSENT).length;
      const next = { ...state, phase: 'session', openedAt: now };
      return log(
        next,
        'session',
        `Debate opened. Present: ${present} of ${state.delegates.length}.`,
        { at: now }
      );
    }

    case 'session/close': {
      const committed = commitSpeech(state, now);
      const next = { ...committed, phase: 'closed', closedAt: now };
      return log(next, 'session', 'Session closed.', { at: now });
    }

    case 'session/reopen':
      return log({ ...state, phase: 'session', closedAt: null }, 'session', 'Session reopened.', {
        at: now,
      });

    // -- roster -------------------------------------------------------------
    case 'roster/add': {
      const delegate = seatFromEntry({
        code: action.code,
        name: action.name,
        role: action.role || '',
        photo: action.photo || '',
      });
      const delegates = [...state.delegates, delegate].sort(byName);
      return log({ ...state, delegates }, 'roster', `Added: ${delegate.name}.`);
    }

    case 'roster/remove': {
      const name = nameOf(state, action.id);
      const delegates = state.delegates.filter((d) => d.id !== action.id);
      // A removed seat has to leave BOTH lists, or it reappears the moment
      // the caucus ends and the general list comes back.
      const lists = {
        gsl: dropFromList(state.lists.gsl, action.id),
        caucus: dropFromList(state.lists.caucus, action.id),
      };
      const speaker = state.speaker?.delegateId === action.id ? null : state.speaker;
      return log({ ...state, delegates, lists, speaker }, 'roster', `Removed: ${name}.`);
    }

    case 'roster/setStatus': {
      const delegates = state.delegates.map((d) =>
        d.id === action.id ? { ...d, status: action.status } : d
      );
      return { ...state, delegates };
    }

    case 'roster/setAll': {
      const delegates = state.delegates.map((d) => ({ ...d, status: action.status }));
      return log(
        { ...state, delegates },
        'roster',
        `All seats marked: ${ATTENDANCE_LABELS[action.status]}.`
      );
    }

    case 'roster/setNote': {
      const delegates = state.delegates.map((d) =>
        d.id === action.id ? { ...d, note: action.note } : d
      );
      return { ...state, delegates };
    }

    // -- speakers lists -----------------------------------------------------
    //
    // Both the general list and the caucus list run through these four
    // actions. `action.list` is almost always omitted: the caller means
    // whichever list the floor is currently on.
    case 'list/add': {
      const key = action.list || activeListKey(state);
      const list = state.lists[key];
      if (!list.open) return state;
      if (list.queue.some((e) => e.delegateId === action.delegateId)) return state;
      const queue = [...list.queue, { entryId: uid('q'), delegateId: action.delegateId }];
      return { ...state, lists: { ...state.lists, [key]: { ...list, queue } } };
    }

    case 'list/remove': {
      const key = action.list || activeListKey(state);
      const list = state.lists[key];
      const queue = list.queue.filter((e) => e.entryId !== action.entryId);
      return { ...state, lists: { ...state.lists, [key]: { ...list, queue } } };
    }

    case 'list/move': {
      const key = action.list || activeListKey(state);
      const list = state.lists[key];
      const queue = [...list.queue];
      const index = queue.findIndex((e) => e.entryId === action.entryId);
      const target = index + action.delta;
      if (index === -1 || target < 0 || target >= queue.length) return state;
      const [entry] = queue.splice(index, 1);
      queue.splice(target, 0, entry);
      return { ...state, lists: { ...state.lists, [key]: { ...list, queue } } };
    }

    case 'list/clear': {
      const key = action.list || activeListKey(state);
      const list = state.lists[key];
      return log(
        { ...state, lists: { ...state.lists, [key]: { ...list, queue: [] } } },
        'gsl',
        key === 'caucus' ? 'Caucus speakers cleared.' : 'Speakers list cleared.',
        { at: now }
      );
    }

    case 'list/toggleOpen': {
      const key = action.list || activeListKey(state);
      const list = state.lists[key];
      const open = !list.open;
      const label = key === 'caucus' ? 'Caucus speakers' : 'Speakers list';
      return log(
        { ...state, lists: { ...state.lists, [key]: { ...list, open } } },
        'gsl',
        open ? `${label} opened.` : `${label} closed.`,
        { at: now }
      );
    }

    // -- the floor ----------------------------------------------------------
    case 'floor/setSpeaker': {
      if (state.floor.mode === FLOOR_MODE.UNMODERATED) return state;
      const committed = commitSpeech(state, now);
      const key = activeListKey(committed);
      const list = committed.lists[key];
      const durationMs = action.durationMs || activeSpeechMs(committed);
      const next = {
        ...committed,
        lists: {
          ...committed.lists,
          [key]: { ...list, queue: list.queue.filter((e) => e.delegateId !== action.delegateId) },
        },
        speaker: { delegateId: action.delegateId, source: action.source || 'gsl' },
        speech: resetTimer(committed.speech, durationMs),
      };
      return log(next, 'speech', `The floor goes to ${nameOf(state, action.delegateId)}.`, {
        at: now,
        delegateId: action.delegateId,
      });
    }

    case 'floor/next': {
      if (state.floor.mode === FLOOR_MODE.UNMODERATED) return state;
      const committed = commitSpeech(state, now);
      const key = activeListKey(committed);
      const list = committed.lists[key];
      const [entry, ...rest] = list.queue;

      if (!entry) {
        return log(
          { ...committed, speaker: null },
          'speech',
          key === 'caucus' ? 'No more caucus speakers.' : 'The speakers list is finished.',
          { at: now }
        );
      }

      const next = {
        ...committed,
        lists: { ...committed.lists, [key]: { ...list, queue: rest } },
        speaker: { delegateId: entry.delegateId, source: key },
        speech: resetTimer(committed.speech, activeSpeechMs(committed)),
      };
      return log(next, 'speech', `The floor goes to ${nameOf(state, entry.delegateId)}.`, {
        at: now,
        delegateId: entry.delegateId,
      });
    }

    case 'floor/finish': {
      const committed = commitSpeech(state, now);
      return { ...committed, speaker: null };
    }

    case 'floor/start':
      return { ...state, speech: startTimer(state.speech, now) };

    case 'floor/pause':
      return { ...state, speech: pauseTimer(state.speech, now) };

    case 'floor/toggle':
      return {
        ...state,
        speech: state.speech.running
          ? pauseTimer(state.speech, now)
          : startTimer(state.speech, now),
      };

    case 'floor/reset':
      return { ...state, speech: resetTimer(state.speech, action.durationMs) };

    case 'floor/addTime':
      return { ...state, speech: addTimerTime(state.speech, action.ms) };

    // -- caucuses -----------------------------------------------------------
    //
    // Starting a caucus switches the floor's mode. It does not create a
    // second clock, and it does not touch the general speakers list — that
    // list is set aside, intact, and comes straight back on caucus/end.
    case 'caucus/start': {
      const committed = commitSpeech(state, now);
      const motionType = MOTION_MAP[action.typeId];
      const isUnmod = action.typeId === 'unmoderated';
      const speechMs = action.speechMs || state.settings.speechMs;

      const floor = {
        mode: isUnmod ? FLOOR_MODE.UNMODERATED : FLOOR_MODE.MODERATED,
        topic: action.topic || '',
        totalMs: action.totalMs || 0,
        consumedMs: 0,
        speakers: 0,
        speechMs,
        proposerId: action.proposerId || null,
      };

      const next = {
        ...committed,
        floor,
        // A fresh caucus list every time. Nobody carries over from the last
        // caucus, and the general list is untouched underneath.
        lists: { ...committed.lists, caucus: makeList() },
        speaker: null,
        speech: isUnmod
          ? // Unmoderated has no speeches, so the stage clock simply times
            // the block, and it starts the moment the motion passes.
            { ...resetTimer(committed.speech, action.totalMs), running: true, startedAt: now }
          : resetTimer(committed.speech, speechMs),
      };

      const label = motionType ? motionType.label : 'Caucus';
      const topicPart = action.topic ? ` — ${action.topic}` : '';
      const perSpeaker = isUnmod ? '' : `, ${formatDuration(speechMs)} each`;
      return log(
        next,
        'caucus',
        `${label}${topicPart} (${formatDuration(action.totalMs)}${perSpeaker}).`,
        { at: now, delegateId: action.proposerId }
      );
    }

    case 'caucus/extend': {
      if (state.floor.mode === FLOOR_MODE.GSL) return state;
      const next =
        state.floor.mode === FLOOR_MODE.UNMODERATED
          ? { ...state, speech: addTimerTime(state.speech, action.ms) }
          : { ...state, floor: { ...state.floor, totalMs: state.floor.totalMs + action.ms } };
      return log(next, 'caucus', `Caucus extended by ${formatDuration(action.ms)}.`, { at: now });
    }

    case 'caucus/setSpeech': {
      if (state.floor.mode !== FLOOR_MODE.MODERATED) return state;
      return { ...state, floor: { ...state.floor, speechMs: action.ms } };
    }

    case 'caucus/end': {
      if (state.floor.mode === FLOOR_MODE.GSL) return state;
      const committed = commitSpeech(state, now);
      const { mode, topic, consumedMs, speakers } = committed.floor;

      const used =
        mode === FLOOR_MODE.UNMODERATED ? timerElapsed(committed.speech, now) : consumedMs;

      const next = {
        ...committed,
        floor: makeFloor(),
        lists: { ...committed.lists, caucus: makeList() },
        speaker: null,
        speech: resetTimer(committed.speech, committed.settings.speechMs),
      };

      const label = mode === FLOOR_MODE.UNMODERATED ? 'Unmoderated caucus' : 'Moderated caucus';
      const topicPart = topic ? ` on ${topic}` : '';
      const speakerPart = speakers ? `, ${speakers} ${speakers === 1 ? 'speaker' : 'speakers'}` : '';
      return log(
        next,
        'caucus',
        `${label}${topicPart} ended — ${formatDuration(used)} used${speakerPart}.`,
        { at: now }
      );
    }

    // -- motions ------------------------------------------------------------
    case 'motion/add': {
      const motionType = MOTION_MAP[action.typeId];
      if (!motionType) return state;
      const motion = {
        id: uid('m'),
        typeId: action.typeId,
        proposerId: action.proposerId || null,
        params: action.params || {},
        status: 'pending',
        tally: null,
        createdAt: now,
        resolvedAt: null,
      };
      const proposer = action.proposerId ? nameOf(state, action.proposerId) : 'A delegate';
      return log(
        { ...state, motions: [motion, ...state.motions] },
        'motion',
        `${proposer}: ${motionType.label}${action.params?.topic ? ` — ${action.params.topic}` : ''}.`,
        { at: now, delegateId: action.proposerId }
      );
    }

    case 'motion/withdraw': {
      const motions = state.motions.map((m) =>
        m.id === action.id ? { ...m, status: 'withdrawn', resolvedAt: now } : m
      );
      return log({ ...state, motions }, 'motion', 'Motion withdrawn.', { at: now });
    }

    case 'motion/resolve': {
      const motion = state.motions.find((m) => m.id === action.id);
      if (!motion) return state;
      const motionType = MOTION_MAP[motion.typeId];
      const motions = state.motions.map((m) =>
        m.id === action.id
          ? {
              ...m,
              status: action.passed ? 'passed' : 'failed',
              tally: action.tally || null,
              resolvedAt: now,
            }
          : m
      );
      const tallyText = action.tally
        ? ` (${action.tally.yes}–${action.tally.no}${
            action.tally.abstain ? `–${action.tally.abstain}` : ''
          })`
        : '';
      return log(
        { ...state, motions },
        'motion',
        `${motionType?.label || motion.typeId}: ${
          action.passed ? 'Passed' : 'Failed'
        }${tallyText}.`,
        { at: now }
      );
    }

    // -- points -------------------------------------------------------------
    case 'point/raise': {
      const point = POINT_MAP[action.pointId];
      if (!point) return state;
      const delegates = state.delegates.map((d) =>
        d.id === action.delegateId ? { ...d, points: d.points + 1 } : d
      );
      return log(
        { ...state, delegates },
        'point',
        `${nameOf(state, action.delegateId)}: ${point.label}.`,
        { at: now, delegateId: action.delegateId }
      );
    }

    // -- voting -------------------------------------------------------------
    case 'vote/open': {
      const committed = commitSpeech(state, now);
      const vote = {
        id: uid('v'),
        kind: action.kind || 'substantive',
        subject: action.subject || '',
        threshold: action.threshold || MAJORITY.SIMPLE,
        ballots: {},
        openedAt: now,
        closedAt: null,
        result: null,
      };
      return log(
        { ...committed, vote, speaker: null },
        'vote',
        `Vote opened: ${vote.subject || 'the question'}.`,
        { at: now }
      );
    }

    case 'vote/cast': {
      if (!state.vote || state.vote.closedAt) return state;
      const ballots = { ...state.vote.ballots };
      if (action.value === null) delete ballots[action.delegateId];
      else ballots[action.delegateId] = action.value;
      return { ...state, vote: { ...state.vote, ballots } };
    }

    case 'vote/close': {
      if (!state.vote) return state;
      const vote = { ...state.vote, closedAt: now, result: action.result };
      const vetoText = action.result.vetoedBy.length
        ? ` — veto: ${action.result.vetoedBy.join(', ')}`
        : '';
      return log(
        { ...state, vote },
        'vote',
        `${vote.subject || 'the question'}: ${action.result.passed ? 'Passed' : 'Failed'} ` +
          `(${action.result.yes}–${action.result.no}–${action.result.abstain})${vetoText}.`,
        { at: now }
      );
    }

    case 'vote/clear':
      return { ...state, vote: null };

    // -- documents ----------------------------------------------------------
    case 'doc/add': {
      const doc = {
        id: uid('doc'),
        typeId: action.typeId,
        title: action.title,
        sponsors: action.sponsors || [],
        status: 'draft',
        createdAt: now,
      };
      const docType = DOC_MAP[action.typeId];
      return log(
        { ...state, documents: [doc, ...state.documents] },
        'doc',
        `${docType ? docType.label : 'Document'}: ${doc.title}.`,
        { at: now }
      );
    }

    case 'doc/setStatus': {
      const documents = state.documents.map((d) =>
        d.id === action.id ? { ...d, status: action.status } : d
      );
      const doc = state.documents.find((d) => d.id === action.id);
      return log(
        { ...state, documents },
        'doc',
        `${doc ? doc.title : 'Document'} — ${action.statusLabel}.`,
        { at: now }
      );
    }

    case 'doc/remove':
      return { ...state, documents: state.documents.filter((d) => d.id !== action.id) };

    // -- minutes ------------------------------------------------------------
    case 'log/note':
      return log(state, 'note', action.text, { at: now });

    default:
      return state;
  }
}

const dropFromList = (list, delegateId) => ({
  ...list,
  queue: list.queue.filter((e) => e.delegateId !== delegateId),
});

// Writes the finished speech into the speaker's stats, bills it to the
// caucus block if one is running, and stops the clock. Called by every
// action that takes the floor away from someone, so speaking time is never
// lost, never double-counted, and a moderated caucus's budget stays exactly
// equal to the speeches that have happened inside it.
function commitSpeech(state, now) {
  const spent = state.speaker ? timerElapsed(state.speech, now) : 0;

  const floor =
    state.floor.mode === FLOOR_MODE.MODERATED && spent > 0
      ? {
          ...state.floor,
          consumedMs: state.floor.consumedMs + spent,
          speakers: state.floor.speakers + (spent > 1000 ? 1 : 0),
        }
      : state.floor;

  if (!state.speaker) {
    return { ...state, floor, speech: pauseTimer(state.speech, now) };
  }

  const delegates = state.delegates.map((d) =>
    d.id === state.speaker.delegateId
      ? { ...d, speeches: d.speeches + (spent > 1000 ? 1 : 0), speakingMs: d.speakingMs + spent }
      : d
  );
  return { ...state, delegates, floor, speech: pauseTimer(state.speech, now) };
}

// --- derived ----------------------------------------------------------------

export function getCounts(session) {
  const total = session.delegates.length;
  const voting = session.delegates.filter((d) => d.status === ATTENDANCE.VOTING).length;
  const present = session.delegates.filter((d) => d.status === ATTENDANCE.PRESENT).length + voting;
  const absent = total - present;
  const quorumNeeded = Math.ceil(total * (session.settings.quorumRatio || 0.25));
  return {
    total,
    present,
    voting,
    absent,
    quorumNeeded,
    hasQuorum: present >= quorumNeeded && present > 0,
    simpleMajority: Math.floor(present / 2) + 1,
    twoThirds: Math.ceil((present * 2) / 3),
  };
}

// Procedural votes need a majority of those present. Substantive votes need a
// majority of those "present and voting", which excludes abstentions — except
// in the Security Council, where nine affirmative votes carry regardless and
// a single permanent member voting against kills the draft.
export function tallyVote(session, committee) {
  const vote = session.vote;
  const ballots = vote?.ballots || {};
  const eligible = session.delegates.filter((d) => d.status !== ATTENDANCE.ABSENT);

  let yes = 0;
  let no = 0;
  let abstain = 0;
  const vetoedBy = [];

  eligible.forEach((delegate) => {
    const ballot = ballots[delegate.id];
    if (ballot === 'yes') yes += 1;
    else if (ballot === 'no') {
      no += 1;
      if (vote?.kind === 'substantive' && committee.rules.veto.includes(delegate.code)) {
        vetoedBy.push(seatName(delegate));
      }
    } else if (ballot === 'abstain') abstain += 1;
  });

  const cast = yes + no + abstain;
  const pending = eligible.length - cast;
  const isUnsc = committee.rules.voteMode === 'unsc' && vote?.kind === 'substantive';

  let needed;
  let thresholdLabel;

  if (isUnsc) {
    needed = 9;
    thresholdLabel = '9 of 15 votes';
  } else if (vote?.kind === 'procedural') {
    needed = Math.floor(eligible.length / 2) + 1;
    thresholdLabel = `Simple majority — ${needed}`;
  } else if (vote?.threshold === MAJORITY.TWO_THIRDS) {
    needed = Math.ceil(((yes + no) * 2) / 3);
    thresholdLabel = `Two-thirds — ${needed}`;
  } else {
    needed = Math.floor((yes + no) / 2) + 1;
    thresholdLabel = `Simple majority — ${needed}`;
  }

  const passed = vetoedBy.length === 0 && yes >= needed && yes > no;

  return {
    yes,
    no,
    abstain,
    cast,
    pending,
    eligible: eligible.length,
    needed,
    thresholdLabel,
    vetoedBy,
    passed,
  };
}

export function majorityFor(motionType, counts) {
  if (!motionType) return counts.simpleMajority;
  if (motionType.majority === MAJORITY.TWO_THIRDS) return counts.twoThirds;
  if (motionType.majority === MAJORITY.CHAIR) return 0;
  return counts.simpleMajority;
}

export const sortedMotions = (motions) =>
  [...motions]
    .filter((m) => m.status === 'pending')
    .sort((a, b) => {
      const pa = MOTION_MAP[a.typeId]?.precedence ?? 99;
      const pb = MOTION_MAP[b.typeId]?.precedence ?? 99;
      if (pa !== pb) return pa - pb;
      // Within the same motion, the longer caucus is taken first.
      return (b.params?.totalMs || 0) - (a.params?.totalMs || 0);
    });

// --- server sync --------------------------------------------------------
//
// A session lives in the database, one document per committee, behind the
// committee's password. This section only maps shapes and schedules saves;
// the actual HTTP calls live in ../api/mun.js.

// The reducer's session object uses `id`; the backend stores it as
// `clientSessionId` to avoid colliding with Mongoose's own `id` getter for
// `_id`. These two functions are the one place that mapping happens.
function toServerSession(session) {
  const { id, ...rest } = session;
  return { ...rest, clientSessionId: id };
}

function fromServerSession(serverSession) {
  const { clientSessionId, ...rest } = serverSession;
  return migrateSession({ ...rest, id: clientSessionId || uid('s') });
}

// v1 kept `gsl`, `caucus` and a second `caucusTimer`. v2 replaces all three
// with `floor` + `lists` and a single clock. Anything written before the
// change still opens; the caucus it was in is carried across with whatever
// time it had left.
function migrateSession(session) {
  if (!session || (session.version || 1) >= SESSION_VERSION) return session;

  const { gsl, caucus, caucusTimer, ...rest } = session;
  const mode = !caucus
    ? FLOOR_MODE.GSL
    : caucus.typeId === 'unmoderated'
      ? FLOOR_MODE.UNMODERATED
      : FLOOR_MODE.MODERATED;

  return {
    ...rest,
    version: SESSION_VERSION,
    floor: {
      mode,
      topic: caucus?.topic || '',
      totalMs: caucusTimer?.durationMs || 0,
      consumedMs: caucusTimer?.elapsedMs || 0,
      speakers: 0,
      speechMs: caucus?.speechMs || session.settings?.speechMs || 0,
      proposerId: caucus?.proposerId || null,
    },
    lists: {
      gsl: gsl || makeList(),
      caucus: makeList(),
    },
    delegates: (session.delegates || []).map((d) => ({ ...d, photo: d.photo || '' })),
  };
}

// A clock that was still "running" when the tab closed, the laptop slept, or
// the chair simply logged back in later would otherwise count that gap
// against the speaker. Freeze it on load and let the chair press play when
// they're actually ready.
function freezeRunningTimers(session) {
  return {
    ...session,
    speech: { ...session.speech, running: false, startedAt: null },
  };
}

// Debounces saves 400ms after the last change, and handles failure: a failed
// save retries with backoff, always with whatever the *latest* state is —
// never a stale snapshot from the moment the save was first scheduled — so a
// slow retry can't overwrite newer changes with older ones.
function useServerSync(munApi, session, sessionStatus) {
  const [syncStatus, setSyncStatus] = useState('idle'); // idle | saving | saved | error

  const pendingRef = useRef(null);
  const inFlightRef = useRef(false);
  const debounceRef = useRef(null);
  const retryRef = useRef(null);
  const retryDelayRef = useRef(1000);

  const flush = useCallback(() => {
    if (inFlightRef.current) return;
    const toSend = pendingRef.current;
    if (!toSend) return;
    inFlightRef.current = true;
    setSyncStatus('saving');

    munApi
      .saveSession(toServerSession(toSend))
      .then(() => {
        inFlightRef.current = false;
        retryDelayRef.current = 1000;
        if (pendingRef.current !== toSend) {
          // Something newer arrived while this save was in flight — go
          // again immediately instead of waiting for the next debounce.
          flush();
        } else {
          pendingRef.current = null;
          setSyncStatus('saved');
        }
      })
      .catch(() => {
        inFlightRef.current = false;
        setSyncStatus('error');
        const delay = Math.min(retryDelayRef.current, 15_000);
        retryDelayRef.current = delay * 2;
        clearTimeout(retryRef.current);
        retryRef.current = setTimeout(flush, delay);
      });
  }, [munApi]);

  useEffect(() => {
    if (!session || sessionStatus !== 'ready') return undefined;
    pendingRef.current = session;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(flush, 400);
    return () => clearTimeout(debounceRef.current);
  }, [session, sessionStatus, flush]);

  useEffect(
    () => () => {
      clearTimeout(debounceRef.current);
      clearTimeout(retryRef.current);
    },
    []
  );

  return syncStatus;
}

// --- minutes ----------------------------------------------------------------

export function buildMinutes(session) {
  const committee = getCommittee(session.committeeId);
  const counts = getCounts(session);
  const lines = [];

  lines.push(`# ${committee.abbr} — GAMUN 2026`);
  lines.push('');
  lines.push(`**Agenda:** ${session.topic}`);
  lines.push(`**Date:** ${formatDate(session.createdAt)}`);
  lines.push(
    `**Debate opened:** ${session.openedAt ? formatTimeOfDay(session.openedAt) : '—'}` +
      `  ·  **Closed:** ${session.closedAt ? formatTimeOfDay(session.closedAt) : '—'}`
  );
  lines.push('');

  lines.push('## Attendance');
  lines.push('');
  lines.push(
    `Total ${counts.total} · Present ${counts.present} · Present and voting ${counts.voting} · ` +
      `Absent ${counts.absent} · Quorum ${counts.hasQuorum ? 'met' : 'not met'}`
  );
  lines.push('');
  lines.push('| Delegation | Status | Speeches | Time | Points |');
  lines.push('| --- | --- | --- | --- | --- |');
  session.delegates.forEach((d) => {
    lines.push(
      `| ${seatName(d)} | ${ATTENDANCE_SHORT[d.status]} | ${d.speeches} | ` +
        `${formatDuration(d.speakingMs)} | ${d.points} |`
    );
  });
  lines.push('');

  if (session.documents.length) {
    lines.push('## Documents');
    lines.push('');
    session.documents.forEach((doc) => {
      const docType = DOC_MAP[doc.typeId];
      const sponsors = doc.sponsors
        .map((id) => seatName(session.delegates.find((d) => d.id === id)))
        .filter(Boolean)
        .join(', ');
      lines.push(
        `- **${docType ? docType.short : 'DOC'}** ${doc.title}${sponsors ? ` — sponsors: ${sponsors}` : ''}`
      );
    });
    lines.push('');
  }

  const resolved = session.motions.filter((m) => m.status !== 'pending');
  if (resolved.length) {
    lines.push('## Motions');
    lines.push('');
    resolved
      .slice()
      .reverse()
      .forEach((motion) => {
        const motionType = MOTION_MAP[motion.typeId];
        const proposer = motion.proposerId
          ? seatName(session.delegates.find((d) => d.id === motion.proposerId))
          : '—';
        const tally = motion.tally ? ` (${motion.tally.yes}–${motion.tally.no})` : '';
        const statusLabel =
          motion.status === 'passed'
            ? 'Passed'
            : motion.status === 'failed'
              ? 'Failed'
              : 'Withdrawn';
        lines.push(
          `- ${formatTimeOfDay(motion.createdAt)} — ${proposer}: ` +
            `${motionType ? motionType.label : motion.typeId} — ${statusLabel}${tally}`
        );
      });
    lines.push('');
  }

  lines.push('## Minutes');
  lines.push('');
  session.log
    .slice()
    .reverse()
    .forEach((entry) => {
      lines.push(`- \`${formatTimeOfDay(entry.at)}\` ${entry.text}`);
    });
  lines.push('');

  return lines.join('\n');
}

// --- hooks ------------------------------------------------------------------

// Re-renders while the clock is running. The interval only exists when
// something is actually counting, so an idle console stays quiet.
export function useTick(active, interval = 200) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setNow(Date.now());
    if (!active) return undefined;
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [active, interval]);

  return now;
}

// authStatus:    'checking' | 'signedOut' | 'signedIn'
// sessionStatus: 'idle' | 'loading' | 'needsRoster' | 'ready' | 'error'
// syncStatus:    'idle' | 'saving' | 'saved' | 'error'   (see useServerSync)
//
// A committee is a password-protected account rather than something anyone
// can just open, so committeeId comes from auth (munApi.me() / login()), not
// from the session object — it has to be known before a session necessarily
// exists yet, to know whose roster-setup screen to show.
export function useSessionEngine(munApi) {
  const [session, rawDispatch] = useReducer(reducer, null);
  const [authStatus, setAuthStatus] = useState('checking');
  const [committeeId, setCommitteeId] = useState(null);
  const [sessionStatus, setSessionStatus] = useState('idle');

  const dispatch = useCallback((action) => {
    rawDispatch({ ...action, now: Date.now() });
  }, []);

  const loadSession = useCallback(async () => {
    setSessionStatus('loading');
    try {
      const res = await munApi.getSession();
      if (res.exists) {
        dispatch({
          type: 'session/load',
          session: freezeRunningTimers(fromServerSession(res.session)),
        });
        setSessionStatus('ready');
      } else {
        // No session document yet for this committee at all — this is the
        // very first time anyone has logged into it, so the roster has
        // never been built. The one-time setup screen handles that next.
        setSessionStatus('needsRoster');
      }
    } catch (err) {
      if (err.status === 401) {
        setAuthStatus('signedOut');
        setCommitteeId(null);
        setSessionStatus('idle');
      } else {
        setSessionStatus('error');
      }
    }
  }, [munApi, dispatch]);

  // On mount, check for a still-valid cookie so a chair who leaves the tab
  // open — or just refreshes — doesn't have to sign in again. A 401 here is
  // the ordinary, expected state for anyone who hasn't logged in yet.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await munApi.me();
        if (cancelled) return;
        setCommitteeId(res.committeeId);
        setAuthStatus('signedIn');
        await loadSession();
      } catch {
        if (!cancelled) setAuthStatus('signedOut');
      }
    })();
    return () => {
      cancelled = true;
    };
    // Deliberately mount-only: loadSession's own dependencies are stable,
    // so re-running this on every render would add nothing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncStatus = useServerSync(munApi, session, sessionStatus);

  const committee = useMemo(() => (committeeId ? getCommittee(committeeId) : null), [committeeId]);

  const login = useCallback(
    async (id, password) => {
      const res = await munApi.login(id, password);
      setCommitteeId(res.committeeId);
      setAuthStatus('signedIn');
      await loadSession();
      return res; // { committeeId, isFirstLogin, hasSession }
    },
    [munApi, loadSession]
  );

  const logout = useCallback(async () => {
    try {
      await munApi.logout();
    } catch {
      // The cookie is cleared server-side regardless; there's nothing more
      // useful to do locally with a logout call failing.
    }
    dispatch({ type: 'session/clear' });
    setAuthStatus('signedOut');
    setCommitteeId(null);
    setSessionStatus('idle');
  }, [munApi, dispatch]);

  // The one-time setup a chair does for their committee: the topic and the
  // roster. This only ever runs once per committee, since after today
  // loadSession() above always finds an existing document and skips
  // straight to roll call.
  const initializeSession = useCallback(
    (customDelegates, customTopic) => {
      if (!committeeId) return;
      const fresh = createSession(committeeId, customDelegates, customTopic);
      dispatch({ type: 'session/load', session: fresh });
      setSessionStatus('ready');
      // No explicit save call here: sessionStatus flipping to 'ready' with
      // a session in place is exactly what useServerSync watches for, so
      // the debounced sync picks this up on its own.
    },
    [committeeId, dispatch]
  );

  // Unlike every other action, resetting isn't computable locally: it needs
  // to strip live stats from whatever roster the server currently has on
  // file, and duplicating that transform client-side risks the two ever
  // disagreeing. So this always goes through the API, and only updates
  // local state from what the server actually saved — a failed reset leaves
  // the current session exactly as it was rather than guessing.
  const resetSession = useCallback(async () => {
    try {
      const res = await munApi.resetSession();
      dispatch({ type: 'session/load', session: fromServerSession(res.session) });
      return true;
    } catch {
      return false;
    }
  }, [munApi, dispatch]);

  const actions = useMemo(
    () => ({
      setTopic: (topic) => dispatch({ type: 'session/setTopic', topic }),
      setSetting: (key, value) => dispatch({ type: 'session/setSetting', key, value }),
      openDebate: () => dispatch({ type: 'session/open' }),
      closeSession: () => dispatch({ type: 'session/close' }),
      reopenSession: () => dispatch({ type: 'session/reopen' }),

      addDelegate: (payload) => dispatch({ type: 'roster/add', ...payload }),
      removeDelegate: (id) => dispatch({ type: 'roster/remove', id }),
      setStatus: (id, status) => dispatch({ type: 'roster/setStatus', id, status }),
      setAllStatus: (status) => dispatch({ type: 'roster/setAll', status }),
      setNote: (id, note) => dispatch({ type: 'roster/setNote', id, note }),

      // `list` is optional on all four and means "the list the floor is on".
      addSpeaker: (delegateId, list) => dispatch({ type: 'list/add', delegateId, list }),
      removeSpeaker: (entryId, list) => dispatch({ type: 'list/remove', entryId, list }),
      moveSpeaker: (entryId, delta, list) => dispatch({ type: 'list/move', entryId, delta, list }),
      clearSpeakers: (list) => dispatch({ type: 'list/clear', list }),
      toggleSpeakersList: (list) => dispatch({ type: 'list/toggleOpen', list }),

      setSpeaker: (delegateId, source, durationMs) =>
        dispatch({ type: 'floor/setSpeaker', delegateId, source, durationMs }),
      nextSpeaker: () => dispatch({ type: 'floor/next' }),
      finishSpeech: () => dispatch({ type: 'floor/finish' }),
      startSpeech: () => dispatch({ type: 'floor/start' }),
      pauseSpeech: () => dispatch({ type: 'floor/pause' }),
      toggleSpeech: () => dispatch({ type: 'floor/toggle' }),
      resetSpeech: (durationMs) => dispatch({ type: 'floor/reset', durationMs }),
      addSpeechTime: (ms) => dispatch({ type: 'floor/addTime', ms }),

      startCaucus: (payload) => dispatch({ type: 'caucus/start', ...payload }),
      extendCaucus: (ms) => dispatch({ type: 'caucus/extend', ms }),
      setCaucusSpeech: (ms) => dispatch({ type: 'caucus/setSpeech', ms }),
      endCaucus: () => dispatch({ type: 'caucus/end' }),

      addMotion: (payload) => dispatch({ type: 'motion/add', ...payload }),
      withdrawMotion: (id) => dispatch({ type: 'motion/withdraw', id }),
      resolveMotion: (id, passed, tally) => dispatch({ type: 'motion/resolve', id, passed, tally }),

      raisePoint: (pointId, delegateId) => dispatch({ type: 'point/raise', pointId, delegateId }),

      openVote: (payload) => dispatch({ type: 'vote/open', ...payload }),
      castBallot: (delegateId, value) => dispatch({ type: 'vote/cast', delegateId, value }),
      closeVote: (result) => dispatch({ type: 'vote/close', result }),
      clearVote: () => dispatch({ type: 'vote/clear' }),

      addDocument: (payload) => dispatch({ type: 'doc/add', ...payload }),
      setDocumentStatus: (id, status, statusLabel) =>
        dispatch({ type: 'doc/setStatus', id, status, statusLabel }),
      removeDocument: (id) => dispatch({ type: 'doc/remove', id }),

      note: (text) => dispatch({ type: 'log/note', text }),
    }),
    [dispatch]
  );

  return {
    session,
    committee,
    actions,
    dispatch,
    authStatus,
    committeeId,
    sessionStatus,
    syncStatus,
    login,
    logout,
    initializeSession,
    resetSession,
    reloadSession: loadSession,
  };
}