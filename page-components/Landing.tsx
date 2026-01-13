'use client';

import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen gradient-mesh flex flex-col md:flex-row relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#CD1141]/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#FFD700]/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-[#CD1141]/5 rounded-full blur-2xl animate-float" style={{ animationDelay: '-1.5s' }} />
      </div>

      <div 
        className="flex-1 flex flex-col justify-center items-center p-8 md:p-16 animate-fade-in relative z-10"
        data-testid="landing-left-panel"
      >
        <div className="max-w-md text-center md:text-left">
          <div className="mb-8 flex justify-center md:justify-start">
            <div className="relative">
              <svg
                width="80"
                height="80"
                viewBox="0 0 80 80"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="animate-fade-in-delayed drop-shadow-[0_0_30px_rgba(205,17,65,0.4)]"
                data-testid="logo-icon"
              >
                <path
                  d="M40 8C22.327 8 8 22.327 8 40C8 57.673 22.327 72 40 72"
                  stroke="#CD1141"
                  strokeWidth="4"
                  strokeLinecap="round"
                  className="animate-draw-path"
                />
                <path
                  d="M40 72C57.673 72 72 57.673 72 40C72 22.327 57.673 8 40 8"
                  stroke="#E53E63"
                  strokeWidth="4"
                  strokeLinecap="round"
                  className="animate-draw-path-delayed"
                />
                <path
                  d="M40 20C28.954 20 20 28.954 20 40C20 51.046 28.954 60 40 60"
                  stroke="#CD1141"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M40 60C51.046 60 60 51.046 60 40C60 28.954 51.046 20 40 20"
                  stroke="#FFD700"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx="40" cy="40" r="6" fill="#CD1141" className="animate-glow-pulse" />
              </svg>
            </div>
          </div>

          <h1 
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 animate-fade-in-up"
            data-testid="headline"
          >
            <span className="text-gradient-espn text-glow-red">Edge Loop</span>
          </h1>
          
          <h2 
            className="text-xl md:text-2xl lg:text-3xl font-semibold text-[#E5E5E5] mb-6 animate-fade-in-up-delayed"
            data-testid="subheadline"
          >
            Data Intelligence Platform
          </h2>
          
          <p 
            className="text-[#A0A0A0] text-base md:text-lg leading-relaxed animate-fade-in-up-delayed-2"
            data-testid="description"
          >
            Enterprise-grade analytics infrastructure for data-driven organizations.
          </p>
        </div>

        <div 
          className="mt-auto pt-8 text-[#A0A0A0]/60 text-sm animate-fade-in"
          data-testid="copyright"
        >
          © {new Date().getFullYear()} Edge Loop. All rights reserved.
        </div>
      </div>

      <div 
        className="flex-1 flex flex-col justify-center items-center p-8 md:p-16 relative z-10 animate-fade-in-right"
        data-testid="landing-right-panel"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#1A1A1A]/50 to-[#1A1A1A]/80 md:bg-gradient-to-r" />
        <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#CD1141]/30 to-transparent hidden md:block" />
        
        <div className="max-w-md w-full text-center relative z-10">
          <h2 
            className="text-2xl md:text-3xl font-bold text-white mb-4"
            data-testid="welcome-heading"
          >
            Welcome Back
          </h2>
          
          <p 
            className="text-[#A0A0A0] mb-8 leading-relaxed"
            data-testid="features-description"
          >
            Access your workspace with automated workflows, 
            scheduled reports, and collaborative tools.
          </p>

          <div className="space-y-4">
            <Button
              asChild
              className="w-full py-6 text-lg font-semibold btn-espn"
              data-testid="button-sign-in"
            >
              <a href="/api/login">Sign In</a>
            </Button>
            
            <p className="text-[#A0A0A0]/60 text-sm" data-testid="auth-info">
              Secure authentication powered by Replit
            </p>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4 text-left">
            <div className="glass-card p-4 rounded-xl" data-testid="feature-exploit">
              <div className="text-[#CD1141] font-semibold mb-1 text-glow-red">Automated</div>
              <div className="text-[#A0A0A0] text-sm">Workflows</div>
            </div>
            <div className="glass-card p-4 rounded-xl" data-testid="feature-ml">
              <div className="text-[#CD1141] font-semibold mb-1 text-glow-red">Real-Time</div>
              <div className="text-[#A0A0A0] text-sm">Updates</div>
            </div>
            <div className="glass-card p-4 rounded-xl" data-testid="feature-realtime">
              <div className="text-[#FFD700] font-semibold mb-1 text-glow-gold">Secure</div>
              <div className="text-[#A0A0A0] text-sm">Platform</div>
            </div>
            <div className="glass-card p-4 rounded-xl" data-testid="feature-picks">
              <div className="text-[#FFD700] font-semibold mb-1 text-glow-gold">Custom</div>
              <div className="text-[#A0A0A0] text-sm">Dashboards</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeInUp {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes fadeInRight {
          from { 
            opacity: 0; 
            transform: translateX(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateX(0); 
          }
        }
        
        @keyframes drawPath {
          from { stroke-dashoffset: 200; }
          to { stroke-dashoffset: 0; }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
        
        .animate-fade-in-delayed {
          opacity: 0;
          animation: fadeIn 0.8s ease-out 0.2s forwards;
        }
        
        .animate-fade-in-up {
          opacity: 0;
          animation: fadeInUp 0.6s ease-out 0.3s forwards;
        }
        
        .animate-fade-in-up-delayed {
          opacity: 0;
          animation: fadeInUp 0.6s ease-out 0.5s forwards;
        }
        
        .animate-fade-in-up-delayed-2 {
          opacity: 0;
          animation: fadeInUp 0.6s ease-out 0.7s forwards;
        }
        
        .animate-fade-in-right {
          opacity: 0;
          animation: fadeInRight 0.6s ease-out 0.4s forwards;
        }
        
        .animate-draw-path {
          stroke-dasharray: 200;
          stroke-dashoffset: 200;
          animation: drawPath 1.5s ease-out forwards;
        }
        
        .animate-draw-path-delayed {
          stroke-dasharray: 200;
          stroke-dashoffset: 200;
          animation: drawPath 1.5s ease-out 0.3s forwards;
        }
      `}</style>
    </div>
  );
}
