import { useNavigate } from "react-router-dom";
import ProjectFormModal from "@/components/ProjectFormModal";

export default function ProjectCreatePage() {
  const navigate = useNavigate();

  const handleClose = () => navigate("/projects");

  return (
    <ProjectFormModal
      isOpen={true}
      onClose={handleClose}
      onSuccess={(newProject) => {
        if (newProject) {
          navigate(`/projects/${newProject.id}`);
        } else {
          navigate("/projects");
        }
      }}
    />
  );
}
