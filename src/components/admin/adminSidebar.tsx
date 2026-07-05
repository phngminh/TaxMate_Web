import {
  LayoutDashboard,
  Users,
  ChevronRight,
  Brain,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import path from '../../constants/path'
import logo from '../../assets/logo3.png'

interface MenuItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  path?: string
  children?: { label: string; path: string }[]
}

export default function ComprehensiveSidebar() {
  const location = useLocation()
  const [expandedMenus, setExpandedMenus] = useState<string[]>([
    'users',
    'legal',
  ])

  const toggleMenu = (id: string) => {
    setExpandedMenus((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id],
    )
  }

  const isActive = (menuPath: string) => location.pathname === menuPath
  const isParentActive = (paths: string[]) =>
    paths.some((menuPath) => location.pathname === menuPath)

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: path.ADMIN_DASHBOARD,
    },
    {
      id: 'users',
      label: 'Users & Businesses',
      icon: Users,
      children: [
        { label: 'User List', path: path.ADMIN_USERS_LIST },
        {
          label: 'Subscription Management',
          path: path.ADMIN_USERS_SUBSCRIPTIONS,
        },
      ],
    },
    {
      id: 'legal',
      label: 'AI Legal Assistant',
      icon: Brain,
      children: [
        { label: 'Legal Documents', path: path.ADMIN_LEGAL_DOCUMENTS },
      ],
    },
  ]

  return (
    <div className='w-64 bg-sidebar border-r border-sidebar-border h-full flex flex-col flex-shrink-0'>
      <div className='p-1 border-b border-sidebar-border flex-shrink-0'>
        <img src={logo} alt='TaxMate' className='h-35 w-auto pl-10' />
      </div>

      <nav className='flex-1 p-3 overflow-y-auto'>
        <ul className='space-y-1'>
          {menuItems.map((item) => {
            if (item.children) {
              const isExpanded = expandedMenus.includes(item.id)
              const hasActiveChild = isParentActive(
                item.children.map((c) => c.path),
              )

              return (
                <li key={item.id}>
                  <button
                    onClick={() => toggleMenu(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 text-base ${
                      hasActiveChild
                        ? 'bg-sidebar-accent text-primary'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    }`}
                  >
                    <div className='flex items-center gap-3'>
                      <item.icon className='w-4 h-4 flex-shrink-0' />
                      <span className='text-left'>{item.label}</span>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  </button>
                  {isExpanded && (
                    <ul className='mt-1 ml-3 space-y-0.5'>
                      {item.children.map((child) => (
                        <li key={child.path}>
                          <Link
                            to={child.path}
                            className={`block px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                              isActive(child.path)
                                ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium'
                                : 'text-gray-400 hover:bg-sidebar-accent hover:text-white'
                            }`}
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            }

            return (
              <li key={item.id}>
                <Link
                  to={item.path!}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-base ${
                    isActive(item.path!)
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
                >
                  <item.icon className='w-4 h-4' />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}