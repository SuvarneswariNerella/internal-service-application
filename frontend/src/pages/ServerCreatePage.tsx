import { useNavigate } from "react-router-dom";
import ServerFormModal from "@/components/ServerFormModal";

export default function ServerCreatePage() {
  const navigate = useNavigate();

  const handleClose = () => navigate("/servers");

  return (
    <ServerFormModal
      isOpen={true}
      onClose={handleClose}
      onSuccess={(newServer) => {
        if (newServer) {
          navigate(`/servers/${newServer.id}`);
        } else {
          navigate("/servers");
        }
      }}
    />
  );
}
