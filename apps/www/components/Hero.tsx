import React, { useState, useEffect } from 'react';

const Hero: React.FC = () => {
  const words = ['Seguir', 'Controlar', 'Mejorar', 'Transformar'];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const currentWord = words[currentWordIndex];
    const typingSpeed = isDeleting ? 50 : 100;
    const pauseTime = isDeleting ? 500 : 2000;

    if (isPaused) {
      const pauseTimer = setTimeout(() => {
        setIsPaused(false);
        if (isDeleting) {
          setCurrentWordIndex((prev) => (prev + 1) % words.length);
          setIsDeleting(false);
        } else {
          setIsDeleting(true);
        }
      }, pauseTime);
      return () => clearTimeout(pauseTimer);
    }

    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (currentText.length < currentWord.length) {
          setCurrentText(currentWord.slice(0, currentText.length + 1));
        } else {
          setIsPaused(true);
        }
      } else {
        if (currentText.length > 0) {
          setCurrentText(currentText.slice(0, -1));
        } else {
          setIsPaused(true);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, currentWordIndex, isPaused, words]);

  return (
    <section id="inicio" className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-ing-dark via-ing-dark-secondary to-ing-dark overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(/images/3.png)` }}></div>
      <div className="absolute inset-0 bg-ing-dark opacity-80"></div>
      <div className="relative z-10 max-w-5xl mx-auto text-center px-6">
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4 animate-fade-in-down">
          La Visión para{' '}
          <span className="text-ing-teal relative inline-block min-w-[280px] md:min-w-[400px] text-left">
            {currentText}
            <span className="animate-pulse">|</span>
          </span>
          <br />
          tus Proyectos
        </h1>
        <p className="text-lg md:text-xl font-light mb-8 max-w-4xl mx-auto animate-fade-in-up">
          Soluciones EPCM impulsadas por IA y drones para la optimización de proyectos de construcción de <strong className="text-ing-teal">plantas de procesamiento (SITE)</strong> y de <strong className="text-ing-teal">ductos (LINE)</strong> en Oil & Gas y Minería.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up">
          <a 
            href="#soluciones" 
            className="bg-ing-teal text-white font-semibold px-8 py-3 rounded-lg hover:bg-teal-600 transition-colors shadow-lg w-full sm:w-auto"
          >
            Descubre SITE
          </a>
          <a 
            href="#soluciones" 
            className="bg-transparent border-2 border-ing-teal text-white font-semibold px-8 py-3 rounded-lg hover:bg-ing-teal transition-colors shadow-lg w-full sm:w-auto"
          >
            Descubre LINE
          </a>
        </div>
      </div>
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
        <svg className="w-8 h-8 animate-bounce text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        </svg>
      </div>
    </section>
  );
};

export default Hero;