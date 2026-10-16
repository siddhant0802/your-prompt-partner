import { createFileRoute } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import { PlaceholderPage } from "@/components/site/PlaceholderPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/login")({
  head: () => pageHead("Login / Register", "Student accounts are coming soon. You'll be able to sign in to view purchases and download files securely.", "/login", { noindex: true }),
  component: () => <PlaceholderPage icon={LogIn} title="Login / Register" description="Student accounts are coming soon. You'll be able to sign in to view purchases and download files securely." />,
});
