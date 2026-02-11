// import React, { useContext, useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { WalletContext } from "../contexts/WalletContext";
// import {
//   ChevronDown,
//   History,
//   TrendingDown,
//   TrendingUp,
//   CheckCircle,
//   XCircle,
//   X,
// } from "lucide-react";

// import toast from "react-hot-toast";

// const baseURL = import.meta.env.VITE_API_BASE_URL;
// const OrderHistory = ({selectedChallenge , walletData,
// walletLoading,}) => {
//   const [orderHistory, setOrderHistory] = useState([]);

//   console.log(selectedChallenge,"the seleted data in holdings of challnge")

// const [holdings, setHoldings] = useState(() => {
//   const saved = localStorage.getItem("cachedHoldings_OrderHistory");
//   return saved ? JSON.parse(saved) : [];
// });
//   // console.log(holdings, "the holdings");
//   const [isloading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [selectedOrder, setSelectedOrder] = useState(null);
//   const [toggleOption, setToggleOption] = useState("Spot");
//   const options = ["Spot", "Futures", "Options"];

//   // console.log(selectedOrder, "the seleted order");
//   const { balance, refreshWallet, loading } = useContext(WalletContext);
//   const [expandedRows, setExpandedRows] = useState([]);
//   const [activeTab, setActiveTab] = useState("orderHistory");
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");
//   const [spotSide, setSpotSide] = useState("buy");
//   const [amount, setAmount] = useState("");
//   const [showTooltip, setShowTooltip] = useState(false);
//   const [lastTradePrice, setLastTradePrice] = useState(null);
//   const [livePrices, setLivePrices] = useState({});

//   // console.log(livePrices, "the live price");

//   const [isPlacingOrder, setIsPlacingOrder] = useState(false);
//   const navigate = useNavigate();
//   const tokens = JSON.parse(localStorage.getItem("authTokens"));

//   const handleModalOrder = async () => {
//     if (amount <= 0) {
//       toast.custom(
//         (t) => (
//           <div
//             className={`${
//               t.visible ? "animate-enter" : "animate-leave"
//             } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}
//           >
//             <div className="flex-1 w-0 p-4 flex items-center">
//               <XCircle className="h-6 w-6 text-red-500 mr-2" />
//               <p className="text-sm font-medium :text-gray-100">
//                 Please enter a valid quantity
//               </p>
//             </div>
//           </div>
//         ),
//         { position: "top-right", duration: 2500 }
//       );
//       return;
//     }

//     try {
//       setIsPlacingOrder(true);

//       if (!tokens?.access) {
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
//                   You must be logged in!
//                 </p>
//               </div>
//             </div>
//           ),
//           { position: "top-right", duration: 2500 }
//         );
//         return;
//       }

//       if (spotSide === "sell") {
//         const sellAmount = parseFloat(amount);
//         const isFull = sellAmount >= selectedOrder.remaining_quantity;

//         let response;

//         if (isFull) {
//           const payload = {
//             quantity: sellAmount.toFixed(8),
//             price: Number(lastTradePrice).toFixed(2),
//           };

//           response = await fetch(
//             `${baseURL}trading/close-trade/${selectedOrder.id}/`,
//             {
//               method: "POST",
//               headers: {
//                 "Content-Type": "application/json",
//                 Authorization: `Bearer ${tokens.access}`,
//               },
//               body: JSON.stringify(payload),
//             }
//           );
//         } else {
//           const payload = {
//             quantity: sellAmount.toFixed(8),
//             price: Number(lastTradePrice).toFixed(2),
//           };

//           response = await fetch(
//             `${baseURL}trading/partial-close/${selectedOrder.id}/`,
//             {
//               method: "POST",
//               headers: {
//                 "Content-Type": "application/json",
//                 Authorization: `Bearer ${tokens.access}`,
//               },
//               body: JSON.stringify(payload),
//             }
//           );
//         }

//         const data = await response.json();
//         console.log(data, "the order place status data");

//         if (response.ok) {
//           toast.custom(
//             (t) => (
//               <div
//                 className={`${
//                   t.visible ? "animate-enter" : "animate-leave"
//                 } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}
//               >
//                 <div className="flex-1 w-0 p-4 flex items-center">
//                   <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
//                   <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
//                     {isFull
//                       ? "Trade closed successfully!"
//                       : `Sold ${sellAmount} ${
//                           selectedOrder.asset_symbol
//                         } @ ${Number(selectedOrder.average_price).toFixed(2)}`}
//                   </p>
//                 </div>
//               </div>
//             ),
//             { position: "top-right", duration: 2500 }
//           );
//           await refreshWallet();
//           setSelectedOrder(null);
//           setAmount(0);
//           await fetchData();
//         } else {
//           toast.custom(
//             (t) => (
//               <div
//                 className={`${
//                   t.visible ? "animate-enter" : "animate-leave"
//                 } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}
//               >
//                 <div className="flex-1 w-0 p-4 flex items-center">
//                   <XCircle className="h-6 w-6 text-red-500 mr-2" />
//                   <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
//                     Error:{" "}
//                     {data.detail || data.message || "Something went wrong"}
//                   </p>
//                 </div>
//               </div>
//             ),
//             { position: "top-right", duration: 2500 }
//           );
//         }
//       } else {
//         // BUY logic
//         const payload = {
//           asset_symbol: selectedOrder.asset_symbol,
//           asset_name: selectedOrder.asset_name || "Btc",
//           asset_exchange: selectedOrder.asset_exchange || "BINANCE",
//           trade_type: "SPOT",
//           direction: "BUY",
//           holding_type: "LONGTERM",
//           quantity: amount.toString(),
//           price: Number(lastTradePrice).toFixed(2),
//           order_type: "MARKET",
//         };

//         const response = await fetch(`${baseURL}trading/place-order/`, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${tokens.access}`,
//           },
//           body: JSON.stringify(payload),
//         });

//         const data = await response.json();

//         if (response.ok) {
//           toast.custom(
//             (t) => (
//               <div
//                 className={`${
//                   t.visible ? "animate-enter" : "animate-leave"
//                 } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}
//               >
//                 <div className="flex-1 w-0 p-4 flex items-center">
//                   <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
//                   <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
//                     Order placed: {data.action} {data.quantity} @ {data.price}
//                   </p>
//                 </div>
//               </div>
//             ),
//             { position: "top-right", duration: 2500 }
//           );
//           await refreshWallet();
//           setSelectedOrder(null);
//           setAmount(0);
//           await fetchData();
//         } else {
//           toast.custom(
//             (t) => (
//               <div
//                 className={`${
//                   t.visible ? "animate-enter" : "animate-leave"
//                 } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}
//               >
//                 <div className="flex-1 w-0 p-4 flex items-center">
//                   <XCircle className="h-6 w-6 text-red-500 mr-2" />
//                   <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
//                     Error: {data.detail || "Something went wrong"}
//                   </p>
//                 </div>
//               </div>
//             ),
//             { position: "top-right", duration: 2500 }
//           );
//         }
//       }
//     } catch (error) {
//       console.error(error);
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
//                 Failed to place order
//               </p>
//             </div>
//           </div>
//         ),
//         { position: "top-right", duration: 2500 }
//       );
//     } finally {
//       setIsPlacingOrder(false);
//     }
//   };

//   const [selectedFuturesOrder, setSelectedFuturesOrder] = useState(null);

//   const [futuresLeverage, setFuturesLeverage] = useState(1);
//   const [futuresMarginType, setFuturesMarginType] = useState("CROSS");
//   const [selectedOptionsOrder, setSelectedOptionsOrder] = useState(null);

//   // console.log(selectedOptionsOrder, "the seleted options order");

//   const [optionsAmount, setOptionsAmount] = useState("");
//   const [isPlacingOptionsOrder, setIsPlacingOptionsOrder] = useState(false);

//   const handleFuturesModalOrder = async (side) => {
//     if (futuresAmount <= 0) {
//       toast.custom(
//         (t) => (
//           <div
//             className={`${
//               t.visible ? "animate-enter" : "animate-leave"
//             } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}
//           >
//             <div className="flex-1 w-0 p-4 flex items-center">
//               <XCircle className="h-6 w-6 text-red-500 mr-2" />
//               <p className="text-sm font-medium  text-gray-100">
//                 Please enter a valid quantity
//               </p>
//             </div>
//           </div>
//         ),
//         { position: "top-right", duration: 2500 }
//       );
//       return;
//     }

//     try {
//       setIsPlacingFuturesOrder(true);

//       if (!tokens?.access) {
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
//                   You must be logged in!
//                 </p>
//               </div>
//             </div>
//           ),
//           { position: "top-right", duration: 2500 }
//         );
//         return;
//       }

//       if (side === "sell") {
//         // SELL/CLOSE logic
//         const sellAmount = parseFloat(futuresAmount);
//         const isFull = sellAmount >= selectedFuturesOrder.remaining_quantity;

//         let response;

//         if (isFull) {
//           const payload = {
//             quantity: sellAmount.toFixed(3),
//             price: Number(futuresLastTradePrice).toFixed(2),
//           };

//           response = await fetch(
//             `${baseURL}trading/close-trade/${selectedFuturesOrder.id}/`,
//             {
//               method: "POST",
//               headers: {
//                 "Content-Type": "application/json",
//                 Authorization: `Bearer ${tokens.access}`,
//               },
//               body: JSON.stringify(payload),
//             }
//           );
//         } else {
//           const payload = {
//             quantity: sellAmount.toFixed(3),
//             price: Number(futuresLastTradePrice).toFixed(2),
//           };

//           response = await fetch(
//             `${baseURL}trading/partial-close/${selectedFuturesOrder.id}/`,
//             {
//               method: "POST",
//               headers: {
//                 "Content-Type": "application/json",
//                 Authorization: `Bearer ${tokens.access}`,
//               },
//               body: JSON.stringify(payload),
//             }
//           );
//         }

//         const data = await response.json();

//         if (response.ok) {
//           toast.custom(
//             (t) => (
//               <div
//                 className={`${
//                   t.visible ? "animate-enter" : "animate-leave"
//                 } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}
//               >
//                 <div className="flex-1 w-0 p-4 flex items-center">
//                   <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
//                   <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
//                     {isFull
//                       ? "Position closed successfully!"
//                       : `Closed ${sellAmount} contracts @ ${Number(
//                           futuresLastTradePrice
//                         ).toFixed(2)}`}
//                   </p>
//                 </div>
//               </div>
//             ),
//             { position: "top-right", duration: 2500 }
//           );
//           await refreshWallet();
//           setSelectedFuturesOrder(null);
//           setFuturesAmount("");
//           await fetchData();
//         } else {
//           toast.custom(
//             (t) => (
//               <div
//                 className={`${
//                   t.visible ? "animate-enter" : "animate-leave"
//                 } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}
//               >
//                 <div className="flex-1 w-0 p-4 flex items-center">
//                   <XCircle className="h-6 w-6 text-red-500 mr-2" />
//                   <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
//                     Error:{" "}
//                     {data.detail || data.message || "Something went wrong"}
//                   </p>
//                 </div>
//               </div>
//             ),
//             { position: "top-right", duration: 2500 }
//           );
//         }
//       } else {
//         // BUY/LONG logic

//         const expiryDate = new Date();
//         expiryDate.setDate(expiryDate.getDate() + 30);
//         const formattedExpiryDate = expiryDate.toISOString().split("T")[0];

//         const payload = {
//           asset_symbol: selectedFuturesOrder.asset_symbol.toUpperCase(),
//           asset_name: selectedFuturesOrder.asset_name || "Bitcoin Perpetual",
//           asset_exchange: "DELTA",
//           trade_type: "FUTURES",
//           direction: "BUY",
//           holding_type: selectedFuturesOrder.holding_type || "SHORTTERM",
//           quantity: futuresAmount.toString(),
//           price: Number(futuresLastTradePrice).toFixed(2),
//           order_type: "MARKET",
//           leverage: futuresLeverage,
//           contract_size: parseFloat(
//             selectedFuturesOrder?.contract_value || "0.001"
//           ).toFixed(8),
//           expiry_date: formattedExpiryDate,
//         };

//         const response = await fetch(`${baseURL}trading/place-order/`, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${tokens.access}`,
//           },
//           body: JSON.stringify(payload),
//         });

//         const data = await response.json();
//         console.log(data, "tthe resonseof long in holdings");

//         if (response.ok) {
//           toast.custom(
//             (t) => (
//               <div
//                 className={`${
//                   t.visible ? "animate-enter" : "animate-leave"
//                 } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}
//               >
//                 <div className="flex-1 w-0 p-4 flex items-center">
//                   <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
//                   <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
//                     Long position opened: {data.quantity} contracts @{" "}
//                     {data.price}
//                   </p>
//                 </div>
//               </div>
//             ),
//             { position: "top-right", duration: 2500 }
//           );
//           await refreshWallet();
//           setSelectedFuturesOrder(null);
//           setFuturesAmount("");
//           await fetchData();
//         } else {
//           toast.custom(
//             (t) => (
//               <div
//                 className={`${
//                   t.visible ? "animate-enter" : "animate-leave"
//                 } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}
//               >
//                 <div className="flex-1 w-0 p-4 flex items-center">
//                   <XCircle className="h-6 w-6 text-red-500 mr-2" />
//                   <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
//                     Error: {data.detail || "Something went wrong"}
//                   </p>
//                 </div>
//               </div>
//             ),
//             { position: "top-right", duration: 2500 }
//           );
//         }
//       }
//     } catch (error) {
//       console.error(error);
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
//                 Failed to place order
//               </p>
//             </div>
//           </div>
//         ),
//         { position: "top-right", duration: 2500 }
//       );
//     } finally {
//       setIsPlacingFuturesOrder(false);
//     }
//   };

//   const [optionsLastTradePrice, setOptionsLastTradePrice] = useState(null);
//   const [optionsStrikePrice, setOptionsStrikePrice] = useState(null);

//   // console.log(optionsLastTradePrice,"the optionsLastTradePrice")

//   const handleOptionsModalOrder = async (side) => {
//     if (optionsAmount <= 0) {
//       toast.custom(
//         (t) => (
//           <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
//             <XCircle className="h-6 w-6 text-red-500" />
//             <p className="text-sm text-gray-100 font-medium">Please enter a valid quantity</p>
//           </div>
//         ),
//         { position: "top-right", duration: 2500 }
//       );
//       return;
//     }

//     try {
//       setIsPlacingOptionsOrder(true);

//       if (!tokens?.access) {
//         toast.custom(
//           (t) => (
//             <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
//               <XCircle className="h-6 w-6 text-red-500" />
//               <p className="text-sm font-medium">You must be logged in!</p>
//             </div>
//           ),
//           { position: "top-right", duration: 2500 }
//         );
//         return;
//       }

//       let response;

//       if (side === "sell") {
//         // SELL / CLOSE OPTIONS POSITION
//         const sellAmount = parseFloat(optionsAmount);
//         const isFull = sellAmount >= selectedOptionsOrder.remaining_quantity;

//         // Use live price from WebSocket or fallback to stored premium
//         const currentPrice = optionsLastTradePrice
//           ? parseFloat(optionsLastTradePrice)
//           : parseFloat(selectedOptionsOrder.options_details?.premium || 0);

//         const payload = {
//           quantity: sellAmount.toFixed(8),
//           price: currentPrice.toFixed(2),
//         };

//         const url = isFull
//           ? `${baseURL}trading/close-trade/${selectedOptionsOrder.id}/`
//           : `${baseURL}trading/partial-close/${selectedOptionsOrder.id}/`;

//         response = await fetch(url, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${tokens.access}`,
//           },
//           body: JSON.stringify(payload),
//         });

//         const data = await response.json();

//         console.log(data,"the repose of option data")

//         if (response.ok) {
//           toast.custom(
//             (t) => (
//               <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
//                 <CheckCircle className="h-6 w-6 text-green-500" />
//                 <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
//                   {isFull
//                     ? "Option position closed successfully!"
//                     : `Closed ${sellAmount} contracts @ ${currentPrice.toFixed(
//                         2
//                       )}`}
//                 </p>
//               </div>
//             ),
//             { position: "top-right", duration: 2500 }
//           );

//           await refreshWallet();
//           setSelectedOptionsOrder(null);
//           setOptionsAmount("");
//           await fetchData();
//         } else {
//           toast.custom(
//             (t) => (
//               <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
//                 <XCircle className="h-6 w-6 text-red-500" />
//                 <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
//                   Error: {data.detail || data.message || "Something went wrong"}
//                 </p>
//               </div>
//             ),
//             { position: "top-right", duration: 2500 }
//           );
//         }
//       } else {
//         // BUY / OPEN OPTIONS POSITION

//         // Use live price from WebSocket or fallback
//         const currentPrice = optionsLastTradePrice
//           ? parseFloat(optionsLastTradePrice)
//           : parseFloat(selectedOptionsOrder.options_details?.premium || 0);

//         const payload = {
//           asset_symbol: selectedOptionsOrder.asset_symbol.toUpperCase(),
//           asset_name: selectedOptionsOrder.asset_name || "Options Contract",
//           trade_type: "OPTIONS",
//           direction: "BUY",
//           quantity: parseFloat(optionsAmount).toFixed(8),
//           price: currentPrice.toFixed(3),
//           option_type:
//             selectedOptionsOrder.options_details?.option_type || "CALL",
//           holding_type: selectedOptionsOrder.holding_type || "INTRADAY",
//           option_position: "LONG",
//           strike_price: optionsStrikePrice,
//           expiry_date:
//             selectedOptionsOrder.options_details?.expiry_date ||
//             new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
//               .toISOString()
//               .split("T")[0],
//           premium: (parseFloat(optionsAmount) * currentPrice).toFixed(7),
//         };

//         console.log("Options BUY Payload:", payload);

//         response = await fetch(`${baseURL}trading/place-order/`, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${tokens.access}`,
//           },
//           body: JSON.stringify(payload),
//         });

//         const data = await response.json();
//         console.log("Options BUY Response:", data);

//         if (response.ok) {
//           toast.custom(
//             (t) => (
//               <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
//                 <CheckCircle className="h-6 w-6 text-green-500" />
//                 <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
//                   Bought {optionsAmount} {payload.option_type} contracts @{" "}
//                   {currentPrice.toFixed(2)}
//                 </p>
//               </div>
//             ),
//             { position: "top-right", duration: 2500 }
//           );

//           await refreshWallet();
//           setSelectedOptionsOrder(null);
//           setOptionsAmount("");
//           await fetchData();
//         } else {
//           toast.custom(
//             (t) => (
//               <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
//                 <XCircle className="h-6 w-6 text-red-500" />
//                 <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
//                   Error: {data.detail || data.error || "Something went wrong"}
//                 </p>
//               </div>
//             ),
//             { position: "top-right", duration: 2500 }
//           );
//         }
//       }
//     } catch (error) {
//       console.error("Options order error:", error);
//       toast.custom(
//         (t) => (
//           <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
//             <XCircle className="h-6 w-6 text-red-500" />
//             <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
//               Failed to place options order
//             </p>
//           </div>
//         ),
//         { position: "top-right", duration: 2500 }
//       );
//     } finally {
//       setIsPlacingOptionsOrder(false);
//     }
//   };

//   useEffect(() => {
//     if (activeTab !== "holdings" || holdings.length === 0) return;

//     // 🔹 Separate holdings by trade type
//     const spotHoldings = holdings.filter((h) => h.trade_type === "SPOT");
//     const futuresHoldings = holdings.filter((h) => h.trade_type === "FUTURES");
//     const optionsHoldings = holdings.filter((h) => h.trade_type === "OPTIONS");
//     console.log(optionsHoldings, "the options holdings");

//     let binanceWs, deltaWs, deltaOptionsWs;
//     // ===========================
//     // 🔸 1. BINANCE (SPOT)
//     // ===========================
//     if (spotHoldings.length > 0) {
//       const streams = spotHoldings
//         .map((h) => `${h.asset_symbol.toLowerCase()}usdt@trade`)
//         .join("/");

//       if (streams) {
//         binanceWs = new WebSocket(
//           `wss://stream.binance.com:9443/stream?streams=${streams}`
//         );

//         binanceWs.onmessage = (event) => {
//           const response = JSON.parse(event.data);
//           if (response.data && response.data.s && response.data.p) {
//             const symbol = response.data.s.replace("USDT", "");
//             setLivePrices((prev) => ({
//               ...prev,
//               [symbol]: response.data.p,
//             }));
//           }
//         };

//         binanceWs.onerror = (error) =>
//           console.error("Binance Holdings WebSocket error:", error);
//       }
//     }

//     // ===========================
//     // 🔸 2. DELTA (FUTURES)
//     // ===========================
//     if (futuresHoldings.length > 0) {
//       deltaWs = new WebSocket("wss://socket.delta.exchange");

//       deltaWs.onopen = () => {
//         const payload = {
//           type: "subscribe",
//           payload: {
//             channels: [
//               {
//                 name: "v2/ticker",
//                 symbols: futuresHoldings.map((h) =>
//                   h.asset_symbol.toUpperCase()
//                 ),
//               },
//             ],
//           },
//         };
//         deltaWs.send(JSON.stringify(payload));

//         console.log(payload, "the payload of options");
//       };
//       deltaWs.onmessage = (event) => {
//         const response = JSON.parse(event.data);

//         // console.log(response, "the respose of delta");

//         // Only process ticker updates
//         if (
//           response?.type === "v2/ticker" &&
//           response?.symbol &&
//           response?.mark_price
//         ) {
//           const symbol = response.symbol;
//           setLivePrices((prev) => ({
//             ...prev,
//             [symbol]: response.spot_price,
//           }));
//         }
//       };

//       deltaWs.onerror = (error) =>
//         console.error("Delta Holdings WebSocket error:", error);
//     }

//     if (optionsHoldings.length > 0) {
//       deltaOptionsWs = new WebSocket("wss://socket.delta.exchange");

//       deltaOptionsWs.onopen = () => {
//         const payload = {
//           type: "subscribe",
//           payload: {
//             channels: [
//               {
//                 name: "v2/ticker",
//                 symbols: optionsHoldings.map((h) => h.asset_symbol), // Use full symbol
//               },
//             ],
//           },
//         };
//         deltaOptionsWs.send(JSON.stringify(payload));
//         console.log("Options WS Subscribed:", payload);
//       };

//       deltaOptionsWs.onmessage = (event) => {
//         const response = JSON.parse(event.data);

//         // Process ticker updates for options
//         if (response?.type === "v2/ticker" && response?.symbol) {
//           const symbol = response.symbol;

//           // Use mark_price for options (most accurate for premium)
//           const price =
//             response.mark_price || response.close || response.spot_price;

//           setLivePrices((prev) => ({
//             ...prev,
//             [symbol]: price,
//           }));
//         }
//       };

//       deltaOptionsWs.onerror = (error) =>
//         console.error("Delta Options WebSocket error:", error);
//     }

//     // ===========================
//     // 🔹 Cleanup
//     // ===========================
//     return () => {
//       if (binanceWs) binanceWs.close();
//       if (deltaWs) deltaWs.close();
//     };
//   }, [activeTab, holdings]);

//   const maxAmount =
//     spotSide === "buy"
//       ? balance / Number(lastTradePrice)
//       : selectedOrder?.remaining_quantity;
//   const totalValue =
//     amount * Number(spotSide === "buy" ? lastTradePrice : lastTradePrice);

//   // console.log(totalValue,"the total value")

//   useEffect(() => {
//     if (!selectedOrder?.asset_symbol) return;

//     const symbol = `${selectedOrder.asset_symbol.toLowerCase()}usdt`;

//     const ws = new WebSocket(
//       `wss://stream.binance.com:9443/ws/${symbol}@trade`
//     );

//     ws.onmessage = (event) => {
//       const data = JSON.parse(event.data);
//       if (data?.p) {
//         setLastTradePrice(data.p);
//       }
//     };

//     ws.onerror = (error) => console.error("WebSocket error:", error);

//     return () => {
//       ws.close();
//     };
//   }, [selectedOrder]);

//   useEffect(() => {
//     if (!selectedFuturesOrder?.asset_symbol) return;

//     const ws = new WebSocket("wss://socket.delta.exchange");

//     ws.onopen = () => {
//       const payload = {
//         type: "subscribe",
//         payload: {
//           channels: [
//             {
//               name: "v2/ticker",
//               symbols: [selectedFuturesOrder.asset_symbol.toUpperCase()],
//             },
//           ],
//         },
//       };
//       ws.send(JSON.stringify(payload));
//     };

//     ws.onmessage = (event) => {
//       const data = JSON.parse(event.data);
//       if (data?.type === "v2/ticker" && data?.close) {
//         setFuturesLastTradePrice(data.close);
//       }
//     };

//     ws.onerror = (error) => console.error("Futures WebSocket error:", error);

//     return () => {
//       ws.close();
//     };
//   }, [selectedFuturesOrder]);

//   useEffect(() => {
//     if (!selectedOptionsOrder?.asset_symbol) return;

//     const ws = new WebSocket("wss://socket.delta.exchange");

//     ws.onopen = () => {
//       const payload = {
//         type: "subscribe",
//         payload: {
//           channels: [
//             {
//               name: "v2/ticker",
//               symbols: [selectedOptionsOrder.asset_symbol], // Full symbol like "C-BTC-95000-231224"
//             },
//           ],
//         },
//       };
//       ws.send(JSON.stringify(payload));
//     };

//     ws.onmessage = (event) => {
//       const data = JSON.parse(event.data);

//       // console.log(data, "theeeeeeeeeeeeeeeeeee dataaaaaaaaaaaa");

//       if (data?.type === "v2/ticker" && data?.mark_price) {
//         setOptionsLastTradePrice(data.mark_price);
//         setOptionsStrikePrice(data.strike_price);
//       }
//     };

//     ws.onerror = (error) =>
//       console.error("Options Modal WebSocket error:", error);

//     return () => {
//       ws.close();
//     };
//   }, [selectedOptionsOrder]);

//   useEffect(() => {
//     setAmount("");
//   }, [spotSide]);

//   const fetchData = async () => {
//     setLoading(true);
//     setError(null);

//     try {
//       // Determine which API endpoint to use based on selectedChallenge
//       const apiUrl = selectedChallenge?.weekData?.id
//         ? `${baseURL}challenges/trades/?week_id=${selectedChallenge.weekData.id}`
//         : `${baseURL}trading/api/trading/trades/`;

//       const response = await fetch(apiUrl, {
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${tokens?.access}`,
//         },
//       });

//       console.log(response, "responseresponseresponse");

//       if (response.status === 401) {
//         const errorData = await response.json();

//         if (
//           errorData?.code === "token_not_valid" ||
//           errorData?.detail === "Given token not valid for any token type"
//         ) {
//           localStorage.removeItem("authTokens");
//           navigate("/login");
//           return;
//         }
//         throw new Error("Unauthorized access");
//       }

//       if (!response.ok) {
//         const errorData = await response.json().catch(() => ({}));
//         const message =
//           errorData?.detail || `HTTP error! status: ${response.status}`;
//         throw new Error(message);
//       }

//       const data = await response.json();

//       console.log(data, "Holdings and History RAW DATA");

//       let tradesArray;
//       if (selectedChallenge?.weekData?.id) {
//         // Challenges API - check if data is array or has results
//         tradesArray = Array.isArray(data) ? data : (data.results || []);
//       } else {
//         // Regular API
//         tradesArray = data.results || [];
//       }

//       console.log(tradesArray, "the trades array", typeof tradesArray, Array.isArray(tradesArray));
// // Ensure tradesArray is actually an array
// if (!Array.isArray(tradesArray)) {
//   console.error("tradesArray is not an array:", tradesArray);
//   tradesArray = [];
// }  
//       // Format order history from nested history array
//       const formattedHistory = tradesArray.flatMap((trade) =>
//         (trade.history || []).map((h) => ({
//           asset_symbol: trade.asset_symbol,
//           asset_name: trade.asset_name,
//           trade_type: trade.trade_type,
//           direction: trade.direction,
//           holding_type: trade.holding_type,
//           status: trade.status,
//           total_quantity: trade.total_quantity,
//           average_price: trade.average_entry_price || trade.average_price,
//           total_invested: trade.total_invested,
//           opened_at: trade.opened_at,
//           closed_at: trade.closed_at,
//           action: h.action,
//           order_type: h.order_type,
//           quantity: h.quantity,
//           price: h.price,
//           amount: h.amount,
//           realized_pnl: h.realized_pnl,
//           created_at: h.created_at,
//         }))
//       );

//       // Format holdings from main trade data
//       const formattedHoldings = tradesArray.map((trade) => ({
//         id: trade.id,
//         asset_symbol: trade.asset_symbol,
//         asset_name: trade.asset_name,
//         asset_exchange: trade.asset_exchange,
//         trade_type: trade.trade_type,
//         direction: trade.direction,
//         status: trade.status,
//         holding_type: trade.holding_type,
//         total_quantity: trade.total_quantity,
//         remaining_quantity: trade.remaining_quantity,
//         average_price: trade.average_entry_price || trade.average_price,
//         realized_pnl: trade.realized_pnl,
//         unrealized_pnl: trade.unrealized_pnl,
//         total_invested: trade.total_invested,
//         opened_at: trade.opened_at,
//         closed_at: trade.closed_at,
//         updated_at: trade.updated_at,
//         total_pnl: trade.total_pnl,
//         pnl_percentage: trade.pnl_percentage,
//         history: trade.history || [],
//       }));

//       setOrderHistory(formattedHistory);
//       setHoldings(formattedHoldings);
//     } catch (err) {
//       setError(err.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, [navigate]);

//   const [optionsSellQty, setOptionsSellQty] = useState(0);
//   const [isClosingOptions, setIsClosingOptions] = useState(false);

//   const [optionsQuantity, setOptionsQuantity] = useState(1);

//   const [futuresSpotSide, setFuturesSpotSide] = useState("buy");
//   const [futuresAmount, setFuturesAmount] = useState("");
//   const [futuresLastTradePrice, setFuturesLastTradePrice] = useState(null);
//   const [isPlacingFuturesOrder, setIsPlacingFuturesOrder] = useState(false);

//   const handleTradeClick = (holding) => {
//     if (holding.status === "OPEN" || holding.status === "PARTIALLY_CLOSED") {
//       if (holding.trade_type === "SPOT") {
//         setSelectedOrder(holding);
//         setAmount(holding.remaining_quantity);
//         setSpotSide("buy");
//       } else if (holding.trade_type === "FUTURES") {
//         setSelectedFuturesOrder(holding);
//         setFuturesAmount(holding.remaining_quantity);
//         setFuturesSpotSide("buy");
//       } else if (holding.trade_type === "OPTIONS") {
//         setSelectedOptionsOrder(holding);
//         setOptionsQuantity(holding.remaining_quantity);
//       }
//     }
//   };

//   const handleStart = () => setShowTooltip(true);
//   const handleEnd = () => setShowTooltip(false);

//   const handleSearch = () => {
//     console.log("Filtering from:", startDate, "to:", endDate);
//   };

//   const handleReset = () => {
//     setStartDate("");
//     setEndDate("");
//   };

//   const getOpenOrdersCount = () => {
//     return holdings.filter((h) => h.status === "OPEN").length;
//   };

//   const calculateLivePnL = (holding) => {
//     const currentPrice = livePrices[holding.asset_symbol];
//     // console.log(currentPrice, "the current priiiice");
//     if (!currentPrice) {
//       return {
//         pnl: holding.total_pnl,
//         percentage: holding.pnl_percentage,
//         isLive: false,
//       };
//     }

//     const price = Number(currentPrice);
//     const avgPrice = Number(holding.average_price);
//     const quantity = Number(holding.remaining_quantity);
//     const invested = Number(holding.total_invested);

//     let unrealizedPnL = 0;
//     if (holding.direction.toLowerCase() === "buy") {
//       unrealizedPnL = (price - avgPrice) * quantity;
//     } else {
//       unrealizedPnL = (avgPrice - price) * quantity;
//     }

//     const totalPnL = Number(holding.realized_pnl) + unrealizedPnL;
//     const pnlPercentage = invested > 0 ? (totalPnL / invested) * 100 : 0;

//     return {
//       pnl: totalPnL.toFixed(2),
//       percentage: pnlPercentage.toFixed(2),
//       unrealized: unrealizedPnL.toFixed(2),
//       realized: Number(holding.realized_pnl).toFixed(2),
//       currentPrice: price.toFixed(4),
//       isLive: true,
//     };
//   };

//   const filteredHistory = orderHistory.filter((order) => {
//     if (!startDate && !endDate) return true;
//     const orderDate = new Date(order.created_at);
//     const start = startDate ? new Date(startDate) : null;
//     const end = endDate ? new Date(endDate) : null;

//     if (start && end) {
//       return orderDate >= start && orderDate <= end;
//     } else if (start) {
//       return orderDate >= start;
//     } else if (end) {
//       return orderDate <= end;
//     }
//     return true;
//   });
//   // console.log("Filtered History:", filteredHistory);

//   return (
//     <div className="min-h-screen  text-white">
//       <div className="max-w-[1400px] mx-auto  ">
//         {/* <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
//           Order History
//         </h1> */}

//         {/* Tabs */}
//         <div className=" p-1 mb-6">
//           <div className="flex gap-2">
//             {[
//               // {
//               //   label: `Open Orders(${getOpenOrdersCount()})`,
//               //   value: "openOrders",
//               // },
//               { label: "Order History", value: "orderHistory" },
//               { label: "Holdings", value: "holdings" },
//               { label: "Closed Trades", value: "closed" },
//               // { label: "Bots", value: "bots" },
//             ].map((tab, idx) => (
//               <button
//                 key={idx}
//                 onClick={() => setActiveTab(tab.value)}
//                 className={`px-6 py-3   text-sm font-medium transition-all ${
//                   activeTab === tab.value
//                     ? " border-b border-white text-white"
//                     : "text-gray-400 hover:text-white"
//                 }`}
//               >
//                 {tab.label}
//               </button>
//             ))}
//           </div>


//         </div>

//         {/* Date Filter - Only show for Order History */}
//         {activeTab === "orderHistory" && (
//           <div className="  w-full  rounded-lg p-4 mb-6">
//             <div className="flex items-center gap-4">
//               <div className="flex items-center gap-2">
//                 <label className="text-gray-400 text-sm">From:</label>
//                 <input
//                   type="date"
//                   value={startDate}
//                   onChange={(e) => setStartDate(e.target.value)}
//                   className="bg-[#1E1F36] border border-gray-700 rounded px-3 py-2 text-sm text-white"
//                 />
//               </div>
//               <div className="flex items-center gap-2">
//                 <label className="text-gray-400 text-sm">To:</label>
//                 <input
//                   type="date"
//                   value={endDate}
//                   onChange={(e) => setEndDate(e.target.value)}
//                   className="bg-[#1E1F36] border border-gray-700 rounded px-3 py-2 text-sm text-white"
//                 />
//               </div>
//               <button
//                 onClick={handleSearch}
//                 className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded text-sm transition"
//               >
//                 Search
//               </button>
//               <button
//                 onClick={handleReset}
//                 className="text-gray-400 hover:text-white px-4 py-2 text-sm transition"
//               >
//                 Reset
//               </button>
//             </div>
//           </div>
//         )}

//         {/* Loading State */}
//         {isloading && (
//           <div className="text-center py-12">
//             <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-purple-500 mx-auto"></div>
//             <p className="text-gray-400 mt-4">Loading...</p>
//           </div>
//         )}

//         {/* Error State */}
//         {error && <div className=" text-red-400">{error}</div>}

//         {/* Order History Table */}
//         {!isloading && !error && activeTab === "orderHistory" && (
//           <div className="overflow-hidden">
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead>
//                   <tr className="border-b border-gray-800">
//                     <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">
//                       Date
//                     </th>
//                     <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">
//                       Name
//                     </th>
//                     <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">
//                       Type
//                     </th>
//                     <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">
//                       Side
//                     </th>
//                     <th className="text-right py-4 px-4 text-sm font-medium text-gray-400">
//                       Price
//                     </th>
//                     <th className="text-right py-4 px-4 text-sm font-medium text-gray-400">
//                       Amount
//                     </th>
//                     <th className="text-right font-bold py-4 px-4 text-sm  text-gray-400">
//                       Total (USDT)
//                     </th>
//                     {/* <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">
//                       Status
//                     </th> */}
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {filteredHistory.length > 0 ? (
//                     [...filteredHistory]
//                       .sort(
//                         (a, b) =>
//                           new Date(b.created_at) - new Date(a.created_at)
//                       )
//                       .map((order, idx) => (
//                         <tr
//                           key={idx}
//                           className="border-b border-gray-800 hover:bg-[#1E1F36] transition-colors"
//                         >
//                           <td className="py-4 px-4 text-sm text-gray-300">
//                             {new Date(order.created_at).toLocaleDateString(
//                               "en-US",
//                               {
//                                 year: "numeric",
//                                 month: "2-digit",
//                                 day: "2-digit",
//                               }
//                             )}
//                             <br />
//                             <span className="text-xs text-gray-500">
//                               {new Date(order.created_at).toLocaleTimeString()}
//                             </span>
//                           </td>
//                           <td className="py-4 px-4 text-sm font-medium text-white">
//                             {order.asset_symbol}
//                           </td>
//                           <td className="py-4 px-4 text-sm text-gray-300">
//                             {order.order_type}
//                           </td>
//                           <td className="py-4 px-4 text-sm">
//                             <span
//                               className={`${
//                                 order.action.toLowerCase() === "buy"
//                                   ? "text-green-400"
//                                   : "text-red-400"
//                               }`}
//                             >
//                               {order.action}
//                             </span>
//                           </td>
//                           <td className="py-4 px-4 text-sm text-right text-gray-300">
//                             {Number(order.price).toFixed(4)}
//                           </td>
//                           <td className="py-4 px-4 text-sm text-right text-gray-300">
//                             {Number(order.quantity).toFixed(6)}
//                           </td>
//                           <td className="py-4 font-bold px-4 text-sm text-right text-gray-300">
//                             {Number(order.amount).toFixed(4)}
//                           </td>
//                         </tr>
//                       ))
//                   ) : (
//                     <tr>
//                       <td
//                         colSpan={8}
//                         className="py-12 text-center text-gray-500"
//                       >
//                         No order history found
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         )}

//         {/* Holdings Table */}
//         {!isloading && !error && activeTab === "holdings" && (
//           <div className="rounded-lg px-6 overflow-hidden">
//             <div className="flex w-72 border rounded-md border-b border-gray-800">
//               {options.map((option) => (
//                 <button
//                   key={option}
//                   onClick={() => setToggleOption(option)}
//                   className={`flex-1 py-2 text-sm text-center  rounded-md transition duration-200  ${
//                     toggleOption === option
//                       ? "bg-purple-600/20 p-1  text-white backdrop-blur-md shadow-inner"
//                       : " text-gray-700 "
//                   }`}
//                 >
//                   {option}
//                 </button>
//               ))}
//             </div>

//             <div className="overflow-x-auto ">
//               <table className="w-full">
//                 <thead>
//                   <tr className="border-b border-gray-800">
//                     <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">
//                       Asset
//                     </th>
//                     <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">
//                       Type
//                     </th>
//                     <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">
//                       Side
//                     </th>
//                     <th className="text-right py-4 px-4 text-sm font-medium text-gray-400">
//                       Total Qty
//                     </th>
//                     <th className="text-right py-4 px-4 text-sm font-medium text-gray-400">
//                       Avg Price
//                     </th>
//                     <th className="text-right py-4 px-4 text-sm font-medium text-gray-400">
//                       Current Price
//                     </th>
//                     <th className="text-right py-4 px-4 text-sm font-medium text-gray-400">
//                       Invested
//                     </th>
//                     <th className="text-right py-4 px-4 text-sm font-medium text-gray-400">
//                       PnL (Live)
//                     </th>
//                     <th className="text-center py-4 px-4 text-sm font-medium text-gray-400">
//                       Status
//                     </th>
//                     <th className="text-center py-4 px-4 text-sm font-medium text-gray-400">
//                       Actions
//                     </th>
//                   </tr>
//                 </thead>

//                 {/* <tbody>
//                   {holdings.filter((holding) => holding.status !== "CLOSED")
//                     .length > 0 ? (
//                     holdings
//                       .filter((holding) => holding.status !== "CLOSED")
//                       .map((holding, idx) => {
//                         const pnlData = calculateLivePnL(holding);
//                         const isExpanded = expandedRows.includes(holding.id);

//                         return ( */}

//                 <tbody>
//                   {holdings.filter(
//                     (holding) =>
//                       holding.status !== "CLOSED" &&
//                       holding.trade_type === toggleOption.toUpperCase()
//                   ).length > 0 ? (
//                     holdings
//                       .filter(
//                         (holding) =>
//                           holding.status !== "CLOSED" &&
//                           holding.trade_type === toggleOption.toUpperCase()
//                       )
//                       .map((holding, idx) => {
//                         const pnlData = calculateLivePnL(holding);

//                         // console.log(pnlData,"the pnl data")
//                         const isExpanded = expandedRows.includes(holding.id);

//                         return (
//                           <React.Fragment key={idx}>
//                             {/* Main Row */}
//                             <tr className="border-b border-gray-800 hover:bg-[#1E1F36] transition-colors">
//                               <td className="py-4 px-4 text-sm font-medium text-white">
//                                 {holding.asset_symbol}
//                                 <br />
//                                 <span className="text-xs text-gray-500">
//                                   {holding.asset_name}
//                                 </span>
//                               </td>

//                               <td className="py-4 px-4 text-sm text-gray-300">
//                                 {holding.trade_type}
//                                 <br />
//                                 <span className="text-xs text-gray-500">
//                                   {holding.holding_type}
//                                 </span>
//                               </td>

//                               <td className="py-4 px-4 text-sm">
//                                 <span
//                                   className={`${
//                                     holding.direction.toLowerCase() === "buy"
//                                       ? "text-green-400"
//                                       : "text-red-400"
//                                   }`}
//                                 >
//                                   {holding.direction}
//                                 </span>
//                               </td>

//                               <td className="py-4 px-4 text-sm text-right text-gray-300">
//                                 {Number(holding.remaining_quantity).toFixed(6)}
//                               </td>

//                               <td className="py-4 px-4 text-sm text-right text-gray-300">
//                                 {Number(holding.average_price).toFixed(4)}
//                               </td>

//                               <td className="py-4 px-4 text-sm text-right text-gray-300">
//                                 {pnlData.isLive ? (
//                                   <span className="flex w-full font-bold items-center justify-end gap-1">
//                                     {pnlData.currentPrice}
//                                   </span>
//                                 ) : (
//                                   <span className="text-gray-500">-</span>
//                                 )}
//                               </td>

//                               <td className="py-4 px-4 text-sm text-right text-gray-300">
//                                 {Number(holding.total_invested).toFixed(2)}
//                               </td>

//                               <td className="py-4 w-28 px-4 text-sm text-right">
//                                 <div className="flex flex-col items-end">
//                                   <span
//                                     className={
//                                       Number(pnlData.pnl) >= 0
//                                         ? "text-green-400 font-semibold"
//                                         : "text-red-400 font-semibold"
//                                     }
//                                   >
//                                     {pnlData.pnl}
//                                   </span>
//                                   <span
//                                     className={`text-xs ${
//                                       Number(pnlData.pnl) >= 0
//                                         ? "text-green-400"
//                                         : "text-red-400"
//                                     }`}
//                                   >
//                                     ({Number(pnlData.percentage).toFixed(4)}%)
//                                   </span>
//                                 </div>
//                               </td>

//                               <td className="py-4 px-4 text-sm text-center">
//                                 <span
//                                   className={`px-3 py-1 rounded text-xs 
//                                  ${
//                                    //   holding.status === "OPEN"
//                                    // ?
//                                    "bg-blue-500/20 text-blue-400"
//                                    // : "bg-green-500/20 text-green-400"
//                                  }`}
//                                 >
//                                   {/* {holding.status} */}
//                                   OPEN
//                                 </span>
//                               </td>

//                               <td className="py-4 px-4 text-center">
//                                 <div className="flex justify-center items-center gap-2">
//                                   <button
//                                     onClick={() => handleTradeClick(holding)}
//                                     className="bg-[#D643BF]  hover:bg-[#b8329f] px-4 py-2 rounded text-xs font-semibold transition"
//                                   >
//                                     Trade
//                                   </button>

//                                   <button
//                                     className="px-2 py-2 rounded "
//                                     onClick={() =>
//                                       setExpandedRows((prev) =>
//                                         prev.includes(holding.id)
//                                           ? prev.filter(
//                                               (id) => id !== holding.id
//                                             )
//                                           : [...prev, holding.id]
//                                       )
//                                     }
//                                     title="History"
//                                   >
//                                     <History className="w-4 h-4" />
//                                   </button>
//                                 </div>
//                               </td>

//                               {/* Expand/Collapse Button */}
//                             </tr>

//                             {/* Expanded Section (separate row) */}
//                             {isExpanded && (
//                               <tr className=" border-b border-gray-800">
//                                 <td colSpan="12" className="p-6 ">
//                                   <div className="mb-4 flex items-center justify-between">
//                                     <h3 className="text-lg font-semibold text-gray-200 tracking-wide flex items-center gap-2">
//                                       {/* <span className="inline-block w-1.5 h-6 bg-indigo-500 rounded-full"></span> */}
//                                       History
//                                     </h3>
//                                     <span className="text-sm text-gray-400">
//                                       {holding?.history?.length || 0} record
//                                       {holding?.history?.length === 1
//                                         ? ""
//                                         : "s"}
//                                     </span>
//                                   </div>

//                                   <div className="overflow-x-auto    border-b border-gray-800 ">
//                                     <table className="min-w-full text-sm text-gray-300">
//                                       <thead>
//                                         <tr className="border-b border-gray-700">
//                                           <th className="p-3 text-left font-medium text-gray-400">
//                                             Action
//                                           </th>
//                                           <th className="p-3 text-left font-medium text-gray-400">
//                                             Order Type
//                                           </th>
//                                           <th className="p-3 text-left font-medium text-gray-400">
//                                             Quantity
//                                           </th>
//                                           <th className="p-3 text-left font-medium text-gray-400">
//                                             Price
//                                           </th>
//                                           <th className="p-3 text-left font-medium text-gray-400">
//                                             Amount
//                                           </th>
//                                           <th className="p-3 text-left font-medium text-gray-400">
//                                             Created At
//                                           </th>
//                                         </tr>
//                                       </thead>

//                                       <tbody>
//                                         {holding?.history?.length > 0 ? (
//                                           [...holding.history]
//                                             .sort(
//                                               (a, b) =>
//                                                 new Date(b.created_at) -
//                                                 new Date(a.created_at)
//                                             )
//                                             .map((h, i) => (
//                                               <tr
//                                                 key={h.id || i}
//                                                 className=" transition-colors duration-200"
//                                               >
//                                                 <td
//                                                   className={`p-3 capitalize font-medium ${
//                                                     h.action?.toLowerCase() ===
//                                                     "buy"
//                                                       ? "text-green-400"
//                                                       : h.action?.toLowerCase() ===
//                                                           "sell" ||
//                                                         h.action?.toLowerCase() ===
//                                                           "partial_sell"
//                                                       ? "text-red-400"
//                                                       : "text-gray-200"
//                                                   }`}
//                                                 >
//                                                   {h.action}
//                                                 </td>

//                                                 <td className="p-3 capitalize text-gray-200">
//                                                   {h.order_type}
//                                                 </td>
//                                                 <td className="p-3 text-gray-200">
//                                                   {parseFloat(
//                                                     h.quantity
//                                                   ).toFixed(4)}
//                                                 </td>
//                                                 <td className="p-3 text-gray-200">
//                                                   {parseFloat(h.price).toFixed(
//                                                     2
//                                                   )}
//                                                 </td>
//                                                 <td className="p-3 text-gray-200">
//                                                   {parseFloat(h.amount).toFixed(
//                                                     2
//                                                   )}
//                                                 </td>
//                                                 <td className="p-3 text-gray-400">
//                                                   {new Date(
//                                                     h.created_at
//                                                   ).toLocaleString()}
//                                                 </td>
//                                               </tr>
//                                             ))
//                                         ) : (
//                                           <tr>
//                                             <td
//                                               colSpan="7"
//                                               className="p-5 text-center text-gray-500 bg-[#141731]"
//                                             >
//                                               No order history found
//                                             </td>
//                                           </tr>
//                                         )}
//                                       </tbody>
//                                     </table>
//                                   </div>
//                                 </td>
//                               </tr>
//                             )}
//                           </React.Fragment>
//                         );
//                       })
//                   ) : (
//                     <tr>
//                       <td
//                         colSpan={12}
//                         className="py-12 text-center text-gray-500"
//                       >
//                         No holdings found
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         )}

//         {/* Open Orders Tab */}
//         {/* {!isloading && !error && activeTab === "openOrders" && (
//           <div className=" rounded-lg p-8 text-center">
//             <p className="text-gray-400">Open orders will be displayed here</p>
//           </div>
//         )} */}

//         {/* Closed Tab */}
//         {!isloading && !error && activeTab === "closed" && (
//           <div className="rounded-lg overflow-hidden">
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead>
//                   <tr className="border-b border-gray-800">
//                     <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">
//                       Asset
//                     </th>
//                     <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">
//                       Type
//                     </th>
//                     {/* <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">
//                       Side
//                     </th> */}
//                     <th className="text-right py-4 px-4 text-sm font-medium text-gray-400">
//                       Total Qty
//                     </th>
//                     <th className="text-right py-4 px-4 text-sm font-medium text-gray-400">
//                       Avg Price
//                     </th>
//                     <th className="text-right py-4 px-4 text-sm font-medium text-gray-400">
//                       Price
//                     </th>
//                     <th className="text-right py-4 px-4 text-sm font-medium text-gray-400">
//                       Invested
//                     </th>
//                     <th className="text-right py-4 px-4 text-sm font-medium text-gray-400">
//                       PnL
//                     </th>
//                     <th className="text-center py-4 px-4 text-sm font-medium text-gray-400">
//                       Status
//                     </th>
//                     <th className="text-center py-4 px-4 text-sm font-medium text-gray-400">
//                       Actions
//                     </th>
//                   </tr>
//                 </thead>

//                 <tbody>
//                   {holdings.filter((holding) => holding.status == "CLOSED")
//                     .length > 0 ? (
//                     holdings
//                       .filter((holding) => holding.status == "CLOSED")
//                       .map((holding, idx) => {
//                         const pnlData = calculateLivePnL(holding);
//                         const isExpanded = expandedRows.includes(holding.id);

//                         return (
//                           <React.Fragment key={idx}>
//                             {/* Main Row */}
//                             <tr className="border-b border-gray-800 hover:bg-[#1E1F36] transition-colors">
//                               <td className="py-4 px-4 text-sm font-medium text-white">
//                                 {holding.asset_symbol}
//                                 <br />
//                                 <span className="text-xs text-gray-500">
//                                   {holding.asset_name}
//                                 </span>
//                               </td>

//                               <td className="py-4 px-4 text-sm text-gray-300">
//                                 {holding.trade_type}
//                                 <br />
//                                 <span className="text-xs text-gray-500">
//                                   {holding.holding_type}
//                                 </span>
//                               </td>

//                               {/* <td className="py-4 px-4 text-sm">
//                                 <span
//                                   className={`${
//                                     holding.direction.toLowerCase() === "buy"
//                                       ? "text-green-400"
//                                       : "text-red-400"
//                                   }`}
//                                 >
//                                   {holding.direction}
//                                 </span>
//                               </td> */}

//                               <td className="py-4 px-4 text-sm text-right text-gray-300">
//                                 {Number(holding.total_quantity).toFixed(6)}
//                               </td>

//                               <td className="py-4 px-4 text-sm text-right text-gray-300">
//                                 {Number(holding.average_price).toFixed(4)}
//                               </td>

//                               <td className="py-4 px-4 text-sm text-right text-gray-300">
//                                 <span className="flex w-full items-center justify-end gap-1">
//                                   {holding.history.find(
//                                     (item) => item.action === "SELL"
//                                   )
//                                     ? parseFloat(
//                                         holding.history.find(
//                                           (item) => item.action === "SELL"
//                                         ).price
//                                       ).toFixed(4)
//                                     : " - "}
//                                 </span>
//                               </td>

//                               <td className="py-4 px-4 text-sm text-right text-gray-300">
//                                 {Number(holding.total_invested).toFixed(2)}
//                               </td>

//                               <td className="py-4 w-28 px-4 text-sm text-right">
//                                 <div className="flex flex-col items-end">
//                                   <span
//                                     className={
//                                       Number(holding.realized_pnl) >= 0
//                                         ? "text-green-400 font-semibold"
//                                         : "text-red-400 font-semibold"
//                                     }
//                                   >
//                                     {holding.realized_pnl}
//                                   </span>
//                                   <span
//                                     className={`text-xs ${
//                                       Number(pnlData.pnl) >= 0
//                                         ? "text-green-400"
//                                         : "text-red-400"
//                                     }`}
//                                   >
//                                     ({Number(holding.pnl_percentage).toFixed(4)}
//                                     %)
//                                   </span>
//                                 </div>
//                               </td>

//                               <td className="py-4 px-4 text-sm text-center">
//                                 <span
//                                   className={`px-3 py-1 rounded text-xs 
//                                  ${
//                                    holding.status === "OPEN"
//                                      ? "bg-blue-500/20 text-blue-400"
//                                      : "bg-green-500/20 text-green-400"
//                                  }`}
//                                 >
//                                   {holding.status}
//                                 </span>
//                               </td>

//                               <td className="py-4 px-4 text-center">
//                                 <div className="flex justify-center items-center gap-2">
//                                   {/* <button
//                                     onClick={() => handleTradeClick(holding)}
//                                     className="bg-[#D643BF]  hover:bg-[#b8329f] px-4 py-2 rounded text-xs font-semibold transition"
//                                   >
//                                     Trade
//                                   </button> */}

//                                   <button
//                                     className="px-2 py-2 rounded "
//                                     onClick={() =>
//                                       setExpandedRows((prev) =>
//                                         prev.includes(holding.id)
//                                           ? prev.filter(
//                                               (id) => id !== holding.id
//                                             )
//                                           : [...prev, holding.id]
//                                       )
//                                     }
//                                     title="History"
//                                   >
//                                     <History className="w-4 h-4" />
//                                   </button>
//                                 </div>
//                               </td>

//                               {/* Expand/Collapse Button */}
//                             </tr>

//                             {/* Expanded Section (separate row) */}
//                             {isExpanded && (
//                               <tr className=" border-b border-gray-800">
//                                 <td colSpan="12" className="p-6 ">
//                                   <div className="mb-4 flex items-center justify-between">
//                                     <h3 className="text-lg font-semibold text-gray-200 tracking-wide flex items-center gap-2">
//                                       {/* <span className="inline-block w-1.5 h-6 bg-indigo-500 rounded-full"></span> */}
//                                       History
//                                     </h3>
//                                     <span className="text-sm text-gray-400">
//                                       {holding?.history?.length || 0} record
//                                       {holding?.history?.length === 1
//                                         ? ""
//                                         : "s"}
//                                     </span>
//                                   </div>

//                                   <div className="overflow-x-auto    border-b border-gray-800 ">
//                                     <table className="min-w-full text-sm text-gray-300">
//                                       <thead>
//                                         <tr className="border-b border-gray-700">
//                                           <th className="p-3 text-left font-medium text-gray-400">
//                                             Action
//                                           </th>
//                                           <th className="p-3 text-left font-medium text-gray-400">
//                                             Order Type
//                                           </th>
//                                           <th className="p-3 text-left font-medium text-gray-400">
//                                             Quantity
//                                           </th>
//                                           <th className="p-3 text-left font-medium text-gray-400">
//                                             Price
//                                           </th>
//                                           <th className="p-3 text-left font-medium text-gray-400">
//                                             Amount
//                                           </th>
//                                           <th className="p-3 text-left font-medium text-gray-400">
//                                             Created At
//                                           </th>
//                                         </tr>
//                                       </thead>

//                                       <tbody>
//                                         {holding?.history?.length > 0 ? (
//                                           [...holding.history]
//                                             .sort(
//                                               (a, b) =>
//                                                 new Date(b.created_at) -
//                                                 new Date(a.created_at)
//                                             )
//                                             .map((h, i) => (
//                                               <tr
//                                                 key={h.id || i}
//                                                 className=" transition-colors duration-200"
//                                               >
//                                                 <td
//                                                   className={`p-3 capitalize font-medium ${
//                                                     h.action?.toLowerCase() ===
//                                                     "buy"
//                                                       ? "text-green-400"
//                                                       : h.action?.toLowerCase() ===
//                                                           "sell" ||
//                                                         h.action?.toLowerCase() ===
//                                                           "partial_sell"
//                                                       ? "text-red-400"
//                                                       : "text-gray-200"
//                                                   }`}
//                                                 >
//                                                   {h.action}
//                                                 </td>

//                                                 <td className="p-3 capitalize text-gray-200">
//                                                   {h.order_type}
//                                                 </td>
//                                                 <td className="p-3 text-gray-200">
//                                                   {parseFloat(
//                                                     h.quantity
//                                                   ).toFixed(4)}
//                                                 </td>
//                                                 <td className="p-3 text-gray-200">
//                                                   {parseFloat(h.price).toFixed(
//                                                     2
//                                                   )}
//                                                 </td>
//                                                 <td className="p-3 text-gray-200">
//                                                   {parseFloat(h.amount).toFixed(
//                                                     2
//                                                   )}
//                                                 </td>
//                                                 <td className="p-3 text-gray-400">
//                                                   {new Date(
//                                                     h.created_at
//                                                   ).toLocaleString()}
//                                                 </td>
//                                               </tr>
//                                             ))
//                                         ) : (
//                                           <tr>
//                                             <td
//                                               colSpan="7"
//                                               className="p-5 text-center text-gray-500 bg-[#141731]"
//                                             >
//                                               No order history found
//                                             </td>
//                                           </tr>
//                                         )}
//                                       </tbody>
//                                     </table>
//                                   </div>
//                                 </td>
//                               </tr>
//                             )}
//                           </React.Fragment>
//                         );
//                       })
//                   ) : (
//                     <tr>
//                       <td
//                         colSpan={12}
//                         className="py-12 text-center text-gray-500"
//                       >
//                         No holdings found
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         )}

//         {/* Bots Tab */}
//         {!isloading && !error && activeTab === "bots" && (
//           <div className="bg-[#13152E] rounded-lg p-8 text-center">
//             <p className="text-gray-400">Trading bots will be displayed here</p>
//           </div>
//         )}

//         {selectedOrder && (
//           <div className="fixed bottom-6 left-6 z-50 animate-in slide-in-from-bottom-4 duration-300">
//             <div
//               className={`rounded-xl shadow-2xl w-[420px] transition-all duration-300 border ${
//                 spotSide === "buy"
//                   ? "bg-[#0A1628] border-blue-500/30"
//                   : "bg-[#1A0A0F] border-red-500/30"
//               }`}
//             >
//               {/* Header */}
//               <div className="px-6 py-4 border-b border-gray-700/50">
//                 <div className="flex items-center justify-between mb-3">
//                   <div>
//                     <h3 className="text-xl font-bold text-white">
//                       {selectedOrder.asset_symbol}
//                     </h3>
//                     <p className="text-sm text-gray-400">
//                       {selectedOrder.asset_name}
//                     </p>
//                   </div>
//                   <button
//                     onClick={() => setSelectedOrder(null)}
//                     className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
//                   >
//                     <X size={20} className="text-gray-400" />
//                   </button>
//                 </div>

//                 {/* Buy/Sell Toggle */}
//                 <div className="flex gap-2">
//                   <button
//                     onClick={() => {
//                       setSpotSide("buy");
//                       setAmount(0);
//                     }}
//                     className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${
//                       spotSide === "buy"
//                         ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
//                         : "bg-gray-800/50 text-gray-400 border border-gray-700 hover:bg-gray-700/50"
//                     }`}
//                   >
//                     <div className="flex items-center justify-center gap-1.5">
//                       <TrendingUp size={16} />
//                       Buy
//                     </div>
//                   </button>
//                   <button
//                     onClick={() => {
//                       setSpotSide("sell");
//                       setAmount(0);
//                     }}
//                     className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${
//                       spotSide === "sell"
//                         ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
//                         : "bg-gray-800/50 text-gray-400 border border-gray-700 hover:bg-gray-700/50"
//                     }`}
//                   >
//                     <div className="flex items-center justify-center gap-1.5">
//                       <TrendingDown size={16} />
//                       Sell
//                     </div>
//                   </button>
//                 </div>
//               </div>

//               {/* Body */}
//               <div className="px-6 py-5">
//                 {/* Price Display */}
//                 <div
//                   className={`rounded-lg p-4 mb-4 border ${
//                     spotSide === "buy"
//                       ? "bg-blue-500/10 border-blue-500/30"
//                       : "bg-red-500/10 border-red-500/30"
//                   }`}
//                 >
//                   <div className="flex justify-between items-center">
//                     <span className="text-sm text-gray-400">
//                       {/* {spotSide === "buy" ?  */}
//                       {/* " */}
//                       Market Price
//                       {/* "  */}
//                       {/* : "Avg. Cost"} */}
//                     </span>
//                     <div className="text-right">
//                       <span className="text-2xl font-bold text-white">
//                         {/* {spotSide === "buy" */}
//                         {/* ? */}
//                         {Number(lastTradePrice).toFixed(2)}
//                         {/* : Number(selectedOrder.average_price).toFixed(2)} */}
//                       </span>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Quantity Input */}
//                 <div className="mb-4">
//                   <label className="text-sm font-medium text-gray-400 mb-2 block">
//                     Quantity
//                   </label>
//                   <input
//                     type="number"
//                     value={amount}
//                     onChange={(e) => {
//                       const value = e.target.value;
//                       // Allow empty string or valid number
//                       if (/^\d*$/.test(value)) {
//                         setAmount(value);
//                       }
//                     }}
//                     onWheel={(e) => e.currentTarget.blur()}
//                     className="w-full bg-gray-800/50 border-2 border-gray-700 rounded-lg px-4 py-3 text-white font-semibold text-lg focus:outline-none focus:border-blue-500 transition"
//                     placeholder="0"
//                     max={maxAmount}
//                   />
//                   <div className="flex justify-between text-xs text-gray-500 mt-1.5">
//                     <span>Available: {selectedOrder.remaining_quantity}</span>
//                     <span
//                       className={`font-semibold ${
//                         spotSide === "buy" ? "text-blue-400" : "text-red-400"
//                       }`}
//                     >
//                       {((amount / maxAmount) * 100).toFixed(1)}%
//                     </span>
//                   </div>
//                 </div>

//                 {/* Slider */}
//                 <div className="relative mb-5">
//                   <div className="flex justify-between text-xs text-gray-400 mb-2">
//                     <span>0%</span>
//                     <span>25%</span>
//                     <span>50%</span>
//                     <span>75%</span>
//                     <span>100%</span>
//                   </div>
//                   <input
//                     type="range"
//                     min="0"
//                     max={maxAmount}
//                     step={maxAmount / 100}
//                     value={amount}
//                     onChange={(e) => setAmount(Number(e.target.value))}
//                     onMouseDown={handleStart}
//                     onMouseUp={handleEnd}
//                     onTouchStart={handleStart}
//                     onTouchEnd={handleEnd}
//                     className="w-full h-2 rounded-full appearance-none cursor-pointer"
//                     style={{
//                       background: `linear-gradient(to right, ${
//                         spotSide === "buy" ? "#3b82f6" : "#ef4444"
//                       } ${(amount / maxAmount) * 100}%, #374151 ${
//                         (amount / maxAmount) * 100
//                       }%)`,
//                     }}
//                   />
//                   {showTooltip && amount > 0 && (
//                     <div
//                       className={`absolute -top-12 {
//                 spotSide === "buy" ? "bg-blue-600" : "bg-red-600"
//               } text-white text-xs px-3 py-1.5 rounded-md shadow-lg font-medium`}
//                       style={{
//                         left: `calc(${(amount / maxAmount) * 100}% - 30px)`,
//                       }}
//                     >
//                       {`${Number(amount).toFixed(2)} (${(
//                         (Number(amount) / Number(maxAmount)) *
//                         100
//                       ).toFixed(1)}%)`}

//                       <div
//                         className={`absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${
//                           spotSide === "buy"
//                             ? "border-t-blue-600"
//                             : "border-t-red-600"
//                         }`}
//                       ></div>
//                     </div>
//                   )}
//                 </div>

//                 {/* Total Display */}
//                 <div
//                   className={`rounded-lg p-4 mb-4 border ${
//                     spotSide === "buy"
//                       ? "bg-blue-500/10 border-blue-500/30"
//                       : "bg-red-500/10 border-red-500/30"
//                   }`}
//                 >
//                   <div className="flex justify-between items-center">
//                     <span className="text-sm font-medium text-gray-400">
//                       {spotSide === "buy" ? "Total Required" : "Total Value"}
//                     </span>

//                     <span className="text-xl font-bold text-white">
//                       {totalValue.toFixed(2)} USDT
//                     </span>
//                   </div>
//                 </div>

//                 {/* Balance Info */}
//                 <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 mb-4">
//                   <div className="flex justify-between text-sm">
//                     <span className="text-gray-400">Available Balance</span>
//                     <span className="text-white font-semibold">{balance} </span>
//                   </div>
//                 </div>

//                 {/* Action Buttons */}
//                 <div className="flex gap-3">
//                   <button
//                     onClick={() => setSelectedOrder(null)}
//                     className="flex-1 py-3 bg-gray-800/50 border border-gray-700 hover:bg-gray-700/50 rounded-lg font-semibold text-gray-300 transition-all"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     onClick={handleModalOrder}
//                     disabled={amount <= 0 || isPlacingOrder}
//                     className={`flex-1 py-3 rounded-lg font-semibold transition-all text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
//                       spotSide === "buy"
//                         ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/30"
//                         : "bg-red-600 hover:bg-red-700 shadow-red-500/30"
//                     }`}
//                   >
//                     {isPlacingOrder
//                       ? "Placing..."
//                       : spotSide === "buy"
//                       ? "Buy"
//                       : "Sell"}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {selectedFuturesOrder && (
//           <div className="fixed bottom-6 top-2 left-6 z-50 animate-in slide-in-from-bottom-4 duration-300">
//             <div className="rounded-xl shadow-2xl w-[420px] transition-all duration-300 border bg-[#0A1628] border-purple-500/30">
//               {/* Header */}
//               <div className="px-6 pt-2 border-b border-gray-700/50">
//                 <div className="flex items-center justify-between mb-3">
//                   <div>
//                     <h3 className="text-xl font-bold text-white">
//                       {selectedFuturesOrder.asset_symbol}
//                     </h3>
//                     <p className="text-sm text-gray-400">
//                       {selectedFuturesOrder.asset_name} - Futures
//                     </p>
//                   </div>
//                   <button
//                     onClick={() => setSelectedFuturesOrder(null)}
//                     className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
//                   >
//                     <X size={20} className="text-gray-400" />
//                   </button>
//                 </div>
//               </div>

//               {/* Body */}
//               <div className="px-6 py-5">
//                 {/* Leverage Selection */}
//                 <div className="flex justify-between items-center text-xs mb-4">
//                   <span className="text-gray-400">Leverage</span>
//                   <div className="flex items-center gap-2">
//                     <input
//                       type="number"
//                       value={futuresLeverage}
//                       min={1}
//                       max={100}
//                       onChange={(e) => {
//                         const val = e.target.value;
//                         // Allow empty input temporarily
//                         if (val === "") {
//                           setFuturesLeverage("");
//                           return;
//                         }
//                         // Only allow numbers
//                         const num = Number(val);
//                         if (!isNaN(num)) {
//                           setFuturesLeverage(val);
//                         }
//                       }}
//                       onBlur={() => {
//                         // Clamp when leaving the input
//                         const num = Number(futuresLeverage);
//                         if (isNaN(num) || num < 1) setFuturesLeverage("1");
//                         else if (num > 100) setFuturesLeverage("100");
//                         else setFuturesLeverage(String(num));
//                       }}
//                       className="w-16 bg-gray-800/50 border border-gray-700 rounded text-center text-white focus:border-purple-400 focus:outline-none py-1"
//                     />
//                     <span className="text-gray-400">x</span>
//                   </div>
//                 </div>

//                 {/* Margin Type Toggle */}
//                 <div className="flex space-x-2 mb-4">
//                   <button
//                     onClick={() => setFuturesMarginType("CROSS")}
//                     className={`flex-1 py-1.5 rounded text-xs font-semibold transition ${
//                       futuresMarginType === "CROSS"
//                         ? "bg-purple-600 text-white"
//                         : "bg-gray-800/50 text-gray-400 border border-gray-700 hover:bg-gray-700/50"
//                     }`}
//                   >
//                     Cross
//                   </button>
//                   <button
//                     onClick={() => setFuturesMarginType("ISOLATED")}
//                     className={`flex-1 py-1.5 rounded text-xs font-semibold transition ${
//                       futuresMarginType === "ISOLATED"
//                         ? "bg-purple-600 text-white"
//                         : "bg-gray-800/50 text-gray-400 border border-gray-700 hover:bg-gray-700/50"
//                     }`}
//                   >
//                     Isolated
//                   </button>
//                 </div>

//                 {/* Price Display */}
//                 <div className="rounded-lg p-4 mb-4 border bg-purple-500/10 border-purple-500/30">
//                   <div className="flex justify-between items-center">
//                     <span className="text-sm text-gray-400">Mark Price</span>
//                     <div className="text-right">
//                       <span className="text-2xl font-bold text-white">
//                         {futuresLastTradePrice
//                           ? Number(futuresLastTradePrice).toFixed(2)
//                           : "-"}
//                       </span>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Quantity Input */}
//                 <div className="mb-4">
//                   <label className="text-sm font-medium text-gray-400 mb-2 block">
//                     Quantity
//                   </label>
//                   <input
//                     type="number"
//                     value={futuresAmount}
//                     onChange={(e) => {
//                       const value = e.target.value;
//                       if (/^\d*\.?\d*$/.test(value)) {
//                         setFuturesAmount(value);
//                       }
//                     }}
//                     onWheel={(e) => e.currentTarget.blur()}
//                     className="w-full bg-gray-800/50 border-2 border-gray-700 rounded-lg px-4 py-3 text-white font-semibold text-lg focus:outline-none focus:border-purple-500 transition"
//                     placeholder="0"
//                   />
//                   <div className="flex justify-between text-xs text-gray-500 mt-1.5">
//                     <span>
//                       Available: {selectedFuturesOrder.remaining_quantity}
//                     </span>
//                   </div>
//                 </div>

//                 {/* Slider */}
//                 <div className="relative mb-5">
//                   <div className="flex justify-between text-xs text-gray-400 mb-2">
//                     <span>0%</span>
//                     <span>25%</span>
//                     <span>50%</span>
//                     <span>75%</span>
//                     <span>100%</span>
//                   </div>
//                   <input
//                     type="range"
//                     min="0"
//                     max={selectedFuturesOrder.remaining_quantity}
//                     step={selectedFuturesOrder.remaining_quantity / 100}
//                     value={futuresAmount}
//                     onChange={(e) => setFuturesAmount(Number(e.target.value))}
//                     className="w-full h-2 rounded-full appearance-none cursor-pointer"
//                     style={{
//                       background: `linear-gradient(to right, #9333ea ${
//                         (futuresAmount /
//                           selectedFuturesOrder.remaining_quantity) *
//                         100
//                       }%, #374151 ${
//                         (futuresAmount /
//                           selectedFuturesOrder.remaining_quantity) *
//                         100
//                       }%)`,
//                     }}
//                   />
//                 </div>

//                 {/* Total Display */}
//                 <div className="rounded-lg p-4 mb-4 border bg-purple-500/10 border-purple-500/30">
//                   <div className="flex justify-between items-center">
//                     <span className="text-sm font-medium text-gray-400">
//                       Total Value
//                     </span>
//                     <span className="text-xl font-bold text-white">
//                       {(
//                         futuresAmount * Number(futuresLastTradePrice || 0)
//                       ).toFixed(2)}{" "}
//                       USDT
//                     </span>
//                   </div>
//                 </div>

//                 {/* Balance Info */}
//                 <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 mb-4">
//                   <div className="flex justify-between text-sm">
//                     <span className="text-gray-400">Available Balance</span>
//                     <span className="text-white font-semibold">
//                       {balance} USDT
//                     </span>
//                   </div>
//                 </div>

//                 {/* Margin Required Display */}

//                 <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 mb-4">
//                   <div className="flex justify-between text-sm">
//                     <span className="text-gray-400">Margin Required</span>
//                     <span className="text-white font-semibold">
//                       {(() => {
//                         const contractValue = 0.001;
//                         const marginRequired =
//                           (parseFloat(futuresAmount) *
//                             Number(futuresLastTradePrice) *
//                             contractValue) /
//                           futuresLeverage;
//                         return `${marginRequired.toFixed(2)} USDT`;
//                       })()}
//                     </span>
//                   </div>
//                 </div>

//                 {/* Buy/Long and Sell/Short Buttons in Same Row */}
//                 <div className="flex gap-3">
//                   <button
//                     onClick={() => handleFuturesModalOrder("buy")}
//                     disabled={
//                       futuresAmount <= 0 ||
//                       futuresLastTradePrice <= 0 ||
//                       isPlacingFuturesOrder ||
//                       (() => {
//                         const contractValue = 0.001;
//                         const marginRequired =
//                           (parseFloat(futuresAmount || 0) *
//                             Number(futuresLastTradePrice || 0) *
//                             contractValue) /
//                           futuresLeverage;
//                         return marginRequired > balance;
//                       })()
//                     }
//                     className={`flex-1 py-3 rounded-lg font-semibold transition-all text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
//                       futuresAmount <= 0 ||
//                       futuresLastTradePrice <= 0 ||
//                       isPlacingFuturesOrder ||
//                       (() => {
//                         const contractValue = 0.001;
//                         const marginRequired =
//                           (parseFloat(futuresAmount || 0) *
//                             Number(futuresLastTradePrice || 0) *
//                             contractValue) /
//                           futuresLeverage;
//                         return marginRequired > balance;
//                       })()
//                         ? "bg-gray-600"
//                         : "bg-green-600 hover:bg-green-700 shadow-green-500/30"
//                     }`}
//                   >
//                     {isPlacingFuturesOrder
//                       ? "Placing..."
//                       : (() => {
//                           const contractValue = 0.001;
//                           const marginRequired =
//                             (parseFloat(futuresAmount || 0) *
//                               Number(futuresLastTradePrice || 0) *
//                               contractValue) /
//                             futuresLeverage;
//                           return marginRequired > balance
//                             ? "Insufficient"
//                             : "Buy/Long";
//                         })()}
//                   </button>

//                   <button
//                     onClick={() => handleFuturesModalOrder("sell")}
//                     disabled={
//                       futuresAmount <= 0 ||
//                       futuresLastTradePrice <= 0 ||
//                       isPlacingFuturesOrder ||
//                       parseFloat(futuresAmount) >
//                         selectedFuturesOrder.remaining_quantity
//                     }
//                     className={`flex-1 py-3 rounded-lg font-semibold transition-all text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
//                       futuresAmount <= 0 ||
//                       futuresLastTradePrice <= 0 ||
//                       isPlacingFuturesOrder ||
//                       parseFloat(futuresAmount) >
//                         selectedFuturesOrder.remaining_quantity
//                         ? "bg-gray-600"
//                         : "bg-red-600 hover:bg-red-700 shadow-red-500/30"
//                     }`}
//                   >
//                     {isPlacingFuturesOrder
//                       ? "Placing..."
//                       : parseFloat(futuresAmount) >
//                         selectedFuturesOrder.remaining_quantity
//                       ? "Exceeds Position"
//                       : "Sell/Short"}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//         {selectedOptionsOrder && (
//           <div className="fixed bottom-6 top-2 left-6 z-50 animate-in slide-in-from-bottom-4 duration-300">
//             <div className="rounded-xl shadow-2xl w-[420px] transition-all duration-300 border bg-[#0A1628] border-blue-500/30">
//               {/* Header */}
//               <div className="px-6 pt-2 border-b border-gray-700/50">
//                 <div className="flex items-center justify-between mb-3">
//                   <div>
//                     <h3 className="text-xl font-bold text-white">
//                       {selectedOptionsOrder.asset_symbol}
//                     </h3>
//                     <p className="text-sm text-gray-400">
//                       {selectedOptionsOrder.asset_name} - Options (
//                       {selectedOptionsOrder.options_details?.option_type})
//                     </p>
//                   </div>
//                   <button
//                     onClick={() => {
//                       setSelectedOptionsOrder(null);
//                       setOptionsAmount("");
//                     }}
//                     className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
//                   >
//                     <X size={20} className="text-gray-400" />
//                   </button>
//                 </div>
//               </div>

//               {/* Body */}
//               <div className="px-6 py-5">
//                 {/* Strike & Expiry Info */}
//                 <div className="grid grid-cols-1 gap-3 mb-4">
//                   <div className="bg-gray-800/50 w-full border border-gray-700 rounded-lg p-3 text-center">
//                     <div className="text-md text-gray-400 mb-1">
//                       Strike Price
//                     </div>
//                     <div className="text-lg font-bold text-white">
//                       {/* {parseFloat(
//                 selectedOptionsOrder.optionsStrikePrice || 0
//               ).toLocaleString()} */}
//                       {optionsStrikePrice
//                         ? parseFloat(optionsStrikePrice).toFixed(2)
//                         : parseFloat(0).toFixed(2)}{" "}
//                     </div>
//                   </div>
//                   {/* <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-center">
//             <div className="text-xs text-gray-400 mb-1">Expiry Date</div>
//             <div className="text-lg font-semibold text-white">
//               {selectedOptionsOrder.options_details?.expiry_date}
//             </div>
//           </div> */}
//                 </div>

//                 {/* Current Premium Price Display */}
//                 <div className="rounded-lg p-4 mb-4 border bg-blue-500/10 border-blue-500/30">
//                   <div className="flex justify-between items-center">
//                     <span className="text-sm text-gray-400">
//                       Current Premium
//                     </span>
//                     <div className="text-right">
//                       <span className="text-2xl font-bold text-white">
//                         {optionsLastTradePrice
//                           ? parseFloat(optionsLastTradePrice).toFixed(2)
//                           : parseFloat(
//                               selectedOptionsOrder.options_details?.premium || 0
//                             ).toFixed(2)}{" "}
//                         USDT
//                       </span>
//                       {optionsLastTradePrice && (
//                         <div className="text-xs text-green-400 mt-1">
//                           ● Live
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>

//                 {/* Quantity Input */}
//                 <div className="mb-4">
//                   <label className="text-sm font-medium text-gray-400 mb-2 block">
//                     Quantity (Contracts)
//                   </label>
//                   <input
//                     type="number"
//                     value={optionsAmount}
//                     onChange={(e) => {
//                       const val = e.target.value;
//                       if (/^\d*\.?\d*$/.test(val)) {
//                         setOptionsAmount(val);
//                       }
//                     }}
//                     onWheel={(e) => e.currentTarget.blur()}
//                     className="w-full bg-gray-800/50 border-2 border-gray-700 rounded-lg px-4 py-3 text-white font-semibold text-lg focus:outline-none focus:border-blue-500 transition"
//                     placeholder="0"
//                   />
//                   <div className="flex justify-between text-xs text-gray-500 mt-1.5">
//                     <span>
//                       Available: {selectedOptionsOrder.remaining_quantity || 0}
//                     </span>
//                     <span className="font-semibold text-blue-400">
//                       {(
//                         (optionsAmount /
//                           selectedOptionsOrder.remaining_quantity) *
//                           100 || 0
//                       ).toFixed(1)}
//                       %
//                     </span>
//                   </div>
//                 </div>

//                 {/* Slider */}
//                 <div className="relative mb-5">
//                   <div className="flex justify-between text-xs text-gray-400 mb-2">
//                     <span>0%</span>
//                     <span>25%</span>
//                     <span>50%</span>
//                     <span>75%</span>
//                     <span>100%</span>
//                   </div>
//                   <input
//                     type="range"
//                     min="0"
//                     max={selectedOptionsOrder.remaining_quantity}
//                     step={selectedOptionsOrder.remaining_quantity / 100}
//                     value={optionsAmount || 0}
//                     onChange={(e) => setOptionsAmount(Number(e.target.value))}
//                     className="w-full h-2 rounded-full appearance-none cursor-pointer"
//                     style={{
//                       background: `linear-gradient(to right, #3b82f6 ${
//                         (optionsAmount /
//                           selectedOptionsOrder.remaining_quantity) *
//                           100 || 0
//                       }%, #374151 ${
//                         (optionsAmount /
//                           selectedOptionsOrder.remaining_quantity) *
//                           100 || 0
//                       }%)`,
//                     }}
//                   />
//                 </div>

//                 {/* Total Value Display */}
//                 <div className="rounded-lg p-4 mb-4 border bg-blue-500/10 border-blue-500/30">
//                   <div className="flex justify-between items-center">
//                     <span className="text-sm font-medium text-gray-400">
//                       Total Value
//                     </span>
//                     <span className="text-xl font-bold text-white">
//                       {(() => {
//                         const currentPrice = optionsLastTradePrice
//                           ? parseFloat(optionsLastTradePrice)
//                           : parseFloat(
//                               selectedOptionsOrder.options_details?.premium || 0
//                             );

//                         return (
//                           parseFloat(optionsAmount || 0) * currentPrice
//                         ).toFixed(2);
//                       })()}{" "}
//                       USDT
//                     </span>
//                   </div>
//                 </div>

//                 {/* Balance Info */}
//                 <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 mb-4">
//                   <div className="flex justify-between text-sm">
//                     <span className="text-gray-400">Available Balance</span>
//                     <span className="text-white font-semibold">
//                       {balance} USDT
//                     </span>
//                   </div>
//                 </div>

//                 {/* Buy and Sell Buttons in Same Row */}
//                 <div className="flex gap-3">
//                   <button
//                     onClick={() => handleOptionsModalOrder("buy")}
//                     disabled={
//                       isPlacingOptionsOrder ||
//                       parseFloat(optionsAmount) <= 0 ||
//                       !optionsLastTradePrice ||
//                       (() => {
//                         const currentPrice = optionsLastTradePrice
//                           ? parseFloat(optionsLastTradePrice)
//                           : parseFloat(
//                               selectedOptionsOrder.options_details?.premium || 0
//                             );
//                         const totalCost =
//                           parseFloat(optionsAmount || 0) * currentPrice;
//                         return totalCost > balance;
//                       })()
//                     }
//                     className={`flex-1 py-3 rounded-lg font-semibold transition-all text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
//                       parseFloat(optionsAmount) <= 0 ||
//                       isPlacingOptionsOrder ||
//                       !optionsLastTradePrice ||
//                       (() => {
//                         const currentPrice = optionsLastTradePrice
//                           ? parseFloat(optionsLastTradePrice)
//                           : parseFloat(
//                               selectedOptionsOrder.options_details?.premium || 0
//                             );
//                         const totalCost =
//                           parseFloat(optionsAmount || 0) * currentPrice;
//                         return totalCost > balance;
//                       })()
//                         ? "bg-gray-600"
//                         : "bg-green-600 hover:bg-green-700 shadow-green-500/30"
//                     }`}
//                   >
//                     {isPlacingOptionsOrder
//                       ? "Placing..."
//                       : !optionsLastTradePrice
//                       ? "Loading Price..."
//                       : (() => {
//                           const currentPrice = optionsLastTradePrice
//                             ? parseFloat(optionsLastTradePrice)
//                             : parseFloat(
//                                 selectedOptionsOrder.options_details?.premium ||
//                                   0
//                               );
//                           const totalCost =
//                             parseFloat(optionsAmount || 0) * currentPrice;
//                           return totalCost > balance
//                             ? "Insufficient Balance"
//                             : "Buy";
//                         })()}
//                   </button>

//                   <button
//                     onClick={() => handleOptionsModalOrder("sell")}
//                     disabled={
//                       isPlacingOptionsOrder ||
//                       parseFloat(optionsAmount) <= 0 ||
//                       !optionsLastTradePrice ||
//                       parseFloat(optionsAmount) >
//                         parseFloat(selectedOptionsOrder.remaining_quantity)
//                     }
//                     className={`flex-1 py-3 rounded-lg font-semibold transition-all text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
//                       parseFloat(optionsAmount) <= 0 ||
//                       isPlacingOptionsOrder ||
//                       !optionsLastTradePrice ||
//                       parseFloat(optionsAmount) >
//                         parseFloat(selectedOptionsOrder.remaining_quantity)
//                         ? "bg-gray-600"
//                         : "bg-red-600 hover:bg-red-700 shadow-red-500/30"
//                     }`}
//                   >
//                     {isPlacingOptionsOrder
//                       ? "Placing..."
//                       : !optionsLastTradePrice
//                       ? "Loading Price..."
//                       : parseFloat(optionsAmount) >
//                         parseFloat(selectedOptionsOrder.remaining_quantity)
//                       ? "Exceeds Position"
//                       : "Sell / Close"}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default OrderHistory;



import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Decimal from "decimal.js";
import { WalletContext } from "../contexts/WalletContext";
import {
  ChevronDown,
  History,
  TrendingDown,
  TrendingUp,
  CheckCircle,
  XCircle,
  X,
} from "lucide-react";

import toast from "react-hot-toast";

const baseURL = import.meta.env.VITE_API_BASE_URL;
const OrderHistory = ({ selectedChallenge, walletData, walletLoading }) => {
  const [orderHistory, setOrderHistory] = useState([]);

  console.log(selectedChallenge, "the seleted data in holdings of challnge");
  console.log("[DEBUG] OrderHistory selectedChallenge:", selectedChallenge);
  console.log("[DEBUG] OrderHistory walletData:", walletData);

  const [holdings, setHoldings] = useState(() => {
    const saved = localStorage.getItem("cachedHoldings_OrderHistory");
    return saved ? JSON.parse(saved) : [];
  });
  // console.log(holdings, "the holdings");
  const [isloading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [toggleOption, setToggleOption] = useState("Spot");
  const options = ["Spot", "Futures", "Options"];

  // console.log(selectedOrder, "the seleted order");
  const { balance, refreshWallet, loading } = useContext(WalletContext);
  const [expandedRows, setExpandedRows] = useState([]);
  const [activeTab, setActiveTab] = useState("orderHistory");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [spotSide, setSpotSide] = useState("buy");
  const [amount, setAmount] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);
  const [lastTradePrice, setLastTradePrice] = useState(null);
  const [livePrices, setLivePrices] = useState(() => {
    // Initialize from local storage if available for instant load
    const saved = localStorage.getItem("livePrices");
    return saved ? JSON.parse(saved) : {};
  });

  // Persist livePrices to localStorage whenever they update
  useEffect(() => {
    if (Object.keys(livePrices).length > 0) {
      localStorage.setItem("livePrices", JSON.stringify(livePrices));
    }
  }, [livePrices]);

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const navigate = useNavigate();
  const tokens = JSON.parse(localStorage.getItem("authTokens"));

  const handleModalOrder = async () => {
    if (amount <= 0) {
      toast.custom(
        (t) => (
          <div
            className={`${t.visible ? "animate-enter" : "animate-leave"
              } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}
          >
            <div className="flex-1 w-0 p-4 flex items-center">
              <XCircle className="h-6 w-6 text-red-500 mr-2" />
              <p className="text-sm font-medium :text-gray-100">
                Please enter a valid quantity
              </p>
            </div>
          </div>
        ),
        { position: "top-right", duration: 2500 }
      );
      return;
    }

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

      // if (spotSide === "sell") {
      //   const sellAmount = parseFloat(amount);
      //   const isFull = sellAmount >= selectedOrder.remaining_quantity;

      //   let response;

      //   if (isFull) {
      //     const payload = {
      //       quantity: sellAmount.toFixed(8),
      //       price: Number(lastTradePrice).toFixed(2),
      //     };

      //     response = await fetch(
      //       `${baseURL}trading/close-trade/${selectedOrder.id}/`,
      //       {
      //         method: "POST",
      //         headers: {
      //           "Content-Type": "application/json",
      //           Authorization: `Bearer ${tokens.access}`,
      //         },
      //         body: JSON.stringify(payload),
      //       }
      //     );
      //   } else {
      //     const payload = {
      //       quantity: sellAmount.toFixed(8),
      //       price: Number(lastTradePrice).toFixed(2),
      //     };

      //     response = await fetch(
      //       `${baseURL}trading/partial-close/${selectedOrder.id}/`,
      //       {
      //         method: "POST",
      //         headers: {
      //           "Content-Type": "application/json",
      //           Authorization: `Bearer ${tokens.access}`,
      //         },
      //         body: JSON.stringify(payload),
      //       }
      //     );
      //   }

      //   const data = await response.json();
      //   console.log(data, "the order place status data");

      //   if (response.ok) {
      //     toast.custom(
      //       (t) => (
      //         <div
      //           className={`${
      //             t.visible ? "animate-enter" : "animate-leave"
      //           } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}
      //         >
      //           <div className="flex-1 w-0 p-4 flex items-center">
      //             <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
      //             <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
      //               {isFull
      //                 ? "Trade closed successfully!"
      //                 : `Sold ${sellAmount} ${
      //                     selectedOrder.asset_symbol
      //                   } @ ${Number(selectedOrder.average_price).toFixed(2)}`}
      //             </p>
      //           </div>
      //         </div>
      //       ),
      //       { position: "top-right", duration: 2500 }
      //     );
      //     await refreshWallet();
      //     setSelectedOrder(null);
      //     setAmount(0);
      //     await fetchData();
      //   } else {
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
      //               Error:{" "}
      //               {data.detail || data.message || "Something went wrong"}
      //             </p>
      //           </div>
      //         </div>
      //       ),
      //       { position: "top-right", duration: 2500 }
      //     );
      //   }
      // } else {
      //   // BUY logic
      //   const payload = {
      //     asset_symbol: selectedOrder.asset_symbol,
      //     asset_name: selectedOrder.asset_name || "Btc",
      //     asset_exchange: selectedOrder.asset_exchange || "BINANCE",
      //     trade_type: "SPOT",
      //     direction: "BUY",
      //     holding_type: "LONGTERM",
      //     quantity: amount.toString(),
      //     price: Number(lastTradePrice).toFixed(2),
      //     order_type: "MARKET",
      //   };

      //   const response = await fetch(`${baseURL}trading/place-order/`, {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //       Authorization: `Bearer ${tokens.access}`,
      //     },
      //     body: JSON.stringify(payload),
      //   });

      //   const data = await response.json();

      //   if (response.ok) {
      //     toast.custom(
      //       (t) => (
      //         <div
      //           className={`${
      //             t.visible ? "animate-enter" : "animate-leave"
      //           } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}
      //         >
      //           <div className="flex-1 w-0 p-4 flex items-center">
      //             <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
      //             <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
      //               Order placed: {data.action} {data.quantity} @ {data.price}
      //             </p>
      //           </div>
      //         </div>
      //       ),
      //       { position: "top-right", duration: 2500 }
      //     );
      //     await refreshWallet();
      //     setSelectedOrder(null);
      //     setAmount(0);
      //     await fetchData();
      //   } else {
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
      //               Error: {data.detail || "Something went wrong"}
      //             </p>
      //           </div>
      //         </div>
      //       ),
      //       { position: "top-right", duration: 2500 }
      //     );
      //   }
      // }


      if (spotSide === "sell") {

        // 🔹 CHALLENGE MODE SELL
        if (selectedChallenge) {
          const decimals = selectedOrder.remaining_quantity.toString().split('.')[1]?.length || 0;
          const payload = {
            participation_id: selectedChallenge.participationId,
            asset_symbol: selectedOrder.asset_symbol,
            asset_name: selectedOrder.asset_name || "Btc",
            trade_type: "SPOT",
            direction: "SELL",
            total_quantity: parseFloat(Number(amount).toFixed(decimals)),
            entry_price: Number(lastTradePrice).toFixed(2),
            holding_type: "LONGTERM",
            order_type: "MARKET",
          };

          const response = await fetch(`${baseURL}challenges/trades/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${tokens.access}`,
            },
            body: JSON.stringify(payload),
          });

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
                      SELL order placed successfully
                    </p>
                  </div>
                </div>
              ),
              { position: "top-right", duration: 2500 }
            );

            // await refreshWallet();
            // if (refreshChallengeWallet) {
            //   await refreshChallengeWallet(selectedChallenge.participationId);
            // }
            setSelectedOrder(null);
            setAmount(0);
            await fetchData();
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
                      Error: {data.detail || data.message || "Something went wrong"}
                    </p>
                  </div>
                </div>
              ),
              { position: "top-right", duration: 2500 }
            );
          }

          return; // ⛔ stop normal SELL flow
        }

        // 🔹 NORMAL SELL (UNCHANGED)
        const sellAmount = parseFloat(amount);
        const isFull = sellAmount >= selectedOrder.remaining_quantity;

        let response;

        const payload = {
          quantity: sellAmount.toFixed(8),
          price: Number(lastTradePrice).toFixed(2),
        };

        if (isFull) {
          response = await fetch(
            `${baseURL}trading/close-trade/${selectedOrder.id}/`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${tokens.access}`,
              },
              body: JSON.stringify(payload),
            }
          );
        } else {
          response = await fetch(
            `${baseURL}trading/partial-close/${selectedOrder.id}/`,
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
                      : `Sold ${sellAmount} ${selectedOrder.asset_symbol} @ ${Number(
                        selectedOrder.average_price
                      ).toFixed(2)}`}
                  </p>
                </div>
              </div>
            ),
            { position: "top-right", duration: 2500 }
          );

          await refreshWallet();
          setSelectedOrder(null);
          setAmount(0);
          await fetchData();
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
                    Error: {data.detail || data.message || "Something went wrong"}
                  </p>
                </div>
              </div>
            ),
            { position: "top-right", duration: 2500 }
          );
        }
      }
      else {
        // 🔹 BUY LOGIC (UNCHANGED)
        const payload = {
          asset_symbol: selectedOrder.asset_symbol,
          asset_name: selectedOrder.asset_name || "Btc",
          asset_exchange: selectedOrder.asset_exchange || "BINANCE",
          trade_type: "SPOT",
          direction: "BUY",
          holding_type: "LONGTERM",
          quantity: amount.toString(),
          price: Number(lastTradePrice).toFixed(2),
          order_type: "MARKET",
        };

        const response = await fetch(`${baseURL}trading/place-order/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens.access}`,
          },
          body: JSON.stringify(payload),
        });

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
                    Order placed: {data.action} {data.quantity} @ {data.price}
                  </p>
                </div>
              </div>
            ),
            { position: "top-right", duration: 2500 }
          );

          await refreshWallet();
          setSelectedOrder(null);
          setAmount(0);
          await fetchData();
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
                    Error: {data.detail || "Something went wrong"}
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
                Failed to place order
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

  const [selectedFuturesOrder, setSelectedFuturesOrder] = useState(null);

  const [futuresLeverage, setFuturesLeverage] = useState(1);
  const [futuresMarginType, setFuturesMarginType] = useState("CROSS");
  const [selectedOptionsOrder, setSelectedOptionsOrder] = useState(null);

  // console.log(selectedOptionsOrder, "the seleted options order");

  const [optionsAmount, setOptionsAmount] = useState("");
  const [isPlacingOptionsOrder, setIsPlacingOptionsOrder] = useState(false);

  const handleFuturesModalOrder = async (side) => {
    if (futuresAmount <= 0) {
      toast.custom(
        (t) => (
          <div
            className={`${t.visible ? "animate-enter" : "animate-leave"
              } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex ring-1 ring-black ring-opacity-5`}
          >
            <div className="flex-1 w-0 p-4 flex items-center">
              <XCircle className="h-6 w-6 text-red-500 mr-2" />
              <p className="text-sm font-medium  text-gray-100">
                Please enter a valid quantity
              </p>
            </div>
          </div>
        ),
        { position: "top-right", duration: 2500 }
      );
      return;
    }

    try {
      setIsPlacingFuturesOrder(true);

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
        // SELL/CLOSE logic
        const sellAmount = parseFloat(futuresAmount);
        const isFull = sellAmount >= selectedFuturesOrder.remaining_quantity;

        let response;

        if (isFull) {
          const decimals = selectedFuturesOrder.remaining_quantity.toString().split('.')[1]?.length || 0;
          const payload = {
            quantity: Number(sellAmount).toFixed(decimals),
            price: Number(futuresLastTradePrice).toFixed(2),
          };

          response = await fetch(
            `${baseURL}trading/close-trade/${selectedFuturesOrder.id}/`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${tokens.access}`,
              },
              body: JSON.stringify(payload),
            }
          );
        } else {
          const decimals = selectedFuturesOrder.remaining_quantity.toString().split('.')[1]?.length || 0;
          const payload = {
            quantity: Number(sellAmount).toFixed(decimals),
            price: Number(futuresLastTradePrice).toFixed(2),
          };

          response = await fetch(
            `${baseURL}trading/partial-close/${selectedFuturesOrder.id}/`,
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
                      ? "Position closed successfully!"
                      : `Closed ${sellAmount} contracts @ ${Number(
                        futuresLastTradePrice
                      ).toFixed(2)}`}
                  </p>
                </div>
              </div>
            ),
            { position: "top-right", duration: 2500 }
          );
          await refreshWallet();
          setSelectedFuturesOrder(null);
          setFuturesAmount("");
          await fetchData();
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
                    Error:{" "}
                    {data.detail || data.message || "Something went wrong"}
                  </p>
                </div>
              </div>
            ),
            { position: "top-right", duration: 2500 }
          );
        }
      } else {
        // BUY/LONG logic

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        const formattedExpiryDate = expiryDate.toISOString().split("T")[0];

        const payload = {
          asset_symbol: selectedFuturesOrder.asset_symbol.toUpperCase(),
          asset_name: selectedFuturesOrder.asset_name || "Bitcoin Perpetual",
          asset_exchange: "DELTA",
          trade_type: "FUTURES",
          direction: "BUY",
          holding_type: selectedFuturesOrder.holding_type || "SHORTTERM",
          quantity: futuresAmount.toString(),
          price: Number(futuresLastTradePrice).toFixed(2),
          order_type: "MARKET",
          leverage: futuresLeverage,
          contract_size: parseFloat(
            selectedFuturesOrder?.contract_value || "0.001"
          ).toFixed(8),
          expiry_date: formattedExpiryDate,
        };

        const response = await fetch(`${baseURL}trading/place-order/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens.access}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        console.log(data, "tthe resonseof long in holdings");

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
          setSelectedFuturesOrder(null);
          setFuturesAmount("");
          await fetchData();
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
                    Error: {data.detail || "Something went wrong"}
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
                Failed to place order
              </p>
            </div>
          </div>
        ),
        { position: "top-right", duration: 2500 }
      );
    } finally {
      setIsPlacingFuturesOrder(false);
    }
  };

  const [optionsLastTradePrice, setOptionsLastTradePrice] = useState(null);
  const [optionsStrikePrice, setOptionsStrikePrice] = useState(null);

  // console.log(optionsLastTradePrice,"the optionsLastTradePrice")

  const handleOptionsModalOrder = async (side) => {
    if (optionsAmount <= 0) {
      toast.custom(
        (t) => (
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
            <XCircle className="h-6 w-6 text-red-500" />
            <p className="text-sm text-gray-100 font-medium">
              Please enter a valid quantity
            </p>
          </div>
        ),
        { position: "top-right", duration: 2500 }
      );
      return;
    }

    try {
      setIsPlacingOptionsOrder(true);

      if (!tokens?.access) {
        toast.custom(
          (t) => (
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
              <XCircle className="h-6 w-6 text-red-500" />
              <p className="text-sm font-medium">You must be logged in!</p>
            </div>
          ),
          { position: "top-right", duration: 2500 }
        );
        return;
      }

      let response;

      if (side === "sell") {
        // SELL / CLOSE OPTIONS POSITION
        const sellAmount = parseFloat(optionsAmount);
        const isFull = sellAmount >= selectedOptionsOrder.remaining_quantity;

        // Use live price from WebSocket or fallback to stored premium
        const currentPrice = optionsLastTradePrice
          ? parseFloat(optionsLastTradePrice)
          : parseFloat(selectedOptionsOrder.options_details?.premium || 0);

        const decimals = selectedOptionsOrder.remaining_quantity.toString().split('.')[1]?.length || 0;
        const payload = {
          quantity: Number(sellAmount).toFixed(decimals),
          price: currentPrice.toFixed(2),
        };

        const url = isFull
          ? `${baseURL}trading/close-trade/${selectedOptionsOrder.id}/`
          : `${baseURL}trading/partial-close/${selectedOptionsOrder.id}/`;

        response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens.access}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        console.log(data, "the repose of option data");

        if (response.ok) {
          toast.custom(
            (t) => (
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {isFull
                    ? "Option position closed successfully!"
                    : `Closed ${sellAmount} contracts @ ${currentPrice.toFixed(
                      2
                    )}`}
                </p>
              </div>
            ),
            { position: "top-right", duration: 2500 }
          );

          await refreshWallet();
          setSelectedOptionsOrder(null);
          setOptionsAmount("");
          await fetchData();
        } else {
          toast.custom(
            (t) => (
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
                <XCircle className="h-6 w-6 text-red-500" />
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Error: {data.detail || data.message || "Something went wrong"}
                </p>
              </div>
            ),
            { position: "top-right", duration: 2500 }
          );
        }
      } else {
        // BUY / OPEN OPTIONS POSITION

        // Use live price from WebSocket or fallback
        const currentPrice = optionsLastTradePrice
          ? parseFloat(optionsLastTradePrice)
          : parseFloat(selectedOptionsOrder.options_details?.premium || 0);

        const payload = {
          asset_symbol: selectedOptionsOrder.asset_symbol.toUpperCase(),
          asset_name: selectedOptionsOrder.asset_name || "Options Contract",
          trade_type: "OPTIONS",
          direction: "BUY",
          quantity: parseFloat(optionsAmount).toFixed(8),
          price: currentPrice.toFixed(3),
          option_type:
            selectedOptionsOrder.options_details?.option_type || "CALL",
          holding_type: selectedOptionsOrder.holding_type || "INTRADAY",
          option_position: "LONG",
          strike_price: optionsStrikePrice,
          expiry_date:
            selectedOptionsOrder.options_details?.expiry_date ||
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
          premium: (parseFloat(optionsAmount) * currentPrice).toFixed(7),
        };

        console.log("Options BUY Payload:", payload);

        response = await fetch(`${baseURL}trading/place-order/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens.access}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        console.log("Options BUY Response:", data);

        if (response.ok) {
          toast.custom(
            (t) => (
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Bought {optionsAmount} {payload.option_type} contracts @{" "}
                  {currentPrice.toFixed(2)}
                </p>
              </div>
            ),
            { position: "top-right", duration: 2500 }
          );

          await refreshWallet();
          setSelectedOptionsOrder(null);
          setOptionsAmount("");
          await fetchData();
        } else {
          toast.custom(
            (t) => (
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
                <XCircle className="h-6 w-6 text-red-500" />
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Error: {data.detail || data.error || "Something went wrong"}
                </p>
              </div>
            ),
            { position: "top-right", duration: 2500 }
          );
        }
      }
    } catch (error) {
      console.error("Options order error:", error);
      toast.custom(
        (t) => (
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
            <XCircle className="h-6 w-6 text-red-500" />
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Failed to place options order
            </p>
          </div>
        ),
        { position: "top-right", duration: 2500 }
      );
    } finally {
      setIsPlacingOptionsOrder(false);
    }
  };

  useEffect(() => {
    if (holdings.length === 0) return;

    // 🔹 Separate holdings by trade type
    const spotHoldings = holdings.filter((h) => h.trade_type === "SPOT");
    const futuresHoldings = holdings.filter((h) => h.trade_type === "FUTURES");
    const optionsHoldings = holdings.filter((h) => h.trade_type === "OPTIONS");
    console.log(optionsHoldings, "the options holdings");

    let binanceWs, deltaWs, deltaOptionsWs;
    // ===========================
    // 🔸 1. BINANCE (SPOT)
    // ===========================
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
          console.error("Binance Holdings WebSocket error:", error);
      }
    }

    // ===========================
    // 🔸 2. DELTA (FUTURES)
    // ===========================
    if (futuresHoldings.length > 0) {
      deltaWs = new WebSocket("wss://socket.delta.exchange");

      deltaWs.onopen = () => {
        const payload = {
          type: "subscribe",
          payload: {
            channels: [
              {
                name: "v2/ticker",
                symbols: futuresHoldings.map((h) =>
                  h.asset_symbol.toUpperCase()
                ),
              },
            ],
          },
        };
        deltaWs.send(JSON.stringify(payload));

        console.log(payload, "the payload of options");
      };
      deltaWs.onmessage = (event) => {
        const response = JSON.parse(event.data);

        // console.log(response, "the respose of delta");

        // Only process ticker updates
        if (
          response?.type === "v2/ticker" &&
          response?.symbol &&
          response?.mark_price
        ) {
          const symbol = response.symbol;
          setLivePrices((prev) => ({
            ...prev,
            [symbol]: response.spot_price,
          }));
        }
      };

      deltaWs.onerror = (error) =>
        console.error("Delta Holdings WebSocket error:", error);
    }

    if (optionsHoldings.length > 0) {
      deltaOptionsWs = new WebSocket("wss://socket.delta.exchange");

      deltaOptionsWs.onopen = () => {
        const payload = {
          type: "subscribe",
          payload: {
            channels: [
              {
                name: "v2/ticker",
                symbols: optionsHoldings.map((h) => h.asset_symbol), // Use full symbol
              },
            ],
          },
        };
        deltaOptionsWs.send(JSON.stringify(payload));
        console.log("Options WS Subscribed:", payload);
      };

      deltaOptionsWs.onmessage = (event) => {
        const response = JSON.parse(event.data);

        // Process ticker updates for options
        if (response?.type === "v2/ticker" && response?.symbol) {
          const symbol = response.symbol;

          // Use mark_price for options (most accurate for premium)
          const price =
            response.mark_price || response.close || response.spot_price;

          setLivePrices((prev) => ({
            ...prev,
            [symbol]: price,
          }));
        }
      };

      deltaOptionsWs.onerror = (error) =>
        console.error("Delta Options WebSocket error:", error);
    }

    // ===========================
    // 🔹 Cleanup
    // ===========================
    return () => {
      if (binanceWs) binanceWs.close();
      if (deltaWs) deltaWs.close();
      if (deltaOptionsWs) deltaOptionsWs.close();
    };
  }, [holdings]);

  const maxAmount =
    spotSide === "buy"
      ? balance / Number(lastTradePrice)
      : selectedOrder?.remaining_quantity;
  const totalValue =
    amount * Number(spotSide === "buy" ? lastTradePrice : lastTradePrice);

  // console.log(totalValue,"the total value")

  useEffect(() => {
    if (!selectedOrder?.asset_symbol) return;

    const symbol = `${selectedOrder.asset_symbol.toLowerCase()}usdt`;

    const ws = new WebSocket(
      `wss://stream.binance.com:9443/ws/${symbol}@trade`
    );

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data?.p) {
        setLastTradePrice(data.p);
      }
    };

    ws.onerror = (error) => console.error("WebSocket error:", error);

    return () => {
      ws.close();
    };
  }, [selectedOrder]);

  useEffect(() => {
    if (!selectedFuturesOrder?.asset_symbol) return;

    const ws = new WebSocket("wss://socket.delta.exchange");

    ws.onopen = () => {
      const payload = {
        type: "subscribe",
        payload: {
          channels: [
            {
              name: "v2/ticker",
              symbols: [selectedFuturesOrder.asset_symbol.toUpperCase()],
            },
          ],
        },
      };
      ws.send(JSON.stringify(payload));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data?.type === "v2/ticker" && data?.close) {
        setFuturesLastTradePrice(data.close);
      }
    };

    ws.onerror = (error) => console.error("Futures WebSocket error:", error);

    return () => {
      ws.close();
    };
  }, [selectedFuturesOrder]);

  useEffect(() => {
    if (!selectedOptionsOrder?.asset_symbol) return;

    const ws = new WebSocket("wss://socket.delta.exchange");

    ws.onopen = () => {
      const payload = {
        type: "subscribe",
        payload: {
          channels: [
            {
              name: "v2/ticker",
              symbols: [selectedOptionsOrder.asset_symbol], // Full symbol like "C-BTC-95000-231224"
            },
          ],
        },
      };
      ws.send(JSON.stringify(payload));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // console.log(data, "theeeeeeeeeeeeeeeeeee dataaaaaaaaaaaa");

      if (data?.type === "v2/ticker" && data?.mark_price) {
        setOptionsLastTradePrice(data.mark_price);
        setOptionsStrikePrice(data.strike_price);
      }
    };

    ws.onerror = (error) =>
      console.error("Options Modal WebSocket error:", error);

    return () => {
      ws.close();
    };
  }, [selectedOptionsOrder]);

  useEffect(() => {
    setAmount("");
  }, [spotSide]);

  const fetchData = async () => {
    // Only show loading if we don't have cached data
    if (holdings.length === 0) {
      setLoading(true);
    }
    setError(null);

    try {
      // Determine which API endpoint to use based on selectedChallenge
      const apiUrl = selectedChallenge?.weekData?.id
        ? `${baseURL}challenges/trades/?week_id=${selectedChallenge.weekData.id}`
        : `${baseURL}trading/api/trading/trades/`;

      const response = await fetch(apiUrl, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens?.access}`,
        },
      });
      console.log(`[DEBUG] OrderHistory fetching from: ${apiUrl}`);

      console.log(response, "responseresponseresponse");

      if (response.status === 401) {
        const errorData = await response.json();

        if (
          errorData?.code === "token_not_valid" ||
          errorData?.detail === "Given token not valid for any token type"
        ) {
          localStorage.removeItem("authTokens");
          localStorage.removeItem("cachedHoldings_OrderHistory");
          navigate("/login");
          return;
        }
        throw new Error("Unauthorized access");
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message =
          errorData?.detail || `HTTP error! status: ${response.status}`;
        throw new Error(message);
      }

      const data = await response.json();

      console.log(data, "Holdings and History RAW DATA");

      let tradesArray;
      if (selectedChallenge?.weekData?.id) {
        // Challenges API - check if data is array or has results
        tradesArray = Array.isArray(data) ? data : data.results || [];
      } else {
        // Regular API
        tradesArray = data.results || [];
      }

      console.log(
        tradesArray,
        "the trades array",
        typeof tradesArray,
        Array.isArray(tradesArray)
      );
      // Ensure tradesArray is actually an array
      if (!Array.isArray(tradesArray)) {
        console.error("tradesArray is not an array:", tradesArray);
        tradesArray = [];
      }
      // Format order history from nested history array
      const formattedHistory = tradesArray.flatMap((trade) =>
        (trade.history || []).map((h) => ({
          asset_symbol: trade.asset_symbol,
          asset_name: trade.asset_name,
          trade_type: trade.trade_type,
          direction: trade.direction,
          holding_type: trade.holding_type,
          status: trade.status,
          total_quantity: trade.total_quantity,
          average_price: trade.average_entry_price || trade.average_price,
          total_invested: trade.total_invested,
          opened_at: trade.opened_at,
          closed_at: trade.closed_at,
          action: h.action,
          order_type: h.order_type,
          quantity: h.quantity,
          price: h.price,
          amount: h.amount,
          realized_pnl: h.realized_pnl,
          created_at: h.created_at,
        }))
      );

      // Format holdings from main trade data
      const formattedHoldings = tradesArray.map((trade) => ({
        id: trade.id,
        asset_symbol: trade.asset_symbol,
        asset_name: trade.asset_name,
        asset_exchange: trade.asset_exchange,
        trade_type: trade.trade_type,
        direction: trade.direction,
        status: trade.status,
        holding_type: trade.holding_type,
        total_quantity: trade.total_quantity,
        remaining_quantity: trade.remaining_quantity,
        average_price: trade.average_entry_price || trade.average_price,
        realized_pnl: trade.realized_pnl,
        unrealized_pnl: trade.unrealized_pnl,
        total_invested: trade.total_invested,
        opened_at: trade.opened_at,
        closed_at: trade.closed_at,
        updated_at: trade.updated_at,
        total_pnl: trade.total_pnl,
        pnl_percentage: trade.pnl_percentage,
        history: trade.history || [],
      }));

      setOrderHistory(formattedHistory);
      setHoldings(formattedHoldings);

      // Update Cache
      if (formattedHoldings.length > 0) {
        localStorage.setItem("cachedHoldings_OrderHistory", JSON.stringify(formattedHoldings));
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate, selectedChallenge]);

  // Trigger Pending Order Check on Load
  useEffect(() => {
    if (tokens?.access) {
      fetch(`${baseURL}trading/check-orders/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.access}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.filled_orders && data.filled_orders.length > 0) {
            toast.success(`${data.filled_orders.length} Pending Orders Filled!`);
            fetchData(); // Refresh list
          }
          if (data.closed_trades && data.closed_trades.length > 0) {
            toast.success(`${data.closed_trades.length} Expired Trades Closed!`);
            fetchData(); // Refresh list
          }
        })
        .catch(err => console.error("Order check failed", err));
    }
  }, []);

  const [optionsSellQty, setOptionsSellQty] = useState(0);
  const [isClosingOptions, setIsClosingOptions] = useState(false);

  const [optionsQuantity, setOptionsQuantity] = useState(1);

  const [futuresSpotSide, setFuturesSpotSide] = useState("buy");
  const [futuresAmount, setFuturesAmount] = useState("");
  const [futuresLastTradePrice, setFuturesLastTradePrice] = useState(null);
  const [isPlacingFuturesOrder, setIsPlacingFuturesOrder] = useState(false);

  const handleTradeClick = (holding) => {
    const status = holding?.status?.toUpperCase();
    const tradeType = holding?.trade_type?.toUpperCase();

    if (status === "OPEN" || status === "PARTIALLY_CLOSED") {
      if (tradeType === "SPOT") {
        setSelectedOrder(holding);
        setAmount(holding.remaining_quantity);
        setSpotSide("buy");
      } else if (tradeType === "FUTURES") {
        setSelectedFuturesOrder(holding);
        setFuturesAmount(holding.remaining_quantity);
        setFuturesSpotSide("buy");
      } else if (tradeType === "OPTIONS") {
        setSelectedOptionsOrder(holding);
        setOptionsQuantity(holding.remaining_quantity);
      }
    } else {
      toast.error(`Cannot trade order with status: ${holding?.status}`);
    }
  };

  const handleStart = () => setShowTooltip(true);
  const handleEnd = () => setShowTooltip(false);

  const handleSearch = () => {
    console.log("Filtering from:", startDate, "to:", endDate);
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
  };

  const getOpenOrdersCount = () => {
    return holdings.filter((h) => h.status === "OPEN").length;
  };

  const calculateLivePnL = (holding) => {
    const currentPrice = livePrices[holding.asset_symbol];
    // console.log(currentPrice, "the current priiiice");
    if (!currentPrice) {
      return {
        pnl: holding.total_pnl,
        percentage: holding.pnl_percentage,
        isLive: false,
      };
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

    const totalPnL = Number(holding.realized_pnl) + unrealizedPnL;
    const pnlPercentage = invested > 0 ? (totalPnL / invested) * 100 : 0;

    return {
      pnl: totalPnL.toFixed(2),
      percentage: pnlPercentage.toFixed(2),
      unrealized: unrealizedPnL.toFixed(2),
      realized: Number(holding.realized_pnl).toFixed(2),
      currentPrice: price.toFixed(4),
      isLive: true,
    };
  };

  const filteredHistory = orderHistory.filter((order) => {
    if (!startDate && !endDate) return true;
    const orderDate = new Date(order.created_at);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (start && end) {
      return orderDate >= start && orderDate <= end;
    } else if (start) {
      return orderDate >= start;
    } else if (end) {
      return orderDate <= end;
    }
    return true;
  });
  console.log("Filtered History:", filteredHistory);

  return (
    <div className="min-h-screen  text-white">

      <div className="max-w-[1400px] mx-auto p-4 md:p-6 ">
        {selectedChallenge?.weekData && (
          <h1 className="text-xl sm:text-3xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Week {selectedChallenge.weekData.week_number} Portfolio
          </h1>
        )}


        <div className=" p-1 mb-6 ">
          <div className="flex gap-2  whitespace-nowrap">
            {[
              // {
              //   label: `Open Orders(${getOpenOrdersCount()})`,
              //   value: "openOrders",
              // },
              { label: "Order History", value: "orderHistory" },
              { label: "Holdings", value: "holdings" },
              { label: "Closed Trades", value: "closed" },

            ].map((tab, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTab(tab.value)}
                className={`px-4 md:px-6 py-3   text-sm font-medium transition-all ${activeTab === tab.value
                  ? " border-b border-white text-white"
                  : "text-gray-400 hover:text-white"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Filter - Only show for Order History: Made responsive */}
        {activeTab === "orderHistory" && (
          <div className="  w-full  rounded-lg p-4 mb-6">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
                <label className="text-gray-400 text-sm w-full sm:w-auto">
                  From:
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-[#1E1F36] border border-gray-700 rounded px-3 py-2 text-sm text-white w-full sm:w-auto"
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
                <label className="text-gray-400 text-sm w-full sm:w-auto">
                  To:
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-[#1E1F36] border border-gray-700 rounded px-3 py-2 text-sm text-white w-full sm:w-auto"
                />
              </div>
              <button
                onClick={handleSearch}
                className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded text-sm transition w-full md:w-auto"
              >
                Search
              </button>
              <button
                onClick={handleReset}
                className="text-gray-400 hover:text-white px-4 py-2 text-sm transition w-full md:w-auto"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isloading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-purple-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading...</p>
          </div>
        )}

        {/* Error State */}
        {error && <div className=" text-red-400">{error}</div>}

        {/* Order History Table: Already has overflow-x-auto */}
        {!isloading && !error && activeTab === "orderHistory" && (
          <div className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">
                      Date
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">
                      Name
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">
                      Type
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">
                      Side
                    </th>
                    <th className="text-right py-4 px-4 text-sm font-medium text-gray-400">
                      Price
                    </th>
                    <th className="text-right py-4 px-4 text-sm font-medium text-gray-400">
                      Amount
                    </th>
                    <th className="text-right font-bold py-4 px-4 text-sm  text-gray-400">
                      Total (USDT)
                    </th>
                    {/* <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">
                      Status
                    </th> */}
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.length > 0 ? (
                    [...filteredHistory]
                      .sort(
                        (a, b) =>
                          new Date(b.created_at) - new Date(a.created_at)
                      )
                      .map((order, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-gray-800 hover:bg-[#1E1F36] transition-colors"
                        >
                          <td className="py-4 px-4 text-sm text-gray-300">
                            {new Date(order.created_at).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                              }
                            )}
                            <br />
                            <span className="text-xs text-gray-500">
                              {new Date(order.created_at).toLocaleTimeString()}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm font-medium text-white">
                            {order.asset_symbol}
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-300">
                            {order.order_type}
                          </td>
                          <td className="py-4 px-4 text-sm">
                            <span
                              className={`${order.action.toLowerCase() === "buy"
                                ? "text-green-400"
                                : "text-red-400"
                                }`}
                            >
                              {order.action}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm text-right text-gray-300">
                            {Number(order.price).toFixed(4)}
                          </td>
                          <td className="py-4 px-4 text-sm text-right text-gray-300">
                            {Number(order.quantity).toFixed(6)}
                          </td>
                          <td className="py-4 font-bold px-4 text-sm text-right text-gray-300">
                            {Number(order.amount).toFixed(4)}
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-12 text-center text-gray-500"
                      >
                        No order history found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Holdings Table */}
        {!isloading && !error && activeTab === "holdings" && (
          <div className="rounded-lg px-0 md:px-6 overflow-hidden">
            {/* Holdings sub-tabs: Made responsive */}
            <div className="flex w-full md:w-72 border rounded-md border-b border-gray-800">
              {options.map((option) => (
                <button
                  key={option}
                  onClick={() => setToggleOption(option)}
                  className={`flex-1 py-2 text-sm text-center  rounded-md transition duration-200  ${toggleOption === option
                    ? "bg-purple-600/20 p-1  text-white backdrop-blur-md shadow-inner"
                    : " text-gray-700 "
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>

            {/* Already has overflow-x-auto */}
            <div className="overflow-x-auto ">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">
                      Asset
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">
                      Type
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">
                      Side
                    </th>
                    <th className="text-right py-4 px-4 text-sm font-medium text-gray-400">
                      Total Qty
                    </th>
                    <th className="text-right py-4 px-4 text-sm font-medium text-gray-400">
                      Avg Price
                    </th>
                    <th className="text-right py-4 px-4 text-sm font-medium text-gray-400">
                      Current Price
                    </th>
                    <th className="text-right py-4 px-4 text-sm font-medium text-gray-400">
                      Invested
                    </th>
                    <th className="text-right py-4 px-4 text-sm font-medium text-gray-400">
                      PnL (Live)
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-medium text-gray-400">
                      Status
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-medium text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>

                {/* <tbody>
                  {holdings.filter((holding) => holding.status !== "CLOSED")
                    .length > 0 ? (
                    holdings
                      .filter((holding) => holding.status !== "CLOSED")
                      .map((holding, idx) => {
                        const pnlData = calculateLivePnL(holding);
                        const isExpanded = expandedRows.includes(holding.id);

                        return ( */}

                <tbody>
                  {holdings.filter(
                    (holding) =>
                      holding.status !== "CLOSED" &&
                      holding.trade_type === toggleOption.toUpperCase()
                  ).length > 0 ? (
                    holdings
                      .filter(
                        (holding) =>
                          holding.status !== "CLOSED" &&
                          holding.trade_type === toggleOption.toUpperCase()
                      )
                      .map((holding, idx) => {
                        const pnlData = calculateLivePnL(holding);

                        // console.log(pnlData,"the pnl data")
                        const isExpanded = expandedRows.includes(holding.id);

                        return (
                          <React.Fragment key={idx}>
                            {/* Main Row */}
                            <tr className="border-b border-gray-800 hover:bg-[#1E1F36] transition-colors">
                              <td className="py-4 px-4 text-sm font-medium text-white">
                                {holding.asset_symbol}
                                <br />
                                <span className="text-xs text-gray-500">
                                  {holding.asset_name}
                                </span>
                              </td>

                              <td className="py-4 px-4 text-sm text-gray-300">
                                {holding.trade_type}
                                <br />
                                <span className="text-xs text-gray-500">
                                  {holding.holding_type}
                                </span>
                              </td>

                              <td className="py-4 px-4 text-sm">
                                <span
                                  className={`${holding.direction.toLowerCase() === "buy"
                                    ? "text-green-400"
                                    : "text-red-400"
                                    }`}
                                >
                                  {holding.direction}
                                </span>
                              </td>

                              <td className="py-4 px-4 text-sm text-right text-gray-300">
                                {Number(holding.remaining_quantity).toFixed(6)}
                              </td>

                              <td className="py-4 px-4 text-sm text-right text-gray-300">
                                {holding.status === "PENDING" ? "-" : Number(holding.average_price).toFixed(4)}
                              </td>

                              <td className="py-4 px-4 text-sm text-right text-gray-300">
                                {holding.status === "PENDING" ? "-" : (pnlData.isLive ? (
                                  <span className="flex w-full font-bold items-center justify-end gap-1">
                                    {pnlData.currentPrice}
                                  </span>
                                ) : (
                                  <span className="text-gray-500">-</span>
                                ))}
                              </td>

                              <td className="py-4 px-4 text-sm text-right text-gray-300">
                                {holding.status === "PENDING" ? "-" : Number(holding.total_invested).toFixed(2)}
                              </td>

                              <td className="py-4 w-28 px-4 text-sm text-right">
                                {holding.status === "PENDING" ? (
                                  <span className="text-gray-500">-</span>
                                ) : (
                                  <div className="flex flex-col items-end">
                                    <span
                                      className={
                                        Number(pnlData.pnl) >= 0
                                          ? "text-green-400 font-semibold"
                                          : "text-red-400 font-semibold"
                                      }
                                    >
                                      {pnlData.pnl}
                                    </span>
                                    <span
                                      className={`text-xs ${Number(pnlData.pnl) >= 0
                                        ? "text-green-400"
                                        : "text-red-400"
                                        }`}
                                    >
                                      ({Number(pnlData.percentage).toFixed(4)}%)
                                    </span>
                                  </div>
                                )}
                              </td>

                              <td className="py-4 px-4 text-sm text-center">
                                <span
                                  className={`px-3 py-1 rounded text-xs 
                                  ${holding.status === "OPEN" || holding.status === "PARTIALLY_CLOSED"
                                      ? "bg-blue-500/20 text-blue-400"
                                      : holding.status === "PENDING"
                                        ? "bg-yellow-500/20 text-yellow-400"
                                        : "bg-green-500/20 text-green-400"
                                    }`}
                                >
                                  {holding.status}
                                </span>
                              </td>

                              <td className="py-4 px-4 text-center">
                                <div className="flex justify-center items-center gap-2">
                                  <button
                                    onClick={() => handleTradeClick(holding)}
                                    className="bg-[#D643BF]  hover:bg-[#b8329f] px-4 py-2 rounded text-xs font-semibold transition"
                                  >
                                    Trade
                                  </button>

                                  <button
                                    className="px-2 py-2 rounded "
                                    onClick={() =>
                                      setExpandedRows((prev) =>
                                        prev.includes(holding.id)
                                          ? prev.filter(
                                            (id) => id !== holding.id
                                          )
                                          : [...prev, holding.id]
                                      )
                                    }
                                    title="History"
                                  >
                                    <History className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>

                              {/* Expand/Collapse Button */}
                            </tr>

                            {/* Expanded Section (separate row) */}
                            {isExpanded && (
                              <tr className=" border-b border-gray-800">
                                <td colSpan="12" className="p-6 ">
                                  <div className="mb-4 flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-200 tracking-wide flex items-center gap-2">
                                      {/* <span className="inline-block w-1.5 h-6 bg-indigo-500 rounded-full"></span> */}
                                      History
                                    </h3>
                                    <span className="text-sm text-gray-400">
                                      {holding?.history?.length || 0} record
                                      {holding?.history?.length === 1
                                        ? ""
                                        : "s"}
                                    </span>
                                  </div>

                                  <div className="overflow-x-auto    border-b border-gray-800 ">
                                    <table className="min-w-full text-sm text-gray-300">
                                      <thead>
                                        <tr className="border-b border-gray-700">
                                          <th className="p-3 text-left font-medium text-gray-400">
                                            Action
                                          </th>
                                          <th className="p-3 text-left font-medium text-gray-400">
                                            Order Type
                                          </th>
                                          <th className="p-3 text-left font-medium text-gray-400">
                                            Quantity
                                          </th>
                                          <th className="p-3 text-left font-medium text-gray-400">
                                            Price
                                          </th>
                                          <th className="p-3 text-left font-medium text-gray-400">
                                            Amount
                                          </th>
                                          <th className="p-3 text-left font-medium text-gray-400">
                                            Created At
                                          </th>
                                        </tr>
                                      </thead>

                                      <tbody>
                                        {holding?.history?.length > 0 ? (
                                          [...holding.history]
                                            .sort(
                                              (a, b) =>
                                                new Date(b.created_at) -
                                                new Date(a.created_at)
                                            )
                                            .map((h, i) => (
                                              <tr
                                                key={h.id || i}
                                                className=" transition-colors duration-200"
                                              >
                                                <td
                                                  className={`p-3 capitalize font-medium ${h.action?.toLowerCase() ===
                                                    "buy"
                                                    ? "text-green-400"
                                                    : h.action?.toLowerCase() ===
                                                      "sell" ||
                                                      h.action?.toLowerCase() ===
                                                      "partial_sell"
                                                      ? "text-red-400"
                                                      : "text-gray-200"
                                                    }`}
                                                >
                                                  {h.action}
                                                </td>

                                                <td className="p-3 capitalize text-gray-200">
                                                  {h.order_type}
                                                </td>
                                                <td className="p-3 text-gray-200">
                                                  {parseFloat(
                                                    h.quantity
                                                  ).toFixed(4)}
                                                </td>
                                                <td className="p-3 text-gray-200">
                                                  {parseFloat(h.price).toFixed(
                                                    2
                                                  )}
                                                </td>
                                                <td className="p-3 text-gray-200">
                                                  {parseFloat(h.amount).toFixed(
                                                    2
                                                  )}
                                                </td>
                                                <td className="p-3 text-gray-400">
                                                  {new Date(
                                                    h.created_at
                                                  ).toLocaleString()}
                                                </td>
                                              </tr>
                                            ))
                                        ) : (
                                          <tr>
                                            <td
                                              colSpan="7"
                                              className="p-5 text-center text-gray-500 bg-[#141731]"
                                            >
                                              No order history found
                                            </td>
                                          </tr>
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                  ) : (
                    <tr>
                      <td
                        colSpan={12}
                        className="py-12 text-center text-gray-500"
                      >
                        No holdings found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Open Orders Tab */}
        {/* {!isloading && !error && activeTab === "openOrders" && (
          <div className=" rounded-lg p-8 text-center">
            <p className="text-gray-400">Open orders will be displayed here</p>
          </div>
        )} */}

        {/* Closed Tab: Already has overflow-x-auto */}
        {!isloading && !error && activeTab === "closed" && (
          <div className="rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">
                      Asset
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">
                      Type
                    </th>
                    {/* <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">
                      Side
                    </th> */}
                    <th className="text-right py-4 px-4 text-sm font-medium text-gray-400">
                      Total Qty
                    </th>
                    <th className="text-right py-4 px-4 text-sm font-medium text-gray-400">
                      Avg Price
                    </th>
                    <th className="text-right py-4 px-4 text-sm font-medium text-gray-400">
                      Price
                    </th>
                    <th className="text-right py-4 px-4 text-sm font-medium text-gray-400">
                      Invested
                    </th>
                    <th className="text-right py-4 px-4 text-sm font-medium text-gray-400">
                      PnL
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-medium text-gray-400">
                      Status
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-medium text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {holdings.filter((holding) => holding.status == "CLOSED")
                    .length > 0 ? (
                    holdings
                      .filter((holding) => holding.status == "CLOSED")
                      .map((holding, idx) => {
                        const pnlData = calculateLivePnL(holding);
                        const isExpanded = expandedRows.includes(holding.id);

                        return (
                          <React.Fragment key={idx}>
                            {/* Main Row */}
                            <tr className="border-b border-gray-800 hover:bg-[#1E1F36] transition-colors">
                              <td className="py-4 px-4 text-sm font-medium text-white">
                                {holding.asset_symbol}
                                <br />
                                <span className="text-xs text-gray-500">
                                  {holding.asset_name}
                                </span>
                              </td>

                              <td className="py-4 px-4 text-sm text-gray-300">
                                {holding.trade_type}
                                <br />
                                <span className="text-xs text-gray-500">
                                  {holding.holding_type}
                                </span>
                              </td>

                              {/* <td className="py-4 px-4 text-sm">
                                <span
                                  className={`${
                                    holding.direction.toLowerCase() === "buy"
                                      ? "text-green-400"
                                      : "text-red-400"
                                  }`}
                                >
                                  {holding.direction}
                                </span>
                              </td> */}

                              <td className="py-4 px-4 text-sm text-right text-gray-300">
                                {Number(holding.total_quantity).toFixed(6)}
                              </td>

                              <td className="py-4 px-4 text-sm text-right text-gray-300">
                                {Number(holding.average_price).toFixed(4)}
                              </td>

                              <td className="py-4 px-4 text-sm text-right text-gray-300">
                                <span className="flex w-full items-center justify-end gap-1">
                                  {holding.history.find(
                                    (item) => item.action === "SELL"
                                  )
                                    ? parseFloat(
                                      holding.history.find(
                                        (item) => item.action === "SELL"
                                      ).price
                                    ).toFixed(4)
                                    : " - "}
                                </span>
                              </td>

                              <td className="py-4 px-4 text-sm text-right text-gray-300">
                                {Number(holding.total_invested).toFixed(2)}
                              </td>

                              <td className="py-4 w-28 px-4 text-sm text-right">
                                <div className="flex flex-col items-end">
                                  <span
                                    className={
                                      Number(holding.realized_pnl) >= 0
                                        ? "text-green-400 font-semibold"
                                        : "text-red-400 font-semibold"
                                    }
                                  >
                                    {holding.realized_pnl}
                                  </span>
                                  <span
                                    className={`text-xs ${Number(pnlData.pnl) >= 0
                                      ? "text-green-400"
                                      : "text-red-400"
                                      }`}
                                  >
                                    (
                                    {Number(holding.pnl_percentage).toFixed(4)}
                                    %)
                                  </span>
                                </div>
                              </td>

                              <td className="py-4 px-4 text-sm text-center">
                                <span
                                  className={`px-3 py-1 rounded text-xs 
                                  ${holding.status === "OPEN"
                                      ? "bg-blue-500/20 text-blue-400"
                                      : "bg-green-500/20 text-green-400"
                                    }`}
                                >
                                  {holding.status}
                                </span>
                              </td>

                              <td className="py-4 px-4 text-center">
                                <div className="flex justify-center items-center gap-2">
                                  {/* <button
                                    onClick={() => handleTradeClick(holding)}
                                    className="bg-[#D643BF]  hover:bg-[#b8329f] px-4 py-2 rounded text-xs font-semibold transition"
                                  >
                                    Trade
                                  </button> */}

                                  <button
                                    className="px-2 py-2 rounded "
                                    onClick={() =>
                                      setExpandedRows((prev) =>
                                        prev.includes(holding.id)
                                          ? prev.filter(
                                            (id) => id !== holding.id
                                          )
                                          : [...prev, holding.id]
                                      )
                                    }
                                    title="History"
                                  >
                                    <History className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>

                              {/* Expand/Collapse Button */}
                            </tr>

                            {/* Expanded Section (separate row) */}
                            {isExpanded && (
                              <tr className=" border-b border-gray-800">
                                <td colSpan="12" className="p-6 ">
                                  <div className="mb-4 flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-200 tracking-wide flex items-center gap-2">
                                      {/* <span className="inline-block w-1.5 h-6 bg-indigo-500 rounded-full"></span> */}
                                      History
                                    </h3>
                                    <span className="text-sm text-gray-400">
                                      {holding?.history?.length || 0} record
                                      {holding?.history?.length === 1
                                        ? ""
                                        : "s"}
                                    </span>
                                  </div>

                                  <div className="overflow-x-auto    border-b border-gray-800 ">
                                    <table className="min-w-full text-sm text-gray-300">
                                      <thead>
                                        <tr className="border-b border-gray-700">
                                          <th className="p-3 text-left font-medium text-gray-400">
                                            Action
                                          </th>
                                          <th className="p-3 text-left font-medium text-gray-400">
                                            Order Type
                                          </th>
                                          <th className="p-3 text-left font-medium text-gray-400">
                                            Quantity
                                          </th>
                                          <th className="p-3 text-left font-medium text-gray-400">
                                            Price
                                          </th>
                                          <th className="p-3 text-left font-medium text-gray-400">
                                            Amount
                                          </th>
                                          <th className="p-3 text-left font-medium text-gray-400">
                                            Created At
                                          </th>
                                        </tr>
                                      </thead>

                                      <tbody>
                                        {holding?.history?.length > 0 ? (
                                          [...holding.history]
                                            .sort(
                                              (a, b) =>
                                                new Date(b.created_at) -
                                                new Date(a.created_at)
                                            )
                                            .map((h, i) => (
                                              <tr
                                                key={h.id || i}
                                                className=" transition-colors duration-200"
                                              >
                                                <td
                                                  className={`p-3 capitalize font-medium ${h.action?.toLowerCase() ===
                                                    "buy"
                                                    ? "text-green-400"
                                                    : h.action?.toLowerCase() ===
                                                      "sell" ||
                                                      h.action?.toLowerCase() ===
                                                      "partial_sell"
                                                      ? "text-red-400"
                                                      : "text-gray-200"
                                                    }`}
                                                >
                                                  {h.action}
                                                </td>

                                                <td className="p-3 capitalize text-gray-200">
                                                  {h.order_type}
                                                </td>
                                                <td className="p-3 text-gray-200">
                                                  {parseFloat(
                                                    h.quantity
                                                  ).toFixed(4)}
                                                </td>
                                                <td className="p-3 text-gray-200">
                                                  {parseFloat(h.price).toFixed(
                                                    2
                                                  )}
                                                </td>
                                                <td className="p-3 text-gray-200">
                                                  {parseFloat(h.amount).toFixed(
                                                    2
                                                  )}
                                                </td>
                                                <td className="p-3 text-gray-400">
                                                  {new Date(
                                                    h.created_at
                                                  ).toLocaleString()}
                                                </td>
                                              </tr>
                                            ))
                                        ) : (
                                          <tr>
                                            <td
                                              colSpan="7"
                                              className="p-5 text-center text-gray-500 bg-[#141731]"
                                            >
                                              No order history found
                                            </td>
                                          </tr>
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                  ) : (
                    <tr>
                      <td
                        colSpan={12}
                        className="py-12 text-center text-gray-500"
                      >
                        No holdings found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bots Tab */}
        {!isloading && !error && activeTab === "bots" && (
          <div className="bg-[#13152E] rounded-lg p-8 text-center">
            <p className="text-gray-400">Trading bots will be displayed here</p>
          </div>
        )}

        {/* --- SPOT TRADE MODAL --- */}
        {/* Responsive Overlay for mobile */}
        {selectedOrder && (
          <div
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm md:hidden"
            onClick={() => setSelectedOrder(null)}
          ></div>
        )}
        {selectedOrder && (
          // Responsive Container: Full width bottom sheet on mobile, "toaster" on desktop
          <div className="fixed bottom-0 left-0 w-full p-4 md:p-0 md:w-auto md:bottom-6 md:left-6 z-50 animate-in slide-in-from-bottom-full md:slide-in-from-bottom-4 duration-300">
            {/* Responsive Content: full-width on mobile, fixed-width on desktop. Added scroll behavior */}
            <div
              className={`rounded-t-xl md:rounded-xl shadow-2xl w-full md:w-[420px] transition-all duration-300 border max-h-[90vh] overflow-y-auto ${spotSide === "buy"
                ? "bg-[#0A1628] border-blue-500/30"
                : "bg-[#1A0A0F] border-red-500/30"
                }`}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-700/50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {selectedOrder.asset_symbol}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {selectedOrder.asset_name}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                  >
                    <X size={20} className="text-gray-400" />
                  </button>
                </div>

                {/* Buy/Sell Toggle */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSpotSide("buy");
                      setAmount(0);
                    }}
                    className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${spotSide === "buy"
                      ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                      : "bg-gray-800/50 text-gray-400 border border-gray-700 hover:bg-gray-700/50"
                      }`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <TrendingUp size={16} />
                      Buy
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setSpotSide("sell");
                      setAmount(0);
                    }}
                    className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${spotSide === "sell"
                      ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                      : "bg-gray-800/50 text-gray-400 border border-gray-700 hover:bg-gray-700/50"
                      }`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <TrendingDown size={16} />
                      Sell
                    </div>
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-5">
                {/* Price Display */}
                <div
                  className={`rounded-lg p-4 mb-4 border ${spotSide === "buy"
                    ? "bg-blue-500/10 border-blue-500/30"
                    : "bg-red-500/10 border-red-500/30"
                    }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">
                      {/* {spotSide === "buy" ?  */}
                      {/* " */}
                      Market Price
                      {/* "  */}
                      {/* : "Avg. Cost"} */}
                    </span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-white">
                        {/* {spotSide === "buy" */}
                        {/* ? */}
                        {Number(lastTradePrice).toFixed(2)}
                        {/* : Number(selectedOrder.average_price).toFixed(2)} */}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quantity Input */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-400 mb-2 block">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => {
                      const value = ((maxAmount * percentage) / 100).toFixed(8);
                      setAmount(value);
                    }}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-full bg-gray-800/50 border-2 border-gray-700 rounded-lg px-4 py-3 text-white font-semibold text-lg focus:outline-none focus:border-blue-500 transition"
                    placeholder="0"
                    max={maxAmount}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1.5">
                    <span>Available: {selectedOrder.remaining_quantity}</span>
                    <span
                      className={`font-semibold ${spotSide === "buy" ? "text-blue-400" : "text-red-400"
                        }`}
                    >
                      {((amount / maxAmount) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Slider */}
                <div className="relative mb-5">
                  <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={amount && maxAmount ? (amount / maxAmount) * 100 : 0}
                    onChange={(e) => {
                      const percent = Number(e.target.value);
                      const max = Number(maxAmount);
                      const decimals = maxAmount.toString().split('.')[1]?.length || 0;
                      const val = (max * percent) / 100;
                      setAmount(Number(val.toFixed(decimals)));
                    }}
                    onMouseDown={handleStart}
                    onMouseUp={handleEnd}
                    onTouchStart={handleStart}
                    onTouchEnd={handleEnd}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${spotSide === "buy" ? "#3b82f6" : "#ef4444"
                        } ${(amount / maxAmount) * 100}%, #374151 ${(amount / maxAmount) * 100
                        }%)`,
                    }}
                  />
                  {showTooltip && amount > 0 && (
                    <div
                      className={`absolute -top-12 ${spotSide === "buy" ? "bg-blue-600" : "bg-red-600"
                        } text-white text-xs px-3 py-1.5 rounded-md shadow-lg font-medium`}
                      style={{
                        left: `calc(${(amount / maxAmount) * 100}% - 30px)`,
                      }}
                    >
                      {`${Number(amount).toFixed(2)} (${(
                        (Number(amount) / Number(maxAmount)) *
                        100
                      ).toFixed(1)}%)`}

                      <div
                        className={`absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${spotSide === "buy"
                          ? "border-t-blue-600"
                          : "border-t-red-600"
                          }`}
                      ></div>
                    </div>
                  )}
                </div>

                {/* Total Display */}
                <div
                  className={`rounded-lg p-4 mb-4 border ${spotSide === "buy"
                    ? "bg-blue-500/10 border-blue-500/30"
                    : "bg-red-500/10 border-red-500/30"
                    }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-400">
                      {spotSide === "buy" ? "Total Required" : "Total Value"}
                    </span>

                    <span className="text-xl font-bold text-white">
                      {totalValue.toFixed(2)} USDT
                    </span>
                  </div>
                </div>

                {/* Balance Info */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Available Balance</span>
                    <span className="text-white font-semibold">
                      {selectedChallenge
                        ? walletData?.available_balance || 0
                        : balance}
                    </span>

                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="flex-1 py-3 bg-gray-800/50 border border-gray-700 hover:bg-gray-700/50 rounded-lg font-semibold text-gray-300 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleModalOrder}
                    disabled={amount <= 0 || isPlacingOrder}
                    className={`flex-1 py-3 rounded-lg font-semibold transition-all text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${spotSide === "buy"
                      ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/30"
                      : "bg-red-600 hover:bg-red-700 shadow-red-500/30"
                      }`}
                  >
                    {isPlacingOrder
                      ? "Placing..."
                      : spotSide === "buy"
                        ? "Buy"
                        : "Sell"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- FUTURES TRADE MODAL --- */}
        {/* Responsive Overlay for mobile */}
        {selectedFuturesOrder && (
          <div
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm md:hidden"
            onClick={() => setSelectedFuturesOrder(null)}
          ></div>
        )}
        {selectedFuturesOrder && (
          // Responsive Container: Full width bottom sheet on mobile, "toaster" on desktop
          // Removed conflicting 'top-2' class
          <div className="fixed bottom-0 left-0 w-full p-4 md:p-0 md:w-auto md:bottom-6 md:left-6 z-50 animate-in slide-in-from-bottom-full md:slide-in-from-bottom-4 duration-300">
            {/* Responsive Content: full-width on mobile, fixed-width on desktop. Added scroll behavior */}
            <div className="rounded-t-xl md:rounded-xl shadow-2xl w-full md:w-[420px] transition-all duration-300 border bg-[#0A1628] border-purple-500/30 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="px-6 pt-2 border-b border-gray-700/50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {selectedFuturesOrder.asset_symbol}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {selectedFuturesOrder.asset_name} - Futures
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedFuturesOrder(null)}
                    className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                  >
                    <X size={20} className="text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-5">
                {/* Leverage Selection */}
                <div className="flex justify-between items-center text-xs mb-4">
                  <span className="text-gray-400">Leverage</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={futuresLeverage}
                      min={1}
                      max={100}
                      onChange={(e) => {
                        const val = e.target.value;
                        // Allow empty input temporarily
                        if (val === "") {
                          setFuturesLeverage("");
                          return;
                        }
                        // Only allow numbers
                        const num = Number(val);
                        if (!isNaN(num)) {
                          setFuturesLeverage(val);
                        }
                      }}
                      onBlur={() => {
                        // Clamp when leaving the input
                        const num = Number(futuresLeverage);
                        if (isNaN(num) || num < 1) setFuturesLeverage("1");
                        else if (num > 100) setFuturesLeverage("100");
                        else setFuturesLeverage(String(num));
                      }}
                      className="w-16 bg-gray-800/50 border border-gray-700 rounded text-center text-white focus:border-purple-400 focus:outline-none py-1"
                    />
                    <span className="text-gray-400">x</span>
                  </div>
                </div>

                {/* Margin Type Toggle */}
                <div className="flex space-x-2 mb-4">
                  <button
                    onClick={() => setFuturesMarginType("CROSS")}
                    className={`flex-1 py-1.5 rounded text-xs font-semibold transition ${futuresMarginType === "CROSS"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-800/50 text-gray-400 border border-gray-700 hover:bg-gray-700/50"
                      }`}
                  >
                    Cross
                  </button>
                  <button
                    onClick={() => setFuturesMarginType("ISOLATED")}
                    className={`flex-1 py-1.5 rounded text-xs font-semibold transition ${futuresMarginType === "ISOLATED"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-800/50 text-gray-400 border border-gray-700 hover:bg-gray-700/50"
                      }`}
                  >
                    Isolated
                  </button>
                </div>

                {/* Price Display */}
                <div className="rounded-lg p-4 mb-4 border bg-purple-500/10 border-purple-500/30">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Mark Price</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-white">
                        {futuresLastTradePrice
                          ? Number(futuresLastTradePrice).toFixed(2)
                          : "-"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quantity Input */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-400 mb-2 block">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={futuresAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*\.?\d*$/.test(value)) {
                        setFuturesAmount(value);
                      }
                    }}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-full bg-gray-800/50 border-2 border-gray-700 rounded-lg px-4 py-3 text-white font-semibold text-lg focus:outline-none focus:border-purple-500 transition"
                    placeholder="0"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1.5">
                    <span>
                      Available: {selectedFuturesOrder.remaining_quantity}
                    </span>
                  </div>
                </div>

                {/* Slider */}
                <div className="relative mb-5">
                  <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={
                      futuresAmount && selectedFuturesOrder?.remaining_quantity
                        ? (futuresAmount / selectedFuturesOrder.remaining_quantity) * 100
                        : 0
                    }
                    onChange={(e) => {
                      const percent = Number(e.target.value);
                      const max = Number(selectedFuturesOrder.remaining_quantity);
                      const decimals = selectedFuturesOrder.remaining_quantity.toString().split('.')[1]?.length || 0;
                      const val = (max * percent) / 100;
                      setFuturesAmount(Number(val.toFixed(decimals)));
                    }}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #9333ea ${(futuresAmount / selectedFuturesOrder.remaining_quantity) * 100
                        }%, #374151 ${(futuresAmount / selectedFuturesOrder.remaining_quantity) * 100
                        }%)`,
                    }}
                  />
                </div>

                {/* Total Display */}
                <div className="rounded-lg p-4 mb-4 border bg-purple-500/10 border-purple-500/30">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-400">
                      Total Value
                    </span>
                    <span className="text-xl font-bold text-white">
                      {(
                        futuresAmount * Number(futuresLastTradePrice || 0)
                      ).toFixed(2)}{" "}
                      USDT
                    </span>
                  </div>
                </div>

                {/* Balance Info */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Available Balance</span>
                    <span className="text-white font-semibold">
                      {balance} USDT
                    </span>
                  </div>
                </div>

                {/* Margin Required Display */}

                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Margin Required</span>
                    <span className="text-white font-semibold">
                      {(() => {
                        const contractValue = 0.001;
                        const marginRequired =
                          (parseFloat(futuresAmount) *
                            Number(futuresLastTradePrice) *
                            contractValue) /
                          futuresLeverage;
                        return `${marginRequired.toFixed(2)} USDT`;
                      })()}
                    </span>
                  </div>
                </div>

                {/* Buy/Long and Sell/Short Buttons in Same Row */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleFuturesModalOrder("buy")}
                    disabled={
                      futuresAmount <= 0 ||
                      futuresLastTradePrice <= 0 ||
                      isPlacingFuturesOrder ||
                      (() => {
                        const contractValue = 0.001;
                        const marginRequired =
                          (parseFloat(futuresAmount || 0) *
                            Number(futuresLastTradePrice || 0) *
                            contractValue) /
                          futuresLeverage;
                        return marginRequired > balance;
                      })()
                    }
                    className={`flex-1 py-3 rounded-lg font-semibold transition-all text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${futuresAmount <= 0 ||
                      futuresLastTradePrice <= 0 ||
                      isPlacingFuturesOrder ||
                      (() => {
                        const contractValue = 0.001;
                        const marginRequired =
                          (parseFloat(futuresAmount || 0) *
                            Number(futuresLastTradePrice || 0) *
                            contractValue) /
                          futuresLeverage;
                        return marginRequired > balance;
                      })()
                      ? "bg-gray-600"
                      : "bg-green-600 hover:bg-green-700 shadow-green-500/30"
                      }`}
                  >
                    {isPlacingFuturesOrder
                      ? "Placing..."
                      : (() => {
                        const contractValue = 0.001;
                        const marginRequired =
                          (parseFloat(futuresAmount || 0) *
                            Number(futuresLastTradePrice || 0) *
                            contractValue) /
                          futuresLeverage;
                        return marginRequired > balance
                          ? "Insufficient"
                          : "Buy/Long";
                      })()}
                  </button>

                  <button
                    onClick={() => handleFuturesModalOrder("sell")}
                    disabled={
                      futuresAmount <= 0 ||
                      futuresLastTradePrice <= 0 ||
                      isPlacingFuturesOrder ||
                      parseFloat(futuresAmount) >
                      selectedFuturesOrder.remaining_quantity
                    }
                    className={`flex-1 py-3 rounded-lg font-semibold transition-all text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${futuresAmount <= 0 ||
                      futuresLastTradePrice <= 0 ||
                      isPlacingFuturesOrder ||
                      parseFloat(futuresAmount) >
                      selectedFuturesOrder.remaining_quantity
                      ? "bg-gray-600"
                      : "bg-red-600 hover:bg-red-700 shadow-red-500/30"
                      }`}
                  >
                    {isPlacingFuturesOrder
                      ? "Placing..."
                      : parseFloat(futuresAmount) >
                        selectedFuturesOrder.remaining_quantity
                        ? "Exceeds Position"
                        : "Sell/Short"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- OPTIONS TRADE MODAL --- */}
        {/* Responsive Overlay for mobile */}
        {selectedOptionsOrder && (
          <div
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm md:hidden"
            onClick={() => {
              setSelectedOptionsOrder(null);
              setOptionsAmount("");
            }}
          ></div>
        )}
        {selectedOptionsOrder && (
          <div className="fixed inset-0 z-50 flex justify-center items-end sm:items-center sm:justify-start p-3 sm:p-6">
            <div
              className="
        rounded-xl shadow-2xl 
        w-full sm:w-[420px] 
        max-h-[90vh] overflow-y-auto 
        border bg-[#0A1628] border-blue-500/30
        transition-all duration-300
        animate-in slide-in-from-bottom-4
      "
            >
              {/* Header */}
              <div className="px-4 sm:px-6 pt-3 border-b border-gray-700/50 sticky top-0 bg-[#0A1628] z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="truncate">
                    <h3 className="text-lg sm:text-xl font-bold text-white truncate">
                      {selectedOptionsOrder.asset_symbol}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400 truncate">
                      {selectedOptionsOrder.asset_name} - Options (
                      {selectedOptionsOrder.options_details?.option_type})
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedOptionsOrder(null);
                      setOptionsAmount("");
                    }}
                    className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                  >
                    <X size={20} className="text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-4">
                {/* Strike Price */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-center">
                  <div className="text-sm text-gray-400 mb-1">Strike Price</div>
                  <div className="text-lg sm:text-xl font-bold text-white">
                    {optionsStrikePrice
                      ? parseFloat(optionsStrikePrice).toFixed(2)
                      : parseFloat(0).toFixed(2)}{" "}
                  </div>
                </div>

                {/* Current Premium */}
                <div className="rounded-lg p-4 border bg-blue-500/10 border-blue-500/30">
                  <div className="flex justify-between items-center flex-wrap gap-1">
                    <span className="text-sm text-gray-400">Current Premium</span>
                    <div className="text-right">
                      <span className="text-xl sm:text-2xl font-bold text-white">
                        {optionsLastTradePrice
                          ? parseFloat(optionsLastTradePrice).toFixed(2)
                          : parseFloat(
                            selectedOptionsOrder.options_details?.premium || 0
                          ).toFixed(2)}{" "}
                        USDT
                      </span>
                      {optionsLastTradePrice && (
                        <div className="text-xs text-green-400 mt-1">● Live</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quantity Input */}
                <div>
                  <label className="text-sm font-medium text-gray-400 mb-2 block">
                    Quantity (Contracts)
                  </label>
                  <input
                    type="number"
                    value={optionsAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d*\.?\d*$/.test(val)) {
                        setOptionsAmount(val);
                      }
                    }}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-full bg-gray-800/50 border-2 border-gray-700 rounded-lg px-4 py-3 text-white font-semibold text-lg focus:outline-none focus:border-blue-500 transition"
                    placeholder="0"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1.5">
                    <span>
                      Available: {selectedOptionsOrder.remaining_quantity || 0}
                    </span>
                    <span className="font-semibold text-blue-400">
                      {(
                        (optionsAmount /
                          selectedOptionsOrder.remaining_quantity) *
                        100 || 0
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                </div>

                {/* Slider */}
                <div className="relative">
                  <div className="flex justify-between text-[10px] sm:text-xs text-gray-400 mb-2">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={selectedOptionsOrder.remaining_quantity}
                    step={selectedOptionsOrder.remaining_quantity / 100}
                    value={optionsAmount || 0}
                    onChange={(e) => setOptionsAmount(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 ${(optionsAmount /
                        selectedOptionsOrder.remaining_quantity) *
                        100 || 0
                        }%, #374151 ${(optionsAmount /
                          selectedOptionsOrder.remaining_quantity) *
                        100 || 0
                        }%)`,
                    }}
                  />
                </div>

                {/* Total Value */}
                <div className="rounded-lg p-4 border bg-blue-500/10 border-blue-500/30">
                  <div className="flex justify-between items-center flex-wrap">
                    <span className="text-sm font-medium text-gray-400">
                      Total Value
                    </span>
                    <span className="text-lg sm:text-xl font-bold text-white">
                      {(() => {
                        const currentPrice = optionsLastTradePrice
                          ? parseFloat(optionsLastTradePrice)
                          : parseFloat(
                            selectedOptionsOrder.options_details?.premium || 0
                          );

                        return (
                          parseFloat(optionsAmount || 0) * currentPrice
                        ).toFixed(2);
                      })()}{" "}
                      USDT
                    </span>
                  </div>
                </div>

                {/* Balance */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Available Balance</span>
                    <span className="text-white font-semibold">{balance} USDT</span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleOptionsModalOrder("buy")}
                    disabled={
                      isPlacingOptionsOrder ||
                      parseFloat(optionsAmount) <= 0 ||
                      !optionsLastTradePrice ||
                      (() => {
                        const currentPrice = optionsLastTradePrice
                          ? parseFloat(optionsLastTradePrice)
                          : parseFloat(
                            selectedOptionsOrder.options_details?.premium || 0
                          );
                        const totalCost =
                          parseFloat(optionsAmount || 0) * currentPrice;
                        return totalCost > balance;
                      })()
                    }
                    className={`flex-1 py-3 rounded-lg font-semibold transition-all text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${parseFloat(optionsAmount) <= 0 ||
                      isPlacingOptionsOrder ||
                      !optionsLastTradePrice ||
                      (() => {
                        const currentPrice = optionsLastTradePrice
                          ? parseFloat(optionsLastTradePrice)
                          : parseFloat(
                            selectedOptionsOrder.options_details?.premium || 0
                          );
                        const totalCost =
                          parseFloat(optionsAmount || 0) * currentPrice;
                        return totalCost > balance;
                      })()
                      ? "bg-gray-600"
                      : "bg-green-600 hover:bg-green-700 shadow-green-500/30"
                      }`}
                  >
                    {isPlacingOptionsOrder
                      ? "Placing..."
                      : !optionsLastTradePrice
                        ? "Loading Price..."
                        : (() => {
                          const currentPrice = optionsLastTradePrice
                            ? parseFloat(optionsLastTradePrice)
                            : parseFloat(
                              selectedOptionsOrder.options_details?.premium || 0
                            );
                          const totalCost =
                            parseFloat(optionsAmount || 0) * currentPrice;
                          return totalCost > balance
                            ? "Insufficient Balance"
                            : "Buy";
                        })()}
                  </button>

                  <button
                    onClick={() => handleOptionsModalOrder("sell")}
                    disabled={
                      isPlacingOptionsOrder ||
                      parseFloat(optionsAmount) <= 0 ||
                      !optionsLastTradePrice ||
                      parseFloat(optionsAmount) >
                      parseFloat(selectedOptionsOrder.remaining_quantity)
                    }
                    className={`flex-1 py-3 rounded-lg font-semibold transition-all text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${parseFloat(optionsAmount) <= 0 ||
                      isPlacinptionsOrder ||
                      !optionsstTradePrice ||
                      parseFlo(optionsAmount) >
                      parseFat(selectedOptionsOrder.remaining_quantity)
                      ? "bg-ay-600"
                      : "bg-d-600 hover:bg-red-700 shadow-red-500/30"
                      }`}
                  >
                    {isPlacingOptionsOrder
                      ? "Placing..."
                      : !optionsLastTradePrice
                        ? "Loading Price..."
                        : parseFloat(optionsAmount) >
                          parseFloat(selectedOptionsOrder.remaining_quantity)
                          ? "Exceeds Position"
                          : "Sell / Close"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default OrderHistory;

