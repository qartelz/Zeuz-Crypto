Spot Side Toggle
<div className="flex space-x-4 mb-4">
  <button
    onClick={() => setSpotSide("buy")}
    className={`flex-1 py-1 rounded ${
      spotSide === "buy"
        ? "bg-green-500 text-white font-semibold"
        : "bg-white/5 text-gray-400"
    }`}
  >
    Buy
  </button>
  <button
    onClick={() => setSpotSide("sell")}
    className={`flex-1 py-1 rounded ${
      spotSide === "sell"
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
      Avbl{" "}
      <span className="ml-1">
        {loading
          ? "Loading..."
          : `${balance} ${selected.quoteAsset}`}
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
            className={`absolute left-3 text-gray-400 transition-all duration-200 ease-in-out pointer-events-none ${
              amount
                ? "text-[10px] sm:text-xs top-1"
                : "text-xs sm:text-sm top-2.5"
            }`}
          >
            Amount ({selected.baseAsset})
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
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
        step="25"
        value={sliderValue}
        onMouseDown={handleStart}
        onMouseUp={handleEnd}
        onTouchStart={handleStart}
        onTouchEnd={handleEnd}
        onChange={(e) =>
          handleSliderChange(Number(e.target.value))
        }
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
      <span className="text-white">
        {total > 0
          ? `${total.toFixed(2)} ${selected.quoteAsset}`
          : `Minimum 5 ${selected.quoteAsset}`}
      </span>
    </div>

    <div className="text-xs text-gray-400">
      Available: <span>0.000000 {selected.baseAsset}</span>
    </div>

    <button
      onClick={handleOrder}
      className="w-full bg-green-500 hover:bg-green-600 py-2 rounded-lg font-semibold"
    >
      Buy {selected.baseAsset}
    </button>
  </div>
) : (
  <div className="space-y-3">
    <div className="text-xs text-gray-400">
      Avbl{" "}
      <span className="ml-1">
        {loading
          ? "Loading..."
          : `${balance} ${selected.baseAsset}`}
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
            className={`absolute left-3 text-gray-400 transition-all duration-200 ease-in-out pointer-events-none ${
              amount
                ? "text-[10px] sm:text-xs top-1"
                : "text-xs sm:text-sm top-2.5"
            }`}
          >
            Amount ({selected.baseAsset})
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onWheel={(e) => e.target.blur()}
            className="no-spinner w-full bg-transparent border border-gray-600 rounded px-3 pt-5 pb-1 text-white placeholder-transparent focus:outline-none focus:border-purple-400 transition duration-150"
            placeholder="Amount"
          />
        </div>
      </div>
    </div>

    {/* Range Slider */}
    <input
      type="range"
      min="0"
      max="100"
      step="25"
      onChange={(e) => handleSliderChange(e.target.value)}
      className="w-full accent-red-500"
    />

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
        {balance} {selected.quoteAsset}
      </span>
    </div>

    <button
      onClick={handleOrder}
      className="w-full bg-red-500 hover:bg-red-600 py-2 rounded-lg font-semibold"
    >
      Sell {selected.baseAsset}
    </button>
  </div>
)}