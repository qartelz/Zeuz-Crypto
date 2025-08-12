import React from "react";
import SymbolSelector from "../components/SymbolSelector";


import LiveTradingViewChart from "../components/LiveTradingViewChart";
import OrderBookChart from "../components/OrderBookChart";
import OptionsChain from "../components/OptionChain";

const Dashboard = () => {
  return (
    <div className="bg-gray-900 text-white min-h-screen p-4">
      <SymbolSelector />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OrderBookChart />
        <OptionsChain />
      </div>
      <LiveTradingViewChart />
    </div>
  );
};

export default Dashboard;
