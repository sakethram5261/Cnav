import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Shell } from './components/Shell';
import { HomePage } from './pages/HomePage';
import { FindPage } from './pages/FindPage';
import { MapPage } from './pages/MapPage';
import { NavigatePage } from './pages/NavigatePage';
import { LostPage } from './pages/LostPage';
import { FloorsPage } from './pages/FloorsPage';
import { QrEntryPage } from './pages/QrEntryPage';
import { TestPage } from './pages/TestPage';
import { AdminGraphPage } from './pages/AdminGraphPage';

export function App() {
  return (
    <BrowserRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/find" element={<FindPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/go/:from/:to" element={<NavigatePage />} />
          <Route path="/lost" element={<LostPage />} />
          <Route path="/floors/:block" element={<FloorsPage />} />
          <Route path="/h/:nodeId" element={<QrEntryPage />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/admin/graph" element={<AdminGraphPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  );
}

export default App;
