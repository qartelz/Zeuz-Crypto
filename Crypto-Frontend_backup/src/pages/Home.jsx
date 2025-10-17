import React from 'react';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import WhyChooseUs from '../components/WhyChooseUs';
import HeroBgImg from '../../src/assets/images/hero-bg.png';
import TradingJourney from '../components/TradingJourney';
import TradingHeroSection from '../components/TradingHeroSection';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <div className='bg-[#070710]' >
     <div 
  style={{
    backgroundImage: `url(${HeroBgImg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    
  }}
>
  <Header />
  <HeroSection />
</div>

      <WhyChooseUs />
      <TradingJourney/>
      <TradingHeroSection/>
      <Footer/>
    </div>
  );
}
