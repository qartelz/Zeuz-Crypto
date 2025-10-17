import React, { useEffect, useState, useRef } from 'react';

const SYMBOL = 'btcusdt';
const BASE_URL = 'https://api.binance.com';
const WS_BASE = 'wss://stream.binance.com:9443/ws';

const OrderBookChart = () => {
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  const [trades, setTrades] = useState([]);
  const [candles, setCandles] = useState([]);
  const [price, setPrice] = useState(null);
  const wsRef = useRef({});

  useEffect(() => {
    // Initial fetch
    fetch(`${BASE_URL}/api/v3/depth?symbol=${SYMBOL.toUpperCase()}&limit=10`)
      .then(res => res.json())
      .then(data => setOrderBook({ bids: data.bids, asks: data.asks }));

    fetch(`${BASE_URL}/api/v3/trades?symbol=${SYMBOL.toUpperCase()}&limit=10`)
      .then(res => res.json())
      .then(data => setTrades(data));

    fetch(`${BASE_URL}/api/v3/klines?symbol=${SYMBOL.toUpperCase()}&interval=1m&limit=10`)
      .then(res => res.json())
      .then(data => setCandles(data));

    // WebSocket connections
    const depthWS = new WebSocket(`${WS_BASE}/${SYMBOL}@depth`);
    const tradeWS = new WebSocket(`${WS_BASE}/${SYMBOL}@trade`);
    const klineWS = new WebSocket(`${WS_BASE}/${SYMBOL}@kline_1m`);
    const tickerWS = new WebSocket(`${WS_BASE}/${SYMBOL}@bookTicker`);

    depthWS.onmessage = e => {
      const data = JSON.parse(e.data);
      setOrderBook(prev => ({
        bids: data.b?.slice(0, 10) || prev.bids,
        asks: data.a?.slice(0, 10) || prev.asks,
      }));
    };

    tradeWS.onmessage = e => {
      const trade = JSON.parse(e.data);
      setTrades(prev => [
        {
          price: trade.p,
          qty: trade.q,
          time: trade.T,
          isBuyerMaker: trade.m, // important for color/type
        },
        ...prev.slice(0, 9),
      ]);
    };

    klineWS.onmessage = e => {
      const candle = JSON.parse(e.data);
      setCandles(prev => [
        [
          candle.k.t,
          candle.k.o,
          candle.k.h,
          candle.k.l,
          candle.k.c,
          candle.k.v,
        ],
        ...prev.slice(0, 9),
      ]);
    };

    tickerWS.onmessage = e => {
      const ticker = JSON.parse(e.data);
      setPrice(ticker.a);
    };

    wsRef.current = { depthWS, tradeWS, klineWS, tickerWS };

    return () => {
      Object.values(wsRef.current).forEach(ws => ws.close());
    };
  }, []);

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen font-mono">
      <h2 className="text-2xl font-bold mb-4">Live BTC/USDT Market Data</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Order Book */}
        <div className="bg-gray-800 p-4 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold mb-2">Order Book</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="text-green-400 font-semibold mb-1">Bids</h4>
              <ul className="space-y-1">
                {orderBook.bids.map(([price, qty], idx) => (
                  <li key={idx} className="flex justify-between">
                    <span>{parseFloat(price).toFixed(2)}</span>
                    <span>{parseFloat(qty).toFixed(4)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-red-400 font-semibold mb-1">Asks</h4>
              <ul className="space-y-1">
                {orderBook.asks.map(([price, qty], idx) => (
                  <li key={idx} className="flex justify-between">
                    <span>{parseFloat(price).toFixed(2)}</span>
                    <span>{parseFloat(qty).toFixed(4)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Recent Trades */}
        <div className="bg-gray-800 p-4 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold mb-2">Recent Trades</h3>
          <div className="grid grid-cols-4 text-sm font-semibold text-gray-400 border-b border-gray-700 pb-1 mb-1">
            <span>Price</span>
            <span>Qty</span>
            <span>Time</span>
            <span>Type</span>
          </div>
          <ul className="space-y-1 text-sm">
            {trades.map((trade, idx) => {
              const isSell = trade.isBuyerMaker;
              return (
                <li key={idx} className="grid grid-cols-4">
                  <span className={isSell ? 'text-red-400' : 'text-green-400'}>
                    {parseFloat(trade.price).toFixed(2)}
                  </span>
                  <span>{parseFloat(trade.qty).toFixed(4)}</span>
                  <span className="text-gray-400">
                    {new Date(trade.time).toLocaleTimeString()}
                  </span>
                  <span className={isSell ? 'text-red-400' : 'text-green-400'}>
                    {isSell ? 'Sell' : 'Buy'}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Candlestick Data */}
        <div className="bg-gray-800 p-4 rounded-xl shadow-md col-span-1 md:col-span-2">
          <h3 className="text-lg font-semibold mb-2">Candlestick Data (1m)</h3>
          <table className="w-full text-sm">
            <thead className="text-gray-400 border-b border-gray-700">
              <tr>
                <th className="text-left py-1">Open</th>
                <th className="text-left py-1">High</th>
                <th className="text-left py-1">Low</th>
                <th className="text-left py-1">Close</th>
              </tr>
            </thead>
            <tbody>
              {candles.map((c, idx) => (
                <tr key={idx} className="border-b border-gray-800">
                  <td className="py-1">{c[1]}</td>
                  <td className="py-1">{c[2]}</td>
                  <td className="py-1">{c[3]}</td>
                  <td className="py-1">{c[4]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Live Price */}
        <div className="col-span-1 md:col-span-2 text-center text-xl font-bold mt-4">
          <p className="text-yellow-400">Live Price: ${parseFloat(price).toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

export default OrderBookChart;
