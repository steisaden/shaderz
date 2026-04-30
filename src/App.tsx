import { useEffect, useMemo, useState } from 'react';
import { getPreset, getAllPresets } from './components/presets/PresetRegistry';
import { PresetDefinition } from './components/presets/types';
import { PresetErrorBoundary } from './components/presets/PresetErrorBoundary';
import PresetInspector from './components/presets/PresetInspector';

type SliderProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  displayValue?: string | number;
};

type ControlWithDefault = NonNullable<PresetDefinition['controls']>[number] & {
  defaultValue?: number | [number, number, number];
  kind?: 'slider' | 'color';
};

const STORAGE_KEY = 'activePresetId';
const URL_SYNC_DECIMALS = 6;

const getDefaultPreset = (presets: PresetDefinition[]) =>
  getPreset('noorder_licht') || presets[0];

const persistActivePresetId = (presetId: string) => {
  try {
    localStorage.setItem(STORAGE_KEY, presetId);
  } catch {
    // Ignore storage failures; state still keeps the app usable.
  }
};

const getSearchParams = () => {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search);
};

const resolveInitialPresetId = (defaultPreset: PresetDefinition) => {
  const queryPresetId = getSearchParams()?.get('preset');
  if (queryPresetId && getPreset(queryPresetId)) return queryPresetId;

  let storedPresetId: string | null = null;

  try {
    storedPresetId = localStorage.getItem(STORAGE_KEY);
  } catch {
    storedPresetId = null;
  }

  const validPreset = storedPresetId ? getPreset(storedPresetId) : null;
  const initialPreset = validPreset || defaultPreset;

  if (!validPreset && initialPreset) {
    persistActivePresetId(initialPreset.id);
  }

  return initialPreset?.id || '';
};

const getInitialPresetProps = (preset: PresetDefinition, includeUrlOverrides = false) => {
  const props = { ...preset.defaultProps };
  const searchParams = includeUrlOverrides ? getSearchParams() : null;

  preset.controls?.forEach((control) => {
    const typedControl = control as ControlWithDefault;
    const queryValue = searchParams?.get(typedControl.propName);

    if (queryValue !== null && queryValue !== undefined) {
      props[typedControl.propName] = normalizeControlValue(typedControl, queryValue);
      return;
    }

    props[typedControl.propName] = normalizeControlValue(
      typedControl,
      props[typedControl.propName] ?? typedControl.defaultValue ?? typedControl.min ?? 0
    );
  });

  return props;
};

const getStepDecimals = (step: number) => {
  if (!Number.isFinite(step)) return 2;
  const stepString = step.toString();

  if (stepString.includes('e-')) {
    return Number(stepString.split('e-')[1]) || 2;
  }

  return stepString.includes('.') ? stepString.split('.')[1].length : 0;
};

const formatFixed = (value: number, step: number, minimumDecimals = 0) => {
  const decimals = Math.min(4, Math.max(minimumDecimals, getStepDecimals(step)));
  return value.toFixed(decimals);
};

const formatControlValue = (control: ControlWithDefault, value: number) => {
  const step = control.step ?? 1;
  const min = control.min ?? 0;
  const max = control.max ?? 1;

  if (control.format === 'percent') {
    return `${formatFixed(value * 100, step * 100, 0)}%`;
  }

  if (control.format === 'multiplier') {
    return `${formatFixed(value, step, 1)}×`;
  }

  const label = control.label.toLowerCase();
  const propName = control.propName.toLowerCase();
  const looksPercent = min >= 0
    && max <= 1
    && /(opacity|intensity|amount|strength|alpha|mix|blend|density)/.test(`${label} ${propName}`);

  if (looksPercent) {
    return `${formatFixed(value * 100, step * 100, 0)}%`;
  }

  return formatFixed(value, step);
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const rgbToHex = (value: [number, number, number]) => {
  const toByte = (channel: number) => Math.round(clamp01(channel) * 255).toString(16).padStart(2, '0');
  return `#${toByte(value[0])}${toByte(value[1])}${toByte(value[2])}`;
};

const hexToRgb = (hex: string): [number, number, number] => {
  const normalized = hex.trim().replace(/^#/, '');
  if (normalized.length !== 6) return [1, 1, 1];

  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  return [r, g, b];
};

const isRgbArray = (value: unknown): value is [number, number, number] => (
  Array.isArray(value)
  && value.length === 3
  && value.every((channel) => typeof channel === 'number' && Number.isFinite(channel))
);

const normalizeControlValue = (control: ControlWithDefault, value: unknown) => {
  if (control.kind === 'color') {
    if (isRgbArray(value)) return value;
    if (typeof value === 'string' && /^#?[0-9a-fA-F]{6}$/.test(value)) {
      return hexToRgb(value);
    }
    if (isRgbArray(control.defaultValue)) return control.defaultValue;
    return [1, 1, 1] as [number, number, number];
  }

  const fallback = control.min ?? 0;
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : (typeof control.defaultValue === 'number' ? control.defaultValue : fallback);
};

const serializeNumericValue = (value: number) => {
  const rounded = Number(value.toFixed(URL_SYNC_DECIMALS));
  return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(/0+$/, '').replace(/\.$/, '');
};

const serializeRgbValue = (value: [number, number, number]) => rgbToHex(value).replace('#', '');

const getControlGroup = (control: ControlWithDefault) => {
  if (control.group) return control.group;

  const haystack = `${control.propName} ${control.label}`.toLowerCase();

  if (/(speed|time|motion|velocity|rotation|rotate|drift|flow|pulse|wave)/.test(haystack)) return 'Motion';
  if (/(shape|size|scale|radius|width|height|zoom|count|density|thickness|distance|spread|warp|distort|twist)/.test(haystack)) return 'Shape';
  if (/(color|hue|saturation|brightness|contrast|gamma|palette|tint)/.test(haystack)) return 'Color';
  if (/(texture|noise|grain|roughness|detail|frequency|octave|pattern|ripple)/.test(haystack)) return 'Texture';
  if (/(atmosphere|glow|bloom|light|fog|mist|opacity|alpha|intensity|strength)/.test(haystack)) return 'Atmosphere';
  if (/(output|exposure|vignette|resolution|quality|pixel|render)/.test(haystack)) return 'Output';

  return 'Shape';
};

const DEFAULT_OPEN_CONTROL_GROUPS: Record<string, string[]> = {
  Cosmic: ['Motion', 'Shape', 'Color'],
  Abstract: ['Shape', 'Motion', 'Color'],
  Grid: ['Motion', 'Shape'],
  Aurora: ['Motion', 'Atmosphere', 'Color'],
  Paper: ['Texture', 'Atmosphere'],
  Experimental: ['Motion', 'Shape'],
};

const GROUP_COPY: Record<string, string> = {
  Motion: 'Animation and drift',
  Shape: 'Composition and geometry',
  Texture: 'Grain, print, and detail',
  Atmosphere: 'Glow, fog, and brightness',
  Output: 'Final framing and render feel',
  Color: 'Palette and tonal balance',
};

const FEATURED_PRESETS = new Set(['galaxy_orb', 'nebular_grid', 'drifting_contours']);

const getInitialOpenControlGroups = (category: string, controls: ControlWithDefault[]) => {
  const preferred = DEFAULT_OPEN_CONTROL_GROUPS[category] || ['Motion', 'Shape'];
  const availableGroups = Array.from(new Set(controls.map((control) => getControlGroup(control))));

  const resolved = Object.fromEntries(
    availableGroups.map((group) => [group, preferred.includes(group)])
  ) as Record<string, boolean>;

  if (!Object.values(resolved).some(Boolean) && availableGroups.length > 0) {
    resolved[availableGroups[0]] = true;
  }

  return resolved;
};

const Slider = ({ label, value, onChange, min, max, step, displayValue }: SliderProps) => (
  <div className="space-y-2.5">
    <div className="flex justify-between gap-4">
      <label className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/65">{label}</label>
      <span className="text-[11px] text-white/50 tabular-nums">{displayValue ?? value}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/12 accent-cyan-400"
    />
  </div>
);

export default function App() {
  const allPresets = useMemo(() => getAllPresets(), []);
  const defaultPreset = useMemo(() => getDefaultPreset(allPresets), [allPresets]);
  const initialPresetId = useMemo(() => resolveInitialPresetId(defaultPreset), [defaultPreset]);
  const initialPreset = getPreset(initialPresetId) || defaultPreset;

  const [activePresetId, setActivePresetId] = useState<string>(initialPresetId);
  const [presetProps, setPresetProps] = useState<Record<string, any>>(() => getInitialPresetProps(initialPreset, true));
  const [uiVisible, setUiVisible] = useState(true);
  const [mobileSheetExpanded, setMobileSheetExpanded] = useState(false);
  const [libraryVisible, setLibraryVisible] = useState(true);
  const [inspectorVisible, setInspectorVisible] = useState(false);
  const [isCompactViewport, setIsCompactViewport] = useState(() => (
    typeof window !== 'undefined'
      ? window.matchMedia('(max-width: 767px)').matches
      : false
  ));
  const [copyStatus, setCopyStatus] = useState('');
  const [pngStatus, setPngStatus] = useState('');
  const [activePresetCategory, setActivePresetCategory] = useState(initialPreset.category);
  const [openControlGroups, setOpenControlGroups] = useState<Record<string, boolean>>(() => getInitialOpenControlGroups(initialPreset.category, (initialPreset.controls || []) as ControlWithDefault[]));

  const activePreset = getPreset(activePresetId) || defaultPreset;
  const ActivePresetComponent = activePreset.component;
  const groupedPresets = useMemo(
    () => allPresets.reduce<Record<string, PresetDefinition[]>>((groups, preset) => {
      const category = preset.category || 'Presets';
      groups[category] = [...(groups[category] || []), preset];
      return groups;
    }, {}),
    [allPresets]
  );
  const presetCategories = useMemo(() => Object.keys(groupedPresets), [groupedPresets]);
  const visiblePresets = groupedPresets[activePresetCategory] || allPresets;
  const groupedControls = useMemo(
    () => (activePreset.controls || []).reduce<Record<string, ControlWithDefault[]>>((groups, control) => {
      const typedControl = control as ControlWithDefault;
      const group = getControlGroup(typedControl);
      groups[group] = [...(groups[group] || []), typedControl];
      return groups;
    }, {}),
    [activePreset]
  );
  const resolvedPresetProps = useMemo(() => {
    const props = { ...activePreset.defaultProps, ...presetProps };

    activePreset.controls?.forEach((control) => {
      const typedControl = control as ControlWithDefault;
      props[typedControl.propName] = normalizeControlValue(
        typedControl,
        presetProps[typedControl.propName] ?? activePreset.defaultProps[typedControl.propName] ?? typedControl.defaultValue ?? typedControl.min ?? 0
      );
    });

    return props;
  }, [activePreset, presetProps]);

  const handleApplyPreset = (preset: PresetDefinition) => {
    setActivePresetId(preset.id);
    setActivePresetCategory(preset.category);
    setPresetProps(getInitialPresetProps(preset));
    setOpenControlGroups(getInitialOpenControlGroups(preset.category, (preset.controls || []) as ControlWithDefault[]));
    setLibraryVisible(false);
    setMobileSheetExpanded(!isCompactViewport);
    persistActivePresetId(preset.id);
    setCopyStatus('');
    setPngStatus('');
  };

  const handleResetPreset = () => {
    setPresetProps(getInitialPresetProps(activePreset));
  };

  const updatePresetProp = (key: string, val: number | [number, number, number]) => {
    setPresetProps(prev => ({ ...prev, [key]: val }));
  };

  const handleShareLink = async () => {
    const currentUrl = `${window.location.origin}${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (!navigator.clipboard?.writeText) {
      setCopyStatus('Clipboard unavailable');
      return;
    }

    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopyStatus('Link copied');
      window.setTimeout(() => setCopyStatus(''), 1800);
    } catch {
      setCopyStatus('Copy failed');
    }
  };

  const handleSavePng = () => {
    const canvas = document.querySelector('canvas');

    if (!canvas) {
      setPngStatus('No canvas found');
      return;
    }

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${activePreset.id || 'shader'}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setPngStatus('PNG saved');
      window.setTimeout(() => setPngStatus(''), 1800);
    } catch {
      setPngStatus('PNG unavailable');
    }
  };

  useEffect(() => {
    const validPreset = getPreset(activePresetId);

    if (!validPreset) {
      setActivePresetId(defaultPreset.id);
      setPresetProps(getInitialPresetProps(defaultPreset));
      persistActivePresetId(defaultPreset.id);
      return;
    }

    persistActivePresetId(validPreset.id);
  }, [activePresetId, defaultPreset]);

  useEffect(() => {
    setActivePresetCategory(activePreset.category);
    setOpenControlGroups(getInitialOpenControlGroups(activePreset.category, (activePreset.controls || []) as ControlWithDefault[]));
  }, [activePreset.id]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const updateViewport = (event?: MediaQueryListEvent) => {
      setIsCompactViewport(event ? event.matches : mediaQuery.matches);
    };

    updateViewport();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateViewport);
      return () => mediaQuery.removeEventListener('change', updateViewport);
    }

    mediaQuery.addListener(updateViewport);
    return () => mediaQuery.removeListener(updateViewport);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams();
    params.set('preset', activePreset.id);

    activePreset.controls?.forEach((control) => {
      const typedControl = control as ControlWithDefault;
      const value = resolvedPresetProps[typedControl.propName];
      const defaultValue = normalizeControlValue(
        typedControl,
        activePreset.defaultProps[typedControl.propName] ?? typedControl.defaultValue ?? typedControl.min
      );

      if (typedControl.kind === 'color') {
        if (!isRgbArray(value) || !isRgbArray(defaultValue)) return;
        if (serializeRgbValue(value) === serializeRgbValue(defaultValue)) return;
        params.set(typedControl.propName, serializeRgbValue(value));
        return;
      }

      if (typeof value !== 'number' || !Number.isFinite(value)) return;
      if (typeof defaultValue !== 'number' || Math.abs(value - defaultValue) < 1e-9) return;

      params.set(typedControl.propName, serializeNumericValue(value));
    });

    const nextUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (nextUrl !== currentUrl) {
      window.history.replaceState(null, '', nextUrl);
    }
  }, [activePreset, resolvedPresetProps]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#05030a] font-sans text-white">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        {ActivePresetComponent && (
          <PresetErrorBoundary presetName={activePreset.name}>
            <ActivePresetComponent key={activePreset.id} {...resolvedPresetProps} />
          </PresetErrorBoundary>
        )}
      </div>

      {/* Responsive Controls */}
      <aside
        className={`absolute inset-x-2 bottom-2 z-20 flex max-h-[72svh] flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/55 shadow-2xl shadow-black/35 backdrop-blur-xl transition-all duration-300 sm:inset-x-4 sm:bottom-3 md:bottom-6 md:left-auto md:right-6 md:top-6 md:h-[calc(100vh-3rem)] md:max-h-none md:w-[21rem] md:rounded-[2rem] ${uiVisible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      >
        <div className="sticky top-0 z-20 border-b border-white/10 bg-black/75 px-3 py-3 backdrop-blur-2xl md:px-5 md:py-4 max-[430px]:px-2.5 max-[430px]:py-2.5">
          <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-white/20 md:hidden" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-indigo-300/70">Shader Studio</p>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[1.2rem] font-bold leading-tight md:text-2xl">Preset Studio</h1>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/50">
                  {allPresets.length} presets
                </span>
              </div>
            </div>
            <button
              onClick={() => setMobileSheetExpanded((expanded) => !expanded)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-white/70 transition-colors hover:bg-white/10 hover:text-white md:hidden"
            >
              {mobileSheetExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 md:mt-4">
            <button
              onClick={() => setLibraryVisible((visible) => !visible)}
              className={`rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.24em] transition-colors ${libraryVisible
                ? 'border-indigo-300/35 bg-indigo-500/12 text-white'
                : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {libraryVisible ? 'Hide Presets' : 'Show Presets'}
            </button>
            <button
              onClick={() => setMobileSheetExpanded(true)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-white/60 transition-colors hover:bg-white/10 hover:text-white md:hidden"
            >
              Show Controls
            </button>
          </div>
        </div>

        {!mobileSheetExpanded && (
          <div className="border-b border-white/10 px-3 py-3 md:hidden max-[430px]:px-2.5 max-[430px]:py-2.5">
            <button
              onClick={() => setMobileSheetExpanded(true)}
              className="flex w-full items-center justify-between gap-3 rounded-[1.35rem] border border-white/10 bg-white/[0.055] px-3 py-3 text-left shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] transition-colors hover:bg-white/[0.08] max-[430px]:rounded-[1.15rem] max-[430px]:px-2.5 max-[430px]:py-2.5"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-white/35">Selected preset</p>
                <p className="truncate text-sm font-semibold text-white">{activePreset.name}</p>
                <p className="truncate text-[11px] text-white/45">{activePreset.category} • Tap to open controls</p>
              </div>
              <span className="shrink-0 rounded-full border border-indigo-300/30 bg-indigo-500/15 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white">
                Expand
              </span>
            </button>
          </div>
        )}

        <div
          className={`flex min-h-0 flex-1 flex-col transition-all duration-300 ${mobileSheetExpanded ? 'opacity-100' : 'pointer-events-none max-h-0 overflow-hidden opacity-0 md:max-h-none md:opacity-100 md:pointer-events-auto'}`}
        >
          {libraryVisible && (
            <section className="border-b border-white/10 bg-white/[0.02] px-3 py-3 md:px-5 md:py-5 max-[430px]:px-2.5 max-[430px]:py-2.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Preset Library</h4>
                  <p className="mt-1 text-xs text-white/32">Choose a visual starting point.</p>
                </div>
                <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-indigo-200/80">
                  {activePresetCategory}
                </span>
              </div>

              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 pr-1">
                {presetCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActivePresetCategory(category)}
                    className={`whitespace-nowrap rounded-full border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] transition-colors ${activePresetCategory === category
                      ? 'border-indigo-400/50 bg-indigo-500/15 text-white'
                      : 'border-white/10 bg-white/5 text-white/55 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="mt-3 space-y-2.5 max-[430px]:mt-2.5 max-[430px]:space-y-2">
                {visiblePresets.map((preset) => {
                  const isActive = preset.id === activePreset.id;
                  const isFeatured = FEATURED_PRESETS.has(preset.id);

                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleApplyPreset(preset)}
                      className={`group relative w-full overflow-hidden rounded-[1.35rem] border px-4 py-3 text-left transition-all max-[430px]:rounded-[1.2rem] max-[430px]:px-3 max-[430px]:py-2.5 ${isActive
                        ? 'border-indigo-300/40 bg-gradient-to-br from-indigo-500/14 via-white/6 to-cyan-500/8 shadow-[0_0_0_1px_rgba(129,140,248,0.12),0_16px_40px_rgba(0,0,0,0.18)]'
                        : 'border-white/10 bg-white/5 hover:border-white/18 hover:bg-white/[0.08]'
                      }`}
                    >
                      <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-white max-[430px]:text-[0.92rem]">{preset.name}</span>
                            {isActive && (
                              <span className="rounded-full border border-indigo-300/30 bg-indigo-300/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.24em] text-indigo-100">
                                Active
                              </span>
                            )}
                            {isFeatured && (
                              <span className="rounded-full border border-white/10 bg-white/8 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.24em] text-white/65">
                                Flagship
                              </span>
                            )}
                          </div>
                          <p className="text-xs leading-5 text-white/45 max-[430px]:leading-4">{preset.description}</p>
                        </div>
                        <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.2em] text-white/25 transition-colors group-hover:text-white/45 max-[430px]:text-[0.65rem]">
                          {preset.category}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 md:px-5 md:py-6 max-[430px]:px-2.5 max-[430px]:py-3">
            <div className="relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-black/20 p-4 shadow-inner shadow-black/20 md:p-5 max-[430px]:rounded-[1.35rem] max-[430px]:p-3.5">
              <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/14 to-transparent" />
              <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-indigo-400/10 blur-3xl" />
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/6 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/55">
                      {activePreset.category}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
                      v{activePreset.version}
                    </span>
                    {FEATURED_PRESETS.has(activePreset.id) && (
                      <span className="rounded-full border border-indigo-300/25 bg-indigo-300/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-indigo-100/90">
                        Flagship
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold leading-tight text-white max-[430px]:text-[1.05rem]">{activePreset.name}</h2>
                  <p className="text-sm leading-6 text-white/60 max-[430px]:text-[0.88rem] max-[430px]:leading-5">{activePreset.description}</p>
                </div>
                <button
                  onClick={handleResetPreset}
                  className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 px-1 md:px-0">
                <div className="h-px flex-1 bg-white/10" />
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/40">
                  Controls
                </span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              {(Object.entries(groupedControls) as [string, ControlWithDefault[]][]).map(([group, controls]) => {
                const isOpen = openControlGroups[group] ?? false;

                return (
                  <section key={group} className="rounded-[1.6rem] border border-white/12 bg-gradient-to-b from-white/[0.06] to-white/[0.03] p-4 max-[430px]:rounded-[1.35rem] max-[430px]:p-3.5">
                    <button
                      type="button"
                      onClick={() => setOpenControlGroups((current) => ({ ...current, [group]: !current[group] }))}
                      className="flex w-full items-start justify-between gap-3 text-left"
                    >
                      <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/45">{group}</h3>
                        <p className="mt-1 text-xs text-white/35">{GROUP_COPY[group] || 'Fine-tune this layer'}</p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
                        {controls.length}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="mt-4 space-y-5 max-[430px]:mt-3 max-[430px]:space-y-4">
                        {controls.map((control) => {
                          const value = resolvedPresetProps[control.propName];

                          if (control.kind === 'color' && isRgbArray(value)) {
                            const hex = rgbToHex(value);

                            return (
                              <div key={control.propName} className="space-y-2.5">
                                <div className="flex items-center justify-between gap-4">
                                  <label className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/65">{control.label}</label>
                                  <span className="text-[11px] text-white/50 tabular-nums">{hex}</span>
                                </div>
                                <div className="flex items-center gap-3 rounded-[1.25rem] border border-white/10 bg-black/25 px-3 py-3 max-[430px]:rounded-[1.1rem] max-[430px]:px-2.5 max-[430px]:py-2.5">
                                  <input
                                    type="color"
                                    value={hex}
                                    onChange={(event) => updatePresetProp(control.propName, hexToRgb(event.target.value))}
                                    className="h-10 w-12 cursor-pointer rounded-xl border border-white/10 bg-transparent p-0"
                                  />
                                  <div className="min-w-0 flex-1 space-y-1">
                                    <p className="text-xs text-white/45">Adjust the tonal balance for this color layer.</p>
                                    <div className="h-1.5 rounded-full bg-white/10" style={{ background: `linear-gradient(90deg, ${hex}, rgba(255,255,255,0.15))` }} />
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div key={control.propName}>
                              <Slider
                                label={control.label}
                                value={typeof value === 'number' ? value : 0}
                                onChange={(val: number) => updatePresetProp(control.propName, val)}
                                min={control.min ?? 0}
                                max={control.max ?? 1}
                                step={control.step ?? 1}
                                displayValue={typeof value === 'number' ? formatControlValue(control, value) : ''}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </div>

        </div>

        <div className="sticky bottom-0 z-20 space-y-3 border-t border-white/10 bg-gradient-to-t from-black/85 via-black/75 to-black/60 px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] md:px-5 max-[430px]:px-2.5 max-[430px]:pt-2.5">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-[430px]:grid-cols-1">
            <button
              onClick={handleShareLink}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 via-white/6 to-white/[0.03] px-4 py-3 text-left transition-colors hover:border-white/20 hover:bg-white/[0.12] max-[430px]:rounded-[1.35rem] max-[430px]:px-3.5 max-[430px]:py-3"
            >
              <div className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
              <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-white/35">Share</span>
              <span className="mt-1 block text-sm font-semibold text-white">Share Link</span>
            </button>
            <button
              onClick={handleSavePng}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 via-white/6 to-white/[0.03] px-4 py-3 text-left transition-colors hover:border-white/20 hover:bg-white/[0.12] max-[430px]:rounded-[1.35rem] max-[430px]:px-3.5 max-[430px]:py-3"
            >
              <div className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
              <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-white/35">Export</span>
              <span className="mt-1 block text-sm font-semibold text-white">Export PNG</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 max-[430px]:grid-cols-1">
            <button
              onClick={() => setInspectorVisible((visible) => !visible)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white/55 transition-colors hover:bg-white/10 hover:text-white"
            >
              {inspectorVisible ? 'Hide Studio Details' : 'Studio Details'}
            </button>
            <button
              onClick={() => setUiVisible(false)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white/55 transition-colors hover:bg-white/10 hover:text-white"
            >
              Focus Canvas
            </button>
          </div>

          {(copyStatus || pngStatus) && (
            <p className="text-center text-xs text-white/45">{copyStatus || pngStatus}</p>
          )}
        </div>
      </aside>

      {!uiVisible && (
        <button
          onClick={() => setUiVisible(true)}
          className="absolute bottom-4 right-4 z-30 rounded-full border border-white/10 bg-black/50 px-4 py-3 text-xs font-bold uppercase tracking-widest text-white/80 shadow-2xl shadow-black/40 backdrop-blur-xl transition-colors hover:bg-white/10 hover:text-white md:right-6 md:top-6 md:bottom-auto"
        >
          Show Studio
        </button>
      )}

      {inspectorVisible && <PresetInspector />}
    </div>
  );
}
