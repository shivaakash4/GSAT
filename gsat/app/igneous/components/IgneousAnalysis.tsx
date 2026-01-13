'use client';

import Link from "next/link";

export default function IgneousAnalysis() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <div className="container mx-auto px-4 py-16">
        {/* Back Button */}
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-8xl mb-8 animate-bounce">
            🌋
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-orange-600">
            Igneous Rock Analysis
          </h1>
          
          <div className="bg-white rounded-2xl shadow-xl p-12 mb-8">
            <div className="inline-block px-6 py-3 bg-yellow-100 border-2 border-yellow-400 rounded-full mb-6">
              <span className="text-yellow-800 font-bold">🚧 Coming Soon</span>
            </div>
            
            <p className="text-xl text-gray-600 mb-8">
              Advanced tools for igneous rock classification and analysis are currently under development.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-2xl mx-auto mb-8">
              <div className="p-4 bg-red-50 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-2">🔬 Planned Features</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• QAPF Diagram Classification</li>
                  <li>• TAS Diagram Plotting</li>
                  <li>• Mineral Modal Analysis</li>
                  <li>• Crystallization Index</li>
                </ul>
              </div>
              
              <div className="p-4 bg-orange-50 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-2">📊 Expected Tools</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• AFM Diagrams</li>
                  <li>• Harker Variation Diagrams</li>
                  <li>• REE Spider Plots</li>
                  <li>• Trace Element Analysis</li>
                </ul>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-6">
              Want to be notified when this feature launches? Stay tuned for updates!
            </p>

            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold rounded-lg hover:shadow-xl transition-all hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Return to Dashboard
            </Link>
          </div>

          {/* Preview Section */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Development Roadmap
            </h2>
            <div className="flex justify-center items-center gap-4 flex-wrap">
              <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                ✅ Sedimentary - Live
              </span>
              <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                🔄 Igneous - In Progress
              </span>
              <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm font-semibold">
                📋 Metamorphic - Planned
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}