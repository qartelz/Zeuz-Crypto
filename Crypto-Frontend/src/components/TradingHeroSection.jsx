import React from 'react';
import globe from '../assets/svg/globe.svg';
import bgImage from '../assets/images/start-trading-bg.png';

const TradingHeroSection = () => {
  return (
    <section
      className="h-[596px] px-6 md:px-20 text-white flex flex-col md:flex-row items-center justify-between gap-10 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
     
      <div className="md:w-1/2 space-y-6">
        <h5 className="text-sm text-[#FDD65B] tracking-wide uppercase">Train. Challenge. Improve.</h5>
        <h1 className="text-3xl md:text-5xl font-bold text-white">
          Start your crypto trading journey with zero risk.
        </h1>
        <p className="text-base text-gray-300">
          Zeuz gives you a real-market simulator powered by virtual coins and guided challenges — 
          so you can learn by doing, not just watching.
        </p>

        <button className="mt-4 px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold hover:bg-white/20 transition">
          Start Trading
        </button>
      </div>

     
      <div className="md:w-1/2">
        <img src={globe} alt="Trading Illustration" className="w-full h-96" />
      </div>
    </section>
  );
};

export default TradingHeroSection;
