const TONES = {
	0: "ˉ",
	1: "ˊ",
	2: "ˇ",
	3: "ˋ",
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

const LISTS = [
	{
		query: "intro",
		name: "Intro",
		path: "./phrases/intro.csv",
	},
	{
		query: "numbers",
		name: "Numbers",
		path: "./phrases/numbers.csv",
	},
];

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
	listSelect.addEventListener("change", async function () {
		const value = this.value;
		history.pushState(value, null, `?list=${value}`);
		setLoading(container, true);
		setLoading(container, false);
		// const queryParams = new URLSearchParams();
		// queryParams.set("list", value);
		// window.location.search = queryParams.toString();
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
 * @param {[string, string][]} csv
 */
function renderVocabList(container, csv) {
	const randomIndex = getRandomIndex(csv.length);
	renderQuizlet(container, csv[randomIndex]);
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

async function main() {
	const container = document.querySelector("#han-container");
	if (!container) {
		console.error("could not find #han-container");
		return;
	}
	const search = new URLSearchParams(window.location.search);
	const listParam = search.get("list");
	const list = LISTS.find((l) => l.query === listParam) ?? LISTS[0];
	activateListSelect(container, list.query);
	setLoading(container, true);
	const result = await fetchCSV(list.path);
	if (result.length === 0) {
		console.error("Got empty CSV");
		return;
	}
	setLoading(container, false);
	renderVocabList(container, result);

	const checkBtn = document.querySelector("button#check");
	if (!checkBtn) {
		console.warn("Unable to find check button");
		return;
	}

	checkBtn.addEventListener("click", () => {
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
		} else {
			checkBtn.textContent = "Check";
		}
	});

	const revealBtn = document.querySelector("button#reveal");
	if (!revealBtn) {
		console.warn("Unable to find reveal button");
		return;
	}
	revealBtn.addEventListener("click", () => {
		const inputs = findInputs();
		for (const input of inputs) {
			const expected = input.name;
			input.value = expected;
		}
	});

	const refreshBtn = document.querySelector("button#refresh");
	if (!refreshBtn) {
		console.warn("Unable to find refresh button");
		return;
	}
	refreshBtn.addEventListener("click", () => {
		const index = getRandomIndex(result.length);
		clearChildren(container);
		renderQuizlet(container, result[index]);
		checkBtn.textContent = "Check";
	});
}

main();
