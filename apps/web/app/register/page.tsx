"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [villageId, setVillageId] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { data: villages, isLoading: loadingVillages } = useQuery({
    queryKey: ["auth-villages"],
    queryFn: () => apiClient.get("/auth/villages").then((r) => r.data),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!villageId) {
      toast.error("Please select a village");
      return;
    }
    setLoading(true);
    try {
      const { data } = await apiClient.post("/auth/register", { name, phone, password, villageId });
      toast.success("Account created!");
      
      localStorage.setItem("token", data.accessToken);
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>Join KoperasiLink platform</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="08123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="village">Village</Label>
              <select
                id="village"
                required
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={villageId}
                onChange={(e) => setVillageId(e.target.value)}
                disabled={loadingVillages}
              >
                <option value="" disabled>
                  {loadingVillages ? "Loading villages..." : "Select your village"}
                </option>
                {villages?.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.district}, {v.province})
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" className="w-full" disabled={loading || !villageId}>
              {loading ? "Creating account..." : "Register"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign In
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
