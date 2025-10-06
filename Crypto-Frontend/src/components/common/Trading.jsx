import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import orderBookSvg from "../../assets/svg/order-book.svg";
import { BarChart3 } from "lucide-react"; // Chart icon
import { Dialog } from "@headlessui/react";
import { WalletContext } from "../../contexts/WalletContext";

// REST/WS bases for Spot and USDT-M Futures (Binance)
const SPOT_REST = "https://api.binance.com";
const SPOT_WS = "wss://stream.binance.com:9443/ws";
const FUT_REST = "https://fapi.binance.com";
const FUT_WS = "wss://fstream.binance.com/ws"; // USDT-M futures WS

const Trading = () => {
  const [mode, setMode] = useState("spot"); // "spot" | "futures"
  const [spotSide, setSpotSide] = useState("buy"); // "buy" | "sell"

  const { balance, loading } = useContext(WalletContext);
  const [price, setPrice] = useState(0);
  const [total, setTotal] = useState(0);

  const [value, setValue] = useState(50);

  const [tradeType, setTradeType] = useState("Intraday");

  const [selectedOrderType, setSelectedOrderType] = useState("Market");

  const orderTypes = ["Market", "Limit", "Stop Limit"];
  const [amount, setAmount] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const showFloatingLabel = isFocused || amount !== "";

  // ---------- Symbol selection ----------
  const [symbols, setSymbols] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState({
    symbol: "btcusdt",
    baseAsset: "BTC",
    quoteAsset: "USDT",
  });

  const handleOrder = async () => {
    try {
      // Get tokens from localStorage
      const tokens = JSON.parse(localStorage.getItem("authTokens"));
      if (!tokens?.access) {
        alert("You must be logged in!");
        return;
      }

      // Fetch live price from Binance
      // const priceRes = await fetch(
      //   `https://api.binance.com/api/v3/ticker/price?symbol=${selected.symbol}`
      // );
      // const priceData = await priceRes.json();

      // Prepare payload
      const payload = {
        asset_symbol: selected.baseAsset, // symbol like BTCUSDT
        asset_name: "Btc" || "", // if available in your state
        asset_exchange: selected.exchange || "BINANCE", // default to BINANCE
        trade_type: mode === "spot" ? "SPOT" : "FUT",
        direction: spotSide.toUpperCase(), // BUY or SELL
        holding_type: tradeType.toUpperCase(), // e.g. LONGTERM or INTRADAY
        quantity: amount,
        price: fmt(ticker?.c, 2),
        order_type: "MARKET",
      };

      console.log(payload, "the payload");

      // Call backend API
      const response = await fetch(
        "http://127.0.0.1:8000/api/v1/trading/place-order/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens.access}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert(
          `✅ Order placed: ${data.action} ${data.quantity} @ ${data.price}`
        );
      } else {
        alert(`❌ Error: ${data.detail || "Something went wrong"}`);
      }
    } catch (error) {
      console.error(error);
      alert("⚠️ Failed to place order");
    }
  };

  // ---------- Live data ----------
  const [ticker, setTicker] = useState(null);
  useEffect(() => {
    if (ticker?.c) {
      setPrice(parseFloat(ticker.c));
    }
  }, [ticker]);

  useEffect(() => {
    if (amount && price) {
      setTotal(parseFloat(amount) * parseFloat(price));
    } else {
      setTotal(0);
    }
  }, [amount, price]);

  const [sliderValue, setSliderValue] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const hideTimer = useRef(null);

  const handleSliderChange = (value) => {
    const price = parseFloat(ticker?.c || 0); // current market price
    const safeBalance = parseFloat(balance || 0); // wallet balance from context
    const percent = Number(value);

    if (spotSide === "buy") {
      // Buy → use % of quoteAsset balance (e.g. USDT)
      const usableQuote = safeBalance * (percent / 100);

      if (price > 0) {
        // convert quote → base amount (e.g. USDT → BTC)
        const baseAmount = usableQuote / price;
        setAmount(baseAmount.toFixed(6));
      } else {
        setAmount("0");
      }
    } else {
      // Sell → use % of baseAsset balance (e.g. BTC)
      const sellAmount = safeBalance * (percent / 100);
      setAmount(sellAmount.toFixed(6));
    }

    // Also update slider state if you’re showing tooltip
    setSliderValue(percent);
  };

  const handleStart = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }
    setShowTooltip(true);
  };

  const handleEnd = () => {
    // Delay hiding tooltip so it doesn't disappear immediately
    hideTimer.current = setTimeout(() => {
      setShowTooltip(false);
    }, 800); // Delay in milliseconds
  };

  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  const [trades, setTrades] = useState([]);
  const [markPrice, setMarkPrice] = useState(null);

  // futures-specific
  const [leverage, setLeverage] = useState(20);
  const [marginType, setMarginType] = useState("CROSS");
  const [positionSize, setPositionSize] = useState(0);
  const [reduceOnly, setReduceOnly] = useState(false);

  // ws refs
  const tickerWS = useRef(null);
  const depthWS = useRef(null);
  const tradesWS = useRef(null);
  const markWS = useRef(null);

  const [showTradeModal, setShowTradeModal] = useState(false);

  const REST_BASE = mode === "spot" ? SPOT_REST : FUT_REST;
  const WS_BASE = mode === "spot" ? SPOT_WS : FUT_WS;
  const [isChartOpen, setIsChartOpen] = useState(false);

  // Load symbols
  useEffect(() => {
    const endpoint =
      mode === "spot" ? "/api/v3/exchangeInfo" : "/fapi/v1/exchangeInfo";
    fetch(`${REST_BASE}${endpoint}`)
      .then((r) => r.json())
      .then((data) => {
        const list = (data.symbols || [])
          .filter((s) => s.status === "TRADING" && s.quoteAsset === "USDT")
          .map((s) => ({
            symbol: s.symbol.toLowerCase(),
            baseAsset: s.baseAsset,
            quoteAsset: s.quoteAsset,
          }))
          .sort((a, b) => a.symbol.localeCompare(b.symbol));
        setSymbols(list);

        if (!list.find((x) => x.symbol === selected.symbol)) {
          if (list[0]) setSelected(list[0]);
        }
      })
      .catch(() => {});
  }, [mode]);

  const filteredSymbols = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return symbols;
    return symbols.filter(
      (s) => s.symbol.includes(q) || s.baseAsset.toLowerCase().includes(q)
    );
  }, [symbols, search]);

  // Websockets
  useEffect(() => {
    const sym = selected.symbol.toLowerCase();
    if (!sym) return;

    const tickerStream = `${sym}@ticker`;
    const depthStream = `${sym}@depth20@100ms`;
    const aggStream = `${sym}@aggTrade`;
    const markStream = `${sym}@markPrice`;

    try {
      tickerWS.current?.close();
    } catch {}
    tickerWS.current = new WebSocket(`${WS_BASE}/${tickerStream}`);
    tickerWS.current.onmessage = (e) => setTicker(JSON.parse(e.data));

    try {
      depthWS.current?.close();
    } catch {}
    depthWS.current = new WebSocket(`${WS_BASE}/${depthStream}`);
    depthWS.current.onmessage = (e) => {
      const d = JSON.parse(e.data);
      setOrderBook({ bids: d.bids || d.b || [], asks: d.asks || d.a || [] });
    };

    try {
      tradesWS.current?.close();
    } catch {}
    tradesWS.current = new WebSocket(`${WS_BASE}/${aggStream}`);
    tradesWS.current.onmessage = (e) => {
      const d = JSON.parse(e.data);
      setTrades((prev) => {
        const next = [{ p: d.p, q: d.q, T: d.T, m: d.m }, ...prev];
        return next.slice(0, 40);
      });
    };

    try {
      markWS.current?.close();
    } catch {}
    markWS.current = new WebSocket(`${WS_BASE}/${markStream}`);
    markWS.current.onmessage = (e) => setMarkPrice(JSON.parse(e.data));

    return () => {
      try {
        tickerWS.current?.close();
        depthWS.current?.close();
        tradesWS.current?.close();
        markWS.current?.close();
      } catch {}
    };
  }, [selected, mode]);

  const maxTotal = useMemo(() => {
    const totals = [...orderBook.asks, ...orderBook.bids].map(
      ([p, q]) => parseFloat(p) * parseFloat(q)
    );
    return totals.length ? Math.max(...totals) : 1;
  }, [orderBook]);

  const fmt = (v, d = 2) =>
    v == null || v === "" ? "--" : Number(v).toFixed(d);

  const markPriceValue = markPrice
    ? markPrice.p
      ? Number(markPrice.p)
      : null
    : null;

  // ---------- Trade Form (spot/futures UI) ----------
  const renderTradeForm = () => (
    <div className="bg-[#15162C]   p-3 sm:p-4 rounded-xl border border-white/10">
      {/* Tabs */}
      <div className="flex items-center gap-2  text-xs sm:text-sm mb-4 flex-nowrap">
  {/* Toggle group for Intraday & Delivery */}
  <div className="flex rounded-md border  border-gray-600 overflow-hidden">
    {["Intraday", "Delivery"].map((type, index) => (
      <React.Fragment key={type}>
        <button
          onClick={() => setTradeType(type)}
          className={`px-3 py-1 font-semibold transition-all duration-200 ${
            tradeType === type
              ? "bg-purple-600 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          {type}
        </button>
        {/* Separator bar */}
        {index === 0 && <div className="w-px h-4 bg-gray-600 self-center" />}
      </React.Fragment>
    ))}
  </div>

  {/* Separate "Order Book" and "Recent Trades" */}
  {["Order Book", "Recent Trades"].map((type) => (
    <button
      key={type}
      onClick={() => setTradeType(type)}
      className={`font-semibold transition-all duration-200 ${
        tradeType === type
          ? "text-white underline underline-offset-4 decoration-purple-500"
          : "text-gray-400 hover:text-white"
      }`}
    >
      {type}
    </button>
  ))}
</div>


      <div className="flex space-x-4 text-xs sm:text-sm mb-4">
        {(tradeType === "Intraday" || tradeType === "Delivery") && (
          <div className="flex space-x-4 text-xs sm:text-sm mb-4">
            {orderTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedOrderType(type)}
                className={`${
                  selectedOrderType === type
                    ? "text-purple-400 font-semibold"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        )}
      </div>

      {tradeType === "Order Book" ? (
        /* ===================== ORDER BOOK UI ===================== */
        <div className="bg-[#15162C] p-3 sm:p-4 rounded-xl border border-white/10 flex-1">
          <h2 className="text-base font-semibold text-white/80 mb-4 flex items-center gap-2">
            <img src={orderBookSvg} alt="Order Book" className="h-4 w-auto" />
            Order Book
          </h2>

          <div className="grid grid-cols-3 text-xs text-gray-400 mb-2 font-medium">
            <span>Price ({selected.quoteAsset})</span>
            <span className="text-right">Amount ({selected.baseAsset})</span>
            <span className="text-right">Total</span>
          </div>

          {/* Asks */}
          <div className="space-y-1 mb-3">
            {orderBook.asks.slice(0, 6).map(([p, q], i) => {
              const price = parseFloat(p);
              const amount = parseFloat(q);
              const total = price * amount;
              const perc = Math.min((total / maxTotal) * 100, 100);
              return (
                <div
                  key={`ask-${i}`}
                  className="relative text-xs sm:text-sm font-mono"
                >
                  <div
                    className="absolute inset-0 bg-red-500/10 rounded"
                    style={{ width: `${perc}%` }}
                  />
                  <div className="relative grid grid-cols-3 text-red-400 z-10">
                    <span>{fmt(price, 2)}</span>
                    <span className="text-right">{fmt(amount, 4)}</span>
                    <span className="text-right">{fmt(total, 2)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mid Price */}
          <div className="text-center my-2">
            <span
              className={`text-lg font-bold ${
                ticker && parseFloat(ticker.P) < 0
                  ? "text-red-400"
                  : "text-green-400"
              }`}
            >
              {fmt(ticker?.c, 2)} {selected.quoteAsset}
            </span>
          </div>

          {/* Bids */}
          <div className="space-y-1">
            {orderBook.bids.slice(0, 6).map(([p, q], i) => {
              const price = parseFloat(p);
              const amount = parseFloat(q);
              const total = price * amount;
              const perc = Math.min((total / maxTotal) * 100, 100);
              return (
                <div
                  key={`bid-${i}`}
                  className="relative text-xs sm:text-sm font-mono"
                >
                  <div
                    className="absolute inset-0 bg-green-500/10 rounded"
                    style={{ width: `${perc}%` }}
                  />
                  <div className="relative grid grid-cols-3 text-green-400 z-10">
                    <span>{fmt(price, 2)}</span>
                    <span className="text-right">{fmt(amount, 4)}</span>
                    <span className="text-right">{fmt(total, 2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : tradeType === "Recent Trades" ? (
        /* ===================== RECENT TRADES UI ===================== */
        <div className="bg-[#15162C] p-3 sm:p-4 rounded-xl border border-white/10 flex-1">
          <h3 className="text-sm font-semibold mb-3">Recent Trades</h3>

          <div className="grid grid-cols-3 text-xs text-gray-400 border-b border-white/10 pb-1 mb-2">
            <span>Price</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Time</span>
          </div>

          <div className="overflow-y-auto space-y-1">
            {trades.slice(0, 12).map((t, i) => (
              <div
                key={i}
                className={`grid grid-cols-3 text-xs items-center rounded-md px-2 py-1 ${
                  t.m
                    ? "bg-red-500/10 text-red-400"
                    : "bg-green-500/10 text-green-400"
                }`}
              >
                <span>{fmt(t.p)}</span>
                <span className="text-right">{fmt(t.q, 4)}</span>
                <span className="text-right">
                  {new Date(t.T).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ===================== ORIGINAL TRADING UI ===================== */
        <>
          {mode === "futures" ? (
            <>
              {/* Futures UI */}
              <div className="space-y-3">
                <div className="text-xs text-gray-400">
                  Avbl <span className="ml-1">500.00 USDT</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Leverage</span>
                  <input
                    type="number"
                    value={leverage}
                    min={1}
                    max={125}
                    onChange={(e) => setLeverage(Number(e.target.value))}
                    className="w-16 bg-transparent border border-white/10 rounded text-center"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setMarginType("CROSS")}
                    className={`flex-1 py-1 rounded ${
                      marginType === "CROSS"
                        ? "bg-white/5 text-purple-400 font-semibold"
                        : "bg-white/5 text-gray-400"
                    }`}
                  >
                    Cross
                  </button>
                  <button
                    onClick={() => setMarginType("ISOLATED")}
                    className={`flex-1 py-1 rounded ${
                      marginType === "ISOLATED"
                        ? "bg-white/5 text-purple-400 font-semibold"
                        : "bg-white/5 text-gray-400"
                    }`}
                  >
                    Isolated
                  </button>
                </div>
                <div className="bg-[#1E1F36] rounded p-2 text-xs sm:text-sm flex justify-between items-center">
                  <span className="text-gray-400">Size</span>
                  <input
                    type="number"
                    value={positionSize}
                    onChange={(e) => setPositionSize(Number(e.target.value))}
                    className="bg-transparent text-right w-20 sm:w-24 focus:outline-none text-white"
                  />
                  <span className="text-gray-400">{selected.baseAsset}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={reduceOnly}
                    onChange={(e) => setReduceOnly(e.target.checked)}
                  />
                  <label className="text-xs text-gray-400">Reduce Only</label>
                </div>
                <button className="w-full bg-green-500 hover:bg-green-600 py-2 rounded-lg font-semibold">
                  Buy/Long {selected.baseAsset}
                </button>
                <button className="w-full bg-red-500 hover:bg-red-600 py-2 rounded-lg font-semibold">
                  Sell/Short {selected.baseAsset}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Spot Side Toggle */}
              <div className="flex space-x-4 mb-4">
                <button
                  onClick={() => setSpotSide("buy")}
                  className={`flex-1 py-1 rounded ${
                    spotSide === "buy"
                      ? "bg-green-500 text-white font-semibold"
                      : "bg-white/5 text-gray-400"
                  }`}
                >
                  Buy
                </button>
                <button
                  onClick={() => setSpotSide("sell")}
                  className={`flex-1 py-1 rounded ${
                    spotSide === "sell"
                      ? "bg-red-500 text-white font-semibold"
                      : "bg-white/5 text-gray-400"
                  }`}
                >
                  Sell
                </button>
              </div>

              {spotSide === "buy" ? (
                <div className="space-y-3 mb-6">
                  <div className="text-xs text-gray-400">
                    Avbl{" "}
                    <span className="ml-1">
                      {loading
                        ? "Loading..."
                        : `${balance} ${selected.quoteAsset}`}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="bg-[#1E1F36] rounded p-2 flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-gray-400">Price</span>
                    <span className="text-white">{price.toFixed(2)}</span>
                    <span className="text-gray-400">{selected.quoteAsset}</span>
                  </div>

                  {/* Amount */}
                  <div className="bg-[#1E1F36] rounded p-2 flex items-center text-xs sm:text-sm relative w-full max-w-sm">
                    <div className="bg-[#1E1F36] rounded p-2 text-xs sm:text-sm w-full max-w-sm">
                      <div className="relative w-full">
                        <label
                          className={`absolute left-3 text-gray-400 transition-all duration-200 ease-in-out pointer-events-none ${
                            amount
                              ? "text-[10px] sm:text-xs top-1"
                              : "text-xs sm:text-sm top-2.5"
                          }`}
                        >
                          Amount ({selected.baseAsset})
                        </label>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          onWheel={(e) => e.target.blur()}
                          className="no-spinner w-full bg-transparent border border-gray-600 rounded px-3 pt-5 pb-1 text-white placeholder-transparent focus:outline-none focus:border-purple-400 transition duration-150"
                          placeholder="Amount"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Range Slider */}
                  <div className="relative w-full">
                    {/* Slider */}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="25"
                      value={sliderValue}
                      onMouseDown={handleStart}
                      onMouseUp={handleEnd}
                      onTouchStart={handleStart}
                      onTouchEnd={handleEnd}
                      onChange={(e) =>
                        handleSliderChange(Number(e.target.value))
                      }
                      className="w-full accent-green-500 cursor-pointer"
                    />

                    {/* Floating Tooltip above thumb */}
                    {showTooltip && (
                      <div
                        className="absolute -top-10 flex items-center justify-center w-12 h-8 bg-gray-800 text-white text-sm font-semibold rounded-md shadow-md transition-all duration-200"
                        style={{
                          left: `calc(${sliderValue}% - 24px)`,
                        }}
                      >
                        {sliderValue}%
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="bg-[#1E1F36] rounded p-2 flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-gray-400">Total</span>
                    <span className="text-white">
                      {total > 0
                        ? `${total.toFixed(2)} ${selected.quoteAsset}`
                        : `Minimum 5 ${selected.quoteAsset}`}
                    </span>
                  </div>

                  <div className="text-xs text-gray-400">
                    Available: <span>0.000000 {selected.baseAsset}</span>
                  </div>

                  <button
                    onClick={handleOrder}
                    className="w-full bg-green-500 hover:bg-green-600 py-2 rounded-lg font-semibold"
                  >
                    Buy {selected.baseAsset}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs text-gray-400">
                    Avbl{" "}
                    <span className="ml-1">
                      {loading
                        ? "Loading..."
                        : `${balance} ${selected.baseAsset}`}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="bg-[#1E1F36] rounded p-2 flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-gray-400">Price</span>
                    <span className="text-white">{price.toFixed(2)}</span>
                    <span className="text-gray-400">{selected.quoteAsset}</span>
                  </div>

                  {/* Amount */}
                  <div className="bg-[#1E1F36] rounded p-2 flex items-center text-xs sm:text-sm relative w-full max-w-sm">
                    <div className="bg-[#1E1F36] rounded p-2 text-xs sm:text-sm w-full max-w-sm">
                      <div className="relative w-full">
                        <label
                          className={`absolute left-3 text-gray-400 transition-all duration-200 ease-in-out pointer-events-none ${
                            amount
                              ? "text-[10px] sm:text-xs top-1"
                              : "text-xs sm:text-sm top-2.5"
                          }`}
                        >
                          Amount ({selected.baseAsset})
                        </label>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          onWheel={(e) => e.target.blur()}
                          className="no-spinner w-full bg-transparent border border-gray-600 rounded px-3 pt-5 pb-1 text-white placeholder-transparent focus:outline-none focus:border-purple-400 transition duration-150"
                          placeholder="Amount"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Range Slider */}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="25"
                    onChange={(e) => handleSliderChange(e.target.value)}
                    className="w-full accent-red-500"
                  />

                  {/* Total */}
                  <div className="bg-[#1E1F36] rounded p-2 flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-gray-400">Total</span>
                    <span className="text-white">
                      {total > 0
                        ? `${total.toFixed(2)} ${selected.quoteAsset}`
                        : `Minimum 10 ${selected.baseAsset}`}
                    </span>
                  </div>

                  <div className="text-xs text-gray-400">
                    Available:{" "}
                    <span>
                      {balance} {selected.quoteAsset}
                    </span>
                  </div>

                  <button
                    onClick={handleOrder}
                    className="w-full bg-red-500 hover:bg-red-600 py-2 rounded-lg font-semibold"
                  >
                    Sell {selected.baseAsset}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="text-white h-full w-full px-2 sm:px-4">
      <h1 className="text-2xl sm:text-4xl font-extrabold bg-gradient-to-r from-[#A93EF8] to-[#E75469] text-transparent bg-clip-text mb-4 sm:mb-6">
        Virtual Trading ({mode.toUpperCase()})
      </h1>

      {/* Mode Toggle */}
      <div className="flex flex-wrap  items-center gap-2 ">
        <button
          onClick={() => setMode("spot")}
          className={`px-3 py-1 rounded ${
            mode === "spot" ? "bg-white/5 font-semibold" : "text-gray-400"
          }`}
        >
          Spot
        </button>
        <button
          onClick={() => setMode("futures")}
          className={`px-3 py-1 rounded ${
            mode === "futures" ? "bg-white/5 font-semibold" : "text-gray-400"
          }`}
        >
          Futures
        </button>
      </div>

      {/* Pair + Stats */}
      <div
        className=" my-3 
  sm:border sm:border-[#4733A6]/40
  p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-2"
      >
        {/* Left: Pair Selector */}
        <div className="relative w-full sm:w-64 lg:w-72 flex-shrink-0">
          <button
            onClick={() => setShowDropdown((v) => !v)}
            className="flex items-center justify-start sm:justify-between w-full px-0 sm:px-4 py-3 
        sm:border sm:border-[#4733A6]/40 hover:sm:border-[#6a4cf5] 
        rounded-lg text-xl   uppercase transition"
            title="Select Pair"
          >
            <span className="font-extrabold font-mono">{selected.symbol}</span>
            <span className="ml-2 text-sm sm:text-base opacity-70">▼</span>
          </button>

          {showDropdown && (
            <div
              className="absolute left-0 mt-2 w-full max-h-80 overflow-y-auto 
        bg-[#070710]/95 sm:border sm:border-[#2e2a40]/60 
        rounded-xl shadow-xl z-50 animate-fadeIn"
            >
              <div className="sticky top-0 bg-[#070710]/95 p-2">
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search (e.g. btc, eth, btcusdt)"
                  className="w-full sm:border sm:border-[#2e2a40]/60 
              text-white text-sm px-3 py-2 rounded-md outline-none 
              bg-transparent focus:sm:border-[#6a4cf5]"
                />
              </div>
              <ul className="divide-y divide-white/5">
                {filteredSymbols.map((s) => (
                  <li
                    key={s.symbol}
                    onClick={() => {
                      setSelected(s);
                      setShowDropdown(false);
                      setSearch("");
                    }}
                    className="px-3  py-2 hover:bg-white/5 cursor-pointer 
                flex items-center justify-between uppercase text-sm transition"
                  >
                    <span className="font-semibold">{s.baseAsset}</span>
                    <span className="text-xs text-gray-400">{s.symbol}</span>
                  </li>
                ))}
                {filteredSymbols.length === 0 && (
                  <li className="px-3 py-4 text-sm text-gray-500 text-center">
                    No results
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Right Content */}
        <div className="flex-1">
          {/* Mobile Layout */}
          <div className="block sm:hidden -mt-2 space-y-3">
            {/* Big Last Price */}
            <div
              className={`text-xl -mt-4 font-mono font-extrabold ${
                ticker && parseFloat(ticker.P) < 0
                  ? "text-red-400"
                  : "text-green-400"
              }`}
            >
              {fmt(ticker?.c, 2)} {selected.quoteAsset}
            </div>

            {/* Compact Stats Boxes */}
            <div className="grid grid-cols-2 px-2 gap-2 text-xs">
              {/* 24h Change */}
              <div className="bg-[#0F0A25]/50 rounded-md p-2 border border-white/10">
                <div className="text-[#A489F5] text-[10px] mb-0.5">
                  24h Change
                </div>
                <div
                  className={`font-medium ${
                    ticker && parseFloat(ticker.P) < 0
                      ? "text-red-400"
                      : "text-white"
                  }`}
                >
                  {fmt(ticker?.p, 2)} ({fmt(ticker?.P, 2)}%)
                </div>
              </div>

              {/* 24h High */}
              <div className="bg-[#0F0A25]/50 rounded-md p-2 border border-white/10">
                <div className="text-[#A489F5] text-[10px] mb-0.5">
                  24h High
                </div>
                <div className="font-medium">{fmt(ticker?.h, 2)}</div>
              </div>

              {/* 24h Low */}
              <div className="bg-[#0F0A25]/50 rounded-md p-2 border border-white/10">
                <div className="text-[#A489F5] text-[10px] mb-0.5">24h Low</div>
                <div className="font-medium">{fmt(ticker?.l, 2)}</div>
              </div>

              {/* Base Volume */}
              <div className="bg-[#0F0A25]/50 rounded-md p-2 border border-white/10">
                <div className="text-[#A489F5] text-[10px] mb-0.5">
                  24h Vol ({selected.baseAsset})
                </div>
                <div className="font-medium">{fmt(ticker?.v, 2)}</div>
              </div>

              {/* Quote Volume */}
              <div className="bg-[#0F0A25]/50 rounded-md p-2 border border-white/10 col-span-2">
                <div className="text-[#A489F5] text-[10px] mb-0.5">
                  24h Vol ({selected.quoteAsset})
                </div>
                <div className="font-medium">{fmt(ticker?.q, 2)}</div>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {/* Last Price */}
            <div>
              <div className="text-[#A489F5] text-xs mb-1">Last Price</div>
              <div
                className={`font-semibold text-base sm:text-lg ${
                  ticker && parseFloat(ticker.P) < 0
                    ? "text-red-400"
                    : "text-green-400"
                }`}
              >
                {fmt(ticker?.c, 2)} {selected.quoteAsset}
              </div>
            </div>

            {/* 24h Change */}
            <div>
              <div className="text-[#A489F5] text-xs mb-1">24h Change</div>
              <div
                className={`font-semibold ${
                  ticker && parseFloat(ticker.P) < 0
                    ? "text-red-400"
                    : "text-white"
                }`}
              >
                {fmt(ticker?.p, 2)} ({fmt(ticker?.P, 2)}%)
              </div>
            </div>

            {/* High */}
            <div>
              <div className="text-[#A489F5] text-xs mb-1">24h High</div>
              <div className="font-semibold">{fmt(ticker?.h, 2)}</div>
            </div>

            {/* Low */}
            <div>
              <div className="text-[#A489F5] text-xs mb-1">24h Low</div>
              <div className="font-semibold">{fmt(ticker?.l, 2)}</div>
            </div>

            {/* Base Volume */}
            <div>
              <div className="text-[#A489F5] text-xs mb-1">
                24h Volume ({selected.baseAsset})
              </div>
              <div className="font-semibold">{fmt(ticker?.v, 2)}</div>
            </div>

            {/* Quote Volume */}
            <div>
              <div className="text-[#A489F5] text-xs mb-1">
                24h Volume ({selected.quoteAsset})
              </div>
              <div className="font-semibold">{fmt(ticker?.q, 2)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-200px)]  ">
        <div className="w-full h-full flex flex-col gap-4">
          {/* Desktop: Show Chart Directly */}
          <div className="hidden sm:block flex-1 p-3 sm:p-4">
            <h2 className="text-base sm:text-lg font-semibold"></h2>
            <iframe
              src={`https://www.tradingview.com/widgetembed/?symbol=BINANCE:${selected.symbol.toUpperCase()}&interval=1&theme=dark&hidetoptoolbar=1&saveimage=0&toolbarbg=`}
              className="w-full h-full "
              frameBorder="0"
              // allowTransparency
              scrolling="no"
              title="TradingView Chart"
            />
          </div>

          {/* Mobile: Button that opens modal */}
          <div className="block -mt-6 sm:hidden p-3">
            <button
              onClick={() => setIsChartOpen(true)}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-[#4733A6]/90 hover:bg-[#6a4cf5] text-white font-semibold transition"
            >
              <BarChart3 className="w-5 h-5" />
              View Chart
            </button>

            {/* Modal */}
            <Dialog
              open={isChartOpen}
              onClose={() => setIsChartOpen(false)}
              className="relative z-50"
            >
              <div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm"
                aria-hidden="true"
              />

              <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-3xl bg-[#0F0A25] rounded-xl shadow-lg overflow-hidden">
                  <div className="flex justify-between items-center p-3 border-b border-white/10">
                    <h2 className="text-lg text-white font-semibold">
                      Trading Chart
                    </h2>
                    <button
                      onClick={() => setIsChartOpen(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  <iframe
                    src={`https://www.tradingview.com/widgetembed/?symbol=BINANCE:${selected.symbol.toUpperCase()}&interval=1&theme=dark&hidetoptoolbar=1&saveimage=0&toolbarbg=`}
                    className="w-full h-[400px] sm:h-[500px]"
                    frameBorder="0"
                    // allowTransparency
                    scrolling="no"
                    title="TradingView Chart"
                  />
                </Dialog.Panel>
              </div>
            </Dialog>
          </div>
        </div>

       
        <div className="hidden p-2 w-2/5 lg:block">{renderTradeForm()}</div>
      </div>

      {/* Grid Layout */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
       
        <div className="bg-[#15162C] p-3 sm:p-4 rounded-xl border border-white/10 flex-1">
          <h2 className="text-base font-semibold text-white/80 mb-4 flex items-center gap-2">
            <img src={orderBookSvg} alt="Order Book" className="h-4 w-auto" />
            Order Book
          </h2>

          <div className="grid grid-cols-3 text-xs text-gray-400 mb-2 font-medium">
            <span>Price ({selected.quoteAsset})</span>
            <span className="text-right">Amount ({selected.baseAsset})</span>
            <span className="text-right">Total</span>
          </div>
          <div className="space-y-1 mb-3">
            {orderBook.asks.slice(0, 12).map(([p, q], i) => {
              const price = parseFloat(p);
              const amount = parseFloat(q);
              const total = price * amount;
              const perc = Math.min((total / maxTotal) * 100, 100);
              return (
                <div
                  key={`ask-${i}`}
                  className="relative text-xs sm:text-sm font-mono"
                >
                  <div
                    className="absolute inset-0 bg-red-500/10 rounded"
                    style={{ width: `${perc}%` }}
                  />
                  <div className="relative grid grid-cols-3 text-red-400 z-10">
                    <span>{fmt(price, 2)}</span>
                    <span className="text-right">{fmt(amount, 4)}</span>
                    <span className="text-right">{fmt(total, 2)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center my-2">
            <span
              className={`text-lg font-bold ${
                ticker && parseFloat(ticker.P) < 0
                  ? "text-red-400"
                  : "text-green-400"
              }`}
            >
              {fmt(ticker?.c, 2)} {selected.quoteAsset}
            </span>
          </div>

          <div className="space-y-1">
            {orderBook.bids.slice(0, 12).map(([p, q], i) => {
              const price = parseFloat(p);
              const amount = parseFloat(q);
              const total = price * amount;
              const perc = Math.min((total / maxTotal) * 100, 100);
              return (
                <div
                  key={`bid-${i}`}
                  className="relative text-xs sm:text-sm font-mono"
                >
                  <div
                    className="absolute inset-0 bg-green-500/10 rounded"
                    style={{ width: `${perc}%` }}
                  />
                  <div className="relative grid grid-cols-3 text-green-400 z-10">
                    <span>{fmt(price, 2)}</span>
                    <span className="text-right">{fmt(amount, 4)}</span>
                    <span className="text-right">{fmt(total, 2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[#15162C] p-3 sm:p-4 rounded-xl border border-white/10 flex-1">
          <h3 className="text-sm font-semibold mb-3">Recent Trades</h3>

          <div className="grid grid-cols-3 text-xs text-gray-400 border-b border-white/10 pb-1 mb-2">
            <span>Price</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Time</span>
          </div>

          <div className="overflow-y-auto space-y-1">
            {trades
              .slice(0, 23) 
              .map((t, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-3 text-xs items-center rounded-md px-2 py-1 ${
                    t.m
                      ? "bg-red-500/10 text-red-400"
                      : "bg-green-500/10 text-green-400"
                  }`}
                >
                  <span>{fmt(t.p)}</span>
                  <span className="text-right">{fmt(t.q, 4)}</span>
                  <span className="text-right">
                    {new Date(t.T).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div> */}

      <div className="lg:hidden   fixed bottom-0 z-10 left-0 right-0 flex justify-between gap-">
        <button
          onClick={() => {
            setSpotSide("buy");
            setShowTradeModal(true);
          }}
          className="bg-green-500 w-full text-white font-semibold px-6 py-3  shadow-lg"
        >
          Buy
        </button>
        <button
          onClick={() => {
            setSpotSide("sell");
            setShowTradeModal(true);
          }}
          className="bg-red-500 w-full text-white font-semibold px-6 py-3  shadow-lg"
        >
          Sell
        </button>
      </div>

      {showTradeModal && (
        <div className="fixed inset-0 bg-black/70 flex items-end lg:hidden z-50">
          <div className="bg-[#1E1F36] w-full rounded-t-2xl p-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Trade {selected.symbol}</h2>
              <button
                onClick={() => setShowTradeModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            {renderTradeForm()}
          </div>
        </div>
      )}
    </div>
  );
};

export default Trading;
