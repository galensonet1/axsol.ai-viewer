import React, { useState, useEffect } from 'react';

const IngeiaLogo: React.FC<{ className?: string }> = ({ className = "text-ing-teal" }) => (
    <div className="flex items-center space-x-3" style={{ height: '32px' }}>
      <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M50 2.5L93.3 26.25V73.75L50 97.5L6.7 73.75V26.25L50 2.5Z" stroke="currentColor" strokeWidth="5"/>
        <path d="M6.7 26.25L50 50L93.3 26.25" stroke="currentColor" strokeWidth="5"/>
        <path d="M50 97.5V50" stroke="currentColor" strokeWidth="5"/>
        <path d="M28.35 38.125L50 50L71.65 38.125" stroke="currentColor" strokeWidth="5"/>
        <path d="M50 59.375L40.175 53.4375L50 47.5L59.825 53.4375L50 59.375Z" fill="currentColor"/>
        <path d="M6.7 73.75L20 65.625" stroke="currentColor" strokeWidth="5"/>
        <circle cx="15" cy="62.5" r="5" fill="currentColor"/>
        <path d="M93.3 73.75L80 65.625" stroke="currentColor" strokeWidth="5"/>
        <circle cx="85" cy="62.5" r="5" fill="currentColor"/>
      </svg>
      <div>
        <span className={`text-2xl font-bold tracking-wider ${className}`}>ingelA</span>
        <span className="text-xs font-medium tracking-[0.2em] text-ing-gray block -mt-1">EPCM</span>
      </div>
    </div>
  );

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  const navLinks = [
    { name: "Inicio", href: "#inicio" },
    { name: "Soluciones", href: "#soluciones" },
    { name: "Tecnología", href: "#tecnologia" }
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-ing-dark-secondary/90 shadow-md backdrop-blur-sm' : 'bg-transparent'}`}>
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <a href="#" aria-label="Homepage">
          <IngeiaLogo className="text-white"/>
        </a>
        <nav className="hidden lg:flex items-center space-x-8">
          {navLinks.map((link) => (
            link.dropdown ? (
              <div 
                key={link.name} 
                className="relative"
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <a href={link.href} className="text-white font-semibold hover:text-ing-teal transition-colors flex items-center">
                  {link.name}
                  <svg className={`w-4 h-4 ml-1 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </a>
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-ing-dark-secondary rounded-lg shadow-xl py-2">
                    {link.dropdown.map(item => (
                      <a key={item.name} href={item.href} className="block px-4 py-2 text-white hover:bg-ing-dark hover:text-ing-teal transition-colors">{item.name}</a>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <a key={link.name} href={link.href} className="text-white font-semibold hover:text-ing-teal transition-colors">
                {link.name}
              </a>
            )
          ))}
        </nav>
        <div className="flex items-center space-x-4">
          <a href="#contacto" className="hidden sm:inline-block bg-ing-teal text-white font-semibold px-6 py-2 rounded-lg hover:bg-teal-600 transition-colors shadow-sm">
            Solicite un Demo
          </a>
          <button className="lg:hidden p-2 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;