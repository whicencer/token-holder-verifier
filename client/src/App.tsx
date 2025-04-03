import { useTonConnectUI } from "@tonconnect/ui-react"
import { useEffect } from "react";
import { Main } from "./components/Main";

function App() {
  const [tonConnectUi] = useTonConnectUI();

  useEffect(() => {
    tonConnectUi.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <Main />
    </div>
  );
}

export default App;
