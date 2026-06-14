import dotenv from "dotenv";
import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";

dotenv.config({ path: "../../apps/server/.env" });

const MOCK_USER_ID = "mock-user-qianmo-family";
const MOCK_PASSWORD = "Qianmo123456";
const now = new Date();

const mockUser = {
  id: MOCK_USER_ID,
  name: "阡陌演示家庭",
  email: "demo@qianmo.family",
  emailVerified: true,
  image: null,
  createdAt: daysAgo(30),
  updatedAt: now,
};

const mockSummaries = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    userId: MOCK_USER_ID,
    sourceUrl: "https://mp.weixin.qq.com/s/family-critical-illness-2026",
    sourceType: "wechat_article" as const,
    userPrompt: "关于2026家庭重疾险新规的深度解读",
    status: "success" as const,
    summaryContent: [
      "- 新规强调重疾险等待期、轻中症责任与赔付比例的透明披露，家庭投保时应优先核对条款定义是否清晰。",
      "- 对已有保单家庭，建议把成人主险保额、儿童专项保障和医疗险免赔额放在同一张保障清单中比较。",
      "- 若家庭预算有限，可先补齐主要收入来源成员的重疾与定期寿险，再逐步增加子女和老人保障。",
      "- 购买前重点关注续保条件、健康告知边界和理赔材料要求，避免后续出现保障理解偏差。",
    ].join("\n"),
    errorMessage: null,
    createdAt: daysAgo(1, 2),
    updatedAt: daysAgo(1, 1),
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    userId: MOCK_USER_ID,
    sourceUrl: "https://www.bilibili.com/video/BV1family2026",
    sourceType: "bilibili_video" as const,
    userPrompt: "Bilibili: 30分钟教你如何配置全家保险方案",
    status: "processing" as const,
    summaryContent: null,
    errorMessage: null,
    createdAt: hoursAgo(2),
    updatedAt: hoursAgo(1),
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    userId: MOCK_USER_ID,
    sourceUrl: "https://www.douyin.com/video/medical-insurance-tips",
    sourceType: "douyin_video" as const,
    userPrompt: "抖音：医疗险报销避坑指南",
    status: "failed" as const,
    summaryContent: null,
    errorMessage: "第三方视频解析服务暂不可用，请稍后重试。",
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    userId: MOCK_USER_ID,
    sourceUrl: "https://example.com/child-accident-claim-cases",
    sourceType: "public_article" as const,
    userPrompt: "少儿意外险常见理赔争议案例汇总",
    status: "success" as const,
    summaryContent: [
      "- 少儿意外险理赔争议通常集中在事故定义、就诊机构资质和材料提交时效。",
      "- 家长应保存门急诊病历、费用清单、发票和事故说明，避免只有支付截图而缺少医疗凭证。",
      "- 对运动、校内活动等高频场景，应提前确认是否存在免责条款或赔付比例限制。",
      "- 如果已有学平险，可与商业意外险做责任互补，减少重复购买。",
    ].join("\n"),
    errorMessage: null,
    createdAt: daysAgo(4),
    updatedAt: daysAgo(4),
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    userId: MOCK_USER_ID,
    sourceUrl: "https://www.xiaohongshu.com/explore/family-policy-review",
    sourceType: "xiaohongshu_image" as const,
    userPrompt: "小红书：三口之家保单体检清单",
    status: "success" as const,
    summaryContent: [
      "- 三口之家保单体检应先看保障责任是否覆盖重疾、医疗、意外和身故风险。",
      "- 常见问题是儿童保障过多、家庭主要收入成员保额不足，导致预算分配倒挂。",
      "- 建议按家庭年收入、负债余额和未来教育支出估算核心成员保额。",
      "- 每年续保前同步检查缴费日期、银行卡状态和受益人信息。",
    ].join("\n"),
    errorMessage: null,
    createdAt: daysAgo(7),
    updatedAt: daysAgo(7),
  },
];

async function main() {
  const [{ db }, { account, user }, { linkSummary }] = await Promise.all([
    import("."),
    import("./schema/auth"),
    import("./schema/link-summary"),
  ]);
  const hashedPassword = await hashPassword(MOCK_PASSWORD);

  await db
    .insert(user)
    .values(mockUser)
    .onConflictDoUpdate({
      target: user.id,
      set: {
        name: mockUser.name,
        email: mockUser.email,
        emailVerified: mockUser.emailVerified,
        image: mockUser.image,
        updatedAt: mockUser.updatedAt,
      },
    });

  await db
    .insert(account)
    .values({
      id: "mock-account-qianmo-family",
      accountId: MOCK_USER_ID,
      providerId: "credential",
      userId: MOCK_USER_ID,
      password: hashedPassword,
      createdAt: mockUser.createdAt,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: account.id,
      set: {
        accountId: MOCK_USER_ID,
        providerId: "credential",
        userId: MOCK_USER_ID,
        password: hashedPassword,
        updatedAt: now,
      },
    });

  for (const item of mockSummaries) {
    await db
      .insert(linkSummary)
      .values(item)
      .onConflictDoUpdate({
        target: linkSummary.id,
        set: {
          sourceUrl: item.sourceUrl,
          sourceType: item.sourceType,
          userPrompt: item.userPrompt,
          status: item.status,
          summaryContent: item.summaryContent,
          errorMessage: item.errorMessage,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        },
      });
  }

  const records = await db
    .select({ id: linkSummary.id })
    .from(linkSummary)
    .where(eq(linkSummary.userId, MOCK_USER_ID));

  console.log(
    `Seeded mock user ${mockUser.email} / ${MOCK_PASSWORD} with ${records.length} link summaries.`,
  );
}

function daysAgo(days: number, extraHours = 0) {
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  date.setHours(date.getHours() - extraHours);
  return date;
}

function hoursAgo(hours: number) {
  const date = new Date(now);
  date.setHours(date.getHours() - hours);
  return date;
}

main().catch((error) => {
  console.error("Failed to seed mock data:", error);
  process.exit(1);
});
