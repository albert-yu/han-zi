async function fetchCSV() {
	const resp = await fetch("./phrases/intro.csv");
	const text = await resp.text();
	const rows = text.split("\n").filter((line) => !!line);
	const csvArray = rows.map((row) => row.split(","));
	console.log("csvArray", csvArray);
}

function main() {
	fetchCSV();
}

main();
