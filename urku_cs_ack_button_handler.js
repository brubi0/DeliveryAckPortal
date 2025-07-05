/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @Author Bruno Rubio, Urku Consulting, LLC
 */
define(['N/ui/message'], (message) => {

    function pageInit(context) {
        // Find the NetSuite field that contains our button.
        const fieldContainer = document.getElementById('custpage_send_ack_email_btn_fs');
        
        if (fieldContainer) {
            // Find the button *inside* that field container.
            const sendButton = fieldContainer.querySelector('input[type="button"]');

            if (sendButton) {
                // If the button is found, attach the click action.
                sendButton.onclick = function() {
                    displayTestMessage();
                };
            }
        }
    }

    function displayTestMessage() {
        message.create({
            title: 'Button Click Successful!',
            message: 'The click handler is now attached and working correctly.',
            type: message.Type.CONFIRMATION,
            duration: 5000 
        }).show();
    }

    return {
        pageInit: pageInit
    };
});