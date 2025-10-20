import React from 'react';

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="text-center">
        <div className="flex items-center justify-center h-16 w-16 bg-ing-dark-secondary text-ing-teal rounded-full mx-auto mb-6 border-2 border-ing-teal/50">
            {icon}
        </div>
        <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
        <p className="text-ing-gray">{children}</p>
    </div>
);

const ValueProposition: React.FC = () => {
    return (
        <section id="valor" className="bg-ing-dark-secondary py-20">
            <div className="container mx-auto px-6 text-center">
                <h2 className="text-3xl font-bold text-white mb-4">Ingeniería, Adquisiciones y Construcción con Inteligencia Artificial.</h2>
                <p className="text-ing-gray mb-12 max-w-3xl mx-auto">
                    Redefinimos el EPCM tradicional integrando IA y drones en cada etapa para ofrecer una eficiencia, seguridad y rentabilidad sin precedentes en la industria.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
                    <FeatureCard icon={<IconAI />} title="Inteligencia en Cada Fase">
                        La IA optimiza desde el diseño conceptual y la ingeniería de detalle hasta la gestión logística y la operación, garantizando decisiones basadas en datos.
                    </FeatureCard>
                    <FeatureCard icon={<IconDrone />} title="Visión Sin Precedentes">
                        Utilizamos flotas de drones para el monitoreo continuo, inspecciones de alta precisión y levantamientos topográficos, brindando una visión completa del proyecto en tiempo real.
                    </FeatureCard>
                    <FeatureCard icon={<IconChart />} title="Resultados Tangibles">
                        Nuestra metodología se traduce en una reducción de costos operativos, aceleración de los cronogramas de construcción y una mejora sustancial de los estándares de seguridad.
                    </FeatureCard>
                </div>
            </div>
        </section>
    );
};

const IconAI: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
);
const IconDrone: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zM4.5 12A7.5 7.5 0 0112 4.5v0A7.5 7.5 0 0119.5 12v0A7.5 7.5 0 0112 19.5v0A7.5 7.5 0 014.5 12z" /><path d="M12 2v2.5M12 19.5V22M4.5 12H2m17.5 0h-2.5" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}/></svg>
);
const IconChart: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
);


export default ValueProposition;
