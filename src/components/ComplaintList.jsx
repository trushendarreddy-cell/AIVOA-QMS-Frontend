import { useCallback, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setComplaintsList } from '../store/complaintSlice';
import { getComplaints, updateComplaintStatus } from '../services/api';

const ComplaintList = () => {
  const dispatch = useDispatch();
  const complaints = useSelector((state) => state.complaints.complaintsList);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // useCallback keeps the identity stable so the effect below does not
  // re-fire on every render. The AbortController stops the in-flight request
  // if the component unmounts before it resolves.
  const fetchComplaints = useCallback(async (signal) => {
    try {
      const response = await getComplaints({ signal });
      dispatch(setComplaintsList(response.data));
    } catch (error) {
      if (error.name === 'CanceledError') return;
      console.error('Error fetching complaints:', error);
    }
  }, [dispatch]);

  useEffect(() => {
    const controller = new AbortController();
    fetchComplaints(controller.signal);
    return () => controller.abort();
  }, [fetchComplaints]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateComplaintStatus(id, newStatus);
      const response = await getComplaints();
      dispatch(setComplaintsList(response.data));
      const updatedItem = response.data.find((c) => c.id === id);
      if (updatedItem) {
        setSelectedComplaint(updatedItem);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update complaint lifecycle status.');
    }
  };

  const getRiskBadgeStyle = (level) => {
    switch (level?.toLowerCase()) {
      case 'critical': return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' };
      case 'high': return { bg: '#ffedd5', text: '#c2410c', border: '#fdba74' };
      case 'moderate': return { bg: '#fef3c7', text: '#b45309', border: '#fde047' };
      default: return { bg: '#dcfce7', text: '#166534', border: '#86efac' };
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'CLOSED': return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
      case 'QA_REVIEW': return { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' };
      case 'UNDER_INVESTIGATION': return { bg: '#fef3c7', text: '#b45309', border: '#fde047' };
      default: return { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' }; // OPEN
    }
  };

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>ID</th>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>Customer</th>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>Product / SKU</th>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>Category</th>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>Status</th>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>AI Risk Level</th>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {complaints && complaints.length > 0 ? (
              complaints.map((c) => {
                const badge = getRiskBadgeStyle(c.riskLevel);
                const statusBadge = getStatusBadgeStyle(c.status);
                return (
                  <tr 
                    key={c.id} 
                    onClick={() => setSelectedComplaint(c)}
                    style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: '#0284c7' }}>#{c.id}</td>
                    <td style={{ padding: '14px 16px', color: '#334155', fontWeight: '500' }}>{c.customerName}</td>
                    <td style={{ padding: '14px 16px', color: '#334155' }}>{c.productId}</td>
                    <td style={{ padding: '14px 16px', color: '#475569' }}>{c.issueCategory}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '700', backgroundColor: statusBadge.bg, color: statusBadge.text, border: `1px solid ${statusBadge.border}` }}>
                        {c.status || 'OPEN'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700', backgroundColor: badge.bg, color: badge.text, border: `1px solid ${badge.border}` }}>
                        {c.riskLevel || 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', color: '#334155', cursor: 'pointer' }}>
                        View Details 🔍
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                  No complaints logged in MySQL audit trail yet. Submit a complaint above to see it here!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Interactive Modal Drawer for Record Details */}
      {selectedComplaint && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end', zIndex: 1000 }}>
          <div style={{ width: '640px', height: '100%', backgroundColor: 'white', padding: '32px', boxSizing: 'border-box', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '-10px 0 25px rgba(0,0,0,0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ background: '#0284c7', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700' }}>AUDIT RECORD #{selectedComplaint.id}</span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>{selectedComplaint.customerName}</h3>
              </div>
              <button 
                onClick={() => setSelectedComplaint(null)}
                style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            {/* Status Workflow Changer */}
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ display: 'block', color: '#64748b', fontSize: '0.72rem', marginBottom: '4px' }}>LIFECYCLE STATUS</strong>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>Update Stage</span>
              </div>
              <select 
                value={selectedComplaint.status || 'OPEN'} 
                onChange={(e) => handleStatusChange(selectedComplaint.id, e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: '600', backgroundColor: 'white', color: '#0f172a', outline: 'none', cursor: 'pointer' }}
              >
                <option value="OPEN">OPEN</option>
                <option value="UNDER_INVESTIGATION">UNDER_INVESTIGATION</option>
                <option value="QA_REVIEW">QA_REVIEW</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.87rem', color: '#334155' }}>
              
              {/* Origin & Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <strong style={{ display: 'block', color: '#64748b', fontSize: '0.72rem', marginBottom: '4px' }}>COMPLAINT SOURCE</strong>
                  {selectedComplaint.complaintSource || 'Pharmacy'}
                </div>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <strong style={{ display: 'block', color: '#64748b', fontSize: '0.72rem', marginBottom: '4px' }}>CUSTOMER NAME</strong>
                  <span style={{ fontWeight: '600', color: '#0f172a' }}>{selectedComplaint.customerName}</span>
                </div>
              </div>

              {/* Product & Batch Identification */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <strong style={{ color: '#64748b', fontSize: '0.72rem' }}>PRODUCT & BATCH DETAILS</strong>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.83rem' }}>
                  <div><strong>Product Name:</strong> {selectedComplaint.productId}</div>
                  <div><strong>Strength:</strong> {selectedComplaint.strength || 'N/A'}</div>
                  <div><strong>Batch Number:</strong> {selectedComplaint.batchNumber || 'N/A'}</div>
                  <div><strong>Affected Qty:</strong> {selectedComplaint.affectedQuantity || 'N/A'}</div>
                  <div><strong>Mfg Date:</strong> {selectedComplaint.manufacturingDate || 'N/A'}</div>
                  <div><strong>Expiry Date:</strong> {selectedComplaint.expiryDate || 'N/A'}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <strong style={{ display: 'block', color: '#64748b', fontSize: '0.72rem', marginBottom: '4px' }}>ISSUE CATEGORY</strong>
                  {selectedComplaint.issueCategory}
                </div>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <strong style={{ display: 'block', color: '#64748b', fontSize: '0.72rem', marginBottom: '4px' }}>URGENCY LEVEL</strong>
                  {selectedComplaint.urgencyLevel}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <strong style={{ display: 'block', color: '#64748b', fontSize: '0.72rem', marginBottom: '4px' }}>COMPLAINT DESCRIPTION</strong>
                <p style={{ margin: 0, lineHeight: '1.5' }}>{selectedComplaint.complaintDescription}</p>
              </div>

              {/* AI Summary */}
              {selectedComplaint.summary && (
                <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <strong style={{ display: 'block', color: '#166534', fontSize: '0.75rem', marginBottom: '4px' }}>📋 AI SUMMARY</strong>
                  <p style={{ margin: 0, lineHeight: '1.5', color: '#166534' }}>{selectedComplaint.summary}</p>
                </div>
              )}

              <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                <strong style={{ display: 'block', color: '#1d4ed8', fontSize: '0.8rem', marginBottom: '8px' }}>🛡️ AI COMPLIANCE & RISK EVALUATION</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div><strong>Risk Level:</strong> {selectedComplaint.riskLevel}</div>
                  <div><strong>Justification:</strong> {selectedComplaint.riskReason}</div>
                  <div><strong>Safety Impact:</strong> {selectedComplaint.safetyImpact}</div>
                </div>
              </div>

              <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <strong style={{ display: 'block', color: '#166534', fontSize: '0.8rem', marginBottom: '8px' }}>🔍 ROOT CAUSE & CAPA PROTOCOL</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div><strong>Root Cause:</strong> {selectedComplaint.rootCause || 'N/A'}</div>
                  <div><strong>CAPA Action:</strong> {selectedComplaint.capaRecommendation || 'N/A'}</div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setSelectedComplaint(null)}
              style={{ marginTop: 'auto', padding: '12px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
            >
              Close Inspector
            </button>

          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintList;