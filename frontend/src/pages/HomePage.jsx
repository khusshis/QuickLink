import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function HomePage() {
  const [url, setUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('quicklink_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  const saveToHistory = (newItem) => {
    const updated = [newItem, ...history];
    setHistory(updated);
    localStorage.setItem('quicklink_history', JSON.stringify(updated));
  };

  const handleShorten = async (e) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url, customCode: customCode.trim() || undefined, password: password || undefined })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to shorten URL');
      }

      setResult(data);
      saveToHistory(data);
      setUrl('');
      setCustomCode('');
      setPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container home">
      <div className="text-center" style={{ marginBottom: '3rem' }}>
        <h1 className="glitch" data-text="Shorten a link">Shorten a link</h1>
        <p className="text-muted">Create short, manageable URLs in seconds<span className="cursor"></span></p>
      </div>

      <form onSubmit={handleShorten}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          <input
            type="text"
            placeholder="Paste a long URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Custom alias (optional)"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              disabled={loading}
              style={{ flex: '1 1 200px' }}
            />
            <input
              type="password"
              placeholder="Password (optional)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              style={{ flex: '1 1 200px' }}
            />
          </div>
          <button type="submit" disabled={loading || !url.trim()} style={{ alignSelf: 'flex-start', padding: '1rem 2rem' }}>
            {loading ? <span className="spinner"></span> : 'SHORTEN_LINK'}
          </button>
        </div>
        {error && <div className="error-text">{error}</div>}
      </form>

      {result && (
        <div className="card result-card">
          <div className="text-muted" style={{ fontSize: '0.875rem' }}>Your shortened URL is ready!</div>
          <div className="pill mono">{result.shortUrl}</div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button onClick={() => handleCopy(result.shortUrl)}>
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <Link to={`/stats/${result.shortCode}`}>
              <button className="secondary">View Stats</button>
            </Link>
          </div>
        </div>
      )}

      <div style={{ marginTop: '3rem' }}>
        <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid #27272a', paddingBottom: '0.5rem' }}>Recent Links</h3>
        
        {history.length === 0 ? (
          <div className="history-empty">
            Your shortened links will appear here.
          </div>
        ) : (
          <div className="history-list">
            {history.map((item, idx) => (
              <div key={idx} className="history-item">
                <div className="history-item-left">
                  <div className="mono" style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                    {item.shortCode}
                  </div>
                  <div className="history-item-original" title={item.originalUrl}>
                    {item.originalUrl}
                  </div>
                </div>
                <div className="history-item-actions">
                  <Link to={`/stats/${item.shortCode}`} className="text-muted" style={{ fontSize: '0.875rem' }}>
                    Stats
                  </Link>
                  <button className="secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem' }} onClick={() => handleCopy(item.shortUrl)}>
                    Copy
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;
