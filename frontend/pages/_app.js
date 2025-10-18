import "@/styles/globals.css"
import "@mantine/core/styles.css"
import "@mantine/carousel/styles.css"
import "@mantine/nprogress/styles.css"
import "@mantine/spotlight/styles.css"
import "@mantine/charts/styles.css"
import "@mantine/dates/styles.css"
import "react-responsive-carousel/lib/styles/carousel.min.css"
import "@mantine/notifications/styles.css"
import "instantsearch.css/themes/satellite.css"
import "ag-grid-community/styles/ag-grid.css" // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css"
import "leaflet/dist/leaflet.css"

import "react-toastify/dist/ReactToastify.css"

import { createTheme, MantineProvider } from "@mantine/core"
import { NavigationProgress } from "@mantine/nprogress"

import { InstantSearch } from "react-instantsearch"
import algoliasearch from "algoliasearch/lite"

import { withUrqlClient } from "next-urql"
import { Notifications } from "@mantine/notifications"
import RouteLoader from "@/components/RouterLoader"
import { useContext, useEffect } from "react"
import { debugExchange, cacheExchange, fetchExchange } from "urql"

import UserProvider from "@/context/User"
import AutoRefreshUser from "@/components/AutoRefreshUser"
import Script from "next/script"

const theme = createTheme({
  fontFamily: "EudoxusSans",
  primaryColor: "shwari",
  colors: {
    shwari: [
      "#eff2fb",
      "#dce0ef",
      "#b4bee2",
      "#8a9ad5",
      "#677cca",
      "#5268c4",
      "#172554",
      "#384fab",
      "#30469a",
      "#253c88",
    ],
  },
})

export const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
  process.env.NEXT_PUBLIC_ALGOLIA_API_KEY
)

function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-B2WZ8TFNP2"
        strategy="afterInteractive"
      />

      {/* Initialize gtag */}
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'B2WZ8TFNP2');
        `}
      </Script>

      <InstantSearch
        searchClient={searchClient}
        indexName={process.env.NEXT_PUBLIC_ALGOLIA_INDEX}
      >
        <MantineProvider theme={theme}>
          <Notifications />
          <NavigationProgress color="red" initialProgress={20} />
          <main>
            <UserProvider>
              <AutoRefreshUser />
              <RouteLoader />
              <Component {...pageProps} />
            </UserProvider>
          </main>
        </MantineProvider>
      </InstantSearch>
    </>
  )
}

export default withUrqlClient(
  () => ({
    url: "/api/proxy",
    exchanges: [cacheExchange, fetchExchange, debugExchange],
    fetchOptions: () => ({
      credentials: "include",
    }),
  }),
  { ssr: false }
)(App)
