import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from "html5-qrcode";
import { db } from '../../services/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { CheckCircle, XCircle, Shield, MapPin, LogOut, AlertTriangle, RotateCcw } from 'lucide-react';

const AgentScanner = () => {
  const [accessGranted, setAccessGranted] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<{name: string} | null>(null);
  const [selectedZone, setSelectedZone] = useState("");
  const [pin, setPin] = useState("");
  const [scanResult, setScanResult] = useState<'success' | 'error' | null>(null);
  const [message, setMessage] = useState("Prêt à scanner");
  const [securityConfig, setSecurityConfig] = useState<{agents: any[], zones: string[]}>({agents: [], zones: []});
  const [scanVersion, setScanVersion] = useState(0); // Pour forcer le remount du scanner proprement

  // Charger la config sécurité
  useEffect(() => {
    const fetchSecurity = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'security'));
        if (snap.exists()) setSecurityConfig(snap.data() as any);
      } catch (e) {
        console.error("Erreur chargement config securité", e);
      }
    };
    fetchSecurity();
  }, []);

  // RESTAURATION SESSION (Anti-Reload)
  useEffect(() => {
    const savedAgent = localStorage.getItem('hasht_agent_session');
    const savedZone = localStorage.getItem('hasht_agent_zone');
    
    if (savedAgent) {
      setSelectedAgent(JSON.parse(savedAgent));
      setAccessGranted(true);
    }
    if (savedZone) {
      setSelectedZone(savedZone);
    }
  }, []);

  const handleLogin = () => {
    const agent = securityConfig.agents.find(a => a.pin === pin);
    if (agent) {
      setSelectedAgent(agent);
      setAccessGranted(true);
      localStorage.setItem('hasht_agent_session', JSON.stringify(agent));
    } else {
      alert("PIN INCORRECT ! ACCÈS REFUSÉ.");
      setPin("");
    }
  };

  const handleZoneSelect = (z: string) => {
      setSelectedZone(z);
      localStorage.setItem('hasht_agent_zone', z);
  };

  const handleLogout = () => {
      if(window.confirm("Déconnecter l'agent ?")) {
          localStorage.removeItem('hasht_agent_session');
          localStorage.removeItem('hasht_agent_zone');
          setAccessGranted(false);
          setSelectedAgent(null);
          setSelectedZone("");
          setPin("");
      }
  };

  const handleSOS = async () => {
    if (!selectedAgent || !window.confirm("CONFIRMER L'ENVOI D'UNE ALERTE SOS ?")) return;
    try {
      await addDoc(collection(db, 'security_alerts'), {
        agent: selectedAgent.name,
        zone: selectedZone || "Inconnue",
        timestamp: serverTimestamp(),
        type: 'SOS_EMERGENCY'
      });
      alert("ALERTE SOS ENVOYÉE ! L'ADMINISTRATION A ÉTÉ NOTIFIÉE.");
    } catch(e) {
      alert("Erreur lors de l'envoi de l'alerte.");
    }
  };

  const handleNextScan = () => {
    setScanResult(null);
    setMessage("Prêt à scanner");
    setScanVersion(prev => prev + 1); // Remount ScannerLogic
  };

  // 1. ÉCRAN PIN
  if (!accessGranted) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-slate-200">
        <div className="bg-slate-800 p-8 rounded-[2rem] border-2 border-amber-500/30 text-center w-full max-w-sm shadow-2xl">
          <Shield size={64} className="mx-auto text-amber-500 mb-6 animate-pulse" />
          <h1 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">CONTRÔLE D'ACCÈS</h1>
          <p className="text-[10px] text-slate-500 uppercase font-bold mb-8 tracking-widest">Veuillez entrer votre code agent</p>
          <input
            type="tel"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="****"
            className="w-full bg-black/50 text-white text-center text-4xl tracking-[0.5em] p-6 rounded-2xl border-2 border-slate-700 mb-8 outline-none focus:border-amber-500 transition-all font-mono"
            autoFocus
          />
          <button
            onClick={handleLogin}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black py-5 rounded-2xl text-lg shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
          >
            S'IDENTIFIER
          </button>
        </div>
        <p className="mt-8 text-slate-600 font-mono text-[10px] uppercase">ZUA BILLET SECURE SCAN v27</p>
      </div>
    );
  }

  // 2. ÉCRAN ZONE
  if (!selectedZone) {
    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-slate-200">
            <div className="bg-slate-800 p-8 rounded-[2rem] border border-slate-700 text-center w-full max-w-sm shadow-2xl">
                <MapPin size={48} className="mx-auto text-blue-500 mb-6" />
                <h2 className="text-xl font-black text-white mb-2 uppercase">VOTRE POSITION</h2>
                <p className="text-xs text-slate-500 mb-8">Bonjour <span className="text-white font-bold">{selectedAgent?.name}</span>, où êtes-vous posté ?</p>
                
                <div className="space-y-3 mb-8">
                    {securityConfig.zones.length > 0 ? securityConfig.zones.map(z => (
                        <button 
                            key={z} 
                            onClick={() => handleZoneSelect(z)}
                            className="w-full p-4 rounded-xl bg-slate-700 hover:bg-blue-600 text-white font-bold uppercase text-sm transition-all border border-slate-600"
                        >
                            {z}
                        </button>
                    )) : (
                        <p className="text-red-400 text-xs italic">Aucune zone définie par l'admin.</p>
                    )}
                </div>
                
                <button onClick={handleLogout} className="text-slate-500 font-bold text-xs uppercase flex items-center justify-center gap-2 mx-auto">
                    <LogOut size={14}/> Changer d'agent
                </button>
            </div>
        </div>
    );
  }

  // 3. ÉCRAN SCANNER ACTIF
  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[1000]">
      {/* Header Info */}
      <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/90 to-transparent flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-xs border-2 border-white/20">
                {selectedAgent?.name[0]}
            </div>
            <div>
                <p className="text-white font-black text-sm uppercase">{selectedAgent?.name}</p>
                <button onClick={() => setSelectedZone("")} className="text-[10px] text-blue-400 font-bold uppercase flex items-center gap-1 hover:text-white">
                    <MapPin size={10}/> {selectedZone} (Changer)
                </button>
            </div>
        </div>
        <button onClick={handleLogout} className="p-3 bg-white/10 rounded-full text-white">
            <LogOut size={20}/>
        </button>
      </div>

      {/* SOS BUTTON */}
      <button 
        onClick={handleSOS}
        className="absolute bottom-8 left-6 z-20 w-14 h-14 rounded-full bg-red-600 flex items-center justify-center text-white shadow-2xl border-2 border-white/50 active:scale-95"
      >
        <AlertTriangle size={24} />
      </button>

      {/* SCANNER AREA (Mounted only when scanning) */}
      {!scanResult && (
        <div className="w-full max-w-md px-4 flex flex-col items-center">
            <div id="reader" className="w-full rounded-3xl overflow-hidden border-4 border-white/20 shadow-2xl bg-slate-900 aspect-square"></div>
            <p className="text-center text-slate-400 mt-6 font-mono text-[10px] uppercase tracking-[0.2em] animate-pulse">Recherche QR Code...</p>
            {/* Logic is here to ensure it binds to #reader */}
            <ScannerLogic key={scanVersion} setRes={setScanResult} setMsg={setMessage} agentName={selectedAgent?.name || "Agent"} zone={selectedZone} />
        </div>
      )}

      {/* FEEDBACK OVERLAY - HUGE TEXT */}
      {scanResult && (
        <div className={`absolute inset-0 z-[1001] flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-200 ${scanResult === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6 border-4 border-white/50">
            {scanResult === 'success' ? <CheckCircle size={60} className="text-white" /> : <XCircle size={60} className="text-white" />}
          </div>
          
          <h2 className="text-4xl font-black text-white/80 mb-2 uppercase tracking-tighter">
              {scanResult === 'success' ? 'VALIDÉ' : 'REFUSÉ'}
          </h2>

          {/* NOM DU CLIENT EN GÉANT */}
          <div className="bg-black/20 rounded-2xl p-4 w-full max-w-sm mb-8 backdrop-blur-sm border border-white/10">
              <p className="text-5xl md:text-7xl font-black text-white leading-none break-words uppercase drop-shadow-lg">
                {message}
              </p>
          </div>
          
          <button
            onClick={handleNextScan}
            className="bg-white text-black px-10 py-5 rounded-full font-black text-lg shadow-2xl uppercase tracking-widest active:scale-95 transition-all flex items-center gap-2"
          >
            <RotateCcw size={20} /> SCAN SUIVANT
          </button>
        </div>
      )}
    </div>
  );
};

// Composant logique séparé pour éviter les re-renders inutiles du UI et gérer le cycle de vie du scanner
const ScannerLogic: React.FC<{ setRes: (res: 'success' | 'error' | null) => void; setMsg: (msg: string) => void; agentName: string; zone: string; }> = ({ setRes, setMsg, agentName, zone }) => {
  useEffect(() => {
    // Config optimisée pour mobile (caméra arrière forcée)
    const scanner = new Html5QrcodeScanner(
        "reader", 
        { 
            fps: 15, 
            qrbox: { width: 250, height: 250 },
            videoConstraints: {
                facingMode: "environment" // FORCE LA CAMERA ARRIERE
            }
        }, 
        false
    );
    
    scanner.render(async (txt) => {
      const ticketId = txt.replace('ZUA-', '').trim();
      
      try {
        await scanner.clear(); // Arrêt immédiat pour éviter double scan
      } catch (e) {
        console.error("Scanner clear error", e);
      }

      try {
        const ref = doc(db, 'orders', ticketId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const d = snap.data();
          const status = d.status?.toLowerCase();

          if (status === 'paid') {
            await updateDoc(ref, { 
                status: 'used', 
                usedAt: serverTimestamp(),
                scannedBy: agentName,
                scanLocation: zone
            });
            setRes('success');
            // Affichage Prénom + Nom tronqué pour lisibilité
            const name = d.clientName || d.customerName || "INVITÉ";
            setMsg(name.split(' ')[0]); 
          } else if (status === 'used') {
            const time = d.usedAt?.toDate ? d.usedAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '??:??';
            setRes('error');
            setMsg(`DÉJÀ ENTRÉ (${time})`);
          } else {
            setRes('error');
            setMsg("NON PAYÉ");
          }
        } else {
          setRes('error');
          setMsg("INCONNU");
        }
      } catch (e) {
        setRes('error');
        setMsg("ERREUR WIFI");
      }
    }, (err) => { });

    return () => {
      scanner.clear().catch(e => console.warn("Cleanup scanner error", e));
    };
  }, []);
  
  return null;
};

export default AgentScanner;