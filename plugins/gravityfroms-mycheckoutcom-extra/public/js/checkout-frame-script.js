//add this script on docuent ready
document.addEventListener("DOMContentLoaded", function (event) {

	var card_errors = {},
		error_fields = {};
	card_errors["card-number"] = "Please enter a valid card number";
	card_errors["expiry-date"] = "Please enter a valid expiry date";
	card_errors["cvv"] = "Please enter a valid cvv code";
	var payButton = document.getElementById("pay-button");
	var form = document.getElementById("payment-form");

	Frames.init({
		publicKey: checkout_vars.publicKey,
		style: {
			base: {
				color: "#111111",
				fontFamily: "'Open Sans', sans-serif"
			},
			invalid: "#790000"
		}
	});

	Frames.addEventHandler(
		Frames.Events.CARD_VALIDATION_CHANGED,
		function (event) {
			console.log(event);
			payButton.disabled = !Frames.isCardValid();
		}
	);

	Frames.addEventHandler(
		Frames.Events.FRAME_VALIDATION_CHANGED,
		function (event) {
			console.log(event);
			if (event.isValid || event.isEmpty) {
				error_fields[event.element] = '';
			} else {
				error_fields[event.element] = card_errors[event.element];
			}
			console.log(error_fields);
		}
	);

	Frames.addEventHandler(
		Frames.Events.CARD_TOKENIZED,
		function (event) {
			jQuery('#checkout_payment_token').val(event.token);
			form.submit();
		}
	);

	form.addEventListener("submit", function (event) {
		if (!Frames.isCardValid()) {
			event.preventDefault();
			for (var card_field in error_fields) {
				if (error_fields[card_field] != '') {
					jQuery('#checkout-error').text(card_errors[card_field]).slideDown();
					return false;
				}	
			}
		}
		else if (jQuery('#checkout_payment_token').val() == '') {
			event.preventDefault();
			jQuery('#checkout-error').text('').slideUp();
			Frames.submitCard();
		}
	});
});
