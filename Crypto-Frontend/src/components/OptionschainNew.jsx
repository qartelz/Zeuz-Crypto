import React, { useEffect, useState, useRef } from "react";
import {
  TrendingUp,
  TrendingDown,
  X,
  Info,
  ChevronDown,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

const OptionsChainFinal = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const [assets, setAssets] = useState([]);
  const [selected, setSelected] = useState("");
  const [symbols, setSymbols] = useState([]);
  const [optionsData, setOptionsData] = useState({});
  console.log(optionsData, "the options data");
  const [spot, setSpot] = useState(null);

  // console.log(spot,"the spot price")
  const [change24h, setChange24h] = useState({ val: 0, pct: 0 });
  const [modal, setModal] = useState(null);
  const tokens = JSON.parse(localStorage.getItem("authTokens"));
  const [isOpen, setIsOpen] = useState(false);

  const optWs = useRef(null);
  const priceWs = useRef(null);

  // Fetch available assets
  useEffect(() => {
    fetch(
      "https://api.delta.exchange/v2/tickers?contract_types=call_options,put_options"
    )
      .then((r) => r.json())
      .then((data) => {
        const uniq = [
          ...new Set(data.result.map((x) => x.underlying_asset_symbol)),
        ];
        setAssets(uniq);
        if (uniq[0]) setSelected(uniq[0]);
      })
      .catch(console.error);
  }, []);

  // Fetch option symbols when asset changes
  useEffect(() => {
    if (!selected) return;

    fetch(
      `https://api.delta.exchange/v2/tickers?contract_types=call_options,put_options&underlying_asset_symbols=${selected}`
    )
      .then((r) => r.json())
      .then((data) => {
        const filtered = data.result.filter(
          (x) =>
            x.symbol.startsWith(`C-${selected}`) ||
            x.symbol.startsWith(`P-${selected}`)
        );
        setSymbols(filtered.map((x) => x.symbol));
        setOptionsData({});
      })
      .catch(console.error);
  }, [selected]);

  // WebSocket for options data
  // useEffect(() => {
  //   if (!symbols.length) return;

  //   const ws = new WebSocket("wss://socket.delta.exchange");
  //   optWs.current = ws;

  //   ws.onopen = () => {
  //     ws.send(
  //       JSON.stringify({
  //         type: "subscribe",
  //         payload: {
  //           channels: [{ name: "v2/ticker", symbols }],
  //         },
  //       })
  //     );
  //   };

  //   ws.onmessage = (e) => {
  //     const msg = JSON.parse(e.data);
  //     if (msg.type === "v2/ticker" && msg.symbol) {
  //       setOptionsData((prev) => ({ ...prev, [msg.symbol]: msg }));
  //     }
  //   };

  //   return () => ws.close();
  // }, [symbols]);

  // const [isOpen, setIsOpen] = useState(false);

  // const handleSelect = (value) => {
  //   setSelected(value);
  //   setIsOpen(false);
  // };

  // // WebSocket for spot price
  // useEffect(() => {
  //   if (!selected) return;

  //   const ticker = `${selected}USDT`;
  //   const ws = new WebSocket("wss://socket.delta.exchange");
  //   priceWs.current = ws;

  //   ws.onopen = () => {
  //     ws.send(
  //       JSON.stringify({
  //         type: "subscribe",
  //         payload: {
  //           channels: [{ name: "v2/ticker", symbols: [ticker] }],
  //         },
  //       })
  //     );
  //   };

  //   ws.onmessage = (e) => {
  //     const msg = JSON.parse(e.data);
  //     if (msg.type === "v2/ticker" && msg.symbol === ticker) {
  //       const p = parseFloat(msg.mark_price || msg.close);
  //       const c = parseFloat(msg.mark_change_24h || 0);
  //       const pct = (c / (p - c)) * 100;

  //       setSpot(p);
  //       setChange24h({ val: c, pct });
  //     }
  //   };

  //   return () => ws.close();
  // }, [selected]);

  // WebSocket for options data (includes spot price)
  useEffect(() => {
    if (!symbols.length) return;

    const ws = new WebSocket("wss://socket.delta.exchange");
    optWs.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "subscribe",
          payload: {
            channels: [{ name: "v2/ticker", symbols }],
          },
        })
      );
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);

      if (msg.type === "v2/ticker" && msg.symbol) {
        // Store all option data
        setOptionsData((prev) => ({ ...prev, [msg.symbol]: msg }));

        // Extract spot price from message
        if (msg.spot_price) {
          const p = parseFloat(msg.spot_price);
          const c = parseFloat(msg.mark_change_24h || 0);
          const pct = (c / (p - c)) * 100;
          setSpot(p);
          setChange24h({ val: c, pct });
        }
      }
    };

    ws.onerror = (err) => console.error("WebSocket Error:", err);
    ws.onclose = () => console.log("Options WebSocket closed");

    return () => ws.close();
  }, [symbols]);

  const handleSelect = (value) => {
    setSelected(value);
    setIsOpen(false);
  };

  // Process and group options by strike
  const strikes = {};
  Object.values(optionsData).forEach((opt) => {
    const k = parseFloat(opt.strike_price);
    if (!k) return;

    if (!strikes[k]) strikes[k] = { call: null, put: null };

    if (opt.contract_type === "call_options") strikes[k].call = opt;
    if (opt.contract_type === "put_options") strikes[k].put = opt;
  });

  const sorted = Object.keys(strikes)
    .map(Number)
    .sort((a, b) => a - b);

  // ============= ADD THESE STATE VARIABLES =============
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // ============= ORDER HANDLER FUNCTION =============
  const handleOptionsOrder = async (action, option) => {
    try {
      setIsPlacingOrder(true);

      // Check if user is logged in
      if (!tokens?.access) {
        toast.custom(
          (t) => (
            <div
              className={`${
                t.visible ? "animate-enter" : "animate-leave"
              } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}
            >
              <div className="flex-1 w-0 p-4 flex items-center">
                <XCircle className="h-6 w-6 text-red-500 mr-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  You must be logged in!
                </p>
              </div>
            </div>
          ),
          { position: "top-right", duration: 2500 }
        );
        return;
      }

      // Determine option type (CALL or PUT)
      const optionType =
        option.contract_type === "call_options" ? "CALL" : "PUT";

      // Determine option position (LONG for BUY, SHORT for SELL)
      const optionPosition = action === "buy" ? "LONG" : "SHORT";

      // Calculate premium
      const premium = parseFloat(option.strike_price) * parseFloat(quantity);

      // Extract expiry date from symbol (format: P-BTC-109200-161025)
      const symbolParts = option.symbol.split("-");
      const expiryString = symbolParts[symbolParts.length - 1]; // "161025"
      const expiryDate = `20${expiryString.slice(4, 6)}-${expiryString.slice(
        2,
        4
      )}-${expiryString.slice(0, 2)}`; // "2025-10-16"

      // Prepare payload
      const payload = {
        asset_symbol: option.symbol,
        asset_name: option.underlying_asset_symbol,
        trade_type: "OPTIONS",
        direction: action.toUpperCase(), // "BUY" or "SELL"
        quantity: quantity.toString(),
        price: parseFloat(option.strike_price).toFixed(2),
        option_type: optionType,
        holding_type: "INTRADAY", // You can make this dynamic if needed
        option_position: optionPosition,
        strike_price: parseFloat(option.strike_price).toFixed(8),
        expiry_date: expiryDate,
        premium: premium.toFixed(7),
      };

      console.log("Options Order Payload:", payload);

      // Make API call
      const response = await fetch(`${baseURL}trading/place-order/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens.access}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("Options Order Response:", data);

      if (response.ok) {
        toast.custom(
          (t) => (
            <div
              className={`${
                t.visible ? "animate-enter" : "animate-leave"
              } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}
            >
              <div className="flex-1 w-0 p-4 flex items-center">
                <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {action === "buy" ? "Bought" : "Sold"} {quantity} {optionType}{" "}
                  option(s) @ ${parseFloat(option.mark_price).toFixed(2)}
                </p>
              </div>
            </div>
          ),
          { position: "top-right", duration: 2500 }
        );

        // Close modal and reset quantity
        setModal(null);
        setQuantity(1);

        // Refresh wallet if you have that function
        // await refreshWallet();
      } else {
        toast.custom(
          (t) => (
            <div
              className={`${
                t.visible ? "animate-enter" : "animate-leave"
              } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}
            >
              <div className="flex-1 w-0 p-4 flex items-center">
                <XCircle className="h-6 w-6 text-red-500 mr-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {data.error || data.detail || "Failed to place order"}
                </p>
              </div>
            </div>
          ),
          { position: "top-right", duration: 2500 }
        );
      }
    } catch (error) {
      console.error("Options order error:", error);
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}
          >
            <div className="flex-1 w-0 p-4 flex items-center">
              <XCircle className="h-6 w-6 text-red-500 mr-2" />
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Failed to process order
              </p>
            </div>
          </div>
        ),
        { position: "top-right", duration: 2500 }
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Find strikes around spot price
  const spotIdx = spot ? sorted.findIndex((s) => s >= spot) : 0;
  const display =
    spotIdx >= 0
      ? sorted.slice(Math.max(0, spotIdx - 12), spotIdx + 13)
      : sorted.slice(0, 25);

  console.log(display, "the display");

  const f = (v, d = 2) => (v ? parseFloat(v).toFixed(d) : "--");

  return (
    <div className="min-h-screen  text-slate-100">
      {/* Header */}
      <header className=" backdrop-blur-sm  border-slate-800 sticky top-0 z-40">
        <div className="px-6 py-">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="relative w-44">
                  {/* Dropdown button */}
                  <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full text-left px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 hover:border-slate-500 transition-all relative"
                  >
                    {/* Label inside dropdown */}
                    <div className="text-xs text-slate-500 font-medium mb-0.5">
                      Select Coin
                    </div>

                    {/* Selected value and icon */}
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold">{selected}</span>
                      <ChevronDown
                        className={`ml-2 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                        size={26}
                      />
                    </div>
                  </button>

                  {/* Dropdown list */}
                  {isOpen && (
                    <ul className="absolute z-10 mt-2 w-full bg-slate-900 border border-slate-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {assets.map((a) => (
                        <li
                          key={a}
                          onClick={() => handleSelect(a)}
                          className={`px-4 py-2 cursor-pointer text-slate-100 hover:bg-slate-800 transition-colors ${
                            selected === a ? "bg-slate-800 font-bold" : ""
                          }`}
                        >
                          {a}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Small footer label */}
                  <div className="text-[10px] text-slate-500 tracking-[0.15em] font-semibold mt-2 ml-1">
                    OPTIONS CHAIN
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-8 items-end bg-slate-900/50 p-4 rounded-xl shadow-inner">
              {/* Spot Price */}
              <div className="text-left">
                <div className="text-[11px] text-slate-500 tracking-wider mb-1 uppercase font-semibold">
                  Spot Price
                </div>
                <div className="text-4xl font-extrabold text-slate-100 leading-snug">
                  {spot
                    ? `${spot.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : "---"}
                </div>
              </div>

              {/* 24H Change */}
              <div className="text-right">
                <div className="text-[11px] text-slate-500 tracking-wider mb-1 uppercase font-semibold">
                  24H Change
                </div>
                <div
                  className={`flex items-center justify-end gap-2 text-lg font-semibold ${
                    change24h.val >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {change24h.val >= 0 ? (
                    <TrendingUp
                      size={20}
                      strokeWidth={2.5}
                      className="animate-slide-up"
                    />
                  ) : (
                    <TrendingDown
                      size={20}
                      strokeWidth={2.5}
                      className="animate-slide-down"
                    />
                  )}

                  <span>
                    {change24h.val >= 0 ? "+" : ""}
                    {change24h.pct.toFixed(2)}%
                  </span>

                  <span className="text-sm opacity-70">
                    ({Math.abs(change24h.val).toFixed(2)})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Table */}
      <div className="overflow-x-auto px-6">
        <table className="w-full border-collapse">
          <thead className="sticky  z-30">
            <tr className="bg-slate-900/95 backdrop-blur-sm">
              <th
                colSpan={5}
                className="py-4 px-6 text-left font-bold text-sm tracking-[0.1em] text-green-400 border-b-2 border-green-500/30"
              >
                CALL OPTIONS
              </th>
              <th className="py-4 px-6 font-bold text-sm tracking-[0.1em] text-blue-300 border-b-2 border-blue-500/30 text-center">
                STRIKE
              </th>
              <th
                colSpan={5}
                className="py-4 px-6 text-right font-bold text-sm tracking-[0.1em] text-red-400 border-b-2 border-red-500/30"
              >
                PUT OPTION
              </th>
            </tr>
            <tr className="bg-slate-800/60 backdrop-blur-sm">
              <th className="py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Symbol
              </th>
              <th className="py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Mark
              </th>
              <th className="py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                OI
              </th>
              <th className="py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Delta
              </th>
              <th className="py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Theta
              </th>
              <th className="py-3 px-4 text-[10px] font-semibold text-blue-300 uppercase tracking-wider">
                Price
              </th>
              <th className="py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Mark
              </th>
              <th className="py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                OI
              </th>
              <th className="py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Delta
              </th>
              <th className="py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Theta
              </th>
              <th className="py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Symbol
              </th>
            </tr>
          </thead>

          <tbody>
            {display.map((strike, idx) => {
              const { call, put } = strikes[strike] || {};
              const isSpotRow =
                spot &&
                strike <= spot &&
                (idx === display.length - 1 || display[idx + 1] > spot);
              const callItm = spot && strike < spot;
              const putItm = spot && strike > spot;

              return (
                <React.Fragment key={strike}>
                  <tr
                    className={`group border-b border-slate-800/50 hover:bg-slate-800/40 transition-all`}
                  >
                    {/* CALL - Symbol */}
                    <td className="py-3 px-4 text-xs text-slate-400 relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/95 to-transparent opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 z-10 transition-opacity">
                        {/* BUY Button - Green */}
                        <button
                          onClick={() =>
                            call && setModal({ action: "buy", option: call })
                          }
                          disabled={!call}
                          className="bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:opacity-30 text-white text-xs px-5 py-1.5 rounded-md font-bold shadow-lg transition-all transform hover:scale-105"
                        >
                          BUY
                        </button>

                        {/* SELL Button - Red */}
                        <button
                          onClick={() =>
                            call && setModal({ action: "sell", option: call })
                          }
                          disabled={!call}
                          className="bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:opacity-30 text-white text-xs px-5 py-1.5 rounded-md font-bold shadow-lg transition-all transform hover:scale-105"
                        >
                          SELL
                        </button>
                      </div>

                      <div
                        className={`truncate max-w-[140px] font-mono ${
                          callItm ? "text-green-400/60" : ""
                        }`}
                      >
                        {call?.symbol || "--"}
                      </div>
                    </td>

                    {/* CALL - Mark */}
                    <td
                      className={`py-3 px-4 text-center ${
                        callItm ? "bg-green-500/5" : ""
                      }`}
                    >
                      <span className="text-green-400 font-bold text-sm">
                        {f(call?.mark_price)}
                      </span>
                    </td>

                    {/* CALL - OI */}
                    <td
                      className={`py-3 px-4 text-slate-300 text-center text-sm ${
                        callItm ? "bg-green-500/5" : ""
                      }`}
                    >
                      {call?.oi_contracts || "--"}
                    </td>

                    {/* CALL - Delta */}
                    <td
                      className={`py-3 px-4 text-slate-300 text-center text-sm font-mono ${
                        callItm ? "bg-green-500/5" : ""
                      }`}
                    >
                      {f(call?.greeks?.delta, 4)}
                    </td>

                    {/* CALL - Theta */}
                    <td
                      className={`py-3 px-4 text-slate-300 text-center text-sm font-mono ${
                        callItm ? "bg-green-500/5" : ""
                      }`}
                    >
                      {f(call?.greeks?.theta, 4)}
                    </td>

                    {/* STRIKE */}
                    <td className="py-3 px-6 text-center font-black text-base text-slate-200">
                      <div className="flex items-center justify-center gap-2">
                        {strike.toLocaleString()}
                      </div>
                    </td>

                    {/* PUT - Mark */}
                    <td
                      className={`py-3 px-4 text-center ${
                        putItm ? "bg-red-500/5" : ""
                      }`}
                    >
                      <span className="text-red-400 font-bold text-sm">
                        {f(put?.mark_price)}
                      </span>
                    </td>

                    {/* PUT - OI */}
                    <td
                      className={`py-3 px-4 text-slate-300 text-center text-sm ${
                        putItm ? "bg-red-500/5" : ""
                      }`}
                    >
                      {put?.oi_contracts || "--"}
                    </td>

                    {/* PUT - Delta */}
                    <td
                      className={`py-3 px-4 text-slate-300 text-center text-sm font-mono ${
                        putItm ? "bg-red-500/5" : ""
                      }`}
                    >
                      {f(put?.greeks?.delta, 4)}
                    </td>

                    {/* PUT - Theta */}
                    <td
                      className={`py-3 px-4 text-slate-300 text-center text-sm font-mono ${
                        putItm ? "bg-red-500/5" : ""
                      }`}
                    >
                      {f(put?.greeks?.theta, 4)}
                    </td>

                    {/* PUT - Symbol */}
                    <td className="py-3 px-4 text-xs text-slate-400 relative">
                      <div className="absolute inset-0 bg-gradient-to-l from-slate-950 via-slate-950/95 to-transparent opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 z-10 transition-opacity">
                        {/* BUY Button - Green */}
                        <button
                          onClick={() =>
                            put && setModal({ action: "buy", option: put })
                          }
                          disabled={!put}
                          className="bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:opacity-30 text-white text-xs px-5 py-1.5 rounded-md font-bold shadow-lg transition-all transform hover:scale-105"
                        >
                          BUY
                        </button>

                        {/* SELL Button - Red */}
                        <button
                          onClick={() =>
                            put && setModal({ action: "sell", option: put })
                          }
                          disabled={!put}
                          className="bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:opacity-30 text-white text-xs px-5 py-1.5 rounded-md font-bold shadow-lg transition-all transform hover:scale-105"
                        >
                          SELL
                        </button>
                      </div>

                      <div
                        className={`truncate max-w-[140px] font-mono text-right ${
                          putItm ? "text-red-400/60" : ""
                        }`}
                      >
                        {put?.symbol || "--"}
                      </div>
                    </td>
                  </tr>

                  {/* Spot Price Indicator */}
                  {isSpotRow && spot && (
                    <tr className="relative">
                      <td colSpan={11} className="p-0 relative">
                        <div className="absolute inset-x-0 -top-[1px] h-[1px] bg-gradient-to-r from-transparent via-white to-transparent z-20"></div>
                        <div className="absolute left-1/2 -translate-x-[50px]  -top-3 z-30">
                          <div className="bg-white px-3  rounded-lg border-1 border-white shadow-lg shadow-white-500/20">
                            <span className="text-xs font-mono font-bold text-black whitespace-nowrap">
                              {spot.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal - Inline */}
      {/* {modal &&
        (() => {
          const { action, option } = modal;
          const isBuy = action === "buy";
          const isCall = option.contract_type === "call_options";

          return (
            <div
              className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setModal(null);
                  setQuantity(1);
                }
              }}
            >
              <div
                className="bg-slate-900 rounded-xl max-w-md w-full border border-slate-700 shadow-2xl relative z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                  <div>
                    <h2 className="text-xl font-bold text-slate-100">
                      {isBuy ? "Buy" : "Sell"} {isCall ? "Call" : "Put"}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 font-mono">
                      {option.symbol}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setModal(null);
                      setQuantity(1);
                    }}
                    className="text-slate-400 hover:text-slate-100 transition"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <div className="text-xs text-slate-500 mb-1">Strike</div>
                      <div className="text-lg font-bold text-slate-100">
                        ${parseFloat(option.strike_price).toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <div className="text-xs text-slate-500 mb-1">
                        Mark Price
                      </div>
                      <div
                        className={`text-lg font-bold ${
                          isCall ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        ${parseFloat(option.mark_price || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-slate-500 mb-2">
                        Best Bid
                      </div>
                      <div className="bg-red-500/10 border border-red-500/30 rounded px-3 py-2">
                        <span className="text-red-400 font-semibold">
                          ${parseFloat(option.quotes?.best_bid || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-2">
                        Best Ask
                      </div>
                      <div className="bg-green-500/10 border border-green-500/30 rounded px-3 py-2">
                        <span className="text-green-400 font-semibold">
                          ${parseFloat(option.quotes?.best_ask || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Info
                        size={16}
                        className="text-blue-400 mt-0.5 flex-shrink-0"
                      />
                      <div className="text-xs text-slate-400">
                        <span className="font-semibold text-blue-400">OI:</span>{" "}
                        {option.oi_contracts || 0} contracts
                        <span className="mx-2">•</span>
                        <span className="font-semibold text-blue-400">
                          Delta:
                        </span>{" "}
                        {parseFloat(option.greeks?.delta || 0).toFixed(4)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                      }
                      min="1"
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-slate-100 text-lg font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                    />
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="text-xs text-slate-500 mb-1">
                      Total Premium
                    </div>
                    <div className="text-lg font-bold text-slate-100">
                      $
                      {(parseFloat(option.mark_price || 0) * quantity).toFixed(
                        2
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setModal(null);
                        setQuantity(1);
                      }}
                      disabled={isPlacingOrder}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-100 py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleOptionsOrder(action, option)}
                      disabled={isPlacingOrder || quantity < 1}
                      className={`flex-1 py-3 rounded-lg font-semibold transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                        isBuy
                          ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
                          : "bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/20"
                      }`}
                    >
                      {isPlacingOrder
                        ? "Placing..."
                        : `Confirm ${isBuy ? "Buy" : "Sell"}`}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()} */}

{modal &&
  (() => {
    const { action, option } = modal;
    const isBuy = action === "buy";
    const isCall = option.contract_type === "call_options";

    // Get live data from optionsData state
    const liveOption = optionsData[option.symbol] || option;
    
    // Determine price and IV based on action
    const displayPrice = isBuy 
      ? parseFloat(liveOption.quotes?.best_ask || 0)
      : parseFloat(liveOption.quotes?.best_bid || 0);
    
    const displayIV = isBuy
      ? (parseFloat(liveOption.quotes?.ask_iv || 0) * 100)
      : (parseFloat(liveOption.quotes?.bid_iv || 0) * 100);

    // Calculate minimum amount (0.01 BTC equivalent)
    const minAmount = 0.01;
    const contractValue = parseFloat(liveOption.contract_value || 0.001);
    const minQuantity = Math.ceil(minAmount);
    
    // Calculate total premium using display price (ask for buy, bid for sell)
    const totalPremium = displayPrice * quantity;
    
    // Check if quantity meets minimum requirement
    const meetsMinimum = quantity >= minQuantity;

    return (
      <div
        className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setModal(null);
            setQuantity(1);
          }
        }}
      >
        <div
          className="bg-slate-900 rounded-xl max-w-md w-full border border-slate-700 shadow-2xl relative z-50 my-4 max-h-[95vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-slate-700 sticky top-0 bg-slate-900 z-10">
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                {isBuy ? "Buy" : "Sell"} {isCall ? "Call" : "Put"}
              </h2>
              <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                {liveOption.symbol}
              </p>
            </div>
            <button
              onClick={() => {
                setModal(null);
                setQuantity(1);
              }}
              className="text-slate-400 hover:text-slate-100 transition"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/50 rounded-lg p-2.5">
                <div className="text-[10px] text-slate-500 mb-0.5">Strike</div>
                <div className="text-base font-bold text-slate-100">
                  ${parseFloat(liveOption.strike_price).toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-2.5">
                <div className="text-[10px] text-slate-500 mb-0.5">Mark Price</div>
                <div
                  className={`text-base font-bold ${
                    isCall ? "text-green-400" : "text-red-400"
                  }`}
                >
                  ${parseFloat(liveOption.mark_price || 0).toFixed(2)}
                </div>
              </div>
            </div>

            {/* <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] text-slate-500 mb-1.5">
                  Best Bid {!isBuy && <span className="text-yellow-400">●</span>}
                </div>
                <div className={`rounded px-2.5 py-1.5 ${
                  !isBuy 
                    ? 'bg-red-500/20 border-2 border-red-500/50' 
                    : 'bg-red-500/10 border border-red-500/30'
                }`}>
                  <span className="text-red-400 font-semibold text-sm">
                    ${parseFloat(liveOption.quotes?.best_bid || 0).toFixed(2)}
                  </span>
                  <div className="text-[9px] text-red-400/60 mt-0.5">
                    IV: {(parseFloat(liveOption.quotes?.bid_iv || 0) * 100).toFixed(2)}%
                  </div>
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 mb-1.5">
                  Best Ask {isBuy && <span className="text-yellow-400">●</span>}
                </div>
                <div className={`rounded px-2.5 py-1.5 ${
                  isBuy 
                    ? 'bg-green-500/20 border-2 border-green-500/50' 
                    : 'bg-green-500/10 border border-green-500/30'
                }`}>
                  <span className="text-green-400 font-semibold text-sm">
                    ${parseFloat(liveOption.quotes?.best_ask || 0).toFixed(2)}
                  </span>
                  <div className="text-[9px] text-green-400/60 mt-0.5">
                    IV: {(parseFloat(liveOption.quotes?.ask_iv || 0) * 100).toFixed(2)}%
                  </div>
                </div>
              </div>
            </div> */}

            {/* Execution Price - Live */}
            <div className={`rounded-lg p-2.5 border-2 ${
              isBuy 
                ? 'bg-green-500/15 border-green-500/50' 
                : 'bg-red-500/15 border-red-500/50'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <div className="text-[10px] text-slate-400">
                  Execution Price
                </div>
                <div className="text-[10px] text-slate-400">
                  IV: {displayIV.toFixed(2)}%
                </div>
              </div>
              <div className={`text-xl font-bold ${
                isBuy ? 'text-green-400' : 'text-red-400'
              }`}>
                ${displayPrice.toFixed(2)}
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5">
                {isBuy ? 'Buying at Ask' : 'Selling at Bid'}
              </div>
            </div>

            {/* Cost Breakdown */}
            {isBuy ? (
              // BUYING: Show premium cost
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <div className="flex items-start gap-2 mb-2">
                  <Info size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-[10px] text-slate-400 leading-tight">
                    When buying options, you pay the premium upfront. This is your maximum possible loss.
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Premium Cost</span>
                    <span className="text-slate-100 font-semibold">
                      ${(displayPrice * quantity).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Max Loss</span>
                    <span className="text-red-400 font-semibold">
                      ${(displayPrice * quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              // SELLING: Show premium received + collateral required
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle size={14} className="text-orange-400 mt-0.5 flex-shrink-0" />
                  <div className="text-[10px] text-slate-400 leading-tight">
                    When selling options, you receive the premium but must lock collateral. Your loss can exceed the premium received.
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Premium Received</span>
                    <span className="text-green-400 font-semibold">
                      +${(displayPrice * quantity).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Collateral Required</span>
                    <span className="text-orange-400 font-semibold">
                      ${(parseFloat(liveOption.strike_price) * quantity * contractValue).toFixed(2)}
                    </span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-700">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-300">Net Cost</span>
                      <span className="text-slate-100">
                        ${((parseFloat(liveOption.strike_price) * quantity * contractValue) - (displayPrice * quantity)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] text-slate-400 block mb-1.5">
                Quantity (Contracts)
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || /^[0-9\b]+$/.test(val)) {
                    setQuantity(val);
                  }
                }}
                onBlur={() => {
                  if (quantity === "" || Number(quantity) < 1) {
                    setQuantity(1);
                  }
                }}
                min={minQuantity}
                className={`w-full bg-slate-800 border rounded-lg px-3 py-2 text-slate-100 text-base font-semibold outline-none focus:ring-2 transition ${
                  meetsMinimum
                    ? 'border-slate-600 focus:border-blue-500 focus:ring-blue-500/20'
                    : 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                }`}
              />
              {!meetsMinimum ? (
                <div className="flex items-center gap-1.5 mt-1.5 px-2.5 py-1.5 bg-red-500/10 border border-red-500/30 rounded text-[10px] text-red-400">
                  <AlertCircle size={12} className="flex-shrink-0" />
                  <span>
                    Minimum: {minAmount} contracts (≥ {minAmount} {liveOption.underlying_asset_symbol})
                  </span>
                </div>
              ) : (
                <div className="text-[10px] text-slate-500 mt-1">
                  Min amount: {minAmount} {liveOption.underlying_asset_symbol} (Min qty: {minQuantity})
                </div>
              )}
            </div>

            <div className="bg-slate-800/50 rounded-lg p-2.5">
              <div className="flex items-center justify-between mb-0.5">
                <div className="text-[10px] text-slate-500">
                  {isBuy ? 'Total Cost' : 'Total to Lock'}
                </div>
                <div className="text-[10px] text-slate-500">
                  {quantity} contracts
                </div>
              </div>
              <div className="text-lg font-bold text-slate-100">
                ${isBuy 
                  ? (displayPrice * quantity).toFixed(2)
                  : ((parseFloat(liveOption.strike_price) * quantity * contractValue) - (displayPrice * quantity)).toFixed(2)
                }
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5">
                {isBuy ? 'Premium to pay' : 'Net collateral after premium received'}
              </div>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => {
                  setModal(null);
                  setQuantity(1);
                }}
                disabled={isPlacingOrder}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-100 py-2.5 rounded-lg font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={() => handleOptionsOrder(action, liveOption)}
                disabled={isPlacingOrder || !meetsMinimum}
                className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                  isBuy
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
                    : "bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/20"
                }`}
              >
                {isPlacingOrder
                  ? "Placing..."
                  : `Confirm ${isBuy ? "Buy" : "Sell"}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  })()}
    </div>
  );
};

export default OptionsChainFinal;
