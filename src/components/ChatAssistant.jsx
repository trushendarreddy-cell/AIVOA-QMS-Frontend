import { useEffect, useState } from 'react';
import { getComplaints } from '../services/api';

// Was named ComplaintList, which duplicated the component in ComplaintList.jsx
// and made stack traces ambiguous.
const ChatAssistant = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchComplaints = async (signal) => {
    try {
      const response = await getComplaints({ signal });
      setComplaints(response.data);
    } catch (error) {
      if (error.name === 'CanceledError') return;
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    // The rule flags any setState reachable from an effect body. Here both
    // setComplaints and setLoading run after `await getComplaints(...)`
    // resolves, so nothing is set synchronously and there is no cascading
    // render. Moving the fetch into a useEffect callback that returns a
    // promise would break the cleanup contract.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchComplaints(controller.signal);
    return () => controller.abort();
  }, []);

  return (
    <div style={{ marginTop: '30px', background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, color: '#1e293b' }}>Logged Complaints History (MySQL)</h3>
        <button 
          onClick={fetchComplaints} 
          style={{ padding: '6px 12px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}
        >
          Refresh List
        </button>
      </div>

      {loading ? (
        <p style={{ color: '#64748b' }}>Loading complaints from MySQL...</p>
      ) : complaints.length === 0 ? (
        <p style={{ color: '#64748b' }}>No complaints logged in MySQL yet. Submit one using the form above!</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '10px' }}>ID</th>
                <th style={{ padding: '10px' }}>Customer</th>
                <th style={{ padding: '10px' }}>Product ID</th>
                <th style={{ padding: '10px' }}>Category</th>
                <th style={{ padding: '10px' }}>Urgency</th>
                <th style={{ padding: '10px' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold', color: '#334155' }}>#{item.id}</td>
                  <td style={{ padding: '10px', color: '#334155' }}>{item.customerName}</td>
                  <td style={{ padding: '10px', color: '#334155' }}>{item.productId}</td>
                  <td style={{ padding: '10px', color: '#334155' }}>{item.issueCategory}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ 
                      padding: '3px 8px', 
                      borderRadius: '4px', 
                      fontSize: '0.75rem', 
                      fontWeight: 'bold',
                      backgroundColor: item.urgencyLevel === 'High' ? '#fee2e2' : item.urgencyLevel === 'Medium' ? '#fef3c7' : '#dcfce7',
                      color: item.urgencyLevel === 'High' ? '#b91c1c' : item.urgencyLevel === 'Medium' ? '#b45309' : '#166534'
                    }}>
                      {item.urgencyLevel}
                    </span>
                  </td>
                  <td style={{ padding: '10px', color: '#64748b', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.complaintDescription}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ChatAssistant;
