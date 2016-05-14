// This is a template for a Node.js scraper on morph.io (https://morph.io)

var cheerio = require("cheerio");
var request = require("request");
var sqlite3 = require("sqlite3").verbose();

function initDatabase(callback) {
	// Set up sqlite database.
	var db = new sqlite3.Database("data.sqlite");
	db.serialize(function() {
		db.run("CREATE TABLE IF NOT EXISTS data (date TEXT, title TEXT, hits TEXT)");
		callback(db);
	});
}

function updateRow(db, value) {
	// Insert some data.
	var statement = db.prepare("INSERT INTO data VALUES ($date, $title, $hits)");
	statement.run(value);
	statement.finalize();
}

function readRows(db) {
	// Read some data.
	db.each("SELECT rowid AS id, name FROM data", function(err, row) {
		console.log(row.id + ": " + row.name);
	});
}

function fetchPage(url, callback) {
	// Use request to read in pages.
	request(url, function (error, response, body) {
		if (error) {
			console.log("Error requesting page: " + error);
			return;
		}

		callback(body);
	});
}

function run(db) {
	// Use request to read in pages.
	fetchPage("http://1www.tnua.edu.tw/news/news.php?class=102", function (body) {
		// Use cheerio to find things in the page with css selectors.
		var $ = cheerio.load(body);
		var elements = $('#RSS_Table_page_news_1 > tbody > tr').each(function (i, row) {
			var obj = {};
			$(row).children().each(function (i, value) {
				if (i === 1) {
					obj.date = $(value).text;
				} else if (i === 2) {
					obj.title = $(value).text;
				} else if (i === 3){
					obj.hits = $(value).text;
				}
			});

			updateRow(db, obj);
		});

		readRows(db);

		db.close();
	});
}

initDatabase(run);
