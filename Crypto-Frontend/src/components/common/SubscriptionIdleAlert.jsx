import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ArrowRight, X } from 'lucide-react';
import { AuthContext } from '../../contexts/AuthContext';

const baseURL = import.meta.env.VITE_API_BASE_URL;

const SubscriptionIdleAlert = () => {
    const { authTokens } = useContext(AuthContext);
    const [isVisible, setIsVisible] = useState(false);
    const [subStatus, setSubStatus] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const sessionDismissed = sessionStorage.getItem('idleAlertDismissed');
        if (sessionDismissed) return;

        const checkStatus = async () => {
            if (!authTokens?.access) return;

            try {
                // Endpoint path based on backend configuration
                const response = await fetch(`${baseURL}admin/subscriptions/subscriptions/idle_status/`, {
                    headers: {
                        'Authorization': `Bearer ${authTokens.access}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.idle_alert_needed) {
                        setSubStatus(data);
                        setIsVisible(true);
                    }
                }
            } catch (error) {
                console.error("Error checking subscription status:", error);
            }
        };

        checkStatus();
    }, [authTokens]);

    const handleDismiss = () => {
        setIsVisible(false);
        sessionStorage.setItem('idleAlertDismissed', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="relative w-full max-w-md bg-[#1f1730] border border-purple-500/30 rounded-2xl shadow-2xl p-6 overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-600/10 rounded-full blur-3xl -ml-10 -mb-10"></div>

                {/* Close Button */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20">
                        <Trophy className="text-white w-8 h-8" />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">Subscription Active!</h2>

                    <p className="text-gray-300 mb-6 leading-relaxed">
                        You have <span className="text-white font-bold">{subStatus?.days_remaining} days</span> remaining on your subscription, but you haven't started a Challenge Week yet.
                        <br /><br />
                        <span className="text-purple-300 font-medium">Start Week 1 now to maximize your results!</span>
                    </p>

                    <button
                        onClick={() => {
                            handleDismiss();
                            navigate('/challenges');
                        }}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25"
                    >
                        <span>Start Challenge</span>
                        <ArrowRight size={18} />
                    </button>

                    <button
                        onClick={handleDismiss}
                        className="mt-3 text-sm text-gray-500 hover:text-gray-300 transition-colors"
                    >
                        Remind me later
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionIdleAlert;
