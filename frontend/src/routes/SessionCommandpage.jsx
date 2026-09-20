import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import Flag from '../components/session/Flag';
import SeatAvatar from '../components/session/SeatAvatar';
import * as munApi from '../api/mun';
import {
  CAUCUS_PRESETS,
  COMMITTEES,
  COUNTRIES,
  DOC_STATUS,
  MOTION_TYPES,
  POINT_TYPES,
  SEAT_KIND,
  SPEECH_PRESETS,
  TOPIC_MAX_LENGTH,
  docTypesFor,
  getCommittee,
  getMotionType,
  searchCountries,
} from '../data/munData';
import {
  ATTENDANCE,
  ATTENDANCE_LABELS,
  ATTENDANCE_SHORT,
  BALLOT_LABELS,
  FLOOR_MODE,
  activeList,
  activeSpeechMs,
  blockProgress,
  blockRemaining,
  buildMinutes,
  formatClock,
  formatDuration,
  formatTimeOfDay,
  getCounts,
  majorityFor,
  playChime,
  seatName,
  seatSubtitle,
  sortedMotions,
  speakersLeftInBlock,
  tallyVote,
  timerExpired,
  timerProgress,
  timerRemaining,
  useSessionEngine,
  useTick,
} from '../hooks/useSessionEngine';

const EASE = [0.22, 1, 0.36, 1];
const RING_RADIUS = 104;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

const SIDE_TABS = [
  { id: 'motions', label: 'Motions', icon: 'bi-hand-index-thumb' },
  { id: 'vote', label: 'Voting', icon: 'bi-check2-square' },
  { id: 'docs', label: 'Documents', icon: 'bi-files' },
  { id: 'log', label: 'Minutes', icon: 'bi-journal-text' },
];

const MOBILE_TABS = [
  { id: 'roster', label: 'Roster', icon: 'bi-people-fill' },
  { id: 'floor', label: 'Floor', icon: 'bi-mic-fill' },
  { id: 'side', label: 'Procedure', icon: 'bi-list-check' },
];

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const isTypingTarget = (target) =>
  !!target &&
  (target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT' ||
    target.isContentEditable);

export default function SessionCommandPage() {
  const {
    session,
    committee,
    actions,
    authStatus,
    committeeId,
    sessionStatus,
    syncStatus,
    login,
    logout,
    initializeSession,
    resetSession,
    reloadSession,
  } = useSessionEngine(munApi);

  const [mobileTab, setMobileTab] = useState('floor');
  const [sideTab, setSideTab] = useState('motions');
  const [delegateModalId, setDelegateModalId] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const modalOpen = !!delegateModalId || settingsOpen;

  const clockRunning = !!session && session.speech.running;
  const now = useTick(!!session && session.phase !== 'closed', clockRunning ? 200 : 500);

  const counts = useMemo(() => (session ? getCounts(session) : null), [session]);

  // --- expiry cues ---------------------------------------------------------
  //
  // Two cues, one clock. The stage clock running out means either "this
  // speaker is done" or, in an unmoderated caucus, "the block is done" —
  // same timer, different sentence. The block cue below only fires in a
  // moderated caucus, where the budget is derived rather than timed.
  const speechFiredRef = useRef(false);
  useEffect(() => {
    if (!session) return;
    const expired = timerExpired(session.speech, now);
    if (expired && session.speech.running && !speechFiredRef.current) {
      speechFiredRef.current = true;
      if (session.settings.chime) playChime('end');
      if (session.settings.autoPause) actions.pauseSpeech();
      toast(
        session.floor.mode === FLOOR_MODE.UNMODERATED
          ? 'The caucus time is up'
          : 'The speaker’s time is up',
        { icon: <i className="bi bi-hourglass-bottom" /> }
      );
    }
    if (!expired) speechFiredRef.current = false;
  }, [session, now, actions]);

  const blockFiredRef = useRef(false);
  useEffect(() => {
    if (!session || session.floor.mode !== FLOOR_MODE.MODERATED || session.floor.totalMs === 0) {
      blockFiredRef.current = false;
      return;
    }
    const left = blockRemaining(session, now);
    if (left > 0) {
      blockFiredRef.current = false;
      return;
    }
    if (!blockFiredRef.current) {
      blockFiredRef.current = true;
      if (session.settings.chime) playChime('end');
      if (session.speech.running) actions.pauseSpeech();
      // Deliberately not auto-ending: a chair who wants to extend would
      // otherwise lose the topic and have to retype the whole motion.
      toast('The caucus time is up — extend it or return to the speakers list', {
        icon: <i className="bi bi-hourglass-bottom" />,
      });
    }
  }, [session, now, actions]);

  // --- keyboard ------------------------------------------------------------
  useEffect(() => {
    if (!session || session.phase !== 'session') return undefined;

    const onKeyDown = (event) => {
      if (isTypingTarget(event.target)) return;
      const key = event.key.toLowerCase();

      // Escape still closes a dialog; nothing else reaches the floor while
      // one is open, or Space would pause a timer the chair can't see.
      if (key === 'escape') {
        setDelegateModalId(null);
        setSettingsOpen(false);
        return;
      }
      if (modalOpen) return;

      if (event.code === 'Space') {
        event.preventDefault();
        actions.toggleSpeech();
        return;
      }
      if (key === 'n') {
        event.preventDefault();
        actions.nextSpeaker();
        return;
      }
      if (key === '+' || key === '=') {
        event.preventDefault();
        actions.addSpeechTime(15_000);
        return;
      }
      if (key === '-') {
        event.preventDefault();
        actions.addSpeechTime(-15_000);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [session, actions, modalOpen]);

  // Every hook above this line runs on every render regardless of which
  // screen ends up showing — each already no-ops safely when session is
  // null, which is exactly what keeps this chain of early returns legal
  // under the rules of hooks (nothing below here calls a hook).
  if (authStatus === 'checking') {
    return (
      <FullScreenStatus
        icon="bi-hourglass-split"
        text="Checking your sign-in…"
      />
    );
  }
  if (authStatus === 'signedOut') {
    return (
      <SetupShell>
        <LoginScreen login={login} />
      </SetupShell>
    );
  }
  if (sessionStatus === 'loading' || sessionStatus === 'idle') {
    return (
      <FullScreenStatus
        icon="bi-hourglass-split"
        text="Loading your committee…"
      />
    );
  }
  if (sessionStatus === 'error') {
    return (
      <FullScreenStatus
        icon="bi-exclamation-triangle"
        text="Could not load your session. Check your connection and try again."
        action={{ label: 'Retry', onClick: reloadSession }}
      />
    );
  }
  if (sessionStatus === 'needsRoster') {
    return (
      <SetupShell>
        <RosterSetupScreen
          committee={getCommittee(committeeId)}
          onContinue={initializeSession}
        />
      </SetupShell>
    );
  }
  if (!session || !committee) {
    // sessionStatus should be 'ready' with a session by now; this only
    // guards the brief render between one state update and the next.
    return (
      <FullScreenStatus
        icon="bi-hourglass-split"
        text="Loading…"
      />
    );
  }

  // The Press Corps never votes, so that tab would only ever show a notice.
  const sideTabs =
    committee.rules.voteMode === 'none' ? SIDE_TABS.filter((t) => t.id !== 'vote') : SIDE_TABS;
  const activeSideTab = sideTabs.some((t) => t.id === sideTab) ? sideTab : 'motions';

  const speaker = session.speaker
    ? session.delegates.find((d) => d.id === session.speaker.delegateId) || null
    : null;

  const handleExportMinutes = () => {
    const blob = new Blob([buildMinutes(session)], { type: 'text/markdown;charset=utf-8' });
    downloadBlob(blob, `gamun-${committee.id}-minutes.md`);
    toast.success('Minutes downloaded');
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `gamun-${committee.id}-session.json`);
    toast.success('Session downloaded');
  };

  return (
    <div className="commandPage">
      <SessionBar
        session={session}
        committee={committee}
        counts={counts}
        now={now}
        syncStatus={syncStatus}
        onTopicChange={actions.setTopic}
        onSettings={() => setSettingsOpen(true)}
        onExportMinutes={handleExportMinutes}
        onClose={actions.closeSession}
        onReopen={actions.reopenSession}
      />

      {session.phase === 'rollcall' ? (
        <RollCall
          session={session}
          counts={counts}
          actions={actions}
        />
      ) : (
        <>
          <div
            className="commandGrid"
            data-tab={mobileTab}
          >
            <section className="commandCol commandCol--roster">
              <RosterPanel
                session={session}
                committee={committee}
                counts={counts}
                actions={actions}
                onOpenDelegate={setDelegateModalId}
              />
            </section>

            <section className="commandCol commandCol--floor">
              <FloorPanel
                session={session}
                speaker={speaker}
                now={now}
                actions={actions}
              />
            </section>

            <section className="commandCol commandCol--side">
              <div className="commandPanel">
                <div className="commandPanel__tabs">
                  {sideTabs.map((tab) => (
                    <button
                      type="button"
                      key={tab.id}
                      className={clsx('commandPanel__tab', {
                        'commandPanel__tab--active': activeSideTab === tab.id,
                      })}
                      onClick={() => setSideTab(tab.id)}
                    >
                      <i className={`bi ${tab.icon}`} />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                <div className="commandPanel__body">
                  {activeSideTab === 'motions' && (
                    <MotionsPanel
                      session={session}
                      committee={committee}
                      counts={counts}
                      actions={actions}
                      onGoToVote={() => setSideTab('vote')}
                    />
                  )}
                  {activeSideTab === 'vote' && (
                    <VotePanel
                      session={session}
                      committee={committee}
                      actions={actions}
                    />
                  )}
                  {activeSideTab === 'docs' && (
                    <DocumentsPanel
                      session={session}
                      committee={committee}
                      actions={actions}
                    />
                  )}
                  {activeSideTab === 'log' && (
                    <LogPanel
                      session={session}
                      actions={actions}
                      onExportMinutes={handleExportMinutes}
                    />
                  )}
                </div>
              </div>
            </section>
          </div>

          <nav className="commandTabs">
            {MOBILE_TABS.map((tab) => (
              <button
                type="button"
                key={tab.id}
                className={clsx('commandTabs__btn', {
                  'commandTabs__btn--active': mobileTab === tab.id,
                })}
                onClick={() => setMobileTab(tab.id)}
              >
                <i className={`bi ${tab.icon}`} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </>
      )}

      <AnimatePresence>
        {delegateModalId && (
          <DelegateModal
            session={session}
            delegate={session.delegates.find((d) => d.id === delegateModalId)}
            actions={actions}
            onClose={() => setDelegateModalId(null)}
          />
        )}
        {settingsOpen && (
          <SettingsModal
            session={session}
            actions={actions}
            resetSession={resetSession}
            logout={logout}
            onClose={() => setSettingsOpen(false)}
            onExportJson={handleExportJson}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Full-screen status (checking sign-in, loading a session, or an error)
// ---------------------------------------------------------------------------

function FullScreenStatus({ icon, text, action }) {
  return (
    <div className="commandPage commandPage--status">
      <div className="statusScreen">
        <i className={`bi ${icon} statusScreen__icon`} />
        <p className="statusScreen__text">{text}</p>
        {action && (
          <button
            type="button"
            className="commandGhostBtn"
            onClick={action.onClick}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shell for the sign-in and setup screens. .commandPage is what gives the
// console its font, text colour and background, so these screens have to sit
// inside it too. Rendered on their own they inherited whatever the page
// underneath happened to set, which is why their type never matched the
// console's.
// ---------------------------------------------------------------------------

function SetupShell({ children }) {
  return <div className="commandPage">{children}</div>;
}

// ---------------------------------------------------------------------------
// Sign in — pick a committee, then its password
// ---------------------------------------------------------------------------

function LoginScreen({ login }) {
  const [statuses, setStatuses] = useState(null); // [{committeeId, hasPassword, hasSession}] | null while loading
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let cancelled = false;
    munApi
      .listCommittees()
      .then((res) => {
        if (!cancelled) setStatuses(res.committees);
      })
      .catch(() => {
        // Purely cosmetic if this fails — the picker still works, it just
        // won't be able to say which committees are already set up.
        if (!cancelled) setStatuses([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (selected) {
    const meta = statuses?.find((s) => s.committeeId === selected);
    return (
      <PasswordStep
        committeeId={selected}
        hasPassword={meta?.hasPassword ?? false}
        onBack={() => setSelected(null)}
        login={login}
      />
    );
  }

  return (
    <div className="commandSetup">
      <div className="commandSetup__inner">
        <span className="commandSetup__badge">GAMUN Command</span>
        <h1 className="commandSetup__title">Sign in to your committee</h1>
        <p className="commandSetup__desc">
          Pick your committee. If nobody has signed in to it yet, you'll set its password now — the
          dais uses the same one for the rest of the conference.
        </p>

        <div className="commandSetup__grid">
          {COMMITTEES.map((committee) => {
            const meta = statuses?.find((s) => s.committeeId === committee.id);
            const statusLabel = !statuses
              ? 'Checking…'
              : !meta?.hasPassword
                ? 'Not set up yet'
                : meta.hasSession
                  ? 'In progress'
                  : 'Set up, no session yet';
            // A crisis cabinet or a press corps seats the same country over
            // and over, so each flag shows once.
            const rosterCodes = committee.roster.map((entry) =>
              typeof entry === 'string' ? entry : entry.code
            );
            const flagCodes = [...new Set(rosterCodes)].filter(Boolean).slice(0, 5);
            return (
              <div
                className="commandSetup__card"
                key={committee.id}
              >
                <button
                  type="button"
                  className="commandSetup__cardMain"
                  onClick={() => setSelected(committee.id)}
                >
                  <span className="commandSetup__icon">
                    <i className={`bi ${committee.icon}`} />
                  </span>
                  <span className="commandSetup__cardText">
                    <span className="commandSetup__abbr">
                      {committee.abbr}
                      {committee.tag && <span className="commandSetup__tag">{committee.tag}</span>}
                    </span>
                    <span className="commandSetup__name">{committee.name}</span>
                    <span className="commandSetup__meta">{statusLabel}</span>
                  </span>
                  <span className="commandSetup__flags">
                    {flagCodes.map((code) => (
                      <Flag
                        key={`${committee.id}-${code}`}
                        code={code}
                        size={22}
                      />
                    ))}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        <p className="commandSetup__hint">
          Signing in doesn't rebuild the roster or the topic. Both are set once, the first time a
          committee ever signs in. It does start a fresh roll call, every time.
        </p>
      </div>
    </div>
  );
}

function PasswordStep({ committeeId, hasPassword, onBack, login }) {
  const committee = getCommittee(committeeId);
  const isFirstTime = !hasPassword;

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }
    if (isFirstTime && password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await login(committeeId, password);
      // On success the parent's authStatus flips to signedIn and this
      // screen unmounts on its own — nothing left to do here.
    } catch (err) {
      setError(err.message || 'Could not sign in.');
      setSubmitting(false);
    }
  };

  const onEnter = (e) => {
    if (e.key === 'Enter') submit();
  };

  return (
    <div className="commandSetup">
      <div className="commandSetup__inner loginStep">
        <button
          type="button"
          className="commandGhostBtn loginStep__back"
          onClick={onBack}
        >
          <i className="bi bi-arrow-left" /> Back
        </button>

        <span className="commandSetup__icon loginStep__icon">
          <i className={`bi ${committee.icon}`} />
        </span>
        <h1 className="commandSetup__title">{committee.abbr}</h1>
        <p className="commandSetup__desc">
          {isFirstTime
            ? 'Nobody has signed in to this committee yet. Choose a password now — the dais will use it for the rest of the conference.'
            : "Enter this committee's password."}
        </p>

        <div className="loginStep__fields">
          <input
            type="password"
            className="rosterSearch"
            placeholder="Password"
            value={password}
            autoFocus
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={onEnter}
          />
          {isFirstTime && (
            <input
              type="password"
              className="rosterSearch"
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={onEnter}
            />
          )}
        </div>

        {error && <p className="loginStep__error">{error}</p>}

        <button
          type="button"
          className="submitBtn loginStep__submit"
          onClick={submit}
          disabled={submitting}
        >
          {submitting ? 'Signing in…' : isFirstTime ? 'Set password and continue' : 'Sign in'}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// One-time setup: the committee topic and the roster. Runs exactly once per
// committee, the first time it ever signs in. After today, loadSession()
// always finds this committee's document and skips straight to roll call.
// ---------------------------------------------------------------------------

function RosterSetupScreen({ committee, onContinue }) {
  // Starts empty for the same reason the country roster does: the real topic
  // is whatever the conference assigned, and a pre-filled default is just
  // something to delete first. The default shows as the placeholder instead.
  const [topic, setTopic] = useState('');
  const topicRef = useRef(null);

  // Each roster step calls this once its own checks pass, so the topic gets
  // checked last, here, and the steps don't need to know it exists.
  const finish = (delegates) => {
    const written = topic.trim();
    if (!written) {
      toast.error('Write the committee topic first.');
      topicRef.current?.focus();
      return;
    }
    onContinue(delegates, written);
  };

  return (
    <div className="commandSetup">
      <div className="commandSetup__inner">
        <span className="commandSetup__badge">GAMUN Command</span>
        <h1 className="commandSetup__title">Set up {committee.abbr}</h1>
        <p className="commandSetup__desc">
          {committee.seatKind === SEAT_KIND.COUNTRY
            ? 'Write the committee topic and pick which delegations sit on it. This only happens once, and every session after today goes straight to roll call.'
            : `Write the committee topic and confirm the ${committee.seatLabel.toLowerCase()}s, or add your own. This only happens once.`}
        </p>

        <div className="setupTopic">
          <label
            className="setupTopic__label"
            htmlFor="setupTopic"
          >
            Committee topic
          </label>
          <input
            id="setupTopic"
            ref={topicRef}
            className="rosterSearch"
            placeholder={`e.g. ${committee.defaultTopic}`}
            value={topic}
            maxLength={TOPIC_MAX_LENGTH}
            autoFocus
            onChange={(e) => setTopic(e.target.value)}
          />
          <p className="setupTopic__hint">
            Shown at the top of the console and in the minutes. Click it there to change it later.
          </p>
        </div>

        {committee.seatKind === SEAT_KIND.COUNTRY ? (
          <CountryRosterStep
            committee={committee}
            onContinue={finish}
          />
        ) : (
          <CuratedRosterStep
            committee={committee}
            onContinue={finish}
          />
        )}
      </div>
    </div>
  );
}

// Starts empty. A chair's real roster is whatever their conference assigned,
// which is never the same as a hardcoded default — pre-ticking one just made
// them untick it.
function CountryRosterStep({ committee, onContinue }) {
  const [selected, setSelected] = useState(() => new Set());
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.code === q);
  }, [query]);

  const toggle = (code) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const continueWithSelection = () => {
    const delegates = COUNTRIES.filter((c) => selected.has(c.code)).map((c) => ({
      code: c.code,
      name: c.name,
    }));
    onContinue(delegates);
  };

  return (
    <div className="rosterSetup">
      <div className="rosterSetup__head">
        <input
          className="rosterSearch"
          placeholder="Search countries"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="rosterSetup__count">{selected.size} selected</span>
      </div>

      <ul className="rosterSetup__list">
        {filtered.map((c) => (
          <li key={c.code}>
            <label className="rosterSetup__row">
              <input
                type="checkbox"
                checked={selected.has(c.code)}
                onChange={() => toggle(c.code)}
              />
              <Flag
                code={c.code}
                size={22}
              />
              <span>{c.name}</span>
            </label>
          </li>
        ))}
        {filtered.length === 0 && <li className="commandEmpty">No countries match.</li>}
      </ul>

      <div className="rosterSetup__footer rosterSetup__footer--end">
        <button
          type="button"
          className="submitBtn"
          onClick={continueWithSelection}
          disabled={selected.size === 0}
        >
          Continue with {selected.size} <i className="bi bi-arrow-right" />
        </button>
      </div>
    </div>
  );
}

function CuratedRosterStep({ committee, onContinue }) {
  const [entries, setEntries] = useState(() =>
    committee.roster.map((entry, i) => ({
      id: `seed-${i}`,
      code: entry.code,
      name: entry.name,
      role: entry.role || '',
      photo: entry.photo || '',
    }))
  );

  const remove = (id) => setEntries((prev) => prev.filter((entry) => entry.id !== id));
  const add = (payload) =>
    setEntries((prev) => [...prev, { id: `new-${prev.length}-${Date.now()}`, ...payload }]);

  const continueWithSelection = () => {
    if (entries.length === 0) {
      toast.error('Add at least one seat.');
      return;
    }
    onContinue(entries.map(({ code, name, role, photo }) => ({ code, name, role, photo })));
  };

  return (
    <div className="rosterSetup">
      <div className="rosterSetup__head">
        <span className="rosterSetup__count">{entries.length} seats</span>
      </div>

      <ul className="rosterSetup__curatedList">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="rosterSetup__curatedRow"
          >
            <SeatAvatar
              seat={entry}
              size={30}
            />
            <span className="rosterSetup__curatedText">
              <span>{entry.name}</span>
              {entry.role && <small>{entry.role}</small>}
            </span>
            <button
              type="button"
              onClick={() => remove(entry.id)}
              aria-label="Remove"
            >
              <i className="bi bi-x-lg" />
            </button>
          </li>
        ))}
        {entries.length === 0 && <li className="commandEmpty">No seats yet — add one below.</li>}
      </ul>

      <AddDelegateForm
        committee={committee}
        onAdd={add}
      />

      <div className="rosterSetup__footer rosterSetup__footer--end">
        <button
          type="button"
          className="submitBtn"
          onClick={continueWithSelection}
        >
          Continue with {entries.length} <i className="bi bi-arrow-right" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Top bar
// ---------------------------------------------------------------------------

const SYNC_LABEL = {
  saving: 'Saving…',
  saved: 'Saved',
  error: 'Not saved',
  idle: '',
};

const SYNC_ICON = {
  saving: 'bi-cloud-arrow-up',
  saved: 'bi-cloud-check',
  error: 'bi-cloud-slash',
  idle: 'bi-cloud',
};

function SessionBar({
  session,
  committee,
  counts,
  now,
  syncStatus,
  onTopicChange,
  onSettings,
  onExportMinutes,
  onClose,
  onReopen,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(session.topic);

  useEffect(() => {
    setDraft(session.topic);
  }, [session.topic]);

  const elapsed = session.openedAt ? now - session.openedAt : 0;

  const commit = () => {
    const value = draft.trim();
    if (value && value !== session.topic) onTopicChange(value);
    else setDraft(session.topic);
    setEditing(false);
  };

  return (
    <header className="commandBar">
      <div className="commandBar__identity">
        <span className="commandBar__icon">
          <i className={`bi ${committee.icon}`} />
        </span>
        <div className="commandBar__titles">
          <p className="commandBar__abbr">
            {committee.abbr}
            {committee.tag && <span className="commandBar__tag">{committee.tag}</span>}
          </p>
          {editing ? (
            <input
              className="commandBar__topicInput"
              value={draft}
              maxLength={TOPIC_MAX_LENGTH}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') {
                  setDraft(session.topic);
                  setEditing(false);
                }
              }}
            />
          ) : (
            <button
              type="button"
              className="commandBar__topic"
              onClick={() => setEditing(true)}
              title="Change the agenda"
            >
              {session.topic}
              <i className="bi bi-pencil" />
            </button>
          )}
        </div>
      </div>

      <div className="commandBar__stats">
        <div className={clsx('commandStat', { 'commandStat--bad': !counts.hasQuorum })}>
          <span className="commandStat__value">
            {counts.present}/{counts.total}
          </span>
          <span className="commandStat__label">
            Quorum {counts.hasQuorum ? 'met' : `— ${counts.quorumNeeded}`}
          </span>
        </div>
        <div className="commandStat">
          <span className="commandStat__value">{counts.simpleMajority}</span>
          <span className="commandStat__label">Majority</span>
        </div>
        <div className="commandStat">
          <span className="commandStat__value">{counts.twoThirds}</span>
          <span className="commandStat__label">Two-thirds</span>
        </div>
        <div className="commandStat commandStat--clock">
          <span className="commandStat__value">
            {session.openedAt ? formatClock(elapsed) : '—'}
          </span>
          <span className="commandStat__label">Session time</span>
        </div>
      </div>

      <div className="commandBar__actions">
        {/* Always rendered, hidden when idle. Mounting and unmounting it
            shunted the whole action row sideways twice per save. */}
        <span
          className={clsx('syncBadge', `syncBadge--${syncStatus}`)}
          aria-live="polite"
          title={
            syncStatus === 'error'
              ? 'Could not save to the server — retrying automatically'
              : undefined
          }
        >
          <i className={`bi ${SYNC_ICON[syncStatus]}`} />
          <span className="syncBadge__label">{SYNC_LABEL[syncStatus]}</span>
        </span>

        <button
          type="button"
          className="commandIconBtn"
          onClick={onExportMinutes}
          title="Download minutes"
        >
          <i className="bi bi-download" />
        </button>
        <button
          type="button"
          className="commandIconBtn"
          onClick={onSettings}
          title="Settings"
        >
          <i className="bi bi-sliders" />
        </button>
        {session.phase === 'closed' ? (
          <button
            type="button"
            className="commandGhostBtn"
            onClick={onReopen}
          >
            Reopen session
          </button>
        ) : (
          <button
            type="button"
            className="commandGhostBtn"
            onClick={onClose}
            disabled={session.phase === 'rollcall'}
          >
            Close session
          </button>
        )}
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Roll call
// ---------------------------------------------------------------------------

function RollCall({ session, counts, actions }) {
  const [index, setIndex] = useState(0);
  // A seat removed mid-roll-call would otherwise strand the cursor past the end.
  const safeIndex = Math.min(index, session.delegates.length);
  const delegate = session.delegates[safeIndex] || null;

  const mark = (status) => {
    if (!delegate) return;
    actions.setStatus(delegate.id, status);
    setIndex((i) => Math.min(i + 1, session.delegates.length));
  };

  return (
    <div className="rollCall">
      <div className="rollCall__stage">
        <p className="rollCall__step">
          {Math.min(safeIndex + 1, session.delegates.length)} / {session.delegates.length}
        </p>

        <AnimatePresence mode="wait">
          {delegate ? (
            <motion.div
              className="rollCall__card"
              key={delegate.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.22, ease: EASE }}
            >
              <SeatAvatar
                seat={delegate}
                size={96}
                className="rollCall__flag"
              />
              <p className="rollCall__name">{seatName(delegate)}</p>
              <p className="rollCall__sub">{seatSubtitle(delegate)}</p>
            </motion.div>
          ) : (
            <motion.div
              className="rollCall__card rollCall__card--done"
              key="done"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: EASE }}
            >
              <i className="bi bi-check2-circle" />
              <p className="rollCall__name">Attendance recorded</p>
              <p className="rollCall__sub">
                {counts.present} present · {counts.voting} voting · {counts.absent} absent
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {delegate && (
          <div className="rollCall__actions">
            <button
              type="button"
              className="rollCall__btn rollCall__btn--present"
              onClick={() => mark(ATTENDANCE.PRESENT)}
            >
              Present
            </button>
            <button
              type="button"
              className="rollCall__btn rollCall__btn--voting"
              onClick={() => mark(ATTENDANCE.VOTING)}
            >
              Present and voting
            </button>
            <button
              type="button"
              className="rollCall__btn rollCall__btn--absent"
              onClick={() => mark(ATTENDANCE.ABSENT)}
            >
              Absent
            </button>
          </div>
        )}

        <div className="rollCall__nav">
          <button
            type="button"
            className="commandGhostBtn"
            onClick={() => setIndex(Math.max(0, safeIndex - 1))}
            disabled={safeIndex === 0}
          >
            <i className="bi bi-arrow-left" /> Back
          </button>
          <button
            type="button"
            className="commandGhostBtn"
            onClick={() => setIndex(session.delegates.length)}
          >
            Skip to the end
          </button>
        </div>
      </div>

      <div className="rollCall__side">
        <div className="rollCall__summary">
          <p className="commandPanel__title">Attendance</p>
          <div className="rollCall__counts">
            <span>
              <b>{counts.present}</b> present
            </span>
            <span>
              <b>{counts.voting}</b> present &amp; voting
            </span>
            <span>
              <b>{counts.absent}</b> absent
            </span>
          </div>
          <p className={clsx('rollCall__quorum', { 'rollCall__quorum--bad': !counts.hasQuorum })}>
            {counts.hasQuorum
              ? `Quorum met (needs ${counts.quorumNeeded})`
              : `Quorum needs ${counts.quorumNeeded} seats`}
          </p>
        </div>

        <ul className="rollCall__list">
          {session.delegates.map((d, i) => (
            <li key={d.id}>
              <button
                type="button"
                className={clsx('rollCall__row', {
                  'rollCall__row--active': i === safeIndex,
                  'rollCall__row--absent': d.status === ATTENDANCE.ABSENT,
                })}
                onClick={() => setIndex(i)}
              >
                <SeatAvatar
                  seat={d}
                  size={22}
                />
                <span className="rollCall__rowName">{seatName(d)}</span>
                <span className={clsx('statusPill', `statusPill--${d.status}`)}>
                  {ATTENDANCE_SHORT[d.status]}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="rollCall__bulk">
          <button
            type="button"
            className="commandGhostBtn"
            onClick={() => actions.setAllStatus(ATTENDANCE.PRESENT)}
          >
            Mark all present
          </button>
          <button
            type="button"
            className="submitBtn"
            onClick={actions.openDebate}
            disabled={!counts.hasQuorum}
          >
            Open debate <i className="bi bi-arrow-right" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Roster
// ---------------------------------------------------------------------------

function RosterPanel({ session, committee, counts, actions, onOpenDelegate }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return session.delegates.filter((d) => {
      if (filter === 'present' && d.status === ATTENDANCE.ABSENT) return false;
      if (filter === 'absent' && d.status !== ATTENDANCE.ABSENT) return false;
      if (filter === 'voting' && d.status !== ATTENDANCE.VOTING) return false;
      if (!q) return true;
      return d.name.toLowerCase().includes(q) || d.role.toLowerCase().includes(q);
    });
  }, [session.delegates, query, filter]);

  // The queue button always adds to whichever list the floor is on, so
  // during a moderated caucus it builds the caucus list instead.
  const list = activeList(session);
  const queued = new Set(list.queue.map((e) => e.delegateId));
  const isUnmod = session.floor.mode === FLOOR_MODE.UNMODERATED;

  return (
    <div className="commandPanel">
      <div className="commandPanel__head">
        <p className="commandPanel__title">
          {committee.seatLabel} <span className="commandPanel__count">{counts.total}</span>
        </p>
        <button
          type="button"
          className="commandIconBtn commandIconBtn--sm"
          onClick={() => setAdding((v) => !v)}
          title="New seat"
        >
          <i className={adding ? 'bi bi-x-lg' : 'bi bi-plus-lg'} />
        </button>
      </div>

      <div className="rosterTools">
        <input
          className="rosterSearch"
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="rosterFilters">
          {[
            { id: 'all', label: 'All' },
            { id: 'present', label: 'Present' },
            { id: 'voting', label: 'P&V' },
            { id: 'absent', label: 'Absent' },
          ].map((f) => (
            <button
              type="button"
              key={f.id}
              className={clsx('chip', { 'chip--active': filter === f.id })}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {adding && (
          <motion.div
            key="addDelegate"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: EASE }}
            style={{ overflow: 'hidden' }}
          >
            <AddDelegateForm
              committee={committee}
              onAdd={(payload) => {
                actions.addDelegate(payload);
                setAdding(false);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <ul className="rosterList">
        {filtered.map((delegate) => (
          <li
            className={clsx('rosterRow', {
              'rosterRow--absent': delegate.status === ATTENDANCE.ABSENT,
              'rosterRow--speaking': session.speaker?.delegateId === delegate.id,
            })}
            key={delegate.id}
          >
            <button
              type="button"
              className="rosterRow__main"
              onClick={() => onOpenDelegate(delegate.id)}
            >
              <SeatAvatar
                seat={delegate}
                size={28}
              />
              <span className="rosterRow__text">
                <span className="rosterRow__name">{seatName(delegate)}</span>
                <span className="rosterRow__sub">{seatSubtitle(delegate)}</span>
              </span>
              {committee.rules.veto.includes(delegate.code) && (
                <span
                  className="rosterRow__veto"
                  title="Veto power"
                >
                  P5
                </span>
              )}
            </button>

            <div className="rosterRow__status">
              {[ATTENDANCE.PRESENT, ATTENDANCE.VOTING, ATTENDANCE.ABSENT].map((status) => (
                <button
                  type="button"
                  key={status}
                  className={clsx('statusBtn', `statusBtn--${status}`, {
                    'statusBtn--on': delegate.status === status,
                  })}
                  title={ATTENDANCE_LABELS[status]}
                  onClick={() => actions.setStatus(delegate.id, status)}
                >
                  {ATTENDANCE_SHORT[status]}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="rosterRow__queue"
              disabled={
                delegate.status === ATTENDANCE.ABSENT ||
                queued.has(delegate.id) ||
                isUnmod ||
                !list.open
              }
              title={
                isUnmod
                  ? 'No speakers during an unmoderated caucus'
                  : list.open
                    ? 'Add to the speakers list'
                    : 'The list is closed'
              }
              onClick={() => actions.addSpeaker(delegate.id)}
            >
              <i className={queued.has(delegate.id) ? 'bi bi-check2' : 'bi bi-plus'} />
            </button>
          </li>
        ))}

        {filtered.length === 0 && <li className="commandEmpty">Nothing found.</li>}
      </ul>
    </div>
  );
}

function AddDelegateForm({ committee, onAdd }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [photo, setPhoto] = useState('');
  const [code, setCode] = useState('');
  const [countryQuery, setCountryQuery] = useState('');

  const isCountrySeat = committee.seatKind === SEAT_KIND.COUNTRY;
  const suggestions = searchCountries(countryQuery, 6);

  const pickCountry = (country) => {
    setCode(country.code);
    setCountryQuery(country.name);
    if (isCountrySeat) setName(country.name);
  };

  const submit = () => {
    if (!name.trim()) {
      toast.error('Enter a name');
      return;
    }
    onAdd({ name: name.trim(), role: role.trim(), code, photo: photo.trim() });
    setName('');
    setRole('');
    setPhoto('');
    setCode('');
    setCountryQuery('');
  };

  return (
    <div className="addSeat">
      <div className="addSeat__field">
        <label className="addSeat__label">Country and flag</label>
        <input
          className="rosterSearch"
          placeholder="e.g. France or fr"
          value={countryQuery}
          onChange={(e) => {
            setCountryQuery(e.target.value);
            setCode('');
          }}
        />
        {countryQuery && !code && suggestions.length > 0 && (
          <ul className="addSeat__suggestions">
            {suggestions.map((country) => (
              <li key={country.code}>
                <button
                  type="button"
                  onClick={() => pickCountry(country)}
                >
                  <Flag
                    code={country.code}
                    size={22}
                  />
                  <span>{country.name}</span>
                  <small>{country.code.toUpperCase()}</small>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!isCountrySeat && (
        <>
          <div className="addSeat__field">
            <label className="addSeat__label">
              {committee.seatKind === SEAT_KIND.OUTLET ? 'Outlet' : 'Portfolio'}
            </label>
            <input
              className="rosterSearch"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                committee.seatKind === SEAT_KIND.OUTLET ? 'e.g. Reuters' : 'e.g. John F. Kennedy'
              }
            />
          </div>
          <div className="addSeat__field">
            <label className="addSeat__label">Role</label>
            <input
              className="rosterSearch"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Secretary of State"
            />
          </div>
          <div className="addSeat__field">
            <label className="addSeat__label">Portrait</label>
            <input
              className="rosterSearch"
              value={photo}
              onChange={(e) => setPhoto(e.target.value)}
              placeholder="/mun/hcc/name.jpg"
            />
            <p className="addSeat__hint">Leave empty to show the flag instead.</p>
          </div>
        </>
      )}

      <button
        type="button"
        className="commandGhostBtn commandGhostBtn--full"
        onClick={submit}
      >
        Add seat
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The floor
//
// One stage, one clock, three modes. A caucus is not a second timer bolted
// on top — it changes what the stage is timing and which list is live.
// ---------------------------------------------------------------------------

function FloorPanel({ session, speaker, now, actions }) {
  const [pointDelegate, setPointDelegate] = useState('');

  const mode = session.floor.mode;
  const isMod = mode === FLOOR_MODE.MODERATED;
  const isUnmod = mode === FLOOR_MODE.UNMODERATED;
  const inCaucus = isMod || isUnmod;

  const speechMs = activeSpeechMs(session);
  const remaining = timerRemaining(session.speech, now);
  const progress = timerProgress(session.speech, now);
  const expired = timerExpired(session.speech, now);

  const blockLeft = blockRemaining(session, now);
  const blockRatio = blockProgress(session, now);
  const blockDone = inCaucus && blockLeft === 0;
  const fits = speakersLeftInBlock(session, now);

  const list = activeList(session);
  const available = session.delegates.filter((d) => d.status !== ATTENDANCE.ABSENT);
  const queuedIds = new Set(list.queue.map((e) => e.delegateId));

  return (
    <div className="commandPanel commandPanel--floor">
      <div className="floorStage">
        <div className={clsx('floorStage__ringWrap', { 'floorStage__ringWrap--expired': expired })}>
          <svg
            className="floorStage__ring"
            viewBox="0 0 240 240"
            aria-hidden="true"
          >
            <circle
              className="floorStage__ringTrack"
              cx="120"
              cy="120"
              r={RING_RADIUS}
            />
            <circle
              className="floorStage__ringFill"
              cx="120"
              cy="120"
              r={RING_RADIUS}
              strokeDasharray={RING_LENGTH}
              strokeDashoffset={RING_LENGTH * progress}
            />
          </svg>

          <div className="floorStage__center">
            <AnimatePresence mode="wait">
              <motion.div
                key={isUnmod ? 'unmod' : speaker ? speaker.id : 'empty'}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.22, ease: EASE }}
                className="floorStage__speaker"
              >
                {isUnmod ? (
                  <>
                    <p className="floorStage__clock">{formatClock(remaining)}</p>
                    <p className="floorStage__name">Unmoderated caucus</p>
                    <p className="floorStage__sub">
                      {session.floor.topic || 'Informal consultation'}
                    </p>
                  </>
                ) : speaker ? (
                  <>
                    <SeatAvatar
                      seat={speaker}
                      size={64}
                      className="floorStage__flag"
                    />
                    <p className="floorStage__clock">{formatClock(remaining)}</p>
                    <p className="floorStage__name">{seatName(speaker)}</p>
                    <p className="floorStage__sub">{seatSubtitle(speaker)}</p>
                  </>
                ) : (
                  <>
                    <p className="floorStage__clock floorStage__clock--idle">
                      {formatClock(speechMs)}
                    </p>
                    <p className="floorStage__name">The floor is open</p>
                    <p className="floorStage__sub">
                      {list.queue.length > 0
                        ? 'Press Next to take the first speaker'
                        : 'Add a speaker to the list'}
                    </p>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* The caucus block, sitting under the ring rather than floating
            above it. In a moderated caucus this is a budget, not a clock:
            the speeches spend it, which is what a moderated caucus is. */}
        <AnimatePresence initial={false}>
          {isMod && (
            <motion.div
              key="block"
              className={clsx('floorBlock', { 'floorBlock--done': blockDone })}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: EASE }}
            >
              <div className="floorBlock__head">
                <span className="floorBlock__topic">
                  {session.floor.topic || 'Moderated caucus'}
                </span>
                <b>{formatClock(blockLeft)}</b>
              </div>
              <div className="floorBlock__track">
                <div
                  className="floorBlock__fill"
                  style={{ width: `${Math.max(0, 1 - blockRatio) * 100}%` }}
                />
              </div>
              <p className="floorBlock__meta">
                {blockDone
                  ? 'Caucus time is up'
                  : `Room for about ${fits} more ${fits === 1 ? 'speaker' : 'speakers'}`}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="floorControls">
          <button
            type="button"
            className={clsx('floorControls__play', {
              'floorControls__play--running': session.speech.running,
            })}
            onClick={actions.toggleSpeech}
            disabled={!speaker && !isUnmod}
          >
            <i className={session.speech.running ? 'bi bi-pause-fill' : 'bi bi-play-fill'} />
            <span>{session.speech.running ? 'Pause' : 'Start'}</span>
          </button>

          {!isUnmod && (
            <>
              <button
                type="button"
                className="floorControls__btn"
                onClick={actions.nextSpeaker}
                title="Next speaker (N)"
              >
                <i className="bi bi-skip-forward-fill" />
                <span>Next</span>
              </button>

              <button
                type="button"
                className="floorControls__btn"
                onClick={() => actions.addSpeechTime(15_000)}
                title="Add 15 seconds to this speech"
              >
                <i className="bi bi-plus-lg" />
                <span>15s</span>
              </button>

              <button
                type="button"
                className="floorControls__btn"
                onClick={() => actions.resetSpeech(speechMs)}
                title="Restart this speech"
              >
                <i className="bi bi-arrow-counterclockwise" />
                <span>Reset</span>
              </button>
            </>
          )}

          {inCaucus && (
            <>
              <button
                type="button"
                className="floorControls__btn"
                onClick={() => actions.extendCaucus(60_000)}
                title="Extend the caucus by a minute"
              >
                <i className="bi bi-plus-circle" />
                <span>1 min</span>
              </button>

              <button
                type="button"
                className={clsx('floorControls__btn', 'floorControls__btn--end', {
                  'floorControls__btn--urgent': blockDone,
                })}
                onClick={actions.endCaucus}
                title="End the caucus and return to the speakers list"
              >
                <i className="bi bi-stop-fill" />
                <span>End</span>
              </button>
            </>
          )}
        </div>

        {!isUnmod && (
          <div className="speechPresets">
            <span className="speechPresets__label">Speech length</span>
            {SPEECH_PRESETS.map((ms) => (
              <button
                type="button"
                key={ms}
                className={clsx('chip', { 'chip--active': speechMs === ms })}
                onClick={() => {
                  // Inside a caucus this retargets that caucus, not the
                  // committee's default.
                  if (isMod) actions.setCaucusSpeech(ms);
                  else actions.setSetting('speechMs', ms);
                  actions.resetSpeech(ms);
                }}
              >
                {formatDuration(ms)}
              </button>
            ))}
          </div>
        )}
      </div>

      {isUnmod ? (
        <div className="floorNote">
          <i className="bi bi-people" />
          <p>
            Delegates are in informal consultation. The general speakers list comes back untouched
            when this ends.
          </p>
        </div>
      ) : (
        <div className="queueBlock">
          <div className="queueBlock__head">
            <p className="commandPanel__title">
              {isMod ? 'Caucus speakers' : 'Speakers list'}
              <span className="commandPanel__count">{list.queue.length}</span>
            </p>
            <div className="queueBlock__headActions">
              <button
                type="button"
                className={clsx('chip', { 'chip--active': !list.open })}
                onClick={() => actions.toggleSpeakersList()}
              >
                {list.open ? 'Open' : 'Closed'}
              </button>
              <button
                type="button"
                className="linkBtn"
                onClick={() => actions.clearSpeakers()}
                disabled={list.queue.length === 0}
              >
                Clear
              </button>
            </div>
          </div>

          <select
            className="queueAdd"
            value=""
            disabled={!list.open}
            onChange={(e) => {
              if (!e.target.value) return;
              actions.addSpeaker(e.target.value);
              e.target.value = '';
            }}
          >
            <option value="">Add a speaker…</option>
            {available
              .filter((d) => !queuedIds.has(d.id))
              .map((d) => (
                <option
                  key={d.id}
                  value={d.id}
                >
                  {seatName(d)}
                </option>
              ))}
          </select>

          <ul className="queueList">
            <AnimatePresence initial={false}>
              {list.queue.map((entry, i) => {
                const delegate = session.delegates.find((d) => d.id === entry.delegateId);
                if (!delegate) return null;
                return (
                  <motion.li
                    key={entry.entryId}
                    className="queueRow"
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.18, ease: EASE }}
                  >
                    <span className="queueRow__pos">{i + 1}</span>
                    <SeatAvatar
                      seat={delegate}
                      size={26}
                    />
                    <button
                      type="button"
                      className="queueRow__name"
                      onClick={() => actions.setSpeaker(delegate.id, 'list', speechMs)}
                      title="Give the floor"
                    >
                      {seatName(delegate)}
                    </button>
                    <div className="queueRow__actions">
                      <button
                        type="button"
                        onClick={() => actions.moveSpeaker(entry.entryId, -1)}
                        disabled={i === 0}
                        title="Move up"
                      >
                        <i className="bi bi-chevron-up" />
                      </button>
                      <button
                        type="button"
                        onClick={() => actions.moveSpeaker(entry.entryId, 1)}
                        disabled={i === list.queue.length - 1}
                        title="Move down"
                      >
                        <i className="bi bi-chevron-down" />
                      </button>
                      <button
                        type="button"
                        onClick={() => actions.removeSpeaker(entry.entryId)}
                        title="Remove"
                      >
                        <i className="bi bi-x-lg" />
                      </button>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>

            {list.queue.length === 0 && (
              <li className="commandEmpty">
                {isMod ? 'Nobody has asked to speak yet.' : 'The list is empty.'}
              </li>
            )}
          </ul>

          {isMod && session.lists.gsl.queue.length > 0 && (
            <p className="queueBlock__held">
              {session.lists.gsl.queue.length} on the general list, waiting for this caucus to end
            </p>
          )}
        </div>
      )}

      <div className="pointsBlock">
        <select
          className="queueAdd"
          value={pointDelegate}
          onChange={(e) => setPointDelegate(e.target.value)}
        >
          <option value="">Who is raising the point…</option>
          {available.map((d) => (
            <option
              key={d.id}
              value={d.id}
            >
              {seatName(d)}
            </option>
          ))}
        </select>
        <div className="pointsBlock__row">
          {POINT_TYPES.map((point) => (
            <button
              type="button"
              key={point.id}
              className="pointBtn"
              disabled={!pointDelegate}
              title={point.en}
              onClick={() => {
                actions.raisePoint(point.id, pointDelegate);
                toast(point.label, { icon: <i className={`bi ${point.icon}`} /> });
              }}
            >
              <i className={`bi ${point.icon}`} />
              <span>{point.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Motions
// ---------------------------------------------------------------------------

function MotionsPanel({ session, committee, counts, actions, onGoToVote }) {
  const [typeId, setTypeId] = useState('moderated');
  const [proposerId, setProposerId] = useState('');
  const [topic, setTopic] = useState('');
  const [title, setTitle] = useState('');
  const [totalMs, setTotalMs] = useState(CAUCUS_PRESETS[1]);
  const [speechMs, setSpeechMs] = useState(SPEECH_PRESETS[1]);

  const motionType = getMotionType(typeId);
  const pending = sortedMotions(session.motions);
  const resolved = session.motions.filter((m) => m.status !== 'pending').slice(0, 12);
  const available = session.delegates.filter((d) => d.status !== ATTENDANCE.ABSENT);

  const submit = () => {
    if (!motionType) return;
    if (motionType.fields.includes('topic') && !topic.trim()) {
      toast.error('Enter a topic');
      return;
    }
    if (motionType.fields.includes('title') && !title.trim()) {
      toast.error('Enter a document name');
      return;
    }
    actions.addMotion({
      typeId,
      proposerId: proposerId || null,
      params: {
        topic: topic.trim(),
        title: title.trim(),
        subject: title.trim() || topic.trim(),
        totalMs,
        speechMs,
      },
    });
    setTopic('');
    setTitle('');
  };

  // A passed motion should actually do the thing it asked for — that is the
  // whole point of running the floor from the console instead of a notepad.
  const applyMotion = (motion) => {
    const type = getMotionType(motion.typeId);
    if (!type) return;
    const params = motion.params || {};

    if (type.id === 'moderated' || type.id === 'unmoderated') {
      actions.startCaucus({
        typeId: type.id,
        topic: params.topic,
        totalMs: params.totalMs,
        speechMs: params.speechMs,
        proposerId: motion.proposerId,
      });
    } else if (type.id === 'extend') {
      if (session.floor.mode === FLOOR_MODE.GSL) {
        toast.error('No caucus is running to extend');
        return;
      }
      actions.extendCaucus(params.totalMs);
    } else if (type.id === 'voting' || type.id === 'closure') {
      // Closing debate and moving to a vote are the same act from the
      // console's point of view; the old version only toasted about it.
      actions.openVote({
        kind: 'substantive',
        subject: params.subject || 'Draft resolution',
      });
      onGoToVote();
    } else if (type.id === 'listToggle') {
      actions.toggleSpeakersList();
    } else if (type.id === 'agenda' && params.topic) {
      actions.setTopic(params.topic);
    } else if (type.id === 'introduceDr') {
      actions.addDocument({
        typeId: 'dr',
        title: params.title,
        sponsors: motion.proposerId ? [motion.proposerId] : [],
      });
    } else if (type.id === 'introduceWp') {
      actions.addDocument({
        typeId: 'wp',
        title: params.title,
        sponsors: motion.proposerId ? [motion.proposerId] : [],
      });
    } else if (type.id === 'adjourn') {
      actions.closeSession();
    } else if (type.id === 'suspend') {
      actions.startCaucus({
        typeId: 'unmoderated',
        topic: 'Break',
        totalMs: params.totalMs,
        speechMs: session.settings.speechMs,
        proposerId: motion.proposerId,
      });
    }
  };

  return (
    <div className="motionsPanel">
      <div className="motionForm">
        <select
          className="queueAdd"
          value={typeId}
          onChange={(e) => setTypeId(e.target.value)}
        >
          {MOTION_TYPES.map((m) => (
            <option
              key={m.id}
              value={m.id}
            >
              {m.label}
            </option>
          ))}
        </select>

        {motionType && <p className="motionForm__hint">{motionType.hint}</p>}

        <select
          className="queueAdd"
          value={proposerId}
          onChange={(e) => setProposerId(e.target.value)}
        >
          <option value="">Who is moving…</option>
          {available.map((d) => (
            <option
              key={d.id}
              value={d.id}
            >
              {seatName(d)}
            </option>
          ))}
        </select>

        {motionType?.fields.includes('topic') && (
          <input
            className="rosterSearch"
            placeholder="Caucus topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        )}

        {motionType?.fields.includes('title') && (
          <input
            className="rosterSearch"
            placeholder="Document name, e.g. DR 1.1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        )}

        {motionType?.fields.includes('totalMs') && (
          <div className="presetRow">
            <span className="presetRow__label">Total time</span>
            {CAUCUS_PRESETS.map((ms) => (
              <button
                type="button"
                key={ms}
                className={clsx('chip', { 'chip--active': totalMs === ms })}
                onClick={() => setTotalMs(ms)}
              >
                {formatDuration(ms)}
              </button>
            ))}
          </div>
        )}

        {motionType?.fields.includes('speechMs') && (
          <div className="presetRow">
            <span className="presetRow__label">Per speaker</span>
            {SPEECH_PRESETS.map((ms) => (
              <button
                type="button"
                key={ms}
                className={clsx('chip', { 'chip--active': speechMs === ms })}
                onClick={() => setSpeechMs(ms)}
              >
                {formatDuration(ms)}
              </button>
            ))}
          </div>
        )}

        {/* The one number a chair is always working out in their head. */}
        {motionType?.fields.includes('totalMs') &&
          motionType?.fields.includes('speechMs') &&
          speechMs > 0 && (
            <p className="motionForm__hint">
              That is {Math.floor(totalMs / speechMs)} speakers.
            </p>
          )}

        <button
          type="button"
          className="commandGhostBtn commandGhostBtn--full"
          onClick={submit}
        >
          Raise the motion
        </button>
      </div>

      <div className="motionList">
        <p className="commandPanel__title">
          On the floor <span className="commandPanel__count">{pending.length}</span>
        </p>

        <AnimatePresence initial={false}>
          {pending.map((item, index) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.2, ease: EASE }}
            >
              <MotionCard
                motion={item}
                session={session}
                counts={counts}
                first={index === 0}
                onResolve={(passed, tally) => {
                  actions.resolveMotion(item.id, passed, tally);
                  if (passed) applyMotion(item);
                }}
                onWithdraw={() => actions.withdrawMotion(item.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {pending.length === 0 && <p className="commandEmpty">No motions on the floor.</p>}
      </div>

      {resolved.length > 0 && (
        <div className="motionHistory">
          <p className="commandPanel__title">Decided</p>
          <ul>
            {resolved.map((motion) => {
              const type = getMotionType(motion.typeId);
              return (
                <li
                  key={motion.id}
                  className={clsx('motionHistory__row', `motionHistory__row--${motion.status}`)}
                >
                  <span className="motionHistory__time">{formatTimeOfDay(motion.createdAt)}</span>
                  <span className="motionHistory__label">{type?.short || motion.typeId}</span>
                  <span className="motionHistory__result">
                    {motion.status === 'passed' && 'Passed'}
                    {motion.status === 'failed' && 'Failed'}
                    {motion.status === 'withdrawn' && 'Withdrawn'}
                    {motion.tally && ` ${motion.tally.yes}–${motion.tally.no}`}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function MotionCard({ motion, session, counts, first, onResolve, onWithdraw }) {
  const type = getMotionType(motion.typeId);
  const [yes, setYes] = useState(0);
  const [no, setNo] = useState(0);

  const needed = majorityFor(type, counts);
  const proposer = motion.proposerId
    ? session.delegates.find((d) => d.id === motion.proposerId)
    : null;

  if (!type) return null;

  const chairOnly = type.majority === 'chair';

  return (
    <article className={clsx('motionCard', { 'motionCard--first': first })}>
      <header className="motionCard__head">
        <span className="motionCard__icon">
          <i className={`bi ${type.icon}`} />
        </span>
        <div className="motionCard__titles">
          <p className="motionCard__label">{type.label}</p>
          <p className="motionCard__meta">
            {proposer && (
              <>
                <SeatAvatar
                  seat={proposer}
                  size={18}
                />
                <span>{seatName(proposer)}</span>
              </>
            )}
            {motion.params?.totalMs && type.fields.includes('totalMs') && (
              <span>{formatDuration(motion.params.totalMs)}</span>
            )}
            {motion.params?.speechMs && type.fields.includes('speechMs') && (
              <span>each {formatDuration(motion.params.speechMs)}</span>
            )}
          </p>
        </div>
        {first && <span className="motionCard__first">First in precedence</span>}
      </header>

      {motion.params?.topic && <p className="motionCard__topic">{motion.params.topic}</p>}
      {motion.params?.title && !motion.params?.topic && (
        <p className="motionCard__topic">{motion.params.title}</p>
      )}

      {chairOnly ? (
        <div className="motionCard__chair">
          <p>The chair decides — this is never put to a vote.</p>
          <div className="motionCard__chairBtns">
            <button
              type="button"
              className="voteBtn voteBtn--yes"
              onClick={() => onResolve(true, null)}
            >
              Grant
            </button>
            <button
              type="button"
              className="voteBtn voteBtn--no"
              onClick={() => onResolve(false, null)}
            >
              Deny
            </button>
          </div>
        </div>
      ) : (
        <div className="motionVote">
          <div className="motionVote__counters">
            <Counter
              label="In favour"
              tone="yes"
              value={yes}
              max={counts.present}
              onChange={setYes}
            />
            <Counter
              label="Against"
              tone="no"
              value={no}
              max={counts.present}
              onChange={setNo}
            />
          </div>
          <p className="motionVote__threshold">
            Needs {needed} votes ·{' '}
            {type.majority === 'twoThirds' ? 'Two-thirds' : 'Simple majority'}
          </p>
          <div className="motionVote__actions">
            <button
              type="button"
              className="voteBtn voteBtn--yes"
              onClick={() => onResolve(yes >= needed && yes > no, { yes, no, abstain: 0 })}
            >
              Record the result
            </button>
            <button
              type="button"
              className="linkBtn"
              onClick={onWithdraw}
            >
              Withdraw
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function Counter({ label, value, max, tone, onChange }) {
  return (
    <div className={clsx('counter', `counter--${tone}`)}>
      <span className="counter__label">{label}</span>
      <div className="counter__controls">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          aria-label={`${label} — decrease`}
        >
          <i className="bi bi-dash-lg" />
        </button>
        <span className="counter__value">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          aria-label={`${label} — increase`}
        >
          <i className="bi bi-plus-lg" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Voting
// ---------------------------------------------------------------------------

function VotePanel({ session, committee, actions }) {
  const [subject, setSubject] = useState('');
  const [kind, setKind] = useState('substantive');

  const vote = session.vote;
  const tally = useMemo(() => tallyVote(session, committee), [session, committee]);

  if (committee.rules.voteMode === 'none') {
    return (
      <div className="votePanel">
        <p className="commandEmpty">
          The Press Corps does not vote on resolutions. Procedural motions are in the Motions tab,
          and filed pieces are in Documents.
        </p>
      </div>
    );
  }

  if (!vote) {
    return (
      <div className="votePanel">
        <div className="motionForm">
          <input
            className="rosterSearch"
            placeholder="What is being voted on, e.g. DR 1.1"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <div className="presetRow">
            <button
              type="button"
              className={clsx('chip', { 'chip--active': kind === 'substantive' })}
              onClick={() => setKind('substantive')}
            >
              Substantive
            </button>
            <button
              type="button"
              className={clsx('chip', { 'chip--active': kind === 'procedural' })}
              onClick={() => setKind('procedural')}
            >
              Procedural
            </button>
          </div>
          <button
            type="button"
            className="commandGhostBtn commandGhostBtn--full"
            onClick={() => {
              if (!subject.trim()) {
                toast.error('Enter the question');
                return;
              }
              actions.openVote({ kind, subject: subject.trim() });
              setSubject('');
            }}
          >
            Open the vote
          </button>
        </div>

        {committee.rules.voteMode === 'unsc' && (
          <p className="votePanel__note">
            In the Security Council a substantive decision needs nine of fifteen votes, and a
            permanent member voting against is a veto.
          </p>
        )}
      </div>
    );
  }

  const eligible = session.delegates.filter((d) => d.status !== ATTENDANCE.ABSENT);
  const closed = !!vote.closedAt;
  const result = vote.result;

  return (
    <div className="votePanel">
      <div className="voteBoard">
        <p className="voteBoard__subject">{vote.subject}</p>
        <p className="voteBoard__kind">
          {vote.kind === 'substantive' ? 'Substantive vote' : 'Procedural vote'} ·{' '}
          {tally.thresholdLabel}
        </p>

        <div className="voteBoard__bars">
          {['yes', 'no', 'abstain'].map((key) => {
            const value = tally[key];
            const ratio = tally.eligible ? value / tally.eligible : 0;
            return (
              <div
                className={clsx('voteBar', `voteBar--${key}`)}
                key={key}
              >
                <span className="voteBar__label">{BALLOT_LABELS[key]}</span>
                <div className="voteBar__track">
                  <motion.div
                    className="voteBar__fill"
                    animate={{ width: `${ratio * 100}%` }}
                    transition={{ duration: 0.3, ease: EASE }}
                  />
                </div>
                <span className="voteBar__value">{value}</span>
              </div>
            );
          })}
        </div>

        <p className="voteBoard__pending">
          {closed ? 'Voting is closed' : `Yet to vote: ${tally.pending}`}
        </p>

        {tally.vetoedBy.length > 0 && (
          <p className="voteBoard__veto">
            <i className="bi bi-shield-fill-exclamation" /> Veto: {tally.vetoedBy.join(', ')}
          </p>
        )}

        {closed && result && (
          <div className={clsx('voteResult', { 'voteResult--failed': !result.passed })}>
            <i className={result.passed ? 'bi bi-check-circle-fill' : 'bi bi-x-circle-fill'} />
            <span>{result.passed ? 'Passed' : 'Failed'}</span>
            <small>
              {result.yes}–{result.no}–{result.abstain}
            </small>
          </div>
        )}
      </div>

      {!closed && (
        <ul className="ballotList">
          {eligible.map((delegate) => {
            const ballot = vote.ballots[delegate.id];
            // "Present and voting" gives up the right to abstain on a
            // substantive question — the abstain button is simply not there.
            const canAbstain = !(
              vote.kind === 'substantive' && delegate.status === ATTENDANCE.VOTING
            );
            return (
              <li
                className="ballotRow"
                key={delegate.id}
              >
                <SeatAvatar
                  seat={delegate}
                  size={26}
                />
                <span className="ballotRow__name">{seatName(delegate)}</span>
                {committee.rules.veto.includes(delegate.code) && (
                  <span className="ballotRow__veto">P5</span>
                )}
                <div className="ballotRow__btns">
                  <button
                    type="button"
                    className={clsx('voteBtn voteBtn--yes', { 'voteBtn--on': ballot === 'yes' })}
                    onClick={() => actions.castBallot(delegate.id, ballot === 'yes' ? null : 'yes')}
                  >
                    <i className="bi bi-hand-thumbs-up" />
                  </button>
                  <button
                    type="button"
                    className={clsx('voteBtn voteBtn--no', { 'voteBtn--on': ballot === 'no' })}
                    onClick={() => actions.castBallot(delegate.id, ballot === 'no' ? null : 'no')}
                  >
                    <i className="bi bi-hand-thumbs-down" />
                  </button>
                  <button
                    type="button"
                    className={clsx('voteBtn voteBtn--abstain', {
                      'voteBtn--on': ballot === 'abstain',
                    })}
                    disabled={!canAbstain}
                    title={canAbstain ? 'Abstain' : 'Present and voting cannot abstain'}
                    onClick={() =>
                      actions.castBallot(delegate.id, ballot === 'abstain' ? null : 'abstain')
                    }
                  >
                    <i className="bi bi-dash-lg" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="votePanel__foot">
        {closed ? (
          <button
            type="button"
            className="commandGhostBtn commandGhostBtn--full"
            onClick={actions.clearVote}
          >
            New vote
          </button>
        ) : (
          <button
            type="button"
            className="submitBtn"
            onClick={() => actions.closeVote(tally)}
          >
            Close and record
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

function DocumentsPanel({ session, committee, actions }) {
  const types = docTypesFor(committee.id);
  const [typeId, setTypeId] = useState(types[0]?.id || 'wp');
  const [title, setTitle] = useState('');
  const [sponsorId, setSponsorId] = useState('');

  const available = session.delegates.filter((d) => d.status !== ATTENDANCE.ABSENT);

  const submit = () => {
    if (!title.trim()) {
      toast.error('Enter a title');
      return;
    }
    actions.addDocument({
      typeId,
      title: title.trim(),
      sponsors: sponsorId ? [sponsorId] : [],
    });
    setTitle('');
  };

  return (
    <div className="docsPanel">
      <div className="motionForm">
        <div className="presetRow">
          {types.map((type) => (
            <button
              type="button"
              key={type.id}
              className={clsx('chip', { 'chip--active': typeId === type.id })}
              onClick={() => setTypeId(type.id)}
            >
              <i className={`bi ${type.icon}`} /> {type.label}
            </button>
          ))}
        </div>
        <input
          className="rosterSearch"
          placeholder={
            committee.rules.press ? 'Article headline' : 'e.g. DR 1.1 — Humanitarian corridors'
          }
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <select
          className="queueAdd"
          value={sponsorId}
          onChange={(e) => setSponsorId(e.target.value)}
        >
          <option value="">Lead sponsor…</option>
          {available.map((d) => (
            <option
              key={d.id}
              value={d.id}
            >
              {seatName(d)}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="commandGhostBtn commandGhostBtn--full"
          onClick={submit}
        >
          Add
        </button>
      </div>

      <ul className="docList">
        {session.documents.map((doc) => {
          const type = types.find((t) => t.id === doc.typeId);
          const sponsor = doc.sponsors[0]
            ? session.delegates.find((d) => d.id === doc.sponsors[0])
            : null;
          return (
            <li
              className={clsx('docRow', `docRow--${doc.status}`)}
              key={doc.id}
            >
              <span className="docRow__badge">{type?.short || 'DOC'}</span>
              <div className="docRow__text">
                <p className="docRow__title">{doc.title}</p>
                <p className="docRow__meta">
                  {sponsor && (
                    <>
                      <SeatAvatar
                        seat={sponsor}
                        size={16}
                      />
                      <span>{seatName(sponsor)}</span>
                    </>
                  )}
                  <span>{formatTimeOfDay(doc.createdAt)}</span>
                </p>
              </div>
              <select
                className="docRow__status"
                value={doc.status}
                onChange={(e) => {
                  const status = DOC_STATUS.find((s) => s.id === e.target.value);
                  actions.setDocumentStatus(doc.id, e.target.value, status?.label || '');
                }}
              >
                {DOC_STATUS.map((status) => (
                  <option
                    key={status.id}
                    value={status.id}
                  >
                    {status.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="docRow__remove"
                onClick={() => actions.removeDocument(doc.id)}
                aria-label="Delete"
              >
                <i className="bi bi-trash3" />
              </button>
            </li>
          );
        })}

        {session.documents.length === 0 && (
          <li className="commandEmpty">
            {committee.rules.press ? 'Nothing filed yet.' : 'No documents yet.'}
          </li>
        )}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Minutes
// ---------------------------------------------------------------------------

const LOG_ICONS = {
  session: 'bi-flag',
  roster: 'bi-people',
  gsl: 'bi-list-ol',
  speech: 'bi-mic',
  caucus: 'bi-chat-dots',
  motion: 'bi-hand-index-thumb',
  point: 'bi-exclamation-circle',
  vote: 'bi-check2-square',
  doc: 'bi-file-earmark',
  agenda: 'bi-journal-text',
  note: 'bi-pencil',
};

function LogPanel({ session, actions, onExportMinutes }) {
  const [note, setNote] = useState('');

  const addNote = () => {
    if (!note.trim()) return;
    actions.note(note.trim());
    setNote('');
  };

  return (
    <div className="logPanel">
      <div className="logPanel__compose">
        <input
          className="rosterSearch"
          placeholder="Add a line to the minutes"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addNote();
          }}
        />
        <button
          type="button"
          className="commandIconBtn commandIconBtn--sm"
          onClick={addNote}
          aria-label="Add"
        >
          <i className="bi bi-plus-lg" />
        </button>
      </div>

      <ul className="logList">
        {session.log.map((entry) => (
          <li
            className={clsx('logRow', `logRow--${entry.kind}`)}
            key={entry.id}
          >
            <span className="logRow__time">{formatTimeOfDay(entry.at)}</span>
            <i className={`bi ${LOG_ICONS[entry.kind] || 'bi-dot'}`} />
            <span className="logRow__text">{entry.text}</span>
          </li>
        ))}
        {session.log.length === 0 && <li className="commandEmpty">The minutes are empty.</li>}
      </ul>

      <div className="logPanel__foot">
        <button
          type="button"
          className="commandGhostBtn commandGhostBtn--full"
          onClick={onExportMinutes}
        >
          <i className="bi bi-download" /> Download the minutes
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modals
// ---------------------------------------------------------------------------

function Modal({ title, onClose, children }) {
  return (
    <motion.div
      className="commandModal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <motion.div
        className="commandModal__card"
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.24, ease: EASE }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="commandModal__head">
          <p className="commandModal__title">{title}</p>
          <button
            type="button"
            className="commandIconBtn commandIconBtn--sm"
            onClick={onClose}
            aria-label="Close"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

function DelegateModal({ session, delegate, actions, onClose }) {
  const [note, setNote] = useState(delegate?.note || '');

  useEffect(() => {
    setNote(delegate?.note || '');
  }, [delegate]);

  if (!delegate) return null;

  const save = () => {
    actions.setNote(delegate.id, note);
    toast('Note saved');
    onClose();
  };

  const canTakeFloor = session.floor.mode !== FLOOR_MODE.UNMODERATED;

  return (
    <Modal
      title={seatName(delegate)}
      onClose={onClose}
    >
      <div className="delegateModal">
        <div className="delegateModal__head">
          <SeatAvatar
            seat={delegate}
            size={72}
          />
          <div>
            <p className="delegateModal__name">{seatName(delegate)}</p>
            <p className="delegateModal__sub">{seatSubtitle(delegate)}</p>
            <span className={clsx('statusPill', `statusPill--${delegate.status}`)}>
              {ATTENDANCE_LABELS[delegate.status]}
            </span>
          </div>
        </div>

        <div className="delegateModal__stats">
          <div>
            <span>{delegate.speeches}</span>
            <small>Speeches</small>
          </div>
          <div>
            <span>{formatDuration(delegate.speakingMs)}</span>
            <small>Total time</small>
          </div>
          <div>
            <span>{delegate.points}</span>
            <small>Points</small>
          </div>
        </div>

        <label className="addSeat__label">Chair’s notes</label>
        <textarea
          className="delegateModal__note"
          rows={4}
          value={note}
          placeholder="For awards: argument, diplomacy, role in the bloc…"
          onChange={(e) => setNote(e.target.value)}
        />

        <div className="delegateModal__actions">
          <button
            type="button"
            className="linkBtn linkBtn--danger"
            onClick={() => {
              actions.removeDelegate(delegate.id);
              onClose();
            }}
          >
            Remove from roster
          </button>
          <div className="delegateModal__right">
            <button
              type="button"
              className="commandGhostBtn"
              disabled={!canTakeFloor}
              title={canTakeFloor ? undefined : 'Nobody holds the floor during an unmoderated caucus'}
              onClick={() => {
                actions.setSpeaker(delegate.id, 'chair', activeSpeechMs(session));
                onClose();
              }}
            >
              Give the floor
            </button>
            <button
              type="button"
              className="submitBtn"
              onClick={save}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function SettingsModal({ session, actions, resetSession, logout, onClose, onExportJson }) {
  const committee = getCommittee(session.committeeId);
  const [resetting, setResetting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleReset = async () => {
    setResetting(true);
    const success = await resetSession();
    setResetting(false);
    if (success) {
      onClose();
      toast(`${committee.abbr} — session reset`);
    } else {
      toast.error('Could not reset the session — check your connection and try again.');
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await logout();
    // No onClose() call needed: signing out unmounts this whole tree, since
    // the page drops straight back to the sign-in screen.
  };

  return (
    <Modal
      title="Settings"
      onClose={onClose}
    >
      <div className="settingsModal">
        <label className="settingsRow">
          <span>
            Chime
            <small>Two notes sound when the time runs out</small>
          </span>
          <input
            type="checkbox"
            checked={session.settings.chime}
            onChange={(e) => actions.setSetting('chime', e.target.checked)}
          />
        </label>

        <label className="settingsRow">
          <span>
            Auto-pause
            <small>The clock stops itself when the time runs out</small>
          </span>
          <input
            type="checkbox"
            checked={session.settings.autoPause}
            onChange={(e) => actions.setSetting('autoPause', e.target.checked)}
          />
        </label>

        <div className="settingsRow settingsRow--column">
          <span>
            Quorum
            <small>Share of the roster that must be present to open debate</small>
          </span>
          <div className="presetRow">
            {[0.25, 0.33, 0.5, 0.6].map((ratio) => (
              <button
                type="button"
                key={ratio}
                className={clsx('chip', {
                  'chip--active': Math.abs(session.settings.quorumRatio - ratio) < 0.01,
                })}
                onClick={() => actions.setSetting('quorumRatio', ratio)}
              >
                {Math.round(ratio * 100)}%
              </button>
            ))}
          </div>
        </div>

        <div className="settingsShortcuts">
          <p className="addSeat__label">Keyboard</p>
          <ul>
            <li>
              <kbd>Space</kbd> start and pause the clock
            </li>
            <li>
              <kbd>N</kbd> next speaker
            </li>
            <li>
              <kbd>+</kbd> / <kbd>−</kbd> add or remove 15 seconds
            </li>
            <li>
              <kbd>Esc</kbd> close the dialog
            </li>
          </ul>
        </div>

        <div className="settingsModal__danger">
          <button
            type="button"
            className="commandGhostBtn"
            onClick={onExportJson}
          >
            Export session
          </button>
          <button
            type="button"
            className="linkBtn linkBtn--danger"
            onClick={handleReset}
            disabled={resetting}
          >
            {resetting ? 'Resetting…' : 'Reset session'}
          </button>
        </div>

        <div className="settingsModal__signout">
          <button
            type="button"
            className="commandGhostBtn commandGhostBtn--full"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            <i className="bi bi-box-arrow-right" />{' '}
            {signingOut ? 'Signing out…' : `Sign out of ${committee.abbr}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}