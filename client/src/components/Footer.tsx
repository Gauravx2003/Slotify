import { Link } from "react-router-dom";
import { Calendar, Twitter, Linkedin, Github, Mail, MapPin, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative bg-white pt-32 pb-16 overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-rust-50/50 rounded-full blur-[120px] -mb-64 -mr-64 -z-10"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-16 mb-24">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-8 group">
              <div className="w-12 h-12 bg-rust-500 rounded-2xl flex items-center justify-center transform group-hover:rotate-6 transition-transform shadow-lg">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tighter uppercase leading-none text-surface-900">Slotify</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rust-500">Perfect Booking</span>
              </div>
            </Link>
            <p className="text-surface-500 font-medium text-lg leading-relaxed mb-10 max-w-sm">
              The world's most flexible scheduling platform. We help you manage 
              resources, automate workflows, and grow your professional network.
            </p>
            <div className="flex gap-4">
              {[
                { icon: Twitter, href: "#" },
                { icon: Linkedin, href: "#" },
                { icon: Github, href: "#" },
                { icon: Mail, href: "mailto:hello@slotify.com" }
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  className="w-12 h-12 rounded-2xl bg-surface-50 border border-rust-50 flex items-center justify-center text-surface-400 hover:bg-rust-500 hover:text-white hover:border-rust-500 hover:-translate-y-1 transition-all duration-300"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-black text-surface-900 uppercase tracking-[0.2em] mb-8">Product</h4>
            <ul className="space-y-4">
              {["Features", "Integrations", "Enterprise", "Pricing"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-surface-500 hover:text-rust-600 font-bold transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black text-surface-900 uppercase tracking-[0.2em] mb-8">Support</h4>
            <ul className="space-y-4">
              {["Help Center", "API Documentation", "Contact Us"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-surface-500 hover:text-rust-600 font-bold transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black text-surface-900 uppercase tracking-[0.2em] mb-8">Contact</h4>
            <ul className="space-y-6">
              <li className="flex gap-4">
                <MapPin className="w-5 h-5 text-rust-500 shrink-0" />
                <span className="text-surface-500 font-medium text-sm">
                  T.P-13 <br />
                  Vadodara, India 390024
                </span>
              </li>
              <li className="flex gap-4">
                <Phone className="w-5 h-5 text-rust-500 shrink-0" />
                <span className="text-surface-500 font-medium text-sm">+91 8511633118</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-rust-50 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <p className="font-bold text-surface-400 text-sm">
              &copy; {new Date().getFullYear()} Slotify. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-xs font-bold text-surface-400 hover:text-surface-900 transition-colors">Privacy Policy</a>
              <a href="#" className="text-xs font-bold text-surface-400 hover:text-surface-900 transition-colors">Terms of Service</a>
              <a href="#" className="text-xs font-bold text-surface-400 hover:text-surface-900 transition-colors">Cookie Policy</a>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-rust-50 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-rust-600">All Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
