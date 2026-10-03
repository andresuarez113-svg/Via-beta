import { createFileRoute } from "@tanstack/react-router";
import { Home as HomeScreen } from "@/components/home";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <HomeScreen />;
}
