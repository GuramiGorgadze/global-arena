import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { sendPaymentEmails, sendConfirmationEmails, getSentEmails } from '../api/admin';

const parseEmails = (raw) =>
  raw
    .split(/[\n,;]+/)
    .map((e) => e.trim())
    .filter(Boolean);

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('ka-GE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('ka-GE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

const ResultLists = ({ result }) => {
  if (!result) return null;

  return (
    <div className="paymentEmailSender__results">
      {result.sent?.length > 0 && (
        <div className="paymentEmailSender__resultBlock paymentEmailSender__resultBlock--success">
          <div className="paymentEmailSender__resultHead">
            <span className="paymentEmailSender__resultIcon">✓</span>
            <span className="paymentEmailSender__resultTitle">გაიგზავნა</span>
            <span className="paymentEmailSender__resultCount">{result.sent.length}</span>
          </div>
          <ul className="paymentEmailSender__chipList">
            {result.sent.map((email) => (
              <li
                key={email}
                className="paymentEmailSender__chip paymentEmailSender__chip--success"
              >
                <span className="paymentEmailSender__chipEmail">{email}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.failed?.length > 0 && (
        <div className="paymentEmailSender__resultBlock paymentEmailSender__resultBlock--failed">
          <div className="paymentEmailSender__resultHead">
            <span className="paymentEmailSender__resultIcon">!</span>
            <span className="paymentEmailSender__resultTitle">ვერ გაიგზავნა</span>
            <span className="paymentEmailSender__resultCount">{result.failed.length}</span>
          </div>
          <ul className="paymentEmailSender__chipList">
            {result.failed.map((f) => (
              <li
                key={f.email}
                className="paymentEmailSender__chip paymentEmailSender__chip--failed"
                title={f.error}
              >
                <span className="paymentEmailSender__chipEmail">{f.email}</span>
                <span className="paymentEmailSender__chipError">{f.error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default function PaymentEmailSender() {
  const [raw, setRaw] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const [confirmSending, setConfirmSending] = useState(false);
  const [confirmResult, setConfirmResult] = useState(null);
  const [selected, setSelected] = useState(new Set());

  const [loadingSentEmails, setLoadingSentEmails] = useState(true);
  const [sentPayment, setSentPayment] = useState([]);
  const [sentConfirmation, setSentConfirmation] = useState([]);

  const emails = parseEmails(raw);

  const confirmedSet = new Set(sentConfirmation.map((d) => d.email));
  const pending = sentPayment.filter((p) => !confirmedSet.has(p.email));
  const allPendingSelected = pending.length > 0 && selected.size === pending.length;

  const loadSentEmails = async () => {
    setLoadingSentEmails(true);
    try {
      const data = await getSentEmails();
      setSentPayment(data.payment || []);
      setSentConfirmation(data.confirmation || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingSentEmails(false);
    }
  };

  useEffect(() => {
    loadSentEmails();
  }, []);

  const handleSend = async () => {
    if (emails.length === 0) {
      toast.error('შეიყვანეთ მინიმუმ ერთი ელ. ფოსტა');
      return;
    }
    setSending(true);
    setResult(null);
    const toastId = toast.loading(`იგზავნება ${emails.length} მისამართზე...`);
    try {
      const data = await sendPaymentEmails(emails);
      setResult(data);
      await loadSentEmails();
      if (data.failed?.length) {
        toast.error(`${data.sent.length} გაიგზავნა, ${data.failed.length} ვერ გაიგზავნა`, {
          id: toastId,
        });
      } else {
        toast.success(`ყველა (${data.sent.length}) წარმატებით გაიგზავნა`, { id: toastId });
      }
    } catch (err) {
      toast.error(err.message, { id: toastId });
    } finally {
      setSending(false);
    }
  };

  const toggleSelect = (email) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(email)) {
        next.delete(email);
      } else {
        next.add(email);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected(allPendingSelected ? new Set() : new Set(pending.map((p) => p.email)));
  };

  const handleSendConfirmations = async () => {
    const chosen = Array.from(selected);
    if (chosen.length === 0) {
      toast.error('აირჩიეთ მინიმუმ ერთი ადრესატი');
      return;
    }
    setConfirmSending(true);
    setConfirmResult(null);
    const toastId = toast.loading(`იგზავნება ${chosen.length} მისამართზე...`);
    try {
      const data = await sendConfirmationEmails(chosen);
      setConfirmResult(data);
      setSelected(new Set());
      await loadSentEmails();
      if (data.failed?.length) {
        toast.error(`${data.sent.length} გაიგზავნა, ${data.failed.length} ვერ გაიგზავნა`, {
          id: toastId,
        });
      } else {
        toast.success(`ყველა (${data.sent.length}) წარმატებით გაიგზავნა`, { id: toastId });
      }
    } catch (err) {
      toast.error(err.message, { id: toastId });
    } finally {
      setConfirmSending(false);
    }
  };

  return (
    <div className="paymentPage">
      <div className="formCard paymentEmailSender">
        <div className="formDivider">
          <span>გადახდის მეილის გაგზავნა</span>
        </div>

        <div className="paymentEmailSender__counters">
          <span className="paymentEmailSender__counter">
            სულ გაგზავნილია{' '}
            <span className="paymentEmailSender__counterValue">
              {loadingSentEmails ? '—' : sentPayment.length}
            </span>
          </span>
        </div>

        <div className="formGroup">
          <label
            className="formLabel"
            htmlFor="paymentEmails"
          >
            ელ. ფოსტები (თითო ხაზზე ან მძიმით გამოყოფილი)
          </label>
          <textarea
            id="paymentEmails"
            className="formTextarea"
            rows={8}
            placeholder={'delegate1@example.com\ndelegate2@example.com'}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
          />
          <p className="formNote">ამოცნობილია {emails.length} მისამართი</p>
        </div>

        <motion.button
          type="button"
          className="submitBtn"
          onClick={handleSend}
          disabled={sending}
          whileHover={!sending ? { y: -2, boxShadow: '0 10px 40px rgba(212,175,90,0.4)' } : {}}
          whileTap={!sending ? { scale: 0.97, y: 0 } : {}}
        >
          {sending ? 'იგზავნება...' : 'გაგზავნა'}
        </motion.button>

        <ResultLists result={result} />
      </div>

      <div className="formCard paymentEmailSender paymentEmailSender--tight">
        <div className="formDivider">
          <span>დადასტურების მეილის გაგზავნა</span>
        </div>

        <div className="paymentEmailSender__counters">
          <span className="paymentEmailSender__counter">
            გადახდის მეილი{' '}
            <span className="paymentEmailSender__counterValue">
              {loadingSentEmails ? '—' : sentPayment.length}
            </span>
          </span>
          <span className="paymentEmailSender__counter">
            დადასტურებულია{' '}
            <span className="paymentEmailSender__counterValue">
              {loadingSentEmails ? '—' : sentConfirmation.length}
            </span>
          </span>
          <span className="paymentEmailSender__counter">
            მოლოდინში{' '}
            <span className="paymentEmailSender__counterValue">
              {loadingSentEmails ? '—' : pending.length}
            </span>
          </span>
        </div>

        {loadingSentEmails ? (
          <p className="paymentEmailSender__emptyNote">იტვირთება...</p>
        ) : pending.length === 0 ? (
          <p className="paymentEmailSender__emptyNote">
            გასაგზავნი დადასტურების მეილი არ არის. ყველა უკვე დადასტურებულია.
          </p>
        ) : (
          <>
            <div className="paymentEmailSender__checklistHead">
              <label className="paymentEmailSender__selectAll">
                <input
                  type="checkbox"
                  checked={allPendingSelected}
                  onChange={toggleSelectAll}
                />
                ყველას მონიშვნა ({pending.length})
              </label>
              <span className="paymentEmailSender__counter">
                არჩეულია <span className="paymentEmailSender__counterValue">{selected.size}</span>
              </span>
            </div>

            <div className="paymentEmailSender__checklist">
              {pending.map((p) => (
                <label
                  key={p.email}
                  className="paymentEmailSender__checkRow"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(p.email)}
                    onChange={() => toggleSelect(p.email)}
                  />
                  <span className="paymentEmailSender__checkRowEmail">{p.email}</span>
                  {p.sentAt && (
                    <span className="paymentEmailSender__checkRowDate">{formatDate(p.sentAt)}</span>
                  )}
                </label>
              ))}
            </div>
          </>
        )}

        <motion.button
          type="button"
          className="submitBtn"
          onClick={handleSendConfirmations}
          disabled={confirmSending || selected.size === 0}
          whileHover={
            !confirmSending && selected.size > 0
              ? { y: -2, boxShadow: '0 10px 40px rgba(212,175,90,0.4)' }
              : {}
          }
          whileTap={!confirmSending && selected.size > 0 ? { scale: 0.97, y: 0 } : {}}
        >
          {confirmSending ? 'იგზავნება...' : `გაგზავნა არჩეულთათვის (${selected.size})`}
        </motion.button>

        <ResultLists result={confirmResult} />
      </div>

      <div className="formCard paymentEmailSender paymentEmailSender--tight">
        <div className="formDivider">
          <span>დადასტურებული დელეგატები</span>
        </div>

        <div className="paymentEmailSender__counters">
          <span className="paymentEmailSender__counter">
            სულ დადასტურებულია{' '}
            <span className="paymentEmailSender__counterValue">
              {loadingSentEmails ? '—' : sentConfirmation.length}
            </span>
          </span>
        </div>

        {loadingSentEmails ? (
          <p className="paymentEmailSender__emptyNote">იტვირთება...</p>
        ) : sentConfirmation.length === 0 ? (
          <p className="paymentEmailSender__emptyNote">
            დადასტურების მეილი ჯერ არავის გაუგზავნია.
          </p>
        ) : (
          <div className="paymentEmailSender__tableWrap">
            <table className="paymentEmailSender__table">
              <thead>
                <tr>
                  <th scope="col">ელ. ფოსტა</th>
                  <th scope="col">გაგზავნის თარიღი</th>
                </tr>
              </thead>
              <tbody>
                {sentConfirmation.map((c) => (
                  <tr key={c.email}>
                    <td>
                      <span className="paymentEmailSender__tableEmail">
                        <i
                          className="bi bi-check-circle-fill"
                          aria-hidden="true"
                        />
                        <span title={c.email}>{c.email}</span>
                      </span>
                    </td>
                    <td>{c.sentAt ? formatDateTime(c.sentAt) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}