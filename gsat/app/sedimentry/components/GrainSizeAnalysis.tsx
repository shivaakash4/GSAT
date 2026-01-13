'use client';

import { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, LogarithmicScale, ChartOptions, ChartDataset } from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, LogarithmicScale, ChartDataLabels);

const SANS_SERIF_STACK = "'Inter', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
const BASE_FONT_SIZE = 12;
const BASE_AXIS_WIDTH = 2;

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

// Custom plugins
const boxBorderPlugin = {
  id: 'boxBorder',
  beforeDraw: (chart: any) => {
    const { ctx, chartArea: { left, top, right, bottom } } = chart;
    const scale = (chart.options as any).exportScale || 1;
    const lw = BASE_AXIS_WIDTH * scale;
    const halfLw = lw / 2;
    ctx.save();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = lw;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';
    ctx.beginPath();
    ctx.moveTo(left, top + halfLw);
    ctx.lineTo(right - halfLw, top + halfLw);
    ctx.lineTo(right - halfLw, bottom);
    ctx.stroke();
    ctx.restore();
  }
};

const projectionLinesPlugin = {
  id: 'projectionLines',
  beforeDraw: (chart: any) => {
    if (!chart.canvas.classList.contains('distribution-curve')) return;
    const { ctx, scales: { x, y } } = chart;
    const dataset = chart.data.datasets.find((ds: any) => ds.label === 'Folk');
    if (!dataset || !dataset.data) return;
    const scale = (chart.options as any).exportScale || 1;
    ctx.save();
    ctx.setLineDash([4 * scale, 4 * scale]);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 1 * scale;
    dataset.data.forEach((point: any) => {
      if (isNaN(point.x) || isNaN(point.y)) return;
      const pixelX = x.getPixelForValue(point.x);
      const pixelY = y.getPixelForValue(point.y);
      ctx.beginPath();
      ctx.moveTo(pixelX, pixelY);
      ctx.lineTo(x.left, pixelY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pixelX, pixelY);
      ctx.lineTo(pixelX, y.bottom);
      ctx.stroke();
    });
    ctx.restore();
  }
};

export default function GrainSizeAnalysis() {
  const [weights, setWeights] = useState<string[]>(Array(9).fill(''));
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [showCurve, setShowCurve] = useState<boolean>(false);
  const chartRefs = useRef<Record<string, any>>({});

  useEffect(() => {
    ChartJS.defaults.font.family = SANS_SERIF_STACK;
    ChartJS.defaults.font.size = BASE_FONT_SIZE;
    ChartJS.defaults.font.weight = 'bold';
    ChartJS.defaults.color = '#000000';
  }, []);

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

  const boldAxisOptions = (titleText: string, reverse = false, stacked = false, offset = false) => ({
    title: { display: true, text: titleText, color: '#000000', font: { weight: 'bold' as const, size: BASE_FONT_SIZE, family: SANS_SERIF_STACK } },
    ticks: { display: true, color: '#000000', font: { weight: 'bold' as const, size: BASE_FONT_SIZE, family: SANS_SERIF_STACK }, maxRotation: 0, minRotation: 0 },
    border: { display: true, width: BASE_AXIS_WIDTH, color: '#000000' },
    grid: { display: true, drawOnChartArea: false, drawTicks: true, color: '#000000', lineWidth: BASE_AXIS_WIDTH, tickLength: 6, offset: offset },
    offset: offset, reverse: reverse, stacked: stacked
  });

  return (
    <div className="bg-gray-100 text-gray-800 min-h-screen" style={{ fontFamily: SANS_SERIF_STACK }}>
      <div className="container mx-auto p-4 md:p-8">
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Grain Size Analysis Tool</h1>
          <p className="text-md text-gray-600 mt-2 font-bold">Professional sedimentology analysis</p>
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
                  <div style={{ height: '500px' }}>
                    <Line
                      data={{
                        datasets: [
                          {
                            label: 'Curve',
                            data: [16, 8, 4, 2, 1, 0.5, 0.25, 0.125, 0.062, 0.031].map((s, idx) => ({ x: s, y: [100, ...results.cumulativePassingPercent][idx] })),
                            borderColor: '#374151',
                            borderWidth: 2,
                            tension: 0.3,
                            pointRadius: 0
                          },
                          {
                            label: 'Folk',
                            data: [
                              { x: Math.pow(2, -results.p5), y: 95, label: 'D95' },
                              { x: Math.pow(2, -results.p16), y: 84, label: 'D84' },
                              { x: Math.pow(2, -results.p50), y: 50, label: 'D50' },
                              { x: Math.pow(2, -results.p84), y: 16, label: 'D16' },
                              { x: Math.pow(2, -results.p95), y: 5, label: 'D5' }
                            ].filter(p => !isNaN(p.x)),
                            backgroundColor: '#000',
                            pointRadius: 6,
                            pointStyle: 'circle',
                            showLine: false,
                            borderWidth: 0
                          }
                        ]
                      }}
                      options={{
                        plugins: {
                          legend: { display: false },
                          datalabels: {
                            display: (context: any) => context.datasetIndex === 1,
                            align: 'top' as const,
                            font: { weight: 'bold' as const, size: BASE_FONT_SIZE, family: SANS_SERIF_STACK },
                            formatter: (value: any) => value.label
                          }
                        },
                        scales: {
                          x: {
                            ...boldAxisOptions('Diameter (mm)'),
                            type: 'logarithmic' as const,
                            min: 0.01,
                            max: 20,
                            afterBuildTicks: (axis: any) => {
                              axis.ticks = [0.01, 0.1, 1, 10].map(v => ({ value: v }));
                            },
                            ticks: {
                              ...boldAxisOptions('Diameter (mm)').ticks,
                              callback: (v: any) => v.toString()
                            }
                          },
                          y: { ...boldAxisOptions('Weight % Finer'), min: 0, max: 100 }
                        },
                        responsive: true,
                        maintainAspectRatio: false
                      }}
                      plugins={[boxBorderPlugin, projectionLinesPlugin]}
                    />
                  </div>
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
                  <div style={{ height: '400px' }}>
                    <Bar
                      data={{
                        labels: ['>4', '4', '3', '2', '1', '0', '-1', '-2', '-3'],
                        datasets: [
                          {
                            label: 'Freq',
                            data: [...results.weightPercent].reverse(),
                            backgroundColor: 'rgba(54, 162, 235, 0.6)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                          },
                          ...(showCurve ? [{
                            label: 'Trend',
                            type: 'line' as const,
                            data: [...results.weightPercent].reverse(),
                            borderColor: '#1e293b',
                            borderWidth: 1.5,
                            tension: 0.4,
                            pointRadius: 0,
                            fill: false
                          } as any] : [])
                        ]
                      }}
                      options={{
                        animation: false,
                        plugins: {
                          legend: { display: false },
                          datalabels: {
                            display: (context: any) => context.datasetIndex === 0 && context.dataset.data[context.dataIndex] === Math.max(...context.dataset.data),
                            align: 'top' as const,
                            anchor: 'end' as const,
                            offset: 5,
                            clip: false,
                            font: { weight: 'bold' as const, size: BASE_FONT_SIZE, family: SANS_SERIF_STACK },
                            color: '#1e40af',
                            formatter: () => 'MODE'
                          }
                        },
                        scales: {
                          x: boldAxisOptions('Φ Scale', false, false, true),
                          y: { ...boldAxisOptions('Weight %'), grace: '45%' }
                        },
                        responsive: true,
                        maintainAspectRatio: false
                      }}
                      plugins={[boxBorderPlugin]}
                    />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h3 className="text-xl font-bold mb-4 text-center">Sediment Classification (Pie)</h3>
                  <div style={{ height: '400px' }}>
                    <Pie
                      data={{
                        labels: ['Gravel', 'Sand', 'Fines'],
                        datasets: [{
                          data: [
                            results.weightPercent.slice(0, 3).reduce((a, b) => a + b, 0),
                            results.weightPercent.slice(3, 8).reduce((a, b) => a + b, 0),
                            results.weightPercent[8]
                          ],
                          backgroundColor: ['#6699CC', '#BDB76B', '#E69F00'],
                          borderColor: '#fff',
                          borderWidth: 2
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            labels: { font: { weight: 'bold' as const, family: SANS_SERIF_STACK } }
                          },
                          datalabels: {
                            display: true,
                            font: { weight: 'bold' as const, size: BASE_FONT_SIZE, family: SANS_SERIF_STACK },
                            formatter: (v: number) => v > 0 ? v.toFixed(1) + '%' : ''
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h3 className="text-xl font-bold mb-4 text-center">Gravel-Sand-Fines proportions</h3>
                  <div style={{ height: '400px' }}>
                    <Bar
                      data={{
                        labels: ['Composition'],
                        datasets: [
                          { label: 'Gravel', data: [results.weightPercent.slice(0, 3).reduce((a, b) => a + b, 0)], backgroundColor: '#6699CC', maxBarThickness: 60 },
                          { label: 'Sand', data: [results.weightPercent.slice(3, 8).reduce((a, b) => a + b, 0)], backgroundColor: '#BDB76B', maxBarThickness: 60 },
                          { label: 'Fines', data: [results.weightPercent[8]], backgroundColor: '#E69F00', maxBarThickness: 60 }
                        ]
                      }}
                      options={{
                        plugins: {
                          legend: { display: true, position: 'bottom' as const, labels: { font: { weight: 'bold' as const, family: SANS_SERIF_STACK } } },
                          datalabels: {
                            font: { weight: 'bold' as const, size: BASE_FONT_SIZE, family: SANS_SERIF_STACK },
                            anchor: 'center' as const,
                            align: 'center' as const,
                            formatter: (v: number) => v > 3 ? v.toFixed(1) + '%' : ''
                          }
                        },
                        scales: {
                          x: boldAxisOptions('Total', false, true, true),
                          y: { ...boldAxisOptions('Percent', false, true), min: 0, max: 100 }
                        },
                        responsive: true,
                        maintainAspectRatio: false
                      }}
                    />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h3 className="text-xl font-bold mb-4 text-center">Weight % Finer vs. Φ Scale</h3>
                  <div style={{ height: '400px' }}>
                    <Line
                      data={{
                        labels: [-4, ...results.phiPoints],
                        datasets: [{
                          data: [100, ...results.cumulativePassingPercent],
                          borderColor: '#71717a',
                          backgroundColor: '#71717a',
                          pointRadius: 4,
                          pointBackgroundColor: '#71717a',
                          pointBorderColor: '#71717a',
                          borderWidth: 3,
                          tension: 0.4
                        }]
                      }}
                      options={{
                        plugins: { legend: { display: false }, datalabels: { display: false } },
                        scales: {
                          x: { ...boldAxisOptions('Φ Scale', true, false, true), ticks: { ...boldAxisOptions('Φ Scale', true, false, true).ticks, autoSkip: false, maxRotation: 0, minRotation: 0 } },
                          y: boldAxisOptions('Weight % Finer')
                        },
                        responsive: true,
                        maintainAspectRatio: false
                      }}
                      plugins={[boxBorderPlugin]}
                    />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h3 className="text-xl font-bold mb-4 text-center">Frequency Curve (Φ)</h3>
                  <div style={{ height: '400px' }}>
                    <Line
                      data={{
                        labels: results.phiPoints,
                        datasets: [{
                          data: results.weightPercent,
                          borderColor: '#1e293b',
                          backgroundColor: '#1e293b',
                          pointRadius: 4,
                          pointBackgroundColor: '#1e293b',
                          pointBorderColor: '#1e293b',
                          borderWidth: 3,
                          tension: 0.4
                        }]
                      }}
                      options={{
                        plugins: { legend: { display: false }, datalabels: { display: false } },
                        scales: {
                          x: { ...boldAxisOptions('Φ Scale', true, false, true), ticks: { ...boldAxisOptions('Φ Scale', true, false, true).ticks, autoSkip: false } },
                          y: boldAxisOptions('Weight %')
                        },
                        responsive: true,
                        maintainAspectRatio: false
                      }}
                      plugins={[boxBorderPlugin]}
                    />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h3 className="text-xl font-bold mb-4 text-center">Kernel density estimate (Φ)</h3>
                  <div style={{ height: '400px' }}>
                    <Line
                      data={{
                        labels: results.phiPoints,
                        datasets: [{
                          data: results.weightPercent,
                          borderColor: '#1e293b',
                          backgroundColor: 'rgba(30,41,59,0.4)',
                          pointRadius: 0,
                          borderWidth: 3,
                          tension: 0.4,
                          fill: true
                        }]
                      }}
                      options={{
                        plugins: { legend: { display: false }, datalabels: { display: false } },
                        scales: {
                          x: { ...boldAxisOptions('Φ Scale', true, false, true), ticks: { ...boldAxisOptions('Φ Scale', true, false, true).ticks, autoSkip: false } },
                          y: boldAxisOptions('Density (wt % per Φ)')
                        },
                        responsive: true,
                        maintainAspectRatio: false
                      }}
                      plugins={[boxBorderPlugin]}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}