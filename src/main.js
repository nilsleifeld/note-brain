/**
 * Noten-Lern-App (Violinschlüssel) — Vanilla JS
 * step: Halbtonschritte auf dem System relativ zur untersten Linie E4 (step 0).
 */

const POOL = [
	{ id: "C4", label: "C", step: -2 },
	{ id: "D4", label: "D", step: -1 },
	{ id: "E4", label: "E", step: 0 },
	{ id: "F4", label: "F", step: 1 },
	{ id: "G4", label: "G", step: 2 },
	{ id: "A4", label: "A", step: 3 },
	{ id: "B4", label: "B", step: 4 },
	{ id: "C5", label: "C", step: 5 },
	{ id: "D5", label: "D", step: 6 },
	{ id: "E5", label: "E", step: 7 },
	{ id: "F5", label: "F", step: 8 },
];

/** Hilfe-Übersicht: G3 (unter Hilfslinien) bis G5 (über dem System) */
const HELP_NOTE_LABELS = {
	"-5": "G3",
	"-4": "A3",
	"-3": "B3",
	"-2": "C4",
	"-1": "D4",
	0: "E4",
	1: "F4",
	2: "G4",
	3: "A4",
	4: "B4",
	5: "C5",
	6: "D5",
	7: "E5",
	8: "F5",
	9: "G5",
};

const HELP_NOTES = [];
for (let s = -5; s <= 9; s++) {
	HELP_NOTES.push({ step: s, label: HELP_NOTE_LABELS[String(s)] });
}

const STAFF_TOP = 36;
const GAP = 14;
/** Vertikale Streckung um die G-Linie (scaleY), Breite unverändert */
const CLEF_SCALE_Y = 1.09;
/** Links am Systembeginn, leicht in den Linienstart gezogen (wie gedruckt) */
const CLEF_X = 18;

/** Y-Mitte der Notenkopfes (SVG y nach unten) */
function stepToY(step, st = STAFF_TOP, gap = GAP) {
	const bottomLineY = st + 4 * gap;
	return bottomLineY - step * (gap / 2);
}

function randomNote() {
	return POOL[Math.floor(Math.random() * POOL.length)];
}

function pickDistinctLabels(note) {
	const needsOctave = (n) =>
		POOL.filter((p) => p.label === n.label).length > 1;

	const options = new Set();
	options.add(note.id);

	while (options.size < Math.min(8, POOL.length)) {
		const p = POOL[Math.floor(Math.random() * POOL.length)];
		options.add(p.id);
	}

	const ids = [...options];
	for (let i = ids.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[ids[i], ids[j]] = [ids[j], ids[i]];
	}

	return ids.map((id) => {
		const n = POOL.find((p) => p.id === id);
		return {
			id,
			display: needsOctave(n) ? `${n.label}${id.slice(-1)}` : n.label,
		};
	});
}

/** Oberste Linie des 5-zeiligen Systems (F5) */
const STAFF_TOP_STEP = 8;

/** Hilfslinien unter dem System (wie bisher); oberhalb + Hilfslinien für hohe Töne */
function ledgerYs(step, st = STAFF_TOP, gap = GAP) {
	const ys = [];
	const add = (s) => {
		const y = stepToY(s, st, gap);
		if (!ys.some((yy) => Math.abs(yy - y) < 0.01)) ys.push(y);
	};
	if (step < 0) {
		if (step <= -2) add(-2);
		if (step <= -1) add(-1);
	} else if (step > STAFF_TOP_STEP) {
		add(step);
	}
	return ys;
}

/** Hilfslinien: kurze Striche links/rechts vom Notenkopf (nicht volle Breite) */
const LEDGER_PAD = 12;
function shortLedgerLine(cx, rx, ly, pad = LEDGER_PAD, strokeW = 1.2) {
	const half = rx + pad;
	const x1 = cx - half;
	const x2 = cx + half;
	return `<line x1="${x1}" y1="${ly}" x2="${x2}" y2="${ly}" stroke="currentColor" stroke-width="${strokeW}" />`;
}

const NOTE_X = 218;
const NOTE_HEAD_RX = 9;

/** Größere Darstellung im Hilfe-Dialog (eine Reihe, gut lesbar) */
const HELP_STAFF_SCALE = 1.68;

function renderStaffSVG(step, ariaLabel, opts = {}) {
	const k = opts.scale ?? 1;
	const st = STAFF_TOP * k;
	const gap = GAP * k;
	const w = 400 * k;
	const noteX = NOTE_X * k;
	const noteHeadRx = NOTE_HEAD_RX * k;
	const noteRy = 6.5 * k;
	const stemLen = 42 * k;
	const stemInset = 3 * k;
	const stemOffsetX = 7 * k;
	const lineStart = 20 * k;
	const lineEnd = 368 * k;
	const clefX = CLEF_X * k;
	const gLineY = st + 3 * gap;
	const clefFont = Math.round(gap * 8.35);
	const clefNudge = Math.round(gap * 0.08);
	const pad = LEDGER_PAD * k;
	const swLine = Math.max(1.1, 1.2 * k);
	const swStem = Math.max(1.85, 2.2 * k);

	const noteY = stepToY(step, st, gap);
	const ledgers = ledgerYs(step, st, gap);
	const stemX = noteX + stemOffsetX;
	const stemTop = noteY - stemLen;
	const staffBottomY = st + 4 * gap;

	let top = Math.min(st - 10 * k, stemTop - 6 * k);
	let bottom = Math.max(staffBottomY + 10 * k, noteY + 12 * k);
	for (const ly of ledgers) {
		top = Math.min(top, ly - 8 * k);
		bottom = Math.max(bottom, ly + 8 * k);
	}
	const vbH = bottom - top;
	const a11y = ariaLabel
		? ` aria-label="${ariaLabel}"`
		: ` aria-hidden="true"`;

	let svg = `<svg viewBox="0 ${top} ${w} ${vbH}" xmlns="http://www.w3.org/2000/svg"${a11y}>`;

	for (const ly of ledgers) {
		svg += shortLedgerLine(noteX, noteHeadRx, ly, pad, swLine);
	}

	for (let i = 0; i < 5; i++) {
		const y = st + i * gap;
		svg += `<line x1="${lineStart}" y1="${y}" x2="${lineEnd}" y2="${y}" stroke="currentColor" stroke-width="${swLine}" />`;
	}

	svg += `<g transform="translate(${clefX}, ${gLineY + clefNudge}) scale(1, ${CLEF_SCALE_Y})" class="clef-wrap">`;
	svg += `<text x="0" y="0" class="clef" font-size="${clefFont}" dominant-baseline="central" alignment-baseline="central" text-anchor="start" fill="currentColor" stroke="none">𝄞</text>`;
	svg += `</g>`;

	svg += `<g class="note" fill="currentColor">`;
	svg += `<ellipse cx="${noteX}" cy="${noteY}" rx="${noteHeadRx}" ry="${noteRy}" transform="rotate(-25 ${noteX} ${noteY})" />`;
	svg += `<line x1="${stemX}" y1="${noteY - stemInset}" x2="${stemX}" y2="${stemTop}" stroke="currentColor" stroke-width="${swStem}" stroke-linecap="round" />`;
	svg += `</g>`;

	svg += `</svg>`;
	return svg;
}

function renderStaff(note) {
	return renderStaffSVG(note.step, "Notensystem");
}

const staffEl = document.getElementById("staff");
const choicesEl = document.getElementById("choices");
const btnNext = document.getElementById("btnNext");
const btnHelp = document.getElementById("btnHelp");
const helpDialog = document.getElementById("helpDialog");
const helpStaffList = document.getElementById("helpStaffList");

function fillHelpStaffList() {
	helpStaffList.innerHTML = "";
	for (const { step, label } of HELP_NOTES) {
		const col = document.createElement("div");
		col.className = "help-col";
		const wrap = document.createElement("div");
		wrap.className = "staff-wrap help-col-staff";
		wrap.innerHTML = renderStaffSVG(step, undefined, { scale: HELP_STAFF_SCALE });
		const lab = document.createElement("span");
		lab.className = "help-col-label";
		lab.textContent = label;
		col.append(wrap, lab);
		helpStaffList.appendChild(col);
	}
}

btnHelp.addEventListener("click", () => {
	helpDialog.showModal();
});

let current = randomNote();
let choiceRows = pickDistinctLabels(current);
let locked = false;

function render() {
	staffEl.innerHTML = renderStaff(current);
	choicesEl.innerHTML = "";

	for (const opt of choiceRows) {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "choice";
		btn.textContent = opt.display;
		btn.dataset.noteId = opt.id;
		btn.addEventListener("click", () => onPick(opt.id, btn));
		choicesEl.appendChild(btn);
	}

	btnNext.disabled = true;
	locked = false;
}

function onPick(id, btn) {
	if (locked) return;
	locked = true;

	const correct = id === current.id;
	const all = choicesEl.querySelectorAll(".choice");

	for (const b of all) {
		b.disabled = true;
		const bid = b.dataset.noteId;
		if (bid === current.id) {
			b.classList.add("correct");
		} else if (b === btn && !correct) {
			b.classList.add("wrong");
		} else {
			b.classList.add("neutral-disabled");
		}
	}

	btnNext.disabled = false;
}

function nextRound() {
	current = randomNote();
	choiceRows = pickDistinctLabels(current);
	render();
}

btnNext.addEventListener("click", nextRound);

fillHelpStaffList();
render();
