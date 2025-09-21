'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { routeManager, environment } from '@ottokode/shared';
import { cn } from '@/lib/utils';

interface PlatformNavProps {
  className?: string;
}

export function PlatformNav({ className }: PlatformNavProps) {
  const pathname = usePathname();
  const config = environment.getConfig();
  const isDesktop = config.app.isDesktop;

  const navigationRoutes = routeManager.getNavigationRoutes(isDesktop);

  return (
    <nav className={cn('flex space-x-4', className)}>
      {navigationRoutes.map((route) => {
        const isActive = pathname === route.path;

        return (
          <Link
            key={route.name}
            href={route.path}
            className={cn(
              'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            {route.icon && (
              <span className="w-4 h-4">
                {/* Icon would be rendered here */}
                {route.icon}
              </span>
            )}
            <span>{route.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function SettingsNav({ className }: PlatformNavProps) {
  const pathname = usePathname();
  const config = environment.getConfig();
  const isDesktop = config.app.isDesktop;

  const settingsRoutes = routeManager.getSettingsRoutes(isDesktop);

  return (
    <nav className={cn('flex flex-col space-y-1', className)}>
      {settingsRoutes.map((route) => {
        const isActive = pathname === route.path;

        return (
          <Link
            key={route.name}
            href={route.path}
            className={cn(
              'flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <span>{route.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}