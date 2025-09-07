import { useState, useEffect } from "react";
import { Button, Card, Col, Form, Row } from "react-bootstrap";
// import { invoke } from "@tauri-apps/api/core";

interface Settings {
  cemu_dir: string;
  game_dir: string;
  game_dir_nx: string;
  update_dir: string;
  dlc_dir: string;
  dlc_dir_nx: string;
  store_dir: string;
  export_dir: string;
  export_dir_nx: string;
  load_reverse: boolean;
  site_meta: string;
  no_guess: boolean;
  lang: string;
  no_cemu: boolean;
  wiiu: boolean;
  no_hardlinks: boolean;
  force_7z: boolean;
  suppress_update: boolean;
  nsfw: boolean;
  changelog: boolean;
  strip_gfx: boolean;
  auto_gb: boolean;
  show_gb: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  cemu_dir: "",
  game_dir: "",
  game_dir_nx: "",
  update_dir: "",
  dlc_dir: "",
  dlc_dir_nx: "",
  store_dir: "",
  export_dir: "",
  export_dir_nx: "",
  load_reverse: false,
  site_meta: "",
  no_guess: false,
  lang: "USen",
  no_cemu: false,
  wiiu: true,
  no_hardlinks: false,
  force_7z: false,
  suppress_update: false,
  nsfw: false,
  changelog: true,
  strip_gfx: false,
  auto_gb: true,
  show_gb: true,
};

const LANGUAGES = [
  "USen", "EUen", "USfr", "USes", "EUde", "EUes", "EUfr", "EUit", "EUnl", "EUru", "CNzh", "JPja", "KRko", "TWzh"
];

function SettingsTab() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // TODO: Implement get_settings Tauri command
      // const loadedSettings = await invoke("get_settings");
      // setSettings({ ...DEFAULT_SETTINGS, ...loadedSettings });
      
      // For now, use defaults
      setSettings(DEFAULT_SETTINGS);
    } catch (error) {
      console.error("Failed to load settings:", error);
      setMessage({ type: 'error', text: `Failed to load settings: ${error}` });
    }
  };

  const handleSettingChange = (key: keyof Settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
    setMessage(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: Implement save_settings Tauri command
      // await invoke("save_settings", { settings });
      
      // Placeholder for now
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate save delay
      
      setIsDirty(false);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to save settings: ${error}` });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setIsDirty(true);
    setMessage(null);
  };

  return (
    <div>
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5>BCML Settings</h5>
          <div>
            <Button 
              variant="outline-secondary" 
              className="me-2"
              onClick={handleReset}
            >
              Reset to Defaults
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSave}
              disabled={!isDirty || saving}
            >
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {message && (
            <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} mb-3`}>
              {message.text}
            </div>
          )}

          <Form>
            <Row>
              <Col md={6}>
                <h6>Platform</h6>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="radio"
                    id="platform-wiiu"
                    label="Wii U"
                    checked={settings.wiiu}
                    onChange={(e) => handleSettingChange('wiiu', e.target.checked)}
                  />
                  <Form.Check
                    type="radio"
                    id="platform-switch"
                    label="Nintendo Switch"
                    checked={!settings.wiiu}
                    onChange={(e) => handleSettingChange('wiiu', !e.target.checked)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Language</Form.Label>
                  <Form.Select
                    value={settings.lang}
                    onChange={(e) => handleSettingChange('lang', e.target.value)}
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                {settings.wiiu && (
                  <Form.Group className="mb-3">
                    <Form.Label>Cemu Directory</Form.Label>
                    <div className="input-group">
                      <Form.Control
                        type="text"
                        value={settings.cemu_dir}
                        onChange={(e) => handleSettingChange('cemu_dir', e.target.value)}
                        placeholder="Path to Cemu installation..."
                      />
                      <Button variant="outline-secondary">Browse</Button>
                    </div>
                  </Form.Group>
                )}

                <Form.Group className="mb-3">
                  <Form.Label>{settings.wiiu ? "Game Directory (Wii U)" : "Game Directory (Switch)"}</Form.Label>
                  <div className="input-group">
                    <Form.Control
                      type="text"
                      value={settings.wiiu ? settings.game_dir : settings.game_dir_nx}
                      onChange={(e) => handleSettingChange(settings.wiiu ? 'game_dir' : 'game_dir_nx', e.target.value)}
                      placeholder="Path to game files..."
                    />
                    <Button variant="outline-secondary">Browse</Button>
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>DLC Directory</Form.Label>
                  <div className="input-group">
                    <Form.Control
                      type="text"
                      value={settings.wiiu ? settings.dlc_dir : settings.dlc_dir_nx}
                      onChange={(e) => handleSettingChange(settings.wiiu ? 'dlc_dir' : 'dlc_dir_nx', e.target.value)}
                      placeholder="Path to DLC files..."
                    />
                    <Button variant="outline-secondary">Browse</Button>
                  </div>
                </Form.Group>
              </Col>

              <Col md={6}>
                <h6>Options</h6>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="load-reverse"
                    label="Load mods in reverse priority order"
                    checked={settings.load_reverse}
                    onChange={(e) => handleSettingChange('load_reverse', e.target.checked)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="no-hardlinks"
                    label="Disable hardlinks (copy instead of link)"
                    checked={settings.no_hardlinks}
                    onChange={(e) => handleSettingChange('no_hardlinks', e.target.checked)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="force-7z"
                    label="Force 7z compression for mods"
                    checked={settings.force_7z}
                    onChange={(e) => handleSettingChange('force_7z', e.target.checked)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="suppress-update"
                    label="Suppress update notifications"
                    checked={settings.suppress_update}
                    onChange={(e) => handleSettingChange('suppress_update', e.target.checked)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="changelog"
                    label="Show changelog on updates"
                    checked={settings.changelog}
                    onChange={(e) => handleSettingChange('changelog', e.target.checked)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="auto-gb"
                    label="Auto-generate GraphicPacks"
                    checked={settings.auto_gb}
                    onChange={(e) => handleSettingChange('auto_gb', e.target.checked)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="strip-gfx"
                    label="Strip unnecessary graphic files"
                    checked={settings.strip_gfx}
                    onChange={(e) => handleSettingChange('strip_gfx', e.target.checked)}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}

export default SettingsTab;