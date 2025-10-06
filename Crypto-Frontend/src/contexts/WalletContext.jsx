import { createContext, useEffect, useState } from 'react';
import axios from 'axios';

export const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchWallet = async () => {
    const tokens = JSON.parse(localStorage.getItem("authTokens"));
    if (!tokens) return;

    try {
      const response = await axios.get("http://127.0.0.1:8000/api/v1/account/wallet/", {
        headers: {
          Authorization: `Bearer ${tokens.access}`,
        },
      });

      setBalance(response.data.balance);
    } catch (error) {
      console.error("Failed to fetch wallet:", error);
      setBalance("0.00");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  return (
    <WalletContext.Provider value={{ balance, loading, refreshWallet: fetchWallet }}>
      {children}
    </WalletContext.Provider>
  );
};
