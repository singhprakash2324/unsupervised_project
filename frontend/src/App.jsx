import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, ImageOverlay } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Droplets, 
  Leaf, 
  Activity, 
  Info, 
  Upload, 
  PlayCircle, 
  BarChart3,
  Search,
  Zap,
  TrendingUp,
  Cpu,
  Layers,
  AlertCircle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import MetricsTabUI from './components/MetricsTabUI';
import './App.css';

const API_BASE = "http://localhost:8000";

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [activeLayer, setActiveLayer] = useState('ndvi');
  const [fieldBounds] = useState([[37.0, -122.0], [37.00512, -121.99488]]);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // 1. Upload the file
      const uploadRes = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      
      if (!uploadRes.ok) throw new Error("Upload failed");

      // 2. Analyze the uploaded file
      const analyzeData = new FormData();
      analyzeData.append("file_path", uploadData.file_path);
      analyzeData.append("method", "kmeans");
      analyzeData.append("n_clusters", "5");

      const analyzeRes = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        body: analyzeData,
      });
      const resultsData = await analyzeRes.json();

      if (resultsData.error) {
        setError(resultsData.error);
      } else {
        setResults(resultsData);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to process custom image. Make sure it is a valid GeoTIFF with 6 bands.");
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/demo`, { method: 'POST' });
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }
      
      setResults(data);
      setLoading(false);
    } catch (err) {
      console.error("Error:", err);
      setError("Unable to connect to AI Engine. Check if start_servers.sh is active.");
      setLoading(false);
    }
  };

  const COLORS = ['#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2', '#b7e4c7', '#d8f3dc'];

  return (
    <div className="app-container">
      <header>
        <div className="logo">
          <h1>AGRO<span>SYNAPSE</span> <span style={{ fontSize: '0.6rem', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '100px', verticalAlign: 'middle', marginLeft: '10px' }}>PRO v1.0</span></h1>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary">
            <Search size={18} />
            Search Field ID
          </button>
          <button className="btn btn-primary" onClick={runAnalysis} disabled={loading}>
            {loading ? (
              <>
                <div className="spinner"></div>
                Analyzing Spectral Data...
              </>
            ) : (
              <>
                <Cpu size={18} />
                Run AI Irrigation Analysis
              </>
            )}
          </button>
        </div>
      </header>

      <main>
        {!results ? (
          <div className="welcome-screen card" style={{ textAlign: 'center', padding: '120px 40px', maxWidth: '800px', margin: '40px auto' }}>
            <div style={{ background: 'rgba(76, 138, 68, 0.1)', width: '100px', height: '100px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
              <Zap size={48} color="#1a4314" />
            </div>
            <h2 style={{ fontSize: '2.2rem', marginBottom: '1rem' }}>Autonomous Precision Irrigation</h2>
            <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '2.5rem', lineHeight: '1.6' }}>
              Upload multi-spectral imagery to generate geo-referenced irrigation zones 
              using unsupervised spectral segmentation and texture analysis.
            </p>
            {error && (
              <div style={{ color: '#9b2226', padding: '1.2rem', background: '#fff0f0', borderRadius: '12px', marginBottom: '2rem', border: '1px solid #ffcccc', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <AlertCircle size={20} />
                {error}
              </div>
            )}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn btn-primary btn-lg" onClick={runAnalysis} disabled={loading}>
                {loading ? "Processing..." : "Start Demo Analysis"}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                style={{ display: 'none' }} 
                accept=".tif,.tiff" 
              />
              <button className="btn btn-secondary btn-lg" onClick={() => fileInputRef.current.click()} disabled={loading}>
                <Upload size={18} />
                {loading ? "Uploading..." : "Upload Custom TIF"}
              </button>
            </div>
          </div>
        ) : (
          <div className="dashboard-grid">
            <div className="left-column">
              <div className="card" style={{ marginBottom: '2rem' }}>
                <div className="card-title">
                  <Layers size={20} />
                  Spectral Fusion Field Map
                </div>
                <div className="map-container">
                  <MapContainer 
                    center={[37.0025, -121.9975]} 
                    zoom={17} 
                    zoomControl={false}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                      attribution='&copy; CARTO'
                    />
                    <ImageOverlay
                      url={`${API_BASE}${results.layers[activeLayer]}`}
                      bounds={fieldBounds}
                      opacity={0.8}
                    />
                    
                    <div className="legend">
                      <div style={{ fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
                        {activeLayer.toUpperCase()} Index
                      </div>
                      <div className="legend-item"><div className="color-box" style={{ background: '#1a4314' }}></div> High Vigor</div>
                      <div className="legend-item"><div className="color-box" style={{ background: '#74c69d' }}></div> Moderate</div>
                      <div className="legend-item"><div className="color-box" style={{ background: '#bc6c25' }}></div> Moisture Stress</div>
                    </div>

                    <div className="layer-controls">
                      <button className={`layer-btn ${activeLayer === 'ndvi' ? 'active' : ''}`} onClick={() => setActiveLayer('ndvi')}>NDVI</button>
                      <button className={`layer-btn ${activeLayer === 'wdi' ? 'active' : ''}`} onClick={() => setActiveLayer('wdi')}>WDI</button>
                      <button className={`layer-btn ${activeLayer === 'clusters' ? 'active' : ''}`} onClick={() => setActiveLayer('clusters')}>AI ZONES</button>
                    </div>
                  </MapContainer>
                </div>

                <div className="explainability-grid">
                  <div className="reasoning-card">
                    <h4 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Cpu size={16} /> AI Insight: {results.stats.agronomic_insight}
                    </h4>
                    "The system segmented the field into {Object.keys(results.recommendations).length} management zones. 
                    Unlike static sensors, our <strong>texture-aware</strong> algorithm identifies canopy gaps 
                    (entropy: {results.stats.texture_variance.toFixed(4)}) and fuses them with <strong>Thermal WDI</strong> to prevent false stress positives."
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      <div className="feature-tag"><Leaf size={14} /> Vegetation Coverage: {results.stats.coverage_pct}%</div>
                      <div className="feature-tag"><Activity size={14} /> Moisture Stress Area: {results.stats.stress_pct}%</div>
                    </div>
                    <div>
                      <div className="feature-tag"><Droplets size={14} /> Hydration Coherence: {results.stats.confidence_score}%</div>
                      <div className="feature-tag"><Zap size={14} /> Thermal Variance: {results.stats.thermal_variance.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-title">
                  <TrendingUp size={20} />
                  Yield Optimization Projection
                </div>
                <div style={{ height: '240px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { week: 'W1', baseline: 10, optimized: 10 },
                      { week: 'W2', baseline: 25, optimized: 25 + (results.stats.yield_improvement * 0.4) },
                      { week: 'W3', baseline: 35, optimized: 35 + (results.stats.yield_improvement * 0.7) },
                      { week: 'W4', baseline: 50, optimized: 50 + results.stats.yield_improvement },
                    ]}>
                      <defs>
                        <linearGradient id="colorOpt" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1a4314" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#1a4314" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="optimized" stroke="#1a4314" strokeWidth={3} fillOpacity={1} fill="url(#colorOpt)" name="Optimized Yield" />
                      <Area type="monotone" dataKey="baseline" stroke="#bc6c25" strokeWidth={2} strokeDasharray="5 5" fill="transparent" name="Traditional Irrigation" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="right-column">
              <div className="card" style={{ marginBottom: '2rem' }}>
                <div className="card-title">
                  <BarChart3 size={20} />
                  Field Stats
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1a4314' }}>{results.stats.avg_ndvi.toFixed(2)}</div>
                    <div style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase' }}>Avg Vigor</div>
                  </div>
                  <div style={{ borderLeft: '1px solid #eee', height: '40px' }}></div>
                  <div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#bc6c25' }}>{results.stats.avg_wdi.toFixed(1)}</div>
                    <div style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase' }}>Water Deficit</div>
                  </div>
                </div>
                
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#666' }}>VRI EXECUTIONS</h4>
                <div className="recommendations-list">
                  {Object.entries(results.recommendations).map(([id, rec]) => (
                    <div key={id} className={`rec-item ${rec.amount > 0 ? 'increase' : (rec.amount < 0 ? 'decrease' : '')}`}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '800', fontSize: '0.8rem', color: '#666' }}>ZONE {id}</span>
                        <span className="badge" style={{ background: rec.amount > 0 ? 'rgba(188, 108, 37, 0.1)' : 'rgba(76, 138, 68, 0.1)', color: rec.amount > 0 ? '#bc6c25' : '#1a4314' }}>
                          {rec.amount > 0 ? '↑' : '↓'} {Math.abs(rec.amount)}%
                        </span>
                      </div>
                      <div style={{ fontWeight: '700', fontSize: '1rem', marginTop: '4px' }}>{rec.action}</div>
                      <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>{rec.reason}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card" style={{ background: 'linear-gradient(135deg, #1a4314 0%, #2d6a4f 100%)', color: 'white' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem' }}>Water Savings</h3>
                <p style={{ fontSize: '0.85rem', opacity: '0.9', marginBottom: '1.5rem' }}>
                  By applying VRI, this field will save an estimated:
                </p>
                <div style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '5px' }}>{results.stats.water_savings}%</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', opacity: '0.8' }}>{results.stats.water_liters.toLocaleString()} Liters / Hectare</div>
                <div style={{ marginTop: '2rem', height: '140px' }}>
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                           data={[
                             { name: 'Saved', value: results.stats.water_savings },
                             { name: 'Required', value: 100 - results.stats.water_savings },
                           ]}
                           cx="50%"
                           cy="50%"
                           innerRadius={40}
                           outerRadius={60}
                           paddingAngle={5}
                           dataKey="value"
                        >
                          <Cell fill="#a7c957" />
                          <Cell fill="rgba(255,255,255,0.2)" />
                        </Pie>
                      </PieChart>
                   </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            <div className="metrics-section">
              <MetricsTabUI data={results} />
            </div>
          </div>
        )}
      </main>
      
      <footer style={{ padding: '2rem', textAlign: 'center', fontSize: '0.8rem', color: '#999' }}>
        AgroSynapse &bull; Autonomous Precision Irrigation Patent-Level SaaS &bull; Licensed for Prakash
      </footer>
    </div>
  );
}

export default App;
