import { useNavigate } from "react-router-dom";
import ClientFormModal from "@/components/ClientFormModal";

export default function ClientCreatePage() {
  const navigate = useNavigate();

  const handleClose = () => navigate("/clients");

  return (
    <ClientFormModal
      isOpen={true}
      onClose={handleClose}
      onSuccess={(newClient) => {
        if (newClient) {
          navigate(`/clients/${newClient.id}`);
        } else {
          navigate("/clients");
        }
      }}
    />
  );
}