import React from "react";
import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center mb-4 gap-1">
              <Link to="/" className="flex flex-col">
                <img
                  src={logo}
                  alt="ICTHub Logo"
                  className="w-[200px] brightness-0 invert"
                />
                <p className="text-xs text-white leading-none -mt-1 ml-[72px]">
                  M.Sc. Eng. in ICT Study Portal
                </p>
              </Link>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-4 max-w-md">
              A comprehensive academic portal for students of the M.Sc. Eng. in
              ICT programme at the Institute of Information and Communication
              Technology (IICT), KUET
            </p>
            <div className="flex items-start gap-2 text-sm text-gray-400">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
              <span>IT Park, KUET, Khulna-9203, Bangladesh</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Quick Links
            </h3>
            <ul className="space-y-2 ml-2">
              {[
                { to: "/subjects", label: "Subjects" },
                { to: "/notes", label: "Study Notes" },
                { to: "/calendar", label: "Calendar" },
                { to: "/files", label: "Files & Resources" },
                { to: "/archive", label: "Archive" },
                { to: "/information", label: "Information" },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-gray-400 hover:text-blue-400 transition-colors duration-200 text-sm flex items-center group"
                  >
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              About IICT
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              IICT, the first institute of KUET, was established on 05/10/2010
              by the approval of UGC Bangladesh. Dedicated to advancing ICT
              education
            </p>
            <ul className="space-y-2 text-sm ml-2">
              {[
                {
                  href: "https://www.kuet.ac.bd",
                  label: "KUET Official Website",
                },
                { href: "https://iict.kuet.ac.bd", label: "IICT Department" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-blue-400 transition-colors duration-200 flex items-center group"
                  >
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2" />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
            <div className="flex flex-col items-center md:items-start text-sm text-gray-400">
              <span>&copy; {year} ICTHub</span>
              <span>Last updated on: 2026-09-01</span>
            </div>
            <div className="text-center md:text-left text-sm text-gray-400">
              <span>Made by </span>
              <a
                href="https://www.arif-khan.net"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
              >
                Arif Khan
              </a>
              <br />
              Built with React, TypeScript, TailwindCSS, Supabase &{" "}
              <span className="animate-pulse">❤️</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
