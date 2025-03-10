import "@/styles/globals.css";
import "@/styles/tailwind.css";
import type { AppProps } from "next/app";
import { Web3Provider } from "@/providers/Web3Provider";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Web3Provider>
      <Component {...pageProps} />
    </Web3Provider>
  );
}
