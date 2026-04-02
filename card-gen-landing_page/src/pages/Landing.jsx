import React from 'react'
import Header from '../components/sections/Header'
import Hero from '../components/sections/Hero'
import Banner from '../components/sections/Banner'
import Slider from '../components/sections/Slider'
import Gettingstarted from '../components/sections/Getting-started'
import YourPhysicalCard from '../components/sections/Your-physical-card'
import Features from '../components/sections/Features'
import CustomTemplate from '../components/sections/Custom-template'
import Footer from '../components/sections/Footer'
import FullScreenFeatures from '../components/sections/FullScreenFeatures'

function Landing() {
  return (
    <div className='overflow-x-hidden'>
      <Header />
      <Hero />
      <Slider />
      <Banner />
      <Features />
      <FullScreenFeatures />
      {/* <img src="/banner-2.png" alt="getting-started" className='w-full h-full object-cover' /> */}
      <video src="/banner-phone.mp4" autoPlay loop muted playsInline className='w-full h-full object-cover block lg:hidden' />
      <video src="/banner-desktop.mp4" autoPlay loop muted playsInline className='w-[80%] mx-auto border-2 border-white h-full object-cover hidden lg:block' />
      <Gettingstarted />
      <YourPhysicalCard />
      <CustomTemplate />
      <Footer />
    </div>
  )
}

export default Landing