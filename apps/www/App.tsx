import React from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ValueProposition from './components/ValueProposition';
import Solutions from './components/Solutions';
import Technology from './components/Technology';
import Projects from './components/Projects';
import Testimonials from './components/Testimonials';
import CTA from './components/CTA';
import Footer from './components/Footer';

const App: React.FC = () => {
  return (
    <div className="bg-ing-dark text-white font-sans">
      <Header />
      <main>
        <Hero />
        <ValueProposition />
        <Solutions />
        <Technology />
        <Projects />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default App;