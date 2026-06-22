"use client";
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import {
  BoxCubeIcon,
  CalenderIcon,
  ChevronDownIcon,
  DollarLineIcon,
  FolderIcon,
  GridIcon,
  GroupIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
} from "../icons/index";

import { APP_LOGO_SRC } from "@/lib/brand-logo";
import { useExpenseAccess } from "@/lib/expenses/use-expense-access";
import { useGeneralAccess } from "@/lib/general/use-general-access";
import { useInvoiceAccess } from "@/lib/invoices/use-invoice-access";
import { usePaymentAccess } from "@/lib/payments/use-payment-access";
import { isAdminUser } from "@/lib/is-admin";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const baseNavItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/dashboard",
  },
  {
    icon: <GroupIcon />,
    name: "Customers",
    path: "/setup/customers",
  },
  {
    icon: <DollarLineIcon />,
    name: "Invoices",
    path: "/invoices",
  },
  {
    icon: <TableIcon />,
    name: "Payments",
    path: "/payments",
  },
  {
    icon: <PieChartIcon />,
    name: "Expenses",
    path: "/expenses",
  },
  {
    icon: <ListIcon />,
    name: "Mail",
    path: "/mail",
  },
  // {
  //   icon: <CalenderIcon />,
  //   name: "Calendar",
  //   path: "/calendar",
  // },
  {
    icon: <UserCircleIcon />,
    name: "User Profile",
    path: "/profile",
  },
  {
    icon: <BoxCubeIcon />,
    name: "Company Profile",
    path: "/company",
  },
  {
    icon: <FolderIcon />,
    name: "Company Files",
    path: "/company/files",
  },

  // {
  //   name: "Forms",
  //   icon: <ListIcon />,
  //   subItems: [{ name: "Form Elements", path: "/form-elements", pro: false }],
  // },
  // {
  //   name: "Tables",
  //   icon: <TableIcon />,
  //   subItems: [{ name: "Basic Tables", path: "/basic-tables", pro: false }],
  // },
  // {
  //   name: "Pages",
  //   icon: <PageIcon />,
  //   subItems: [
  //     { name: "Blank Page", path: "/blank", pro: false },
  //     { name: "404 Error", path: "/error-404", pro: false },
  //   ],
  // },
];

function buildOthersItems(options: {
  showOfficePermissions: boolean;
  showSetupMenu: boolean;
  showSetupConfig: boolean;
}): NavItem[] {
  if (!options.showSetupMenu) {
    return options.showOfficePermissions
      ? [
          {
            icon: <PlugInIcon />,
            name: "Setup",
            subItems: [
              {
                name: "Office permissions",
                path: "/setup/payment-permissions",
              },
            ],
          },
        ]
      : [];
  }
  const setupSubItems = [
    { name: "Service categories", path: "/setup/service-categories" },
    { name: "All catalogs", path: "/setup/service-catalogs" },
    { name: "Engagements", path: "/setup/engagements" },
  ];
  if (options.showSetupConfig) {
    setupSubItems.push(
      { name: "Payment categories", path: "/setup/payment-categories" },
      { name: "Payment methods", path: "/setup/payment-methods" },
      { name: "Partial payment reminders", path: "/setup/payment-partial-reminders" },
      { name: "Expense types", path: "/setup/expense-types" },
      { name: "Expense reminders", path: "/setup/expense-reminders" }
    );
  }
  if (options.showOfficePermissions) {
    setupSubItems.push({
      name: "Office permissions",
      path: "/setup/payment-permissions",
    });
  }
  return [
    {
      icon: <PlugInIcon />,
      name: "Setup",
      subItems: setupSubItems,
    },
  ];
}

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const { access: paymentAccess, loading: paymentAccessLoading } =
    usePaymentAccess();
  const { access: expenseAccess, loading: expenseAccessLoading } =
    useExpenseAccess();
  const { access: invoiceAccess, loading: invoiceAccessLoading } =
    useInvoiceAccess();
  const { access: generalAccess, loading: generalAccessLoading } =
    useGeneralAccess();
  const accessLoading =
    paymentAccessLoading ||
    expenseAccessLoading ||
    invoiceAccessLoading ||
    generalAccessLoading;
  const showDashboard =
    isAdminUser() || (!accessLoading && Boolean(generalAccess?.visibleDashboard));
  const showCustomers =
    isAdminUser() || (!accessLoading && Boolean(generalAccess?.visibleCustomers));
  const showMail =
    isAdminUser() || (!accessLoading && Boolean(generalAccess?.visibleMail));
  const showCompanyProfile =
    isAdminUser() ||
    (!accessLoading && Boolean(generalAccess?.visibleCompanyProfile));
  const showCompanyFiles =
    isAdminUser() ||
    (!accessLoading && Boolean(generalAccess?.visibleCompanyFiles));
  const showSetupMenu =
    isAdminUser() ||
    (!accessLoading &&
      Boolean(
        generalAccess?.visibleSetup ||
          paymentAccess?.canManagePermissions ||
          expenseAccess?.canManagePermissions ||
          invoiceAccess?.canManagePermissions ||
          generalAccess?.canManageGeneralPermissions
      ));
  const showSetupConfig =
    isAdminUser() || (!accessLoading && Boolean(generalAccess?.canManageSetup));
  const showPayments =
    isAdminUser() || (!accessLoading && Boolean(paymentAccess?.visible));
  const showExpenses =
    isAdminUser() || (!accessLoading && Boolean(expenseAccess?.visible));
  const showInvoices =
    isAdminUser() || (!accessLoading && Boolean(invoiceAccess?.visible));
  const showOfficePermissions =
    isAdminUser() ||
    (!accessLoading &&
      Boolean(
        paymentAccess?.canManagePermissions ||
          expenseAccess?.canManagePermissions ||
          invoiceAccess?.canManagePermissions ||
          generalAccess?.canManageGeneralPermissions
      ));
  const navItems = useMemo(
    () =>
      baseNavItems.filter((item) => {
        if (item.path === "/dashboard") return showDashboard;
        if (item.path === "/setup/customers") return showCustomers;
        if (item.path === "/payments") return showPayments;
        if (item.path === "/expenses") return showExpenses;
        if (item.path === "/invoices") return showInvoices;
        if (item.path === "/mail") return showMail;
        if (item.path === "/company") return showCompanyProfile;
        if (item.path === "/company/files") return showCompanyFiles;
        return true;
      }),
    [
      showDashboard,
      showCustomers,
      showPayments,
      showExpenses,
      showInvoices,
      showMail,
      showCompanyProfile,
      showCompanyFiles,
    ]
  );
  const othersItems = useMemo(
    () =>
      buildOthersItems({
        showOfficePermissions,
        showSetupMenu,
        showSetupConfig,
      }),
    [showOfficePermissions, showSetupMenu, showSetupConfig]
  );

  const sidebarLabelsVisible = isExpanded || isHovered || isMobileOpen;

  const allNavPaths = useMemo(() => {
    const paths: string[] = [];
    for (const item of [...navItems, ...othersItems]) {
      if (item.path) paths.push(item.path);
      item.subItems?.forEach((sub) => paths.push(sub.path));
    }
    return paths.sort((a, b) => b.length - a.length);
  }, [navItems, othersItems]);

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const prevPathnameRef = useRef(pathname);

  const isActive = useCallback(
    (path: string) => {
      const bestMatch = allNavPaths.find(
        (candidate) =>
          pathname === candidate || pathname.startsWith(`${candidate}/`)
      );
      return bestMatch === path;
    },
    [pathname, allNavPaths]
  );

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    if (!sidebarLabelsVisible) return;
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  // Close Setup submenu when sidebar collapses to icon-only mode
  useEffect(() => {
    if (!sidebarLabelsVisible) {
      setOpenSubmenu(null);
    }
  }, [sidebarLabelsVisible]);

  useEffect(() => {
    if (!sidebarLabelsVisible) return;

    let match: { type: "main" | "others"; index: number } | null = null;
    (["main", "others"] as const).forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (!nav.subItems) return;
        for (const subItem of nav.subItems) {
          if (isActive(subItem.path)) {
            match = { type: menuType, index };
          }
        }
      });
    });

    if (match) {
      setOpenSubmenu((prev) =>
        prev?.type === match!.type && prev?.index === match!.index ? prev : match
      );
    } else {
      const prev = prevPathnameRef.current;
      if (prev.startsWith("/setup/") && !pathname.startsWith("/setup/")) {
        setOpenSubmenu((open) => (open?.type === "others" ? null : open));
      }
    }
    prevPathnameRef.current = pathname;
  }, [pathname, isActive, navItems, othersItems, sidebarLabelsVisible]);

  useEffect(() => {
    if (openSubmenu === null || !sidebarLabelsVisible) return;
    const key = `${openSubmenu.type}-${openSubmenu.index}`;
    const measure = () => {
      const el = subMenuRefs.current[key];
      if (!el) return;
      const next = el.scrollHeight;
      setSubMenuHeight((prev) =>
        prev[key] === next ? prev : { ...prev, [key]: next }
      );
    };
    measure();
    const id = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(id);
  }, [openSubmenu, sidebarLabelsVisible]);

  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "main" | "others"
  ) => (
    <ul className="flex flex-col gap-4">
      {navItems.map((nav, index) => (
        <li key={nav.name} className={nav.subItems ? "relative z-[1]" : undefined}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group  ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !sidebarLabelsVisible
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={` ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(sidebarLabelsVisible) && (
                <span className={`menu-item-text`}>{nav.name}</span>
              )}
              {sidebarLabelsVisible && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-white"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(sidebarLabelsVisible) && (
                  <span className={`menu-item-text`}>{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && sidebarLabelsVisible && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`] ?? 0}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge `}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge `}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`app-sidebar fixed mt-16 flex flex-col overflow-x-hidden lg:mt-0 top-0 px-5 left-0 bg-gradient-to-b from-zinc-700 via-zinc-900 to-black text-white shadow-[6px_0_32px_-10px_rgba(0,0,0,0.55)] h-screen transition-all duration-300 ease-in-out z-50 border-0 border-r border-white/[0.08]
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex justify-center py-8">
        <Link
          href="/dashboard"
          className="flex w-full justify-center"
        >
          {sidebarLabelsVisible ? (
            <img
              src={APP_LOGO_SRC}
              alt="Company logo"
              className="h-11 w-auto max-w-[200px] object-contain"
              width={200}
              height={44}
              decoding="async"
            />
          ) : (
            <img
              src={APP_LOGO_SRC}
              alt="Company logo"
              className="h-10 w-10 rounded-lg object-contain"
              width={40}
              height={40}
              decoding="async"
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] tracking-wide text-white/45 ${
                  !sidebarLabelsVisible
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {sidebarLabelsVisible ? (
                  "Menu"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>

            <div className="">
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] tracking-wide text-white/45 ${
                  !sidebarLabelsVisible
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {sidebarLabelsVisible ? (
                  "Others"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
