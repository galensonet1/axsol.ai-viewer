import React from 'react';

interface ProjectCardProps {
  imageSrc: string;
  type: 'SITE' | 'PIPE';
  title: string;
  achievement: string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ imageSrc, type, title, achievement }) => (
  <div className="bg-ing-dark-secondary rounded-lg shadow-md overflow-hidden group">
    <a href="#" className="block">
      <div className="relative">
        <img src={imageSrc} alt={title} className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300" />
        <span className={`absolute top-4 left-4 text-xs font-bold px-3 py-1 rounded-full text-white ${type === 'SITE' ? 'bg-blue-500' : 'bg-green-500'}`}>{type}</span>
      </div>
      <div className="p-6">
        <h3 className="text-lg font-bold text-white group-hover:text-ing-teal transition-colors mb-2">{title}</h3>
        <p className="text-ing-gray text-sm mb-4">{achievement}</p>
        <span className="font-semibold text-sm text-ing-teal group-hover:underline">Ver Proyecto Completo &rarr;</span>
      </div>
    </a>
  </div>
);

const Projects: React.FC = () => {
  // FIX: Explicitly type the projects array to match the ProjectCardProps interface.
  const projects: ProjectCardProps[] = [
    {
      imageSrc: "https://picsum.photos/400/300?random=3",
      type: "SITE",
      title: "Optimización EPCM de Refinería en la Costa",
      achievement: "Logro: Reducción del 18% en costos de construcción y 12% en tiempo de ejecución."
    },
    {
      imageSrc: "https://picsum.photos/400/300?random=4",
      type: "PIPE",
      title: "Construcción de Ducto Transandino de 450km",
      achievement: "Logro: Aceleración del 25% en cronograma gracias al monitoreo con drones."
    },
    {
      imageSrc: "https://picsum.photos/400/300?random=5",
      type: "SITE",
      title: "Ampliación de Planta de Procesamiento de Minerales",
      achievement: "Logro: Cero accidentes incapacitantes y cumplimiento del 99% del presupuesto."
    }
  ];

  return (
    <section className="py-20 bg-ing-dark">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Proyectos Transformados: Historias de Éxito</h2>
          <p className="text-ing-gray max-w-2xl mx-auto">
            Nuestra tecnología no solo promete, sino que entrega resultados medibles en los proyectos más complejos de la industria.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map(project => (
            <ProjectCard key={project.title} {...project} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;