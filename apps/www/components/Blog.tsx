
import React from 'react';

interface BlogPostCardProps {
  imageSrc: string;
  category: string;
  title: string;
}

const BlogPostCard: React.FC<BlogPostCardProps> = ({ imageSrc, category, title }) => (
  <div className="bg-ing-dark-secondary rounded-lg shadow-md overflow-hidden group">
    <a href="#" className="block">
      <img src={imageSrc} alt={title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
      <div className="p-6">
        <p className="text-ing-teal font-semibold text-sm mb-2">{category}</p>
        <h3 className="text-lg font-bold text-white group-hover:text-ing-teal transition-colors mb-4">{title}</h3>
        <span className="font-semibold text-sm text-ing-gray group-hover:text-ing-teal">Leer más &rarr;</span>
      </div>
    </a>
  </div>
);


const Blog: React.FC = () => {
  const posts = [
    {
      imageSrc: "https://picsum.photos/400/300?random=3",
      category: "INGENIERÍA & DISEÑO",
      title: "El futuro de la gestión de proyectos EPCM con IA"
    },
    {
      imageSrc: "https://picsum.photos/400/300?random=4",
      category: "CASO DE ÉXITO",
      title: "Cómo reducimos un 20% los costes en procura para un proyecto energético"
    },
    {
      imageSrc: "https://picsum.photos/400/300?random=5",
      category: "TECNOLOGÍA",
      title: "Drones y Visión Artificial en la supervisión de obras civiles"
    }
  ];

  return (
    <section className="py-20 bg-ing-dark-secondary">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Blog y Noticias</h2>
          <p className="text-ing-gray max-w-2xl mx-auto">
            Descubre las últimas novedades, análisis y casos de éxito del mundo de la IA aplicada a la ingeniería y construcción.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map(post => (
            <BlogPostCard key={post.title} {...post} />
          ))}
        </div>
        <div className="text-center mt-12">
          <a href="#" className="inline-block bg-ing-teal text-white font-semibold px-8 py-3 rounded-lg hover:bg-teal-600 transition-colors shadow-md">
            Ver todo el blog
          </a>
        </div>
      </div>
    </section>
  );
};

export default Blog;