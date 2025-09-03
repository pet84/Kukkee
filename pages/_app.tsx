// pages/_app.tsx
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";

// Global styles
import "../src/styles/global.scss";

// Day.js nastavení
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import "dayjs/locale/cs";

// rozšíření a nastavení locale jen jednou globálně
dayjs.extend(localizedFormat);
dayjs.locale("cs");

const App = ({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps): JSX.Element => {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
};

export default App;
