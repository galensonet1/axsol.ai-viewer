import React from 'react';

interface TestimonialCardProps {
  quote: string;
  name: string;
  title: string;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ quote, name, title }) => (
    <div className="bg-ing-dark-secondary p-8 rounded-lg shadow-lg">
        <p className="text-ing-light-gray italic mb-6">"{quote}"</p>
        <div>
            <p className="font-bold text-white">{name}</p>
            <p className="text-sm text-ing-gray">{title}</p>
        </div>
    </div>
);

const Testimonials: React.FC = () => {
    return (
        <section id="testimonios" className="bg-ing-dark py-20">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-white mb-4">La Confianza de la Industria Pesada</h2>
                    <p className="text-ing-gray max-w-2xl mx-auto">
                        Nuestros clientes son nuestros mejores embajadores. Vea cómo hemos ayudado a líderes del sector a alcanzar sus objetivos.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    <TestimonialCard 
                        quote="La plataforma de IngeIA nos dio una visibilidad del proyecto que nunca antes habíamos tenido. El monitoreo con drones fue clave para anticipar problemas en nuestro proyecto SITE."
                        name="Carlos Valenzuela"
                        title="Gerente de Proyectos, PetroCorp"
                    />
                    <TestimonialCard 
                        quote="El nivel de detalle en el análisis de la ruta para nuestro ducto nos ahorró meses de trabajo y millones en costos. Un socio tecnológico indispensable."
                        name="Mariana Rojas"
                        title="Directora de Ingeniería, Gasoductos del Norte"
                    />
                    <TestimonialCard 
                        quote="Pasamos de una gestión reactiva a una predictiva. La capacidad de IngeIA para integrar datos y generar insights accionables ha transformado nuestra operación."
                        name="John Miller"
                        title="COO, Mining Solutions Inc."
                    />
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
