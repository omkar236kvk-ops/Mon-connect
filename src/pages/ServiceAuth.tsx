import React, { useState, useEffect } from "react";
import { Contract } from "ethers";
import VantaBackground from "../components/VantaBackground";
import "./ServiceAuth.css";
import { connectForRole, mintNFTAndWait, ORGANIZER_NFT_ADDRESS, SERVICE_PROVIDER_NFT_ADDRESS, WALLET_SESSION_KEYS } from '../utils/nft';
import { CHAIN_CONNECT_V2_ADDRESS, CHAIN_CONNECT_V2_ABI } from '../utils/chainConnectV2';
import { useNavigate } from 'react-router-dom';

const ServiceAuth: React.FC = () => {
  const [view, setView] = useState<"main" | "signup">("main");
  const [form, setForm] = useState({ ownerName: '', businessName: '', businessType: '', email: '', phone: '', gstNumber: '' });
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  // trigger mount animation
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 20);
    return () => clearTimeout(t);
  }, []);

  const field = (key: keyof typeof form) => ({
    value: form[key],
    maxLength: 256, // contract MAX_FIELD_LEN
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [key]: e.target.value }),
  });

  const run = async (steps: () => Promise<void>) => {
    setError(null);
    try {
      await steps();
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setStatus(null);
    }
  };

  // Existing provider: connect -> dashboard.
  const signIn = () => run(async () => {
    setStatus('Connecting wallet...');
    const { account, registered } = await connectForRole(SERVICE_PROVIDER_NFT_ADDRESS, ORGANIZER_NFT_ADDRESS);
    if (!registered) throw new Error('This wallet is not registered as a service provider yet. Please Sign Up first.');
    sessionStorage.setItem(WALLET_SESSION_KEYS.serviceProvider, account);
    navigate('/service-dashboard');
  });

  // New provider: connect -> mint NFT -> register profile on chain -> dashboard.
  // Safe to retry after a failure: minting is skipped if the NFT exists, registerVendor upserts.
  const signUp = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      setStatus('Connecting wallet...');
      const { provider, account } = await connectForRole(SERVICE_PROVIDER_NFT_ADDRESS, ORGANIZER_NFT_ADDRESS);
      const signer = await provider.getSigner(account);

      setStatus('Minting your service provider NFT...');
      await mintNFTAndWait(signer, SERVICE_PROVIDER_NFT_ADDRESS);

      setStatus('Verifying your profile on chain...');
      const chainConnect = new Contract(CHAIN_CONNECT_V2_ADDRESS, CHAIN_CONNECT_V2_ABI, signer);
      const tx = await chainConnect.registerVendor(form.businessName, form.businessType, form.ownerName, form.email, form.phone, form.gstNumber);
      await tx.wait();

      sessionStorage.setItem(WALLET_SESSION_KEYS.serviceProvider, account);
      navigate('/service-dashboard');
    });
  };

  return (
    <div className="app">
      <VantaBackground />
      <div className="logo">MonConnect</div>

      <div className={`auth-container ${mounted ? 'page-enter' : ''}`}>
        {view === "main" && (
          <>
            <h2>Service Provider Portal</h2>
            <div className="button-container">
              <button className="btn btn-primary" onClick={signIn} disabled={!!status}>
                Sign In
              </button>
              <button className="btn btn-secondary" onClick={() => { setError(null); setView("signup"); }} disabled={!!status}>
                Sign Up
              </button>
            </div>
          </>
        )}

        {view === "signup" && (
          <div className="signup-section">
            <h2>Sign Up</h2>
            <form className="signup-form" onSubmit={signUp}>
              <input type="text" placeholder="Full Name of Owner" required {...field('ownerName')} />
              <input type="text" placeholder="Business Name" required {...field('businessName')} />
              <select required {...field('businessType')}>
                <option value="">Select Business Type</option>
                <option value="Catering">Catering</option>
                <option value="Merchandise">Merchandise</option>
                <option value="Photography">Photography</option>
                <option value="Co-working Space">Co-Working Space</option>
                <option value="Marketing">Marketing</option>
                <option value="Printing and Signage">Printing and Signage</option>
              </select>
              <input type="email" placeholder="Email" required {...field('email')} />
              <input type="tel" placeholder="Phone Number" required {...field('phone')} />
              <input type="text" placeholder="GST Number" required {...field('gstNumber')} />
              <button type="submit" className="btn btn-primary" disabled={!!status}>
                {status || 'Register & Connect Wallet'}
              </button>
            </form>

            <button className="btn btn-text" onClick={() => { setError(null); setView("main"); }} disabled={!!status}>
              ← Back
            </button>
          </div>
        )}

        {view === "main" && status && <p className="info-message">{status}</p>}
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

export default ServiceAuth;
