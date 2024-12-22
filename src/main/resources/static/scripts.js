var BASE_URL = "http://127.0.0.1:8085/"
if (location.hostname.indexOf('localhost') >= 0 ||
	location.hostname.indexOf('127.0.0.1') >= 0)
	BASE_URL = "http://127.0.0.1:8085/";
else BASE_URL = "http://ttp.chat";
var token = null
var accountId = null;
var gameItemNameMap = null;

function addToConsole(message) {
	var txt = $("#gcn-events")
	txt.val(txt.val() + "\n" + JSON.stringify(message, null, 4) + "\n")
	txt.scrollTop(txt[0].scrollHeight)
}

function getAddChestButton(accountUuid) {
	var button = $("<button>");
	button.text("Add Vault Chest")
	button.on("click", function(event) {
		$.postJSON(BASE_URL + "data/account/" + accountUuid + "/chest/new", null, function(data) {
			addToConsole(data)
		})
	})
	return button;
}

function getAddCharacterButton(accountUuid) {
	var button = $("<button>");
	button.text("Create Character")
	button.on("click", function(evt) {
		let classId = prompt("Character Class - ROGUE(0), ARCHER(1), WIZARD(2), PRIEST(3), WARRIOR(4), KNIGHT(5), PALLADIN(6)");
		//if(!classId || Number.parseInt(classId)) return;
		$.postJSON(BASE_URL + "data/account/" + accountUuid + "/character?classId=" + classId, null, function(data) {
			addToConsole(data)
		})
	})
	return button;
}
function getClassNameFromId(classId) {
	var res = null;
	switch (classId) {
		case 0:
			res = "Rogue";
			break;
		case 1:
			res = "Archer";
			break;
		case 2:
			res = "Wizard";
			break;
		case 3:
			res = "Priest";
			break;
		case 4:
			res = "Warrior";
			break;
		case 5:
			res = "Knight";
			break;
		case 6:
			res = "Palladin";
			break;
	}
	return res;
}
function login() {
	var login = { "email": $("#user-email").val(), "password": $("#user-pass").val() }
	$.postJSON(BASE_URL + "admin/account/login", login, function(data) {
		token = data.token;
		accountId = data.accountGuid;
		addToConsole(data)
		$("#content-pane").append(getAddChestButton(accountId));
		$("#content-pane").append(getAddCharacterButton(accountId));
		$.getJSON(BASE_URL + "gamedata/item", function(data) {
			gameItemNameMap = data;

		});

		$.getJSON(BASE_URL + "data/account/" + accountId + "/character", function(data) {
			addToConsole(data)
			var tab = $('#example').DataTable({
				data: data,
				select: true,

				columns: [

					{ data: 'characterUuid' },
					{
						data: 'characterClass',
						render: function(dat, typ) {
							return getClassNameFromId(dat)
						}
					},
					{
						data: 'items',
						render: function(dat, typ) {
							dat.sort(compare);
							var data = "";
							for (var i = 0; i < dat.length; i++) {
								var item = dat[i];
								data += (gameItemNameMap[item.itemId].name + '<br>');
							}
							return data;
						}
					},
					{
						data: 'stats',
						render: function(dat, typ) {
							return ` HP: ${dat.hp}<br> MP: ${dat.mp}<br> ATT: ${dat.att}<br> DEF: ${dat.def}<br> SPD: ${dat.spd}<br> DEX: ${dat.dex}<br> VIT: ${dat.vit}<br> WIS: ${dat.wis}<br>`
						}
					},
					{ data: 'stats.xp' }
				]
			});
			tab.on('click', 'tbody tr', function(e, dt, type, indexes) {
				var login = { "email": $("#user-email").val(), "password": $("#user-pass").val() }

				e.currentTarget.classList.toggle('selected');
				let data = tab.row(e.target.closest('tr')).data();
				alert(`-client 127.0.0.1 ${login.email} ${login.password} ${data.characterUuid}`)
				e.currentTarget.classList.toggle('selected');
			});
		})
	})
}
function compare(item0, item1) {
	if (item0.slotIdx < item1.slotIdx) {
		return -1;
	}
	if (item0.slotIdx > item1.slotIdx) {
		return 1;
	}
	return 0;
}
function createAccount() {
	let accountName = prompt('Account Name');
	if (!accountName) {
		addToConsole({ "error": "Invalid Account Name" })
	}
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
