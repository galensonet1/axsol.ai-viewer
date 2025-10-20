import React from 'react';

const TechCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="bg-ing-dark-secondary p-8 rounded-lg shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
    <div className="flex items-center mb-4">
        <div className="flex items-center justify-center h-12 w-12 bg-ing-dark text-ing-teal rounded-lg mr-4">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-white">{title}</h3>
    </div>
    <p className="text-ing-gray">{children}</p>
  </div>
);

const Technology: React.FC = () => {
  return (
    <section id="tecnologia" className="py-20 bg-ing-dark-secondary">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">La Arquitectura Tecnológica Detrás de Cada Proyecto</h2>
          <p className="text-ing-gray max-w-3xl mx-auto">
            Nuestra ventaja competitiva radica en un ecosistema tecnológico propietario que integra hardware y software para un control total del ciclo de vida del proyecto.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <TechCard icon={<IconPlatform />} title="Plataforma de IA Propietaria">
            Machine Learning para predicción de riesgos, optimización de recursos y análisis de datos específicos para SITE y PIPE.
          </TechCard>
          <TechCard icon={<IconDrones />} title="Sistemas de Drones Avanzados">
            Capacidades de vuelo autónomo y sensores especializados (RGB, Térmica, LiDAR) para inspecciones y topografía.
          </TechCard>
          <TechCard icon={<IconDigitalTwin />} title="Gemelos Digitales & Simulaciones">
            Creación de réplicas virtuales para planificación, pruebas y monitoreo continuo de activos en construcción y operación.
          </TechCard>
          <TechCard icon={<IconGeospatial />} title="Análisis Geoespacial y 3D">
            Precisión milimétrica para estudios de sitio, análisis de rutas de ductos y cálculo de volúmenes de tierra.
          </TechCard>
        </div>
      </div>
    </section>
  );
};

const IconPlatform: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>;
const IconDrones: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zM4.5 12A7.5 7.5 0 0112 4.5v0A7.5 7.5 0 0119.5 12v0A7.5 7.5 0 0112 19.5v0A7.5 7.5 0 014.5 12z" /><path d="M12 2v2.5M12 19.5V22M4.5 12H2m17.5 0h-2.5" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}/></svg>;
const IconDigitalTwin: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2 1M4 7l2-1M4 7v2.5M12 21.5v-2.5M12 11.5v2.5m0-10l-2 1m2-1l2 1m0 0l2 1m-4-1v2.5M8 11.5l2 1m-2-1l-2-1m2 1v2.5" /></svg>;
const IconGeospatial: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.707 4.293l.001.001M16.293 4.293l-.001.001M12 2.055V5M12 19v2.945m5.707-14.707l-1.414 1.414M5.707 5.707l1.414 1.414m11.293 11.293l-1.414-1.414M5.707 18.293l1.414-1.414" /></svg>;

export default Technology;
