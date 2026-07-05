// Regenerate assets/graph.svg from data.js + scale.js (for the README).
// Run: node build-graph.js
const fs = require("fs");

const footer = `
(function(){
  let robot = "";
  Object.keys(MODELS).forEach(name=>{
    const t = tokensFrom(getModelVals(name));
    const x = xm(t.N), y = ym(t.eff);
    robot += '<circle cx='+x+' cy='+y+' r="7" fill="#0d9488" stroke="#fff" stroke-width="2"/>'
           + '<text x='+x+' y='+(y-13)+' fill="#0d9488" font-size="12" font-weight="600" text-anchor="middle">'+name+'</text>';
  });
  // scale.js emits unquoted numeric attributes (ok in HTML); quote them for strict XML.
  const inner = (plotScaffold() + robot + plotBorder()).replace(/=(-?[\\d.]+)(?=[ \\/>])/g, '="$1"');
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+PLOT.W+' '+PLOT.H+'" width="'+PLOT.W+'" height="'+PLOT.H+'" '
    + 'font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif">'
    + '<rect width="'+PLOT.W+'" height="'+PLOT.H+'" fill="#ffffff"/>'
    + inner + '</svg>';
  fs.mkdirSync("assets", {recursive:true});
  fs.writeFileSync("assets/graph.svg", svg);
  console.log("wrote assets/graph.svg");
})();
`;

const src = fs.readFileSync("data.js","utf8") + "\n"
          + fs.readFileSync("scale.js","utf8") + "\n"
          + footer;
eval(src);
