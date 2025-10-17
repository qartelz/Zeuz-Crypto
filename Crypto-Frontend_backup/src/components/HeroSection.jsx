import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const [hover, setHover] = useState(false);
  const navigate = useNavigate();


  return (
    <div className="flex flex-1 items-center justify-center py-4 px-4
                    min-h-[auto] sm:min-h-[calc(100vh-80px)]">
      <div className="text-center">
        {/* Title */}
        <h1 className="whitespace-nowrap text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-[#FF1CF7] to-[#00F0FF] bg-clip-text text-transparent">
          Learn to Trade
        </h1>

        {/* Subtitle */}
        <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white">
          by Trading
        </h2>

        {/* Paragraph */}
        <p className="mt-4 text-white text-base sm:text-lg md:text-xl max-w-xl sm:max-w-2xl mx-auto">
          Zeuz lets you trade top crypto assets using Beetle Coins. Practice in a
          realistic environment, complete challenges, and get deep insights into
          how you trade.
        </p>

        {/* Button */}
        <button
      className="mt-6 px-6 py-3 text-white text-base sm:text-lg rounded-full border border-[#FF3BD4] transition duration-300 cursor-pointer"
      style={{
        background: hover
          ? 'linear-gradient(to bottom, rgba(90, 35, 161, 1), rgba(224, 43, 191, 1))'
          : 'linear-gradient(to bottom, rgba(113, 48, 195, 0.35), rgba(255, 59, 212, 0.35))',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => navigate('/trading')}
    >
      Start Trading with Beetle Coins
    </button>
      </div>
    </div>
  );
};

export default HeroSection;
