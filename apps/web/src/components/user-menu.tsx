import { Button } from "@qianmo-family-insurance/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@qianmo-family-insurance/ui/components/dropdown-menu";
import { Skeleton } from "@qianmo-family-insurance/ui/components/skeleton";
import Link from "next/link";

import { useSignOut } from "@/hooks/use-sign-out";
import { authClient } from "@/lib/auth-client";

export default function UserMenu() {
  const { signOut, isSigningOut } = useSignOut();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <Skeleton className="h-9 w-24" />;
  }

  if (!session) {
    return (
      <Link href="/login">
        <Button variant="outline">Sign In</Button>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        {session.user.name}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-card">
        <DropdownMenuGroup>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>{session.user.email}</DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            disabled={isSigningOut}
            onClick={() => {
              void signOut();
            }}
          >
            {isSigningOut ? "退出中..." : "退出登录"}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
