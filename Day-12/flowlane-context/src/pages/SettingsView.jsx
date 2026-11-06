import { Tabs } from '../components/Tabs';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { announceLanguage } from '../lib/languageToast';

const card = { background: 'var(--bg-secondary)', borderRadius: 12, padding: 24, border: '1px solid var(--border-color)', marginBottom: 24 };

/**
 * The Settings page. It uses three contexts at once (Theme, Language and the Tabs component's own
 * internal one) and shows the Tabs component in its UNCONTROLLED form: it keeps its own state.
 */
export default function SettingsView({ onBack }) {
  const { mode, toggleTheme } = useTheme();
  const { t, locale, locales, setLocale } = useLanguage();
  const toast = useToast();

  return (
    <div style={{ padding: '40px 60px', maxWidth: 800, margin: '0 auto', width: '100%' }}>
      <button
        onClick={onBack}
        style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 32, fontSize: 14, fontWeight: 500 }}
      >
        {t('common.back')}
      </button>
      <h2 style={{ fontSize: 28, marginBottom: 24 }}>{t('settings.title')}</h2>

      <Tabs defaultValue="appearance">
        <Tabs.List className="project-tabs" aria-label={t('settings.tabs.label')} style={{ marginBottom: 24 }}>
          <Tabs.Tab value="appearance">{t('settings.tabs.appearance')}</Tabs.Tab>
          <Tabs.Tab value="language">{t('settings.tabs.language')}</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="appearance" className="">
          <div style={card}>
            <h3 style={{ fontSize: 16, marginBottom: 16 }}>{t('settings.appearance.title')}</h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{t('settings.darkMode')}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{t('settings.darkMode.hint')}</div>
              </div>
              <button
                role="switch"
                aria-checked={mode === 'dark'}
                aria-label={t('settings.darkMode.aria')}
                onClick={(event) => {
                  toggleTheme(event);
                  toast.info(mode === 'dark' ? t('ui.toast.themeLight') : t('ui.toast.themeDark'));
                }}
                style={{
                  width: 48, height: 26, borderRadius: 13, border: 'none',
                  background: mode === 'dark' ? 'var(--primary-color)' : 'var(--border-color)',
                  position: 'relative', cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: mode === 'dark' ? 25 : 3, transition: 'all 0.2s' }} />
              </button>
            </div>
          </div>
        </Tabs.Panel>

        <Tabs.Panel value="language" className="">
          <div style={card}>
            <h3 style={{ fontSize: 16, marginBottom: 8 }}>{t('settings.language.title')}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>{t('settings.language.hint')}</p>
            <fieldset style={{ border: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <legend className="visually-hidden">{t('settings.language.legend')}</legend>
              {locales.map((option) => (
                <label key={option.code} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 15 }}>
                  <input
                    type="radio"
                    name="language"
                    value={option.code}
                    checked={locale === option.code}
                    onChange={() => {
                      setLocale(option.code);
                      announceLanguage(toast, option);
                    }}
                    lang={option.code}
                  />
                  <span lang={option.code}>{option.label}</span>
                </label>
              ))}
            </fieldset>
          </div>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
