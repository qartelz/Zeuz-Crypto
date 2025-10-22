<>
          {mode === "futures" ? (
            <>
              {/* Futures UI */}
              <div className="space-y-3">
                <div className="text-xs text-gray-400">
                  Avbl{" "}
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
                      max={100}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setLeverage(val > 100 ? 100 : val < 1 ? 1 : val);
                      }}
                      className="w-16 bg-transparent border border-white/10 rounded text-center text-white focus:border-purple-400 focus:outline-none"
                    />
                    <span className="text-gray-400">x</span>
                  </div>
                </div>

                {/* Margin Type Toggle */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => setMarginType("CROSS")}
                    className={`flex-1 py-1.5 rounded text-xs font-semibold transition ${
                      marginType === "CROSS"
                        ? "bg-purple-600 text-white"
                        : "bg-white/5 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    Cross
                  </button>
                  <button
                    onClick={() => setMarginType("ISOLATED")}
                    className={`flex-1 py-1.5 rounded text-xs font-semibold transition ${
                      marginType === "ISOLATED"
                        ? "bg-purple-600 text-white"
                        : "bg-white/5 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    Isolated
                  </button>
                </div>


                {/* Current Price */}
                <div className="bg-[#1E1F36] rounded p-2 flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-gray-400">Last Price</span>
                  <span
                    className={`font-mono font-semibold ${
                      futuresTicker?.ltp_change_24h &&
                      parseFloat(futuresTicker.ltp_change_24h) < 0
                        ? "text-red-400"
                        : "text-green-400"
                    }`}
                  >
                    {futuresPrice.toFixed(2)}
                  </span>
                  <span className="text-gray-400">{selected.quoteAsset}</span>
                </div>

                {/* Amount Input */}
                <div className="bg-[#1E1F36] rounded p-2 text-xs sm:text-sm w-full max-w-sm">
                  <div className="relative w-full">
                    <label
                      className={`absolute left-3 text-gray-400 transition-all duration-200 ease-in-out pointer-events-none ${
                        futuresAmount
                          ? "text-[10px] sm:text-xs top-1"
                          : "text-xs sm:text-sm top-2.5"
                      }`}
                    >
                      Quantity (Contracts)
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
                </div>

                
                {/* Range Slider */}
                <div className="relative w-full">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={futuresSliderValue}
                    onChange={(e) => {
                      const percentage = Number(e.target.value);
                      setFuturesSliderValue(percentage);

                      // Calculate max contracts based on balance, leverage, and price
                      if (futuresPrice > 0 && balance > 0) {
                        const contractValue = futuresTicker?.contract_value
                          ? parseFloat(futuresTicker.contract_value)
                          : 0.001;
                        // Maximum contracts you can afford with your balance and leverage
                        const maxContracts =
                          (balance * leverage) / (futuresPrice * contractValue);
                        const calculatedAmount =
                          (maxContracts * percentage) / 100;
                        setFuturesAmount(calculatedAmount.toFixed(3));
                      }
                    }}
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

                {/* Total Display */}
                <div className="bg-[#1E1F36] rounded p-2 flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-gray-400">Total Value</span>
                  <span className="text-white font-mono">
                    {futuresTotal > 0
                      ? `${futuresTotal.toFixed(2)} ${selected.quoteAsset}`
                      : `Enter quantity`}
                  </span>
                </div>

                {/* Margin Required Display - ADD THIS */}
                {futuresAmount && futuresPrice > 0 && (
                  <div className="bg-[#1E1F36] rounded p-2 flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-gray-400">Margin Required</span>
                    <span className="text-white font-mono">
                      {(() => {
                        const contractValue = futuresTicker?.contract_value
                          ? parseFloat(futuresTicker.contract_value)
                          : 0.001;
                        const marginRequired =
                          (parseFloat(futuresAmount) *
                            futuresPrice *
                            contractValue) /
                          leverage;
                        return `${marginRequired.toFixed(2)} ${
                          selected.quoteAsset
                        }`;
                      })()}
                    </span>
                  </div>
                )}

                {/* Contract Info */}
                {futuresTicker && (
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
                  </div>
                )}

                {/* Buy/Long and Sell/Short Buttons in Same Row */}
                <div className="flex gap-2">
                 

                  {/* Buy/Long Button */}
                  <button
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
                  </button>

                  

                  {/* Sell/Short Button */}
                  <button
                    onClick={() => handleFuturesOrder("sell")}
                    disabled={
                      isPlacingSellOrder ||
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
                      isPlacingSellOrder ||
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
                        : "bg-red-500 hover:bg-red-600"
                    }`}
                  >
                    {isPlacingSellOrder
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
                            : `Sell/Short`;
                        })()}
                  </button>
                </div>
              </div>
            </>