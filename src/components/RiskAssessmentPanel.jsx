const RiskAssessmentPanel = ({ riskData }) => {
  if (!riskData) {
    return (
      <div style={{ marginTop: '20px', background: '#f8fafc', border: '1px dashed #cbd5e1', padding: '15px', borderRadius: '8px', color: '#64748b', textAlign: 'center' }}>
        AI Copilot Risk Assessment will appear here after extraction.
      </div>
    );
  }

  const getRiskColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'critical': return { bg: '#fee2e2', text: '#991b1b' };
      case 'high': return { bg: '#ffedd5', text: '#c2410c' };
      case 'moderate': return { bg: '#fef3c7', text: '#b45309' };
      default: return { bg: '#dcfce7', text: '#166534' };
    }
  };

  const badgeStyle = getRiskColor(riskData.riskLevel);

  return (
    <div style={{ marginTop: '20px', background: 'white', border: '1px solid #e2e8f0', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h4 style={{ margin: 0, color: '#1e293b' }}>🤖 AI Copilot Risk Assessment</h4>
        <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: badgeStyle.bg, color: badgeStyle.text }}>
          {riskData.riskLevel || 'Unknown'} Risk
        </span>
      </div>

      <div style={{ fontSize: '0.85rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div><strong>Reason:</strong> {riskData.riskReason}</div>
        <div><strong>Patient/Safety Impact:</strong> {riskData.safetyImpact}</div>
        <div><strong>Recommended Action:</strong> {riskData.recommendedAction}</div>
        <div><strong>Investigation Required:</strong> {riskData.investigationRequired}</div>
        {riskData.missingFields && riskData.missingFields.length > 0 && (
          <div style={{ color: '#b91c1c' }}><strong>Missing Critical Fields:</strong> {riskData.missingFields.join(', ')}</div>
        )}
      </div>
    </div>
  );
};

export default RiskAssessmentPanel;