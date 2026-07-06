import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

function StatsPage() {
  const { code } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/links/${code}/stats`);
        if (!res.ok) {
          throw new Error('Link not found or failed to load stats.');
        }
        const result = await res.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [code]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="container stats text-center" style={{ marginTop: '4rem' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', borderColor: 'var(--accent-color)' }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading stats...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container stats text-center" style={{ marginTop: '4rem' }}>
        <h2>Error</h2>
        <p className="error-text">{error}</p>
        <Link to="/">
          <button className="secondary">Back to home</button>
        </Link>
      </div>
    );
  }

  if (!data) return null;

  // Process chart data: group by date
  const clicksByDate = data.clicks.reduce((acc, click) => {
    // Assuming timestamp is in YYYY-MM-DD HH:MM:SS format or similar ISO
    const date = new Date(click.timestamp).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.keys(clicksByDate).map(date => ({
    date,
    clicks: clicksByDate[date]
  })).reverse(); // chronological if originally descending

  const lastClickTime = data.clicks.length > 0 
    ? new Date(data.clicks[0].timestamp).toLocaleString()
    : 'No clicks yet';

  const shortUrl = `${window.location.protocol}//${window.location.host}/${data.shortCode}`;

  return (
    <div className="container stats">
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/" className="text-muted" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          &larr; Back to home
        </Link>
      </div>

      <div className="stats-header card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="mono glitch" data-text={shortUrl} style={{ fontSize: '2rem', marginBottom: '0.25rem', color: 'var(--accent-color)' }}>
              {shortUrl}
            </h1>
            <p className="text-muted" style={{ margin: 0, wordBreak: 'break-all' }} title={data.originalUrl}>
              {data.originalUrl}
            </p>
          </div>
          <button className="secondary" onClick={() => handleCopy(shortUrl)}>
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-box">
          <div className="label">Total Clicks</div>
          <div className="value">{data.totalClicks}</div>
        </div>
        <div className="stat-box">
          <div className="label">Created On</div>
          <div className="value" style={{ fontSize: '1.25rem', lineHeight: '2.5rem' }}>
            {new Date(data.createdAt).toLocaleDateString()}
          </div>
        </div>
        <div className="stat-box">
          <div className="label">Last Click</div>
          <div className="value" style={{ fontSize: '1.25rem', lineHeight: '2.5rem' }}>
            {lastClickTime}
          </div>
        </div>
      </div>

      <h3 style={{ marginBottom: '1rem' }}>Clicks over time</h3>
      <div className="chart-container">
        {chartData.length < 2 ? (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Not enough data to display a chart.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--text-muted)" />
              <XAxis dataKey="date" stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} />
              <YAxis allowDecimals={false} stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--accent-color)', color: 'var(--text-primary)' }}
                itemStyle={{ color: 'var(--accent-color)' }}
              />
              <Line type="monotone" dataKey="clicks" stroke="var(--accent-color)" strokeWidth={3} dot={{ r: 4, fill: 'var(--accent-color)', stroke: 'var(--accent-color)' }} activeDot={{ r: 6, fill: '#000', stroke: 'var(--accent-color)', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <h3 style={{ marginBottom: '1rem' }}>Recent Clicks</h3>
      <div className="table-container" style={{ overflowX: 'auto' }}>
        {data.clicks.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No clicks recorded yet.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Referrer</th>
                <th>User Agent</th>
              </tr>
            </thead>
            <tbody>
              {data.clicks.slice(0, 50).map((click, i) => (
                <tr key={i}>
                  <td style={{ whiteSpace: 'nowrap' }}>{new Date(click.timestamp).toLocaleString()}</td>
                  <td>{click.referrer || <span className="text-muted">Direct</span>}</td>
                  <td title={click.userAgent}>
                    {click.userAgent ? click.userAgent.split(' ')[0] : <span className="text-muted">Unknown</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default StatsPage;
