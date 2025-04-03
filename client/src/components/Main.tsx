import { TonConnectButton, useTonConnectUI } from "@tonconnect/ui-react";
import WebApp from "@twa-dev/sdk";
import { useEffect } from "react";

import './Main.css';

export function Main() {
  const [tonConnectUi] = useTonConnectUI();

  useEffect(() => {
    tonConnectUi.onStatusChange(async (wallet) => {
      if (wallet) {
        WebApp.sendData(JSON.stringify({ connectedWallet: wallet.account.address }));
        tonConnectUi.disconnect();
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="main">
      <div className="container">
        <div className="container-header">
          <img src="https://www.meme-arsenal.com/memes/117e089aa893130afde13d89cdfb7d1b.jpg" alt="logo" />
          <h2>Connect Wallet to verify</h2>
          <p>To join <strong>$SIGMABOY</strong> token's whale-holders chat, you need to pass a verification</p>
        </div>
        <div className="button-container">
          <TonConnectButton />
        </div>
      </div>
      <footer>
        <div className="footer__links">
          <a href="https://t.me/deniel85">Telegram</a>
          <a href="https://t.me/deniel85">Twitter</a>
          <a href="https://t.me/deniel85">DEX Screener</a>
        </div>
      </footer>
    </main>
  );
}