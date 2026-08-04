import { useNavigate } from "react-router-dom";
import UrlFormModal from "@/components/UrlFormModal";

export default function UrlCreatePage() {
  const navigate = useNavigate();

  const handleClose = () => navigate("/urls");

  return (
    <UrlFormModal
      isOpen={true}
      onClose={handleClose}
      onSuccess={() => navigate("/urls")}
    />
  );
}
