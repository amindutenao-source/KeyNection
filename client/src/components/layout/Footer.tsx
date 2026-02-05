import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block">
              <h3 className="text-xl font-bold mb-4">KeyNection</h3>
            </Link>
            <p className="text-gray-400 mb-4 leading-relaxed">
              Connectez les propriétaires inactifs avec des gestionnaires de propriétés. 
              Libérez la valeur de vos espaces inutilisés.
            </p>
            {/* Social Links */}
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">Facebook</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
          
          {/* For Property Owners */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-white">Pour les propriétaires</h4>
            <ul className="space-y-3 text-gray-400">
              <li>
                <Link to="/properties" className="hover:text-white transition-colors">
                  Lister votre propriété
                </Link>
              </li>
              <li>
                <Link to="/applications" className="hover:text-white transition-colors">
                  Trouver des gestionnaires
                </Link>
              </li>
              <li>
                <Link to="/contracts" className="hover:text-white transition-colors">
                  Gérer les candidatures
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  Tableau de bord
                </Link>
              </li>
            </ul>
          </div>
          
          {/* For Property Managers */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-white">Pour les gestionnaires</h4>
            <ul className="space-y-3 text-gray-400">
              <li>
                <Link to="/properties" className="hover:text-white transition-colors">
                  Parcourir les propriétés
                </Link>
              </li>
              <li>
                <Link to="/applications" className="hover:text-white transition-colors">
                  Soumettre des candidatures
                </Link>
              </li>
              <li>
                <Link to="/contracts" className="hover:text-white transition-colors">
                  Gérer les contrats
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  Mon espace
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Support & Legal */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-white">Support & Légal</h4>
            <ul className="space-y-3 text-gray-400">
              <li>
                <a href="/help" className="hover:text-white transition-colors">
                  Centre d'aide
                </a>
              </li>
              <li>
                <a href="/contact" className="hover:text-white transition-colors">
                  Nous contacter
                </a>
              </li>
              <li>
                <a href="/privacy" className="hover:text-white transition-colors">
                  Politique de confidentialité
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-white transition-colors">
                  Conditions d'utilisation
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-gray-400 text-sm">
              &copy; 2024 KeyNection. Tous droits réservés.
            </p>
            <div className="flex space-x-6 text-sm text-gray-400">
              <a href="/cookies" className="hover:text-white transition-colors">
                Cookies
              </a>
              <a href="/sitemap" className="hover:text-white transition-colors">
                Plan du site
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 