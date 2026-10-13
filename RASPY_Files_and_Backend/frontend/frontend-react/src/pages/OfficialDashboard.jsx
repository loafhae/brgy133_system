import React, { useState, useEffect } from 'react';
import api from '../api/client';

export default function OfficialDashboard() {
  const [announcements, setAnnouncements] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [detectionLogs, setDetectionLogs] = useState([]);

  const fetchDashboardData = async () => {
    try {
      const announceRes = await api.get('/announcements?published_only=true&limit=3');
      if (announceRes.data) {
        setAnnouncements(announceRes.data);
      }

      const feedbackRes = await api.get('/feedback?limit=5');
      if (feedbackRes.data) {
        setFeedbacks(feedbackRes.data);
      }

      const detectionRes = await api.get('/detection/logs');
      if (detectionRes.data && Array.isArray(detectionRes.data)) {
        setDetectionLogs(detectionRes.data.slice(0, 4));
      }
    } catch (err) {
      console.error("Error loading official dashboard data via api client:", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    let feedbackSocket = null;
    let systemSocket = null;
    let feedbackReconnectTimer = null;
    let systemReconnectTimer = null;

    function connectSockets() {
      let wsBaseUrl;
      try {
        const baseURL = api.defaults.baseURL || window.location.origin;
        const parsedUrl = new URL(baseURL, window.location.origin);
        const wsProtocol = parsedUrl.protocol === 'https:' ? 'wss:' : 'ws:';
        wsBaseUrl = `${wsProtocol}//${parsedUrl.host}`;
      } catch (e) {
        wsBaseUrl = window.location.origin.replace(/^http/, 'ws');
      }

      try {
        const token = localStorage.getItem('token') || localStorage.getItem('access_token') || '';
        const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';

        feedbackSocket = new WebSocket(`${wsBaseUrl}/api/ws/feedback-updates${tokenParam}`);
        systemSocket = new WebSocket(`${wsBaseUrl}/api/ws${tokenParam}`);

        feedbackSocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data?.event === "new_feedback") fetchDashboardData();
          } catch (e) { console.error(e); }
        };

        systemSocket.onmessage = () => {
          fetchDashboardData();
        };

        systemSocket.onclose = () => {
          systemReconnectTimer = setTimeout(connectSockets, 3000);
        };

        feedbackSocket.onclose = () => {
          feedbackReconnectTimer = setTimeout(connectSockets, 3000);
        };

        systemSocket.onerror = () => {};
        feedbackSocket.onerror = () => {};
      } catch (err) {
        console.warn("WebSocket connection skipped or unavailable:", err);
      }
    }

    connectSockets();

    const polling = setInterval(() => fetchDashboardData(), 5000);

    return () => {
      clearInterval(polling);
      clearTimeout(feedbackReconnectTimer);
      clearTimeout(systemReconnectTimer);
      try {
        if (feedbackSocket) feedbackSocket.close();
        if (systemSocket) systemSocket.close();
      } catch (e) {
        // Cleanup error suppression
      }
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
          {announcements?.length > 0 ? (
            announcements.map((item) => (
              <div 
                key={item?.announcement_id} 
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
                    {item?.title}
                  </h4>
                  <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#495057', lineHeight: '1.4' }}>
                    {item?.content}
                  </p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#868e96' }}>
                  <span>Posted: {item?.date_posted ? new Date(item.date_posted).toLocaleDateString() : 'Recent'}</span>
                  {item?.attachment_path && <span style={{ color: '#1976d2', fontWeight: '600' }}>📎 Has Attachment</span>}
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
            📥 Recent Resident Feedbacks
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '420px', paddingRight: '4px' }}>
            {feedbacks?.length > 0 ? (
              feedbacks.map((fb) => (
                <div 
                  key={fb?.feedback_id} 
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
                      @{fb?.username || 'Resident'}
                    </span>
                    <span style={{ fontSize: '11px', color: '#868e96' }}>
                      {fb?.timestamp ? new Date(fb.timestamp).toLocaleString() : ''}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#212529' }}>
                    Activity/Subject: {fb?.subject}
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#495057', lineHeight: '1.4' }}>
                    Description: {fb?.content}
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

          {detectionLogs?.length > 0 ? (
            detectionLogs.map((log) => {
              const confidence = log?.confidence_score ?? 0;
              const eventType = log?.event_type;
              const isPresent = eventType === 'truck_present';
              const isDeparted = eventType === 'truck_departed';
              const label = isPresent ? 'TRUCK DETECTED' : isDeparted ? 'TRUCK LEFT' : 'SCANNING';
              const borderCol = isPresent ? '#c62828' : isDeparted ? '#e65100' : '#adb5bd';
              const bgCol = isPresent ? '#ffebee' : isDeparted ? '#fff3e0' : '#f1f3f5';
              const textCol = isPresent ? '#c62828' : isDeparted ? '#e65100' : '#6c757d';
              return (
                <div 
                  key={log?.log_id} 
                  style={{ 
                    backgroundColor: '#fff', 
                    padding: '16px', 
                    borderRadius: '8px', 
                    boxShadow: '0 4px 6px rgba(0,0,0,0.04)',
                    borderRight: `5px solid ${borderCol}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#212529' }}>
                      {log?.camera_name || 'Camera'}
                    </span>
                    <span 
                      style={{ 
                        fontSize: '10px', 
                        padding: '2px 6px', 
                        borderRadius: '4px', 
                        fontWeight: '700',
                        backgroundColor: bgCol,
                        color: textCol
                      }}
                    >
                      {label}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6c757d' }}>
                    <span>Confidence: {(confidence * 100).toFixed(1)}%</span>
                    <span>{log?.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
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