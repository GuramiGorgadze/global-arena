import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { sendPaymentEmails } from '../api/admin';

const parseEmails = (raw) =>
  raw
    .split(/[\n,;]+/)
    .map((e) => e.trim())
    .filter(Boolean);

export default function PaymentEmailSender() {
  const [raw, setRaw] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const emails = parseEmails(raw);

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

  return (
    <div className="paymentPage">
      <div
        className="formCard paymentEmailSender"
        style={{ maxWidth: 640, margin: '40px auto' }}
      >
        <div className="formDivider">
          <span>გადახდის მეილის გაგზავნა</span>
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

        {result && (
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
        )}
      </div>
    </div>
  );
}
