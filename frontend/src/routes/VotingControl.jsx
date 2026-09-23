import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { getAdminVotingState, openVoting, closeVoting } from '../api/voting';

const CHAIR_KEY_STORAGE = 'vote:chairKey:v1';
const POLL_MS = 4000;

const CHOICES = [
  { id: 'yes', label: 'მომხრე' },
  { id: 'no', label: 'წინააღმდეგი' },
  { id: 'abstain', label: 'თავი შეიკავა' },
];

// Same committee list as the registration form, so a resolution's committee
// always matches one of the committees delegates actually registered under.
const COMMITTEES = [
  { id: 'unsc', name: 'UNSC' },
  { id: 'specpol', name: 'SPECPOL' },
  { id: 'unhrc', name: 'UNHRC' },
  { id: 'hcc', name: 'HCC' },
  { id: 'disec', name: 'DISEC (ENG)' },
  { id: 'presscorps', name: 'Press Corps' },
];

// sessionStorage rather than localStorage: this is a shared secret, not a
// per-device convenience, so it should not outlive the tab.
const readKey = () => {
  try {
    return sessionStorage.getItem(CHAIR_KEY_STORAGE) || '';
  } catch {
    return '';
  }
};

const writeKey = (value) => {
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

export default function VotingControl() {
  const [chairKey, setChairKey] = useState(readKey);
  const [keyInput, setKeyInput] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [keyError, setKeyError] = useState('');

  const [state, setState] = useState(null); // { resolution, tally, votesCast, history }
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [committee, setCommittee] = useState('');
  const [eligibleCount, setEligibleCount] = useState('');
  const [opening, setOpening] = useState(false);
  const [confirmingReopen, setConfirmingReopen] = useState(false);

  const [closing, setClosing] = useState(false);
  const [confirmingClose, setConfirmingClose] = useState(false);

  const pollRef = useRef(null);

  const refresh = useCallback(async (key) => {
    try {
      const data = await getAdminVotingState(key);
      setState(data);
      return data;
    } catch (err) {
      // A wrong or revoked key surfaces as a failed request — drop back to
      // the gate rather than polling against a key that no longer works.
      writeKey('');
      setChairKey('');
      setState(null);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!chairKey) return undefined;
    refresh(chairKey).catch(() => {});
    pollRef.current = setInterval(() => {
      if (!document.hidden) refresh(chairKey).catch(() => {});
    }, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [chairKey, refresh]);

  const resolution = state?.resolution ?? null;
  const isOpen = resolution?.status === 'open';
  const history = state?.history ?? [];

  // A stale confirmation ("are you sure?") shouldn't linger once the thing
  // it was confirming has already happened, e.g. via another chair's tab.
  useEffect(() => {
    setConfirmingClose(false);
    setConfirmingReopen(false);
  }, [resolution?.id, resolution?.status]);

  const unlock = async (e) => {
    e.preventDefault();
    const key = keyInput.trim();
    if (!key) return;
    setUnlocking(true);
    setKeyError('');
    try {
      await refresh(key);
      writeKey(key);
      setChairKey(key);
      setKeyInput('');
    } catch (err) {
      setKeyError(err.message);
    } finally {
      setUnlocking(false);
    }
  };

  // This only forgets the key on this tab — the key itself doesn't change
  // and still works next time, so it's a logout, not a key rotation.
  const logout = () => {
    clearInterval(pollRef.current);
    writeKey('');
    setChairKey('');
    setState(null);
    setLoading(true);
  };

  const submitOpen = async (e) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error('სათაური სავალდებულოა');
      return;
    }
    const countNum = Number(eligibleCount);
    if (eligibleCount === '' || !Number.isFinite(countNum) || countNum < 0) {
      toast.error('დელეგატების რაოდენობა სავალდებულოა');
      return;
    }
    if (isOpen && !confirmingReopen) {
      setConfirmingReopen(true);
      return;
    }
    setOpening(true);
    try {
      await openVoting(chairKey, {
        title: trimmedTitle,
        committee,
        eligibleCount: countNum,
      });
      toast.success('კენჭისყრა გაიხსნა');
      setTitle('');
      setCommittee('');
      setEligibleCount('');
      setConfirmingReopen(false);
      await refresh(chairKey);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setOpening(false);
    }
  };

  const submitClose = async () => {
    if (!confirmingClose) {
      setConfirmingClose(true);
      return;
    }
    setClosing(true);
    try {
      await closeVoting(chairKey);
      toast.success('კენჭისყრა დაიხურა');
      setConfirmingClose(false);
      await refresh(chairKey);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setClosing(false);
    }
  };

  return (
    <main className="votingControl">
      <div className="votingControl__card">
        <p className="votingControl__badge">GAMUN 2026 · კენჭისყრა</p>

        {!chairKey && (
          <form
            onSubmit={unlock}
            className="votingControl__gate"
          >
            <div className="formGroup">
              <label
                className="formLabel"
                htmlFor="chairKey"
              >
                შეიყვანეთ პაროლი
              </label>
              <input
                id="chairKey"
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
              {unlocking ? 'მოწმდება...' : 'შესვლა'}
            </button>
          </form>
        )}

        {chairKey && (
          <>
            {loading ? (
              <p className="votingControl__note">იტვირთება...</p>
            ) : (
              <>
                <div className="votingControl__status">
                  {resolution ? (
                    <>
                      <div className="votingControl__statusRow">
                        <span
                          className={`votingControl__statusPill votingControl__statusPill--${resolution.status}`}
                        >
                          {resolution.status === 'open' ? 'ღიაა' : 'დასრულებულია'}
                        </span>
                        {resolution.committee && (
                          <span className="votingControl__committee">{resolution.committee}</span>
                        )}
                      </div>
                      <h3 className="votingControl__title">{resolution.title}</h3>
                      <p className="votingControl__meta">
                        {turnoutText(state.votesCast, resolution.eligibleCount)}
                        {formatDateTime(resolution.closedAt) &&
                          ` · დაიხურა ${formatDateTime(resolution.closedAt)}`}
                      </p>
                      <div className="votingControl__tally">
                        {CHOICES.map((c) => (
                          <div
                            key={c.id}
                            className="votingControl__tallyItem"
                          >
                            <strong>{state.tally?.[c.id] ?? 0}</strong>
                            <span>{c.label}</span>
                          </div>
                        ))}
                      </div>
                      {isOpen && (
                        <motion.button
                          type="button"
                          className="submitBtn votingControl__closeBtn"
                          onClick={submitClose}
                          disabled={closing}
                          whileHover={!closing ? { y: -2 } : {}}
                          whileTap={!closing ? { scale: 0.97, y: 0 } : {}}
                        >
                          {closing
                            ? 'იხურება...'
                            : confirmingClose
                              ? 'დარწმუნებული ხართ? დააჭირეთ თავიდან დასახურად'
                              : 'კენჭისყრის დახურვა'}
                        </motion.button>
                      )}
                    </>
                  ) : (
                    <p className="votingControl__note">კენჭისყრა ჯერ არ დაწყებულა.</p>
                  )}
                </div>

                {history.length > 0 && (
                  <div className="votingControl__history">
                    <p className="votingControl__note">წინა კენჭისყრები</p>
                    {history.map((h) => (
                      <div
                        key={h.id}
                        className="votingControl__historyItem"
                      >
                        <div className="votingControl__statusRow">
                          {h.committee && (
                            <span className="votingControl__committee">{h.committee}</span>
                          )}
                        </div>
                        <h4 className="votingControl__title">{h.title}</h4>
                        <p className="votingControl__meta">
                          {turnoutText(h.votesCast, h.eligibleCount)}
                          {formatDateTime(h.closedAt) && ` · დაიხურა ${formatDateTime(h.closedAt)}`}
                        </p>
                        <div className="votingControl__tally">
                          {CHOICES.map((c) => (
                            <div
                              key={c.id}
                              className="votingControl__tallyItem"
                            >
                              <strong>{h.tally?.[c.id] ?? 0}</strong>
                              <span>{c.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="formDivider">
                  <span>ახალი კენჭისყრის დაწყება</span>
                </div>
                <form
                  onSubmit={submitOpen}
                  className="votingControl__openForm"
                >
                  {isOpen && (
                    <p className="formNote votingControl__warning">
                      ახალი კენჭისყრის დაწყება ავტომატურად დახურავს მიმდინარეს.
                    </p>
                  )}
                  <div className="formGroup">
                    <label
                      className="formLabel"
                      htmlFor="resTitle"
                    >
                      რეზოლუციის სათაური <span className="formLabel__req">*</span>
                    </label>
                    <input
                      id="resTitle"
                      type="text"
                      className="formInput"
                      placeholder="მაგ. რეზოლუცია A/RES/1"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={200}
                    />
                  </div>
                  <div className="formGroup">
                    <label
                      className="formLabel"
                      htmlFor="resCommittee"
                    >
                      კომიტეტი
                    </label>
                    <select
                      id="resCommittee"
                      className="formSelect"
                      value={committee}
                      onChange={(e) => setCommittee(e.target.value)}
                    >
                      <option value="">აირჩიეთ კომიტეტი…</option>
                      {COMMITTEES.map((c) => (
                        <option
                          key={c.id}
                          value={c.name}
                        >
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="formGroup">
                    <label
                      className="formLabel"
                      htmlFor="resEligibleCount"
                    >
                      დელეგატების რაოდენობა <span className="formLabel__req">*</span>
                    </label>
                    <input
                      id="resEligibleCount"
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      className="formInput"
                      placeholder="მაგ. 120"
                      value={eligibleCount}
                      onChange={(e) => setEligibleCount(e.target.value)}
                    />
                  </div>
                  <motion.button
                    type="submit"
                    className="submitBtn"
                    disabled={opening || !title.trim() || eligibleCount === ''}
                    whileHover={!opening ? { y: -2 } : {}}
                    whileTap={!opening ? { scale: 0.97, y: 0 } : {}}
                  >
                    {opening
                      ? 'იხსნება...'
                      : isOpen && confirmingReopen
                        ? 'დარწმუნებული ხართ? დააჭირეთ ახლის დასაწყებად'
                        : isOpen
                          ? 'ახლის დაწყება (მიმდინარეს დახურავს)'
                          : 'კენჭისყრის დაწყება'}
                  </motion.button>
                </form>
              </>
            )}

            <button
              type="button"
              className="votingControl__lock"
              onClick={logout}
            >
              გასვლა
            </button>
          </>
        )}
      </div>
    </main>
  );
}
