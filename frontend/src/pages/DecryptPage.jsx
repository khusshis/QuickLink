import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function DecryptPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDecrypt = async (e) => {
    e.preventDefault();
    if (!password) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/decrypt/${code}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Decryption failed.');
      }

      // Success: redirect to original URL
      window.location.href = data.originalUrl;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="container home">
      <div className="text-center" style={{ marginBottom: '3rem', marginTop: '3rem' }}>
        <h1 className="glitch" data-text="DECRYPT PAYLOAD">DECRYPT PAYLOAD</h1>
        <p className="text-muted">Enter the secret key to access this link<span className="cursor"></span></p>
      </div>

      <form onSubmit={handleDecrypt}>
        <div className="input-group">
          <input
            type="password"
            placeholder="Enter password..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            autoFocus
          />
          <button type="submit" disabled={loading || !password}>
            {loading ? <span className="spinner"></span> : 'Submit'}
          </button>
        </div>
        {error && <div className="error-text text-center">{error}</div>}
      </form>
      
      <div className="text-center" style={{ marginTop: '2rem' }}>
        <button className="secondary" onClick={() => navigate('/')}>Abort</button>
      </div>
    </div>
  );
}

export default DecryptPage;
