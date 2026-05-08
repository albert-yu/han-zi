async function fetchCSV() {
	const resp = await fetch("./phrases/intro.csv");
	const text = await resp.text();
	// ignore header and empty lines
	const rows = text.split("\n").filter((line, i) => i > 0 && !!line);
	const csvArray = rows.map((row) => row.split(","));
	console.log("csvArray", csvArray);
}

function main() {
	fetchCSV();
}

main();
