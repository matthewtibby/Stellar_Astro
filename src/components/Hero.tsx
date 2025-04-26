export default function Hero() {
  return (
    <section className="bg-gradient-to-br from-blue-900 via-purple-900 to-black bg-cover bg-center text-white py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Transform Your Images with AI</h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-100">
            Stellar Astro helps you enhance, edit, and transform your photos using cutting-edge AI technology.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#features" className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Get Started
            </a>
            <a href="#pricing" className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors">
              View Pricing
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
