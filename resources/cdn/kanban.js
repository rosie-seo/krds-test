const INITIAL_COLS = [
  {
    id: "todo",
    title: "할 일",
    status: "todo",
    cards: [
      { id: "c1", title: "KRDS 컴포넌트 설계", tag: "설계", tagType: "design", priority: "high" },
      { id: "c2", title: "칸반보드 드래그 구현", tag: "개발", tagType: "dev", priority: "medium" },
      { id: "c3", title: "피그마 시안 검토", tag: "디자인", tagType: "design", priority: "low" },
    ]
  },
  {
    id: "doing",
    title: "진행 중",
    status: "doing",
    cards: [
      { id: "c4", title: "fetch() 컴포넌트 로딩 리팩토링", tag: "개발", tagType: "dev", priority: "high" },
      { id: "c5", title: "네비게이션 sticky 버그 수정", tag: "버그", tagType: "bug", priority: "high" },
    ]
  },
  {
    id: "review",
    title: "검토 중",
    status: "review",
    cards: [
      { id: "c6", title: "ACF 커스텀 필드 연동 테스트", tag: "테스트", tagType: "test", priority: "medium" },
    ]
  },
  {
    id: "done",
    title: "완료",
    status: "done",
    cards: [
      { id: "c7", title: "프로젝트 GitHub 최초 push", tag: "완료", tagType: "done", priority: "low" },
      { id: "c8", title: "WordPress 테마 CSS 초기 세팅", tag: "완료", tagType: "done", priority: "low" },
    ]
  },
];

const PRIORITY = {
  high: { label: "높음" },
  medium: { label: "보통" },
  low: { label: "낮음" },
};

let cols = JSON.parse(JSON.stringify(INITIAL_COLS));
let dragging = null;   // { cardId, colId }
let dragOver = null;   // { colId, overCardId }
let addingCol = null;  // colId
let editingCard = null; // cardId

const board = document.getElementById("board");
const boardSummary = document.getElementById("boardSummary");
const addColBtn = document.getElementById("addColBtn");

addColBtn.addEventListener("click", addCol);

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

function getTotalCards() {
  return cols.reduce((sum, col) => sum + col.cards.length, 0);
}

function updateSummary() {
  boardSummary.textContent = `${cols.length}개 컬럼 · ${getTotalCards()}개 카드`;
}

function addCol() {
  const names = ["새 상태", "협의 필요", "보류", "승인 대기"];
  const statuses = ["todo", "doing", "review", "done"];
  const nextIndex = cols.length % statuses.length;

  cols.push({
    id: createId("col"),
    title: names[cols.length % names.length],
    status: statuses[nextIndex],
    cards: [],
  });

  render();
}

function addCard(colId, text) {
  const value = text.trim();
  if (!value) return;

  const col = cols.find(item => item.id === colId);
  if (!col) return;

  col.cards.push({
    id: createId("card"),
    title: value,
    tag: "신규",
    tagType: "new",
    priority: "medium",
  });

  addingCol = null;
  render();
}

function deleteCard(colId, cardId) {
  const col = cols.find(item => item.id === colId);
  if (!col) return;

  col.cards = col.cards.filter(card => card.id !== cardId);
  render();
}

function updateCardTitle(cardId, newTitle) {
  const value = newTitle.trim();

  if (!value) {
    editingCard = null;
    render();
    return;
  }

  cols.forEach(col => {
    col.cards = col.cards.map(card =>
      card.id === cardId ? { ...card, title: value } : card
    );
  });

  editingCard = null;
  render();
}

function onDrop(toColId) {
  if (!dragging) return;

  const { cardId, colId: fromColId } = dragging;
  const overCardId = dragOver?.overCardId || null;

  const fromCol = cols.find(col => col.id === fromColId);
  const toCol = cols.find(col => col.id === toColId);

  if (!fromCol || !toCol) return;

  const cardIndex = fromCol.cards.findIndex(card => card.id === cardId);
  if (cardIndex === -1) return;

  const [movedCard] = fromCol.cards.splice(cardIndex, 1);

  if (overCardId) {
    const overIndex = toCol.cards.findIndex(card => card.id === overCardId);
    if (overIndex >= 0) {
      toCol.cards.splice(overIndex, 0, movedCard);
    } else {
      toCol.cards.push(movedCard);
    }
  } else {
    toCol.cards.push(movedCard);
  }

  dragging = null;
  dragOver = null;
  render();
}

function getColumnStatusClass(status) {
  return `is-status-${status || "todo"}`;
}

function getTagClass(tagType) {
  return `is-tag-${tagType || "new"}`;
}

function getPriorityClass(priority) {
  return `is-priority-${priority || "medium"}`;
}

function createButton(text, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = text;
  button.addEventListener("click", onClick);
  return button;
}

function renderColumn(col) {
  const columnEl = document.createElement("section");
  columnEl.className = `krds-board-column ${getColumnStatusClass(col.status)}`;
  columnEl.setAttribute("aria-labelledby", `col-title-${col.id}`);

  columnEl.addEventListener("dragover", (e) => {
    e.preventDefault();
    if (!dragOver || dragOver.colId !== col.id || dragOver.overCardId !== null) {
      dragOver = { colId: col.id, overCardId: null };
      render();
    }
  });

  columnEl.addEventListener("drop", (e) => {
    e.preventDefault();
    onDrop(col.id);
  });

  const headEl = document.createElement("div");
  headEl.className = "krds-board-column__head";

  const titleWrapEl = document.createElement("div");
  titleWrapEl.className = "krds-board-column__title-wrap";

  const dotEl = document.createElement("span");
  dotEl.className = "krds-status-dot";
  dotEl.setAttribute("aria-hidden", "true");

  const titleEl = document.createElement("h2");
  titleEl.className = "krds-board-column__title";
  titleEl.id = `col-title-${col.id}`;
  titleEl.textContent = col.title;

  const countEl = document.createElement("span");
  countEl.className = "krds-badge krds-badge--outline";
  countEl.textContent = `${col.cards.length}건`;

  titleWrapEl.append(dotEl, titleEl);
  headEl.append(titleWrapEl, countEl);

  const bodyEl = document.createElement("div");
  bodyEl.className = "krds-board-column__body";
  if (dragOver?.colId === col.id) {
    bodyEl.classList.add("is-drag-active");
  }

  const listEl = document.createElement("div");
  listEl.className = "krds-card-list";

  col.cards.forEach(card => {
    const wrapEl = document.createElement("div");
    wrapEl.className = "krds-task-card-wrap";

    const isOver = dragOver?.colId === col.id && dragOver?.overCardId === card.id;
    if (isOver) {
      const indicator = document.createElement("div");
      indicator.className = "krds-drop-indicator";
      wrapEl.appendChild(indicator);
    }

    const cardEl = document.createElement("article");
    cardEl.className = `krds-task-card ${getPriorityClass(card.priority)}`;
    cardEl.draggable = true;

    if (dragging?.cardId === card.id) {
      cardEl.classList.add("is-dragging");
    }

    cardEl.addEventListener("dragstart", () => {
      dragging = { cardId: card.id, colId: col.id };
      setTimeout(() => {
        render();
      }, 0);
    });

    cardEl.addEventListener("dragend", () => {
      dragging = null;
      dragOver = null;
      render();
    });

    cardEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (dragging?.cardId === card.id) return;

      if (!dragOver || dragOver.colId !== col.id || dragOver.overCardId !== card.id) {
        dragOver = { colId: col.id, overCardId: card.id };
        render();
      }
    });

    const metaEl = document.createElement("div");
    metaEl.className = "krds-task-card__meta";

    const tagEl = document.createElement("span");
    tagEl.className = `krds-tag ${getTagClass(card.tagType)}`;
    tagEl.textContent = card.tag;

    const deleteBtn = createButton(
      "삭제",
      "krds-btn krds-btn--danger",
      () => deleteCard(col.id, card.id)
    );

    metaEl.append(tagEl, deleteBtn);

    let titleNode;

    if (editingCard === card.id) {
      const editWrap = document.createElement("div");
      editWrap.className = "krds-form-field";

      const label = document.createElement("label");
      label.className = "krds-label";
      label.setAttribute("for", `edit-${card.id}`);
      label.textContent = "업무 제목 수정";

      const textarea = document.createElement("textarea");
      textarea.className = "krds-textarea";
      textarea.id = `edit-${card.id}`;
      textarea.value = card.title;
      textarea.rows = 3;

      textarea.addEventListener("blur", (e) => {
        updateCardTitle(card.id, e.target.value);
      });

      textarea.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          editingCard = null;
          render();
        }
      });

      editWrap.append(label, textarea);
      titleNode = editWrap;

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      }, 0);
    } else {
      const titleEl = document.createElement("div");
      titleEl.className = "krds-task-card__title";
      titleEl.textContent = card.title;
      titleEl.addEventListener("dblclick", () => {
        editingCard = card.id;
        render();
      });
      titleNode = titleEl;
    }

    const footerEl = document.createElement("div");
    footerEl.className = "krds-task-card__footer";

    const priorityEl = document.createElement("span");
    priorityEl.className = `krds-priority ${getPriorityClass(card.priority)}`;

    const priorityDot = document.createElement("span");
    priorityDot.className = "krds-priority__dot";
    priorityDot.setAttribute("aria-hidden", "true");

    const priorityText = document.createElement("span");
    priorityText.textContent = `우선순위 ${PRIORITY[card.priority].label}`;

    priorityEl.append(priorityDot, priorityText);

    const hintEl = document.createElement("span");
    hintEl.className = "krds-task-card__hint";
    hintEl.textContent = "더블클릭 수정";

    footerEl.append(priorityEl, hintEl);

    cardEl.append(metaEl, titleNode, footerEl);
    wrapEl.appendChild(cardEl);
    listEl.appendChild(wrapEl);
  });

  if (dragOver?.colId === col.id && col.cards.length === 0) {
    const emptyDrop = document.createElement("div");
    emptyDrop.className = "krds-empty-drop";
    emptyDrop.textContent = "여기에 놓기";
    listEl.appendChild(emptyDrop);
  }

  bodyEl.appendChild(listEl);

  const addAreaEl = document.createElement("div");
  addAreaEl.className = "krds-board-column__add";

  if (addingCol === col.id) {
    const formBox = document.createElement("div");
    formBox.className = "krds-form-box";

    const field = document.createElement("div");
    field.className = "krds-form-field";

    const label = document.createElement("label");
    label.className = "krds-label";
    label.setAttribute("for", `new-card-${col.id}`);
    label.textContent = "카드 제목";

    const input = document.createElement("input");
    input.className = "krds-input";
    input.id = `new-card-${col.id}`;
    input.type = "text";
    input.placeholder = "예: 요구사항 검토";

    const help = document.createElement("p");
    help.className = "krds-help-text";
    help.textContent = "새 업무 항목명을 입력한 뒤 추가 버튼을 눌러주세요.";

    const actions = document.createElement("div");
    actions.className = "krds-form-actions";

    const addBtn = createButton(
      "추가",
      "krds-btn krds-btn--primary",
      () => addCard(col.id, input.value)
    );

    const cancelBtn = createButton(
      "취소",
      "krds-btn krds-btn--secondary",
      () => {
        addingCol = null;
        render();
      }
    );

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        addCard(col.id, input.value);
      }
      if (e.key === "Escape") {
        addingCol = null;
        render();
      }
    });

    actions.append(addBtn, cancelBtn);
    field.append(label, input, help);
    formBox.append(field, actions);
    addAreaEl.appendChild(formBox);

    setTimeout(() => input.focus(), 0);
  } else {
    const addBtn = createButton(
      "카드 추가",
      "krds-btn krds-btn--secondary krds-btn--block",
      () => {
        addingCol = col.id;
        render();
      }
    );
    addAreaEl.appendChild(addBtn);
  }

  columnEl.append(headEl, bodyEl, addAreaEl);
  return columnEl;
}

function render() {
  updateSummary();
  board.innerHTML = "";

  cols.forEach(col => {
    board.appendChild(renderColumn(col));
  });
}

render();