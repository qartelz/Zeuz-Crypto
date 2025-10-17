import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

const OptionsChain = () => {
  const [underlyingAssets, setUnderlyingAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState("");
  const [optionSymbols, setOptionSymbols] = useState([]);
  const [liveDataMap, setLiveDataMap] = useState({});
  const [binancePrice, setBinancePrice] = useState(null);
  const deltaWsRef = useRef(null);
  const binanceWsRef = useRef(null);

  // 1. Fetch all unique coins with options (BTC, ETH, etc.)
  useEffect(() => {
    async function fetchUnderlyingAssets() {
      try {
        const res = await axios.get(
          "https://api.delta.exchange/v2/tickers?contract_types=call_options,put_options"
        );
        const options = res.data.result;
        const uniqueAssets = [
          ...new Set(options.map((item) => item.underlying_asset_symbol)),
        ];
        setUnderlyingAssets(uniqueAssets);
        if (uniqueAssets.length > 0) {
          setSelectedAsset(uniqueAssets[0]); // default to first one
        }
      } catch (err) {
        console.error("Error fetching underlying assets", err);
      }
    }
    fetchUnderlyingAssets();
  }, []);

  // 2. Fetch option symbols for the selected asset
  useEffect(() => {
    if (!selectedAsset) return;
    async function fetchOptionSymbols() {
      try {
        const res = await axios.get(
          `https://api.delta.exchange/v2/tickers?contract_types=call_options,put_options&underlying_asset_symbols=${selectedAsset}`
        );
        const filtered = res.data.result.filter(item =>
          item.symbol.startsWith(`C-${selectedAsset}`) || item.symbol.startsWith(`P-${selectedAsset}`)
        );
        const symbols = filtered.map(item => item.symbol);
        setOptionSymbols(symbols);
        setLiveDataMap({});
      } catch (error) {
        console.error("❌ Failed to fetch option symbols", error);
      }
    }
    fetchOptionSymbols();
  }, [selectedAsset]);

  // 3. WebSocket for Delta live option data
  useEffect(() => {
    if (optionSymbols.length === 0) return;
    const socket = new WebSocket("wss://socket.delta.exchange");
    deltaWsRef.current = socket;

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: "subscribe",
          payload: {
            channels: [
              {
                name: "v2/ticker",
                symbols: optionSymbols,
              },
            ],
          },
        })
      );
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "v2/ticker" && message.symbol) {
        setLiveDataMap(prev => ({
          ...prev,
          [message.symbol]: message,
        }));
      }
    };

    return () => socket.close();
  }, [optionSymbols]);

  // 4. WebSocket for Binance live spot price
  useEffect(() => {
    if (!selectedAsset) return;
    const wsSymbol = `${selectedAsset.toLowerCase()}usdt`;
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${wsSymbol}@ticker`);
    binanceWsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setBinancePrice(parseFloat(data.c));
    };

    return () => ws.close();
  }, [selectedAsset]);

  // 5. Group option data by strike
  const groupedData = {};
  Object.values(liveDataMap).forEach(data => {
    const strike = Number(data.strike_price);
    if (!groupedData[strike]) groupedData[strike] = {};
    if (data.contract_type === "call_options") groupedData[strike].call = data;
    if (data.contract_type === "put_options") groupedData[strike].put = data;
  });

  const sortedStrikes = Object.keys(groupedData)
    .map(Number)
    .sort((a, b) => a - b);

  const nearestStrike = binancePrice ? Math.round(binancePrice / 1000) * 1000 : null;

  const getRowStyle = (strike) => {
    const isATM = nearestStrike === strike;
    const isAbove = strike > binancePrice;
    const isBelow = strike < binancePrice;

    return {
      call: {
        backgroundColor: isBelow ? "#ffe5e5" : "#e0f7fa",
      },
      put: {
        backgroundColor: isAbove ? "#ffe5e5" : "#e0f7fa",
      },
      strike: {
        backgroundColor: isATM ? "#fffacd" : "#f0f0f0",
        fontWeight: isATM ? "bold" : "normal",
      },
      row: {
        backgroundColor: isATM ? "#fffbe6" : undefined,
      },
    };
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "monospace" }}>
      {/* Dropdown */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ fontWeight: "bold", marginRight: "8px" }}>Select Asset:</label>
        <select value={selectedAsset} onChange={e => setSelectedAsset(e.target.value)}>
          {underlyingAssets.map(asset => (
            <option key={asset} value={asset}>{asset}</option>
          ))}
        </select>
      </div>

      {/* Live price */}
      <div style={{ fontWeight: "bold", marginBottom: "1rem", fontSize: "16px" }}>
        Live {selectedAsset} Spot Price (Binance): {
          binancePrice?.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 2,
          }) || "Loading..."
        }
      </div>

      {/* Options Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ background: "#dceeff" }}>
              <th colSpan={5} style={headerCellStyle}>CALL</th>
              <th style={headerCellStyle}>STRIKE PRICE</th>
              <th colSpan={5} style={headerCellStyle}>PUT</th>
            </tr>
            <tr>
              {["Symbol", "LTP", "OI", "Delta", "Theta", "Strike", "LTP", "OI", "Delta", "Theta", "Symbol"].map((h, i) => (
                <th key={i} style={{ ...cellStyle, background: "#f9f9f9" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedStrikes.map(strike => {
              const row = groupedData[strike];
              const call = row.call;
              const put = row.put;
              const styles = getRowStyle(strike);
              const isATM = nearestStrike === strike;

              return (
                <tr key={strike} style={styles.row}>
                  <td style={{ ...cellStyle, ...styles.call }}>{call?.symbol || "--"}</td>
                  <td style={{ ...cellStyle, ...styles.call }}>{call?.mark_price || "--"}</td>
                  <td style={{ ...cellStyle, ...styles.call }}>{call?.oi_contracts || "--"}</td>
                  <td style={{ ...cellStyle, ...styles.call }}>{call?.greeks?.delta || "--"}</td>
                  <td style={{ ...cellStyle, ...styles.call }}>{call?.greeks?.theta || "--"}</td>

                  <td style={{ ...cellStyle, ...styles.strike }}>
                    {strike}
                    {isATM && binancePrice && (
                      <div style={{ fontSize: "12px", color: "#333", marginTop: "2px" }}>
                        🔵{binancePrice?.toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    )}
                  </td>

                  <td style={{ ...cellStyle, ...styles.put }}>{put?.mark_price || "--"}</td>
                  <td style={{ ...cellStyle, ...styles.put }}>{put?.oi_contracts || "--"}</td>
                  <td style={{ ...cellStyle, ...styles.put }}>{put?.greeks?.delta || "--"}</td>
                  <td style={{ ...cellStyle, ...styles.put }}>{put?.greeks?.theta || "--"}</td>
                  <td style={{ ...cellStyle, ...styles.put }}>{put?.symbol || "--"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const cellStyle = {
  padding: "6px",
  border: "1px solid #ccc",
  textAlign: "center",
  whiteSpace: "nowrap",
};

const headerCellStyle = {
  padding: "8px",
  border: "1px solid #ccc",
  fontWeight: "bold",
  backgroundColor: "#cce7ff",
  textAlign: "center",
};

export default OptionsChain;
