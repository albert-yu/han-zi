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

		div.innerHTML = `
      <span class="han-display">${w}</span>
			<div class="pinyin-input-group">
 	      <input type="text" name="${pinyinWord}" >
 	      <span>hi</span>
			</div>
		`;

		fragment.appendChild(div);
	}
	container.appendChild(fragment);

	// handle check after input
	const checkBtn = document.querySelector("button#check");
	if (!checkBtn) {
		console.warn("Unable to find check button");
		return;
	}

	checkBtn.addEventListener("click", () => {
		const inputs = findInputs();
		let ok = true;
		for (const input of inputs) {
			const value = input.value.toLowerCase();
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
}

main();
