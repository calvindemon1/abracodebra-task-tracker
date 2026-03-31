import { createSignal, createEffect } from "solid-js";
import QRCode from "qrcode";

export default function QRComponent(props) {
  const [qrUrl, setQrUrl] = createSignal("");

  createEffect(() => {
    if (props.urlQr) {
      QRCode.toDataURL(props.urlQr)
        .then((url) => setQrUrl(url))
        .catch((err) => console.error("QR Encode Error:", err));
    }
  });

  return (
    <div class="flex justify-center items-center">
      {qrUrl() ? (
        <img
          src={qrUrl()}
          alt="QR Code"
          class="w-[250px] h-[250px] object-contain rounded-2xl"
        />
      ) : (
        <p class="w-full">Loading QR...</p>
      )}
    </div>
  );
}
