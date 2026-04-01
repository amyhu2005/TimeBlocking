import React from 'react';

interface HelpModalProps {
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="tb-modal-overlay" onClick={onClose}>
      <div className="tb-modal" onClick={e => e.stopPropagation()} style={{ 
        maxHeight: '85vh', 
        maxWidth: '600px',
        width: '90%',
        borderRadius: '24px',
        padding: '2rem',
        overflowY: 'auto', 
        background: 'white', 
        color: '#1E293B' 
      }}>
        <button className="tb-modal-close" onClick={onClose} style={{ color: '#64748B', top: '1.5rem', right: '1.5rem' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        
        <div style={{ padding: '0.5rem', lineHeight: '1.7', fontSize: '1rem', fontWeight: 500 }}>
          <p style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.5rem', color: '#0F172A' }}>Hi~ Thanks for using TimeBlock</p>
          
          <p style={{ marginBottom: '1.5rem', color: '#475569' }}>I made this because I wanted to visualize how I was spending my time and feel the satisfaction of seeing hours invested into a skill I care about accrue.</p>
          
          <p style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '1rem', color: '#0F172A' }}>It's simple!</p>
          
          <ol style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem', color: '#475569' }}>
            <li>Create subjects</li>
            <li>Log Hours</li>
            <li><strong>Block Hours</strong>: Click on subject and the click on the grid! (double click on computer) Block fun pictures, sort the blocks, do whatever to help you visualize your time the best!</li>
            <li>Edit hours whenever you'd like by pressing on the subjects</li>
            <li>Press the block to see time trends for specific subjects (or to delete the block)</li>
            <li>Share with friends by saving png or linking to friend's account</li>
            <li><strong>Time audit</strong> is a place you can include hours of sleep so you can see how many hours you have left to make the most out of!</li>
            <li>Select time range or select subject if you want to visualize a specific time frame. Data for time audit and share will reflect the time range selected.</li>
          </ol>

          <p style={{ marginBottom: '1.5rem', opacity: 0.8, color: '#64748B' }}>For suggestions or bugs email: <a href="mailto:amyhu2005@gmail.com" style={{ color: '#F87171', textDecoration: 'none', fontWeight: 700 }}>amyhu2005@gmail.com</a></p>
          
          <p style={{ fontWeight: 800, fontSize: '1.2rem', textAlign: 'center', marginTop: '2.5rem', color: '#F87171' }}>have fun visualizing time and playing time minecraft!</p>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
