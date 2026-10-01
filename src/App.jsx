import ComplaintForm from './components/ComplaintForm';
import ComplaintList from './components/ComplaintList';

function App() {
  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <header style={{ marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>AIVOA QMS</h1>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Pharmaceutical Quality Management System & AI Compliance Copilot</p>
      </header>

      <main style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <ComplaintForm />
        <ComplaintList />
      </main>
    </div>
  );
}

export default App;