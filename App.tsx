import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './services/firebase';
import Navbar from './components/Navbar';
import PublicHome from './components/PublicHome';
import Footer from './components/Footer';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import PublicShowcase from './components/PublicShowcase';
import TrackingView from './components/TrackingView';
import AdminDashboard from './components/AdminDashboard';
import AnnouncementTicker from './components/AnnouncementTicker';
import PartnersList from './components/PartnersList';
import ZuaSupportBubble from './components/ZuaSupportBubble';
import AgentScanner from './components/AgentScanner';

// Types de Navigation
type ViewState = 'HOME' | 'LOGIN' | 'DASHBOARD' | 'PUBLIC_VITRINE' | 'TRACKING' | 'ADMIN_DASHBOARD' | 'PARTNERS' | 'AGENT_SCANNER';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('HOME');
  const [showcaseId, setShowcaseId] = useState<string | null>(null);

  // --- MISSION 2 : MOUCHARD DE TRAFIC ---
  useEffect(() => {
    const logVisit = async () => {
      const visitId = localStorage.getItem('visit_id');
      if (!visitId) { 
         try {
           const res = await fetch('https://ipapi.co/json/');
           const data = await res.json();
           
           await addDoc(collection(db, 'traffic_logs'), {
              ip: data.ip || 'Anonyme',
              city: data.city || 'Inconnue',
              country: data.country_name || 'RDC',
              device: navigator.userAgent,
              timestamp: serverTimestamp(),
              page: 'Accueil Arena'
           });
           localStorage.setItem('visit_id', 'logged');
         } catch(e) { console.log("Mouchard silencieux actif"); }
      }
    };
    logVisit();
  }, []);

  // --- ROUTAGE URL INTELLIGENT ---
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const orgId = params.get('org');
      const path = window.location.pathname;
      
      if (path === '/track') {
         setView('TRACKING');
      } else if (path === '/scan-access') {
         setView('AGENT_SCANNER');
      } else if (orgId) {
        setShowcaseId(orgId);
        setView('PUBLIC_VITRINE');
      }
    } catch (e) {
      console.error("Navigation Error:", e);
    }
  }, []);

  // Gestionnaires de Navigation
  const handleLoginSuccess = () => setView('DASHBOARD');
  const handleLogout = () => setView('HOME');
  const goToHome = () => { setView('HOME'); setShowcaseId(null); };
  const handlePartnerClick = (organizerId: string) => {
    setShowcaseId(organizerId);
    setView('PUBLIC_VITRINE');
  };

  return (
    <div 
      className="min-h-screen flex flex-col font-sans w-full max-w-7xl mx-auto px-4" 
      onContextMenu={(e) => e.preventDefault()} 
      style={{ userSelect: 'none' }}
    >
      {/* BANDE DÉFILANTE GLOBALE */}
      <AnnouncementTicker />

      {/* NAVBAR (Cachée en mode Admin et Scanner Agent) */}
      {view !== 'ADMIN_DASHBOARD' && view !== 'AGENT_SCANNER' && (
        <Navbar 
          onLoginClick={() => setView('LOGIN')} 
          onHomeClick={goToHome}
          onTrackClick={() => setView('TRACKING')}
          onAdminClick={() => setView('ADMIN_DASHBOARD')}
          onPartnersClick={() => setView('PARTNERS')}
        />
      )}
      
      {/* AMBIANCE LUMINEUSE (Désactivée en Admin/Scanner pour perf) */}
      {view !== 'ADMIN_DASHBOARD' && view !== 'AGENT_SCANNER' && (
        <>
          <div className="fixed top-[10%] left-[20%] w-[600px] h-[600px] bg-royal-light/20 rounded-full blur-[120px] pointer-events-none z-0 mix-blend-multiply"></div>
          <div className="fixed top-[40%] right-[10%] w-[500px] h-[500px] bg-royal-main/10 rounded-full blur-[100px] pointer-events-none z-0 mix-blend-multiply"></div>
        </>
      )}

      {/* CONTENU PRINCIPAL */}
      <main className="flex-grow z-10 relative">
        {view === 'HOME' && <PublicHome />}
        
        {view === 'TRACKING' && (
           <div className="max-w-7xl mx-auto px-4"><TrackingView /></div>
        )}

        {view === 'AGENT_SCANNER' && <AgentScanner />}

        {view === 'PARTNERS' && (
           <div className="max-w-7xl mx-auto px-4"><PartnersList onPartnerClick={handlePartnerClick} /></div>
        )}

        {view === 'PUBLIC_VITRINE' && showcaseId && (
          <PublicShowcase organizerId={showcaseId} />
        )}

        {view === 'LOGIN' && (
          <div className="container mx-auto px-4 pb-20">
             <Login onSuccess={handleLoginSuccess} />
          </div>
        )}

        {view === 'DASHBOARD' && <Dashboard onLogout={handleLogout} />}

        {view === 'ADMIN_DASHBOARD' && <AdminDashboard onLogout={handleLogout} />}
      </main>
      
      {/* BULLE SUPPORT (sauf Admin/Scanner) */}
      {view !== 'ADMIN_DASHBOARD' && view !== 'AGENT_SCANNER' && <ZuaSupportBubble />}

      {/* FOOTER (Caché sur Home, Admin et Scanner car géré spécifiquement) */}
      {view !== 'ADMIN_DASHBOARD' && view !== 'AGENT_SCANNER' && view !== 'HOME' && <Footer />}
    </div>
  );
};

export default App;