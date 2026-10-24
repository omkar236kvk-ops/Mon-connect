import React, { useState, useEffect } from "react";
import VantaBackground from "../components/VantaBackground";
import "./OrganizerAuth.css";
import { connectForRole, mintNFTAndWait, ORGANIZER_NFT_ADDRESS, SERVICE_PROVIDER_NFT_ADDRESS, WALLET_SESSION_KEYS } from '../utils/nft';
import { useNavigate } from 'react-router-dom';

const OrganizerAuth: React.FC = () => {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  // trigger mount animation
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 20);
    return () => clearTimeout(t);
  }, []);

  // Existing: connect -> dashboard. New: connect -> mint NFT -> dashboard.
  const enter = async (isSignUp: boolean) => {
    setError(null);
    try {
      setStatus('Connecting wallet...');
      const { provider, account, registered } = await connectForRole(ORGANIZER_NFT_ADDRESS, SERVICE_PROVIDER_NFT_ADDRESS);
      if (!registered) {
        if (!isSignUp) throw new Error('This wallet is not registered as an organizer yet. Click Sign Up to mint your NFT.');
        setStatus('Minting your organizer NFT...');
        await mintNFTAndWait(await provider.getSigner(account), ORGANIZER_NFT_ADDRESS);
      }
      sessionStorage.setItem(WALLET_SESSION_KEYS.organizer, account);
      navigate('/organizer-dashboard');
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setStatus(null);
    }
  };

  return (
    <div className="app">
      <VantaBackground />
      <div className="logo">MonConnect</div>

      <div className={`auth-container ${mounted ? 'page-enter' : ''}`}>
        <h2>Organizer Portal</h2>
        <div className="button-container">
          <button className="btn btn-primary" onClick={() => enter(false)} disabled={!!status}>
            Sign In
          </button>
          <button className="btn btn-secondary" onClick={() => enter(true)} disabled={!!status}>
            Sign Up
          </button>
        </div>

        {status && <p className="info-message">{status}</p>}
        {error && <p className="error-message">{error}</p>}

        {!window.ethereum && (
          <p className="info-message">
            Don't have MetaMask?{' '}
            <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer">
              Install it here
            </a>
          </p>
        )}
      </div>
    </div>
  );
};

export default OrganizerAuth;
