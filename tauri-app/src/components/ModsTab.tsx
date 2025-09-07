import { useState, useEffect } from "react";
import { Button, ButtonGroup, Card, Col, Row, Table } from "react-bootstrap";
import { invoke } from "@tauri-apps/api/core";

interface Mod {
  name: string;
  path: string;
  enabled: boolean;
  priority: number;
  description?: string;
  version?: string;
}

function ModsTab() {
  const [mods, setMods] = useState<Mod[]>([]);
  const [selectedMods, setSelectedMods] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMods();
  }, []);

  const loadMods = async () => {
    setLoading(true);
    try {
      const modList = await invoke("get_mods") as Mod[];
      setMods(modList);
    } catch (error) {
      console.error("Failed to load mods:", error);
      // Fallback to placeholder data
      setMods([
        {
          name: "Example Mod 1",
          path: "/path/to/mod1",
          enabled: true,
          priority: 100,
          description: "An example mod for testing"
        },
        {
          name: "Example Mod 2",
          path: "/path/to/mod2",
          enabled: false,
          priority: 200,
          description: "Another example mod"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleModSelect = (modPath: string, selected: boolean) => {
    if (selected) {
      setSelectedMods([...selectedMods, modPath]);
    } else {
      setSelectedMods(selectedMods.filter(path => path !== modPath));
    }
  };

  const handleInstallMod = () => {
    // TODO: Implement mod installation dialog
    console.log("Install mod clicked");
  };

  const handleEnableMods = async () => {
    try {
      for (const modPath of selectedMods) {
        await invoke("toggle_mod", { mod_path: modPath, enabled: true });
      }
      await loadMods(); // Refresh mod list
      setSelectedMods([]);
    } catch (error) {
      console.error("Failed to enable mods:", error);
    }
  };

  const handleDisableMods = async () => {
    try {
      for (const modPath of selectedMods) {
        await invoke("toggle_mod", { mod_path: modPath, enabled: false });
      }
      await loadMods(); // Refresh mod list
      setSelectedMods([]);
    } catch (error) {
      console.error("Failed to disable mods:", error);
    }
  };

  const handleUninstallMods = async () => {
    if (!confirm(`Are you sure you want to uninstall ${selectedMods.length} mod(s)?`)) {
      return;
    }
    
    try {
      for (const modPath of selectedMods) {
        await invoke("uninstall_mod", { mod_path: modPath });
      }
      await loadMods(); // Refresh mod list
      setSelectedMods([]);
    } catch (error) {
      console.error("Failed to uninstall mods:", error);
    }
  };

  return (
    <div>
      <Row className="mb-3">
        <Col>
          <ButtonGroup>
            <Button variant="primary" onClick={handleInstallMod}>
              Install Mod
            </Button>
            <Button 
              variant="success" 
              onClick={handleEnableMods}
              disabled={selectedMods.length === 0}
            >
              Enable
            </Button>
            <Button 
              variant="warning" 
              onClick={handleDisableMods}
              disabled={selectedMods.length === 0}
            >
              Disable
            </Button>
            <Button 
              variant="danger" 
              onClick={handleUninstallMods}
              disabled={selectedMods.length === 0}
            >
              Uninstall
            </Button>
          </ButtonGroup>
        </Col>
      </Row>

      <Card>
        <Card.Header>
          <h5>Installed Mods ({mods.length})</h5>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center">Loading mods...</div>
          ) : mods.length === 0 ? (
            <div className="text-center text-muted">
              No mods installed. Click "Install Mod" to get started.
            </div>
          ) : (
            <Table striped hover>
              <thead>
                <tr>
                  <th></th>
                  <th>Name</th>
                  <th>Version</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {mods.map((mod, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedMods.includes(mod.path)}
                        onChange={(e) => handleModSelect(mod.path, e.target.checked)}
                      />
                    </td>
                    <td className="fw-bold">{mod.name}</td>
                    <td className="text-muted">{mod.version || "Unknown"}</td>
                    <td>
                      <span className={`badge ${mod.enabled ? 'bg-success' : 'bg-secondary'}`}>
                        {mod.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td>{mod.priority}</td>
                    <td className="text-muted">{mod.description}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

export default ModsTab;