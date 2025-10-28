jQuery(async function ($) {
	'use strict';
	console.log("jay mataji");
	if (typeof CheckoutWebComponents === 'undefined' || typeof payment_vars === 'undefined') {
		console.error('flow or payment variables are not initialized.');
		return;
	}

	var termsCheckbox = document.getElementById('terms-agreement'); // Get the checkbox
	var public_key = payment_vars.publicKey
	var paymentSession = payment_vars.session
	var environment = payment_vars.environment || 'sandbox';


	const checkout = await CheckoutWebComponents({
		publicKey: public_key,
		paymentSession: paymentSession,
		environment: environment,
		onReady: () => {
			console.log("onReady");
		},
		onPaymentCompleted: (_component, paymentResponse) => {
			console.log("Create Payment : ", paymentResponse);
			$.post(payment_vars.ajax_url, {
				action: 'siteb_process_payment',
				token: paymentResponse.id,
				entry_id: payment_vars.entryId,
				amount: payment_vars.amount,
				currency: payment_vars.currency,
				nonce: payment_vars.nonce
			}).done(function (response) {
				// ++ MODIFIED: Handle 3DS redirect or standard success/fail
				if (response.success) {
					if (response.data && response.data.redirectUrl) {
						// 3DS Challenge: Tell parent window to redirect
						window.parent.postMessage({ status: 'redirect', url: response.data.redirectUrl }, payment_vars.siteAOrigin);
					} else {
						// Standard Success: Tell parent window payment is done

						window.parent.postMessage({ status: 'success' }, payment_vars.siteAOrigin);
					}
				} else {
					// Standard Failure: Show error in iframe and allow retry
					var message = response.data.message || 'Payment failed. Please try again.';
					console.log(message);

				}
			})
				.fail(function () {
					var errorMsg = 'An unexpected server error occurred.';
					console.log(errorMsg);
				})
				.catch(function (error) {
					var errorMsg = 'Invalid card details. Please check your information.';
					console.log(errorMsg);
				});
		},
		onChange: (component) => {
			console.log(
				`onChange() -> isValid: "${component.isValid()}" for "${component.type
				}"`,
			);
		},
		onError: (component, error) => {
			console.log("onError", error, "Component", component.type);
		},
	});
	const flowComponent = checkout.create('flow');
	flowComponent.mount('#flow-container');



	// MODIFIED: Add checkbox change event listener to trigger the popup
	if (termsCheckbox) {
		termsCheckbox.addEventListener('change', function (event) {
			if (event.target.checked) {
				// If checkbox is being checked, show the popup
				showConfirmationPopup();
			} else {
				// If checkbox is being unchecked, update button state immediately
				updatePayButtonState();
			}
		});
	}

	// NEW: Function to display the confirmation popup
	function showConfirmationPopup() {
		termsCheckbox.checked = false;
		updatePayButtonState(); // Disable button until confirmed

		// Create the popup elements
		var popupOverlay = $('<div class="siteb-popup-overlay"></div>');
		var popupContainer = $('<div class="siteb-popup-container"></div>');
		var popupContent = $(`
            <p>Do you confirm the purchase of our assistance service for <strong>$${(payment_vars.amount / 100).toFixed(2)}</strong>?</p>
            <p><strong>This is NOT the official government website.</strong></p>
            <div class="siteb-popup-buttons">
                <button id="siteb-confirm-yes" class="siteb-popup-button siteb-popup-button-confirm">Yes, I confirm</button>
                <button id="siteb-confirm-cancel" class="siteb-popup-button siteb-popup-button-cancel">Cancel</button>
            </div>
        `);

		popupContainer.append(popupContent);
		popupOverlay.append(popupContainer);
		$('body').append(popupOverlay);

		// Add event listeners for popup buttons
		$('#siteb-confirm-yes').on('click', function () {
			termsCheckbox.checked = true; // Check the box
			popupOverlay.remove();
		});

		$('#siteb-confirm-cancel').on('click', function () {
			termsCheckbox.checked = false; // Check the box
			popupOverlay.remove();
		});
	}

});