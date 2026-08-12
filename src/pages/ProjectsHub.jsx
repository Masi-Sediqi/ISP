import { useEffect, useState } from "react";
import { FileKey2, FolderKanban, ReceiptText } from "lucide-react";

import { useJsonCollection } from "../hooks/useJsonCollection";
import Projects from "./Projects";
import ProjectSales from "./ProjectSales";
import ProjectLicense from "./ProjectLicense";
import "./Projects.css";

const sections = [
  {
    key: "projects",
    title: "Projects",
    description: "Project forms and records",
    icon: FolderKanban,
  },
  {
    key: "sales",
    title: "Project Sales",
    description: "Sold projects and payments",
    icon: ReceiptText,
  },
  {
    key: "license",
    title: "Project License",
    description: "Project licenses and device keys",
    icon: FileKey2,
  },
];

function ProjectsHub({ initialSection = "projects" }) {
  const [activeSection, setActiveSection] = useState(initialSection);
  const [projects] = useJsonCollection("projects");
  const [sales] = useJsonCollection("projectSales");
  const [licenses] = useJsonCollection("projectLicenses");

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  const counts = {
    projects: projects.length,
    sales: sales.length,
    license: licenses.length,
  };

  return (
    <div className="projects-hub-page">
      <div className="projects-hub-heading">
        <div>
          <h1>Projects</h1>
          <p>Manage projects, sales, and licenses from one page.</p>
        </div>
      </div>

      <div className="project-section-cards" aria-label="Project sections">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.key;

          return (
            <button
              key={section.key}
              type="button"
              className={`project-section-card ${isActive ? "active" : ""}`}
              onClick={() => setActiveSection(section.key)}
              aria-pressed={isActive}
            >
              <span className="project-section-icon">
                <Icon size={19} />
              </span>

              <span className="project-section-copy">
                <strong>{section.title}</strong>
                <small>{section.description}</small>
              </span>

              <b>{counts[section.key] || 0}</b>
            </button>
          );
        })}
      </div>

      <div className="project-section-panel">
        {activeSection === "projects" && <Projects />}
        {activeSection === "sales" && <ProjectSales />}
        {activeSection === "license" && <ProjectLicense />}
      </div>
    </div>
  );
}

export default ProjectsHub;
