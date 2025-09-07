import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Container, Navbar, Tab, Tabs } from "react-bootstrap";
import ModsTab from "./components/ModsTab";
import SettingsTab from "./components/SettingsTab";
import DevToolsTab from "./components/DevToolsTab";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

const TABS = ["mods", "dev-tools", "settings"];

function App() {
  const [activeTab, setActiveTab] = useState("mods");
  const [version, setVersion] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get version from Rust backend
    invoke("get_version")
      .then((ver) => setVersion(ver as string))
      .catch((err) => setError(`Failed to get version: ${err}`));

    // Perform sanity check
    invoke("sanity_check")
      .then((result) => {
        if (!(result as boolean)) {
          setError("Sanity check failed");
        }
      })
      .catch((err) => setError(`Sanity check failed: ${err}`));
  }, []);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === "Tab") {
      e.preventDefault();
      const currentIndex = TABS.indexOf(activeTab);
      const nextIndex = (currentIndex + 1) % TABS.length;
      setActiveTab(TABS[nextIndex]);
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeTab]);

  if (error) {
    return (
      <Container className="mt-3">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error</h4>
          <p>{error}</p>
        </div>
      </Container>
    );
  }

  return (
    <div className="app">
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand>
            BCML {version && `v${version}`}
          </Navbar.Brand>
          <Navbar.Text>
            BOTW Cross-Platform Mod Loader
          </Navbar.Text>
        </Container>
      </Navbar>

      <Container fluid className="mt-3">
        <Tabs
          activeKey={activeTab}
          onSelect={(tab) => setActiveTab(tab || "mods")}
          className="mb-3"
        >
          <Tab eventKey="mods" title="Mods">
            <ModsTab />
          </Tab>
          <Tab eventKey="dev-tools" title="Dev Tools">
            <DevToolsTab />
          </Tab>
          <Tab eventKey="settings" title="Settings">
            <SettingsTab />
          </Tab>
        </Tabs>
      </Container>
    </div>
  );
}

export default App;
