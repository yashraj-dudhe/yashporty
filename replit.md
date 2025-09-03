# Yashraj Dudhe - AI Engineer Portfolio

## Overview

This is a modern AI Engineer portfolio website built with vanilla HTML, CSS, and JavaScript. The portfolio showcases AI engineering expertise, projects, and provides a functional contact form integrated with Supabase for data persistence. The project is designed for easy deployment to various hosting platforms including static hosts and Node.js servers.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Technology Stack**: Vanilla HTML5, CSS3, and JavaScript (no frameworks)
- **Design Pattern**: Single-page application with smooth scrolling navigation
- **Styling Approach**: Minimalistic monochrome design with CSS custom properties for theming
- **Responsive Design**: Mobile-first approach with breakpoints for different screen sizes
- **Performance Focus**: Lightweight implementation without heavy frameworks

### Backend Architecture
- **Server**: Node.js HTTP server serving static files
- **API Endpoints**: RESTful endpoint (`/api/config`) for Supabase configuration
- **Environment Management**: Dual configuration system supporting both `.env` files and environment variables
- **Deployment Flexibility**: Multiple server configurations for different deployment scenarios

### Data Storage Solution
- **Database**: Supabase (PostgreSQL) for contact form submissions
- **Table Structure**: `contact_submissions` table with fields for name, email, message, and timestamps
- **Security**: Row Level Security (RLS) policies for data protection
- **Authentication**: Service role key authentication for secure data insertion

### Configuration Management
- **Environment Variables**: Secure handling of Supabase credentials
- **Fallback System**: Hardcoded fallback configuration for deployment scenarios where environment variables aren't available
- **Client-Side Config**: Dynamic configuration loading with server-side endpoint preference

### Deployment Architecture
- **Multi-Platform Support**: Configurations for static hosting, Node.js servers, and cloud platforms
- **Static Hosting**: Alternative configurations for platforms that don't support server-side environment variables
- **Cloud Deployment**: Specific configurations for Digital Ocean App Platform and Droplet deployments

## External Dependencies

### Database Service
- **Supabase**: PostgreSQL database service for contact form data persistence
  - Real-time database capabilities
  - Built-in authentication and authorization
  - RESTful API auto-generation

### Frontend Libraries
- **@supabase/supabase-js**: JavaScript client library for Supabase integration
- **Font Awesome**: Icon library for UI elements
- **Google Fonts**: Inter font family for typography

### Development Dependencies
- **dotenv**: Environment variable management for local development
- **Node.js**: Runtime environment for the server

### Hosting Platforms
- **Digital Ocean**: Primary deployment target with support for both App Platform and Droplets
- **Static Hosting**: Support for platforms like Netlify, Vercel, and GitHub Pages
- **Traditional VPS**: Node.js server deployment on virtual private servers

### Third-Party Integrations
- **Contact Form Processing**: Supabase database integration for form submissions
- **CDN Resources**: External loading of fonts and icons for performance optimization