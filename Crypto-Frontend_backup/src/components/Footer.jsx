import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-transparent text-center text-sm text-white">
      {/* Separation line with padding above */}
      <div className="pt-6">
        <div className="mx-auto h-[1px] max-w-7xl bg-[#2F336D]" />
      </div>

      {/* Footer content with some padding */}
      <div className="py-6 px-4">
        © {new Date().getFullYear()} Zeuz. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
