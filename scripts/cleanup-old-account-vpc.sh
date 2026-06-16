#!/usr/bin/env bash
# 一次性：彻底清空旧账号 825385242465 残留的 VPC 与 SST 引导 S3 桶。
# 前置：Aurora 集群已删除（本脚本只处理 VPC + S3，不含 RDS）。
#
# 用法（你自己的终端，用旧账号凭证）：
#   export AWS_ACCESS_KEY_ID=<旧账号 key>
#   export AWS_SECRET_ACCESS_KEY=<旧账号 secret>
#   bash scripts/cleanup-old-account-vpc.sh
set -euo pipefail

OLD_ACCT="825385242465"
REGION="us-east-1"
VPC="vpc-0b381eff7c552fb6f"
DB_SUBNET_GROUP="qianmo-family-insurance-production-databasesubnetgroup-donodxhx"
BUCKETS=("sst-asset-fsxzmsxvfode" "sst-state-fsxzmsxvfode")

ACCT=$(aws sts get-caller-identity --query Account --output text)
echo "当前 AWS 账号: $ACCT"
[ "$ACCT" = "$OLD_ACCT" ] || { echo "✗ 不是旧账号 $OLD_ACCT，中止。"; exit 1; }
echo "✓ 确认旧账号。"

echo "→ 删除 DB 子网组..."
aws rds delete-db-subnet-group --region "$REGION" --db-subnet-group-name "$DB_SUBNET_GROUP" 2>/dev/null \
  && echo "  ✓ 已删 $DB_SUBNET_GROUP" || echo "  (跳过：不存在)"

echo "→ 删除子网..."
for s in $(aws ec2 describe-subnets --region "$REGION" --filters "Name=vpc-id,Values=$VPC" --query 'Subnets[].SubnetId' --output text); do
  aws ec2 delete-subnet --region "$REGION" --subnet-id "$s" && echo "  ✓ 已删 $s"
done

echo "→ 删除 VPC（主路由表与默认安全组随之自动删）..."
aws ec2 delete-vpc --region "$REGION" --vpc-id "$VPC" && echo "  ✓ 已删 $VPC"

echo "→ 清空并删除 S3 引导桶..."
for b in "${BUCKETS[@]}"; do
  if ! aws s3api head-bucket --bucket "$b" 2>/dev/null; then echo "  (跳过：$b 不存在)"; continue; fi
  # 删除所有对象版本与删除标记（state 桶通常开了版本控制）
  aws s3api list-object-versions --bucket "$b" --output json \
    --query '{Objects: [Versions, DeleteMarkers][] | [].{Key:Key,VersionId:VersionId}}' > /tmp/_vers.json 2>/dev/null || echo '{"Objects":null}' > /tmp/_vers.json
  if python3 -c "import json,sys; d=json.load(open('/tmp/_vers.json')); sys.exit(0 if d.get('Objects') else 1)" 2>/dev/null; then
    aws s3api delete-objects --bucket "$b" --delete "file:///tmp/_vers.json" >/dev/null && echo "  ✓ 清空 $b 的所有版本"
  fi
  aws s3 rm "s3://$b" --recursive >/dev/null 2>&1 || true
  aws s3api delete-bucket --bucket "$b" --region "$REGION" && echo "  ✓ 已删桶 $b"
done
rm -f /tmp/_vers.json

echo "✓ VPC 与 S3 引导桶清理完成"
