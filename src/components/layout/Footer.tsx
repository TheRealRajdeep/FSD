import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-xl font-bold">IPD Portal</h3>
            <p className="text-gray-400 mt-1">Integrated Project Development</p>
          </div>
          
          <div className="flex flex-col md:flex-row md:space-x-8">
            <div className="mb-4 md:mb-0">
              <h4 className="text-lg font-semibold mb-2">Quick Links</h4>
              <ul className="space-y-1">
                <li><a href="/" className="text-gray-400 hover:text-white transition">Home</a></li>
                <li><a href="/teams" className="text-gray-400 hover:text-white transition">Teams</a></li>
                <li><a href="/dashboard" className="text-gray-400 hover:text-white transition">Dashboard</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-2">Resources</h4>
              <ul className="space-y-1">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Guidelines</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Contact Support</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-6 pt-6 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} University IPD Portal. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;