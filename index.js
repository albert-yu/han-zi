async function fetchCSV(path) {
	const resp = await fetch(path);
	const text = await resp.text();
	// ignore header and empty lines
	const rows = text.split("\n").filter((line, i) => i > 0 && !!line);
	const csvArray = rows.map((row) => row.split(","));
	return csvArray;
}

async function main() {
	const root = document.querySelector("#app");
	if (!root) {
		console.error("could not find #app root");
		return;
	}
	const result = await fetchCSV("./phrases/intro.csv");
	console.log("csv", result);
}

main();
