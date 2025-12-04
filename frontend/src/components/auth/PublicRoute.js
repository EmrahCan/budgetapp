import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * PublicRoute - Route component for public pages
 * 
 * Redirects authenticated users to dashboard
 * Allows unauthenticated users to view the page
 */
const PublicRoute = ({ children }) => {
  // Check if user has token in localStorage
  const token = localStorage.getItem('token');
  
  // If user has token, redirect to dashboard
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  // Otherwise, show the public page (landing page)
  return children;
};

export default PublicRoute;
