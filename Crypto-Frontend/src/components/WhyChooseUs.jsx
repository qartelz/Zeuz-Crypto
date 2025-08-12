import React from "react";

import RealMarketDataIcon from "../assets/svg/real-market-data.svg";
import RiskFreeTradingIcon from "../assets/svg/risk-free-trading.svg";
import LearnAndImproveIcon from "../assets/svg/learn-and-improve.svg";

const features = [
  {
    title: "Real Market Data",
    description: "Practice with real-time price data and market conditions",
    Icon: RealMarketDataIcon,
  },
  {
    title: "Risk-Free Trading",
    description: "Trade with virtual Beetle Coins instead of real money.",
    Icon: RiskFreeTradingIcon,
  },

  {
    title: "Learn and Improve",
    description: "Get personalized insights on your trading patterns.",
    Icon: LearnAndImproveIcon,
  },
];

const WhyChooseUs = () => {
  return (
    <div className="py-16 px-4 text-center">
      <h2 className="text-2xl font-semibold text-white uppercase">
        Why Choose Us
      </h2>
      <h3 className="text-4xl font-bold mt-2 bg-gradient-to-r from-[#A93EF8] to-[#E75469] bg-clip-text text-transparent">
        Core features of Zeus
      </h3>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {features.map((feature, index) => (
          <div
            key={index}
            className="border rounded-xl p-6 bg-[#0F1021]  backdrop-blur-sm border-[#2F336D] shadow-md"
          >
            <div className="flex justify-center mb-4">
              <div className="bg-black rounded-full p-4 border-1  border-[#2F336D]">
                <img
                  src={feature.Icon}
                  alt={feature.title}
                  className="w-10 h-10 object-contain"
                />
              </div>
            </div>

            <h4 className="text-xl font-bold text-white">{feature.title}</h4>
            <p className="mt-2 text-[#B5B5B5] text-sm">{feature.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
  <h2 className="text-5xl font-extrabold bg-gradient-to-r from-[#AA3EF6] to-[#DB5084] bg-clip-text text-transparent">
    Unleash Your Winning Potential with Zeus
  </h2>

  <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-7xl mx-auto px-4">
    {[
      "Profile Page",
      "Leaderboard",
      "Dynamic stats",
      "Agent Select overlay",
      "Loading Screen Overlay",
      "Post Match Insights Overlay",
      "Agent Statistics",
      "Weapon Statistics",
      "Map Statistics",
      "Lineup Guide",
      "Agent Guide",
      "Weapon Guide",
    ].map((item, index) => (
      <div
        key={index}
        className="border border-[#2F336D] text-white text-sm rounded-full px-1 py-2 text-center backdrop-blur-sm bg-[#0F1021]"
      >
        {item}
      </div>
    ))}
  </div>
</div>

    </div>
  );
};

export default WhyChooseUs;
