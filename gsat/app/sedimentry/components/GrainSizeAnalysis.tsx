'use client';

import { useState } from 'react';
import Plot from 'react-plotly.js';

const SANS_SERIF_STACK = "'Inter', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";

interface Sieve {
  size: number | string;
  phi: number;
}

interface AnalysisResults {
  Mz: string;
  Sd: string;
  Sk: string;
  Kg: string;
  D50mm: string;
  p50: number;
  modePhi: number | string;
  weightPercent: number[];
  cumulativePassingPercent: number[];
  phiPoints: number[];
  p5: number;
  p16: number;
  p84: number;
  p95: number;
}

const sieves: Sieve[] = [
  { size: 8, phi: -3 }, { size: 4, phi: -2 }, { size: 2, phi: -1 },
  { size: 1, phi: 0 }, { size: 0.5, phi: 1 }, { size: 0.25, phi: 2 },
  { size: 0.125, phi: 3 }, { size: 0.062, phi: 4 }, { size: 'Pan', phi: 5 }
];

const sampleWeights = [5.0, 10.5, 25.2, 75.0, 150.8, 80.4, 45.1, 15.6, 5.2];

export default function GrainSizeAnalysis() {
  const [weights, setWeights] = useState<string[]>(Array(9).fill(''));
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [showCurve, setShowCurve] = useState<boolean>(false);

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
    const data = e.clipboardData.getData('text');
    const vals = data.split(/[\n\r\t]+/).map(v => v.trim()).filter(v => v !== '');
    if (vals.length > 1) {
      e.preventDefault();
      const newWeights = [...weights];
      vals.forEach((v, i) => {
        if (index + i < weights.length) {
          newWeights[index + i] = v;
        }
      });
      setWeights(newWeights);
    }
  };

  const loadSampleData = () => {
    setWeights(sampleWeights.map(w => w.toString()));
    setTimeout(() => performAnalysis(sampleWeights), 0);
  };

  const performAnalysis = (inputWeights: number[] | null = null) => {
    const wts = inputWeights || weights.map(w => parseFloat(w) || 0);
    const totalWeight = wts.reduce((sum, w) => sum + w, 0);
    if (totalWeight === 0) return;

    const weightPercent = wts.map(w => (w / totalWeight) * 100);
    const cumulativePassingPercent = wts.map((w, i) => {
      const sumRetained = wts.slice(0, i + 1).reduce((a, b) => a + b, 0);
      return 100 - (sumRetained / totalWeight) * 100;
    });

    const phiPoints = [-3, -2, -1, 0, 1, 2, 3, 4, 5];
    const analysisCumRetained = [0, ...wts.map((w, i) => (wts.slice(0, i + 1).reduce((a, b) => a + b, 0) / totalWeight) * 100)];
    
    const interpolatePhi = (p: number): number => {
      const phiScale = [-4, ...phiPoints];
      for (let i = 0; i < analysisCumRetained.length - 1; i++) {
        if (analysisCumRetained[i] <= p && analysisCumRetained[i + 1] >= p) {
          return phiScale[i] + (p - analysisCumRetained[i]) * (phiScale[i + 1] - phiScale[i]) / (analysisCumRetained[i + 1] - analysisCumRetained[i]);
        }
      }
      return NaN;
    };

    const p5 = interpolatePhi(5), p16 = interpolatePhi(16), p25 = interpolatePhi(25), p50 = interpolatePhi(50), p75 = interpolatePhi(75), p84 = interpolatePhi(84), p95 = interpolatePhi(95);

    let maxW = Math.max(...weightPercent);
    let mIdx = weightPercent.findIndex(wp => wp === maxW);
    let modePhi: number | string = sieves[mIdx].size === 'Pan' ? '>4' : sieves[mIdx].phi;

    const Mz = ((p16 + p50 + p84) / 3).toFixed(2);
    const Sd = ((p84 - p16) / 4 + (p95 - p5) / 6.6).toFixed(2);
    const Sk = ((p16 + p84 - 2 * p50) / (2 * (p84 - p16)) + (p5 + p95 - 2 * p50) / (2 * (p95 - p5))).toFixed(2);
    const Kg = ((p95 - p5) / (2.44 * (p75 - p25))).toFixed(2);
    const D50mm = Math.pow(2, -p50).toFixed(3);

    setResults({
      Mz, Sd, Sk, Kg, D50mm, p50, modePhi,
      weightPercent, cumulativePassingPercent, phiPoints,
      p5, p16, p84, p95
    });
  };

  const baseLayout: any = {
    font: { family: SANS_SERIF_STACK, size: 12, color: '#000000' },
    plot_bgcolor: 'white',
    paper_bgcolor: 'white',
    autosize: true,
    margin: { l: 60, r: 40, t: 40, b: 60 },
    hovermode: 'closest'
  };

  const baseConfig: any = {
    displayModeBar: true,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    displaylogo: false,
    toImageButtonOptions: {
      format: 'png',
      filename: 'grain_size_chart',
      height: 800,
      width: 1200,
      scale: 2
    }
  };

  return (
    <div className="bg-gray-100 text-gray-800 min-h-screen" style={{ fontFamily: SANS_SERIF_STACK }}>
      <div className="container mx-auto p-4 md:p-8">
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Grain Size Analysis Tool</h1>
          <p className="text-md text-gray-600 mt-2 font-bold">Professional sedimentology analysis with interactive Plotly charts</p>
        </header>

        <main className="flex flex-col gap-8">
          <div className="max-w-2xl mx-auto w-full bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-4 border-b pb-2">1. Input Data</h2>
            <div className="space-y-2">
              {sieves.map((sieve, index) => (
                <div key={index} className="grid grid-cols-2 items-center">
                  <label className="text-sm font-bold">
                    {sieve.size === 'Pan' ? 'Pan' : `Sieve ${sieve.size} mm`}:
                  </label>
                  <input
                    type="number"
                    value={weights[index]}
                    onChange={(e) => {
                      const newWeights = [...weights];
                      newWeights[index] = e.target.value;
                      setWeights(newWeights);
                    }}
                    onPaste={(e) => handlePaste(e, index)}
                    className="border border-gray-300 rounded-md p-2 text-right focus:ring-2 focus:ring-blue-500 font-bold"
                    placeholder="0.0"
                  />
                </div>
              ))}
              <div className="text-xs text-blue-600 mt-3 italic bg-blue-50 p-2 rounded border border-blue-100 font-bold">
                💡 <strong>Tip:</strong> Copy a column from Excel and paste it here into the first box.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6">
              <button
                onClick={() => performAnalysis()}
                className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
              >
                Calculate & Plot
              </button>
              <button
                onClick={loadSampleData}
                className="w-full bg-gray-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-600 transition duration-300"
              >
                Load Sample Data
              </button>
            </div>
          </div>

          {results && (
            <>
              <div className="max-w-2xl mx-auto w-full bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold mb-4 border-b pb-2">2. Statistical Results</h2>
                <div className="grid grid-cols-1 gap-1 text-gray-700 text-sm">
                  <div className="p-2 bg-blue-50 border-l-4 border-blue-600 mb-1 font-bold">
                    <p>Graphic Mean (Mz): {results.Mz} φ</p>
                    <p>Median (D50): {results.D50mm} mm ({results.p50.toFixed(2)} φ)</p>
                  </div>
                  <div className="p-2 bg-gray-50 border-l-4 border-gray-600 font-bold">
                    <p>Sorting (σI): {results.Sd} φ</p>
                    <p>Skewness (SkI): {results.Sk}</p>
                    <p>Kurtosis (KG): {results.Kg}</p>
                    <p>Modal Class: {results.modePhi} φ</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-lg md:col-span-2">
                  <h3 className="text-xl font-bold mb-4 text-center">Grain Size Distribution Curve (Arithmetic Log)</h3>
                  <Plot
                    data={[
                      {
                        x: [16, 8, 4, 2, 1, 0.5, 0.25, 0.125, 0.062, 0.031],
                        y: [100, ...results.cumulativePassingPercent],
                        type: 'scatter',
                        mode: 'lines',
                        name: 'Distribution Curve',
                        line: { color: '#374151', width: 2, shape: 'spline' },
                        hovertemplate: 'Diameter: %{x:.3f} mm<br>% Finer: %{y:.2f}%<extra></extra>'
                      },
                      {
                        x: [Math.pow(2, -results.p5), Math.pow(2, -results.p16), Math.pow(2, -results.p50), Math.pow(2, -results.p84), Math.pow(2, -results.p95)].filter(v => !isNaN(v)),
                        y: [95, 84, 50, 16, 5].filter((_, i) => !isNaN([results.p5, results.p16, results.p50, results.p84, results.p95][i])),
                        type: 'scatter',
                        mode: 'text+markers',
                        name: 'Folk Points',
                        text: ['D95', 'D84', 'D50', 'D16', 'D5'].filter((_, i) => !isNaN([results.p5, results.p16, results.p50, results.p84, results.p95][i])),
                        textposition: 'top center',
                        marker: { color: '#000', size: 8 },
                        hovertemplate: '%{text}<br>Diameter: %{x:.3f} mm<br>Percentile: %{y}%<extra></extra>'
                      }
                    ]}
                    layout={{
                      ...baseLayout,
                      xaxis: { title: 'Diameter (mm)', type: 'log', range: [Math.log10(0.01), Math.log10(20)], gridcolor: '#e5e7eb' },
                      yaxis: { title: 'Weight % Finer', range: [0, 100], gridcolor: '#e5e7eb' },
                      showlegend: false,
                      height: 500
                    }}
                    config={baseConfig}
                    style={{ width: '100%' }}
                  />
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <div className="flex flex-col sm:flex-row justify-between items-center mb-4 border-b pb-2 gap-2">
                    <h3 className="text-xl font-bold">Weight % Histogram (Φ Scale)</h3>
                    <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-full border border-blue-100">
                      <input
                        type="checkbox"
                        id="overlay-curve-toggle"
                        checked={showCurve}
                        onChange={(e) => setShowCurve(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                      />
                      <label htmlFor="overlay-curve-toggle" className="text-xs font-bold text-blue-800 cursor-pointer uppercase tracking-tight">
                        Overlay Curve
                      </label>
                    </div>
                  </div>
                  <Plot
                    data={[
                      {
                        x: ['>4', '4', '3', '2', '1', '0', '-1', '-2', '-3'],
                        y: [...results.weightPercent].reverse(),
                        type: 'bar',
                        name: 'Frequency',
                        marker: { color: 'rgba(54, 162, 235, 0.6)', line: { color: 'rgba(54, 162, 235, 1)', width: 1 } },
                        hovertemplate: 'Φ: %{x}<br>Weight %: %{y:.2f}%<extra></extra>'
                      },
                      ...(showCurve ? [{
                        x: ['>4', '4', '3', '2', '1', '0', '-1', '-2', '-3'],
                        y: [...results.weightPercent].reverse(),
                        type: 'scatter' as any,
                        mode: 'lines' as any,
                        name: 'Trend',
                        line: { color: '#1e293b', width: 2, shape: 'spline' as any },
                        hovertemplate: 'Φ: %{x}<br>Weight %: %{y:.2f}%<extra></extra>'
                      }] : [])
                    ]}
                    layout={{
                      ...baseLayout,
                      xaxis: { title: 'Φ Scale', gridcolor: '#e5e7eb' },
                      yaxis: { title: 'Weight %', gridcolor: '#e5e7eb' },
                      showlegend: false,
                      height: 400
                    }}
                    config={baseConfig}
                    style={{ width: '100%' }}
                  />
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h3 className="text-xl font-bold mb-4 text-center">Sediment Classification (Pie)</h3>
                  <Plot
                    data={[
                      {
                        labels: ['Gravel', 'Sand', 'Fines'],
                        values: [
                          results.weightPercent.slice(0, 3).reduce((a, b) => a + b, 0),
                          results.weightPercent.slice(3, 8).reduce((a, b) => a + b, 0),
                          results.weightPercent[8]
                        ],
                        type: 'pie',
                        marker: { colors: ['#6699CC', '#BDB76B', '#E69F00'] },
                        textinfo: 'label+percent',
                        textfont: { size: 12, family: SANS_SERIF_STACK },
                        hovertemplate: '%{label}<br>Weight %: %{value:.2f}%<br>Proportion: %{percent}<extra></extra>'
                      }
                    ]}
                    layout={{
                      ...baseLayout,
                      height: 400,
                      showlegend: true,
                      legend: { orientation: 'h', y: -0.1 }
                    }}
                    config={baseConfig}
                    style={{ width: '100%' }}
                  />
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h3 className="text-xl font-bold mb-4 text-center">Gravel-Sand-Fines Proportions</h3>
                  <Plot
                    data={[
                      {
                        x: ['Composition'],
                        y: [results.weightPercent.slice(0, 3).reduce((a, b) => a + b, 0)],
                        type: 'bar',
                        name: 'Gravel',
                        marker: { color: '#6699CC' },
                        hovertemplate: 'Gravel: %{y:.2f}%<extra></extra>'
                      },
                      {
                        x: ['Composition'],
                        y: [results.weightPercent.slice(3, 8).reduce((a, b) => a + b, 0)],
                        type: 'bar',
                        name: 'Sand',
                        marker: { color: '#BDB76B' },
                        hovertemplate: 'Sand: %{y:.2f}%<extra></extra>'
                      },
                      {
                        x: ['Composition'],
                        y: [results.weightPercent[8]],
                        type: 'bar',
                        name: 'Fines',
                        marker: { color: '#E69F00' },
                        hovertemplate: 'Fines: %{y:.2f}%<extra></extra>'
                      }
                    ]}
                    layout={{
                      ...baseLayout,
                      xaxis: { title: 'Total' },
                      yaxis: { title: 'Percent', range: [0, 100] },
                      barmode: 'stack',
                      height: 400,
                      showlegend: true,
                      legend: { orientation: 'h', y: -0.15 }
                    }}
                    config={baseConfig}
                    style={{ width: '100%' }}
                  />
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h3 className="text-xl font-bold mb-4 text-center">Weight % Finer vs. Φ Scale</h3>
                  <Plot
                    data={[
                      {
                        x: [-4, ...results.phiPoints],
                        y: [100, ...results.cumulativePassingPercent],
                        type: 'scatter',
                        mode: 'lines+markers',
                        line: { color: '#71717a', width: 3, shape: 'spline' },
                        marker: { color: '#71717a', size: 6 },
                        hovertemplate: 'Φ: %{x}<br>% Finer: %{y:.2f}%<extra></extra>'
                      }
                    ]}
                    layout={{
                      ...baseLayout,
                      xaxis: { title: 'Φ Scale', autorange: 'reversed', gridcolor: '#e5e7eb' },
                      yaxis: { title: 'Weight % Finer', gridcolor: '#e5e7eb' },
                      showlegend: false,
                      height: 400
                    }}
                    config={baseConfig}
                    style={{ width: '100%' }}
                  />
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h3 className="text-xl font-bold mb-4 text-center">Frequency Curve (Φ)</h3>
                  <Plot
                    data={[
                      {
                        x: results.phiPoints,
                        y: results.weightPercent,
                        type: 'scatter',
                        mode: 'lines+markers',
                        line: { color: '#1e293b', width: 3, shape: 'spline' },
                        marker: { color: '#1e293b', size: 6 },
                        hovertemplate: 'Φ: %{x}<br>Weight %: %{y:.2f}%<extra></extra>'
                      }
                    ]}
                    layout={{
                      ...baseLayout,
                      xaxis: { title: 'Φ Scale', autorange: 'reversed', gridcolor: '#e5e7eb' },
                      yaxis: { title: 'Weight %', gridcolor: '#e5e7eb' },
                      showlegend: false,
                      height: 400
                    }}
                    config={baseConfig}
                    style={{ width: '100%' }}
                  />
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h3 className="text-xl font-bold mb-4 text-center">Kernel Density Estimate (Φ)</h3>
                  <Plot
                    data={[
                      {
                        x: results.phiPoints,
                        y: results.weightPercent,
                        type: 'scatter',
                        mode: 'lines',
                        fill: 'tozeroy',
                        line: { color: '#1e293b', width: 3, shape: 'spline' },
                        fillcolor: 'rgba(30,41,59,0.4)',
                        hovertemplate: 'Φ: %{x}<br>Density: %{y:.2f}%<extra></extra>'
                      }
                    ]}
                    layout={{
                      ...baseLayout,
                      xaxis: { title: 'Φ Scale', autorange: 'reversed', gridcolor: '#e5e7eb' },
                      yaxis: { title: 'Density (wt % per Φ)', gridcolor: '#e5e7eb' },
                      showlegend: false,
                      height: 400
                    }}
                    config={baseConfig}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}