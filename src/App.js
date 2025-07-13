// ... existing code ...
import { useState, useEffect } from 'react';

function App() {
  const [qr, setQr] = useState('');

  useEffect(() => {
    // Supondo que você tenha um websocket ou outro mecanismo para receber o QR
    socket.on('qr', (qrCode) => {
      setQr(qrCode);
    });
  }, []);

  return (
    <div>
      {qr && (
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?data=${qr}&size=300x300`}
          alt="QR Code"
        />
      )}
    </div>
  );
}
// ... existing code ...