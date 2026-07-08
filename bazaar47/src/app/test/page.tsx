export default function TestPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="container max-w-4xl">
        <h1 className="font-period-narrow font-bold text-4xl text-rosewood mb-8">
          Color Test - Bazaar 47
        </h1>
        
        {/* Brand Colors */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-cypress text-plaster rounded-lg">Cypress</div>
          <div className="p-4 bg-hippie text-rosewood rounded-lg">Hippie</div>
          <div className="p-4 bg-plaster text-rosewood rounded-lg border">Plaster</div>
          <div className="p-4 bg-sand-dune text-rosewood rounded-lg">Sand Dune</div>
          <div className="p-4 bg-henna text-plaster rounded-lg">Henna</div>
          <div className="p-4 bg-chartreuse text-grove rounded-lg">Chartreuse</div>
          <div className="p-4 bg-olive text-grove rounded-lg">Olive</div>
          <div className="p-4 bg-petal text-rosewood rounded-lg">Petal</div>
          <div className="p-4 bg-grove text-plaster rounded-lg">Grove</div>
          <div className="p-4 bg-rosewood text-plaster rounded-lg">Rosewood</div>
          <div className="p-4 bg-poppy text-plaster rounded-lg">Poppy</div>
        </div>

        {/* Typography */}
        <div className="space-y-4 mb-8">
          <h2 className="font-period-narrow font-bold text-3xl">Typography Test</h2>
          <p className="font-period text-base">Regular Body Text</p>
          <p className="font-period italic">Regular Italic</p>
          <p className="font-period font-semibold">Semibold</p>
          <p className="font-period font-semibold italic">Semibold Italic</p>
          <p className="font-period-narrow font-bold">Narrow Bold - Special Treatment</p>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button className="px-6 py-3 bg-cypress text-plaster rounded-lg hover:bg-cypress/90 transition-colors">
            Primary Button
          </button>
          <button className="px-6 py-3 bg-hippie text-rosewood rounded-lg hover:bg-hippie/90 transition-colors">
            Accent Button
          </button>
          <button className="px-6 py-3 bg-plaster text-rosewood border border-sand-dune rounded-lg hover:bg-sand-dune/30 transition-colors">
            Secondary Button
          </button>
          <button className="px-6 py-3 bg-rosewood text-plaster rounded-lg hover:bg-rosewood/90 transition-colors">
            Dark Button
          </button>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card">
            <h3 className="font-semibold text-rosewood">Card Light</h3>
            <p className="text-sm text-rosewood/70">With backdrop blur</p>
          </div>
          <div className="card-dark">
            <h3 className="font-semibold text-plaster">Card Dark</h3>
            <p className="text-sm text-plaster/70">With backdrop blur</p>
          </div>
          <div className="p-6 bg-grove text-plaster rounded-lg shadow-lg">
            <h3 className="font-semibold">Grove Card</h3>
            <p className="text-sm text-plaster/70">Solid color</p>
          </div>
        </div>
      </div>
    </div>
  )
}