var BASE_URL = "http://localhost:8085/"

var token = null
var accountId = null;


function addToConsole(message) {
	var txt = $("#gcn-events")
	txt.val(txt.val() + "\n" + JSON.stringify(message,null, 4) + "\n")
	txt.scrollTop(txt[0].scrollHeight)
}


function login() {
	var login = { "email": $("#user-email").val(), "password": $("#user-pass").val() }
	$.postJSON(BASE_URL + "admin/account/login", login, function(data) {
		token = data.token;
		accountId = data.accountGuid;
		addToConsole(data)
		
		$.getJSON(BASE_URL + "data/account/"+accountId+"/character", function(data) {
			addToConsole(data)
		})
	})
}

function createAccount() {
	let accountName = prompt('Account Name');
	var acc = { "email": $("#user-email").val(), "password": $("#user-pass").val(), "accountName": accountName, "accountProvisions": ["JREALM"], "accountSubscriptions": ["TRIAL"], "accountProperties": {} }
	$.postJSON(BASE_URL + "admin/account/register", acc, function(data) {
		addToConsole(data);
		login();
	})
}

$.postJSON = function(url, data, callback) {
	var headers = {
		'Accept': 'application/json',
		'Content-Type': 'application/json'
	}
	if (token !== null) {
		headers['Authorization'] = token;
	}
	return jQuery.ajax({
		headers: headers,
		'type': 'POST',
		'url': url,
		'data': JSON.stringify(data),
		'dataType': 'json',
		'success': callback,
		'error': handleError
	})
}

$.patchJSON = function(url, data, callback) {
	var headers = {
		'Accept': 'application/json',
		'Content-Type': 'application/json'
	}
	if (token !== null) {
		headers['Authorization'] = token;
	}
	return jQuery.ajax({
		headers: headers,
		'type': 'PATCH',
		'url': url,
		'data': JSON.stringify(data),
		'dataType': 'json',
		'success': callback,
		'error': handleError
	})
}

$.deleteJSON = function(url, data, callback) {
	var headers = {
		'Accept': 'application/json',
		'Content-Type': 'application/json'
	}

	if (token !== null) {
		headers['Authorization'] = token;
	}

	return jQuery.ajax({
		headers: headers,
		'type': 'DELETE',
		'url': url,
		'data': JSON.stringify(data),
		'dataType': 'json',
		'success': callback,
		'error': handleError
	})
}

$.getJSON = function(url, callback) {
	var headers = {
		'Accept': 'application/json',
		'Content-Type': 'application/json'
	}
	if (token !== null) {
		headers['Authorization'] = token;
	}
	return jQuery.ajax({
		headers: headers,
		'type': 'GET',
		'url': url,
		'dataType': 'json',
		'success': callback,
		'error': handleError
	})
}

$(document).ready(function() {
	BASE_URL = "http://"+prompt('Data Server IP')+":8085/";
	console.log(BASE_URL);
	$.getJSON(BASE_URL + "ping", function(data) {
		addToConsole(data)
	})

	$("#login").on("click", function(event) {
		login()
	})

	$("#create-account").on("click", function(event) {
		createAccount()
	})
})

function handleError(xhr, status, error) {
	addToConsole(xhr.responseJSON);
}
