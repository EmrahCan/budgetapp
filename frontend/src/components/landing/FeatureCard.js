import React from 'react';

/**
 * FeatureCard - Individual feature card component
 * 
 * Features:
 * - Hover effects with smooth transitions
 * - Icon with gradient background
 * - Responsive padding and sizing
 * - Accessible and semantic HTML
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Icon component to display
 * @param {string} props.title - Feature title
 * @param {string} props.description - Feature description
 */
const FeatureCard = ({ icon, title, description }) => {
  return (
    <div className="group relative p-8 bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 hover:border-blue-200">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
      
      {/* Icon Container */}
      <div className="mb-6 inline-flex p-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
        <div className="text-blue-600 group-hover:text-purple-600 transition-colors duration-300">
          {icon}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
        {title}
      </h3>

      {/* Description */}
      <p className="text-gray-600 leading-relaxed">
        {description}
      </p>

      {/* Decorative element */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-b-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
    </div>
  );
};

export default FeatureCard;
