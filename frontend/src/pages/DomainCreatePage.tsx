import { useNavigate } from "react-router-dom";
import DomainFormModal from "@/components/DomainFormModal";

export default function DomainCreatePage() {
  const navigate = useNavigate();

  const handleClose = () => navigate("/domains");

  return (
    <DomainFormModal
      isOpen={true}
      onClose={handleClose}
      onSuccess={(newDomain) => {
        if (newDomain) {
          navigate(`/domains/${newDomain.id}`);
        } else {
          navigate("/domains");
        }
      }}
    />
  );
}
