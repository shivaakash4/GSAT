import Link from "next/link";

export default function Home() {
  const analysisTypes = [
    {
      id: 1,
      title: "Sedimentary Analysis",
      description: "Grain size distribution and statistical analysis for sedimentary rocks",
      icon: "🪨",
      href: "/sedimentry",
      color: "from-blue-500 to-cyan-500",
      bgHover: "hover:shadow-blue-500/50",
      features: ["Grain Size Distribution", "Folk Statistics", "7+ Visual Charts"]
    },
    {
      id: 2,
      title: "Igneous Analysis",
      description: "Mineral composition and crystallization analysis for igneous rocks",
      icon: "🌋",
      href: "/igneous",
      color: "from-red-500 to-orange-500",
      bgHover: "hover:shadow-red-500/50",
      features: ["Mineral Analysis", "QAPF Diagram", "Coming Soon"]
    },
    {
      id: 3,
      title: "Metamorphic Analysis",
      description: "Texture and mineral assemblage analysis for metamorphic rocks",
      icon: "💎",
      href: "/metamorphic",
      color: "from-purple-500 to-pink-500",
      bgHover: "hover:shadow-purple-500/50",
      features: ["Facies Classification", "P-T Conditions", "Coming Soon"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50">
      {/* Header Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <span className="text-6xl">🔬</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600">
            Geological Analysis Suite
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Professional tools for comprehensive petrological and sedimentological analysis
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Online
            </span>
            <span>•</span>
            <span>Free to Use</span>
            <span>•</span>
            <span>No Registration Required</span>
          </div>
        </div>

        {/* Analysis Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {analysisTypes.map((analysis, index) => (
            <Link
              key={analysis.id}
              href={analysis.href}
              className="group block animate-slideUp"
              style={{
                animationDelay: `${index * 0.1}s`
              }}
            >
              <div className={`
                relative h-full bg-white rounded-2xl shadow-lg 
                transition-all duration-300 ease-out
                hover:shadow-2xl ${analysis.bgHover}
                hover:-translate-y-2 hover:scale-[1.02]
                border border-gray-100 overflow-hidden
              `}>
                {/* Gradient Background Overlay */}
                <div className={`
                  absolute inset-0 bg-gradient-to-br ${analysis.color} 
                  opacity-0 group-hover:opacity-10 transition-opacity duration-300
                `}></div>

                {/* Card Content */}
                <div className="relative p-8">
                  {/* Icon */}
                  <div className="text-6xl mb-4 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                    {analysis.icon}
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {analysis.title}
                  </h2>

                  {/* Description */}
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {analysis.description}
                  </p>

                  {/* Features List */}
                  <ul className="space-y-2 mb-6">
                    {analysis.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-700">
                        <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <div className={`
                    inline-flex items-center gap-2 px-6 py-3 rounded-lg
                    bg-gradient-to-r ${analysis.color}
                    text-white font-semibold
                    transform group-hover:gap-4 transition-all duration-300
                    shadow-md group-hover:shadow-xl
                  `}>
                    <span>Start Analysis</span>
                    <svg 
                      className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>

                {/* Corner Decoration */}
                <div className={`
                  absolute -top-10 -right-10 w-32 h-32 rounded-full 
                  bg-gradient-to-br ${analysis.color} opacity-10
                  group-hover:scale-150 group-hover:opacity-20
                  transition-all duration-500
                `}></div>
              </div>
            </Link>
          ))}
        </div>

        {/* Features Section */}
        <div className="mt-20 max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose Our Analysis Tools?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: "⚡", title: "Fast", desc: "Real-time calculations" },
              { icon: "📊", title: "Accurate", desc: "Industry-standard methods" },
              { icon: "💾", title: "Export", desc: "Download results as PNG" },
              { icon: "🎨", title: "Visual", desc: "Beautiful charts & graphs" }
            ].map((feature, idx) => (
              <div 
                key={idx} 
                className="text-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="text-4xl mb-3">{feature.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-16 text-center text-gray-500 text-sm">
          <p className="mb-2">
            Built with Next.js, React, and Chart.js
          </p>
          <p>
            © 2026 Geological Analysis Suite. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}