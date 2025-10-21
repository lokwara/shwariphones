import { Head, Html, Main, NextScript } from "next/document";
import { ColorSchemeScript } from "@mantine/core";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta
          name="google-site-verification"
          content="XWLSb2rrZqcaWtlwPLLTDPiB-Yu22Zw6QzFOWwIDWzk"
        />
        <meta
          name="keywords"
          content="Shwari Phones, Shwari Phones website, buy smartphones Africa, phone trade-in Africa, Lipa Pole Pole phones"
        />

        <ColorSchemeScript defaultColorScheme="auto" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
