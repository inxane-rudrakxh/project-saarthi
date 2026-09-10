import { HashRouter, Routes, Route } from 'react-router-dom';
import { DataProvider } from '@/lib/DataContext';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Projects from '@/pages/Projects';
import ProjectDetail from '@/pages/ProjectDetail';
import Alerts from '@/pages/Alerts';
import Assistant from '@/pages/Assistant';
import About from '@/pages/About';
import MinisterialBrief from '@/pages/MinisterialBrief';

export default function App() {
  return (
    <DataProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/projects/:id/brief" element={<MinisterialBrief />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/about" element={<About />} />
          </Route>
        </Routes>
      </HashRouter>
    </DataProvider>
  );
}
