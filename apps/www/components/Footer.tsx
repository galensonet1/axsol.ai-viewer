import React from 'react';

const FooterLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <li>
    <a href={href} className="text-ing-gray hover:text-ing-teal transition-colors">
      {children}
    </a>
  </li>
);

const SocialIcon: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <a href={href} className="text-ing-gray hover:text-ing-teal transition-colors" target="_blank" rel="noopener noreferrer">
    {children}
  </a>
);

const IngeiaLogo: React.FC<{ className?: string }> = ({ className = "" }) => (
    <div className="flex items-center" style={{ height: '48px' }}>
      <img src="/images/logo/7.png" alt="ingeIA EPCM" className="h-12" />
    </div>
  );

const Footer: React.FC = () => {
  return (
    <footer className="bg-ing-dark-secondary">
      <div className="container mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Column 1: Logo & Socials */}
          <div className="lg:col-span-2 mb-6 lg:mb-0">
            <a href="#" className="inline-block mb-4">
              <IngeiaLogo className="text-white" />
            </a>
            <p className="text-ing-gray mb-6 max-w-sm">
              IngeIA EPCM. Aplicamos IA para la excelencia en proyectos de Ingeniería, Procura y Construcción de plantas (SITE) y ductos (LINE).
            </p>
            <div className="flex space-x-4">
              <SocialIcon href="https://linkedin.com">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.28 1.548h2.559v8.59H3.725v-8.59zM17.638 2H6.362A4.362 4.362 0 002 6.362v11.276A4.362 4.362 0 006.362 22h11.276A4.362 4.362 0 0022 17.638V6.362A4.362 4.362 0 0017.638 2z" clipRule="evenodd" /></svg>
              </SocialIcon>
            </div>
          </div>
          {/* Column 2: Solutions */}
          <div>
            <h3 className="font-bold text-white mb-4">Soluciones</h3>
            <ul className="space-y-3">
              <FooterLink href="#soluciones">SITE (Plantas)</FooterLink>
              <FooterLink href="#soluciones">LINE (Ductos)</FooterLink>
              <FooterLink href="#tecnologia">Tecnología</FooterLink>
              <FooterLink href="#proyectos">Proyectos</FooterLink>
            </ul>
          </div>
          {/* Column 3: Industrias */}
          <div>
            <h3 className="font-bold text-white mb-4">Industrias</h3>
            <ul className="space-y-3">
              <FooterLink href="#">Oil & Gas</FooterLink>
              <FooterLink href="#">Minería</FooterLink>
            </ul>
          </div>
          {/* Column 4: Compañía */}
          <div>
            <h3 className="font-bold text-white mb-4">Compañía</h3>
            <ul className="space-y-3">
              <FooterLink href="#inicio">Nosotros</FooterLink>
              <FooterLink href="#contacto">Carreras</FooterLink>
              <FooterLink href="#contacto">Contacto</FooterLink>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-700 pt-6 flex flex-col sm:flex-row justify-between items-center text-sm text-ing-gray">
          <p>&copy; {new Date().getFullYear()} IngeIA EPCM. Todos los derechos reservados.</p>
          <div className="flex space-x-4 mt-4 sm:mt-0">
            <a href="#" className="hover:text-ing-teal">Política de Privacidad</a>
            <a href="#" className="hover:text-ing-teal">Términos de Uso</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
