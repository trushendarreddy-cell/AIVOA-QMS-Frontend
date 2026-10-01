import { useSelector, useDispatch } from 'react-redux';
import { 
  setPrompt, 
  setField, 
  setExtractedData, 
  setRiskAssessment, 
  setCompletenessData,
  setDuplicateWarning,
  setLoading, 
  setSaveStatus, 
  setComplaintsList 
} from '../store/complaintSlice';
import {
  getComplaints,
  saveComplaint,
  checkDuplicate,
  uploadAndExtract,
  extractFromState,
} from '../services/api';

const ComplaintForm = () => {
  const dispatch = useDispatch();
  const { prompt, formData, riskAssessment, completenessData, duplicateWarning, loading, saveStatus } = useSelector((state) => state.complaints);

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    const formDataObj = new FormData();
    formDataObj.append("file", uploadedFile);

    dispatch(setLoading(true));
    dispatch(setSaveStatus(''));
    dispatch(setDuplicateWarning(null));
    try {
      const response = await uploadAndExtract(formDataObj);
      if (response.data.rawText) {
        dispatch(setPrompt(response.data.rawText));
      }
      if (response.data.extracted) {
        dispatch(setExtractedData(response.data.extracted));
      }
      if (response.data.completenessData) {
        dispatch(setCompletenessData(response.data.completenessData));
      }
      if (response.data.riskAssessment) {
        dispatch(setRiskAssessment(response.data.riskAssessment));
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to process uploaded document.');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleExtract = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    dispatch(setLoading(true));
    dispatch(setSaveStatus(''));
    dispatch(setDuplicateWarning(null));
    try {
      // NEW DATA FLOW: Passing current_state to allow for delta edits
      const response = await extractFromState(prompt, formData);
      
      if (response.data.extracted) {
        dispatch(setExtractedData(response.data.extracted));
      }
      if (response.data.completenessData) {
        dispatch(setCompletenessData(response.data.completenessData));
      }
      if (response.data.riskAssessment) {
        dispatch(setRiskAssessment(response.data.riskAssessment));
      }
    } catch (error) {
      console.error('Error during AI extraction:', error);
      alert('Failed to extract complaint using AI.');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleChange = (e) => {
    dispatch(setField({ name: e.target.name, value: e.target.value }));
  };

  const handleSaveToDatabase = async (e) => {
    e.preventDefault();
    try {
      // Check for duplicates before saving
      const dupCheck = await checkDuplicate({
        customerName: formData.customerName,
        productId: formData.productId,
        batchNumber: formData.batchNumber
      });

      if (dupCheck.data.duplicate_detected && !duplicateWarning) {
        dispatch(setDuplicateWarning(dupCheck.data));
        dispatch(setSaveStatus('⚠️ Review duplicate warning below before final commit.'));
        return; 
      }

      await saveComplaint({
        extracted: formData,
        riskAssessment: riskAssessment,
        completenessData: completenessData
      });
      dispatch(setSaveStatus('Record committed to MySQL audit trail successfully!'));
      dispatch(setDuplicateWarning(null));
      
      const res = await getComplaints();
      dispatch(setComplaintsList(res.data));
    } catch (error) {
      console.error('Error saving complaint:', error);
      dispatch(setSaveStatus('Error persisting record.'));
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

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.85rem',
    boxSizing: 'border-box',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s'
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '28px', alignItems: 'start' }}>
      
      {/* LEFT COLUMN: Structured Complaint Form (Demo Layout) */}
      <div style={{ background: '#ffffff', padding: '28px', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
          <div>
            <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.1rem', fontWeight: '700' }}>Log Customer Complaint</h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>API & FDF Quality Assurance Module</p>
          </div>
          <span style={{ fontSize: '0.75rem', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '4px 10px', borderRadius: '6px', fontWeight: '600' }}>
            Ready to Commit
          </span>
        </div>

        {duplicateWarning && (
          <div style={{ marginBottom: '16px', background: '#fffbeb', border: '1px solid #fde047', padding: '12px 16px', borderRadius: '10px', color: '#b45309', fontSize: '0.83rem' }}>
            <strong>⚠️ Possible Duplicate Complaint</strong>
            <p style={{ margin: '4px 0 0 0' }}>{duplicateWarning.duplicate_reason}</p>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#92400e', display: 'block', marginTop: '4px' }}>Click "Save Complaint to MySQL" again to override and commit.</span>
          </div>
        )}

        <form onSubmit={handleSaveToDatabase} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* SECTION 1: Origin & Customer Details */}
          <div>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.82rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              1. Origin & Customer Details
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Complaint Source</label>
                <input type="text" name="complaintSource" value={formData.complaintSource || ''} onChange={handleChange} placeholder="e.g., Pharmacy" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Customer Name</label>
                <input type="text" name="customerName" value={formData.customerName} onChange={handleChange} required placeholder="e.g., Apollo Pharmacy" style={inputStyle} />
              </div>
            </div>
          </div>

          {/* SECTION 2: Product & Batch Identification */}
          <div>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.82rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              2. Product & Batch Identification
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Product Name</label>
                <input type="text" name="productId" value={formData.productId} onChange={handleChange} required placeholder="e.g., Amoxicillin Capsules" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Product Strength</label>
                <input type="text" name="strength" value={formData.strength || ''} onChange={handleChange} placeholder="e.g., 500 mg" style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Batch / Lot Number</label>
                <input type="text" name="batchNumber" value={formData.batchNumber || ''} onChange={handleChange} placeholder="e.g., AMX240602" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Affected Quantity</label>
                <input type="text" name="affectedQuantity" value={formData.affectedQuantity || ''} onChange={handleChange} placeholder="e.g., 12 capsules" style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Manufacturing Date</label>
                <input type="text" name="manufacturingDate" value={formData.manufacturingDate || ''} onChange={handleChange} placeholder="e.g., March 2026" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Expiry Date</label>
                <input type="text" name="expiryDate" value={formData.expiryDate || ''} onChange={handleChange} placeholder="e.g., February 2028" style={inputStyle} />
              </div>
            </div>
          </div>

          {/* SECTION 3: Facility & Material Impact */}
          <div>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.82rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              3. Facility & Material Impact
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Issue Category</label>
                <select name="issueCategory" value={formData.issueCategory} onChange={handleChange} style={inputStyle}>
                  <option value="Product Quality / Appearance">Product Quality / Appearance</option>
                  <option value="Packaging Defect">Packaging Defect</option>
                  <option value="Contamination">Contamination</option>
                  <option value="Adverse Event">Adverse Event</option>
                  <option value="Labeling Error">Labeling Error</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Urgency Level</label>
                <select name="urgencyLevel" value={formData.urgencyLevel} onChange={handleChange} style={inputStyle}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Complaint Description</label>
              <textarea rows="3" name="complaintDescription" value={formData.complaintDescription} onChange={handleChange} required placeholder="Detailed narrative of the quality issue..." style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
            <button type="submit" style={{ padding: '12px 22px', background: duplicateWarning ? '#d97706' : '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)', transition: 'background 0.2s' }}>
              {duplicateWarning ? 'Confirm & Override Duplicate' : 'Save Complaint to MySQL'}
            </button>
            {saveStatus && <span style={{ fontSize: '0.8rem', color: duplicateWarning ? '#d97706' : '#059669', fontWeight: '600', maxWidth: '220px', textAlign: 'right' }}>{saveStatus}</span>}
          </div>
        </form>
      </div>

      {/* RIGHT COLUMN: AI Intake, File Upload & LangGraph Copilot */}
      <div style={{ background: '#ffffff', padding: '28px', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
          <div>
            <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.1rem', fontWeight: '700' }}>AIVOA Copilot</h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>Drop complaint files or paste text below</p>
          </div>
          <span style={{ fontSize: '0.75rem', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '4px 10px', borderRadius: '6px', fontWeight: '600' }}>
            LangGraph AI
          </span>
        </div>

        {/* File Upload Zone */}
        <div style={{ marginBottom: '16px', background: '#f8fafc', border: '2px dashed #cbd5e1', padding: '16px', borderRadius: '10px', textAlign: 'center', transition: 'border-color 0.2s' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '6px', cursor: 'pointer' }}>
            📄 Upload Complaint Document (PDF, Email, Image, Text)
          </label>
          <input 
            type="file" 
            accept=".pdf,.txt,.eml,.png,.jpg,.jpeg" 
            onChange={handleFileUpload} 
            style={{ fontSize: '0.8rem', color: '#475569', cursor: 'pointer' }}
          />
        </div>

        <form onSubmit={handleExtract}>
          <label style={{ display: 'block', fontWeight: '600', fontSize: '0.8rem', marginBottom: '6px', color: '#334155' }}>
            Or Edit Raw Prompt / Document Text:
          </label>
          <textarea
            rows="4"
            value={prompt}
            onChange={(e) => dispatch(setPrompt(e.target.value))}
            placeholder="Type prompt or upload a file above..."
            style={{ ...inputStyle, marginBottom: '14px', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5' }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '12px 16px', background: loading ? '#94a3b8' : '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)', transition: 'background 0.2s' }}
          >
            {loading ? 'Executing LangGraph Workflow...' : '⚡ Extract Data & Assess Risk'}
          </button>
        </form>

        {/* Completeness Warning Banner */}
        {completenessData && !completenessData.is_complete && (
          <div style={{ marginTop: '16px', background: '#fef2f2', border: '1px solid #fca5a5', padding: '12px 16px', borderRadius: '10px', color: '#991b1b', fontSize: '0.83rem' }}>
            <strong>⚠️ Complaint Incomplete</strong>
            <p style={{ margin: '4px 0 2px 0' }}>{completenessData.completeness_message}</p>
            {completenessData.missing_fields?.length > 0 && (
              <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                {completenessData.missing_fields.map((field, idx) => (
                  <li key={idx}>Missing: {field}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* AI Copilot Risk Assessment & Root Cause Panel */}
        {riskAssessment ? (
          <div style={{ marginTop: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '18px', borderRadius: '12px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.01)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, color: '#0f172a', fontSize: '0.95rem', fontWeight: '700' }}>AI Compliance & Root Cause Copilot</h4>
              {(() => {
                const badge = getRiskBadgeStyle(riskAssessment.riskLevel);
                return (
                  <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', backgroundColor: badge.bg, color: badge.text, border: `1px solid ${badge.border}` }}>
                    {riskAssessment.riskLevel || 'Unknown'} Risk
                  </span>
                );
              })()}
            </div>
            
            {riskAssessment.summary && (
              <div style={{ background: '#f0fdf4', padding: '10px 12px', borderRadius: '8px', border: '1px solid #bbf7d0', marginBottom: '12px', fontSize: '0.83rem', color: '#166534' }}>
                <strong>📋 AI Summary:</strong> {riskAssessment.summary}
              </div>
            )}

            <div style={{ fontSize: '0.83rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: '1.5' }}>
              <div><strong>Justification:</strong> {riskAssessment.riskReason}</div>
              <div><strong>Safety Impact:</strong> {riskAssessment.safetyImpact}</div>
              <div><strong>🔍 Root Cause Hypothesis:</strong> <span style={{ color: '#0369a1', fontWeight: '600' }}>{riskAssessment.rootCauseHypothesis}</span></div>
              <div><strong>🛠️ CAPA Recommendation:</strong> <span style={{ color: '#166534', fontWeight: '600' }}>{riskAssessment.capaRecommendation}</span></div>
              <div><strong>Investigation Protocol:</strong> {riskAssessment.investigationRequired}</div>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: '20px', background: '#f8fafc', border: '2px dashed #e2e8f0', padding: '24px', borderRadius: '12px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>🛡️</div>
            <strong>AI Risk Copilot Ready</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>Upload a file or type a prompt to generate automated QA risk evaluations.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default ComplaintForm;