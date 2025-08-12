import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'

import Home from './pages/Home'
// import Market from './pages/Market'
// import Target from './pages/Target'
import Challenges from './pages/Challenges'
import Settings from './pages/Settings'

import OptionsChain from './components/OptionChain'
import OrderBookChart from './components/OrderBookChart'
import LiveTradingViewChart from './components/LiveTradingViewChart'

function App() {
  return (
    <Router>
      <div className="bg-black">
        {/* <Sidebar /> */}
        <main className="flex-1  overflow-auto">
          <Routes>
            <Route path="/" element={<Home />} /> 
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>

         
          {/* <OptionsChain /> 
          <OrderBookChart />
         <LiveTradingViewChart /> */}
        </main>
      </div>
    </Router>
  )
}

export default App
