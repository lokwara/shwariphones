import {
  Favourites,
  Footer,
  Header,
  Orders,
  Profile,
  TradeIns,
} from "@/components"
import Financings from "@/components/financings"
import { useUser } from "@/context/User"
import { GET_USER } from "@/lib/request"
import { Tabs } from "@mantine/core"
import { useViewportSize } from "@mantine/hooks"
import { useSupabaseSession } from "@/lib/supabaseBrowser"
import { useRouter } from "next/router"
import { useState } from "react"
import { useMutation, useQuery } from "urql"
import tabClasses from "@/styles/Tabs.module.css"

function Account() {
  const { width } = useViewportSize()
  const router = useRouter()
  const { tradeIn, orders, financing } = router.query
  const { session } = useSupabaseSession()

  const { user, refreshApp } = useUser()

  const [activeTab, setActiveTab] = useState(
    tradeIn
      ? "trade-ins"
      : orders
      ? "orders"
      : financing
      ? "financing"
      : "profile"
  )

  return (
    <div className="bg-slate-100 w-full">
      <Header />

      <div className="p-8">
        <Tabs
          value={activeTab}
          orientation={width > 750 && "vertical"}
          onChange={setActiveTab}
          classNames={tabClasses}
        >
          <Tabs.List>
            <Tabs.Tab value="orders">Orders</Tabs.Tab>
            <Tabs.Tab value="financing">Financing</Tabs.Tab>
            <Tabs.Tab value="trade-ins">Trade-ins</Tabs.Tab>
            <Tabs.Tab value="profile">Profile</Tabs.Tab>
            {/* <Tabs.Tab value="favourites">Favourites</Tabs.Tab> */}
          </Tabs.List>

          <Tabs.Panel value="orders">
            <div className={width > 750 && "p-4"}>
              <Orders orders={user?.orders} refreshApp={refreshApp} />
            </div>
          </Tabs.Panel>
          <Tabs.Panel value="financing">
            <div className={width > 750 && "p-4"}>
              <Financings financialRequests={user?.financingRequests} />
            </div>
          </Tabs.Panel>
          <Tabs.Panel value="trade-ins">
            <div className={width > 750 && "p-4"}>
              <TradeIns tradeIns={user?.tradeIns} />
            </div>
          </Tabs.Panel>
          <Tabs.Panel value="profile">
            <div className={width > 750 && "p-4"}>
              <Profile user={user} />
            </div>
          </Tabs.Panel>
          <Tabs.Panel value="favourites">
            <Favourites />
          </Tabs.Panel>
        </Tabs>
      </div>

      <Footer />
    </div>
  )
}

export default Account
