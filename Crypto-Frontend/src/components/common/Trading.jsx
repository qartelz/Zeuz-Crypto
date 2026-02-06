import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  CheckCircle,
  XCircle,
  Wallet,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { WalletContext } from "../../contexts/WalletContext";
import toast from "react-hot-toast";
import orderBookSvg from "../../assets/svg/order-book.svg";
const tokens = JSON.parse(localStorage.getItem("authTokens"));

// Mock Dialog component
const Dialog = ({ open, onClose, children, className }) => {
  if (!open) return null;
  return (
    <div className={className} onClick={onClose}>
      {children}
    </div>
  );
};

Dialog.Panel = ({ children, className }) => (
  <div className={className} onClick={(e) => e.stopPropagation()}>
    {children}
  </div>
);

// REST/WS bases for Spot and USDT-M Futures (Binance)
const SPOT_REST = "https://api.binance.com";
const SPOT_WS = "wss://stream.binance.com:9443/ws";
const FUT_REST = "https://fapi.binance.com";
const FUT_WS = "wss://fstream.binance.com/ws";
import throttle from "lodash/throttle";
import OptionsChain from "../OptionChain";
import OptionsChainFinal from "../OptionschainNew";
import axios from "axios";
const Trading = ({
  isChallengeStarted = false,
  selectedChallenge = null,
  walletData,
  walletLoading,
  setIsChallengeStarted,
  refreshChallengeWallet,
}) => {
  const [mode, setMode] = useState("spot"); // "spot" | "futures"
  const [spotSide, setSpotSide] = useState("buy"); // "buy" | "sell"
  const [isSliderActive, setIsSliderActive] = useState(false);

  // console.log(isChallengeStarted, "the challenge started ");
  // console.log(JSON.stringify(selectedChallenge, null, 2), "the selected challenge");

  // console.log(selectedChallenge,"the selected challenge")

  const { balance, loading, refreshWallet } = useContext(WalletContext);

  const [price, setPrice] = useState(0);
  const [limitPrice, setLimitPrice] = useState(""); // Limit Price State
  const [total, setTotal] = useState(0);

  const [value, setValue] = useState(50);

  const [tradeType, setTradeType] = useState("Trade");
  const [holdingType, setHoldingType] = useState("Intraday"); // Intraday or Longterm

  const [selectedOrderType, setSelectedOrderType] = useState("Market");

  const orderTypes = ["Market", "Limit"];
  const [amount, setAmount] = useState("");

  // console.log(amount,"theeee amount")
  const [spotBalance, setSpotBalance] = useState(0);
  // console.log(spotBalance,"the spot balance")

  const [isFocused, setIsFocused] = useState(false);

  const showFloatingLabel = isFocused || amount !== "";

  // ---------- Symbol selection ----------
  const [symbols, setSymbols] = useState([]);

  // console.log(symbols, "the symbols");
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState({
    symbol: "btcusdt",
    baseAsset: "BTC",
    quoteAsset: "USDT",
  });

  // useEffect(() => {
  //   if (selectedChallenge?.mission?.allowedPairs?.length > 0) {
  //     // You can pick the first allowed pair or any default logic
  //     setSelected({ symbol: selectedChallenge.mission.allowedPairs });
  //   }
  // }, [selectedChallenge]);

  const showToast = (message, type = "success") => {
    console.log(`${type}: ${message}`);
  };

  const [sliderValue, setSliderValue] = useState(0);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useEffect(() => {
    if (sliderValue > 0 && price > 0) {
      if (spotSide === "buy") {
        const usableBalance = selectedChallenge
          ? Number(walletData?.available_balance ?? 0)
          : Number(balance ?? 0);

        const maxBuyableAmount = usableBalance / price;
        const calculatedAmount = (maxBuyableAmount * sliderValue) / 100;
        setAmount(calculatedAmount.toFixed(8));
      } else if (spotSide === "sell") {
        // For sell, use the holding balance (spotBalance)
        const calculatedAmount = (Number(spotBalance) * sliderValue) / 100;
        setAmount(calculatedAmount.toFixed(8));
      }
    }
  }, [price, balance, sliderValue, spotSide, spotBalance, selectedChallenge, walletData]);

  useEffect(() => {
    setAmount("");
    setSliderValue(0);
  }, [spotSide]);

  useEffect(() => {
    if (selectedChallenge) {
      // Robustly determine trading type
      const tradeType = selectedChallenge.weekData?.trading_type || selectedChallenge.trading_type || selectedChallenge.category;
      const weekNum = selectedChallenge.weekData?.week_number || selectedChallenge.week_number || 1;

      let allowedModes = ["spot"];
      if (tradeType === "SPOT_FUTURES") allowedModes = ["spot", "futures"];
      else if (tradeType === "SPOT_FUTURES_OPTIONS" || tradeType === "PORTFOLIO") allowedModes = ["spot", "futures", "options"];
      else if (tradeType === "SPOT") allowedModes = ["spot"];
      else {
        // Fallback based on week number
        if (weekNum === 1) allowedModes = ["spot"];
        else if (weekNum === 2) allowedModes = ["spot", "futures"];
        else allowedModes = ["spot", "futures", "options"];
      }

      setMode(prev => {
        // If current mode is allowed, keep it. specific check for lowercase
        const current = prev.toLowerCase();
        if (allowedModes.includes(current)) return current;
        return allowedModes[0];
      });
    }
  }, [selectedChallenge, setMode]);

  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const tokens = JSON.parse(localStorage.getItem("authTokens"));

  const [futuresWS, setFuturesWS] = useState(null);
  const [futuresTicker, setFuturesTicker] = useState(null);

  // console.log(futuresTicker, "the futures ticker data");

  const [spotTicker, setSpotTicker] = useState(null);
  const [futuresPriceTicker, setFuturesPriceTicker] = useState(null);

  const tickerData = mode === "spot" ? spotTicker : futuresPriceTicker;
  // console.log(futuresTicker, "the futures ticker");
  const [futuresPrice, setFuturesPrice] = useState(0);
  const [futuresAmount, setFuturesAmount] = useState("");
  // const quantityNum = Number(futuresAmount);
  const [futuresTotal, setFuturesTotal] = useState(0);
  const [futuresSliderValue, setFuturesSliderValue] = useState(0);
  const [futuresSide, setFuturesSide] = useState("buy"); // "buy" | "sell"
  // const [isPlacingFuturesOrder, setIsPlacingFuturesOrder] = useState(false);
  const [isPlacingBuyOrder, setIsPlacingBuyOrder] = useState(false);
  const [isPlacingSellOrder, setIsPlacingSellOrder] = useState(false);

  const buyPrice = futuresTicker?.quotes?.best_ask
    ? parseFloat(futuresTicker.quotes.best_ask)
    : futuresPrice;

  const sellPrice = futuresTicker?.quotes?.best_bid
    ? parseFloat(futuresTicker.quotes.best_bid)
    : futuresPrice;

  // Calculate position value and margin required
  // const quantityNum = parseFloat(futuresAmount) || 0;

  //   const quantityNum = parseFloat(futuresAmount) || 0;

  const contractValue = futuresTicker?.contract_value
    ? parseFloat(futuresTicker.contract_value)
    : 0.001;

  //   const [leverage, setLeverage] = useState(20);

  // // Use execution price based on side
  // const executionPrice = futuresSide === "buy" ? buyPrice : sellPrice;
  // const positionValue = quantityNum * executionPrice ;
  // const marginRequired = positionValue / leverage * contractValue;

  const quantityNum = parseFloat(futuresAmount) || 0; // BTC amount you want to buy
  const [leverage, setLeverage] = useState(1);

  // Use execution price based on side
  const executionPrice = futuresSide === "buy" ? buyPrice : sellPrice;

  // Total position value in USDT
  const positionValue = quantityNum * executionPrice;

  // Margin required based on leverage
  const marginRequired = positionValue / leverage;

  useEffect(() => {
    if (mode !== "spot" || !selected?.symbol) return;

    const ws = new WebSocket(
      `wss://stream.binance.com:9443/ws/${selected.symbol.toLowerCase()}@ticker`
    );

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setSpotTicker({
        c: data.c, // last price
        h: data.h, // high
        l: data.l, // low
        v: data.v, // base volume
        q: data.q, // quote volume
        p: parseFloat(data.c) - parseFloat(data.o), // 24h change
        P: parseFloat(data.P), // 24h % change
      });
    };

    return () => ws.close();
  }, [mode, selected]);

  // WebSocket connection for Futures (add this useEffect)
  useEffect(() => {
    if (mode !== "futures") return;

    const ws = new WebSocket("wss://socket.delta.exchange");

    ws.onopen = () => {
      const payload = {
        type: "subscribe",
        payload: {
          channels: [
            {
              name: "v2/ticker",
              symbols: [selected.symbol.toUpperCase()],
            },
          ],
        },
      };
      ws.send(JSON.stringify(payload));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "v2/ticker") {
        setFuturesTicker(data);

        setFuturesPrice(data.close);

        setFuturesPriceTicker({
          c: parseFloat(data.spot_price), // last price
          h: parseFloat(data.high), // 24h high
          l: parseFloat(data.low), // 24h low
          v: parseFloat(data.volume), // base volume
          q: parseFloat(data.turnover), // quote volume
          p: parseFloat(data.ltp_change_24h), // 24h change %
          P: parseFloat(data.mark_change_24h), // 24h mark change %
          markPrice: parseFloat(data.mark_price), // optional: mark price
          fundingRate: parseFloat(data.funding_rate), // optional
          open: parseFloat(data.open), // 24h open
        });
      }
    };

    ws.onerror = (error) => {
      console.error("Futures WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("Futures WebSocket closed");
    };

    setFuturesWS(ws);

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [mode, selected.symbol]);

  // const handleFuturesSliderChange = (percentage) => {
  //   setFuturesSliderValue(percentage);

  //   if (futuresPrice > 0 && balance > 0) {
  //     // Max position value you can open with your balance
  //     const maxPositionValue = balance * leverage;

  //     // Calculate contracts: maxPositionValue = contracts × price × contractValue
  //     const maxContracts = maxPositionValue / (futuresPrice * contractValue);

  //     // Apply percentage
  //     const calculatedAmount = (maxContracts * percentage) / 100;
  //     setFuturesAmount(calculatedAmount.toFixed(3));
  //   }
  // };

  // const handleFuturesSliderChange = (percentage) => {
  //   setFuturesSliderValue(percentage);

  //   if (futuresPrice > 0 && balance > 0) {
  //     // Use execution price based on current side
  //     const executionPrice = futuresSide === "buy" ? buyPrice : sellPrice;

  //     // Max position value you can open with your balance
  //     const maxPositionValue = balance * leverage;

  //     // Calculate contracts: maxPositionValue = contracts × price × contractValue
  //     const maxContracts = maxPositionValue / (executionPrice * contractValue);

  //     // Apply percentage
  //     const calculatedAmount = (maxContracts * percentage) / 100;
  //     setFuturesAmount(calculatedAmount.toFixed(3));
  //   }
  // };

  const handleFuturesSliderChange = (percentage) => {
    setFuturesSliderValue(percentage);

    if (executionPrice > 0 && balance > 0) {
      // Max BTC you can buy with your balance and leverage
      const maxBTC = (balance * leverage) / executionPrice;

      // Apply slider percentage
      const btcAmount = (maxBTC * percentage) / 100;

      setFuturesAmount(btcAmount.toFixed(6)); // 6 decimals for BTC
    }
  };

  // const positionValue = quantityNum * futuresPrice * contractValue;

  // const marginRequired = positionValue / leverage;

  // Calculate futures total when amount or price changes
  // useEffect(() => {
  //   if (futuresAmount && futuresPrice) {
  //     setFuturesTotal(
  //       parseFloat(futuresAmount) *
  //         parseFloat(futuresPrice) *
  //         parseFloat(contractValue)
  //     );
  //   } else {
  //     setFuturesTotal(0);
  //   }
  // }, [futuresAmount, futuresPrice]);

  // Calculate futures total when amount or price changes
  useEffect(() => {
    if (futuresAmount && futuresPrice) {
      const executionPrice = futuresSide === "buy" ? buyPrice : sellPrice;
      setFuturesTotal(
        parseFloat(futuresAmount) * executionPrice * parseFloat(contractValue)
      );
    } else {
      setFuturesTotal(0);
    }
  }, [
    futuresAmount,
    futuresPrice,
    futuresSide,
    buyPrice,
    sellPrice,
    contractValue,
  ]);

  // Reset futures amount when side changes
  useEffect(() => {
    setFuturesAmount("");
    setFuturesSliderValue(0);
  }, [futuresSide]);

  const handleOrder = async () => {
    try {
      setIsPlacingOrder(true);

      if (!tokens?.access) {
        toast.custom(
          (t) => (
            <div
              className={`${t.visible ? "animate-enter" : "animate-leave"
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

      // Handle SELL logic
      if (spotSide === "sell") {


        if (selectedChallenge) {
          const endpoint = `${baseURL}challenges/trades/`;

          const payload = {
            participation_id: selectedChallenge.participationId,
            asset_symbol: selected.baseAsset,
            asset_name: selected.baseAsset,
            trade_type: mode === "spot" ? "SPOT" : "FUTURES",
            direction: spotSide.toUpperCase(), // SELL
            total_quantity: parseFloat(amount),
            entry_price: parseFloat(price.toFixed(2)),
            holding_type:
              mode === "spot" ? "LONGTERM" : holdingType.toUpperCase(),
            order_type: selectedOrderType.toUpperCase(),
            limit_price: selectedOrderType === "Limit" ? parseFloat(limitPrice) : null,
          };

          console.log("📉 CHALLENGE SELL PAYLOAD:", JSON.stringify(payload, null, 2));

          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${tokens.access}`,
            },
            body: JSON.stringify(payload),
          });

          const data = await response.json();
          console.log("📉 CHALLENGE SELL RESPONSE:", data);

          if (response.ok) {
            toast.custom(
              (t) => (
                <div
                  className={`${t.visible ? "animate-enter" : "animate-leave"
                    } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}
                >
                  <div className="flex-1 w-0 p-4 flex items-center">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {data.direction || "SELL"} Order Successful: {data.total_quantity} {data.asset_symbol} @ {data.average_entry_price || data.entry_price}
                    </p>
                  </div>
                </div>
              ),
              { position: "top-right", duration: 4000 }
            );

            await refreshWallet();
            if (refreshChallengeWallet) {
              await refreshChallengeWallet(selectedChallenge.participationId);
            }
            fetchSpotBalance();
            setAmount("");
            setSliderValue(0);
          } else {
            toast.custom(
              (t) => (
                <div
                  className={`${t.visible ? "animate-enter" : "animate-leave"
                    } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}
                >
                  <div className="flex-1 w-0 p-4 flex items-center">
                    <XCircle className="h-6 w-6 text-red-500 mr-2" />
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {data.error || data.detail || data.message || "Something went wrong"}
                    </p>
                  </div>
                </div>
              ),
              { position: "top-right", duration: 2500 }
            );
          }

          return; // ⛔ stop normal SELL flow
        }
        if (!tradeId) {
          toast.custom(
            (t) => (
              <div
                className={`${t.visible ? "animate-enter" : "animate-leave"
                  } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}
              >
                <div className="flex-1 w-0 p-4 flex items-center">
                  <XCircle className="h-6 w-6 text-red-500 mr-2" />
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    No open trade found to sell
                  </p>
                </div>
              </div>
            ),
            { position: "top-right", duration: 2500 }
          );
          return;
        }

        const sellAmount = parseFloat(amount);
        const isFull = sellAmount >= spotBalance;

        let response;

        if (isFull) {
          // Full close: 100% quantity
          response = await fetch(`${baseURL}trading/close-trade/${tradeId}/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${tokens.access}`,
            },
          });
        } else {
          // Partial close
          const payload = {
            quantity: sellAmount.toString(),
            price: price.toFixed(2),
          };

          response = await fetch(
            `${baseURL}trading/partial-close/${tradeId}/`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${tokens.access}`,
              },
              body: JSON.stringify(payload),
            }
          );
        }

        const data = await response.json();

        if (response.ok) {
          toast.custom(
            (t) => (
              <div
                className={`${t.visible ? "animate-enter" : "animate-leave"
                  } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}
              >
                <div className="flex-1 w-0 p-4 flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {isFull
                      ? "Trade closed successfully!"
                      : `Sold ${sellAmount} ${selected.baseAsset
                      } @ ${price.toFixed(2)}`}
                  </p>
                </div>
              </div>
            ),
            { position: "top-right", duration: 2500 }
          );

          await refreshWallet();
          if (selectedChallenge && refreshChallengeWallet) {
            await refreshChallengeWallet(selectedChallenge.participationId);
          }
          fetchSpotBalance();
          setAmount("");
          setSliderValue(0);
        } else {
          toast.custom(
            (t) => (
              <div
                className={`${t.visible ? "animate-enter" : "animate-leave"
                  } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}
              >
                <div className="flex-1 w-0 p-4 flex items-center">
                  <XCircle className="h-6 w-6 text-red-500 mr-2" />
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    ❌ Error:{" "}
                    {data.error || data.detail || data.message || "Something went wrong"}
                  </p>
                </div>
              </div>
            ),
            { position: "top-right", duration: 2500 }
          );
        }
      }

      else {
        // Handle BUY logic
        let payload;
        let endpoint;

        if (selectedChallenge) {
          // 🔹 Challenge Mode
          endpoint = `${baseURL}challenges/trades/`;
          payload = {
            participation_id: selectedChallenge.participationId,
            asset_symbol: selected.baseAsset,
            asset_name: selected.baseAsset,
            trade_type: mode === "spot" ? "SPOT" : "FUTURES",
            direction: spotSide.toUpperCase(),
            total_quantity: parseFloat(amount),
            entry_price: parseFloat(price.toFixed(2)),
            holding_type:
              mode === "spot" ? "LONGTERM" : holdingType.toUpperCase(),
            order_type: selectedOrderType.toUpperCase(),
            limit_price: selectedOrderType === "Limit" ? parseFloat(limitPrice) : null,
          };
        } else {
          // 🔹 Normal Mode
          endpoint = `${baseURL}trading/place-order/`;
          payload = {
            asset_symbol: selected.baseAsset,
            asset_name: selected.baseAsset,
            asset_exchange: selected.exchange || "BINANCE",
            trade_type: mode === "spot" ? "SPOT" : "FUTURES",
            direction: spotSide.toUpperCase(),
            holding_type:
              mode === "spot" ? "LONGTERM" : holdingType.toUpperCase(),
            quantity: amount,
            price: price.toFixed(2),
            order_type: selectedOrderType.toUpperCase(),
            limit_price: selectedOrderType === "Limit" ? parseFloat(limitPrice) : null,
          };
        }

        console.log("🚀 ORDER PAYLOAD:", JSON.stringify(payload, null, 2));

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens.access}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        console.log("🚀 ORDER RESPONSE DATA:", data);
        if (!response.ok) {
          console.error("❌ ORDER FAILED STATUS:", response.status);
          console.error("❌ ORDER FAILED DETAILS:", data);
        }

        if (response.ok) {
          toast.custom(
            (t) => (
              <div
                className={`${t.visible ? "animate-enter" : "animate-leave"
                  } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}
              >
                <div className="flex-1 w-0 p-4 flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Order Placed: {data.direction || spotSide.toUpperCase()} {data.total_quantity || data.quantity || amount} {data.asset_symbol} @ {data.average_entry_price || data.price || price.toFixed(2)}
                  </p>
                </div>
              </div>
            ),
            { position: "top-right", duration: 4000 }
          );

          await refreshWallet();
          if (selectedChallenge && refreshChallengeWallet) {
            await refreshChallengeWallet(selectedChallenge.participationId);
          }
          fetchSpotBalance();
          setAmount("");
          setSliderValue(0);
        } else {
          toast.custom(
            (t) => (
              <div
                className={`${t.visible ? "animate-enter" : "animate-leave"
                  } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}
              >
                <div className="flex-1 w-0 p-4 flex items-center">
                  <XCircle className="h-6 w-6 text-red-500 mr-2" />
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {data.error || "Something went wrong"}
                  </p>
                </div>
              </div>
            ),
            { position: "top-right", duration: 2500 }
          );
        }
      }
    } catch (error) {
      console.error(error);
      toast.custom(
        (t) => (
          <div
            className={`${t.visible ? "animate-enter" : "animate-leave"
              } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}
          >
            <div className="flex-1 w-0 p-4 flex items-center">
              <XCircle className="h-6 w-6 text-red-500 mr-2" />
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                ⚠️ Failed to place order
              </p>
            </div>
          </div>
        ),
        { position: "top-right", duration: 2500 }
      );
    } finally {
      setIsPlacingOrder(false); // Always reset loading
    }
  };



  const [futuresTradeId, setFuturesTradeId] = useState(null);
  const [futuresPositionSize, setFuturesPositionSize] = useState(0);

  const fetchFuturesPosition = async () => {
    try {
      const response = await fetch(
        `${baseURL}trading/trade/open/?asset_symbol=${selected.symbol.toUpperCase()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens?.access}`,
          },
        }
      );

      const data = await response.json();
      console.log(data, "the fetchFuturesPosition data");

      if (data.is_open && data.trade && data.trade.trade_type === "FUTURES") {
        setFuturesPositionSize(parseFloat(data.trade.total_quantity));
        setFuturesTradeId(data.trade.id);
      } else {
        setFuturesPositionSize(0);
        setFuturesTradeId(null);
      }
    } catch (error) {
      console.error("Error fetching futures position:", error);
      setFuturesPositionSize(0);
      setFuturesTradeId(null);
    }
  };
  useEffect(() => {
    if (mode === "futures") {
      fetchFuturesPosition();
    }
  }, [selected, mode]);

  // const handleFuturesOrder = async (side) => {
  //   try {
  //     // Set appropriate loading state
  //     if (side === "buy") {
  //       setIsPlacingBuyOrder(true);
  //     } else {
  //       setIsPlacingSellOrder(true);
  //     }

  //     if (!tokens?.access) {
  //       toast.custom(
  //         (t) => (
  //           <div
  //             className={`${
  //               t.visible ? "animate-enter" : "animate-leave"
  //             } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}
  //           >
  //             <div className="flex-1 w-0 p-4 flex items-center">
  //               <XCircle className="h-6 w-6 text-red-500 mr-2" />
  //               <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
  //                 You must be logged in!
  //               </p>
  //             </div>
  //           </div>
  //         ),
  //         { position: "top-right", duration: 2500 }
  //       );
  //       return;
  //     }

  //     if (side === "sell") {
  //       // SELL/SHORT logic - similar to spot sell (close position)
  //       if (!futuresTradeId) {
  //         toast.custom(
  //           (t) => (
  //             <div
  //               className={`${
  //                 t.visible ? "animate-enter" : "animate-leave"
  //               } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}
  //             >
  //               <div className="flex-1 w-0 p-4 flex items-center">
  //                 <XCircle className="h-6 w-6 text-red-500 mr-2" />
  //                 <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
  //                   No open position found to close
  //                 </p>
  //               </div>
  //             </div>
  //           ),
  //           { position: "top-right", duration: 2500 }
  //         );
  //         return;
  //       }

  //       const sellAmount = parseFloat(futuresAmount);
  //       const isFull = sellAmount >= futuresPositionSize;

  //       let response;

  //       if (isFull) {
  //         // Full close
  //         response = await fetch(
  //           `${baseURL}trading/close-trade/${futuresTradeId}/`,
  //           {
  //             method: "POST",
  //             headers: {
  //               "Content-Type": "application/json",
  //               Authorization: `Bearer ${tokens.access}`,
  //             },
  //           }
  //         );
  //       } else {
  //         // Partial close
  //         const payload = {
  //           quantity: sellAmount.toString(),
  //           price: futuresPrice.toFixed(2),
  //         };

  //         response = await fetch(
  //           `${baseURL}trading/partial-close/${futuresTradeId}/`,
  //           {
  //             method: "POST",
  //             headers: {
  //               "Content-Type": "application/json",
  //               Authorization: `Bearer ${tokens.access}`,
  //             },
  //             body: JSON.stringify(payload),
  //           }
  //         );
  //       }

  //       const data = await response.json();

  //       if (response.ok) {
  //         toast.custom(
  //           (t) => (
  //             <div
  //               className={`${
  //                 t.visible ? "animate-enter" : "animate-leave"
  //               } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}
  //             >
  //               <div className="flex-1 w-0 p-4 flex items-center">
  //                 <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
  //                 <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
  //                   {isFull
  //                     ? "Position closed successfully!"
  //                     : `Closed ${sellAmount} contracts @ ${futuresPrice.toFixed(
  //                         2
  //                       )}`}
  //                 </p>
  //               </div>
  //             </div>
  //           ),
  //           { position: "top-right", duration: 2500 }
  //         );

  //         await refreshWallet();
  //         fetchFuturesPosition();
  //         setFuturesAmount("");
  //         setFuturesSliderValue(0);
  //       } else {
  //         toast.custom(
  //           (t) => (
  //             <div
  //               className={`${
  //                 t.visible ? "animate-enter" : "animate-leave"
  //               } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}
  //             >
  //               <div className="flex-1 w-0 p-4 flex items-center">
  //                 <XCircle className="h-6 w-6 text-red-500 mr-2" />
  //                 <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
  //                   {data.detail || data.message || "Failed to close position"}
  //                 </p>
  //               </div>
  //             </div>
  //           ),
  //           { position: "top-right", duration: 2500 }
  //         );
  //       }
  //     } else {
  //       // BUY/LONG logic - place new order

  //       const expiryDate = new Date();
  //       expiryDate.setDate(expiryDate.getDate() + 30);
  //       const formattedExpiryDate = expiryDate.toISOString().split("T")[0];

  //       const payload = {
  //         asset_symbol: selected.symbol.toUpperCase(),
  //         asset_name: futuresTicker?.description || selected.baseAsset,
  //         asset_exchange: "DELTA",
  //         trade_type: "FUTURES",
  //         direction: "BUY",
  //         holding_type: holdingType.toUpperCase(),
  //         quantity: futuresAmount,
  //         price: futuresPrice.toFixed(2),
  //         order_type: "MARKET",
  //         leverage: leverage.toFixed(2),
  //         contract_size: parseFloat(contractValue || "0.001").toFixed(8),
  //         expiry_date: formattedExpiryDate,
  //       };

  //       console.log("Futures Buy Payload:", payload);

  //       const response = await fetch(`${baseURL}trading/place-order/`, {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: `Bearer ${tokens.access}`,
  //         },
  //         body: JSON.stringify(payload),
  //       });

  //       const data = await response.json();
  //       console.log(data, "the futures buy response");

  //       if (response.ok) {
  //         toast.custom(
  //           (t) => (
  //             <div
  //               className={`${
  //                 t.visible ? "animate-enter" : "animate-leave"
  //               } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}
  //             >
  //               <div className="flex-1 w-0 p-4 flex items-center">
  //                 <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
  //                 <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
  //                   Long position opened: {data.quantity} contracts @{" "}
  //                   {data.price}
  //                 </p>
  //               </div>
  //             </div>
  //           ),
  //           { position: "top-right", duration: 2500 }
  //         );

  //         await refreshWallet();
  //         fetchFuturesPosition();
  //         setFuturesAmount("");
  //         setFuturesSliderValue(0);
  //       } else {
  //         toast.custom(
  //           (t) => (
  //             <div
  //               className={`${
  //                 t.visible ? "animate-enter" : "animate-leave"
  //               } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}
  //             >
  //               <div className="flex-1 w-0 p-4 flex items-center">
  //                 <XCircle className="h-6 w-6 text-red-500 mr-2" />
  //                 <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
  //                   {data.error || data.detail || "Failed to place order"}
  //                 </p>
  //               </div>
  //             </div>
  //           ),
  //           { position: "top-right", duration: 2500 }
  //         );
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Futures order error:", error);
  //     toast.custom(
  //       (t) => (
  //         <div
  //           className={`${
  //             t.visible ? "animate-enter" : "animate-leave"
  //           } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}
  //         >
  //           <div className="flex-1 w-0 p-4 flex items-center">
  //             <XCircle className="h-6 w-6 text-red-500 mr-2" />
  //             <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
  //               Failed to process order
  //             </p>
  //           </div>
  //         </div>
  //       ),
  //       { position: "top-right", duration: 2500 }
  //     );
  //   } finally {
  //     // Reset appropriate loading state
  //     if (side === "buy") {
  //       setIsPlacingBuyOrder(false);
  //     } else {
  //       setIsPlacingSellOrder(false);
  //     }
  //   }
  // };

  // const handleFuturesOrder = async (side) => {
  //   try {
  //     if (side === "buy") {
  //       setIsPlacingBuyOrder(true);
  //     } else {
  //       setIsPlacingSellOrder(true);
  //     }

  //     if (!tokens?.access) {
  //       toast.custom(
  //         (t) => (
  //           <div className={`${t.visible ? "animate-enter" : "animate-leave"} max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}>
  //             <div className="flex-1 w-0 p-4 flex items-center">
  //               <XCircle className="h-6 w-6 text-red-500 mr-2" />
  //               <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
  //                 You must be logged in!
  //               </p>
  //             </div>
  //           </div>
  //         ),
  //         { position: "top-right", duration: 2500 }
  //       );
  //       return;
  //     }

  //     if (side === "sell") {
  //       // SELL/CLOSE POSITION
  //       if (!futuresTradeId) {
  //         toast.custom(
  //           (t) => (
  //             <div className={`${t.visible ? "animate-enter" : "animate-leave"} max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}>
  //               <div className="flex-1 w-0 p-4 flex items-center">
  //                 <XCircle className="h-6 w-6 text-red-500 mr-2" />
  //                 <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
  //                   No open position found to close
  //                 </p>
  //               </div>
  //             </div>
  //           ),
  //           { position: "top-right", duration: 2500 }
  //         );
  //         return;
  //       }

  //       const sellAmount = parseFloat(futuresAmount);
  //       const isFull = sellAmount >= futuresPositionSize;

  //       let response;

  //       if (isFull) {
  //         // Full close
  //         response = await fetch(
  //           `${baseURL}trading/close-trade/${futuresTradeId}/`,
  //           {
  //             method: "POST",
  //             headers: {
  //               "Content-Type": "application/json",
  //               Authorization: `Bearer ${tokens.access}`,
  //             },
  //           }
  //         );
  //       } else {
  //         // Partial close - use SELL price (bid price)
  //         const payload = {
  //           quantity: sellAmount.toString(),
  //           price: sellPrice.toFixed(2), // Use bid price for selling
  //         };

  //         response = await fetch(
  //           `${baseURL}trading/partial-close/${futuresTradeId}/`,
  //           {
  //             method: "POST",
  //             headers: {
  //               "Content-Type": "application/json",
  //               Authorization: `Bearer ${tokens.access}`,
  //             },
  //             body: JSON.stringify(payload),
  //           }
  //         );
  //       }

  //       const data = await response.json();

  //       if (response.ok) {
  //         toast.custom(
  //           (t) => (
  //             <div className={`${t.visible ? "animate-enter" : "animate-leave"} max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}>
  //               <div className="flex-1 w-0 p-4 flex items-center">
  //                 <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
  //                 <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
  //                   {isFull
  //                     ? "Position closed successfully!"
  //                     : `Closed ${sellAmount} contracts @ ${sellPrice.toFixed(2)}`}
  //                 </p>
  //               </div>
  //             </div>
  //           ),
  //           { position: "top-right", duration: 2500 }
  //         );

  //         await refreshWallet();
  //         fetchFuturesPosition();
  //         setFuturesAmount("");
  //         setFuturesSliderValue(0);
  //       } else {
  //         toast.custom(
  //           (t) => (
  //             <div className={`${t.visible ? "animate-enter" : "animate-leave"} max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}>
  //               <div className="flex-1 w-0 p-4 flex items-center">
  //                 <XCircle className="h-6 w-6 text-red-500 mr-2" />
  //                 <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
  //                   {data.detail || data.message || "Failed to close position"}
  //                 </p>
  //               </div>
  //             </div>
  //           ),
  //           { position: "top-right", duration: 2500 }
  //         );
  //       }
  //     } else {
  //       // BUY/OPEN POSITION - use BUY price (ask price)
  //       const expiryDate = new Date();
  //       expiryDate.setDate(expiryDate.getDate() + 30);
  //       const formattedExpiryDate = expiryDate.toISOString().split("T")[0];

  //       const payload = {
  //         asset_symbol: selected.symbol.toUpperCase(),
  //         asset_name: futuresTicker?.description || selected.baseAsset,
  //         asset_exchange: "DELTA",
  //         trade_type: "FUTURES",
  //         direction: "BUY",
  //         holding_type: holdingType.toUpperCase(),
  //         quantity: futuresAmount,
  //         price: buyPrice.toFixed(2), // Use ask price for buying
  //         order_type: "MARKET",
  //         leverage: leverage.toFixed(2),
  //         contract_size: parseFloat(contractValue || "0.001").toFixed(8),
  //         expiry_date: formattedExpiryDate,
  //       };

  //       console.log("Futures Buy Payload:", payload);

  //       const response = await fetch(`${baseURL}trading/place-order/`, {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: `Bearer ${tokens.access}`,
  //         },
  //         body: JSON.stringify(payload),
  //       });

  //       const data = await response.json();
  //       console.log(data, "the futures buy response");

  //       if (response.ok) {
  //         toast.custom(
  //           (t) => (
  //             <div className={`${t.visible ? "animate-enter" : "animate-leave"} max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}>
  //               <div className="flex-1 w-0 p-4 flex items-center">
  //                 <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
  //                 <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
  //                   Long position opened: {data.quantity} contracts @ {data.price}
  //                 </p>
  //               </div>
  //             </div>
  //           ),
  //           { position: "top-right", duration: 2500 }
  //         );

  //         await refreshWallet();
  //         fetchFuturesPosition();
  //         setFuturesAmount("");
  //         setFuturesSliderValue(0);
  //       } else {
  //         toast.custom(
  //           (t) => (
  //             <div className={`${t.visible ? "animate-enter" : "animate-leave"} max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}>
  //               <div className="flex-1 w-0 p-4 flex items-center">
  //                 <XCircle className="h-6 w-6 text-red-500 mr-2" />
  //                 <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
  //                   {data.error || data.detail || "Failed to place order"}
  //                 </p>
  //               </div>
  //             </div>
  //           ),
  //           { position: "top-right", duration: 2500 }
  //         );
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Futures order error:", error);
  //     toast.custom(
  //       (t) => (
  //         <div className={`${t.visible ? "animate-enter" : "animate-leave"} max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}>
  //           <div className="flex-1 w-0 p-4 flex items-center">
  //             <XCircle className="h-6 w-6 text-red-500 mr-2" />
  //             <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
  //               Failed to process order
  //             </p>
  //           </div>
  //         </div>
  //       ),
  //       { position: "top-right", duration: 2500 }
  //     );
  //   } finally {
  //     if (side === "buy") {
  //       setIsPlacingBuyOrder(false);
  //     } else {
  //       setIsPlacingSellOrder(false);
  //     }
  //   }
  // };

  const handleFuturesOrder = async (side) => {
    try {
      if (side === "buy") {
        setIsPlacingBuyOrder(true);
      } else {
        setIsPlacingSellOrder(true);
      }

      if (!tokens?.access) {
        toast.custom(
          (t) => (
            <div
              className={`${t.visible ? "animate-enter" : "animate-leave"
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
      if (side === "sell") {
        // SELL/SHORT logic - can open short position OR close existing long
        if (!futuresTradeId) {
          // No existing position - Open SHORT position
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 30);
          const formattedExpiryDate = expiryDate.toISOString().split("T")[0];

          console.log(expiryDate, "the expiry date");

          let payload;
          let endpoint;

          if (selectedChallenge) {
            // 🔹 Challenge Mode
            endpoint = `${baseURL}challenges/trades/`;
            payload = {
              participation_id: selectedChallenge.participationId,
              asset_symbol: selected.symbol.toUpperCase(),
              asset_name: futuresTicker?.description || selected.baseAsset,
              trade_type: "FUTURES",
              direction: "SELL",
              total_quantity: parseFloat(futuresAmount),
              entry_price: parseFloat(sellPrice.toFixed(2)),
              holding_type: holdingType.toUpperCase(),
              order_type: selectedOrderType.toUpperCase(),
              limit_price: selectedOrderType === "Limit" ? parseFloat(limitPrice) : null,
              margin_mode: marginType,
              leverage: leverage,
              contract_size: parseFloat(contractValue || "0.001").toFixed(8),
              expiry_date: formattedExpiryDate,
              is_hedged: isHedged,
            };
          } else {
            // 🔹 Normal Mode
            endpoint = `${baseURL}trading/place-order/`;
            payload = {
              asset_symbol: selected.symbol.toUpperCase(),
              asset_name: futuresTicker?.description || selected.baseAsset,
              asset_exchange: "DELTA",
              trade_type: "FUTURES",
              direction: "SELL",
              holding_type: holdingType.toUpperCase(),
              quantity: futuresAmount,
              price: sellPrice.toFixed(2),
              order_type: selectedOrderType.toUpperCase(),
              limit_price: selectedOrderType === "Limit" ? parseFloat(limitPrice) : null,
              margin_mode: marginType,
              leverage: leverage,
              contract_size: parseFloat(contractValue || "0.001").toFixed(8),
              expiry_date: formattedExpiryDate,
              is_hedged: isHedged,
            };
          }

          console.log("Futures Short Payload:", payload);

          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${tokens.access}`,
            },
            body: JSON.stringify(payload),
          });

          const data = await response.json();
          console.log(data, "the futures short response");

          if (response.ok) {
            toast.custom(
              (t) => (
                <div
                  className={`${t.visible ? "animate-enter" : "animate-leave"
                    } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}
                >
                  <div className="flex-1 w-0 p-4 flex items-center">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Short position opened: {data.quantity} contracts @{" "}
                      {data.price}
                    </p>
                  </div>
                </div>
              ),
              { position: "top-right", duration: 2500 }
            );

            await refreshWallet();
            if (selectedChallenge && refreshChallengeWallet) {
              await refreshChallengeWallet(selectedChallenge.participationId);
            }

            fetchFuturesPosition();
            setFuturesAmount("");
            setFuturesSliderValue(0);
          } else {
            toast.custom(
              (t) => (
                <div
                  className={`${t.visible ? "animate-enter" : "animate-leave"
                    } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}
                >
                  <div className="flex-1 w-0 p-4 flex items-center">
                    <XCircle className="h-6 w-6 text-red-500 mr-2" />
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {data.error ||
                        data.detail ||
                        "Failed to place short order"}
                    </p>
                  </div>
                </div>
              ),
              { position: "top-right", duration: 2500 }
            );
          }
        }
      } else {
        // BUY/OPEN POSITION - use BUY price (ask price)
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        const formattedExpiryDate = expiryDate.toISOString().split("T")[0];

        let payload;
        let endpoint;

        if (selectedChallenge) {
          // 🔹 Challenge Mode
          endpoint = `${baseURL}challenges/trades/`;
          payload = {
            participation_id: selectedChallenge.participationId,
            asset_symbol: selected.symbol.toUpperCase(),
            asset_name: futuresTicker?.description || selected.baseAsset,
            trade_type: "FUTURES",
            direction: "BUY",
            total_quantity: parseFloat(futuresAmount),
            entry_price: parseFloat(buyPrice.toFixed(2)),
            entry_price: parseFloat(buyPrice.toFixed(2)),
            holding_type: holdingType.toUpperCase(),
            order_type: selectedOrderType.toUpperCase(),
            limit_price: selectedOrderType === "Limit" ? parseFloat(limitPrice) : null,
            margin_mode: marginType,
            leverage: leverage,
            contract_size: parseFloat(contractValue || "0.001").toFixed(8),
            expiry_date: formattedExpiryDate,
            is_hedged: isHedged,
          };
        } else {
          // 🔹 Normal Mode
          endpoint = `${baseURL}trading/place-order/`;
          payload = {
            asset_symbol: selected.symbol.toUpperCase(),
            asset_name: futuresTicker?.description || selected.baseAsset,
            asset_exchange: "DELTA",
            trade_type: "FUTURES",
            direction: "BUY",
            holding_type: holdingType.toUpperCase(),
            quantity: futuresAmount,
            price: buyPrice.toFixed(2),
            order_type: selectedOrderType.toUpperCase(),
            limit_price: selectedOrderType === "Limit" ? parseFloat(limitPrice) : null,
            margin_mode: marginType,
            leverage: leverage,
            contract_size: parseFloat(contractValue || "0.001").toFixed(8),
            expiry_date: formattedExpiryDate,
            is_hedged: isHedged,
          };
        }

        console.log("Futures Buy Payload:", payload);

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens.access}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        console.log(data, "the futures buy response");

        if (response.ok) {
          toast.custom(
            (t) => (
              <div
                className={`${t.visible ? "animate-enter" : "animate-leave"
                  } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}
              >
                <div className="flex-1 w-0 p-4 flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Long position opened: {data.quantity} contracts @{" "}
                    {data.price}
                  </p>
                </div>
              </div>
            ),
            { position: "top-right", duration: 2500 }
          );

          await refreshWallet();
          if (selectedChallenge && refreshChallengeWallet) {
            await refreshChallengeWallet(selectedChallenge.participationId);
          }
          fetchFuturesPosition();
          setFuturesAmount("");
          setFuturesSliderValue(0);
        } else {
          toast.custom(
            (t) => (
              <div
                className={`${t.visible ? "animate-enter" : "animate-leave"
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
      }
    } catch (error) {
      console.error("Futures order error:", error);
      toast.custom(
        (t) => (
          <div
            className={`${t.visible ? "animate-enter" : "animate-leave"
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
      if (side === "buy") {
        setIsPlacingBuyOrder(false);
      } else {
        setIsPlacingSellOrder(false);
      }
    }
  };

  // ---------- Live data ----------
  const [ticker, setTicker] = useState(null);
  // console.log(ticker,"the ticker value")
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


  const [showTooltip, setShowTooltip] = useState(false);
  const hideTimer = useRef(null);

  const handleSliderChange = (value) => {
    const price = parseFloat(ticker?.c || 0);
    // const safeBalance = parseFloat(balance || 0);
    const safeBalance = selectedChallenge
      ? parseFloat(walletData?.available_balance || 0)
      : parseFloat(balance || 0);

    // console.log(safeBalance,"the safe balance")

    const percent = Number(value);

    if (spotSide === "buy") {
      const usableQuote = safeBalance * (percent / 100);
      console.log(usableQuote, "the usableQuote")

      if (price > 0) {
        const baseAmount = usableQuote / price;

        setAmount(baseAmount.toFixed(8));
      } else {
        setAmount("0");
      }
    } else {
      // For sell: calculate based on spotBalance
      const sellAmount = spotBalance * (percent / 100);
      setAmount(sellAmount.toFixed(8));
    }

    setSliderValue(percent);
  };

  const handleStart = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }
    setShowTooltip(true);
  };

  const handleEnd = () => {
    hideTimer.current = setTimeout(() => {
      setShowTooltip(false);
    }, 800);
  };

  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  const [trades, setTrades] = useState([]);
  const [markPrice, setMarkPrice] = useState(null);

  // futures-specific

  const [marginType, setMarginType] = useState("CROSS");
  const [isHedged, setIsHedged] = useState(false);
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

  // // Load symbols
  // useEffect(() => {
  //   const endpoint =
  //     mode === "spot" ? "/api/v3/exchangeInfo" : "/fapi/v1/exchangeInfo";
  //   fetch(`${REST_BASE}${endpoint}`)
  //     .then((r) => r.json())
  //     .then((data) => {
  //       const list = (data.symbols || [])
  //         .filter((s) => s.status === "TRADING" && s.quoteAsset === "USDT")
  //         .map((s) => ({
  //           symbol: s.symbol.toLowerCase(),
  //           baseAsset: s.baseAsset,
  //           quoteAsset: s.quoteAsset,
  //         }))
  //         .sort((a, b) => a.symbol.localeCompare(b.symbol));
  //       setSymbols(list);

  //       if (!list.find((x) => x.symbol === selected.symbol)) {
  //         if (list[0]) setSelected(list[0]);
  //       }
  //     })
  //     .catch(() => {});
  // }, [mode]);

  // const filteredSymbols = useMemo(() => {
  //   const q = search.trim().toLowerCase();
  //   if (!q) return symbols;
  //   return symbols.filter(
  //     (s) => s.symbol.includes(q) || s.baseAsset.toLowerCase().includes(q)
  //   );
  // }, [symbols, search]);

  useEffect(() => {
    if (mode === "spot") {
      fetch(`${REST_BASE}/api/v3/exchangeInfo`)
        .then((r) => r.json())
        .then((data) => {
          const list = (data.symbols || [])
            .filter((s) => s.status === "TRADING" && s.quoteAsset === "USDT")
            .map((s) => ({
              symbol: s.symbol.toLowerCase(),
              baseAsset: s.baseAsset,
              quoteAsset: s.quoteAsset,
              expiry: "Spot",
            }))
            .sort((a, b) => a.symbol.localeCompare(b.symbol));

          setSymbols(list);

          if (!list.find((x) => x.symbol === selected.symbol)) {
            if (list[0]) setSelected(list[0]);
          }
        })
        .catch((err) => console.error("Error fetching spot symbols:", err));
      // } else if (mode === "futures") {
      //   // ✅ FUTURES — Only Perpetual contracts from Delta
      //   const fetchSymbols = async () => {
      //     try {
      //       const res = await axios.get(
      //         "https://api.delta.exchange/v2/products?contract_types=perpetual_futures"
      //       );

      //       const perpetuals = res.data.result;

      //       perpetuals.map((s) => ({

      //         baseAsset: s.short_description

      //       }))

      //       console.log(perpetuals, "the symbols first in perp");

      //       setSymbols(perpetuals);

      //       if (!perpetuals.find((x) => x.symbol === selected.symbol)) {
      //         if (perpetuals[0]) setSelected(perpetuals[0]);
      //       }
      //     } catch (err) {
      //       console.error("Error fetching futures symbols:", err);
      //     }
      //   };
      //   fetchSymbols();
      // }
    } else if (mode === "futures") {
      const fetchSymbols = async () => {
        try {
          const res = await axios.get(
            "https://api.delta.exchange/v2/products?contract_types=perpetual_futures"
          );

          const perpetuals = res.data.result;

          const normalizedFutures = perpetuals
            .filter((s) => s.symbol?.toUpperCase().endsWith("USDT"))
            .map((s) => ({
              symbol: s.symbol?.toLowerCase() || "",
              baseAsset: (s.short_description || "").toUpperCase(),
              quoteAsset:
                s.quoting_asset?.symbol || s.quoting_asset?.id || "USDT",
              expiry: s.contract_type || "perpetual_futures",
              tickSize: s.tick_size || "",
              contractValue: s.contract_value || "",
              leverage: s.default_leverage || "",
            }));

          console.log(normalizedFutures, "the normalized");

          setSymbols(normalizedFutures);

          if (!list.find((x) => x.symbol === selected?.symbol)) {
            if (list[0]) setSelected(list[0]);
          }
        } catch (err) {
          console.error("Error fetching futures symbols:", err);
        }
      };
      fetchSymbols();
    }
  }, [mode]);

  // ✅ Same filter logic
  const filteredSymbols = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return symbols;
    return symbols.filter(
      (s) =>
        s?.baseAsset?.toLowerCase().includes(q) ||
        s?.symbol?.toLowerCase().includes(q)
    );
  }, [symbols, search]);

  // console.log(filteredSymbols,"the filtered symbols")

  // Websockets
  useEffect(() => {
    const sym = selected.symbol.toLowerCase();
    if (!sym) return;

    const tickerStream = `${sym}@ticker`; // Price updates
    const depthStream = `${sym}@depth20@100ms`; // Order book (level 2) every 100ms
    const aggStream = `${sym}@aggTrade`; // Aggregated trades
    const markStream = `${sym}@markPrice`; // Mark price (for Futures only)

    try {
      tickerWS.current?.close();
    } catch { }
    tickerWS.current = new WebSocket(`${WS_BASE}/${tickerStream}`);
    tickerWS.current.onmessage = throttle((e) => {
      setTicker(JSON.parse(e.data));
    }, 6000);

    try {
      depthWS.current?.close();
    } catch { }
    depthWS.current = new WebSocket(`${WS_BASE}/${depthStream}`);
    depthWS.current.onmessage = (e) => {
      const d = JSON.parse(e.data);
      setOrderBook({ bids: d.bids || d.b || [], asks: d.asks || d.a || [] });
    };

    try {
      tradesWS.current?.close();
    } catch { }
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
    } catch { }
    markWS.current = new WebSocket(`${WS_BASE}/${markStream}`);
    markWS.current.onmessage = (e) => setMarkPrice(JSON.parse(e.data));

    return () => {
      try {
        tickerWS.current?.close();
        depthWS.current?.close();
        tradesWS.current?.close();
        markWS.current?.close();
      } catch { }
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
    <div className="bg-[#15162C] p-3 sm:p-4 rounded-xl border border-white/10">
      {/* Tabs */}
      <div className="flex items-center gap-4 text-xs mb-4 flex-nowrap">
        {["Trade", "Order Book", "Recent Trades"].map((type) => (
          <button
            key={type}
            onClick={() => setTradeType(type)}
            className={`font-semibold transition-all duration-200 ${tradeType === type
              ? "text-white underline underline-offset-4 decoration-purple-500"
              : "text-gray-400 hover:text-white"
              }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Order Type and Holding Type Selection - Only show for Trade tab */}
      {tradeType === "Trade" && (
        <div className="flex space-x-4 text-xs sm:text-sm mb-4">
          {/* Order Types (Market/Limit) */}
          {orderTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedOrderType(type)}
              className={`${selectedOrderType === type
                ? "text-purple-400 font-semibold"
                : "text-gray-400 hover:text-white"
                }`}
            >
              {type}
            </button>
          ))}

          {/* Holding Type Toggle - Only show for Futures mode */}
          {mode === "futures" && (
            <div className="flex rounded-md border border-gray-600 overflow-hidden ml-auto">
              {["Intraday", "Longterm"].map((type, index) => (
                <React.Fragment key={type}>
                  <button
                    onClick={() => setHoldingType(type)}
                    className={`px-3 py-1 font-semibold transition-all duration-200 ${holdingType === type
                      ? "bg-purple-600 text-white"
                      : "text-gray-400 hover:text-white"
                      }`}
                  >
                    {type}
                  </button>

                  {index === 0 && (
                    <div className="w-px h-4 bg-gray-600 self-center" />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      )}

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
              className={`text-lg font-bold ${ticker && parseFloat(ticker.P) < 0
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
                className={`grid grid-cols-3 text-xs items-center rounded-md px-2 py-1 ${t.m
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
        <>
          {mode === "futures" ? (
            <>
              {/* Futures UI */}
              <div className="space-y-3">
                <div className="text-xs text-gray-400">
                  Avbl
                  <span className="ml-1">
                    {loading
                      ? "Loading..."
                      : `${balance} ${selected.quoteAsset}`}
                  </span>
                </div>

                {/* Leverage Selection */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Leverage</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={leverage}
                      min={1}
                      max={() => {
                        const challengeMax = selectedChallenge?.weekData?.max_leverage_allowed || selectedChallenge?.max_leverage_allowed || 100;
                        const tickerMax = futuresTicker?.leverage || 100;
                        return Math.min(challengeMax, tickerMax);
                      }}
                      onChange={(e) => {
                        let val = e.target.value;

                        // Allow empty input for editing
                        if (val === "") {
                          setLeverage("");
                          return;
                        }

                        // Convert to number
                        val = Number(val);

                        const challengeMax = selectedChallenge?.weekData?.max_leverage_allowed || selectedChallenge?.max_leverage_allowed || 100;
                        const tickerMax = futuresTicker?.leverage || 100;
                        const maxLeverage = Math.min(challengeMax, tickerMax);


                        // Restrict typing above maxLeverage
                        if (val > maxLeverage) {
                          val = maxLeverage;
                          // Optional warning
                          // showToast(`Max leverage allowed is ${maxLeverage}x`, "error");
                        }

                        // Restrict below min
                        if (val < 1) {
                          val = 1;
                        }

                        setLeverage(String(val));
                      }}
                      onBlur={() => {
                        let val = Number(leverage);

                        const challengeMax = selectedChallenge?.weekData?.max_leverage_allowed || selectedChallenge?.max_leverage_allowed || 100;
                        const tickerMax = futuresTicker?.leverage || 100;
                        const maxLeverage = Math.min(challengeMax, tickerMax);

                        if (isNaN(val) || val < 1) val = 1;
                        else if (val > maxLeverage) val = maxLeverage;

                        setLeverage(String(val));
                      }}
                      className="w-16 bg-transparent border border-white/10 rounded text-center text-white focus:border-purple-400 focus:outline-none"
                    />

                    <span className="text-gray-400">x</span>
                    {selectedChallenge && (selectedChallenge.weekData?.max_leverage_allowed || selectedChallenge.max_leverage_allowed) && (
                      <span className="text-[10px] text-red-400 ml-1">
                        (Max {selectedChallenge.weekData?.max_leverage_allowed || selectedChallenge.max_leverage_allowed}x)
                      </span>
                    )}
                  </div>
                </div>

                {/* Order Type Selector */}
                <div className="flex space-x-2 mb-2">
                  {orderTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedOrderType(type)}
                      className={`flex-1 py-1.5 rounded text-xs font-semibold transition ${selectedOrderType === type
                        ? "bg-blue-600 text-white"
                        : "bg-white/5 text-gray-400 hover:bg-white/10"
                        }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {/* Limit Price Input */}
                {selectedOrderType === "Limit" && (
                  <div className="bg-[#1E1F36] rounded p-2 text-xs sm:text-sm w-full max-w-sm mb-2">
                    <div className="relative w-full">
                      <label className="text-xs text-gray-400 block mb-1">Limit Price</label>
                      <input
                        type="number"
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                        className="no-spinner w-full bg-transparent border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 transition duration-150"
                        placeholder="Enter Price"
                      />
                    </div>
                  </div>
                )}

                {/* Margin Type Toggle */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => setMarginType("CROSS")}
                    className={`flex-1 py-1.5 rounded text-xs font-semibold transition ${marginType === "CROSS"
                      ? "bg-purple-600 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                      }`}
                  >
                    Cross
                  </button>
                  <button
                    onClick={() => setMarginType("ISOLATED")}
                    className={`flex-1 py-1.5 rounded text-xs font-semibold transition ${marginType === "ISOLATED"
                      ? "bg-purple-600 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                      }`}
                  >
                    Isolated
                  </button>
                </div>

                {/* Hedge Mode Checkbox */}
                <div className="flex items-center space-x-2 mt-2">
                  <input
                    type="checkbox"
                    id="hedgeMode"
                    checked={isHedged}
                    onChange={(e) => setIsHedged(e.target.checked)}
                    className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <label htmlFor="hedgeMode" className="text-xs text-gray-400 select-none cursor-pointer">
                    Hedge Mode (Allow Long & Short)
                  </label>
                </div>

                {/* Buy/Sell Prices Display */}
                {/* <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#1E1F36] rounded p-2 text-xs">
                    <div className="text-gray-400 mb-1">Buy Price (Ask)</div>
                    <div className="text-red-400 font-mono font-semibold">
                      {buyPrice}
                    </div>
                  </div>
                  <div className="bg-[#1E1F36] rounded p-2 text-xs">
                    <div className="text-gray-400 mb-1">Sell Price (Bid)</div>
                    <div className="text-green-400 font-mono font-semibold">
                      {sellPrice}
                    </div>
                  </div>
                </div> */}

                {/* Mark Price */}
                <div className="bg-[#1E1F36] rounded p-2 flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-gray-400">Mark Price</span>
                  <span className="text-yellow-400 font-mono font-semibold">
                    {futuresPriceTicker?.markPrice}
                  </span>
                  <span className="text-gray-400">{selected.quoteAsset}</span>
                </div>

                {/* Amount Input */}
                <div className="bg-[#1E1F36] rounded p-2 text-xs sm:text-sm w-full max-w-sm">
                  <div className="relative w-full">
                    <label
                      className={`absolute left-3 text-gray-400 transition-all duration-200 ease-in-out pointer-events-none ${futuresAmount
                        ? "text-[10px] sm:text-xs top-1"
                        : "text-xs sm:text-sm top-2.5"
                        }`}
                    >
                      Quantity (Min: {contractValue} {selected.baseAsset})
                    </label>
                    <input
                      type="number"
                      value={futuresAmount}
                      onChange={(e) => {
                        setFuturesAmount(e.target.value);
                        setFuturesSliderValue(0);
                      }}
                      onWheel={(e) => e.target.blur()}
                      className="no-spinner w-full bg-transparent border border-gray-600 rounded px-3 pt-5 pb-1 text-white placeholder-transparent focus:outline-none focus:border-purple-400 transition duration-150"
                      placeholder="Quantity"
                    />
                  </div>
                  {futuresAmount && parseFloat(futuresAmount) < parseFloat(contractValue) && (
                    <p className="text-red-400 text-[10px] mt-1">
                      Minimum quantity is {contractValue}
                    </p>
                  )}
                </div>

                {/* Range Slider */}
                <div className="relative w-full">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={futuresSliderValue}
                    onChange={(e) =>
                      handleFuturesSliderChange(Number(e.target.value))
                    }
                    className="w-full accent-purple-500 cursor-pointer"
                  />

                  {futuresSliderValue > 0 && (
                    <div
                      className="absolute -top-10 flex items-center justify-center w-12 h-8 bg-gray-800 text-white text-sm font-semibold rounded-md shadow-md transition-all duration-200"
                      style={{
                        left: `calc(${futuresSliderValue}% - 24px)`,
                      }}
                    >
                      {futuresSliderValue}%
                    </div>
                  )}
                </div>

                {/* Position Value Display */}
                {/* <div className="bg-[#1E1F36] rounded p-2 flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-gray-400">Position Value</span>
                  <span className="text-white font-mono">
                    {positionValue > 0
                      ? `${positionValue.toFixed(2)} ${selected.quoteAsset}`
                      : `Enter quantity`}
                  </span>
                </div> */}

                {/* Position Value Display */}
                <div className="bg-[#1E1F36] rounded p-2 flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-gray-400">Position Value</span>
                  <span className="text-white font-mono">
                    {positionValue > 0
                      ? `${positionValue.toFixed(2)} ${selected.quoteAsset}`
                      : `Enter quantity`}
                  </span>
                </div>

                {/* Margin Required Display */}
                {futuresAmount && futuresPrice > 0 && (
                  <div className="bg-[#1E1F36] rounded p-2 flex justify-between items-center text-xs sm:text-sm border border-purple-500/30">
                    <span className="text-purple-400 font-semibold">
                      Margin Required
                    </span>
                    <span className="text-purple-300 font-mono font-semibold">
                      {marginRequired.toFixed(2)} {selected.quoteAsset}
                    </span>
                  </div>
                )}

                {/* Contract Info */}
                {/* {futuresTicker && (
                  <div className="text-xs text-gray-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Contract Size:</span>
                      <span className="text-white">
                        {futuresTicker.contract_value}{" "}
                        {futuresTicker.underlying_asset_symbol}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Funding Rate:</span>
                      <span
                        className={`${
                          parseFloat(futuresTicker.funding_rate) >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {(parseFloat(futuresTicker.funding_rate) * 100).toFixed(
                          4
                        )}
                        %
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Spread:</span>
                      <span className="text-white">
                        {(buyPrice - sellPrice).toFixed(2)}{" "}
                        {selected.quoteAsset}
                      </span>
                    </div>
                  </div>
                )} */}

                {/* Buy/Long and Sell/Short Buttons in Same Row */}
                <div className="flex gap-2">
                  {/* Buy/Long Button */}
                  {/* <button
                    onClick={() => handleFuturesOrder("buy")}
                    disabled={
                      isPlacingBuyOrder ||
                      !futuresAmount ||
                      parseFloat(futuresAmount) <= 0 ||
                      (() => {
                        const contractValue = futuresTicker?.contract_value
                          ? parseFloat(futuresTicker.contract_value)
                          : 0.001;
                        const marginRequired =
                          (parseFloat(futuresAmount || 0) *
                            futuresPrice *
                            contractValue) /
                          leverage;
                        return marginRequired > balance;
                      })()
                    }
                    className={`flex-1 py-2 rounded-lg font-semibold transition ${
                      isPlacingBuyOrder ||
                      !futuresAmount ||
                      parseFloat(futuresAmount) <= 0 ||
                      (() => {
                        const contractValue = futuresTicker?.contract_value
                          ? parseFloat(futuresTicker.contract_value)
                          : 0.001;
                        const marginRequired =
                          (parseFloat(futuresAmount || 0) *
                            futuresPrice *
                            contractValue) /
                          leverage;
                        return marginRequired > balance;
                      })()
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-500 hover:bg-green-600"
                    }`}
                  >
                    {isPlacingBuyOrder
                      ? "Placing..."
                      : (() => {
                          const contractValue = futuresTicker?.contract_value
                            ? parseFloat(futuresTicker.contract_value)
                            : 0.001;
                          const marginRequired =
                            (parseFloat(futuresAmount || 0) *
                              futuresPrice *
                              contractValue) /
                            leverage;
                          return marginRequired > balance
                            ? "Insufficient Margin"
                            : `Buy/Long`;
                        })()}
                  </button> */}

                  <button
                    onClick={() => handleFuturesOrder("buy")}
                    disabled={
                      isPlacingBuyOrder ||
                      !futuresAmount ||
                      parseFloat(futuresAmount) <= 0 ||
                      parseFloat(futuresAmount) < parseFloat(contractValue) ||
                      (() => {
                        const marginRequired =
                          (parseFloat(futuresAmount || 0) *
                            futuresPrice *
                            parseFloat(contractValue)) /
                          leverage;
                        return marginRequired > balance;
                      })()
                    }
                    className={`flex-1 py-2 rounded-lg font-semibold transition ${isPlacingBuyOrder ||
                      !futuresAmount ||
                      parseFloat(futuresAmount) <= 0 ||
                      parseFloat(futuresAmount) < parseFloat(contractValue) ||
                      (() => {
                        const marginRequired =
                          (parseFloat(futuresAmount || 0) *
                            futuresPrice *
                            parseFloat(contractValue)) /
                          leverage;
                        return marginRequired > balance;
                      })()
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-500 hover:bg-green-600"
                      }`}
                  >
                    {isPlacingBuyOrder
                      ? "Placing..."
                      : parseFloat(futuresAmount) < parseFloat(contractValue)
                        ? `Buy/Long`
                        : (() => {
                          const marginRequired =
                            (parseFloat(futuresAmount || 0) *
                              futuresPrice *
                              parseFloat(contractValue)) /
                            leverage;
                          return marginRequired > balance
                            ? "Insufficient Margin"
                            : `Buy/Long`;
                        })()}
                  </button>

                  {/* Sell/Short Button */}
                  {/* <button
    onClick={() => handleFuturesOrder("sell")}
    disabled={
      isPlacingSellOrder ||
      !futuresAmount ||
      parseFloat(futuresAmount) <= 0 ||
      futuresTotal > balance * leverage
    }
    className={`flex-1 py-2 rounded-lg font-semibold transition ${
      isPlacingSellOrder ||
      !futuresAmount ||
      parseFloat(futuresAmount) <= 0 ||
      futuresTotal > balance * leverage
        ? "bg-gray-400 cursor-not-allowed"
        : "bg-red-500 hover:bg-red-600"
    }`}
  >
    {isPlacingSellOrder
      ? "Placing..."
      : futuresTotal > balance * leverage
      ? "Insufficient"
      : `Sell/Short`}
  </button> */}

                  {/* Sell/Short Button */}
                  <button
                    onClick={() => handleFuturesOrder("sell")}
                    disabled={
                      isPlacingSellOrder ||
                      !futuresAmount ||
                      parseFloat(futuresAmount) <= 0 ||
                      parseFloat(futuresAmount) < parseFloat(contractValue) ||
                      (() => {
                        const marginRequired =
                          (parseFloat(futuresAmount || 0) *
                            futuresPrice *
                            parseFloat(contractValue)) /
                          leverage;
                        return marginRequired > balance;
                      })()
                    }
                    className={`flex-1 py-2 rounded-lg font-semibold transition ${isPlacingSellOrder ||
                      !futuresAmount ||
                      parseFloat(futuresAmount) <= 0 ||
                      parseFloat(futuresAmount) < parseFloat(contractValue) ||
                      (() => {
                        const marginRequired =
                          (parseFloat(futuresAmount || 0) *
                            futuresPrice *
                            parseFloat(contractValue)) /
                          leverage;
                        return marginRequired > balance;
                      })()
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-red-500 hover:bg-red-600"
                      }`}
                  >
                    {isPlacingSellOrder
                      ? "Placing..."
                      : parseFloat(futuresAmount) < parseFloat(contractValue)
                        ? `Sell/Short`
                        : (() => {
                          const marginRequired =
                            (parseFloat(futuresAmount || 0) *
                              futuresPrice *
                              parseFloat(contractValue)) /
                            leverage;
                          return marginRequired > balance
                            ? "Insufficient Margin"
                            : `Sell/Short`;
                        })()}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Spot Side Toggle */}
              <div className="flex space-x-4 mb-4">
                <button
                  onClick={() => setSpotSide("buy")}
                  className={`flex-1 py-1 rounded ${spotSide === "buy"
                    ? "bg-green-500 text-white font-semibold"
                    : "bg-white/5 text-gray-400"
                    }`}
                >
                  Buy
                </button>
                <button
                  onClick={() => setSpotSide("sell")}
                  className={`flex-1 py-1 rounded ${spotSide === "sell"
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
                    <span className="ml-1">
                      <div className="text-xs text-gray-400">
                        Avbl{" "}
                        <span className="ml-1">
                          {selectedChallenge
                            ? parseFloat(walletData?.available_balance).toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })
                            : loading
                              ? "Loading..."
                              : `${balance} ${selected.quoteAsset}`}
                        </span>
                      </div>

                    </span>
                  </div>

                  {/* Price */}
                  <div className="bg-[#1E1F36] rounded p-2 flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-gray-400">Price</span>
                    <span className="text-white">{price}</span>
                    <span className="text-gray-400">{selected.quoteAsset}</span>
                  </div>

                  {/* Amount */}
                  <div className="bg-[#1E1F36] rounded p-2 flex items-center text-xs sm:text-sm relative w-full max-w-sm">
                    <div className="bg-[#1E1F36] rounded p-2 text-xs sm:text-sm w-full max-w-sm">
                      <div className="relative w-full">
                        <label
                          className={`absolute left-3 text-gray-400 transition-all duration-200 ease-in-out pointer-events-none ${amount
                            ? "text-[10px] sm:text-xs top-1"
                            : "text-xs sm:text-sm top-2.5"
                            }`}
                        >
                          Amount ({selected.baseAsset})
                        </label>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => {
                            setAmount(e.target.value);
                            if (!isSliderActive) {
                              setSliderValue(0);
                            }
                          }}
                          onWheel={(e) => e.target.blur()}
                          className="no-spinner w-full bg-transparent border border-gray-600 rounded px-3 pt-5 pb-1 text-white placeholder-transparent focus:outline-none focus:border-purple-400 transition duration-150"
                          placeholder="Amount"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Range Slider */}
                  <div className="relative w-full">
                    {/* <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={sliderValue}
                      onMouseDown={handleStart}
                      onMouseUp={handleEnd}
                      onTouchStart={handleStart}
                      onTouchEnd={handleEnd}
                      onChange={(e) => {
                        setIsSliderActive(true);
                        const percentage = Number(e.target.value);
                        const maxBuyableAmount = balance / price;
                        const calculatedAmount =
                          (maxBuyableAmount * percentage) / 100;
                        setSliderValue(percentage);
                        setAmount(calculatedAmount.toFixed(8));
                        setTimeout(() => setIsSliderActive(false), 100);
                      }}
                      className="w-full accent-green-500 cursor-pointer"
                    /> */}

                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={sliderValue}
                      onMouseDown={handleStart}
                      onMouseUp={handleEnd}
                      onTouchStart={handleStart}
                      onTouchEnd={handleEnd}
                      onChange={(e) => {
                        setIsSliderActive(true);

                        const percentage = Number(e.target.value);

                        // 👇 decide which balance to use
                        const usableBalance = selectedChallenge
                          ? Number(walletData.available_balance)
                          : balance;

                        // console.log(usableBalance,"the usable balanc 3c33")



                        const maxBuyableAmount = usableBalance / price;
                        const calculatedAmount = (maxBuyableAmount * percentage) / 100;

                        setSliderValue(percentage);
                        setAmount(calculatedAmount.toFixed(8));

                        setTimeout(() => setIsSliderActive(false), 100);
                      }}
                      className="w-full accent-green-500 cursor-pointer"
                    />





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
                    {/* <span className="text-white">
                      {total > 0
                        ? `${Math.min(total, balance).toFixed(2)} ${
                            selected.quoteAsset
                          }`
                        : `Minimum 5 ${selected.quoteAsset}`}
                    </span> */}

                    <span className="text-white">
                      {total > 0
                        ? `${Math.min(
                          total,
                          selectedChallenge
                            ? Number(walletData?.available_balance || 0)
                            : Number(balance || 0)
                        ).toFixed(2)} ${selected.quoteAsset}`
                        : `Minimum 5 ${selected.quoteAsset}`}
                    </span>

                  </div>

                  <div className="text-xs text-gray-400">
                    Available:{" "}
                    <span>
                      {spotBalance.toFixed(8)} {selected.baseAsset}
                    </span>
                  </div>

                  <button
                    onClick={handleOrder}
                    disabled={
                      isPlacingOrder ||
                      (total > balance && sliderValue === 0) ||
                      amount <= 0
                    }
                    className={`w-full ${isPlacingOrder ||
                      (total > balance && sliderValue === 0) ||
                      amount <= 0
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-500 hover:bg-green-600"
                      } py-2 rounded-lg font-semibold`}
                  >
                    {isPlacingOrder
                      ? "Placing your Order..."
                      : total > balance && sliderValue === 0
                        ? "Insufficient Balance"
                        : `Buy ${selected.baseAsset}`}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs text-gray-400">
                    Avbl{" "}
                    <span className="ml-1">
                      {loading
                        ? "Loading..."
                        : `${spotBalance.toFixed(8)} ${selected.baseAsset}`}
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
                          className={`absolute left-3 text-gray-400 transition-all duration-200 ease-in-out pointer-events-none ${amount
                            ? "text-[10px] sm:text-xs top-1"
                            : "text-xs sm:text-sm top-2.5"
                            }`}
                        >
                          Amount ({selected.baseAsset})
                        </label>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => {
                            setAmount(e.target.value);
                            if (!isSliderActive) {
                              setSliderValue(0);
                            }
                          }}
                          onWheel={(e) => e.target.blur()}
                          className="no-spinner w-full bg-transparent border border-gray-600 rounded px-3 pt-5 pb-1 text-white placeholder-transparent focus:outline-none focus:border-purple-400 transition duration-150"
                          placeholder="Amount"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Range Slider */}
                  <div className="relative w-full">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={sliderValue}
                      onMouseDown={handleStart}
                      onMouseUp={handleEnd}
                      onTouchStart={handleStart}
                      onTouchEnd={handleEnd}
                      onChange={(e) => {
                        setIsSliderActive(true);
                        handleSliderChange(Number(e.target.value));
                        setTimeout(() => setIsSliderActive(false), 100);
                      }}
                      className="w-full accent-red-500 cursor-pointer"
                    />

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
                        : `Minimum 10 ${selected.baseAsset}`}
                    </span>
                  </div>

                  <div className="text-xs text-gray-400">
                    Available:{" "}
                    <span>
                      {selectedChallenge
                        ? `${walletData?.available_balance || 0} ${selected.quoteAsset}`
                        : `${balance} ${selected.quoteAsset}`}
                    </span>

                  </div>

                  <button
                    onClick={handleOrder}
                    disabled={
                      isPlacingOrder ||
                      !tradeId ||
                      spotBalance === 0 ||
                      amount <= 0
                    }
                    className={`w-full py-2 rounded-lg font-semibold transition 
                    ${!tradeId ||
                        spotBalance === 0 ||
                        isPlacingOrder ||
                        amount <= 0
                        ? "bg-gray-500 cursor-not-allowed opacity-50"
                        : "bg-red-500 hover:bg-red-600"
                      }`}
                  >
                    {isPlacingOrder
                      ? "Placing your Order..."
                      : !tradeId
                        ? "No Open Position"
                        : `Sell ${selected.baseAsset}`}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
  const [tradeId, setTradeId] = useState(null);

  const fetchSpotBalance = async () => {
    try {
      let response;

      if (selectedChallenge) {
        // Challenge mode API
        response = await fetch(
          `${baseURL}challenges/challenge-trades/${selected.baseAsset.toUpperCase()}/?week_id=${selectedChallenge?.weekData.id
          }&trade_type=${mode.toUpperCase()}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${tokens?.access}`,
            },
          }
        );
      } else {
        // Normal mode API
        response = await fetch(
          `${baseURL}trading/trade/open/?asset_symbol=${selected.baseAsset}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${tokens?.access}`,
            },
          }
        );
      }

      const data = await response.json();
      console.log(data, "the fetchSpotBalance data");

      if (selectedChallenge) {
        // Handle challenge response
        if (
          data.open_and_partial_trades &&
          data.open_and_partial_trades.length > 0
        ) {
          const totalQuantity = data.open_and_partial_trades.reduce(
            (sum, trade) => sum + parseFloat(trade.remaining_quantity),
            0
          );
          setSpotBalance(totalQuantity);
          // Set the first trade's ID (or handle multiple trades as needed)
          setTradeId(data.open_and_partial_trades[0].id);
        } else {
          setSpotBalance(0);
          setTradeId(null);
        }
      } else {
        // Handle normal response
        if (data.is_open && data.trade && data.trade.trade_type === "SPOT") {
          setSpotBalance(parseFloat(data.trade.total_quantity));
          setTradeId(data.trade.id);
        } else {
          setSpotBalance(0);
          setTradeId(null);
        }
      }
    } catch (error) {
      console.error("Error fetching spot balance:", error);
      setSpotBalance(0);
      setTradeId(null);
    }
  };
  // Call it in useEffect
  useEffect(() => {
    fetchSpotBalance();
  }, [selected, selectedChallenge, mode]); // Added selectedChallenge and mode

  return (
    <div className="text-white h-full w-full px-2 sm:px-4">
      <div className="flex justify-between">
        <div>
          {isChallengeStarted && (
            <button
              onClick={() => setIsChallengeStarted(false)}
              className="flex items-center gap-2 font-medium transition-all duration-200 hover:scale-105"
            >
              <ArrowLeft
                size={20}
                className="text-[#A93EF8] drop-shadow-[0_0_6px_rgba(169,62,248,0.5)]"
              />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A93EF8] to-[#E75469] ">
                Back to Challenge
              </span>
            </button>
          )}

          <div></div>

          <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-[#A93EF8] to-[#E75469] text-transparent bg-clip-text mb-4 sm:mb-3">
            {isChallengeStarted ? "Challenge" : "Virtual"} Trading (
            {selectedChallenge?.category?.toUpperCase() || mode.toUpperCase()})
          </h1>

          {/* Mode Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            {selectedChallenge
              ? (() => {
                const tradeType = selectedChallenge.weekData?.trading_type || selectedChallenge.trading_type || selectedChallenge.category;
                const weekNumber = selectedChallenge.weekData?.week_number || selectedChallenge.week_number || 1;

                // Allowed modes based on trading_type (Priority) or week number (Fallback)
                let allowedModes = ["spot"];

                if (tradeType === "SPOT_FUTURES") {
                  allowedModes = ["spot", "futures"];
                } else if (tradeType === "SPOT_FUTURES_OPTIONS" || tradeType === "PORTFOLIO") {
                  allowedModes = ["spot", "futures", "options"];
                } else if (tradeType === "SPOT") {
                  allowedModes = ["spot"];
                } else {
                  // Fallback
                  if (weekNumber === 1) allowedModes = ["spot"];
                  else if (weekNumber === 2) allowedModes = ["spot", "futures"];
                  else allowedModes = ["spot", "futures", "options"];
                }

                // If current mode isn’t allowed, fallback to the first allowed one
                if (!allowedModes.includes(mode)) {
                  // Logic handled by useEffect
                }

                return (
                  <div className="flex gap-2">
                    {allowedModes.map((m) => (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`px-3 py-1 rounded-md transition ${mode === m
                          ? "bg-purple-500/20 font-semibold text-white"
                          : "text-gray-400 hover:bg-purple-500/10"
                          }`}
                      >
                        {m.charAt(0).toUpperCase() + m.slice(1)}
                      </button>
                    ))}
                  </div>
                );
              })()
              : // Normal mode toggle when no challenge selected
              ["spot", "futures", "options"].map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-1 rounded-md transition ${mode === m
                    ? "bg-purple-500/20 font-semibold text-white"
                    : "text-gray-400 hover:bg-purple-500/10"
                    }`}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
          </div>
        </div>

        {walletData && (
          <div className="  rounded-xl p-3 border shadow-lg border-purple-500/40 transition-all  min-w-[420px]">
            {walletLoading ? (
              <div className="flex flex-col items-center justify-center h-[120px]">
                <Loader2
                  className="animate-spin text-purple-400 mb-3"
                  size={32}
                />
                <p className="text-sm text-gray-300 font-medium">
                  Loading wallet...
                </p>
              </div>
            ) : (
              <div className="h-[120px] flex flex-col justify-">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-purple-400" />
                    {walletData.week_title} Wallet
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 rounded-lg p-1 border border-gray-700/50 hover:border-green-500/30 transition-all">
                    <p className="text-[10px] text-gray-400 font-medium mb-1.5 uppercase tracking-wide">
                      Available
                    </p>
                    <p className="text-lg font-bold text-green-400 tabular-nums">
                      {parseFloat(walletData?.available_balance).toLocaleString(
                        undefined,
                        {
                          maximumFractionDigits: 2,
                        }
                      )}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 rounded-lg p-1 border border-gray-700/50 hover:border-yellow-500/30 transition-all">
                    <p className="text-[10px] text-gray-400 font-medium mb-1.5 uppercase tracking-wide">
                      Locked
                    </p>
                    <p className="text-lg font-bold text-yellow-400 tabular-nums">
                      {parseFloat(walletData.locked_balance).toLocaleString(
                        undefined,
                        { maximumFractionDigits: 2 }
                      )}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 rounded-lg p-1 border border-gray-700/50 hover:border-blue-500/30 transition-all">
                    <p className="text-[10px] text-gray-400 font-medium mb-1.5 uppercase tracking-wide">
                      Earned
                    </p>
                    <p className="text-lg font-bold text-blue-400 tabular-nums">
                      {parseFloat(walletData.earned_balance).toLocaleString(
                        undefined,
                        { maximumFractionDigits: 2 }
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {mode === "spot" || mode === "futures" ? (
        <div>
          {/* Pair + Stats */}
          <div
            className=" my-2 sm:border rounded-md sm:border-[#4733A6]/40
              p-4 sm:py-2 flex flex-col sm:flex-row sm:items-center gap-2"
          >
            {/* Left: Pair Selector */}
            <div className=" w-fit flex-shrink-0">
              <button
                onClick={() => {
                  setShowDropdown((v) => !v); // only toggle if no challenge
                }}
                className="flex items-center justify-start sm:justify-between w-full px-0 sm:px-4 py-3 rounded-lg text-xl uppercase transition cursor-pointer"
                title="Select Pair"
              >
                <div className="flex items-center">
                  <span className="font-extrabold text-3xl font-mono">
                    {selected.symbol}
                  </span>

                  <span className="ml-2 text-sm sm:text-base opacity-70">
                    ▼
                  </span>
                </div>
              </button>

              {showDropdown && (
                <div
                  className="absolute max-h-80 overflow-y-auto 
              bg-[#070710]/95 sm:border sm:border-[#2e2a40]/60 
              rounded-xl shadow-xl  animate-fadeIn"
                >
                  <div className="sticky  top-0 bg-[#070710]/95 p-2">
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

                        <span className="text-xs text-gray-400">
                          {s.symbol}
                        </span>
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

            <div className="h-12 w-px bg-[#4733A6] mx-4" />

            {/* Right Content */}
            <div className="flex-1">
              {/* Mobile Layout */}
              <div className="block sm:hidden -mt-2 space-y-3">
                {/* Big Last Price */}
                <div
                  className={`text-xl -mt-4 font-mono font-extrabold ${tickerData && parseFloat(tickerData.P) < 0
                    ? "text-red-400"
                    : "text-green-400"
                    }`}
                >
                  {fmt(tickerData?.c, 2)} {selected.quoteAsset}
                </div>

                {/* Compact Stats Boxes */}
                <div className="grid grid-cols-2 px-2 gap-2 text-xs">
                  {/* 24h Change */}
                  <div className="bg-[#0F0A25]/50 rounded-md p-2 border border-white/10">
                    <div className="text-[#A489F5] text-[10px] mb-0.5">
                      24h Change
                    </div>
                    <div
                      className={`font-medium ${tickerData && parseFloat(tickerData.P) < 0
                        ? "text-red-400"
                        : "text-white"
                        }`}
                    >
                      ({fmt(tickerData?.P, 2)}%)
                    </div>
                  </div>

                  {/* 24h High */}
                  <div className="bg-[#0F0A25]/50 rounded-md p-2 border border-white/10">
                    <div className="text-[#A489F5] text-[10px] mb-0.5">
                      24h High
                    </div>
                    <div className="font-medium">{fmt(tickerData?.h, 2)}</div>
                  </div>

                  {/* 24h Low */}
                  <div className="bg-[#0F0A25]/50 rounded-md p-2 border border-white/10">
                    <div className="text-[#A489F5] text-[10px] mb-0.5">
                      24h Low
                    </div>
                    <div className="font-medium">{fmt(tickerData?.l, 2)}</div>
                  </div>

                  {/* Base Volume */}
                  <div className="bg-[#0F0A25]/50 rounded-md p-2 border border-white/10">
                    <div className="text-[#A489F5] text-[10px] mb-0.5">
                      24h Vol ({selected.baseAsset})
                    </div>
                    <div className="font-medium">{fmt(tickerData?.v, 2)}</div>
                  </div>

                  {/* Quote Volume */}
                  <div className="bg-[#0F0A25]/50 rounded-md p-2 border border-white/10 col-span-2">
                    <div className="text-[#A489F5] text-[10px] mb-0.5">
                      24h Vol ({selected.quoteAsset})
                    </div>
                    <div className="font-medium">{fmt(tickerData?.q, 2)}</div>
                  </div>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden sm:grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
                {/* Last Price */}
                <div>
                  <div className="text-[#A489F5] font-bold text-xs mb-1">
                    Last Price
                  </div>
                  <div
                    className={`font-bold text-base sm:text-lg ${tickerData && parseFloat(tickerData.P) < 0
                      ? "text-red-400"
                      : "text-green-400"
                      }`}
                  >
                    {fmt(tickerData?.c, 8)} {selected.quoteAsset}
                  </div>
                </div>

                {/* 24h Change */}
                <div>
                  <div className="text-[#A489F5] text-xs font-bold mb-1">
                    24h Change
                  </div>
                  <div
                    className={`font-semibold ${tickerData && parseFloat(tickerData.P) < 0
                      ? "text-red-400"
                      : "text-white"
                      }`}
                  >
                    ({fmt(tickerData?.P, 2)}%)
                  </div>
                </div>

                {/* High */}
                <div>
                  <div className="text-[#A489F5] text-xs font-bold mb-1">
                    24h High
                  </div>
                  <div className="font-semibold">{fmt(tickerData?.h, 2)}</div>
                </div>

                {/* Low */}
                <div>
                  <div className="text-[#A489F5] text-xs font-bold mb-1">
                    24h Low
                  </div>
                  <div className="font-semibold">{fmt(tickerData?.l, 2)}</div>
                </div>

                {/* Base Volume */}
                <div>
                  <div className="text-[#A489F5] font-bold text-xs mb-1">
                    24h Volume ({selected.baseAsset})
                  </div>
                  <div className="font-semibold">{fmt(tickerData?.v, 2)}</div>
                </div>

                {/* Quote Volume */}
                <div>
                  <div className="text-[#A489F5] font-bold text-xs mb-1">
                    24h Volume ({selected.quoteAsset})
                  </div>
                  <div className="font-semibold">{fmt(tickerData?.q, 2)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex h-[45vh] sm:h-[70vh]  ">
            <div className="w-full space-x-2 h-full flex flex-col gap-4">
              {/* Desktop: Show Chart Directly */}
              <div className="hidden  h-full sm:block flex-1 ">
                <h2 className="text-base  rounded-md sm:text-lg font-semibold"></h2>
                <iframe
                  src={
                    mode === "spot"
                      ? `https://www.tradingview.com/widgetembed/?symbol=BINANCE:${selected.symbol.toUpperCase()}&interval=D&theme=dark&hidetoptoolbar=1&saveimage=0&toolbarbg=`
                      : `https://www.tradingview.com/widgetembed/?symbol=BINANCE:${selected.symbol.toUpperCase()}.P&interval=D&theme=dark&hidetoptoolbar=1&saveimage=0&toolbarbg=`
                  }
                  className="w-full h-[400px] sm:h-[490px] rounded-md"
                  frameBorder="0"
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

            <div className="hidden  w-2/5 lg:block">{renderTradeForm()}</div>
          </div>

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
                  <h2 className="text-lg font-semibold">
                    Trade {selected.symbol}
                  </h2>
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
      ) : (
        <div>
          {/* <OptionsChain/> */}
          <OptionsChainFinal
            selectedChallenge={selectedChallenge}
            refreshChallengeWallet={refreshChallengeWallet}
          />
        </div>
      )}
    </div>
  );
};

export default Trading;
