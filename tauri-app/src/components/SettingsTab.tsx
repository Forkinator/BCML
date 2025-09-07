import { useState, useEffect } from "react";
import { Button, Card, Col, Form, Row } from "react-bootstrap";
import { invoke } from "@tauri-apps/api/core";

interface Settings {
  game_dir: string;
  dlc_dir: string;
  cemu_dir: string;
  wiiu: boolean;
  lang: string;
}

const LANGUAGES = [
  "USen", "EUen", "USfr", "USes", "EUde", "EUes", "EUfr", "EUit", "EUnl", "EUru", "CNzh", "JPja", "KRko", "TWzh"
];

function SettingsTab() {
  const [settings, setSettings] = useState<Settings>({
    game_dir: "",
    dlc_dir: "",
    cemu_dir: "",
    wiiu: true,
    lang: "USen",
  });
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const loadedSettings = await invoke("get_settings") as Settings;
      setSettings(loadedSettings);
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
      await invoke("save_settings", { settings });
      setIsDirty(false);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to save settings: ${error}` });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings({
      game_dir: "",
      dlc_dir: "",
      cemu_dir: "",
      wiiu: true,
      lang: "USen",
    });
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
                  <Form.Label>Game Directory</Form.Label>
                  <div className="input-group">
                    <Form.Control
                      type="text"
                      value={settings.game_dir}
                      onChange={(e) => handleSettingChange('game_dir', e.target.value)}
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
                      value={settings.dlc_dir}
                      onChange={(e) => handleSettingChange('dlc_dir', e.target.value)}
                      placeholder="Path to DLC files..."
                    />
                    <Button variant="outline-secondary">Browse</Button>
                  </div>
                </Form.Group>
              </Col>

              <Col md={6}>
                <h6>Advanced Options</h6>
                <div className="alert alert-info">
                  <small>
                    Additional configuration options will be available in future updates.
                    The current settings cover the core functionality needed for mod management.
                  </small>
                </div>

                <div className="card">
                  <div className="card-body">
                    <h6 className="card-title">Migration Status</h6>
                    <ul className="list-unstyled mb-0">
                      <li>✅ Modern React 19.x frontend</li>
                      <li>✅ Tauri native backend</li>
                      <li>✅ Bootstrap 5.x UI</li>
                      <li>✅ TypeScript support</li>
                      <li>🔄 Rust API integration (in progress)</li>
                      <li>⏳ File operations</li>
                      <li>⏳ Mod installation</li>
                    </ul>
                  </div>
                </div>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}

export default SettingsTab;