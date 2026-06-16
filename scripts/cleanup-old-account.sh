#!/usr/bin/env bash
# 一次性：拆除旧账号 825385242465 上那次失败部署遗留的资源
# （Aurora 集群 / VPC / EIP / secrets 等），它们因 removal:retain 不会自删，持续计费。
#
# 用法（在你自己的终端，能交互授权）：
#   export AWS_ACCESS_KEY_ID=<旧账号 key>
#   export AWS_SECRET_ACCESS_KEY=<旧账号 secret>
#   bash scripts/cleanup-old-account.sh
#
# 脚本会：断言当前确为旧账号 → 临时放开 production 的 protect/removal →
#          sst remove → 无论成败都恢复 sst.config.ts 原样。
set -euo pipefail
cd "$(dirname "$0")/.."

OLD_ACCT="825385242465"
CONFIG="sst.config.ts"

ACCT=$(aws sts get-caller-identity --query Account --output text)
echo "当前 AWS 账号: $ACCT"
if [ "$ACCT" != "$OLD_ACCT" ]; then
  echo "✗ 不是旧账号 $OLD_ACCT，中止（避免误删新账号资源）。"
  exit 1
fi
echo "✓ 确认旧账号。"

# 备份并在退出时恢复 config
cp "$CONFIG" "${CONFIG}.bak"
restore() { mv -f "${CONFIG}.bak" "$CONFIG"; echo "↩ 已恢复 $CONFIG"; }
trap restore EXIT

# 临时放开 production 的保护与保留策略
python3 - "$CONFIG" <<'PY'
import sys, re
p = sys.argv[1]
s = open(p).read()
s = s.replace(
  'removal: input?.stage === "production" ? "retain" : "remove",',
  'removal: "remove",')
s = s.replace(
  'protect: ["production"].includes(input?.stage ?? ""),',
  'protect: false,')
open(p, "w").write(s)
PY
echo "→ 已临时放开 protect/removal，开始 sst remove..."

pnpm sst remove --stage production
echo "✓ sst remove 完成。请到 RDS 控制台确认 Aurora 是否残留最终快照需手动删除。"
