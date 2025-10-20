import React from 'react';

const CTA: React.FC = () => {
  return (
    <section id="contacto" className="bg-ing-dark">
      <div className="container mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center bg-ing-dark-secondary p-10 rounded-lg">
          <div className="text-center lg:text-left">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-white">Diseñemos el Futuro de tus Proyectos.</h2>
            <p className="text-lg text-ing-gray max-w-lg mx-auto lg:mx-0">
              Conecta con nuestros expertos para una consultoría sobre tu próximo proyecto SITE o LINE.
            </p>
          </div>
          <form className="w-full" onSubmit={(e) => {
            e.preventDefault();
            // Track form submission
            if (window.posthog) {
              window.posthog.capture('contact_form_submitted', {
                section: 'cta',
                form_type: 'contact'
              });
            }
            // Add your form submission logic here
            console.log('Form submitted');
          }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input type="text" placeholder="Nombre" className="w-full bg-ing-dark border border-ing-dark-secondary p-3 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-ing-teal" />
              <input type="email" placeholder="Correo Electrónico" className="w-full bg-ing-dark border border-ing-dark-secondary p-3 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-ing-teal" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input type="tel" placeholder="Teléfono" className="w-full bg-ing-dark border border-ing-dark-secondary p-3 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-ing-teal" />
                <select className="w-full bg-ing-dark border border-ing-dark-secondary p-3 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-ing-teal">
                    <option>Tipo de Proyecto</option>
                    <option value="site">SITE (Planta)</option>
                    <option value="pipe">LINE (Ducto)</option>
                </select>
            </div>
            <div className="mb-4">
              <textarea placeholder="Mensaje" rows={4} className="w-full bg-ing-dark border border-ing-dark-secondary p-3 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-ing-teal"></textarea>
            </div>
            <button type="submit" className="w-full bg-ing-teal text-white font-bold px-10 py-3 rounded-lg hover:bg-teal-600 transition-colors text-lg shadow-xl">
              Enviar Mensaje
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default CTA;
