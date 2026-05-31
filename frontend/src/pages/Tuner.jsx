import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BackButton } from "../components/Button/BackButton";
import PageHeader from "../components/Page/PageHeader";
import PageContent from "../components/Page/PageContent";

// Map from instrument label to semitone transposition to convert concert -> written
// Positive value means display a higher written note than the concert pitch
const INSTRUMENT_TRANSPOSITIONS = [
  { key: "C", label: "Concert C", semitones: 0 },
  { key: "Bb", label: "B♭ (trompet, tuba, bugel)", semitones: 2 },
  // Alto sax (E♭) written is a major sixth above concert: +9 semitones
  { key: "Eb", label: "E♭ (alt saxofoon)", semitones: 9 },
  { key: "F", label: "F (hoorn)", semitones: 7 },
  { key: "D", label: "D (trompet in D)", semitones: -2 },
];

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const SHARP_TO_FLAT = {
  "C#": "Db",
  "D#": "Eb",
  "F#": "Gb",
  "G#": "Ab",
  "A#": "Bb",
};

function formatNoteName(name, preferFlats) {
  if (!preferFlats) return name;
  return SHARP_TO_FLAT[name] || name;
}

function frequencyToNoteData(frequency) {
  if (!frequency || !isFinite(frequency)) return null;
  const A4 = 440;
  const SEMITONES_PER_OCTAVE = 12;
  const n = Math.round(SEMITONES_PER_OCTAVE * Math.log2(frequency / A4));
  const nearestFrequency = A4 * Math.pow(2, n / SEMITONES_PER_OCTAVE);
  const cents = Math.round(1200 * Math.log2(frequency / nearestFrequency));
  // Convert to note name and octave using MIDI like mapping where A4=69
  const midi = 69 + n;
  const noteIndex = ((midi % 12) + 12) % 12; // ensure positive modulo
  const noteName = NOTE_NAMES[noteIndex];
  const octave = Math.floor((midi - 12) / 12);
  return { noteName, octave, cents, nearestFrequency };
}

function transposeNote({ noteName, octave }, semitones) {
  const baseIndex = NOTE_NAMES.indexOf(noteName);
  if (baseIndex < 0) return { noteName, octave };
  let total = baseIndex + semitones;
  let newOctave = octave;
  while (total < 0) {
    total += 12;
    newOctave -= 1;
  }
  while (total >= 12) {
    total -= 12;
    newOctave += 1;
  }
  return { noteName: NOTE_NAMES[total], octave: newOctave };
}

function AnalogPitchMeter({ cents, min = -50, max = 50 }) {
  const clamped = Math.max(min, Math.min(max, cents || 0));
  // Base viewBox size; SVG will scale to container width
  const width = 360;
  const height = 200;
  const cx = width / 2;
  const cy = height - 10;
  const radius = Math.min(width, height) - 30;
  // Rotate the entire gauge 90 degrees to the left (counterclockwise)
  const startDeg = -150; // was -60
  const endDeg = -30; // was 60

  const toRad = (deg) => (deg * Math.PI) / 180;
  const angleFor = (value) => {
    const t = (value - min) / (max - min);
    return startDeg + t * (endDeg - startDeg);
  };
  const polar = (r, deg) => ({ x: cx + r * Math.cos(toRad(deg)), y: cy + r * Math.sin(toRad(deg)) });

  const start = polar(radius, startDeg);
  const end = polar(radius, endDeg);
  const largeArcFlag = endDeg - startDeg <= 180 ? 0 : 1;
  const arcPath = `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;

  // Ticks at -50, -25, 0, +25, +50
  const ticks = [-50, -25, 0, 25, 50];
  const tickElems = ticks.map((t) => {
    const deg = angleFor(t);
    const p1 = polar(radius - 4, deg);
    const p2 = polar(radius - 16, deg);
    const isZero = t === 0;
    return (
      <g key={t}>
        <line
          x1={p1.x}
          y1={p1.y}
          x2={p2.x}
          y2={p2.y}
          stroke={isZero ? "#111827" : "#9CA3AF"}
          strokeWidth={isZero ? 3 : 2}
        />
        <text
          x={polar(radius - 30, deg).x}
          y={polar(radius - 30, deg).y}
          fill="#6B7280"
          fontSize="10"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {t}
        </text>
      </g>
    );
  });

  const needleDeg = angleFor(clamped);
  const needleEnd = polar(radius - 22, needleDeg);
  const center = { x: cx, y: cy };

  return (
    <svg width="100%" height="auto" viewBox={`0 0 ${width} ${height}`} className="mx-auto block">
      {/* Arc background */}
      <path d={arcPath} stroke="#E5E7EB" strokeWidth={10} fill="none" strokeLinecap="round" />
      {/* Center zone highlight */}
      <path
        d={(function () {
          const innerR = radius - 10;
          const sDeg = angleFor(-10);
          const eDeg = angleFor(10);
          const s = polar(innerR, sDeg);
          const e = polar(innerR, eDeg);
          const large = Math.abs(eDeg - sDeg) > 180 ? 1 : 0;
          return `M ${s.x} ${s.y} A ${innerR} ${innerR} 0 ${large} 1 ${e.x} ${e.y}`;
        })()}
        stroke="#D1FAE5"
        strokeWidth={6}
        fill="none"
        strokeLinecap="round"
      />
      {/* Ticks */}
      {tickElems}
      {/* Needle */}
      <line
        x1={center.x}
        y1={center.y}
        x2={needleEnd.x}
        y2={needleEnd.y}
        stroke="#F59E0B"
        strokeWidth={4}
        strokeLinecap="round"
      />
      {/* Center cap */}
      <circle cx={center.x} cy={center.y} r={6} fill="#111827" />
      {/* Labels */}
      <text x={cx} y={cy - radius + 28} textAnchor="middle" fill="#6B7280" fontSize="12">
        cents
      </text>
    </svg>
  );
}

function PitchHistoryChart({ samples, maxSamples = 150, min = -50, max = 50 }) {
  const width = 800; // viewBox width; SVG scales to container
  const height = 200;
  const padding = { top: 20, bottom: 20, left: 40, right: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Use only the most recent samples
  const filtered = samples.slice(-maxSamples);

  const xFor = (index) => {
    const pointSpacing = chartWidth / (maxSamples - 1); // Fixed spacing between points
    return padding.left + index * pointSpacing;
  };
  const yFor = (c) => {
    const clamped = Math.min(Math.max(c, min), max);
    const frac = (clamped - min) / (max - min);
    return padding.top + chartHeight - frac * chartHeight;
  };

  // Build path with gaps on null/undefined and collect point markers
  let d = "";
  const points = [];
  for (let i = 0; i < filtered.length; i++) {
    const s = filtered[i];
    const x = xFor(i);
    if (s.c == null || !isFinite(s.c)) {
      d += " M " + x + " " + yFor(0);
      continue;
    }
    const y = yFor(s.c);
    points.push({ x, y });
    if (i === 0 || filtered[i - 1].c == null || !isFinite(filtered[i - 1].c)) {
      d += ` M ${x} ${y}`;
    } else {
      d += ` L ${x} ${y}`;
    }
  }

  // Horizontal grid lines at -50, -25, 0, +25, +50
  const gridVals = [-50, -25, 0, 25, 50];
  const grid = gridVals.map((v) => {
    const y = yFor(v);
    return (
      <g key={v}>
        <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#E5E7EB" strokeWidth={1} />
        <text x={padding.left - 6} y={y + 6} fontSize={14} fontWeight="600" fill="#6B7280" textAnchor="end">
          {v}¢
        </text>
      </g>
    );
  });

  // Good range lines at -10 and +10
  const yMinus10 = yFor(-10);
  const yPlus10 = yFor(10);

  return (
    <svg className="w-full h-full mx-auto block" viewBox={`0 0 ${width} ${height}`}>
      <rect x={0} y={0} width={width} height={height} fill="#FFFFFF" />
      {grid}
      {/* Light green area between -10 and +10 cents */}
      <rect 
        x={padding.left} 
        y={yPlus10} 
        width={width - padding.left - padding.right} 
        height={yMinus10 - yPlus10} 
        fill="#10B981" 
        fillOpacity={0.1} 
      />
      <line x1={padding.left} y1={yMinus10} x2={width - padding.right} y2={yMinus10} stroke="#10B981" strokeWidth={2} strokeDasharray="4 4" />
      <line x1={padding.left} y1={yPlus10} x2={width - padding.right} y2={yPlus10} stroke="#10B981" strokeWidth={2} strokeDasharray="4 4" />
      {/* Series line (only rendered if there is at least one segment) */}
      {points.length > 1 && <path d={d} stroke="#3B82F6" strokeWidth={3} fill="none" />}
      {/* Point markers so single samples are visible */}
      {points.map((p, idx) => (
        <circle key={idx} cx={p.x} cy={p.y} r={3} fill="#60A5FA" />
      ))}
      {points.length === 0 && (
        <text x={width / 2} y={height / 2} textAnchor="middle" fontSize={12} fill="#9CA3AF">
          geen data
        </text>
      )}
      {/* X-axis labels */}

      <text x={width - padding.right} y={height - 5} fontSize={14} fontWeight="600" fill="#6B7280" textAnchor="end">
        nu →
      </text>
    </svg>
  );
}

function usePitchDetector() {
  const rafRef = useRef(0);
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);
  const bufferRef = useRef(new Float32Array(2048));
  const [frequency, setFrequency] = useState(null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);
  const latestFreqRef = useRef(null);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const start = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      // Simple band-pass to reduce noise and very low/high frequencies
      const highpass = audioContext.createBiquadFilter();
      highpass.type = "highpass";
      highpass.frequency.value = 50;
      const lowpass = audioContext.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.value = 1500;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      audioContextRef.current = audioContext;
      source.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(analyser);
      setListening(true);
      const loop = () => {
        rafRef.current = requestAnimationFrame(loop);
        const buf = bufferRef.current;
        analyser.getFloatTimeDomainData(buf);
        const f = detectPitchMPM(buf, audioContext.sampleRate);
        setFrequency(f);
        latestFreqRef.current = f;
      };
      loop();
    } catch (e) {
      setError(e?.message || "Microfoon-toegang mislukt");
      setListening(false);
    }
  };

  const stop = () => {
    cancelAnimationFrame(rafRef.current);
    setListening(false);
    setFrequency(null);
    const ctx = audioContextRef.current;
    if (ctx) {
      ctx.close().catch(() => {});
      audioContextRef.current = null;
    }
  };

  return { frequency, listening, error, start, stop };
}

// McLeod Pitch Method (NSDF) with parabolic interpolation and downsampling
function detectPitchMPM(timeDomainBuffer, sampleRate) {
  const N = timeDomainBuffer.length;
  // Compute RMS to discard silence
  let rms = 0;
  for (let i = 0; i < N; i++) rms += timeDomainBuffer[i] * timeDomainBuffer[i];
  rms = Math.sqrt(rms / N);
  if (rms < 0.008) return null;

  // Downsample to reduce computation
  const targetLen = 1024;
  const step = Math.max(1, Math.floor(N / targetLen));
  const dsLen = Math.floor(N / step);
  const buf = new Float32Array(dsLen);
  for (let i = 0; i < dsLen; i++) buf[i] = timeDomainBuffer[i * step];
  const sr = sampleRate / step;

  const tauMin = Math.max(2, Math.floor(sr / 1500));
  const tauMax = Math.min(Math.floor(dsLen / 2), Math.floor(sr / 50));
  if (tauMax - tauMin < 2) return null;

  // NSDF
  const nsdf = new Float32Array(tauMax + 1);
  for (let tau = tauMin; tau <= tauMax; tau++) {
    let acf = 0;
    let m = 0;
    const limit = dsLen - tau;
    for (let i = 0; i < limit; i++) {
      const x = buf[i];
      const y = buf[i + tau];
      acf += x * y;
      m += x * x + y * y;
    }
    nsdf[tau] = m > 0 ? (2 * acf) / m : 0;
  }

  // Peak picking with threshold
  const THRESHOLD = 0.6;
  let maxVal = 0;
  let maxTau = -1;
  for (let tau = tauMin + 1; tau < tauMax - 1; tau++) {
    const v = nsdf[tau];
    if (v > THRESHOLD && v > nsdf[tau - 1] && v > nsdf[tau + 1]) {
      if (v > maxVal) {
        maxVal = v;
        maxTau = tau;
      }
    }
  }
  if (maxTau === -1) {
    // Fallback: global max
    for (let tau = tauMin + 1; tau < tauMax - 1; tau++) {
      if (nsdf[tau] > maxVal) {
        maxVal = nsdf[tau];
        maxTau = tau;
      }
    }
    if (maxTau === -1) return null;
  }

  // Parabolic interpolation around the peak
  const k = maxTau;
  const y1 = nsdf[k - 1];
  const y2 = nsdf[k];
  const y3 = nsdf[k + 1];
  const denom = y1 - 2 * y2 + y3;
  const delta = denom !== 0 ? (0.5 * (y1 - y3)) / denom : 0;
  const period = k + delta;
  const freq = sr / period;
  if (freq < 20 || freq > 5000) return null;
  return freq;
}

const Tuner = () => {
  const navigate = useNavigate();
  const { frequency, listening, error, start, stop } = usePitchDetector();
  const [instrumentKey, setInstrumentKey] = useState(() => {
    try {
      const saved = localStorage.getItem("tuner.instrumentKey");
      if (saved && INSTRUMENT_TRANSPOSITIONS.some((i) => i.key === saved)) {
        return saved;
      }
    } catch (_) {}
    return "C";
  });
  const [history, setHistory] = useState([]);
  const freqRef = useRef(frequency);
  const centsRef = useRef(null);
  const lastSoundTimeRef = useRef(Date.now());

  useEffect(() => {
    // Auto-start on mount for convenience
    start();
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist instrument selection
  useEffect(() => {
    try {
      localStorage.setItem("tuner.instrumentKey", instrumentKey);
    } catch (_) {
      // ignore
    }
  }, [instrumentKey]);

  useEffect(() => {
    freqRef.current = frequency;
  }, [frequency]);
  useEffect(() => {
    centsRef.current = noteData?.cents ?? null;
  });

  useEffect(() => {
    const maxSamples = 150; // Keep last 150 samples (15 seconds at 10Hz)
    const silenceThreshold = 1000; // 1 second of silence
    const interval = setInterval(() => {
      const t = Date.now();
      // Use latest displayed cents to keep graph consistent with gauge
      let c = centsRef.current;
      if (c != null && isFinite(c)) {
        if (c < -100) c = -100;
        if (c > 100) c = 100;
        // Update last sound time when we have valid audio
        lastSoundTimeRef.current = t;
      } else {
        c = null;
      }

      // Stop scrolling if silent for more than 1 second
      const timeSinceLastSound = t - lastSoundTimeRef.current;
      const shouldPause = timeSinceLastSound > silenceThreshold;
      
      // Only add data points when not paused
      if (!shouldPause) {
        setHistory((prev) => {
          const next = [...prev, { c }];
          return next.length > maxSamples ? next.slice(-maxSamples) : next;
        });
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const noteData = useMemo(() => frequencyToNoteData(frequency), [frequency]);
  const transposition = useMemo(
    () => INSTRUMENT_TRANSPOSITIONS.find((i) => i.key === instrumentKey)?.semitones ?? 0,
    [instrumentKey]
  );

  const writtenNote = useMemo(() => {
    if (!noteData) return null;
    return transposeNote({ noteName: noteData.noteName, octave: noteData.octave }, transposition);
  }, [noteData, transposition]);

  const cents = noteData?.cents ?? 0;

  return (
    <PageContent>
      <PageHeader title="Stemapparaat" backButton={<BackButton onClick={() => navigate("/tools")} ariaLabel="Terug naar tools" />}></PageHeader>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-700" htmlFor="instrument">
            Instrument
          </label>
          <select
            id="instrument"
            className="border rounded px-3 py-2 text-sm"
            value={instrumentKey}
            onChange={(e) => setInstrumentKey(e.target.value)}
          >
            {INSTRUMENT_TRANSPOSITIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="ml-auto">
            {listening ? (
              <button onClick={stop} className="px-3 py-2 text-sm rounded bg-red-50 text-red-700 border border-red-200">
                Stop
              </button>
            ) : (
              <button
                onClick={start}
                className="px-3 py-2 text-sm rounded bg-green-50 text-green-700 border border-green-200"
              >
                Start
              </button>
            )}
          </div>
        </div>

        {error && <div className="p-3 rounded bg-red-50 text-red-700 text-sm border border-red-200">{error}</div>}

        <div className="space-y-4">
          <div>
            <div className="text-2xl font-semibold leading-none h-8 md:h-28 flex items-end justify-center whitespace-nowrap overflow-hidden">
              {writtenNote ? (
                <>
                  <span>{formatNoteName(writtenNote.noteName, ["Bb", "Eb", "F"].includes(instrumentKey))}</span>
                  <span className="text-2xl ml-1 text-gray-500">{writtenNote.octave}</span>
                </>
              ) : (
                <span className="text-gray-400 text-2xl">–</span>
              )}
            </div>
          </div>

          <div>
            <div className="mt-2">
              <AnalogPitchMeter cents={cents} />
            </div>
            {/* <div className="text-gray-600 mt-2 text-center h-6 flex items-center justify-center">
              {noteData ? `${cents > 0 ? "+" : ""}${cents}¢ — ${frequency?.toFixed(1)} Hz` : "–"}
            </div> */}
          </div>
          {/* 
            <div className="text-sm text-gray-600">
              <div className="text-gray-500 text-xs uppercase tracking-wide">Concert noot</div>
              <div className="flex items-end gap-1">
                <div className="text-xl">
                  {noteData ? (
                    <>
                      <span>{formatNoteName(noteData.noteName, true)}</span>
                      <span className="text-base ml-1 text-gray-500">{noteData.octave}</span>
                    </>
                  ) : (
                    <span className="text-gray-400">–</span>
                  )}
                </div>
                <div className="text-gray-500">{frequency ? `${frequency.toFixed(1)} Hz` : "Geen ingang"}</div>
              </div>
            </div> */}

          <div>
            <div className="mt-1 h-48 md:h-64 lg:h-80">
              <PitchHistoryChart samples={history} />
            </div>
          </div>
        </div>
      </div>
    </PageContent>
  );
};

export default Tuner;
