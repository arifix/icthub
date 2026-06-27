import React from "react";
import { Heart, BookOpen, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-kuet-dark text-gray-300">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand column */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary-700 rounded-lg flex items-center justify-center border border-primary-600">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-base leading-none">ICTHub</p>
                <p className=" text-gray-400 mt-0.5">M.Sc. ICT Study Portal</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-5">
              A comprehensive academic portal for students of the M.Sc. Eng. in ICT
              programme at the Institute of Information and Communication Technology (IICT), KUET.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2 text-gray-400">
                <MapPin className="h-4 w-4 text-accent-500 mt-0.5 shrink-0" />
                <span>IICT, KUET, Khulna-9203, Bangladesh</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-widest mb-4 pb-2 border-b border-white/10">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {[
                { to: "/subjects", label: "Subjects" },
                { to: "/notes", label: "Study Notes" },
                { to: "/calendar", label: "Academic Calendar" },
                { to: "/files", label: "Files & Resources" },
                { to: "/archive", label: "Past Semesters" },
                { to: "/notifications", label: "Notifications" },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm text-gray-400 hover:text-accent-500 transition-colors flex items-center gap-1.5"
                  >
                    <span className="w-1 h-1 rounded-full bg-primary-500 inline-block"></span>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About IICT */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-widest mb-4 pb-2 border-b border-white/10">
              About IICT
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              IICT, the first institute of KUET, was established on 05/10/2010 by the
              approval of University Grant Commission (UGC) of Bangladesh. The goal of
              IICT is to fulfill the national and international demand of ICT.
            </p>
            <ul className="space-y-2 text-sm">
              {[
                { href: "https://www.kuet.ac.bd", label: "KUET Official Website" },
                { href: "https://iict.kuet.ac.bd", label: "IICT Department" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-accent-500 transition-colors flex items-center gap-1.5"
                  >
                    <span className="w-1 h-1 rounded-full bg-primary-500 inline-block"></span>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 bg-kuet-darker">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className=" text-gray-500">
            &copy; {year} ICTHub &mdash; Institute of ICT, KUET. All rights reserved.
          </p>
          <p className=" text-gray-500 flex items-center gap-1">
            Made with <Heart className="h-3 w-3 text-red-400" /> by{" "}
            <a
              href="https://www.arif-khan.net"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-500 hover:text-accent-400 transition-colors"
            >
              Arif Khan
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
