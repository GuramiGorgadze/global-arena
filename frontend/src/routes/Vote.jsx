import { useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { getVotingState, castVote } from '../api/voting';
import VoteResults from './VoteResults';

const EMAIL_KEY = 'vote:email:v1';
const POLL_MS = 3000;

const CHOICES = [
  { id: 'yes', label: 'მომხრე' },
  { id: 'no', label: 'წინააღმდეგი' },
  { id: 'abstain', label: 'თავი შეიკავა' },
];
const labelOf = (id) => CHOICES.find((c) => c.id === id)?.label;

const readEmail = () => {
  try {
    return localStorage.getItem(EMAIL_KEY) || '';
  } catch {
    return '';
  }
};

const writeEmail = (value) => {
  try {
    if (value) localStorage.setItem(EMAIL_KEY, value);
    else localStorage.removeItem(EMAIL_KEY);
  } catch {}
};

export default function Vote() {
  const [email, setEmail] = useState(readEmail);
  const [voter, setVoter] = useState(null); // verified email
  const [state, setState] = useState(null); // { resolution, myVote, history }
  const [choice, setChoice] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // Once a closed resolution's result has been seen, the delegate can
  // collapse it back to the plain waiting placeholder instead of it sitting
  // on screen until the next vote opens.
  const [dismissed, setDismissed] = useState(false);

  const refresh = useCallback(async (who) => {
    setState(await getVotingState(who));
  }, []);

  // A delegate who already signed in on this device lands straight back in.
  useEffect(() => {
    const saved = readEmail();
    if (!saved) return;
    refresh(saved)
      .then(() => setVoter(saved))
      .catch(() => {});
  }, [refresh]);

  useEffect(() => {
    if (!voter) return undefined;
    const id = setInterval(() => {
      if (!document.hidden) refresh(voter).catch(() => {});
    }, POLL_MS);
    return () => clearInterval(id);
  }, [voter, refresh]);

  const resolution = state?.resolution ?? null;
  const resolutionId = resolution?.id;
  const history = state?.history ?? [];

  useEffect(() => {
    setChoice(null);
    setDismissed(false);
  }, [resolutionId]);

  const identify = async (e) => {
    e.preventDefault();
    const who = email.trim().toLowerCase();
    setBusy(true);
    setError('');
    try {
      await refresh(who);
      writeEmail(who);
      setVoter(who);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const leave = () => {
    writeEmail('');
    setVoter(null);
    setState(null);
    setEmail('');
  };

  const submit = async () => {
    setBusy(true);
    try {
      const { myVote } = await castVote(voter, resolutionId, choice);
      setState((s) => ({ ...s, myVote }));
    } catch (err) {
      toast.error(err.message);
      refresh(voter).catch(() => {});
    } finally {
      setBusy(false);
    }
  };

  const showWaiting = voter && (!resolution || dismissed);

  return (
    <main className="vote">
      <div className="vote__card">
        <p className="vote__badge">GAMUN 2026 · კენჭისყრა</p>

        {!voter && (
          <form
            onSubmit={identify}
            className="vote__form"
          >
            <div className="formGroup">
              <label
                className="formLabel"
                htmlFor="voteEmail"
              >
                ელ. ფოსტა
              </label>
              <input
                id="voteEmail"
                type="email"
                className={clsx('formInput', { error })}
                placeholder="შეიყვანეთ ელ. ფოსტა"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              {error && (
                <p
                  className="formError"
                  role="alert"
                >
                  {error}
                </p>
              )}
            </div>
            <button
              type="submit"
              className="submitBtn"
              disabled={busy || !email.trim()}
            >
              {busy ? 'მოწმდება...' : 'გაგრძელება'}
            </button>
          </form>
        )}

        {showWaiting && <p className="vote__note">ველოდებით კენჭისყრის დაწყებას…</p>}

        {voter && resolution && !dismissed && (
          <>
            <div>
              {resolution.committee && <p className="vote__meta">{resolution.committee}</p>}
              <h1 className="vote__title">{resolution.title}</h1>
            </div>

            {resolution.status === 'open' && !state.myVote && (
              <>
                <div className="vote__choices">
                  {CHOICES.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      className={clsx('vote__choice', { 'vote__choice--on': choice === c.id })}
                      onClick={() => setChoice(c.id)}
                      disabled={busy}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="submitBtn"
                  onClick={submit}
                  disabled={!choice || busy}
                >
                  {busy ? 'იგზავნება...' : 'ხმის მიცემა'}
                </button>
                <p className="vote__note">არჩევანი საბოლოოა</p>
              </>
            )}

            {resolution.status === 'open' && state.myVote && (
              <>
                <p>
                  თქვენი ხმა დაფიქსირდა: <strong>{labelOf(state.myVote)}</strong>
                </p>
                <p className="vote__note">ველოდებით შედეგს…</p>
              </>
            )}

            {resolution.status === 'closed' && (
              <>
                <p className="vote__meta">კენჭისყრა დასრულდა</p>
                <VoteResults
                  choices={CHOICES}
                  tally={resolution.tally}
                />
                {state.myVote && <p className="vote__note">თქვენი ხმა: {labelOf(state.myVote)}</p>}
                <button
                  type="button"
                  className="vote__link"
                  onClick={() => setDismissed(true)}
                >
                  დახურვა
                </button>
              </>
            )}
          </>
        )}

        {voter && (
          <button
            type="button"
            className="vote__link"
            onClick={leave}
          >
            სხვა ელ. ფოსტა
          </button>
        )}
      </div>
    </main>
  );
}