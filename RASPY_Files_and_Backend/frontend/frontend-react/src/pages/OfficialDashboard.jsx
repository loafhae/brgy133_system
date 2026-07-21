import React, { useState, useEffect } from 'react';
import api from '../api/client'; // Import your pre-configured axios instance

export default function OfficialDashboard() {
  const [announcements, setAnnouncements] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [detectionLogs, setDetectionLogs] = useState([]);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch real Announcements using your configured axios instance
      const announceRes = await api.get('/announcements?published_only=true&limit=3');
      if (announceRes.data) {
        setAnnouncements(announceRes.data);
      }

      // 2. Fetch real resident Feedback
      const feedbackRes = await api.get('/feedback?limit=5');
      if (feedbackRes.data) {
        setFeedbacks(feedbackRes.data);
      }

      // 3. Fetch real Vision-Trak Camera Detection Logs
      const detectionRes = await api.get('/detection/logs');
      if (detectionRes.data) {
        setDetectionLogs(detectionRes.data.slice(0, 4));
      }
    } catch (err) {
      console.error("Error loading official dashboard data via api client:", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Background WebSockets for real-time dashboard hot-reloading
    const feedbackSocket = new WebSocket('wss://vision-worldcat-paint-typical.trycloudflare.com/api/ws/feedback-updates');
    const systemSocket = new WebSocket('wss://vision-worldcat-paint-typical.trycloudflare.com/api/ws');

    feedbackSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === "new_feedback") fetchDashboardData();
      } catch (e) { console.error(e); }
    };

    systemSocket.onmessage = () => {
      fetchDashboardData();
    };

    return () => {
      feedbackSocket.close();
      systemSocket.close();
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', fontFamily: 'sans-serif' }}>
      
      {/* SECTION 1: Top Announcements Grid */}
      <div>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#212529' }}>
          📢 Active Announcements
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {announcements.length > 0 ? (
            announcements.map((item) => (
              <div 
                key={item.announcement_id} 
                style={{
                  backgroundColor: '#fff',
                  padding: '20px',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.04)',
                  borderLeft: '5px solid #1976d2',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#212529', fontWeight: '700' }}>
                    {item.title}
                  </h4>
                  <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#495057', lineHeight: '1.4' }}>
                    {item.content}
                  </p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#868e96' }}>
                  <span>Posted: {item.date_posted ? new Date(item.date_posted).toLocaleDateString() : 'Recent'}</span>
                  {item.attachment_path && <span style={{ color: '#1976d2', fontWeight: '600' }}>📎 Has Attachment</span>}
                </div>
              </div>
            ))
          ) : (
            <div style={{ gridColumn: '1/-1', backgroundColor: '#fff', padding: '24px', borderRadius: '8px', textAlign: 'center', color: '#868e96', fontStyle: 'italic', fontSize: '13px', boxShadow: '0 4px 6px rgba(0,0,0,0.04)' }}>
              No dynamic announcements currently published in tbl_announcement.
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: Bottom Double-Column Split Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* LEFT COMPONENT: RESIDENT FEEDBACK LIST FEED */}
        <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.04)', border: '1px solid #f1f3f5' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '700', color: '#212529', borderBottom: '2px solid #f8f9fa', paddingBottom: '12px' }}>
            📥 Recent Resident Feedbacks (From Database)
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '420px', paddingRight: '4px' }}>
            {feedbacks.length > 0 ? (
              feedbacks.map((fb) => (
                <div 
                  key={fb.feedback_id} 
                  style={{ 
                    padding: '14px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '6px', 
                    borderLeft: '4px solid #fd7e14', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '4px' 
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#1976d2' }}>
                      @{fb.username || 'Resident'}
                    </span>
                    <span style={{ fontSize: '11px', color: '#868e96' }}>
                      {new Date(fb.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#212529' }}>
                    Activity/Subject: {fb.subject}
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#495057', lineHeight: '1.4' }}>
                    Description: {fb.content}
                  </p>
                </div>
              ))
            ) : (
              <div style={{ padding: '30px', textAlign: 'center', color: '#868e96', fontStyle: 'italic', fontSize: '13px' }}>
                No active rows stored inside tbl_feedback.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COMPONENT: REAL-TIME VISION-TRAK TRACKING DETECTION CARDS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h4 style={{ margin: '0', fontSize: '15px', fontWeight: '700', color: '#212529' }}>
            📹 Live Vision-Trak Camera Tracking
          </h4>

          {detectionLogs.length > 0 ? (
            detectionLogs.map((log) => {
              const isHighConfidence = log.confidence_score >= 0.80;
              return (
                <div 
                  key={log.log_id} 
                  style={{ 
                    backgroundColor: '#fff', 
                    padding: '16px', 
                    borderRadius: '8px', 
                    boxShadow: '0 4px 6px rgba(0,0,0,0.04)',
                    borderRight: isHighConfidence ? '5px solid #c62828' : '5px solid #adb5bd',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#212529' }}>
                      {log.camera_name}
                    </span>
                    <span 
                      style={{ 
                        fontSize: '10px', 
                        padding: '2px 6px', 
                        borderRadius: '4px', 
                        fontWeight: '700',
                        backgroundColor: isHighConfidence ? '#ffebee' : '#f1f3f5',
                        color: isHighConfidence ? '#c62828' : '#6c757d'
                      }}
                    >
                      {isHighConfidence ? 'TRUCK DETECTED' : 'SCANNING'}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6c757d' }}>
                    <span>Confidence: {(log.confidence_score * 100).toFixed(1)}%</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', textAlign: 'center', color: '#868e96', fontStyle: 'italic', fontSize: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.04)' }}>
              No structural logs detected inside tbl_detectionlog.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}