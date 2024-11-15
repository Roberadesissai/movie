// components/layout/Footer.tsx
import { Facebook, Twitter, Instagram, Youtube, Github } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const Footer = () => {
  const footerLinks = {
    company: ['About Us', 'Careers', 'Contact Us'],
    legal: ['Privacy Policy', 'Terms of Service', 'Cookie Preferences'],
    help: ['Help Center', 'FAQ', 'Supported Devices'],
    account: ['Account', 'Ways to Watch', 'Corporate Information'],
  };

  return (
    <footer className="w-full bg-black/95 text-gray-400 py-12 border-t border-white/10 mt-16">
      <div className="max-w-[2000px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="w-full">
              <h3 className="text-white font-semibold mb-4 capitalize">
                {category}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="hover:text-white transition duration-200 text-sm"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8 bg-gray-800/50" />

        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="flex space-x-4">
            <Button 
              variant="ghost" 
              size="icon"
              className="hover:bg-white/10 hover:text-white transition-colors"
            >
              <Facebook className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="hover:bg-white/10 hover:text-white transition-colors"
            >
              <Twitter className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="hover:bg-white/10 hover:text-white transition-colors"
            >
              <Instagram className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="hover:bg-white/10 hover:text-white transition-colors"
            >
              <Youtube className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="hover:bg-white/10 hover:text-white transition-colors"
            >
              <Github className="h-5 w-5" />
            </Button>
          </div>

          <div className="text-center md:text-right">
            <p className="text-sm">
              © 2024 Arcaureus Stream. All rights reserved.
            </p>
            <p className="text-xs mt-1 text-gray-500">
              Powered by TMDB
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

