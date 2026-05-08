/**
 * @param {string} path
 * @returns {Promise<[string, string][]>}
 */
async function fetchCSV(path) {
	const resp = await fetch(path);
	const text = await resp.text();
	// ignore header and empty lines
	const rows = text.split("\n").filter((line, i) => i > 0 && !!line);
	const csvArray = rows.map((row) => row.split(","));
	return csvArray;
}

/**
 * @param {number} max
 */
function getRandomIndex(max) {
	return Math.floor(Math.random() * max);
}

async function main() {
	const result = await fetchCSV("./phrases/intro.csv");
	if (result.length === 0) {
		console.error("Got empty CSV");
		return;
	}
	const container = document.querySelector("#han-container");
	if (!container) {
		console.error("could not find #han-container");
		return;
	}
	const randomIndex = getRandomIndex(result.length);
	const [han, pinyin] = result[randomIndex];

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
		const div = document.createElement("div");
		div.classList.add("han-char");
		const input = document.createElement("input");
		input.type = "text";
		input.name = pinyinWord;
		div.appendChild(sp);
		div.appendChild(input);

		fragment.appendChild(div);
	}
	container.appendChild(fragment);
}

main();
