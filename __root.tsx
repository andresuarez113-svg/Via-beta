import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { Toaster } from "sonner";
import { PwaRegister } from "@/components/pwa-register";
import appCss from "../styles.css?url";

const APP_NAME = "Vía";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "description", content: "Crea, entrena y prueba tus propios bots con Vía." },
      { name: "theme-color", content: "#2A4A3C" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Outfit:wght@400;500;600&display=swap",
      },
    ],
  }),
  component: () => (
    <html lang="es" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PwaRegister />
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
          <Toaster
            position="bottom-center"
            toastOptions={{
              className:
                "!bg-surface !text-ink !border-0 !shadow-[var(--shadow-border)] !font-[Outfit,sans-serif]",
            }}
          />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
