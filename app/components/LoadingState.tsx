export default function LoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-700 rounded mx-auto mb-4"></div>
          <div className="h-4 w-64 bg-gray-700 rounded mx-auto"></div>
        </div>
      </div>
    </div>
  );
} 