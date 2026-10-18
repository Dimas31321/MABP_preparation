const app = document.querySelector("#app");
let mode = "train",
  run = null,
  tick = null,
  saveOk = true;
let db;
try {
  db = JSON.parse(localStorage.getItem("mabp-v1")) || {
    attempts: [],
    mistakes: [],
    active: null,
  };
} catch {
  db = { attempts: [], mistakes: [], active: null };
  saveOk = false;
}
function persist() {
  try {
    localStorage.setItem("mabp-v1", JSON.stringify(db));
  } catch {
    saveOk = false;
  }
}
function esc(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
function stop() {
  clearInterval(tick);
}
function home() {
  stop();
  run = null;
  const completed = db.attempts.length;
  app.innerHTML = `<section class="hero"><div><div class="eyebrow">Твой спокойный путь к контрольной</div><h1>Бизнес-процессы.<br>Теперь — на практике.</h1><p class="lead">Три пробника, понятные разборы и работа над ошибками. От первого SIPOC до уверенного решения кейсов.</p><span class="pill">45 заданий · по мотивам экзаменов 2022–2024</span></div><div class="hero-art" aria-hidden="true"><div class="diagram"><svg viewBox="0 0 290 210"><path d="M110 60V105H200M200 130V174H135" fill="none" stroke="#8d9f81" stroke-width="1.5"/><circle cx="110" cy="82" r="4" fill="#8d9f81"/><path d="m191 100 7 5-7 5M145 169l-8 5 8 5" fill="none" stroke="#8d9f81"/></svg><span class="node n1">Разобраться</span><span class="node n2">Попробовать ↗</span><span class="node n3">Закрепить ✓</span></div><span class="art-caption">ОТ ТЕОРИИ К ДЕЙСТВИЮ</span></div></section><div class="sectionbar"><div><h2>Выбери свой пробник <span class="small">01 — 03</span></h2></div><div class="mode" aria-label="Режим прохождения"><button data-mode="train" class="${mode === "train" ? "active" : ""}">Тренировка</button><button data-mode="exam" class="${mode === "exam" ? "active" : ""}">Экзамен · 45 мин</button></div></div><p class="small">${mode === "train" ? "Без таймера. Проверяй себя и открывай разбор после каждого задания." : "45 минут. Ответы и разборы откроются после завершения; при истечении времени попытка сохранится."}</p><div class="cards">${[
    1, 2, 3,
  ]
    .map((v) => {
      let a = db.attempts.filter((a) => a.v === v).at(-1);
      return `<article class="card ${v === 1 ? "recommended" : ""}"><div class="card-top"><span class="num">ПРОБНИК 0${v}</span><span class="pill">${["Начни здесь", "Собери систему", "Закрепи знания"][v - 1]}</span></div><h3>${["От основ к модели", "Логика и управление", "Анализ и улучшение"][v - 1]}</h3><p>${["Границы процесса, SIPOC, первые развилки и показатели результата.", "Ответственность, правила нотаций и диагностика ошибок.", "Связи в моделях, стратегические карты и решения для бизнеса."][v - 1]}</p><div class="tags">${[
        ["SIPOC", "BPMN", "Основы"],
        ["EPC / BPMN", "KPI", "Диагностика"],
        ["Оптимизация", "BSC", "Кейсы"],
      ][v - 1]
        .map((t) => `<span>${t}</span>`)
        .join(
          "",
        )}</div><div class="card-bottom"><div class="meta"><span>12 тестов + 3 кейса</span><span>${a ? "Последний: " + a.correct + "/12" : "Ещё не пройден"}</span></div><button class="primary" data-start="${v}"><span>Начать пробник</span><span>↗</span></button></div></article>`;
    })
    .join(
      "",
    )}</div>${db.active ? `<div class="strip"><div><b>Ты уже начал пробник</b><p>${db.active.label} · ${Object.keys(db.active.answers).length} заданий с ответом</p></div><button class="primary" id="resume">Продолжить →</button></div>` : ""}<div class="strip"><div><b>Ошибки — тоже часть процесса.</b><p>${db.mistakes.length ? "В подборке " + db.mistakes.length + " заданий. Закрепи то, что пока вызывает вопросы." : "Здесь появятся задания, которые стоит повторить. Завершено попыток: " + completed + "."}</p></div><button class="quiet" id="mistakes" ${!db.mistakes.length ? "disabled" : ""}>Повторить ошибки ↗</button></div><p class="source">Учебные авторские задания по темам предоставленных экзаменов 2022, 2023 и частично 2024 года. Это тренировочные варианты, а не официальные экзаменационные билеты. Кейсы оцениваются самостоятельно по эталону. ${saveOk ? "" : "Хранилище браузера недоступно: прогресс сохранится только до закрытия страницы."}</p>`;
  app.querySelectorAll("[data-mode]").forEach(
    (b) =>
      (b.onclick = () => {
        mode = b.dataset.mode;
        home();
      }),
  );
  app
    .querySelectorAll("[data-start]")
    .forEach((b) => (b.onclick = () => start(+b.dataset.start)));
  app.querySelector("#resume")?.addEventListener("click", () => {
    run = db.active;
    render();
    clock();
  });
  app.querySelector("#mistakes").onclick = () => start(0);
}
function start(v) {
  if (
    db.active &&
    !confirm("Начать новую попытку? Незавершённая попытка будет заменена.")
  )
    return;
  run = {
    v,
    label: v ? "Пробник 0" + v : "Работа над ошибками",
    mode: v ? mode : "train",
    ids: v ? bank.filter((q) => q.v === v).map((q) => q.id) : [...db.mistakes],
    i: 0,
    answers: {},
    checked: {},
    self: {},
    revealed: {},
    end: Date.now() + 45 * 60000,
    done: false,
  };
  sync();
  render();
  clock();
  window.scrollTo(0, 0);
}
function sync() {
  if (!run.done) db.active = run;
  persist();
}
function current() {
  return bank.find((q) => q.id === run.ids[run.i]);
}
function same(a, b) {
  return [...(a || [])].sort().join(",") === [...b].sort().join(",");
}
function answered(q) {
  return q.open ? !!run.answers[q.id]?.trim() : !!run.answers[q.id]?.length;
}
function goto(i) {
  run.i = i;
  sync();
  render();
  window.scrollTo({ top: 80, behavior: "smooth" });
}
function clock() {
  stop();
  if (run.mode === "exam" && !run.done) {
    tick = setInterval(() => {
      if (!run || run.done) return;
      const el = document.querySelector("#clock");
      if (el) el.textContent = time();
      if (Date.now() >= run.end) finish(true);
    }, 1000);
  }
}
function time() {
  let sec = Math.max(0, Math.ceil((run.end - Date.now()) / 1000));
  return (
    String(Math.floor(sec / 60)).padStart(2, "0") +
    ":" +
    String(sec % 60).padStart(2, "0")
  );
}
function render() {
  const q = current(),
    review = run.done,
    canReveal = run.mode === "train" || review;
  let count = run.ids.filter((id) =>
    answered(bank.find((q) => q.id === id)),
  ).length;
  app.innerHTML = `<div class="workhead"><div><div class="eyebrow">${review ? "Разбор попытки" : run.mode === "exam" ? "Режим экзамена" : "Режим тренировки"}</div><h1>${run.label}</h1></div>${run.mode === "exam" && !review ? `<span class="timer" id="clock">${time()}</span>` : `<span class="pill">В своём темпе</span>`}</div><div class="workspace"><aside class="sidebar"><b>Твоя навигация</b><div class="grid">${run.ids
    .map((id, i) => {
      const x = bank.find((q) => q.id === id),
        checked = run.checked[id] || review;
      let cls = answered(x) ? "filled" : "";
      if (checked && !x.open && answered(x))
        cls = same(run.answers[id], x.correct) ? "good" : "bad";
      return `<button aria-label="Задание ${i + 1}" class="${cls} ${i === run.i ? "current" : ""}" data-go="${i}">${i + 1}</button>`;
    })
    .join(
      "",
    )}</div><div class="small">С ответом: ${count} из ${run.ids.length}</div><div class="progress"><i style="width:${(count / run.ids.length) * 100}%"></i></div><p class="small">Можно пропускать вопросы и возвращаться к ним.</p><button class="quiet" id="finish">${review ? "К результатам" : "Завершить попытку"}</button></aside><section class="question"><div class="small">ЗАДАНИЕ ${String(run.i + 1).padStart(2, "0")} / ${run.ids.length} <span style="margin:0 10px">·</span>${q.topic}</div><h2>${esc(q.text)}</h2><p class="small">${q.open ? "Открытый кейс · запиши решение, затем сравни с эталоном." : q.correct.length > 1 ? "Выбери все верные ответы. Балл засчитывается за полный набор." : "Выбери один верный ответ."}</p>${
    q.open
      ? `<textarea id="written" placeholder="Твоё решение…" aria-label="Твоё решение" ${review ? "readonly" : ""}>${esc(run.answers[q.id] || "")}</textarea>`
      : `<div class="options">${q.options
          .map((o, i) => {
            let cls = "";
            if ((run.checked[q.id] || review) && q.correct.includes(i))
              cls = "ok";
            else if (
              (run.checked[q.id] || review) &&
              (run.answers[q.id] || []).includes(i)
            )
              cls = "wrong";
            return `<label class="option ${cls}"><input type="${q.correct.length > 1 ? "checkbox" : "radio"}" name="answer" value="${i}" ${(run.answers[q.id] || []).includes(i) ? "checked" : ""} ${review ? "disabled" : ""}><span><span class="small">${"АБВГ"[i]}.</span> ${esc(o)}</span></label>`;
          })
          .join("")}</div>`
  }${run.checked[q.id] && !q.open ? `<div class="feedback ${same(run.answers[q.id], q.correct) ? "goodtext" : "badtext"}" role="status">${same(run.answers[q.id], q.correct) ? "Верно. Отличная работа." : "Есть ошибка. Сравни варианты с разбором."}</div>` : ""}<div class="actions"><button class="quiet" id="prev" ${!run.i ? "disabled" : ""}>← Назад</button>${canReveal && !q.open && !review ? '<button class="primary" id="check">Проверить ответ</button>' : ""}<button class="${q.open ? "primary" : "quiet"}" id="next">${run.i === run.ids.length - 1 ? (review ? "К результатам" : "Завершить") : "Дальше →"}</button></div>${canReveal ? `<details class="answer" id="answer" ${run.revealed[q.id] || run.checked[q.id] || review ? "open" : ""}><summary>${q.open ? "Показать эталон и оценить себя" : "Показать ответ и объяснение"}</summary>${!q.open ? `<p><b>Ответ: ${q.correct.map((i) => "АБВГ"[i]).join(", ")}.</b><br>${esc(q.explanation)}</p>` : `<p>${esc(q.explanation)}</p><div class="small">Самооценка кейса (отдельно от результата тестов)</div><div class="self"><button data-self="yes" class="${run.self[q.id] === "yes" ? "chosen" : ""}">Разобрался ✓</button><button data-self="no" class="${run.self[q.id] === "no" ? "chosen" : ""}">Нужно повторить</button></div>`}</details>` : '<p class="small" style="margin-top:25px">Ответ и объяснение откроются после завершения экзамена.</p>'}</section></div>`;
  app
    .querySelectorAll("[data-go]")
    .forEach((b) => (b.onclick = () => goto(+b.dataset.go)));
  app.querySelector("#prev").onclick = () => goto(run.i - 1);
  app.querySelector("#next").onclick = () =>
    run.i < run.ids.length - 1
      ? goto(run.i + 1)
      : review
        ? results()
        : finish();
  app.querySelector("#finish").onclick = () => (review ? results() : finish());
  app.querySelector("#written")?.addEventListener("input", (e) => {
    run.answers[q.id] = e.target.value;
    sync();
  });
  app.querySelectorAll("input[name=answer]").forEach(
    (el) =>
      (el.onchange = () => {
        run.answers[q.id] = [
          ...app.querySelectorAll("input[name=answer]:checked"),
        ].map((x) => +x.value);
        delete run.checked[q.id];
        sync();
      }),
  );
  app.querySelector("#check")?.addEventListener("click", () => {
    if (!answered(q)) {
      alert("Сначала выбери ответ.");
      return;
    }
    run.checked[q.id] = true;
    run.revealed[q.id] = true;
    sync();
    render();
  });
  app.querySelector("#answer")?.addEventListener("toggle", (e) => {
    run.revealed[q.id] = e.target.open;
    sync();
  });
  app.querySelectorAll("[data-self]").forEach(
    (b) =>
      (b.onclick = () => {
        run.self[q.id] = b.dataset.self;
        if (run.done) {
          db.mistakes = db.mistakes.filter((id) => id !== q.id);
          if (b.dataset.self === "no") db.mistakes.push(q.id);
          persist();
        } else sync();
        render();
      }),
  );
}
function finish(expired = false) {
  if (run.done) return results();
  let missing = run.ids.filter(
    (id) => !answered(bank.find((q) => q.id === id)),
  ).length;
  if (
    !expired &&
    !confirm(
      "Завершить попытку? " +
        (missing ? "Без ответа: " + missing + ". " : "") +
        "После этого откроются все разборы.",
    )
  )
    return;
  run.done = true;
  run.expired = expired;
  stop();
  let tests = run.ids
    .map((id) => bank.find((q) => q.id === id))
    .filter((q) => !q.open);
  run.correct = tests.filter((q) => same(run.answers[q.id], q.correct)).length;
  run.total = tests.length;
  run.ids.forEach((id) => {
    const q = bank.find((q) => q.id === id);
    if (q.open) {
      if (run.self[id] === "no" && !db.mistakes.includes(id))
        db.mistakes.push(id);
      if (run.self[id] === "yes")
        db.mistakes = db.mistakes.filter((x) => x !== id);
    } else {
      db.mistakes = db.mistakes.filter((x) => x !== id);
      if (!same(run.answers[id], q.correct)) db.mistakes.push(id);
    }
  });
  db.attempts.push({
    v: run.v,
    correct: run.correct,
    total: run.total,
    date: Date.now(),
  });
  db.active = null;
  persist();
  results();
  window.scrollTo(0, 0);
}
function results() {
  stop();
  let cases = run.ids
    .map((id) => bank.find((q) => q.id === id))
    .filter((q) => q.open);
  app.innerHTML = `<div class="result"><div class="eyebrow">Каждая попытка — шаг вперёд</div><h1 style="font-size:46px">${run.correct === run.total ? "Отлично получилось." : "Теперь понятно, что повторить."}</h1><p class="lead">${run.label} завершён. Открой любое задание, чтобы посмотреть свой ответ и разбор.</p>${run.expired ? '<div class="notice">Время истекло. Попытка завершена автоматически; неотвеченные тесты засчитаны как ошибки.</div>' : ""}<div class="scorecard"><div class="small" style="color:#c6d8cb">РЕЗУЛЬТАТ ТЕСТОВ</div><div class="score">${run.correct} <span style="font-size:28px;color:#b9cbbf">/ ${run.total}</span></div><span>${run.total ? Math.round((run.correct / run.total) * 100) : 0}% верных ответов${cases.length ? " · Кейсы оцениваются отдельно" : ""}</span></div>${cases.length ? `<p class="small">Самооценка кейсов: разобрался — ${cases.filter((q) => run.self[q.id] === "yes").length}; повторить — ${cases.filter((q) => run.self[q.id] === "no").length}; не оценено — ${cases.filter((q) => !run.self[q.id]).length}.</p>` : ""}<div class="resultlist">${run.ids
    .map((id, i) => {
      let q = bank.find((q) => q.id === id);
      return `<button class="reviewrow" data-review="${i}"><b>${String(i + 1).padStart(2, "0")}</b><span>${esc(q.text)}</span><small>${q.open ? (run.self[id] === "yes" ? "Разобрался" : run.self[id] === "no" ? "Повторить" : "Самооценка") : same(run.answers[id], q.correct) ? "✓ Верно" : "↺ Повторить"}</small></button>`;
    })
    .join(
      "",
    )}</div><div class="actions"><button class="primary" id="backhome">К пробникам →</button></div></div>`;
  app
    .querySelectorAll("[data-review]")
    .forEach((b) => (b.onclick = () => goto(+b.dataset.review)));
  app.querySelector("#backhome").onclick = home;
}
document.querySelector("#home").onclick = () => {
  if (run && !run.done) sync();
  home();
};
document.querySelector(".brand").onclick = (e) => {
  e.preventDefault();
  if (run && !run.done) sync();
  home();
};
home();