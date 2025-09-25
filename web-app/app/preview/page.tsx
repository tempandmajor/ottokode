import { DesktopAppPreview } from '@/components/marketing/desktop-app-preview';

export default function PreviewPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 p-8 flex items-center justify-center">
      <DesktopAppPreview />
    </div>
  );
}