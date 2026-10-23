import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getProvider, hasNFT, ORGANIZER_NFT_ADDRESS, SERVICE_PROVIDER_NFT_ADDRESS, WALLET_SESSION_KEYS } from '../utils/nft';

const NFTGuard: React.FC<{ children: React.ReactNode; requiredRole?: 'organizer' | 'service-provider' | 'any' }> = ({ 
  children, 
  requiredRole = 'any' 
}) => {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const check = async () => {
      const prov = getProvider();
      if (!prov) {
        setAuthorized(false);
        navigate('/');
        return;
      }
      try {
        const sessionKey = requiredRole === 'organizer'
          ? WALLET_SESSION_KEYS.organizer
          : requiredRole === 'service-provider'
            ? WALLET_SESSION_KEYS.serviceProvider
            : WALLET_SESSION_KEYS.organizer;
        const selectedAddress = sessionStorage.getItem(sessionKey);
        if (!selectedAddress) {
          setAuthorized(false);
          navigate('/', { replace: true });
          return;
        }
        const signer = await prov.getSigner(selectedAddress);
        const address = await signer.getAddress();
        
        const ownsOrganizer = await hasNFT(prov, address, ORGANIZER_NFT_ADDRESS);
        const ownsServiceProvider = await hasNFT(prov, address, SERVICE_PROVIDER_NFT_ADDRESS);
        
        // If on generic /dashboard route, redirect to specific dashboard
        if (location.pathname === '/dashboard') {
          if (ownsOrganizer && !ownsServiceProvider) {
            navigate('/organizer-dashboard', { replace: true });
            return;
          } else if (ownsServiceProvider && !ownsOrganizer) {
            navigate('/service-dashboard', { replace: true });
            return;
          }
        }
        
        // Check authorization based on required role
        if (requiredRole === 'organizer' && ownsOrganizer && !ownsServiceProvider) {
          setAuthorized(true);
        } else if (requiredRole === 'service-provider' && ownsServiceProvider && !ownsOrganizer) {
          setAuthorized(true);
        } else if (requiredRole === 'any' && (ownsOrganizer !== ownsServiceProvider)) {
          setAuthorized(true);
        } else {
          setAuthorized(false);
          navigate('/');
        }
      } catch (err) {
        console.error('NFTGuard check failed', err);
        setAuthorized(false);
        navigate('/');
      }
    };

    check();
  }, [navigate, location.pathname, requiredRole]);

  if (authorized === null) return <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    minHeight: '100vh',
    color: '#fff',
    fontSize: '1.2rem'
  }}>Checking access...</div>;
  if (!authorized) return null;
  return <>{children}</>;
};

export default NFTGuard;
