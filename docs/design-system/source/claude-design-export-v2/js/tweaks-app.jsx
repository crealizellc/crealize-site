// CREALIZE — Tweaks island (React). Renders only the TweaksPanel and
// applies tweak values to the vanilla site via CSS vars + custom events.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#FF4F00",
  "displayFont": "Space Grotesk",
  "heroMode": "condense",
  "motion": 70,
  "jpAccents": true
}/*EDITMODE-END*/;

const CRZ_FONTS = {
  'Space Grotesk': "'Space Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  'Schibsted Grotesk': "'Schibsted Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  'Archivo': "'Archivo', 'Helvetica Neue', Helvetica, Arial, sans-serif",
};

function CrzTweaksApp() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // ---- apply to the vanilla site ----
  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent', t.accent);
    root.style.setProperty('--font-display', CRZ_FONTS[t.displayFont] || CRZ_FONTS['Space Grotesk']);
    root.style.setProperty('--motion', String(t.motion / 100));
    root.setAttribute('data-jp', t.jpAccents ? 'on' : 'off');
    window.dispatchEvent(new CustomEvent('crealize:tweaks', {
      detail: { accent: t.accent, motion: t.motion / 100, heroMode: t.heroMode },
    }));
  }, [t]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Hero — Materialize" />
      <TweakRadio
        label="Technique"
        value={t.heroMode}
        options={[
          { value: 'condense', label: 'Condense' },
          { value: 'particles', label: 'Particles' },
          { value: 'slices', label: 'Slices' },
        ]}
        onChange={(v) => setTweak('heroMode', v)}
      />
      <TweakSlider
        label="Motion intensity"
        value={t.motion} min={0} max={100} step={5} unit="%"
        onChange={(v) => setTweak('motion', v)}
      />

      <TweakSection label="Identity" />
      <TweakColor
        label="Accent"
        value={t.accent}
        options={['#FF4F00', '#2747F0', '#DE2010', '#111111']}
        onChange={(v) => setTweak('accent', v)}
      />
      <TweakSelect
        label="Display type"
        value={t.displayFont}
        options={['Space Grotesk', 'Schibsted Grotesk', 'Archivo']}
        onChange={(v) => setTweak('displayFont', v)}
      />
      <TweakToggle
        label="Japanese accents"
        value={t.jpAccents}
        onChange={(v) => setTweak('jpAccents', v)}
      />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById('tweaks-root')).render(<CrzTweaksApp />);
