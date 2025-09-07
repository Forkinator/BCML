import { useState, useEffect } from "react";
import { Button, ButtonGroup, Card, Col, Row, Table, Modal, Form } from "react-bootstrap";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

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
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [installFiles, setInstallFiles] = useState<string[]>([]);

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

  const handleInstallMod = async () => {
    setShowInstallModal(true);
  };

  const handleSelectModFiles = async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [{
          name: 'Mod Files',
          extensions: ['bnp', 'zip', '7z', 'rar']
        }]
      });
      
      if (selected && Array.isArray(selected)) {
        setInstallFiles(selected);
      } else if (selected) {
        setInstallFiles([selected]);
      }
    } catch (error) {
      console.error("Error selecting mod files:", error);
    }
  };

  const handleInstallSelectedMods = async () => {
    // For now, just show that installation was attempted
    console.log("Installing mods:", installFiles);
    setInstallFiles([]);
    setShowInstallModal(false);
    // TODO: Implement actual mod installation via Tauri command
    alert(`Installation of ${installFiles.length} mod(s) would be processed here. This feature is not yet fully implemented.`);
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

      {/* Mod Installation Modal */}
      <Modal show={showInstallModal} onHide={() => setShowInstallModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Install Mod</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Select Mod Files</Form.Label>
              <div className="d-grid gap-2">
                <Button variant="outline-primary" onClick={handleSelectModFiles}>
                  Browse for Mod Files (.bnp, .zip, .7z, .rar)
                </Button>
              </div>
              {installFiles.length > 0 && (
                <div className="mt-2">
                  <strong>Selected Files:</strong>
                  <ul className="list-group mt-1">
                    {installFiles.map((file, index) => (
                      <li key={index} className="list-group-item">
                        {file.split('/').pop() || file.split('\\').pop()}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowInstallModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleInstallSelectedMods}
            disabled={installFiles.length === 0}
          >
            Install {installFiles.length > 0 ? `(${installFiles.length} files)` : ''}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default ModsTab;