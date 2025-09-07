import { useState } from "react";
import { Button, Card, Form } from "react-bootstrap";
import { invoke } from "@tauri-apps/api/core";

function DevToolsTab() {
  const [gameDir, setGameDir] = useState("");
  const [outputDir, setOutputDir] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

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
    // TODO: Implement backup creation
    setResult("Backup creation not yet implemented");
  };

  const handleValidateFiles = async () => {
    // TODO: Implement file validation
    setResult("File validation not yet implemented");
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
                <Button variant="outline-secondary">
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
                <Button variant="outline-secondary">
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