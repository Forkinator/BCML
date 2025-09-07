import { useState, useEffect } from "react";
import { Button, ButtonGroup, Card, Col, Row, Table, Modal, Form, Dropdown } from "react-bootstrap";
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

interface ModsTabProps {
  onError: (error: string) => void;
  onProgress: (title: string, status?: string) => void;
  onDone: () => void;
  onBackup: () => void;
  onProfile: () => void;
  onLaunch: () => void;
  onConfirm: (message: string, callback: () => void) => void;
}

function ModsTab({
  onError,
  onProgress,
  onDone,
  onBackup,
  onProfile,
  onLaunch,
  onConfirm
}: ModsTabProps) {
  const [mods, setMods] = useState<Mod[]>([]);
  const [selectedMods, setSelectedMods] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [installFiles, setInstallFiles] = useState<string[]>([]);
  const [showDisabled, setShowDisabled] = useState(true);
  const [sortReverse, setSortReverse] = useState(true);

  useEffect(() => {
    loadMods();
    
    // Add keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        switch (e.key) {
          case "i":
            e.preventDefault();
            setShowInstallModal(true);
            break;
          case "d":
            e.preventDefault();
            if (selectedMods.length > 0) handleDisableMods();
            break;
          case "e":
            e.preventDefault();
            if (selectedMods.length > 0) handleEnableMods();
            break;
          case "u":
            e.preventDefault();
            if (e.shiftKey) {
              uninstallAllMods();
            } else if (selectedMods.length > 0) {
              handleUninstallMods();
            }
            break;
          case "x":
            e.preventDefault();
            if (selectedMods.length > 0) exploreModFolders();
            break;
          case "p":
            e.preventDefault();
            if (selectedMods.length > 0) reprocessMods();
            break;
          case "m":
            e.preventDefault();
            remergeAll();
            break;
          case "l":
            e.preventDefault();
            onLaunch();
            break;
          case "h":
            e.preventDefault();
            setShowDisabled(!showDisabled);
            break;
          case "o":
            e.preventDefault();
            setSortReverse(!sortReverse);
            break;
          case "b":
            e.preventDefault();
            onBackup();
            break;
          case "f":
            e.preventDefault();
            onProfile();
            break;
          default:
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedMods, showDisabled, sortReverse]);

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
    try {
      onProgress("Installing Mod" + (installFiles.length > 1 ? "s" : ""));
      
      // TODO: Implement actual mod installation via Tauri command
      await invoke("install_mod", { 
        mods: installFiles, 
        options: {} 
      });
      
      setInstallFiles([]);
      setShowInstallModal(false);
      await loadMods();
      onDone();
    } catch (error) {
      onError(`Failed to install mods: ${error}`);
    }
  };

  // New functionality methods
  const exploreModFolders = async () => {
    try {
      for (const modPath of selectedMods) {
        await invoke("explore_mod", { mod_path: modPath });
      }
    } catch (error) {
      onError(`Failed to explore mod folders: ${error}`);
    }
  };

  const reprocessMods = async () => {
    try {
      onProgress("Reprocessing Mods");
      for (const modPath of selectedMods) {
        await invoke("reprocess_mod", { mod_path: modPath });
      }
      await loadMods();
      onDone();
    } catch (error) {
      onError(`Failed to reprocess mods: ${error}`);
    }
  };

  const remergeAll = async () => {
    try {
      onProgress("Remerging All Mods");
      await invoke("remerge_all");
      await loadMods();
      onDone();
    } catch (error) {
      onError(`Failed to remerge mods: ${error}`);
    }
  };

  const uninstallAllMods = () => {
    onConfirm(
      "Are you sure you want to uninstall ALL mods? This cannot be undone.",
      async () => {
        try {
          onProgress("Uninstalling All Mods");
          await invoke("uninstall_all_mods");
          await loadMods();
          setSelectedMods([]);
          onDone();
        } catch (error) {
          onError(`Failed to uninstall all mods: ${error}`);
        }
      }
    );
  };

  const exportMods = async () => {
    try {
      onProgress("Exporting Mods");
      await invoke("export_mods");
      onDone();
    } catch (error) {
      onError(`Failed to export mods: ${error}`);
    }
  };

  const handleSelectAll = () => {
    if (selectedMods.length === filteredMods.length) {
      setSelectedMods([]);
    } else {
      setSelectedMods(filteredMods.map(mod => mod.path));
    }
  };

  // Filter and sort mods
  const filteredMods = mods
    .filter(mod => showDisabled || mod.enabled)
    .sort((a, b) => {
      const compareValue = a.priority - b.priority;
      return sortReverse ? -compareValue : compareValue;
    });

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
            <Button variant="primary" onClick={handleInstallMod} title="Install Mod (Ctrl+I)">
              Install Mod
            </Button>
            <Button 
              variant="success" 
              onClick={handleEnableMods}
              disabled={selectedMods.length === 0}
              title="Enable Selected (Ctrl+E)"
            >
              Enable
            </Button>
            <Button 
              variant="warning" 
              onClick={handleDisableMods}
              disabled={selectedMods.length === 0}
              title="Disable Selected (Ctrl+D)"
            >
              Disable
            </Button>
            <Button 
              variant="danger" 
              onClick={handleUninstallMods}
              disabled={selectedMods.length === 0}
              title="Uninstall Selected (Ctrl+U)"
            >
              Uninstall
            </Button>
          </ButtonGroup>
          
          <ButtonGroup className="ms-2">
            <Button 
              variant="info" 
              onClick={exploreModFolders}
              disabled={selectedMods.length === 0}
              title="Explore Folders (Ctrl+X)"
            >
              Explore
            </Button>
            <Button 
              variant="secondary" 
              onClick={reprocessMods}
              disabled={selectedMods.length === 0}
              title="Reprocess (Ctrl+P)"
            >
              Reprocess
            </Button>
            <Button 
              variant="secondary" 
              onClick={remergeAll}
              title="Remerge All (Ctrl+M)"
            >
              Remerge
            </Button>
          </ButtonGroup>

          <Dropdown as={ButtonGroup} className="ms-2">
            <Button variant="outline-secondary" onClick={onLaunch} title="Launch Game (Ctrl+L)">
              Launch Game
            </Button>
            <Dropdown.Toggle split variant="outline-secondary" />
            <Dropdown.Menu>
              <Dropdown.Item onClick={onBackup} title="Backup (Ctrl+B)">
                🗂️ Backup & Restore
              </Dropdown.Item>
              <Dropdown.Item onClick={onProfile} title="Profiles (Ctrl+F)">
                📁 Profiles
              </Dropdown.Item>
              <Dropdown.Item onClick={exportMods}>
                📤 Export Mods
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item onClick={() => setShowDisabled(!showDisabled)} title="Toggle Show Disabled (Ctrl+H)">
                {showDisabled ? "🙈 Hide" : "👁️ Show"} Disabled Mods
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setSortReverse(!sortReverse)} title="Toggle Sort Order (Ctrl+O)">
                🔄 Sort {sortReverse ? "Ascending" : "Descending"}
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item onClick={uninstallAllMods} className="text-danger" title="Uninstall All (Ctrl+Shift+U)">
                ⚠️ Uninstall All Mods
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Col>
      </Row>

      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5>Installed Mods ({filteredMods.length}{mods.length !== filteredMods.length ? ` of ${mods.length}` : ''})</h5>
          <div>
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={handleSelectAll}
              title="Select All/None"
            >
              {selectedMods.length === filteredMods.length ? "Deselect All" : "Select All"}
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center">Loading mods...</div>
          ) : filteredMods.length === 0 ? (
            <div className="text-center text-muted">
              {mods.length === 0 
                ? "No mods installed. Click \"Install Mod\" to get started."
                : "No mods match the current filter. Toggle \"Show Disabled\" to see all mods."
              }
            </div>
          ) : (
            <Table striped hover>
              <thead>
                <tr>
                  <th style={{ width: "40px" }}>
                    <input
                      type="checkbox"
                      checked={selectedMods.length === filteredMods.length && filteredMods.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>Name</th>
                  <th>Version</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {filteredMods.map((mod, index) => (
                  <tr key={index} className={!mod.enabled ? "text-muted" : ""}>
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