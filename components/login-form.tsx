"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormRow } from "@/components/form-row";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { AuthUser } from "@/lib/types";

type LoginResponse = {
  user: Omit<AuthUser, "factories">;
  factories: AuthUser["factories"];
  activeFactory?: AuthUser["factories"][number] | null;
};

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const [email, setEmail] = useState("admin@gpms.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await api.post<LoginResponse>("/auth/login", {
        email,
        password,
      });
      login({
        ...response.data.user,
        factories: response.data.factories,
      }, response.data.activeFactory?.id);
      router.push(nextPath ?? "/dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">GPMS</div>
          <CardTitle className="text-3xl">Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <FormRow label="Email">
              <Input value={email} onChange={(event) => setEmail(event.target.value)} />
            </FormRow>
            <FormRow label="Password">
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </FormRow>
            <Button className="w-full" disabled={loading} type="submit">
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
