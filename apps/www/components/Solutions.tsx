import React from 'react';

const ServicePoint: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
    <li className="flex items-center space-x-3">
        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-ing-teal/20 text-ing-teal rounded-full">
            {icon}
        </div>
        <span className="text-ing-light-gray">{title}</span>
    </li>
);

const Solutions: React.FC = () => {
    return (
        <section id="soluciones" className="bg-ing-dark-secondary py-20">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-white mb-4">Soluciones EPCM Innovadoras para sus Activos Críticos</h2>
                    <p className="text-ing-gray max-w-3xl mx-auto">
                        Transformamos la complejidad en éxito con nuestras ofertas especializadas, diseñadas para los desafíos únicos de plantas de procesamiento y ductos.
                    </p>
                </div>
                
                {/* SITE Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
                    <div className="flex justify-center">
                        <img src="/images/5.png" alt="Planta de Procesamiento" className="rounded-lg shadow-2xl w-full max-w-lg object-cover aspect-[4/3]" />
                    </div>
                    <div className="text-center lg:text-left">
                        <h3 className="text-3xl font-bold text-white mb-4">SITE: EPCM para Plantas de Procesamiento</h3>
                        <p className="text-ing-gray mb-6 leading-relaxed">
                            Gestión EPCM integral con IA y drones para el diseño, construcción y optimización de refinerías y plantas de procesamiento en Oil & Gas y minería.
                        </p>
                        <ul className="space-y-4 mb-8 text-left inline-block">
                            <ServicePoint icon={<CheckIcon />} title="Diseño Predictivo y Modelado con IA" />
                            <ServicePoint icon={<CheckIcon />} title="Construcción Monitoreada con Drones" />
                            <ServicePoint icon={<CheckIcon />} title="Gestión de Activos y Mantenimiento Predictivo" />
                        </ul>
                        <div>
                            <a href="#" className="inline-block bg-ing-teal text-white font-semibold px-8 py-3 rounded-lg hover:bg-teal-600 transition-colors shadow-md">
                                Más sobre SITE
                            </a>
                        </div>
                    </div>
                </div>

                {/* PIPE Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="text-center lg:text-left lg:order-last">
                         <h3 className="text-3xl font-bold text-white mb-4">LINE: EPCM para Proyectos de Ductos</h3>
                        <p className="text-ing-gray mb-6 leading-relaxed">
                            Soluciones EPCM completas, desde la topografía y apertura de pista hasta la construcción y monitoreo de facilidades de ductos con tecnología de punta.
                        </p>
                        <ul className="space-y-4 mb-8 text-left inline-block">
                            <ServicePoint icon={<CheckIcon />} title="Ruta Óptima con Análisis Geoespacial IA" />
                            <ServicePoint icon={<CheckIcon />} title="Inspección Aérea Continua con Drones" />
                            <ServicePoint icon={<CheckIcon />} title="Aseguramiento de Integridad del ducto" />
                        </ul>
                        <div>
                            <a href="#" className="inline-block bg-ing-teal text-white font-semibold px-8 py-3 rounded-lg hover:bg-teal-600 transition-colors shadow-md">
                                Más sobre LINE
                            </a>
                        </div>
                    </div>
                    <div className="flex justify-center lg:order-first">
                        <img src="/images/10.png" alt="Construcción de Ductos" className="rounded-lg shadow-2xl w-full max-w-lg object-cover aspect-[4/3]" />
                    </div>
                </div>
            </div>
        </section>
    );
};

const CheckIcon: React.FC = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
);

export default Solutions;
