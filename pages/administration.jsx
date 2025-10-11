import Blogs from "@/components/admin/blogs"
import Devices from "@/components/admin/inventory/Devices"
import Repairs from "@/components/admin/inventory/Repairs"
import Variants from "@/components/admin/inventory/Variants"
import OffersCarousels from "@/components/admin/offers&carousels"
import Carousels from "@/components/admin/offers&carousels/Carousels"
import Offers from "@/components/admin/offers&carousels/Offers"
import Reviews from "@/components/admin/reviews"
import Orders from "@/components/admin/sales&orders/Orders"
import Requests from "@/components/admin/sales&orders/requests"
import SalesAndAnalytics from "@/components/admin/sales&orders/SalesAndAnalytics"
import SalesOrders from "@/components/admin/sales&orders/SalesAndAnalytics"
import TechTips from "@/components/admin/techtips"
import TradeIns from "@/components/admin/tradeins"
import UsersAccess from "@/components/admin/users&access"
import { useUser } from "@/context/User"
import { Avatar } from "@mantine/core"

import { supabaseBrowser } from "@/lib/supabaseBrowser"
import { useRouter } from "next/router"
import React, { useState } from "react"

function Sidebar({ setActive, active }) {
  const { user } = useUser()

  const menuItems = [
    { title: "Variants", label: "variants" },
    { title: "Inventory", label: "inventory" },
    { title: "Repairs", label: "repairs" },
    { title: "Website orders", label: "weborders" },
    { title: "Trade Ins Requests", label: "tradeIns" },
    { title: "Financing Requests", label: "financing" },
    { title: "Sales", label: "sales" },
    { title: "Offers", label: "offers" },
    { title: "Carousels", label: "carousels" },
    { title: "Reviews", label: "reviews" },
    { title: "Blogs", label: "blogs" },
    { title: "Tech Tips", label: "techtips" },
    user?.adminRights?.includes("ADMIN_MANAGEMENT")
      ? { title: "Users & Access", label: "users&access" }
      : null,
  ].filter(Boolean)

  return (
    <div className="bg-white border-r w-64 shadow-sm relative h-screen">
      <div className="p-4">
        <img src="/logo.webp" className=" h-[48px]" />
      </div>

      <ul className="mt-2 p-4">
        {menuItems.map((item, i) => (
          <SidebarMenu
            label={item?.label}
            key={i}
            active={active}
            title={item.title}
            setActive={setActive}
          />
        ))}
      </ul>

      <div className=" fixed bottom-0 p-4">
        <div className="flex items-center space-x-3">
          <Avatar size={32} color="indigo">
            {user?.name?.split(" ").map((_name) => _name?.charAt(0))}
          </Avatar>
          <div>
            <p className="text-[0.9rem]">{user?.name}</p>
            <p className="text-[0.6rem] text-slate-500">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function SidebarMenu({ title, label, setActive, active }) {
  return (
    <li className="my-2">
      <button
        onClick={() => setActive(label)}
        className={`flex w-full text-[0.9rem] items-center justify-between rounded-md px-2 py-1 text-gray-800 hover:bg-indigo-50 ${
          active == label && "bg-indigo-200"
        }`}
      >
        <span>{title}</span>
      </button>
    </li>
  )
}

export default function Administration() {
  const [active, setActive] = useState("variants")
  const { user } = useUser()
  const router = useRouter()

  if (user && !user?.isAdmin) router.push("/")

  if (!user) return <p>...</p>

  if (user && user?.isAdmin)
    return (
      <div className="flex">
        <Sidebar setActive={setActive} active={active} />

        {active == "variants" && <Variants />}

        {active == "inventory" && <Devices />}
        {active == "repairs" && <Repairs />}
        {active == "weborders" && <Orders />}
        {active == "tradeIns" && <TradeIns />}
        {active == "financing" && <Requests />}
        {active == "sales" && <SalesAndAnalytics />}
        {active == "offers" && <Offers />}
        {active == "carousels" && <Carousels />}
        {active == "reviews" && <Reviews />}
        {active == "techtips" && <TechTips />}
        {active == "blogs" && <Blogs />}
        {active == "users&access" && <UsersAccess />}
      </div>
    )
}
