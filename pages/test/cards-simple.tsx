export default function CardsSimple() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        Event Card Showcase - Simple Version
      </h1>
      
      <p className="text-lg text-gray-600 mb-8">
        Testing page rendering. If you see this, the page works!
      </p>

      <div className="bg-white rounded-2xl p-8 shadow-md mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Test Card</h3>
        <p className="text-sm text-gray-600">This is a simple test card with no dynamic imports.</p>
      </div>

      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <p className="text-sm text-blue-700">
          ✓ If you can see this page, the server is working correctly.
        </p>
        <p className="text-sm text-blue-600 mt-2">
          Next step: Add dynamic imports for the actual timeline cards.
        </p>
      </div>
    </div>
  )
}
