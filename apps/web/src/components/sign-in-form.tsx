import { Button } from "@qianmo-family-insurance/ui/components/button";
import { Input } from "@qianmo-family-insurance/ui/components/input";
import { Label } from "@qianmo-family-insurance/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { ArrowRight, Eye, EyeOff, Lock, Mail, Shield, ShieldCheck, UserPlus } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";
import { getAuthErrorMessage } from "@/lib/auth-error";
import { buildAuthSwitchHref, resolveRedirectTarget } from "@/lib/auth-redirect";
import { DEMO_CREDENTIALS } from "@/lib/demo-credentials";

import Loader from "./loader";
import { TrustBadge } from "./qianmo-design-shell";

export default function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isPending } = authClient.useSession();
  const [showPassword, setShowPassword] = useState(false);

  const redirectParam = searchParams.get("redirect");
  const registerHref = buildAuthSwitchHref("/register", redirectParam) as Route;

  const form = useForm({
    defaultValues: {
      // 默认预填演示测试账号，方便开发/演示快速登录（见 lib/demo-credentials.ts）
      email: DEMO_CREDENTIALS.email,
      password: DEMO_CREDENTIALS.password,
    },
    onSubmit: async ({ value }) => {
      await authClient.signIn.email(
        {
          email: value.email,
          password: value.password,
        },
        {
          onSuccess: () => {
            router.push(resolveRedirectTarget(redirectParam) as Route);
            toast.success("登录成功");
          },
          onError: (error) => {
            toast.error(getAuthErrorMessage(error.error));
          },
        },
      );
    },
    validators: {
      onSubmit: z.object({
        email: z.email("请输入有效的邮箱地址"),
        password: z.string().min(8, "密码至少 8 位字符"),
      }),
    },
  });

  if (isPending) {
    return <Loader />;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f8f9ff] p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,#dfe3ff_0,transparent_35%),radial-gradient(circle_at_100%_0%,#ccffe8_0,transparent_32%),radial-gradient(circle_at_55%_100%,#eaddff_0,transparent_30%)]" />
      <div className="fixed left-8 top-8 hidden text-2xl font-bold text-[#003ec7] md:block">
        阡陌家庭保
      </div>

      <main className="relative z-10 grid w-full max-w-6xl items-center gap-10 xl:grid-cols-[480px_1fr]">
        <section className="rounded-xl border border-[#c3c5d9]/70 bg-white/85 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 h-1.5 rounded-full bg-gradient-to-r from-[#003ec7] via-[#25fea8] to-[#620bd3]" />
          <header className="mb-6 flex flex-col items-center gap-3 text-center">
            <div className="flex size-14 items-center justify-center rounded-xl bg-[#0052ff] text-white shadow-lg">
              <ShieldCheck className="size-8" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-[#0b1c30]">登录账户</h1>
              <p className="mt-2 text-base text-[#434656]">您的智能家庭保险管家</p>
            </div>
          </header>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-5"
          >
          <form.Field name="email">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name} className="text-sm font-bold text-[#0b1c30]">
                  注册邮箱
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-[#737688]" />
                  <Input
                    id={field.name}
                    name={field.name}
                    type="email"
                    placeholder="hello@family.com"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="h-12 rounded-lg border-[#c3c5d9] bg-white pl-10 text-base focus-visible:border-[#003ec7] focus-visible:ring-[#003ec7]/40"
                  />
                </div>
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-sm text-[#ba1a1a]">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <form.Field name="password">
            {(field) => (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={field.name} className="text-sm font-bold text-[#0b1c30]">
                    安全密码
                  </Label>
                  <button type="button" className="text-xs font-bold text-[#003ec7] hover:text-[#0052ff]">
                    忘记密码？
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-[#737688]" />
                  <Input
                    id={field.name}
                    name={field.name}
                    type={showPassword ? "text" : "password"}
                    placeholder="请输入您的密码"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="h-12 rounded-lg border-[#c3c5d9] bg-white pl-10 pr-12 text-base focus-visible:border-[#003ec7] focus-visible:ring-[#003ec7]/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737688] transition-colors hover:text-[#003ec7]"
                    aria-label={showPassword ? "隐藏密码" : "显示密码"}
                  >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-sm text-[#ba1a1a]">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

            <div className="flex items-center justify-between py-1">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-[#434656]">
                <input type="checkbox" className="size-4 rounded border-[#c3c5d9] accent-[#003ec7]" />
                记住登录
              </label>
              <TrustBadge />
            </div>

            <form.Subscribe
              selector={(state) => ({
                canSubmit: state.canSubmit,
                isSubmitting: state.isSubmitting,
              })}
            >
              {({ canSubmit, isSubmitting }) => (
                <Button
                  type="submit"
                  className="h-14 w-full rounded-lg bg-[#003ec7] text-base font-bold text-white shadow-md transition-all hover:bg-[#0052ff] active:scale-[0.98]"
                  disabled={!canSubmit || isSubmitting}
                >
                  {isSubmitting ? "登录中..." : "立即登录"}
                  <ArrowRight className="ml-2 size-5" />
                </Button>
              )}
            </form.Subscribe>

            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-[#c3c5d9]" />
              <span className="text-xs font-medium text-[#737688]">或者</span>
              <div className="h-px flex-1 bg-[#c3c5d9]" />
            </div>

            <Button
              render={<Link href={registerHref} />}
              nativeButton={false}
              variant="outline"
              className="h-12 w-full rounded-lg border-2 border-[#003ec7] bg-transparent text-sm font-bold text-[#003ec7] hover:bg-[#dde1ff]/50"
            >
              <UserPlus className="mr-2 size-4" />
              新用户？立即加入
            </Button>
          </form>
        </section>

        <section className="hidden xl:block">
          <div className="relative overflow-hidden rounded-xl border border-white/70 bg-[#0b1c30] p-10 text-white shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(37,254,168,0.35),transparent_24%),radial-gradient(circle_at_80%_10%,rgba(183,196,255,0.35),transparent_28%),linear-gradient(135deg,rgba(0,62,199,0.95),rgba(11,28,48,0.95))]" />
            <div className="relative z-10 space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-sm font-bold backdrop-blur">
                <Shield className="size-4" />
                Family Risk Intelligence
              </div>
              <div>
                <h2 className="max-w-lg text-5xl font-semibold leading-tight">
                  把复杂保险信息，整理成家人都看得懂的保障地图。
                </h2>
                <p className="mt-5 max-w-md text-lg leading-8 text-[#eaf1ff]/85">
                  汇总保单、识别保障缺口、追踪理赔与缴费节点，让家庭保障管理更清晰。
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {["保单洞察", "隐私加密", "AI 总结", "家庭协同"].map((item) => (
                  <div key={item} className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                    <p className="text-sm font-bold">{item}</p>
                    <p className="mt-2 text-xs leading-5 text-[#eaf1ff]/75">实时整理关键风险与下一步动作</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
