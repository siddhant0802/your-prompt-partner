import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminError } from "@/components/admin/AdminBits";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { Button } from "@/components/ui/button";
import { adminProjectQuery } from "@/lib/admin/api";

export const Route = createFileRoute("/admin/projects/$id")({ component: EditProject });

function EditProject() {
  const { id } = Route.useParams();
  const { data, isPending, error, refetch } = useQuery(adminProjectQuery(id));
  if (error) return <AdminError message={error.message} onRetry={() => refetch()} />;
  if (isPending) return <div className="h-96 animate-pulse rounded-2xl bg-surface" aria-busy="true" />;
  if (!data) {
    return (
      <div className="py-16 text-center">
        <p className="font-semibold">Project not found</p>
        <Button variant="outline" className="mt-4" asChild><Link to="/admin/projects">Back to projects</Link></Button>
      </div>
    );
  }
  return <ProjectForm key={data.id} project={data} />;
}
