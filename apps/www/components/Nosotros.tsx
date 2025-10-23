import React from 'react';

const Nosotros: React.FC = () => {
  return (
    <section id="nosotros" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header con logos */}
        <div className="text-center mb-16">
          <div className="flex justify-center items-center gap-6 mb-8 flex-wrap">
            <img 
              src="/images/logo/ingenieria-sima-sa.jpg" 
              alt="Ingeniería SIMA S.A." 
              className="h-16 md:h-20"
            />
            <div className="text-3xl md:text-4xl text-ing-teal font-bold">+</div>
            <img 
              src="/images/logo/logoaxsol.png" 
              alt="AXSOL" 
              className="h-16 md:h-20"
            />
            <div className="text-3xl md:text-4xl text-ing-teal font-bold">=</div>
            <img 
              src="/images/logo/4.png" 
              alt="IngeIA EPCM" 
              className="h-20 md:h-24"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-ing-dark mb-4">
            Nosotros
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            La fusión de legados para liderar la ingeniería del mañana
          </p>
        </div>

        {/* Contenido principal */}
        <div className="prose prose-lg max-w-none">
          <div className="bg-gradient-to-br from-ing-teal/5 to-blue-50 p-8 rounded-2xl mb-12">
            <h2 className="text-3xl font-bold text-ing-dark mb-6">
              IngeIA EPCM: Fusionando Legados para Liderar la Ingeniería del Mañana
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Nos complace anunciar el lanzamiento de <strong className="text-ing-teal">IngeIA EPCM – The Vision To Make It</strong>, 
              una nueva organización que redefine la gestión de proyectos de ingeniería, procura y construcción. 
              IngeIA EPCM es el resultado de la unión estratégica de dos fuerzas complementarias: la vasta experiencia 
              en infraestructura y energía de Ingeniería SIMA S.A., y la vanguardia en Inteligencia Geoespacial de AXSOL.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Esto significa que IngeIA.tech es una joint venture de alto perfil que combina la capacidad tecnológica 
              de AXSOL con la vasta experiencia y la robusta infraestructura de SIMA, pero enfocándose específicamente 
              en ingeniería, procura y gestión de la construcción (EPCM).
            </p>
          </div>

          {/* Sección SIMA */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-ing-dark mb-6 flex items-center">
              <div className="w-1 h-8 bg-ing-teal mr-4"></div>
              Un Legado de Ingeniería Sólida: Ingeniería SIMA S.A.
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Fundada en 1979, Ingeniería SIMA S.A. es un pilar de la ingeniería argentina, con más de 40 años 
              de trayectoria y una plantilla superior a los 800 profesionales. Hemos sido un actor clave en la 
              producción de hidrocarburos y la generación de energía, ejecutando proyectos de ingeniería, 
              construcción de instalaciones, operación y mantenimiento en todo el país.
            </p>
            <p className="text-gray-700 leading-relaxed">
              La solidez, la rigurosidad técnica y el compromiso con la excelencia han sido siempre nuestros pilares.
            </p>
          </div>

          {/* Sección AXSOL */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-ing-dark mb-6 flex items-center">
              <div className="w-1 h-8 bg-ing-teal mr-4"></div>
              La Inteligencia del Futuro: AXSOL
            </h3>
            <p className="text-gray-700 leading-relaxed">
              AXSOL ha emergido como un pionero en la inteligencia artificial y el análisis geoespacial. 
              Nuestra especialización radica en el desarrollo de soluciones de IA nativas, capaces de transformar 
              grandes volúmenes de datos visuales y espaciales en inteligencia accionable, optimizando la toma 
              de decisiones y el monitoreo de activos.
            </p>
          </div>

          {/* Sección IngeIA EPCM */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-ing-dark mb-6 flex items-center">
              <div className="w-1 h-8 bg-ing-teal mr-4"></div>
              IngeIA EPCM: La Visión que lo Hace Posible
            </h3>
            <p className="text-gray-700 leading-relaxed mb-8">
              La formación de IngeIA EPCM responde a una necesidad crítica de la industria: eliminar la disociación 
              espacio-temporal entre el diseño, la ejecución y el plan constructivo. Unimos la probada capacidad 
              de SIMA en EPCM con la avanzada IA de AXSOL para ofrecer una sincronización perfecta y una gestión 
              proactiva de los proyectos.
            </p>

            <div className="bg-ing-dark text-white p-8 rounded-2xl">
              <p className="text-lg leading-relaxed">
                IngeIA EPCM nace para garantizar que cada proyecto no solo se conciba con 
                <strong className="text-ing-teal"> "The Vision To Make It"</strong>, sino que se ejecute con una 
                precisión y eficiencia sin precedentes, guiada por la inteligencia artificial y la profunda 
                experiencia en ingeniería.
              </p>
              <p className="text-lg leading-relaxed mt-4 text-ing-teal font-semibold">
                Estamos aquí para construir el futuro, un proyecto inteligente a la vez.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Nosotros;
