import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { getMarathonStatus, getMarathonQuestions, submitMarathonResult } from '../api/marathon';

const EASE = [0.22, 1, 0.36, 1];
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const DRAFT_KEY = 'marathon:draft:v1';
const FALLBACK_DURATION_MS = 5 * 60 * 1000;
const OPTION_LETTERS = ['ა', 'ბ', 'გ', 'დ'];

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const fadeUpItem = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

function pad2(n) {
  return String(Math.max(0, n)).padStart(2, '0');
}

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function formatClock(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${pad2(minutes)}:${pad2(seconds)}`;
}

function formatElapsed(ms) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds} წამი`;
  return `${minutes} წუთი ${seconds} წამი`;
}

function formatStartLabel(startsAtMs) {
  try {
    return new Intl.DateTimeFormat('ka-GE', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Tbilisi',
    }).format(new Date(startsAtMs));
  } catch {
    return new Date(startsAtMs).toISOString();
  }
}

// Converts a /status or /questions response into local timing state,
// including a client/server clock offset so the countdown and the
// in-quiz timer stay accurate even if the visitor's device clock is off.
function parseConfig({ startsAt, durationMs, questionCount, serverNow }) {
  const startsAtMs = new Date(startsAt).getTime();
  const serverNowMs = new Date(serverNow).getTime();
  return {
    startsAtMs,
    durationMs: durationMs || FALLBACK_DURATION_MS,
    questionCount: questionCount || 0,
    offsetMs: serverNowMs - Date.now(),
  };
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveDraft(data) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  } catch {
    // best-effort only
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // best-effort only
  }
}

export default function Marathon() {
  const [phase, setPhase] = useState('loading');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [identifying, setIdentifying] = useState(false);
  const [identifiedEmail, setIdentifiedEmail] = useState('');

  const [config, setConfig] = useState(null);
  const [offsetMs, setOffsetMs] = useState(0);
  const [now, setNow] = useState(Date.now());

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [result, setResult] = useState(null);
  const [alreadyResult, setAlreadyResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const autoLoadTriggeredRef = useRef(false);
  const autoSubmitTriggeredRef = useRef(false);
  const submittingRef = useRef(false);

  // Prefill email from a previous session, if any.
  useEffect(() => {
    const draft = loadDraft();
    if (draft?.email) setEmail(draft.email);
  }, []);

  // Tick the clock for the countdown / in-quiz timer.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  // Initial load: fetch timing config so we can render a countdown teaser
  // even before the delegate identifies themselves.
  useEffect(() => {
    (async () => {
      try {
        const data = await getMarathonStatus();
        const cfg = parseConfig(data);
        setConfig(cfg);
        setOffsetMs(cfg.offsetMs);
        setPhase('identify');
      } catch (err) {
        setErrorMsg(err.message);
        setPhase('error');
      }
    })();
  }, []);

  const loadQuestions = useCallback(async (forEmail) => {
    setPhase('loadingQuestions');
    try {
      const data = await getMarathonQuestions();
      const cfg = parseConfig({
        startsAt: data.startsAt,
        durationMs: data.durationMs,
        questionCount: data.questions.length,
        serverNow: data.serverNow,
      });
      setConfig(cfg);
      setOffsetMs(cfg.offsetMs);
      setQuestions(data.questions);

      const draft = loadDraft();
      const canRestore =
        draft &&
        forEmail &&
        draft.email === forEmail &&
        Array.isArray(draft.answers) &&
        draft.answers.length === data.questions.length;

      setAnswers(canRestore ? draft.answers : new Array(data.questions.length).fill(-1));
      setPhase('quiz');
    } catch (err) {
      setErrorMsg(err.message);
      setPhase('error');
    }
  }, []);

  const handleIdentifySubmit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmed)) {
      setEmailError('შეიყვანეთ ვალიდური ელ. ფოსტა');
      return;
    }
    setEmailError('');
    setIdentifying(true);
    try {
      const data = await getMarathonStatus(trimmed);
      const cfg = parseConfig(data);
      setConfig(cfg);
      setOffsetMs(cfg.offsetMs);

      if (data.registered === false) {
        clearDraft();
        setPhase('notRegistered');
        return;
      }

      if (data.alreadyCompleted) {
        clearDraft();
        setAlreadyResult(data.result);
        setPhase('alreadyDone');
        return;
      }

      setIdentifiedEmail(trimmed);
      saveDraft({ email: trimmed, answers: [] });

      const adjustedNow = Date.now() + cfg.offsetMs;
      if (adjustedNow < cfg.startsAtMs) {
        setPhase('countdown');
      } else if (adjustedNow <= cfg.startsAtMs + cfg.durationMs) {
        await loadQuestions(trimmed);
      } else {
        setPhase('closed');
      }
    } catch (err) {
      setErrorMsg(err.message);
      setPhase('error');
    } finally {
      setIdentifying(false);
    }
  };

  const startsAtMs = config?.startsAtMs ?? null;
  const durationMs = config?.durationMs ?? FALLBACK_DURATION_MS;
  const adjustedNow = now + offsetMs;
  const msUntilStart = startsAtMs !== null ? startsAtMs - adjustedNow : null;
  const msRemaining = startsAtMs !== null ? startsAtMs + durationMs - adjustedNow : null;

  // Auto-transition from countdown -> quiz the instant the clock hits zero.
  useEffect(() => {
    if (
      phase === 'countdown' &&
      msUntilStart !== null &&
      msUntilStart <= 0 &&
      !autoLoadTriggeredRef.current
    ) {
      autoLoadTriggeredRef.current = true;
      loadQuestions(identifiedEmail);
    }
  }, [phase, msUntilStart, identifiedEmail, loadQuestions]);

  const handleSubmit = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const data = await submitMarathonResult({ email: identifiedEmail, answers });
      clearDraft();
      setResult(data);
      setPhase('result');
    } catch (err) {
      toast.error(err.message);
      setErrorMsg(err.message);
      setPhase('error');
    } finally {
      setSubmitting(false);
    }
  }, [identifiedEmail, answers]);

  // Auto-submit the instant the 5-minute window runs out.
  useEffect(() => {
    if (
      phase === 'quiz' &&
      msRemaining !== null &&
      msRemaining <= 0 &&
      !autoSubmitTriggeredRef.current
    ) {
      autoSubmitTriggeredRef.current = true;
      handleSubmit();
    }
  }, [phase, msRemaining, handleSubmit]);

  const handleSelectAnswer = (questionIndex, optionIndex) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[questionIndex] = optionIndex;
      saveDraft({ email: identifiedEmail, answers: next });
      return next;
    });
  };

  const handleManualSubmit = () => {
    if (submitting) return;
    handleSubmit();
  };

  const handleRetryIdentify = () => {
    setErrorMsg('');
    setPhase('identify');
  };

  return (
    <section
      className="marathon"
      id="marathon"
    >
      <div className="marathon__inner">
        <div className="sectionHeader">
          <h2>
            <em>მარათონი</em>
          </h2>
          <p>15 კითხვა, 5 წუთი - ვნახოთ, თუ რამდენად კარგად ერკვევი საერთაშორისო ურთიერთობებსა და გაეროს თემატიკაში</p>
        </div>

        <div className="marathonCard">
          <AnimatePresence mode="wait">
            {phase === 'loading' && (
              <motion.div
                key="loading"
                className="marathonStatus"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="marathonSpinner" />
                <p className="marathonStatus__message">იტვირთება...</p>
              </motion.div>
            )}

            {phase === 'identify' && (
              <IdentifyForm
                key="identify"
                email={email}
                setEmail={setEmail}
                onSubmit={handleIdentifySubmit}
                loading={identifying}
                error={emailError}
              />
            )}

            {phase === 'notRegistered' && (
              <StatusScreen
                key="notRegistered"
                icon="bi-person-x"
                tone="warning"
                title="ვერ მოიძებნა რეგისტრაცია"
                message="ამ ელ. ფოსტით რეგისტრირებული დელეგატი ვერ მოიძებნა. გადაამოწმეთ ელფოსტის სისწორე ან გაიარეთ რეგისტრაცია."
              >
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={handleRetryIdentify}
                >
                  სცადე თავიდან
                </button>
                <a
                  href="/#register"
                  className="submitBtn"
                >
                  რეგისტრაცია
                </a>
              </StatusScreen>
            )}

            {phase === 'alreadyDone' && alreadyResult && (
              <StatusScreen
                key="alreadyDone"
                icon="bi-check-circle"
                tone="success"
                title="თქვენ უკვე დაასრულეთ მარათონი"
                message={`სწორი პასუხები: ${alreadyResult.correctCount} / ${alreadyResult.totalQuestions} · დრო: ${formatElapsed(alreadyResult.elapsedMs)}`}
              >
                <p className="marathonStatus__note">შედეგები გამოცხადდება ჩვენს გვერდზე.</p>
              </StatusScreen>
            )}

            {phase === 'countdown' && msUntilStart !== null && (
              <CountdownDisplay
                key="countdown"
                msUntilStart={msUntilStart}
                startLabel={startsAtMs ? formatStartLabel(startsAtMs) : ''}
              />
            )}

            {phase === 'loadingQuestions' && (
              <motion.div
                key="loadingQuestions"
                className="marathonStatus"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="marathonSpinner" />
                <p className="marathonStatus__message">მზადდება...</p>
              </motion.div>
            )}

            {phase === 'quiz' && (
              <QuizScreen
                key="quiz"
                questions={questions}
                answers={answers}
                onSelect={handleSelectAnswer}
                onSubmit={handleManualSubmit}
                submitting={submitting}
                msRemaining={Math.max(0, msRemaining ?? 0)}
                durationMs={durationMs}
              />
            )}

            {phase === 'result' && result && (
              <ResultScreen
                key="result"
                result={result}
              />
            )}

            {phase === 'closed' && (
              <StatusScreen
                key="closed"
                icon="bi-hourglass-bottom"
                tone="neutral"
                title="მარათონი დასრულებულია"
                message="სამწუხაროდ, მონაწილეობის მიღების ვადა ამოიწურა."
              />
            )}

            {phase === 'error' && (
              <StatusScreen
                key="error"
                icon="bi-exclamation-triangle"
                tone="warning"
                title="დაფიქსირდა შეცდომა"
                message={errorMsg || 'გთხოვთ სცადოთ ხელახლა.'}
              >
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => window.location.reload()}
                >
                  თავიდან ცდა
                </button>
              </StatusScreen>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function IdentifyForm({ email, setEmail, onSubmit, loading, error }) {
  return (
    <motion.form
      className="marathonIdentify"
      onSubmit={onSubmit}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      <p className="marathonIdentify__intro">
        მარათონი დაიწყება <strong>5 სექტემბერს, 21:00 საათზე</strong> (თბილისის დრო) და გასტანს
        ზუსტად 5 წუთს - 15 კითხვა საერთაშორისო ურთიერთობებზე. უპასუხეთ რაც შეიძლება სწრაფად და
        ზუსტად.
      </p>
      <div className="formGroup">
        <label
          className="formLabel"
          htmlFor="marathonEmail"
        >
          ელ. ფოსტა (რომლითაც დარეგისტრირდით) <span className="formLabel__req">*</span>
        </label>
        <input
          id="marathonEmail"
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
      <motion.button
        type="submit"
        className="submitBtn"
        disabled={loading}
        whileHover={!loading ? { y: -2 } : {}}
        whileTap={!loading ? { scale: 0.97 } : {}}
      >
        {loading ? (
          'მოწმდება...'
        ) : (
          <>
            გაგრძელება <i className="bi bi-arrow-right" />
          </>
        )}
      </motion.button>
    </motion.form>
  );
}

function StatusScreen({ icon, tone = 'neutral', title, message, children }) {
  return (
    <motion.div
      className="marathonStatus"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      <div className={clsx('marathonStatus__icon', `marathonStatus__icon--${tone}`)}>
        <i className={`bi ${icon}`} />
      </div>
      <h3 className="marathonStatus__title">{title}</h3>
      {message && <p className="marathonStatus__message">{message}</p>}
      {children && <div className="marathonStatus__actions">{children}</div>}
    </motion.div>
  );
}

function CountdownDisplay({ msUntilStart, startLabel }) {
  const { days, hours, minutes, seconds } = formatDuration(msUntilStart);
  const units = [
    { value: days, label: 'დღე' },
    { value: hours, label: 'საათი' },
    { value: minutes, label: 'წუთი' },
    { value: seconds, label: 'წამი' },
  ];

  return (
    <motion.div
      className="marathonCountdown"
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0 }}
      variants={staggerContainer}
    >
      <motion.p
        className="marathonCountdown__label"
        variants={fadeUpItem}
      >
        მარათონი დაიწყება
      </motion.p>
      <motion.div
        className="marathonCountdown__units"
        variants={fadeUpItem}
      >
        {units.map((u) => (
          <div
            className="marathonCountdown__unit"
            key={u.label}
          >
            <span className="marathonCountdown__value">{pad2(u.value)}</span>
            <span className="marathonCountdown__unitLabel">{u.label}</span>
          </div>
        ))}
      </motion.div>
      {startLabel && (
        <motion.p
          className="marathonCountdown__date"
          variants={fadeUpItem}
        >
          {startLabel}
        </motion.p>
      )}
    </motion.div>
  );
}

function QuizScreen({ questions, answers, onSelect, onSubmit, submitting, msRemaining, durationMs }) {
  const answeredCount = answers.filter((a) => a !== -1).length;
  const remainingRatio = durationMs > 0 ? Math.max(0, Math.min(1, msRemaining / durationMs)) : 0;
  const isUrgent = msRemaining <= 30000;

  return (
    <motion.div
      className="marathonQuiz"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className={clsx('marathonTimerBar', { 'marathonTimerBar--urgent': isUrgent })}>
        <div className="marathonTimerBar__top">
          <span className="marathonTimerBar__badge">
            <span className="marathonTimerBar__dot" /> LIVE
          </span>
          <span className="marathonTimerBar__clock">{formatClock(msRemaining)}</span>
          <span className="marathonTimerBar__count">
            {answeredCount} / {questions.length}
          </span>
        </div>
        <div className="marathonTimerBar__track">
          <motion.div
            className="marathonTimerBar__fill"
            animate={{ width: `${remainingRatio * 100}%` }}
            transition={{ duration: 0.25, ease: 'linear' }}
          />
        </div>
      </div>

      <motion.div
        className="marathonQuestions"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            index={i}
            question={q}
            selected={answers[i]}
            onSelect={(optionIndex) => onSelect(i, optionIndex)}
          />
        ))}
      </motion.div>

      <div className="marathonQuizFooter">
        <p className="marathonQuizFooter__note">
          {answeredCount < questions.length
            ? `დარჩენილია ${questions.length - answeredCount} კითხვა`
            : 'ყველა კითხვას გაეცით პასუხი — გააგზავნეთ, როცა მზად ხართ.'}
        </p>
        <motion.button
          type="button"
          className="submitBtn"
          onClick={onSubmit}
          disabled={submitting}
          whileHover={!submitting ? { y: -2 } : {}}
          whileTap={!submitting ? { scale: 0.97 } : {}}
        >
          {submitting ? (
            <>
              <motion.span
                className="submitBtn__spinner"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
              />
              იგზავნება...
            </>
          ) : (
            <>
              დასრულება <i className="bi bi-flag-fill" />
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

function QuestionCard({ question, index, selected, onSelect }) {
  return (
    <motion.div
      className="marathonQuestion"
      variants={fadeUpItem}
    >
      <div className="marathonQuestion__head">
        <span className="marathonQuestion__num">{index + 1}</span>
        <p className="marathonQuestion__text">{question.question}</p>
      </div>
      <div className="marathonQuestion__options">
        {question.options.map((option, i) => (
          <button
            type="button"
            key={i}
            className={clsx('marathonOption', { 'marathonOption--selected': selected === i })}
            onClick={() => onSelect(i)}
          >
            <span className="marathonOption__letter">{OPTION_LETTERS[i]}</span>
            <span className="marathonOption__text">{option}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function ResultScreen({ result }) {
  return (
    <motion.div
      className="marathonStatus"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      <div className="marathonStatus__icon marathonStatus__icon--success">
        <i className="bi bi-flag-fill" />
      </div>
      <h3 className="marathonStatus__title">მადლობა მონაწილეობისთვის!</h3>
      <p className="marathonStatus__message">
        სწორი პასუხები: <strong>{result.correctCount} / {result.totalQuestions}</strong>
        <br />
        დასრულების დრო: <strong>{formatElapsed(result.elapsedMs)}</strong>
      </p>
      <p className="marathonStatus__note">შედეგები საბოლოოდ გამოცხადდება ცერემონიაზე.</p>
    </motion.div>
  );
}