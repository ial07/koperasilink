"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Truck,
  Package,
  XCircle,
  MapPin,
  ArrowRight,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500",
  confirmed: "bg-blue-500",
  in_transit: "bg-purple-500",
  completed: "bg-green-500",
  cancelled: "bg-red-500",
};

const STATUS_BADGE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  confirmed: "outline",
  in_transit: "outline",
  completed: "default",
  cancelled: "destructive",
};

const STEPS = [
  { key: "pending", label: "Pending", icon: Package },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { key: "in_transit", label: "In Transit", icon: Truck },
  { key: "completed", label: "Completed", icon: Package },
];

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const { data: txn, isLoading, isError } = useQuery({
    queryKey: ["transaction", id],
    queryFn: () =>
      apiClient.get("/transactions", { params: { limit: 1 } }).then((r) => {
        const found = r.data?.data?.find((t: any) => t.id === id);
        if (!found) throw new Error("Not found");
        return found;
      }),
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus: string) =>
      apiClient.patch(`/transactions/${id}/status`, null, {
        params: { status: newStatus },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transaction", id] });
      toast.success("Status updated");
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Update failed"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !txn) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p>Transaction not found</p>
        <Button variant="link" onClick={() => router.push("/dashboard/transactions")}>
          Back to transactions
        </Button>
      </div>
    );
  }

  const currentStepIndex = STEPS.findIndex((s) => s.key === txn.status);
  const doneSteps = STEPS.filter((_, i) => i <= currentStepIndex && txn.status !== "cancelled");
  const cancelled = txn.status === "cancelled";

  // Determine next possible actions
  const nextActions: { label: string; status: string }[] = [];
  if (txn.status === "pending") nextActions.push({ label: "Confirm", status: "confirmed" });
  if (txn.status === "confirmed") nextActions.push({ label: "Mark In Transit", status: "in_transit" });
  if (txn.status === "in_transit") nextActions.push({ label: "Complete", status: "completed" });
  if (txn.status !== "completed" && txn.status !== "cancelled") {
    nextActions.push({ label: "Cancel", status: "cancelled" });
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/transactions")}>
        <ArrowLeft className="mr-1 h-4 w-4" /> Back
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {txn.commodity?.name || "Transaction"}
          </h1>
          <p className="text-muted-foreground">
            {txn.fromVillage?.name} → {txn.toVillage?.name}
          </p>
        </div>
        <Badge variant={STATUS_BADGE[txn.status] || "secondary"} className="capitalize">
          {txn.status?.replace("_", " ")}
        </Badge>
      </div>

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status</CardTitle>
        </CardHeader>
        <CardContent>
          {cancelled ? (
            <div className="flex items-center gap-3 text-red-500">
              <XCircle className="h-6 w-6" />
              <span className="font-medium">Cancelled</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                const active = i <= currentStepIndex;
                return (
                  <div key={step.key} className="flex items-center gap-1 flex-1">
                    <div
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{step.label}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`h-0.5 flex-1 ${active ? "bg-primary" : "bg-muted"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">From</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-500" />
              <span className="font-medium">{txn.fromVillage?.name || "—"}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">To</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-500" />
              <span className="font-medium">{txn.toVillage?.name || "—"}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Number(txn.quantity).toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                {txn.commodity?.unit || "kg"}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {Number(txn.totalAmount).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action buttons */}
      {nextActions.length > 0 && (
        <div className="flex gap-2">
          {nextActions.map((action) => (
            <Button
              key={action.status}
              variant={action.status === "cancelled" ? "destructive" : "default"}
              onClick={() => statusMutation.mutate(action.status)}
              disabled={statusMutation.isPending}
            >
              {action.status === "cancelled" && <XCircle className="mr-1 h-4 w-4" />}
              {action.status === "confirmed" && <CheckCircle2 className="mr-1 h-4 w-4" />}
              {action.status === "in_transit" && <Truck className="mr-1 h-4 w-4" />}
              {action.status === "completed" && <Package className="mr-1 h-4 w-4" />}
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
