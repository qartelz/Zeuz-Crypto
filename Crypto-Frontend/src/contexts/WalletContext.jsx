import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

const baseURL = import.meta.env.VITE_API_BASE_URL;
export const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const authContext = useContext(AuthContext);

  if (!authContext) {
    console.warn('WalletProvider must be used within an AuthProvider');
    return null; 
  }

  const { authTokens } = authContext;
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchWallet = async () => {
    if (!authTokens) {
      setBalance(null);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${baseURL}account/wallet/`, {
        headers: {
          Authorization: `Bearer ${authTokens.access}`,
        },
      });

      setBalance(response.data.balance);
    } catch (error) {
      console.error('Failed to fetch wallet:', error);
      setBalance('0.00');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, [authTokens]);

  return (
    <WalletContext.Provider value={{ balance, loading, refreshWallet: fetchWallet }}>
      {children}
    </WalletContext.Provider>
  );
};
