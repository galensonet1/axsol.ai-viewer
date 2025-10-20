
import React from 'react';

interface FeatureSectionProps {
  imageSrc: string;
  title: string;
  description: string;
  buttonText: string;
  imagePosition: 'left' | 'right';
}

const FeatureSection: React.FC<FeatureSectionProps> = ({ imageSrc, title, description, buttonText, imagePosition }) => {
  const imageOrder = imagePosition === 'left' ? 'lg:order-first' : 'lg:order-last';

  return (
    <section className="py-20 bg-ing-dark-secondary">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className={`flex justify-center ${imageOrder}`}>
            <img src={imageSrc} alt={title} className="rounded-lg shadow-2xl w-full max-w-lg object-cover aspect-[4/3]" />
          </div>
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-white mb-6">{title}</h2>
            <p className="text-lg text-ing-gray mb-8 leading-relaxed">
              {description}
            </p>
            <a href="#" className="inline-block bg-ing-teal text-white font-semibold px-8 py-3 rounded-lg hover:bg-teal-600 transition-colors shadow-md">
              {buttonText}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;