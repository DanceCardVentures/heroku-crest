"use strict";

var _mongodb = require("mongodb");

const moment = require("moment");

let daterange = function (start_date, end_date) {
	start_date = moment(start_date, "YYYY-MM-DD");
	end_date = moment(end_date, "YYYY-MM-DD");

	let cur_date = moment(start_date.format());
	let dates_array = [];

	while (cur_date <= end_date) {
		dates_array.push(cur_date.format("YYYY-MM-DD"));
		cur_date = cur_date.add(1, 'd');
	}

	return dates_array;
};

let count_unanswered = function (calls) {
	let unanswered = 0;
	calls.map(function (call) {
		if (call.answered_status == "no answer") {
			unanswered += 1;
		}
	});
	return unanswered;
};

let count_busy = function (calls) {
	let busy = 0;
	calls.map(function (call) {
		if (call.answered_status == "busy") {
			busy += 1;
		}
	});
	return busy;
};

let longest_call = function (calls) {
	let longest = Number(calls[0].ring_time) + Number(calls[0].talk_time);
	calls.map(function (call) {
		let time = Number(call.ring_time) + Number(call.talk_time);
		if (time > longest) {
			longest = time;
		}
	});
	return longest;
};

let shortest_call = function (calls) {
	let shortest = Number(calls[0].ring_time) + Number(calls[0].talk_time);
	calls.map(function (call) {
		let time = Number(call.ring_time) + Number(call.talk_time);
		if (time < shortest) {
			shortest = time;
		}
	});
	return shortest;
};

let average_call = function (calls) {
	let total = 0;
	let num_calls = 0;
	let average = 0;
	calls.map(function (call) {
		num_calls += 1;
		total += Number(call.ring_time) + Number(call.talk_time);
	});

	average = total / num_calls;
	return average;
};

let total_call = function (calls) {
	let total = 0;
	calls.map(function (call) {
		total += Number(call.ring_time) + Number(call.talk_time);
	});

	return total;
};
const uri = "mongodb://odata:fuschia15@candidate.16.mongolayer.com:11191,candidate.53.mongolayer.com:10476/egsilluminate?replicaSet=set-56175c28d33e9791510008ee";

_mongodb.MongoClient.connect(uri, function (err, db) {
	if (err) {
		console.log("Error connecting to db: " + err);
	} else {
		console.log("Setting up collections")
		let locations = db.collection("core_location");
		let calls = db.collection("dashboard_calls");
		let call_details = db.collection("CallDetail");

		console.log("Finding Locations")
		locations.find({ foreign_keys: { $exists: true } }).toArray(function (err, locations_fk) {
			if (err) {
				console.log("Error finding locations with fk");
			} else {
				console.log("\t Found locations")
				let dates = daterange("2017-01-01", "2018-01-29");
				dates.map(function (date) {
					locations_fk.map(function (loc_fk) {
						calls.find({ date: date, location_id: loc_fk._id }).toArray(function (err, loc_fk_calls) {
							if (err) {
								console.log("Error finding calls");
							} else {
								if (loc_fk_calls.length > 0) {
									let call_count = loc_fk_calls.length;
									let appointment_count = 0;
									let unanswered_count = count_unanswered(loc_fk_calls);
									let busy_count = count_busy(loc_fk_calls);
									let longest_call_duration = longest_call(loc_fk_calls);
									let shortest_call_duration = shortest_call(loc_fk_calls);
									let average_call_duration = average_call(loc_fk_calls);
									let total_call_duration = total_call(loc_fk_calls);

									let call_detail = {
										Foreign_Key: loc_fk.foreign_keys[0],
										Date: moment(date,"YYYY-MM-DD").format("YYYY-MM-DDThh:mm:ssZ"),
										Call_Count: call_count,
										Appointment_Count: appointment_count,
										Unanswered_Count: unanswered_count,
										Busy_Count: busy_count,
										Longest_Call_Duration: longest_call_duration,
										Shortest_Call_Duration: shortest_call_duration,
										Average_Call_Duration: average_call_duration,
										Total_Call_Duration: total_call_duration
									};
									console.log(date + " - " + loc_fk.foreign_keys[0] + "\n" + JSON.stringify(call_detail, null, "\t"));

									// Insert call detail to db
									call_details.insert(call_detail);
								}
							}
						}); // end calls
					}); // end locations_fk
				}); // end dates
			}
		});
	}
});
