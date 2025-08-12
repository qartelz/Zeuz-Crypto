import React, { useEffect, useState } from "react";

const BASE_URL = "https://api.binance.com";
const WS_BASE = "wss://stream.binance.com:9443/ws";

const binanceYellow = "#F0B90B";

const BinanceDashboard = () => {
  const [symbols, setSymbols] = useState([]);
  const [filteredSymbols, setFilteredSymbols] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState("btcusdt");
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  const [trades, setTrades] = useState([]);

  // Fetch all USDT pairs
  useEffect(() => {
    fetch(`${BASE_URL}/api/v3/exchangeInfo`)
      .then((res) => res.json())
      .then((data) => {
        const allSymbols = data.symbols
          .map((s) => s.symbol.toLowerCase())
          .filter((symbol) => symbol.endsWith("usdt"));
        setSymbols(allSymbols);
        setFilteredSymbols(allSymbols);
      });
  }, []);

  // Connect to WebSocket
  useEffect(() => {
    if (!selectedSymbol) return;

    const lowerSymbol = selectedSymbol.toLowerCase();
    const depthWS = new WebSocket(`${WS_BASE}/${lowerSymbol}@depth`);
    const tradeWS = new WebSocket(`${WS_BASE}/${lowerSymbol}@trade`);

    depthWS.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setOrderBook({
        bids: data.b?.slice(0, 10) || [],
        asks: data.a?.slice(0, 10) || [],
      });
    };

    tradeWS.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setTrades((prev) => {
        const updated = [data, ...prev];
        return updated.slice(0, 15); // Limit to recent trades
      });
    };

    return () => {
      depthWS.close();
      tradeWS.close();
    };
  }, [selectedSymbol]);

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
    setFilteredSymbols(symbols.filter((s) => s.includes(value)));
  };

  const handleSelect = (symbol) => {
    setSearchTerm(symbol);
    setSelectedSymbol(symbol);
    setFilteredSymbols([]);
  };

  return (
    <div className="min-h-screen bg-[#181A20] text-white p-6 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-5xl mb-8">
       
      </div>

      {/* Symbol Selector */}
      <div className="relative w-full max-w-md mb-8">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search coin pair (e.g. BTCUSDT)"
          className="w-full px-4 py-2 border border-gray-700 bg-[#2B3139] rounded-md text-white focus:outline-none focus:ring focus:ring-yellow-400"
        />
        {filteredSymbols.length > 0 && (
          <ul className="absolute z-10 w-full max-h-60 overflow-y-auto bg-[#23272E] border border-gray-700 rounded-md mt-1 shadow-md">
            {filteredSymbols.map((symbol) => (
              <li
                key={symbol}
                onClick={() => handleSelect(symbol)}
                className="px-4 py-2 hover:bg-[#3A3E45] cursor-pointer uppercase text-white"
              >
                {symbol}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Live Chart */}
      <div className="w-full max-w-5xl mb-8">
        <h2 className="text-xl font-bold mb-2">
          Live Chart for{" "}
          <span style={{ color: binanceYellow }}>
            {selectedSymbol.toUpperCase()}
          </span>
        </h2>
        <div className="rounded-md border border-gray-700 overflow-hidden bg-[#23272E]">
          <iframe
            title="TradingView"
            src={`https://www.tradingview.com/widgetembed/?frameElementId=tradingview_btc_chart&symbol=BINANCE:${selectedSymbol.toUpperCase()}&interval=1&theme=dark`}
            className="w-full h-[400px]"
            frameBorder="0"
            allowTransparency
            scrolling="no"
          />
        </div>
      </div>

      {/* Order Book */}
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 mb-10">
        <div className="bg-[#23272E] rounded-lg p-4 shadow">
          <h3 className="font-bold mb-4 text-lg border-b border-gray-700 pb-2" style={{ color: binanceYellow }}>
            Top 10 Bids
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left font-bold text-gray-400 px-2">Price(USDT)</th>
                  <th className="text-left font-bold text-gray-400 px-2">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {orderBook.bids.map(([price, qty], index) => (
                  <tr key={index} className="border-b border-gray-800 last:border-0">
                    <td className="px-2 py-1 font-bold text-green-400">{parseFloat(price).toFixed(2)}</td>
                    <td className="px-2 py-1">{parseFloat(qty).toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-[#23272E] rounded-lg p-4 shadow">
          <h3 className="font-bold mb-4 text-lg border-b border-gray-700 pb-2" style={{ color: binanceYellow }}>
            Top 10 Asks
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left font-bold text-gray-400 px-2">Price(USDT)</th>
                  <th className="text-left font-bold text-gray-400 px-2">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {orderBook.asks.map(([price, qty], index) => (
                  <tr key={index} className="border-b border-gray-800 last:border-0">
                    <td className="px-2 py-1 font-bold text-red-400">{parseFloat(price).toFixed(2)}</td>
                    <td className="px-2 py-1">{parseFloat(qty).toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Trades Table */}
      <div className="w-full max-w-5xl bg-[#23272E] rounded-lg p-4 shadow mb-10">
        <h3 className="font-bold mb-4 text-lg border-b border-gray-700 pb-2" style={{ color: binanceYellow }}>
          Recent Trades
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="text font-bold text-gray-400 px-2 py-1">Type</th>
                <th className=" font-bold text-gray-400 px-2 py-1">Price</th>
                <th className=" font-bold text-gray-400 px-2 py-1">Quantity</th>
                <th className=" font-bold text-gray-400 px-2 py-1">Time</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade, index) => (
                <tr
                  key={index}
                  className={
                    (trade.m ? "bg-[#2B2327] text-red-400 " : "bg-[#1F2C20] text-green-400 ") + "border-b border-gray-800 last:border-0"
                  }
                >
                  <td className="px-2 py-1 font-bold">
                    {trade.m ? "Sell" : "Buy"}
                  </td>
                  <td className="px-2 py-1">
                    {parseFloat(trade.p).toFixed(2)}
                  </td>
                  <td className="px-2 py-1">
                    {parseFloat(trade.q).toFixed(4)}
                  </td>
                  <td className="px-2 py-1 text-gray-300 font-mono">
                    {new Date(trade.T).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BinanceDashboard;
