import {
  IconArrowRight,
  IconArrowLeft,
  IconHome,
  IconAdjustments,
  IconUser,
  IconDotsVertical,
  IconChevronRight,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";

function HoveredSubMenuItem({ icon, text, active }) {
  return (
    <div
      className={`my-2 rounded-md p-2 ${
        active ? "bg-gray-300" : " hover:bg-indigo-50"
      }`}>
      <div className="flex items-center justify-center">
        <span className="text-primary-500 h-6 w-6 ">{icon}</span>
        <span className="text-primary-500 ml-3 w-28 text-start">{text}</span>
        <div className="bg-primary-200 h-1" />
      </div>
    </div>
  );
}

function SidebarItem({
  icon,
  active = false,
  text,
  expanded = false,
  subMenu = null,
  setActive,
}) {
  const [expandSubMenu, setExpandSubMenu] = useState(false);

  useEffect(() => {
    if (!expanded) {
      setExpandSubMenu(false);
    }
  }, [expanded]);

  return (
    <button
      className={`
            group relative my-1 flex w-full cursor-pointer
            items-center rounded-md px-3
            py-2 font-medium transition-colors 
            ${
              active && !subMenu
                ? "text-primary-500 bg-gradient-to-tr from-indigo-200 to-indigo-100"
                : "text-gray-600 hover:bg-indigo-50"
            }
            ${!expanded && "hidden sm:flex"}
          `}
      onClick={() => setExpandSubMenu((curr) => expanded && !curr)}>
      <span className="h-6 w-6">{icon}</span>

      <span
        className={`overflow-hidden text-start transition-all ${
          expanded ? "ml-3 w-44" : "w-0"
        }`}>
        {text}
      </span>
    </button>
  );
}

function Sidebar({ children, expanded, setExpanded }) {
  return (
    <div className="relative">
      <div
        className={`fixed inset-0 -z-10 block bg-gray-400 ${
          expanded ? "block sm:hidden" : "hidden"
        }`}
      />
      <aside
        className={`box-border h-screen transition-all ${
          expanded ? "w-5/6 sm:w-64" : "w-0 sm:w-20"
        }`}>
        <nav className="flex h-full flex-col border-r bg-white shadow-sm">
          <div className="flex items-center justify-between p-4 pb-2">
            <img
              src="https://img.logoipsum.com/243.svg"
              className={`overflow-hidden transition-all ${
                expanded ? "w-32" : "w-0"
              }`}
              alt=""
            />
            <div className={`${expanded ? "" : "hidden sm:block"}`}>
              <button
                onClick={() => setExpanded((curr) => !curr)}
                className="rounded-lg bg-gray-50 p-1.5 hover:bg-gray-100">
                {expanded ? (
                  <IconArrowRight className="h-6 w-6" />
                ) : (
                  <IconArrowLeft className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
          <ul className="flex-1 px-3">{children}</ul>
          <div className="flex border-t p-3">
            <img
              src="https://ui-avatars.com/api/?background=c7d2fe&color=3730a3&bold=true&name=Mark+Ruffalo"
              alt=""
              className="h-10 w-10 rounded-md"
            />
            <div
              className={`flex items-center justify-between overflow-hidden transition-all ${
                expanded ? "ml-3 w-52" : "w-0"
              }`}>
              <div className="leading-4">
                <h4 className="font-semibold">Mark Ruffalo</h4>
                <span className="text-xs text-gray-600">mark@gmail.com</span>
              </div>
              <IconDotsVertical className="h-6 w-6" />
            </div>
          </div>
        </nav>
      </aside>
    </div>
  );
}

export default function MakeSidebar() {
  const [expanded, setExpanded] = useState(true);
  const navBarItems = [
    {
      icon: <IconHome />,
      text: "Inventory & Repairs",
      active: true,
    },
    {
      icon: <IconAdjustments />,
      text: "Trade Ins",
    },
    {
      icon: <IconUser />,
      text: "Financing",
    },
    {
      icon: <IconAdjustments />,
      text: "Offers & Carousels",
    },
    {
      icon: <IconUser />,
      text: "Sales & Orders",
    },
    {
      icon: <IconAdjustments />,
      text: "Users & Access",
    },
  ];

  return (
    <Sidebar expanded={expanded} setExpanded={setExpanded}>
      {navBarItems.map((item, index) => (
        <SidebarItem key={index} expanded={expanded} {...item} />
      ))}
    </Sidebar>
  );
}
