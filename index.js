const TONES = {
	0: "ˉ",
	1: "ˊ",
	2: "ˇ",
	3: "ˋ",
};

/**
 * Application state
 */
const STATE = {
	/**
	 * @type [string, string][]
	 */
	rows: [],

	/**
	 * The index into the rows
	 * @type number
	 */
	index: 0,
};

/**
 * @param {string} path
 * @returns {Promise<[string, string][]>}
 */
async function fetchCSV(path) {
	const resp = await fetch(path);
	const text = await resp.text();
	// ignore header and empty lines
	const rows = text.split("\n").filter((line, i) => i > 0 && !!line);
	const csvArray = rows.map((row) => row.trim().split(","));
	return csvArray;
}

/**
 * @param {number} max
 */
function getRandomIndex(max) {
	return Math.floor(Math.random() * max);
}

/**
 * @returns {NodeListOf<HTMLInputElement>}
 */
function findInputs() {
	return document.querySelectorAll(".han-char input");
}

/**
 * @param {string} s
 * @returns {string}
 */
function removeAccents(s) {
	const norm = s.normalize("NFD");
	return norm.replace(/\p{Diacritic}/gu, "");
}

/**
 * Takes a non-accented input (e.g. "hao")
 * and applies a given accent mark to it
 * @param {string} input non-accented input ("hao")
 * @param {number} accent 0-3
 * @returns {string} accented word (e.g. "hǎo")
 */
function applyAccent(input, accent) {
	if (accent < 0 || accent > 3) {
		throw new Error(`received invalid value for accent: ${accent}`);
	}
	// For some reason, if the <script> tag doesn't have
	// type="module", these latin chars will get jumbled
	const a = ["ā", "á", "ǎ", "à"];
	const o = ["ō", "ó", "ǒ", "ò"];
	const e = ["ē", "é", "ě", "è"];
	const i = ["ī", "í", "ǐ", "ì"];
	const u = ["ū", "ú", "ǔ", "ù"];
	const u1 = ["ǖ", "ǘ", "ǚ", "ǜ"];
	// const u2 = ["ü"];

	// disambiguate the vowel we want to apply the
	// accent to
	//
	// alphabet order here is a coincidence
	const priority = ["a", "e", "i", "o", "u"];
	const normalizedInput = removeAccents(input);
	for (const vowel of priority) {
		const indexOfVowel = normalizedInput.indexOf(vowel);
		if (indexOfVowel >= 0) {
			const targetVowel = normalizedInput[indexOfVowel];
			let replacement = "";
			switch (targetVowel) {
				case "a":
					replacement = a[accent];
					break;
				case "o":
					replacement = o[accent];
					break;
				case "e":
					replacement = e[accent];
					break;
				case "i":
					replacement = i[accent];
					break;
				case "u":
					replacement = u[accent];
					break;
				case "ü":
					// TODO: handle this correctly
					replacement = u1[accent];
					break;
			}
			if (replacement) {
				return (
					input.slice(0, indexOfVowel) +
					replacement +
					input.slice(indexOfVowel + 1)
				);
			}
		}
	}

	// fall back to original input
	return input;
}

/**
 * @param {HTMLElement} parent
 */
function clearChildren(parent) {
	while (parent.firstChild) {
		parent.removeChild(parent.firstChild);
	}
}

/**
 * @param {HTMLElement} container
 * @param {[string, string][]} selection
 */
function renderQuizlet(container, selection) {
	const [han, pinyin] = selection;

	// add elements to DOM
	const fragment = document.createDocumentFragment();
	const words = han.split("");
	const pinyinWords = pinyin.split(/\s+/);
	if (words.length !== pinyinWords.length) {
		console.error("Got mismatching word counts for pinyin and han", {
			words,
			pinyinWords,
		});
		return;
	}
	for (let i = 0; i < words.length; i++) {
		const w = words[i];
		const pinyinWord = pinyinWords[i];
		// han character
		const sp = document.createElement("span");
		sp.textContent = w;
		sp.classList.add("han-display");
		const div = document.createElement("div");
		div.classList.add("han-char");
		div.appendChild(sp);

		const inputGroup = document.createElement("div");
		inputGroup.classList.add("pinyin-input-group");
		const input = document.createElement("input");
		input.type = "text";
		input.name = pinyinWord;
		input.autocorrect = false;
		input.autocapitalize = "off";
		input.autocomplete = "off";
		if (i === 0) {
			input.autofocus = true;
		}
		inputGroup.appendChild(input);

		const toneBtnGroup = document.createElement("div");
		toneBtnGroup.classList.add("tones");

		// tone buttons
		const tones = [0, 1, 2, 3];
		for (const tone of tones) {
			const btn = document.createElement("button");
			btn.classList.add("tones-button");
			btn.innerText = TONES[tone];
			btn.addEventListener("click", () => {
				const formatted = applyAccent(input.value, tone);
				input.value = formatted;
			});
			toneBtnGroup.appendChild(btn);
		}
		inputGroup.appendChild(toneBtnGroup);

		div.appendChild(inputGroup);

		fragment.appendChild(div);
	}
	container.appendChild(fragment);
}

/**
 * @param {HTMLElement} container
 * @param {string} currentlySelected the currently
 * selected list query
 */
function activateListSelect(container, currentlySelected) {
	const listSelect = getListSelect();
	if (!listSelect) {
		console.warn("Unable to find select#lists");
		return;
	}
	listSelect.addEventListener("change", function () {
		const value = this.value;
		const selected = this.selectedOptions[0];
		const path = selected.getAttribute("path");
		history.pushState({ value, path }, null, `?list=${value}`);
		if (path) {
			fetchAndRenderQuizlet(container, path);
		}
	});

	window.addEventListener("popstate", (e) => {
		if (!e.state) {
			return;
		}
		const { path, value } = e.state;
		const select = getListSelect();
		if (select) {
			select.value = value;
		}
		if (path) {
			fetchAndRenderQuizlet(container, path);
		}
	});
	listSelect.value = currentlySelected;
}

/**
 * @returns {HTMLSelectElement | null}
 */
function getListSelect() {
	return document.querySelector("select#lists");
}

/**
 * @param {HTMLElement} container
 * @param {boolean} state
 */
function setLoading(container, state) {
	if (state) {
		container.innerHTML = `<span id="loading">Loading...</span>`;
	} else {
		clearChildren(container);
	}
}

/**
 * @param {string} selector
 * @returns {HTMLButtonElement}
 */
function queryButtonOrThrow(selector) {
	const btn = document.querySelector(selector);
	if (!btn) {
		throw new Error(`Could not find button with selector ${selector}`);
	}
	return btn;
}

/**
 * @param {T[]} arr
 * @returns {T[]}
 */
function shuffle(arr) {
	// TODO: can use better prime for randomization
	const PRIME = 91;
	const startIndex = getRandomIndex(arr.length);
	let i = startIndex;

	const newArr = [];
	newArr.push(arr[i]);
	i = (i + PRIME) % arr.length;
	while (i !== startIndex) {
		newArr.push(arr[i]);
		i = (i + PRIME) % arr.length;
	}
	return newArr;
}

function updateProgress() {
	const progressElement = document.querySelector("#progress");
	if (!progressElement) {
		throw new Error("Missing progress element");
	}
	progressElement.innerText = `${STATE.index + 1} / ${STATE.rows.length}`;
}

/**
 * @param {HTMLButtonElement} checkBtn
 */
function resetCheckBtn(checkBtn) {
	checkBtn.textContent = "Check";
	checkBtn.classList.remove("ok");
}

/**
 * @param {HTMLElement} container
 * @param {string} path
 */
async function fetchAndRenderQuizlet(container, path) {
	setLoading(container, true);
	const result = await fetchCSV(path);
	setLoading(container, false);
	STATE.rows = shuffle(result);
	STATE.index = 0;
	if (result.length === 0) {
		container.innerHTML = `Error: got empty CSV`;
		return;
	}
	renderQuizlet(container, STATE.rows[STATE.index]);
	updateProgress();

	const updateUI = () => {
		clearChildren(container);
		renderQuizlet(container, STATE.rows[STATE.index]);
		updateProgress();
		resetCheckBtn(checkBtn);
	};
	const shuffleBtn = queryButtonOrThrow("button#shuffle");
	const checkBtn = queryButtonOrThrow("button#check");
	shuffleBtn.onclick = () => {
		STATE.rows = shuffle(result);
		STATE.index = 0;
		updateUI();
	};

	const prevBtn = queryButtonOrThrow("button#prev");
	prevBtn.onclick = () => {
		STATE.index = Math.max(0, STATE.index - 1);
		updateUI();
	};
	const nextBtn = queryButtonOrThrow("button#next");
	nextBtn.onclick = () => {
		STATE.index = Math.min(STATE.rows.length - 1, STATE.index + 1);
		updateUI();
	};
}

async function main() {
	const container = document.querySelector("#han-container");
	if (!container) {
		console.error("could not find #han-container");
		return;
	}
	const search = new URLSearchParams(window.location.search);
	const listParam = search.get("list");
	const matchingOption = document.querySelector(
		`select#lists option[value="${listParam}"]`,
	);
	const fallback = document.querySelector(`select#lists option`);
	const selectedOption = matchingOption ?? fallback;
	const value = selectedOption.getAttribute("value");
	const path = selectedOption.getAttribute("path");
	history.pushState({ value, path }, null, `?list=${value}`);
	activateListSelect(container, value);
	await fetchAndRenderQuizlet(container, path);

	const checkBtn = queryButtonOrThrow("button#check");
	checkBtn.onclick = () => {
		const inputs = findInputs();
		let ok = true;
		for (const input of inputs) {
			const value = input.value.toLowerCase().trim();
			const expected = input.name;
			if (value !== expected) {
				ok = false;
				input.classList.add("incorrect");
			} else if (input.classList.contains("incorrect")) {
				input.classList.remove("incorrect");
			}
		}
		if (ok) {
			checkBtn.textContent = "OK!";
			checkBtn.classList.add("ok");
		} else {
			resetCheckBtn(checkBtn);
		}
	};

	const revealBtn = queryButtonOrThrow("button#reveal");
	revealBtn.onclick = () => {
		const inputs = findInputs();
		for (const input of inputs) {
			const expected = input.name;
			input.value = expected;
		}
	};
}

main();
