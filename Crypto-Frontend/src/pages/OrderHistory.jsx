import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const OrderHistory = () => {
  const [orderHistory, setOrderHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const tokens = JSON.parse(localStorage.getItem("authTokens"));

  useEffect(() => {
    const fetchOrderHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/v1/trading/api/trading/trades/",
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${tokens?.access}`,
            },
          }
        );

        if (response.status === 401) {
          const errorData = await response.json();
          if (
            errorData?.code === "token_not_valid" ||
            errorData?.detail === "Given token not valid for any token type"
          ) {
            localStorage.removeItem("authTokens");
            navigate("/login");
            return;
          }
          throw new Error("Unauthorized access");
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Flatten results → each trade may have multiple history entries
        const formatted = data.results.flatMap((trade) =>
          trade.history.map((h) => ({
            id: h.id,
            asset_symbol: trade.asset_symbol,
            asset_name: trade.asset_name,
            trade_type: trade.trade_type,
            direction: trade.direction,
            status: trade.status,
            total_quantity: trade.total_quantity,
            average_price: trade.average_price,
            total_invested: trade.total_invested,
            opened_at: trade.opened_at,
            closed_at: trade.closed_at,
            // history specific
            action: h.action,
            order_type: h.order_type,
            quantity: h.quantity,
            price: h.price,
            amount: h.amount,
            realized_pnl: h.realized_pnl,
            created_at: h.created_at,
          }))
        );

        setOrderHistory(formatted);
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderHistory();
  }, [navigate]);

  return (
    <div className="bg-gradient-to-br from-[#0F0F1E] to-[#4733A6] p-6 rounded-xl shadow-lg border border-white/20 max-w-6xl mx-auto mt-10">
      <h2 className="text-3xl font-bold text-white mb-4">Order History</h2>

      {loading && <p className="text-white">Loading order history...</p>}
      {error && <p className="text-red-400">Error: {error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-white">
            <thead className="bg-white/10">
              <tr>
                <th className="p-3">Trade ID</th>
                <th className="p-3">Symbol</th>
                <th className="p-3">Action</th>
                <th className="p-3">Order Type</th>
                <th className="p-3">Quantity</th>
                <th className="p-3">Price</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Realized PnL</th>
                <th className="p-3">Status</th>
                <th className="p-3">Created At</th>
              </tr>
            </thead>
            <tbody>
              {orderHistory.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-white/10 hover:bg-white/5 transition"
                >
                  <td className="p-3 break-all">{order.id}</td>
                  <td className="p-3">{order.asset_symbol}</td>
                  <td className="p-3">{order.action}</td>
                  <td className="p-3">{order.order_type}</td>
                  <td className="p-3">{order.quantity}</td>
                  <td className="p-3">{order.price}</td>
                  <td className="p-3">{order.amount}</td>
                  <td className="p-3">{order.realized_pnl}</td>
                  <td className="p-3">{order.status}</td>
                  <td className="p-3">
                    {new Date(order.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}

              {orderHistory.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center p-4 text-white/50">
                    No order history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
