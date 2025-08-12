// TradingJourneyExact.jsx
import React from "react";

export default function TradingJourneyExact() {
  // centers of the 3 segments (based on 35% / 30% / 35%)
  const leftCenter = "17.5%";
  const midCenter = "50%";
  const rightCenter = "82.5%";

  return (
    <section className=" py-20">
      {/* Top headings */}
      <div className="max-w-5xl mx-auto text-center px-4">
        <p className="text-2xl font-medium text-gray-700">Your Journey to</p>

        <h1
          className="text-4xl font-extrabold mt-2 bg-clip-text  text-transparent"
          style={{
            backgroundImage: "linear-gradient(90deg, #AA3EF6 0%, #DB5084 100%)",
          }}
        >
          Trading Mastery
        </h1>

        <p className="text-[#B5B5B5] max-w-2xl mx-auto mt-4">
          Zeuz guides you through a structured learning experience to help you
          become a better trader.
        </p>
      </div>

      {/* Timeline wrapper */}
      <div
        className="max-w-5xl mx-auto mt-36 relative px-4"
        style={{ height: 260 }}
      >
        {/* Horizontal segmented bar (rounded ends) */}
        <div className="absolute left-0 right-0 top-28">
          <div className="flex items-center h-[10px]">
            {/* Blue */}
            <div className="w-[35%] h-[10px] bg-[#0A94FF] rounded-l-full relative" />
            {/* Orange */}
            <div className="w-[30%] h-[10px] bg-[#FFA500] relative" />
            {/* Green */}
            <div className="w-[35%] h-[10px] bg-[#66E500] rounded-r-full relative" />
          </div>

          {/* Triangles (placed relative to the bar) */}
          {/* Blue triangle pointing down (under the blue segment) */}
          <div
            className="absolute"
            style={{
              left: `calc(${leftCenter} - 12px)`, // center - half triangle width
              top: 10, // bar top + bar height -> sits under the bar
            }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: "14px solid transparent",
                borderRight: "14px solid transparent",
                borderTop: "18px solid #0A94FF",
              }}
            />
          </div>

          {/* Orange triangle pointing up (on the orange segment) */}
          <div
            className="absolute"
            style={{
              left: `calc(${midCenter} - 12px)`,
              top: -18, // placed above the bar
            }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: "14px solid transparent",
                borderRight: "14px solid transparent",
                borderBottom: "18px solid #FFA500",
              }}
            />
          </div>

          {/* Green triangle pointing down (under the green segment) */}
          <div
            className="absolute"
            style={{
              left: `calc(${rightCenter} - 12px)`,
              top: 10,
            }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: "14px solid transparent",
                borderRight: "14px solid transparent",
                borderTop: "18px solid #66E500",
              }}
            />
          </div>
        </div>

        {/* Step 1: Circle above the bar (blue) */}
        <div
          className="absolute flex flex-col items-center"
          style={{
            left: leftCenter,
            transform: "translateX(-50%)",
            top: 28 - 88,
          }}
        >
          {/* circle */}
          <div className="w-20 h-20 rounded-full bg-[#0A94FF] flex items-center justify-center shadow-sm">
            <span className="text-2xl font-bold text-black">1</span>
          </div>

          {/* thin connector from circle down to bar */}
          <div className="w-[3px] bg-[#0A94FF] mt-3" style={{ height: 56 }} />

          {/* Title + description below the bar (moved downward intentionally like the image) */}
          <div className="mt-16 text-center max-w-[260px]">
            <h3 className="text-[#0A94FF] text-xl font-semibold">
              Virtual Trading
            </h3>
            <p className="text-[#B5B5B5] text-sm mt-3 leading-6">
              Start with freestyle trading using Beetle Coins. Get comfortable
              with the platform and basic trading concepts
            </p>
          </div>
        </div>

        {/* Step 2: Circle below the bar (orange, centered) */}
        <div
          className="absolute flex flex-col items-center"
          style={{
            left: midCenter,
            transform: "translateX(-50%)",
            top: 28 + 24,
          }}
        >
          {/* thin connector from bar down to circle */}
          <div
            className="w-[3px] mt-20 bg-[#FFA500] mb-3"
            style={{ height: 56 }}
          />

          {/* circle */}
          <div className="w-20 h-20 rounded-full bg-[#FFA500] flex items-center justify-center shadow-sm">
            <span className="text-2xl font-bold text-black">2</span>
          </div>

          {/* Title above the bar (centered above) */}
          <div className="absolute -top-36 w-72 text-center left-1/2 transform -translate-x-1/2">
            <h3 className="text-[#FFA500] text-xl font-semibold">
              Challenge Mode
            </h3>
            <p className="text-[#B5B5B5] text-sm mt-3 leading-6">
              Take on structured missions with specific rules and profit goals
              to develop targeted trading skills.
            </p>
          </div>
        </div>

        {/* Step 3: Circle above the bar (green, right) */}
        <div
          className="absolute flex flex-col items-center"
          style={{
            left: rightCenter,
            transform: "translateX(-50%)",
            top: 28 - 88,
          }}
        >
          {/* circle */}
          <div className="w-20 h-20 rounded-full bg-[#66E500] flex items-center justify-center shadow-sm">
            <span className="text-2xl font-bold text-black">3</span>
          </div>

          {/* thin connector */}
          <div className="w-[3px] bg-[#66E500] mt-3" style={{ height: 56 }} />

          {/* Title + description below */}
          <div className="mt-16 text-center max-w-[260px]">
            <h3 className="text-[#66E500] text-xl font-semibold">
              Analyze & Improve
            </h3>
            <p className="text-[#B5B5B5] text-sm mt-3 leading-6">
              Review your performance analytics and personalized insights to
              identify areas for improvement.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
