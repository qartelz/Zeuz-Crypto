import React, { useEffect, useMemo, useRef, useState } from "react";
import orderBookSvg from "../../assets/svg/order-book.svg";

// REST/WS bases for Spot and USDT-M Futures (Binance)
const SPOT_REST = "https://api.binance.com";
const SPOT_WS   = "wss://stream.binance.com:9443/ws";
const FUT_REST  = "https://fapi.binance.com";           // USDT-M futures REST
const FUT_WS    = "wss://fstream.binance.com/ws";      // USDT-M futures WS

const Trading = () => {
  // mode: 'spot' | 'futures'
  const [mode, setMode] = useState("spot");

  // ---------- Symbol selection ----------
  const [symbols, setSymbols] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState({
    symbol: "btcusdt",
    baseAsset: "BTC",
    quoteAsset: "USDT",
  });

  // ---------- Live data ----------
  const [ticker, setTicker] = useState(null);                      // @ticker
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] }); // @depth
  const [trades, setTrades] = useState([]);                        // @aggTrade
  const [markPrice, setMarkPrice] = useState(null);                // mark price (futures)

  // futures-specific UI state
  const [leverage, setLeverage] = useState(20);
  const [marginType, setMarginType] = useState("CROSS"); // CROSS or ISOLATED
  const [positionSize, setPositionSize] = useState(0);
  const [reduceOnly, setReduceOnly] = useState(false);

  // keep ws refs so we can close cleanly
  const tickerWS = useRef(null);
  const depthWS  = useRef(null);
  const tradesWS = useRef(null);
  const markWS   = useRef(null);

  // helper to pick REST/WS base
  const REST_BASE = mode === "spot" ? SPOT_REST : FUT_REST;
  const WS_BASE   = mode === "spot" ? SPOT_WS   : FUT_WS;

  // Load symbols whenever mode changes (spot vs futures)
  useEffect(() => {
    const endpoint = mode === "spot" ? "/api/v3/exchangeInfo" : "/fapi/v1/exchangeInfo";
    fetch(`${REST_BASE}${endpoint}`)
      .then(r => r.json())
      .then(data => {
        const list = (data.symbols || [])
          .filter(s => s.status === "TRADING" && s.quoteAsset === "USDT")
          .map(s => ({
            symbol: s.symbol.toLowerCase(),
            baseAsset: s.baseAsset,
            quoteAsset: s.quoteAsset,
          }))
          .sort((a,b) => a.symbol.localeCompare(b.symbol));
        setSymbols(list);

        // if current selected symbol not present in new list, replace with first
        if (!list.find(x => x.symbol === selected.symbol)) {
          if (list[0]) setSelected(list[0]);
        }
      })
      .catch(() => {});
  }, [mode]);

  const filteredSymbols = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return symbols;
    return symbols.filter(s =>
      s.symbol.includes(q) ||
      s.baseAsset.toLowerCase().includes(q)
    );
  }, [symbols, search]);

  // Open websockets whenever selected symbol or mode changes
  useEffect(() => {
    const sym = selected.symbol.toLowerCase();
    if (!sym) return;

    // Build stream endpoints - many streams are same name across spot/futures but different host
    const tickerStream = `${sym}@ticker`;
    const depthStream  = `${sym}@depth20@100ms`;
    const aggStream    = `${sym}@aggTrade`;
    const markStream   = `${sym}@markPrice`; // mark price exists on futures (and also on fstream)

    // --- Ticker ---
    try { tickerWS.current?.close(); } catch(e){}
    tickerWS.current = new WebSocket(`${WS_BASE}/${tickerStream}`);
    tickerWS.current.onmessage = (e) => {
      const d = JSON.parse(e.data);
      setTicker(d);
    };

    // --- Depth (order book) ---
    try { depthWS.current?.close(); } catch(e){}
    depthWS.current = new WebSocket(`${WS_BASE}/${depthStream}`);
    depthWS.current.onmessage = (e) => {
        const d = JSON.parse(e.data);
      
        // Spot uses bids/asks, Futures uses b/a
        const bids = d.bids || d.b || [];
        const asks = d.asks || d.a || [];
      
        setOrderBook({ bids, asks });
      };
      

    // --- Recent trades (aggregate) ---
    try { tradesWS.current?.close(); } catch(e){}
    tradesWS.current = new WebSocket(`${WS_BASE}/${aggStream}`);
    tradesWS.current.onmessage = (e) => {
      const d = JSON.parse(e.data);
      setTrades(prev => {
        const next = [{ p: d.p, q: d.q, T: d.T, m: d.m }, ...prev];
        return next.slice(0, 40); // keep last 40
      });
    };

    // --- Mark price (useful for futures UI) ---
    try { markWS.current?.close(); } catch(e){}
    markWS.current = new WebSocket(`${WS_BASE}/${markStream}`);
    markWS.current.onmessage = (e) => {
      const d = JSON.parse(e.data);
      // futures markPrice payload has .p as mark price; store whole object for flexibility
      setMarkPrice(d);
    };

    return () => {
      try { tickerWS.current?.close(); } catch(e){}
      try { depthWS.current?.close(); } catch(e){}
      try { tradesWS.current?.close(); } catch(e){}
      try { markWS.current?.close(); } catch(e){}
    };
  }, [selected, mode]);

  // Depth shading helper
  const maxTotal = useMemo(() => {
    const totals = [...orderBook.asks, ...orderBook.bids].map(([p, q]) => parseFloat(p) * parseFloat(q));
    return totals.length ? Math.max(...totals) : 1;
  }, [orderBook]);

  // Convenience getters with safe parse
  const fmt = (v, d = 2) => (v == null || v === "" ? "--" : Number(v).toFixed(d));

  // Helpers to render futures-specific values
  const markPriceValue = markPrice ? (markPrice.p ? Number(markPrice.p) : null) : null;

  return (
    <div className="text-white h-full w-full ">
      {/* Title */}
      <h1 className="text-4xl font-extrabold bg-gradient-to-r from-[#A93EF8] to-[#E75469] text-transparent bg-clip-text mb-6">
        Virtual Trading ({mode.toUpperCase()})
      </h1>

       {/* Mode Toggle (Spot / Futures) */}
       <div className="flex  p-2 items-center gap-2">
              <button
                onClick={() => setMode("spot")}
                className={`px-3 py-1 rounded ${mode === "spot" ? "bg-white/5 font-semibold" : "text-gray-400"}`}
              >
                Spot
              </button>
              <button
                onClick={() => setMode("futures")}
                className={`px-3 py-1 rounded ${mode === "futures" ? "bg-white/5 font-semibold" : "text-gray-400"}`}
              >
                Futures
              </button>
            </div>

      

      <div className="flex  gap-4">
       
        <div className="w-3/4 flex flex-col gap-4">
          
          <div className="bg-[#0F0A25]/80 backdrop-blur-md border border-[#4733A6] p-4 rounded-lg flex items-center gap-6">
           

            {/* Pair Selector */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(v => !v)}
                className="text-2xl font-bold px-3 py-1 rounded hover:bg-white/5 uppercase"
                title="Select Pair"
              >
                {selected.symbol}
                <span className="ml-2 text-base opacity-70">▼</span>
              </button>

              {showDropdown && (
                <div className="absolute mt-2 w-72 max-h-80 overflow-y-auto bg-[#23272E] border border-gray-700 rounded shadow-xl z-50">

                  <div className="p-2 sticky top-0 bg-[#23272E]">
                    <input
                      autoFocus
                      value={search}
                      onChange={(e)=>setSearch(e.target.value)}
                      placeholder="Search (e.g. btc, eth, btcusdt)"
                      className="w-full bg-[#1b1f24] text-white text-sm px-3 py-2 rounded outline-none"
                    />
                  </div>
                  <ul className="divide-y divide-white/5">
                    {filteredSymbols.map(s => (
                      <li
                        key={s.symbol}
                        onClick={() => {
                          setSelected(s);
                          setShowDropdown(false);
                          setSearch("");
                        }}
                        className="px-3 py-2 hover:bg-[#3A3E45] cursor-pointer flex items-center justify-between uppercase"
                      >
                        <span className="font-semibold">{s.baseAsset}</span>
                        <span className="text-xs text-gray-300">{s.symbol}</span>
                      </li>
                    ))}
                    {filteredSymbols.length === 0 && (
                      <li className="px-3 py-4 text-sm text-gray-400">No results</li>
                    )}
                  </ul>
                </div>
              )}
            </div>

         
            <div className="h-10 border-l border-[#4733A6]" />

            {/* Live Market Stats */}
            <div className="flex items-start gap-8 text-sm flex-wrap">
              <div>
                <div className="text-[#A489F5] text-xs">Last Price</div>
                <div className={`font-semibold text-lg ${ticker && parseFloat(ticker.P) < 0 ? "text-red-400" : "text-green-400"}`}>
                  {fmt(ticker?.c, 2)} {selected.quoteAsset}
                </div>
              </div>

              <div>
                <div className="text-[#A489F5] text-xs">24h Change</div>
                <div className={`font-semibold ${ticker && parseFloat(ticker.P) < 0 ? "text-red-400" : "text-white"}`}>
                  {fmt(ticker?.p, 2)} ({fmt(ticker?.P, 2)}%)
                </div>
              </div>

              <div>
                <div className="text-[#A489F5] text-xs">24h High</div>
                <div className="font-semibold">{fmt(ticker?.h, 2)}</div>
              </div>

              <div>
                <div className="text-[#A489F5] text-xs">24h Low</div>
                <div className="font-semibold">{fmt(ticker?.l, 2)}</div>
              </div>

              <div>
                <div className="text-[#A489F5] text-xs">24h Volume ({selected.baseAsset})</div>
                <div className="font-semibold">{fmt(ticker?.v, 2)}</div>
              </div>

              <div>
                <div className="text-[#A489F5] text-xs">24h Volume ({selected.quoteAsset})</div>
                <div className="font-semibold">{fmt(ticker?.q, 2)}</div>
              </div>

              {/* Futures-only: Mark Price + Index Price (if available) */}
              {/* {mode === "futures" && (
                <div>
                  <div className="text-[#A489F5] text-xs">Mark Price</div>
                  <div className="font-semibold">{markPriceValue ? fmt(markPriceValue, 2) : "--"} {selected.quoteAsset}</div>
                </div>
              )} */}
            </div>
          </div>

          {/* ===== Middle Row: Order Book (left) + Chart (right) ===== */}
          <div className="flex gap-4 h-full">
            {/* Order Book */}
            <div className="w-1/3 -z-10 h-full bg-[#0f0f12]/80 backdrop-blur-md border border-white/10 p-4 rounded-lg shadow-lg overflow-visible">
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
                {orderBook.asks.slice(0, 12).map(([p,q], i) => {
                  const price  = parseFloat(p);
                  const amount = parseFloat(q);
                  const total  = price * amount;
                  const perc   = Math.min((total / maxTotal) * 100, 100);
                  return (
                    <div key={`ask-${i}`} className="relative text-sm font-mono">
                      <div className="absolute inset-0 bg-red-500/10 rounded" style={{ width: `${perc}%` }} />
                      <div className="relative grid grid-cols-3 text-red-400 z-10">
                        <span>{fmt(price, 2)}</span>
                        <span className="text-right">{fmt(amount, 4)}</span>
                        <span className="text-right">{fmt(total, 2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mid price */}
              <div className="text-center my-2">
                <span className={`text-lg font-bold ${ticker && parseFloat(ticker.P) < 0 ? "text-red-400" : "text-green-400"}`}>
                  {fmt(ticker?.c, 2)} {selected.quoteAsset}
                </span>
              </div>

              {/* Bids */}
              <div className="space-y-1">
                {orderBook.bids.slice(0, 12).map(([p,q], i) => {
                  const price  = parseFloat(p);
                  const amount = parseFloat(q);
                  const total  = price * amount;
                  const perc   = Math.min((total / maxTotal) * 100, 100);
                  return (
                    <div key={`bid-${i}`} className="relative text-sm font-mono">
                      <div className="absolute inset-0 bg-green-500/10 rounded" style={{ width: `${perc}%` }} />
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

            {/* Chart + Recent Trades (stacked) */}
            <div className="w-2/3 flex flex-col gap-4">
              {/* Chart */}
              <div className="flex-1 bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-2">Trading Chart</h2>
                <iframe
                  src={`https://www.tradingview.com/widgetembed/?symbol=BINANCE:${selected.symbol.toUpperCase()}&interval=1&theme=dark&hidetoptoolbar=1&saveimage=0&toolbarbg=`}
                  className="w-full h-[420px] rounded-md"
                  frameBorder="0"
                  allowTransparency
                  scrolling="no"
                  title="TradingView Chart"
                />
              </div>

          
            </div>
          </div>
        </div>

      
        <div className="w-1/4 flex flex-col space-y-4">
          <div className="bg-[#15162C] p-4 rounded-xl border border-white/10">
          
            <div className="flex space-x-4 text-sm mb-4">
            
              {mode === "spot" ? (
                <>
                  <button className="text-white font-semibold border-b-2 border-purple-500 pb-1">Spot</button>
                  <button className="text-gray-400 hover:text-white">Margin</button>
                  <button className="text-gray-400 hover:text-white">Grid</button>
                </>
              ) : (
                <>
                  <button className="text-white font-semibold border-b-2 border-purple-500 pb-1">Futures</button>
                  <button className="text-gray-400 hover:text-white">Orders</button>
                  <button className="text-gray-400 hover:text-white">Positions</button>
                </>
              )}
            </div>

            {/* Inner Tabs: Order type */}
            <div className="flex space-x-4 text-sm mb-4">
              <button className="text-purple-400 font-semibold">Limit</button>
              <button className="text-gray-400 hover:text-white">Market</button>
              <button className="text-gray-400 hover:text-white">Stop Limit</button>
            </div>

            {/* If futures: show leverage/margin controls + position info */}
            {mode === "futures" ? (
              <>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div>Margin Type</div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setMarginType("CROSS")} className={`px-2 py-1 rounded ${marginType === "CROSS" ? "bg-white/5" : "text-gray-400"}`}>Cross</button>
                      <button onClick={() => setMarginType("ISOLATED")} className={`px-2 py-1 rounded ${marginType === "ISOLATED" ? "bg-white/5" : "text-gray-400"}`}>Isolated</button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div>Leverage</div>
                    <div className="flex items-center gap-2">
                      <input type="number" min="1" max="125" value={leverage} onChange={(e)=>setLeverage(Number(e.target.value))} className="w-16 bg-[#1E1F36] p-1 rounded text-right text-white" />
                      <div className="text-xs text-gray-400">x</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div>Available (USDT)</div>
                    <div className="text-white font-semibold">9,500.05</div>
                  </div>
                </div>

                <hr className="border-white/5 mb-3" />

                {/* Position input */}
                <div className="space-y-3 mb-6">
                  <div className="text-xs text-gray-400">Price</div>
                  <div className="bg-[#1E1F36] rounded p-2 text-sm flex justify-between items-center">
                    <span className="text-gray-400">Mark</span>
                    <span className="text-white">{markPriceValue ? fmt(markPriceValue, 2) : fmt(ticker?.c,2)}</span>
                    <span className="text-gray-400">{selected.quoteAsset}</span>
                  </div>

                  <div className="text-xs text-gray-400">Position Size</div>
                  <div className="bg-[#1E1F36] rounded p-2 text-sm flex justify-between items-center">
                    <input value={positionSize} onChange={(e)=>setPositionSize(Number(e.target.value))} type="number" className="bg-transparent text-right w-24 focus:outline-none text-white" />
                    <span className="text-gray-400">{selected.baseAsset}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div>Reduce Only</div>
                    <input type="checkbox" checked={reduceOnly} onChange={(e)=>setReduceOnly(e.target.checked)} />
                  </div>

                  <input type="range" min="0" max="100" step="25" className="w-full accent-green-500" />

                  <div className="bg-[#1E1F36] rounded p-2 text-sm flex justify-between items-center">
                    <div>
                      <div className="text-xs text-gray-400">Unrealized PnL</div>
                      <div className="text-white font-semibold">0.00 USDT</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Liquidation Price</div>
                      <div className="text-white font-semibold">--</div>
                    </div>
                  </div>

                  <button className="w-full bg-green-500 hover:bg-green-600 py-2 rounded-lg font-semibold">
                    Long {selected.baseAsset}
                  </button>
                </div>

                {/* Close / Short */}
                <div className="space-y-3">
                  <button className="w-full bg-red-500 hover:bg-red-600 py-2 rounded-lg font-semibold">
                    Short {selected.baseAsset}
                  </button>
                </div>
              </>
            ) : (
             
              <>
                <div className="space-y-3 mb-6">
                  <div className="text-xs text-gray-400">Avbl <span className="ml-1">9,500.0564107 {selected.quoteAsset}</span></div>
                  <div className="bg-[#1E1F36] rounded p-2 text-sm flex justify-between items-center">
                    <span className="text-gray-400">Price</span>
                    <span className="text-white">{fmt(ticker?.c, 2)}</span>
                    <span className="text-gray-400">{selected.quoteAsset}</span>
                  </div>
                  <div className="bg-[#1E1F36] rounded p-2 text-sm flex justify-between items-center">
                    <span className="text-gray-400">Amount</span>
                    <input type="number" className="bg-transparent text-right w-24 focus:outline-none text-white" />
                    <span className="text-gray-400">{selected.baseAsset}</span>
                  </div>
                  <input type="range" min="0" max="100" step="25" className="w-full accent-green-500" />
                  <div className="bg-[#1E1F36] rounded p-2 text-sm flex justify-between items-center">
                    <span className="text-gray-400">Total</span>
                    <span className="text-gray-400">Minimum 5 {selected.quoteAsset}</span>
                  </div>
                  <div className="text-xs text-gray-400">Available: <span>0.000000 {selected.baseAsset}</span></div>
                  <button className="w-full bg-green-500 hover:bg-green-600 py-2 rounded-lg font-semibold">
                    Buy {selected.baseAsset}
                  </button>
                </div>

                {/* Sell */}
                <div className="space-y-3">
                  <div className="text-xs text-gray-400">Avbl <span className="ml-1">0.000000 {selected.baseAsset}</span></div>
                  <div className="bg-[#1E1F36] rounded p-2 text-sm flex justify-between items-center">
                    <span className="text-gray-400">Price</span>
                    <span className="text-white">{fmt(ticker?.c, 2)}</span>
                    <span className="text-gray-400">{selected.quoteAsset}</span>
                  </div>
                  <div className="bg-[#1E1F36] rounded p-2 text-sm flex justify-between items-center">
                    <span className="text-gray-400">Amount</span>
                    <input type="number" className="bg-transparent text-right w-24 focus:outline-none text-white" />
                    <span className="text-gray-400">{selected.baseAsset}</span>
                  </div>
                  <input type="range" min="0" max="100" step="25" className="w-full accent-red-500" />
                  <div className="bg-[#1E1F36] rounded p-2 text-sm flex justify-between items-center">
                    <span className="text-gray-400">Total</span>
                    <span className="text-gray-400">Minimum 5 {selected.quoteAsset}</span>
                  </div>
                  <div className="text-xs text-gray-400">Available: <span>0.000000 {selected.baseAsset}</span></div>
                  <button className="w-full bg-red-500 hover:bg-red-600 py-2 rounded-lg font-semibold">
                    Sell {selected.baseAsset}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trading;
