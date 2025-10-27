jQuery(function ($) {
    'use strict';

    if (typeof Frames === 'undefined' || typeof payment_vars === 'undefined') {
        console.error('Frames.js or payment variables are not initialized.');
        return;
    }

    var form = document.getElementById('payment-form');
    var payButton = document.getElementById('pay-button');
    var errorMessage = document.getElementById('error-message');

    Frames.init(payment_vars.publicKey, {
        style: {
            base: {
                color: '#2d3748',
                fontSize: '16px',
                fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
                padding: '12px',
                border: '1px solid #cbd5e0',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                transition: 'all 0.3s ease'
            },
            focus: {
                borderColor: '#3182ce',
                boxShadow: '0 0 0 1px #3182ce'
            },
            valid: {
                color: '#48bb78',
                borderColor: '#48bb78'
            },
            invalid: {
                color: '#e53e3e',
                borderColor: '#e53e3e'
            },
            placeholder: {
                color: '#a0aec0'
            }
        }
    });

    Frames.addEventHandler(
        Frames.Events.CARD_VALIDATION_CHANGED,
        function (event) {
            payButton.disabled = !Frames.isCardValid();
        }
    );

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        payButton.disabled = true;
        errorMessage.textContent = '';
        payButton.textContent = 'Processing...';

        Frames.submitCard()
            .then(function (data) {
                $.post(payment_vars.ajax_url, {
                    action: 'siteb_process_payment',
                    token: data.token,
                    entry_id: payment_vars.entryId,
                    amount: payment_vars.amount,
                    currency: payment_vars.currency,
                    nonce: payment_vars.nonce
                })
                    .done(function (response) {
                        // ++ MODIFIED: Handle 3DS redirect or standard success/fail
                        if (response.success) {
                            if (response.data && response.data.redirectUrl) {
                                // 3DS Challenge: Tell parent window to redirect
                                window.parent.postMessage({ status: 'redirect', url: response.data.redirectUrl }, payment_vars.siteAOrigin);
                            } else {
                                // Standard Success: Tell parent window payment is done
                                payButton.textContent = 'Payment Successful!';
                                window.parent.postMessage({ status: 'success' }, payment_vars.siteAOrigin);
                            }
                        } else {
                            // Standard Failure: Show error in iframe and allow retry
                            var message = response.data.message || 'Payment failed. Please try again.';
                            errorMessage.textContent = message;
                            payButton.disabled = false;
                            payButton.textContent = 'Pay Now';
                        }
                    })
                    .fail(function () {
                        var errorMsg = 'An unexpected server error occurred.';
                        errorMessage.textContent = errorMsg;
                        payButton.disabled = false;
                        payButton.textContent = 'Pay Now';
                    });
            })
            .catch(function (error) {
                var errorMsg = 'Invalid card details. Please check your information.';
                errorMessage.textContent = errorMsg;
                payButton.disabled = false;
                payButton.textContent = 'Pay Now';
                Frames.enableSubmitForm();
            });
    });
});