/* 演示时间线 = policy-expiry-reminder 一轮多 Agent 流程的逐阶段快照
   每个快照等价于该时刻覆盖写的 Specs/<主题>/.qm-status.json。
   QM_PLAY 自动按阶段播放，两张看板共用本文件。 */
window.QM_TIMELINE = [
  { topic:"policy-expiry-reminder", updatedAt:"17:06 · 派发前", currentUnit:{ id:"1", name:"共享类型 Reminder schema", stage:"派发（先置位后动手）" },
    tasksSummary:{ total:5, done:0, blocked:0 },
    agents:[ { role:"编排者", agentKey:"orchestrator", task:"拆队列 · 派发任务1", stage:"编排", status:"进行中" } ] },

  { topic:"policy-expiry-reminder", updatedAt:"17:07 · 实现", currentUnit:{ id:"1", name:"共享类型 Reminder schema", stage:"实现（packages/shared）" },
    tasksSummary:{ total:5, done:0, blocked:0 },
    agents:[ { role:"编排者", agentKey:"orchestrator", task:"监督任务1", stage:"编排", status:"进行中" },
             { role:"后端 Agent", agentKey:"backend", task:"任务1 Reminder zod schema", stage:"实现", status:"进行中" } ] },

  { topic:"policy-expiry-reminder", updatedAt:"17:08 · 实现", currentUnit:{ id:"2", name:"reminders 表 + 迁移文件", stage:"实现（只生成迁移，不执行）" },
    tasksSummary:{ total:5, done:1, blocked:0 },
    agents:[ { role:"编排者", agentKey:"orchestrator", task:"任务1 完成 → 派发任务2", stage:"编排", status:"进行中" },
             { role:"后端 Agent", agentKey:"backend", task:"任务2 Drizzle schema + 迁移文件", stage:"实现", status:"进行中" } ] },

  { topic:"policy-expiry-reminder", updatedAt:"17:09 · 并行", currentUnit:{ id:"3 + 4", name:"接口 + 卡片（契约就绪，并行）", stage:"实现 / 并行执行中" },
    tasksSummary:{ total:5, done:2, blocked:0 },
    agents:[ { role:"编排者", agentKey:"orchestrator", task:"并行派发 任务3 / 任务4", stage:"编排", status:"进行中" },
             { role:"后端 Agent", agentKey:"backend", task:"任务3 GET /api/reminders", stage:"实现", status:"进行中" },
             { role:"前端 Agent", agentKey:"frontend", task:"任务4 ExpiryReminderCard", stage:"实现", status:"进行中" } ] },

  { topic:"policy-expiry-reminder", updatedAt:"17:10 · 门禁", currentUnit:{ id:"3 + 4", name:"质量门禁 + 验收测试", stage:"tsc / lint / Vitest" },
    tasksSummary:{ total:5, done:2, blocked:0 },
    agents:[ { role:"后端 Agent", agentKey:"backend", task:"任务3 门禁通过 → 移交", stage:"质量门禁", status:"已完成" },
             { role:"前端 Agent", agentKey:"frontend", task:"任务4 门禁通过 → 移交", stage:"质量门禁", status:"已完成" },
             { role:"QA Agent", agentKey:"qa", task:"任务5 Vitest 按验收标准断言", stage:"测试", status:"进行中" } ] },

  { topic:"policy-expiry-reminder", updatedAt:"17:11 · 安全审查", currentUnit:{ id:"5", name:"三种 Code Review（串行）", stage:"基础 / 对抗 / Git 差异" },
    tasksSummary:{ total:5, done:4, blocked:0 },
    agents:[ { role:"后端 Agent", agentKey:"backend", task:"任务3 GET /api/reminders", stage:"实现完成", status:"已完成" },
             { role:"前端 Agent", agentKey:"frontend", task:"任务4 ExpiryReminderCard", stage:"实现完成", status:"已完成" },
             { role:"QA Agent", agentKey:"qa", task:"任务5 Vitest 6/6 通过", stage:"验收通过", status:"已完成" },
             { role:"安全审查 Agent", agentKey:"security", task:"任务5 三种 Review · 找逻辑漏洞", stage:"对抗审查（串行）", status:"进行中" } ] },

  { topic:"policy-expiry-reminder", updatedAt:"17:12 · 完成", currentUnit:{ id:"5", name:"本轮全部完成", stage:"完成（阻断项清零）" },
    tasksSummary:{ total:5, done:5, blocked:0 },
    agents:[ { role:"编排者", agentKey:"orchestrator", task:"汇总报告 · 刷新可视化", stage:"编排", status:"已完成" },
             { role:"后端 Agent", agentKey:"backend", task:"任务3 GET /api/reminders", stage:"已合并", status:"已完成" },
             { role:"前端 Agent", agentKey:"frontend", task:"任务4 ExpiryReminderCard", stage:"已合并", status:"已完成" },
             { role:"QA Agent", agentKey:"qa", task:"任务5 Vitest 6/6 通过", stage:"验收通过", status:"已完成" },
             { role:"安全审查 Agent", agentKey:"security", task:"任务5 复审通过（采纳 2 条非阻断建议）", stage:"复审通过", status:"已完成" } ] }
];

window.QM_PLAY = function(render){
  var T = window.QM_TIMELINE || []; if(!T.length) return;
  var i = 0, timer = null, playing = false;
  var bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:9999;display:flex;align-items:center;gap:12px;background:rgba(20,25,35,.94);color:#e8edf6;border:1px solid #2c3445;border-radius:999px;padding:8px 8px 8px 16px;font:600 12.5px -apple-system,"PingFang SC",sans-serif;box-shadow:0 14px 44px rgba(0,0,0,.55);backdrop-filter:blur(8px)';
  var lab = document.createElement('span');
  var btn = document.createElement('button');
  btn.style.cssText = 'cursor:pointer;border:none;border-radius:999px;padding:6px 14px;font:700 12px -apple-system,sans-serif;background:linear-gradient(90deg,#4f8cff,#a05bff);color:#fff';
  bar.appendChild(lab); bar.appendChild(btn); document.body.appendChild(bar);
  function show(k){ i = k; render(T[k]); var s = T[k]; lab.textContent = '阶段 ' + (k+1) + '/' + T.length + ' · ' + s.currentUnit.stage + ' · ' + s.tasksSummary.done + '/' + s.tasksSummary.total; }
  function stop(){ clearInterval(timer); timer = null; playing = false; btn.textContent = (i >= T.length-1) ? '▶ 重播' : '▶ 继续'; }
  function play(){ if(i >= T.length-1) show(0); playing = true; btn.textContent = '⏸ 暂停'; clearInterval(timer);
    timer = setInterval(function(){ if(i >= T.length-1){ stop(); return; } show(i+1); }, 2000); }
  btn.onclick = function(){ playing ? stop() : play(); };
  show(0); play();
};
