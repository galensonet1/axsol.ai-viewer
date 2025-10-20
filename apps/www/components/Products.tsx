
import React from 'react';

interface ProductCardProps {
  logo: React.ReactNode;
  name: string;
  description: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ logo, name, description }) => (
    <div className="bg-ing-dark-secondary rounded-xl shadow-lg p-10 flex flex-col items-start hover:scale-105 transition-transform duration-300">
        <div className="mb-6">{logo}</div>
        <h3 className="text-2xl font-bold text-white mb-4">{name}</h3>
        <p className="text-ing-gray mb-6 flex-grow">{description}</p>
        <a href="#" className="font-semibold text-ing-teal hover:underline mt-auto">
            Saber más &rarr;
        </a>
    </div>
);

const PlatformLogo: React.FC = () => (
    <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-900/50 border border-blue-500/50 rounded-lg flex items-center justify-center font-bold text-blue-300 text-xl">P</div>
        <span className="text-xl font-bold text-white">IngeIA.Platform</span>
    </div>
);

const SiteLogo: React.FC = () => (
    <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-900/50 border border-green-500/50 rounded-lg flex items-center justify-center font-bold text-green-300 text-xl">S</div>
        <span className="text-xl font-bold text-white">IngeIA.Site</span>
    </div>
);

const Products: React.FC = () => {
    return (
        <section className="py-20 bg-ing-dark">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-white mb-4">Nuestros Productos</h2>
                    <p className="text-ing-gray max-w-2xl mx-auto">
                        Plataformas robustas y escalables que forman el núcleo de nuestras soluciones de inteligencia artificial para EPCM.
                    </p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    <ProductCard
                        logo={<PlatformLogo />}
                        name="IngeIA.Platform"
                        description="Nuestra plataforma central en la nube para la gestión integral de proyectos EPCM. Centraliza datos, ejecuta modelos de IA y ofrece dashboards para la toma de decisiones."
                    />
                    <ProductCard
                        logo={<SiteLogo />}
                        name="IngeIA.Site"
                        description="Soluciones on-site que llevan la inteligencia artificial al terreno. Captura y procesa datos en tiempo real para un control operativo sin precedentes."
                    />
                </div>
            </div>
        </section>
    );
};

export default Products;