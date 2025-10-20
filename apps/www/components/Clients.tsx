
import React from 'react';

const ClientLogo: React.FC<{ name: string; logoUrl: string }> = ({ name, logoUrl }) => (
  <img
    src={logoUrl}
    alt={name}
    className="h-10 md:h-12 object-contain filter grayscale brightness-0 invert hover:filter-none transition-all duration-300 ease-in-out"
  />
);

const Clients: React.FC = () => {
  const clients = [
    { name: "Client 1", logoUrl: "https://via.placeholder.com/150x50/ffffff/000000?text=Logo+1" },
    { name: "Client 2", logoUrl: "https://via.placeholder.com/150x50/ffffff/000000?text=Logo+2" },
    { name: "Client 3", logoUrl: "https://via.placeholder.com/150x50/ffffff/000000?text=Logo+3" },
    { name: "Client 4", logoUrl: "https://via.placeholder.com/150x50/ffffff/000000?text=Logo+4" },
    { name: "Client 5", logoUrl: "https://via.placeholder.com/150x50/ffffff/000000?text=Logo+5" },
    { name: "Client 6", logoUrl: "https://via.placeholder.com/150x50/ffffff/000000?text=Logo+6" },
  ];

  return (
    <section className="bg-ing-dark-secondary py-20">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Confían en nosotros</h2>
        <p className="text-ing-gray mb-12 max-w-2xl mx-auto">
          Colaboramos con empresas líderes en los sectores de ingeniería y construcción para materializar proyectos visionarios.
        </p>
        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8">
          {clients.map((client) => (
            <ClientLogo key={client.name} name={client.name} logoUrl={client.logoUrl} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Clients;