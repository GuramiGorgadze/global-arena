import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAdminVotingState } from '../api/voting';
import VoteResults from './VoteResults';

// Same sessionStorage key VotingControl.jsx uses, on purpose: a chair who
// already unlocked the control panel in this browser tab lands straight on
// the big screen too, without re-typing the key.
const CHAIR_KEY_STORAGE = 'vote:chairKey:v1';
const POLL_MS = 4000;
const CLOCK_MS = 15000;

const CHOICES = [
  { id: 'yes', label: 'მომხრე' },
  { id: 'no', label: 'წინააღმდეგი' },
  { id: 'abstain', label: 'თავი შეიკავა' },
];

const readStoredKey = () => {
  try {
    return sessionStorage.getItem(CHAIR_KEY_STORAGE) || '';
  } catch {
    return '';
  }
};

const writeStoredKey = (value) => {
  try {
    if (value) sessionStorage.setItem(CHAIR_KEY_STORAGE, value);
    else sessionStorage.removeItem(CHAIR_KEY_STORAGE);
  } catch {}
};

const formatDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString('ka-GE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    : null;

const turnoutText = (votesCast, eligibleCount) =>
  typeof eligibleCount === 'number'
    ? `ხმა მისცა ${votesCast} დელეგატმა ${eligibleCount}-დან`
    : `ხმა მისცა ${votesCast} დელეგატმა`;

// Public MUN etiquette, not just a UI nicety: while a vote is open, this
// screen deliberately shows that voting is underway and how many people
// have voted, but not the yes/no/abstain breakdown, so nobody in the room
// can vote-by-consensus off the running board. The full tally only appears
// once the chair closes the resolution. If this room prefers a live count
// while open, swap the `isOpen` branch below for the same VoteResults call
// used in the closed branch.
export default function VotingScreen() {
  const [searchParams] = useSearchParams();
  const urlKey = searchParams.get('key');

  const [chairKey, setChairKey] = useState(() => urlKey || readStoredKey());
  const [keyInput, setKeyInput] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [keyError, setKeyError] = useState('');

  const [state, setState] = useState(null); // { resolution, votesCast, history }
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [now, setNow] = useState(() => new Date());

  const refresh = useCallback(
    async (key) => {
      try {
        const data = await getAdminVotingState(key);
        setState(data);
        setFetchError('');
        return data;
      } catch (err) {
        // A key typed into the manual gate is this tab's only credential,
        // so a failure there drops back to the gate, same as the control
        // panel. A key baked into the kiosk URL is meant to be permanent —
        // there's no keyboard on the TV to re-type it — so it stays on
        // screen as a visible error an operator can act on instead.
        if (!urlKey) {
          writeStoredKey('');
          setChairKey('');
        }
        setState(null);
        setFetchError(err.message || 'მონაცემების ჩატვირთვა ვერ მოხერხდა');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [urlKey]
  );

  useEffect(() => {
    if (!chairKey) return undefined;
    refresh(chairKey).catch(() => {});
    const id = setInterval(() => refresh(chairKey).catch(() => {}), POLL_MS);
    return () => clearInterval(id);
  }, [chairKey, refresh]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), CLOCK_MS);
    return () => clearInterval(id);
  }, []);

  const unlock = async (e) => {
    e.preventDefault();
    const key = keyInput.trim();
    if (!key) return;
    setUnlocking(true);
    setKeyError('');
    try {
      await refresh(key);
      writeStoredKey(key);
      setChairKey(key);
      setKeyInput('');
    } catch (err) {
      setKeyError(err.message);
    } finally {
      setUnlocking(false);
    }
  };

  const resetScreen = () => {
    writeStoredKey('');
    setChairKey('');
    setState(null);
    setLoading(true);
    setFetchError('');
  };

  const resolution = state?.resolution ?? null;
  const isOpen = resolution?.status === 'open';

  // Most-recent closed resolution, shown while the board is otherwise idle
  // so the room isn't staring at a blank screen between votes. Assumes
  // history is returned newest-first, matching how VotingControl renders it.
  const latestClosed = useMemo(
    () => (!resolution ? ((state?.history ?? [])[0] ?? null) : null),
    [resolution, state]
  );

  const clockText = now.toLocaleTimeString('ka-GE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <main className="votingScreen">
      <header className="votingScreen__header">
        <p className="votingScreen__badge">GAMUN 2026 · კენჭისყრა</p>
        <p className="votingScreen__clock">{clockText}</p>
      </header>

      {!chairKey && (
        <div className="votingScreen__gateWrap">
          <form
            onSubmit={unlock}
            className="votingScreen__gate"
          >
            <p className="votingScreen__gateTitle">ეკრანის გასაშვებად შეიყვანეთ პაროლი</p>
            <div className="formGroup">
              <label
                className="formLabel"
                htmlFor="screenKey"
              >
                შეიყვანეთ პაროლი
              </label>
              <input
                id="screenKey"
                type="password"
                className="formInput"
                placeholder="x-chair-key"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                autoComplete="off"
              />
              {keyError && (
                <p
                  className="formError"
                  role="alert"
                >
                  {keyError}
                </p>
              )}
            </div>
            <button
              type="submit"
              className="submitBtn"
              disabled={unlocking || !keyInput.trim()}
            >
              {unlocking ? 'მოწმდება...' : 'გაშვება'}
            </button>
          </form>
        </div>
      )}

      {chairKey && (
        <div
          className="votingScreen__stage"
          aria-live="polite"
        >
          {loading && !state ? (
            <p className="votingScreen__note">იტვირთება...</p>
          ) : fetchError && !state ? (
            <p className="votingScreen__note votingScreen__note--error">
              {fetchError} — შეამოწმეთ ბმული ან პაროლი.
            </p>
          ) : resolution ? (
            <div
              key={`${resolution.id}-${resolution.status}`}
              className="votingScreen__vote"
            >
              <div className="votingScreen__statusRow">
                <span
                  className={`votingScreen__statusPill votingScreen__statusPill--${resolution.status}`}
                >
                  {resolution.status === 'open' ? 'ღიაა' : 'დასრულებულია'}
                </span>
                {resolution.committee && (
                  <span className="votingScreen__committee">{resolution.committee}</span>
                )}
              </div>

              <h1 className="votingScreen__title">{resolution.title}</h1>

              {isOpen ? (
                <p className="votingScreen__turnout">
                  {turnoutText(state.votesCast, resolution.eligibleCount)}
                </p>
              ) : (
                <>
                  <VoteResults
                    choices={CHOICES}
                    tally={state.tally}
                  />
                  {formatDateTime(resolution.closedAt) && (
                    <p className="votingScreen__closedAt">
                      დაიხურა {formatDateTime(resolution.closedAt)}
                    </p>
                  )}
                </>
              )}
            </div>
          ) : (
            <div
              key="idle"
              className="votingScreen__idle"
            >
              <span
                className="votingScreen__idleDot"
                aria-hidden="true"
              />
              <p className="votingScreen__idleText">ველოდებით კენჭისყრის დაწყებას</p>

              {latestClosed && (
                <div className="votingScreen__lastResult">
                  <p className="votingScreen__lastResultLabel">ბოლო შედეგი</p>
                  {latestClosed.committee && (
                    <span className="votingScreen__committee">{latestClosed.committee}</span>
                  )}
                  <h2 className="votingScreen__title votingScreen__title--sub">
                    {latestClosed.title}
                  </h2>
                  <VoteResults
                    choices={CHOICES}
                    tally={latestClosed.tally}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {chairKey && !urlKey && (
        <button
          type="button"
          className="votingScreen__reset"
          onClick={resetScreen}
        >
          გასვლა
        </button>
      )}
    </main>
  );
}
