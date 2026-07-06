import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import StatsPage from './pages/StatsPage';
import DecryptPage from './pages/DecryptPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/stats/:code" element={<StatsPage />} />
        <Route path="/decrypt/:code" element={<DecryptPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
