import React, { createContext, useContext, useEffect, useState } from "react";

const PnLContext = createContext();

export const usePnL = () => {
  const context = useContext(PnLContext);
  if (!context) {
    throw new Error("usePnL must be used within a PnLProvider");
  }
  return context;
};

const baseURL = import.meta.env.VITE_API_BASE_URL;
export const PnLProvider = ({ children }) => {
  const [totalPnL, setTotalPnL] = useState(0);
  const [totalPnLPercentage, setTotalPnLPercentage] = useState(0);
  const [holdings, setHoldings] = useState([]);
  const [livePrices, setLivePrices] = useState({});
  const [isLoading, setisLoading] = useState(false);

  // Fetch holdings
  const fetchHoldings = async () => {
    try {
      setisLoading(true);
      const tokens = JSON.parse(localStorage.getItem("authTokens"));
      
      if (!tokens?.access) {
        return;
      }

      const response = await fetch(`${baseURL}trading/api/trading/trades/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens.access}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch holdings");
      }

      const data = await response.json();
      
      // Get only open holdings
      const openHoldings = data.results.filter(
        (trade) => trade.status === "OPEN" || trade.status === "PARTIALLY_CLOSED"
      );

      setHoldings(openHoldings);
    } catch (error) {
      console.error("Error fetching holdings:", error);
    } finally {
      setisLoading(false);
    }
  };

  // Setup WebSocket connections for live prices
  useEffect(() => {
    if (holdings.length === 0) return;

    const spotHoldings = holdings.filter((h) => h.trade_type === "SPOT");
    const futuresHoldings = holdings.filter((h) => h.trade_type === "FUTURES");

    let binanceWs, deltaWs;

    // BINANCE (SPOT)
    if (spotHoldings.length > 0) {
      const streams = spotHoldings
        .map((h) => `${h.asset_symbol.toLowerCase()}usdt@trade`)
        .join("/");

      if (streams) {
        binanceWs = new WebSocket(
          `wss://stream.binance.com:9443/stream?streams=${streams}`
        );

        binanceWs.onmessage = (event) => {
          const response = JSON.parse(event.data);
          if (response.data && response.data.s && response.data.p) {
            const symbol = response.data.s.replace("USDT", "");
            setLivePrices((prev) => ({
              ...prev,
              [symbol]: response.data.p,
            }));
          }
        };

        binanceWs.onerror = (error) =>
          console.error("Binance PnL WebSocket error:", error);
      }
    }

    // DELTA (FUTURES)
    if (futuresHoldings.length > 0) {
      deltaWs = new WebSocket("wss://socket.delta.exchange");

      deltaWs.onopen = () => {
        const payload = {
          type: "subscribe",
          payload: {
            channels: [
              {
                name: "v2/ticker",
                symbols: futuresHoldings.map((h) => h.asset_symbol.toUpperCase()),
              },
            ],
          },
        };
        deltaWs.send(JSON.stringify(payload));
      };

      deltaWs.onmessage = (event) => {
        const response = JSON.parse(event.data);
        if (
          response?.type === "v2/ticker" &&
          response?.symbol &&
          response?.close
        ) {
          setLivePrices((prev) => ({
            ...prev,
            [response.symbol]: response.close,
          }));
        }
      };

      deltaWs.onerror = (error) =>
        console.error("Delta PnL WebSocket error:", error);
    }

    return () => {
      if (binanceWs) binanceWs.close();
      if (deltaWs) deltaWs.close();
    };
  }, [holdings]);

  // Calculate total PnL whenever prices or holdings change
  useEffect(() => {
    if (holdings.length === 0) {
      setTotalPnL(0);
      setTotalPnLPercentage(0);
      return;
    }

    let totalPnLValue = 0;
    let totalInvested = 0;

    holdings.forEach((holding) => {
      const currentPrice = livePrices[holding.asset_symbol];
      
      if (!currentPrice) {
        // If no live price, use existing PnL from backend
        totalPnLValue += Number(holding.total_pnl || 0);
        totalInvested += Number(holding.total_invested || 0);
        return;
      }

      const price = Number(currentPrice);
      const avgPrice = Number(holding.average_price);
      const quantity = Number(holding.remaining_quantity);
      const invested = Number(holding.total_invested);

      let unrealizedPnL = 0;
      if (holding.direction.toLowerCase() === "buy") {
        unrealizedPnL = (price - avgPrice) * quantity;
      } else {
        unrealizedPnL = (avgPrice - price) * quantity;
      }

      const totalHoldingPnL = Number(holding.realized_pnl) + unrealizedPnL;
      
      totalPnLValue += totalHoldingPnL;
      totalInvested += invested;
    });

    setTotalPnL(totalPnLValue);
    setTotalPnLPercentage(
      totalInvested > 0 ? (totalPnLValue / totalInvested) * 100 : 0
    );
  }, [holdings, livePrices]);

  // Initial fetch
  useEffect(() => {
    fetchHoldings();
    
    // Refresh holdings every 30 seconds
    const interval = setInterval(fetchHoldings, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const value = {
    totalPnL,
    totalPnLPercentage,
    isLoading,
    refreshPnL: fetchHoldings,
  };

  return <PnLContext.Provider value={value}>{children}</PnLContext.Provider>;
};