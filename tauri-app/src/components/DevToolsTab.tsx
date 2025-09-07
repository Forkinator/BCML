import { useState } from "react";
import { Button, Card, Form } from "react-bootstrap";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

function DevToolsTab() {
  const [gameDir, setGameDir] = useState("");
  const [outputDir, setOutputDir] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSelectDirectory = async (setter: (dir: string) => void) => {
    try {
      const selected = await open({
        directory: true,
      });
      
      if (selected && typeof selected === 'string') {
        setter(selected);
      }
    } catch (error) {
      console.error("Error selecting directory:", error);
    }
  };

  const handleFindModifiedFiles = async () => {
    if (!gameDir) {
      setResult("Please select a game directory first");
      return;
    }

    setProcessing(true);
    setResult(null);
    
    try {
      const files = await invoke("find_modified_files", { mod_dir: gameDir }) as string[];
      setResult(`Found ${files.length} modified files:\n${files.slice(0, 5).join('\n')}${files.length > 5 ? '\n...' : ''}`);
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!gameDir) {
      setResult("Please select a game directory first");
      return;
    }

    setProcessing(true);
    setResult(null);
    
    try {
      // For now, provide a placeholder implementation
      // This would normally create a backup of the game files
      setResult(`Backup functionality not yet implemented.\nWould backup: ${gameDir}\nTo: ${outputDir || 'Default backup location'}`);
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleValidateFiles = async () => {
    if (!gameDir) {
      setResult("Please select a game directory first");
      return;
    }

    setProcessing(true);
    setResult(null);
    
    try {
      // Use the find_modified_files command to validate/scan files
      const files = await invoke("find_modified_files", { mod_dir: gameDir }) as string[];
      
      if (files.length === 0) {
        setResult("No modified files found. All files appear to be valid stock game files.");
      } else {
        setResult(`Validation complete. Found ${files.length} potentially modified files:\n${files.slice(0, 10).join('\n')}${files.length > 10 ? '\n... and more' : ''}`);
      }
    } catch (error) {
      setResult(`Validation error: ${error}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      <Card className="mb-3">
        <Card.Header>
          <h5>Development Tools</h5>
        </Card.Header>
        <Card.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Game Directory</Form.Label>
              <div className="input-group">
                <Form.Control
                  type="text"
                  value={gameDir}
                  onChange={(e) => setGameDir(e.target.value)}
                  placeholder="Select game directory..."
                />
                <Button 
                  variant="outline-secondary"
                  onClick={() => handleSelectDirectory(setGameDir)}
                >
                  Browse
                </Button>
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Output Directory</Form.Label>
              <div className="input-group">
                <Form.Control
                  type="text"
                  value={outputDir}
                  onChange={(e) => setOutputDir(e.target.value)}
                  placeholder="Select output directory..."
                />
                <Button 
                  variant="outline-secondary"
                  onClick={() => handleSelectDirectory(setOutputDir)}
                >
                  Browse
                </Button>
              </div>
            </Form.Group>

            <div className="d-grid gap-2">
              <Button 
                variant="primary" 
                onClick={handleFindModifiedFiles}
                disabled={processing}
              >
                {processing ? "Processing..." : "Find Modified Files"}
              </Button>
              
              <Button 
                variant="secondary" 
                onClick={handleCreateBackup}
                disabled={processing}
              >
                Create Backup
              </Button>
              
              <Button 
                variant="info" 
                onClick={handleValidateFiles}
                disabled={processing}
              >
                Validate Files
              </Button>
            </div>

            {result && (
              <div className="mt-3">
                <div className={`alert ${result.startsWith('Error') ? 'alert-danger' : 'alert-success'}`}>
                  <pre style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>{result}</pre>
                </div>
              </div>
            )}
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}

export default DevToolsTab;