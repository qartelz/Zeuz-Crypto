import React, { useState } from 'react';

const HeroSection = () => {
  const [hover, setHover] = useState(false);

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="text-center">
        <h1 className="text-7xl font-bold bg-gradient-to-r from-[#FF1CF7] to-[#00F0FF] bg-clip-text text-transparent">
          Learn to Trade
        </h1>

        <h2 className="text-5xl mt-2 font-bold text-white">by Trading</h2>

        <p className="mt-4 text-white max-w-2xl mx-auto">
          Zeuz lets you trade top crypto assets using Beetle Coins. Practice in a
          realistic environment, complete challenges, and get deep insights into
          how you trade.
        </p>

        <button
          className="mt-6 px-6 py-3 text-white text-lg rounded-full border-1  border-[#FF3BD4] transition duration-300 cursor-pointer select-text"
          style={{
            background: hover
              ? 'linear-gradient(to bottom, rgba(90, 35, 161, 1), rgba(224, 43, 191, 1))'
              : 'linear-gradient(to bottom, rgba(113, 48, 195, 0.35), rgba(255, 59, 212, 0.35))',
          }}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
         
        >
          Start Trading with Beetle Coins
        </button>
      </div>
    </div>
  );
};

export default HeroSection;
