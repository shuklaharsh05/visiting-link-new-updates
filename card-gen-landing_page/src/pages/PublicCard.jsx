import { useParams } from 'react-router-dom';

export default function PublicCard() {
  const { id } = useParams();
  const src = `https://teamserver.cloud/cards/${id}`;

  return (
    <div className="fixed inset-0 bg-white">
      <iframe
        title="Public Card"
        src={src}
        className="w-full h-full border-0"
        allow="web-share; clipboard-write"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-top-navigation-by-user-activation allow-popups-to-escape-sandbox"
      />
    </div>
  );
}

