// Shared "enter the chair password" gate. Both the control panel
// (VotingControl.jsx) and the public display (VotingScreen.jsx) unlock with
// the exact same shared secret, so the screen that asks for it is one
// component instead of two hand-maintained copies that can drift apart —
// this is the only place that login screen is defined, styled as
// `.voteGate` in styles/routes/_votingShared.scss.
export default function VotingGate({ idPrefix, value, onChange, onSubmit, loading, error }) {
  const fieldId = `${idPrefix}-key`;

  return (
    <div className="voteGate">
      <p className="voteGate__badge">GAMUN 2026 · კენჭისყრა</p>
      <form
        onSubmit={onSubmit}
        className="voteGate__form"
      >
        <div className="formGroup">
          <label
            className="formLabel"
            htmlFor={fieldId}
          >
            შეიყვანეთ პაროლი
          </label>
          <input
            id={fieldId}
            type="password"
            className="formInput"
            placeholder="x-chair-key"
            value={value}
            onChange={onChange}
            autoComplete="off"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${fieldId}-error` : undefined}
          />
          {error && (
            <p
              className="formError"
              id={`${fieldId}-error`}
              role="alert"
            >
              {error}
            </p>
          )}
        </div>
        <button
          type="submit"
          className="submitBtn"
          disabled={loading || !value.trim()}
        >
          {loading ? 'მოწმდება...' : 'შესვლა'}
        </button>
      </form>
    </div>
  );
}