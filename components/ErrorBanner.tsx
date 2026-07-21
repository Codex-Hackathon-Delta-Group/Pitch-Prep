export function ErrorBanner({ message, onRetry, onFallback, canFallback }: { message: string; onRetry: () => void; onFallback: () => void; canFallback: boolean }) {
  return <div className="error-banner" role="alert">
    <div><strong>That call didn’t complete.</strong><p>{message} Your work is still here.</p></div>
    <div className="button-group">
      <button className="button secondary" onClick={onRetry}>Retry live call</button>
      {canFallback && <button className="button quiet" onClick={onFallback}>Load labeled demo example</button>}
    </div>
  </div>;
}
