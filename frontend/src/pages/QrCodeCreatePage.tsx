import { useNavigate } from "react-router-dom";
import QrCodeFormModal from "@/components/QrCodeFormModal";

export default function QrCodeCreatePage() {
  const navigate = useNavigate();

  const handleClose = () => navigate("/qr-codes");

  return (
    <QrCodeFormModal
      isOpen={true}
      onClose={handleClose}
      onSuccess={() => navigate("/qr-codes")}
    />
  );
}
