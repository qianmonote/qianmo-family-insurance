import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const specsDir = path.join(rootDir, "Specs");
const docsDir = path.join(rootDir, "docs");

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceSection(content, startMarker, endMarker, replacement) {
  const pattern = new RegExp(
    `${escapeRegExp(startMarker)}[\\s\\S]*?${escapeRegExp(endMarker)}`,
    "m",
  );

  if (!pattern.test(content)) {
    throw new Error(`Missing markers: ${startMarker} ... ${endMarker}`);
  }

  return content.replace(pattern, `${startMarker}\n${replacement}\n${endMarker}`);
}

async function getSpecTopics() {
  const candidates = [
    "create-account-page",
    "link-summary",
    "login-page-fixes",
    "product-bug-fixes",
  ];

  const topics = [];

  for (const topic of candidates) {
    try {
      const markdown = await readFile(path.join(specsDir, topic, "tasks.md"), "utf8");
      const rows = markdown
        .split("\n")
        .filter((line) => /^\|\s*\d+/.test(line))
        .map((line) =>
          line
            .split("|")
            .slice(1, -1)
            .map((cell) => cell.trim()),
        );

      const total = rows.length;
      const done = rows.filter((cells) => cells.at(-1) === "已完成").length;
      const blocked = rows.filter((cells) => cells.at(-1) === "阻塞").length;
      const needsReview = rows.filter((cells) => cells.at(-1) === "需复核").length;

      let status = "进行中";
      if (blocked > 0) status = "阻塞";
      else if (done === total && total > 0) status = "已完成";
      else if (needsReview > 0) status = "需复核";

      topics.push({ topic, total, done, blocked, needsReview, status });
    } catch {
      // Ignore topics without tasks.
    }
  }

  return topics;
}

async function getCurrentStatus(summaries) {
  let inProgress = null;
  let latest = null;

  for (const summary of summaries) {
    try {
      const parsed = JSON.parse(
        await readFile(path.join(specsDir, summary.topic, ".qm-status.json"), "utf8"),
      );
      const candidate = { topic: summary.topic, ...parsed };

      if (candidate.status === "in_progress") {
        inProgress = candidate;
        break;
      }

      if (!latest || (candidate.updatedAt ?? "") > (latest.updatedAt ?? "")) {
        latest = candidate;
      }
    } catch {
      // Ignore missing status files.
    }
  }

  return (
    inProgress ??
    latest ?? {
      topic: summaries.at(-1)?.topic ?? "unknown",
      currentTask: "-",
      currentTaskTitle: "等待分派",
      status: "idle",
    }
  );
}

function getCurrentTaskLabel(current) {
  return {
    id: current.currentTask ?? current.currentUnit?.id ?? "-",
    title: current.currentTaskTitle ?? current.currentUnit?.name ?? "等待分派",
  };
}

function buildMarkdownSummary(current, summaries, updatedAt) {
  const currentSummary = summaries.find((item) => item.topic === current.topic) ?? summaries.at(-1);
  const totalDone = summaries.reduce((sum, item) => sum + item.done, 0);
  const totalTasks = summaries.reduce((sum, item) => sum + item.total, 0);
  const topicStatus = currentSummary ? `${currentSummary.done}/${currentSummary.total}` : "0/0";
  const currentTask = getCurrentTaskLabel(current);

  const quote = `> 由 \`/qm:prd\` / \`/qm:ai\` 每轮执行后更新。当前需求批次：**${current.topic}**，任务进度 ${topicStatus}；全部 Specs 汇总进度 ${totalDone}/${totalTasks}。`;
  const table = [
    "| 需求主题 | 任务进度 | 状态 |",
    "|---|---:|---|",
    ...summaries.map((item) => `| ${item.topic} | ${item.done}/${item.total} | ${item.status} |`),
  ].join("\n");
  const roundMermaid = [
    "```mermaid",
    "flowchart LR",
    `    CUR[${current.topic}] --> TASK[当前任务 ${currentTask.id} ${currentTask.title}]`,
    `    TASK --> PROG[当前批次 ${topicStatus}]`,
    `    PROG --> ALL[全部 Specs ${totalDone}/${totalTasks}]`,
    `    ALL --> TIME[更新时间 ${updatedAt}]`,
    "```",
  ].join("\n");

  return { quote, table, roundMermaid };
}

function buildWorkflowHtmlSummary(current, summaries, updatedAt) {
  const currentSummary = summaries.find((item) => item.topic === current.topic) ?? summaries.at(-1);
  const totalDone = summaries.reduce((sum, item) => sum + item.done, 0);
  const totalTasks = summaries.reduce((sum, item) => sum + item.total, 0);
  const topicStatus = currentSummary ? `${currentSummary.done}/${currentSummary.total}` : "0/0";
  const currentTask = getCurrentTaskLabel(current);
  const taskState = current.status === "completed" ? "已完成" : "进行中";
  const taskStateClass = current.status === "completed" ? "done" : "run";

  const pipeline = [
    `<span class="node done">qm:init</span><span class="arrow">→</span>`,
    `<span class="node done">qm:prd</span><span class="arrow">→</span>`,
    ...summaries.flatMap((item) => [
      `<span class="node done">${item.topic} ${item.done}/${item.total}</span>`,
      `<span class="arrow">→</span>`,
    ]),
    `<span class="node done">${totalDone}/${totalTasks} 完成</span>`,
  ].join("\n    ");

  const agents = [
    `<li class="agent"><span class="role">编排者</span><span>当前任务 ${currentTask.id} ${currentTask.title}</span><span class="st ${taskStateClass}">${taskState}</span></li>`,
    `<li class="agent"><span class="role">GitHub Agent</span><span>自动提交限定生成文件，等待 remote / Actions 权限就绪</span><span class="st ${taskStateClass}">${current.status === "completed" ? "已完成" : "推进中"}</span></li>`,
    `<li class="agent"><span class="role">AWS Agent</span><span>deploy.yml + SST + OIDC 闭环复核中</span><span class="st ${taskStateClass}">${current.status === "completed" ? "已完成" : "推进中"}</span></li>`,
    `<li class="agent"><span class="role">QA Agent</span><span>看板脚本与 workflow 变更待验证</span><span class="st ${taskStateClass}">${taskState}</span></li>`,
    `<li class="agent"><span class="role">安全审查 Agent</span><span>Codex CLI 二进制缺失，仍需人工复核</span><span class="st idle">受限</span></li>`,
  ].join("\n      ");

  return {
    pipeline,
    topic: `${current.topic} · 当前批次`,
    unit: `执行单元 ${currentTask.id} ${currentTask.title}`,
    agents,
    progressWidth: Math.max(8, Math.round((totalDone / Math.max(1, totalTasks)) * 100)),
    meta: `${current.topic} 任务进度 ${topicStatus} · 全部 Specs ${totalDone}/${totalTasks} · 数据来源 Specs/*/tasks.md 与 .qm-status.json · 更新时间 ${updatedAt}`,
  };
}

function buildOfficeHtmlSummary(current, summaries, updatedAt) {
  const currentSummary = summaries.find((item) => item.topic === current.topic) ?? summaries.at(-1);
  const totalDone = summaries.reduce((sum, item) => sum + item.done, 0);
  const totalTasks = summaries.reduce((sum, item) => sum + item.total, 0);
  const topicStatus = currentSummary ? `${currentSummary.done}/${currentSummary.total}` : "0/0";
  const currentTask = getCurrentTaskLabel(current);

  return {
    summary: `${current.topic} 当前进度 ${topicStatus}；全部 Specs 汇总 ${totalDone}/${totalTasks}。当前执行：${currentTask.id} ${currentTask.title}。`,
    orchestrator: `本轮调度 ${current.topic} · ${currentTask.id} ${currentTask.title}`,
    frontend: `生成文件自动提交与看板刷新脚本 · 推进中`,
    qa: `workflow / 文档 / 脚本验证中`,
    cloud: `AWS 自动发布闭环复核中`,
    footer: `最近一次 /qm:prd 刷新：${updatedAt}（数据来源：Specs/*/tasks.md 与 .qm-status.json）`,
  };
}

async function refreshWorkflowMarkdown(current, summaries, updatedAt) {
  const filePath = path.join(docsDir, "workflow.md");
  let content = await readFile(filePath, "utf8");
  const generated = buildMarkdownSummary(current, summaries, updatedAt);

  content = replaceSection(
    content,
    "<!-- qm:summary:start -->",
    "<!-- qm:summary:end -->",
    `${generated.quote}\n\n## 当前需求 / 任务进度\n\n${generated.table}`,
  );

  content = replaceSection(
    content,
    "<!-- qm:current-round:start -->",
    "<!-- qm:current-round:end -->",
    `## 本轮（${current.topic}）\n\n${generated.roundMermaid}`,
  );

  await writeFile(filePath, content);
}

async function refreshWorkflowHtml(current, summaries, updatedAt) {
  const filePath = path.join(docsDir, "workflow.html");
  let content = await readFile(filePath, "utf8");
  const generated = buildWorkflowHtmlSummary(current, summaries, updatedAt);

  content = replaceSection(content, "<!-- qm:pipeline:start -->", "<!-- qm:pipeline:end -->", generated.pipeline);
  content = replaceSection(
    content,
    "<!-- qm:live-status:start -->",
    "<!-- qm:live-status:end -->",
    `<div class="ls-head">
      <span class="ls-topic">${generated.topic}</span>
      <span class="ls-unit">${generated.unit}</span>
    </div>
    <ul class="agent-list">
      ${generated.agents}
    </ul>
    <div class="bar"><span style="width:${generated.progressWidth}%"></span></div>
    <div class="meta">${generated.meta}</div>`,
  );

  await writeFile(filePath, content);
}

async function refreshOfficeHtml(current, summaries, updatedAt) {
  const filePath = path.join(docsDir, "office.html");
  let content = await readFile(filePath, "utf8");
  const generated = buildOfficeHtmlSummary(current, summaries, updatedAt);

  content = content.replace(
    /<p class="summary" data-live-summary>[\s\S]*?<\/p>/,
    `<p class="summary" data-live-summary>${generated.summary}</p>`,
  );
  content = content.replace(
    /(<div class="ws" data-agent="orchestrator"><div class="role">编排者<\/div><div class="bubble" data-bubble>)[\s\S]*?(<\/div><div class="avatar">)/,
    `$1${generated.orchestrator}$2`,
  );
  content = content.replace(
    /(<div class="ws" data-agent="frontend"><div class="role">前端 Agent<\/div><div class="bubble" data-bubble>)[\s\S]*?(<\/div><div class="avatar">)/,
    `$1${generated.frontend}$2`,
  );
  content = content.replace(
    /(<div class="ws" data-agent="qa"><div class="role">QA Agent<\/div><div class="bubble" data-bubble>)[\s\S]*?(<\/div><div class="avatar">)/,
    `$1${generated.qa}$2`,
  );
  content = content.replace(
    /(<div class="ws" data-agent="cloud"><div class="role">云资源 Agent<\/div><div class="bubble" data-bubble>)[\s\S]*?(<\/div><div class="avatar")/,
    `$1${generated.cloud}$2`,
  );
  content = content.replace(
    /<p class="footer" data-live-updated>[\s\S]*?<\/p>/,
    `<p class="footer" data-live-updated>${generated.footer}</p>`,
  );

  await writeFile(filePath, content);
}

async function main() {
  const updatedAt = new Date().toISOString();
  const summaries = await getSpecTopics();
  const current = await getCurrentStatus(summaries);

  await refreshWorkflowMarkdown(current, summaries, updatedAt);
  await refreshWorkflowHtml(current, summaries, updatedAt);
  await refreshOfficeHtml(current, summaries, updatedAt);
}

await main();
