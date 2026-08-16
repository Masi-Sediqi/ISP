import { useEffect, useState } from "react";
import { FolderKanban, ReceiptText, ScrollText } from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import Projects from "./Projects";
import ProjectSales from "./ProjectSales";
import ProjectSalesBills from "./ProjectSalesBills";
import "./Projects.css";
const sections = [
  { key: "projects", title: "Projects", description: "Project forms and records", icon: FolderKanban },
  { key: "sales", title: "Project Sales", description: "Create a new project sale", icon: ReceiptText },
  { key: "bills", title: "Sales / Bills", description: "All project sales and printable bills", icon: ScrollText },
];
function ProjectsHub({ initialSection = "projects" }) {
  const safeInitial = initialSection === "license" ? "projects" : initialSection;
  const [activeSection, setActiveSection] = useState(safeInitial); const [projects] = useJsonCollection("projects"); const [sales] = useJsonCollection("projectSales");
  useEffect(() => setActiveSection(initialSection === "license" ? "projects" : initialSection), [initialSection]);
  useEffect(() => {
    function handleSectionChange(event) {
      if (event.detail?.section) {
        setActiveSection(event.detail.section);
      }
    }

    window.addEventListener("isp-project-section-change", handleSectionChange);
    return () => window.removeEventListener("isp-project-section-change", handleSectionChange);
  }, []);
  const counts = { projects: projects.length, sales: 0, bills: sales.length };
  return <div className="projects-hub-page"><div className="projects-hub-heading"><div><h1>Projects</h1><p>Manage projects, create sales and review printable bills from one page.</p></div></div><div className="project-section-cards" aria-label="Project sections">{sections.map((s)=>{const Icon=s.icon,isActive=activeSection===s.key; return <button key={s.key} type="button" className={`project-section-card ${isActive?"active":""}`} onClick={()=>setActiveSection(s.key)} aria-pressed={isActive}><span className="project-section-icon"><Icon size={19}/></span><span className="project-section-copy"><strong>{s.title}</strong><small>{s.description}</small></span><b>{counts[s.key]||0}</b></button>})}</div><div className="project-section-panel">{activeSection==="projects"&&<Projects/>}{activeSection==="sales"&&<ProjectSales/>}{activeSection==="bills"&&<ProjectSalesBills/>}</div></div>;
}
export default ProjectsHub;
