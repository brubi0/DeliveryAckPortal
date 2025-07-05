/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @Author Bruno Rubio, Urku Consulting, LLC
 */
define(['N/ui/message', 'N/url'], (message, url) => {

    function pageInit(context) {
        // Use a short delay to ensure the entire page has loaded before searching for the button
        setTimeout(function() {
            console.log("Attempting to find button with ID: custpage_send_ack_email_btn_html");
            const sendButton = document.getElementById('custpage_send_ack_email_btn_html');
            console.log("Button element found:", sendButton); // This should show the element, not null

            if (sendButton) {
                console.log("Attaching click handler to button.");
                sendButton.onclick = function() {
                    const suiteletUrl = sendButton.dataset.url;
                    sendEmailInBackground(suiteletUrl);
                    return false;
                };
            } else {
                console.error("ERROR: Could not find the 'Send Acknowledgment Email' button element on the page.");
            }
        }, 500); // Wait 500 milliseconds
    }

    function sendEmailInBackground(suiteletUrl) {
        let msg = message.create({
            title: 'Processing',
            message: 'Sending acknowledgment email...',
            type: message.Type.INFORMATION
        });
        msg.show();

        fetch(suiteletUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok. Status: ' + response.status);
                }
                window.location.reload();
            })
            .catch(error => {
                console.error('Error sending email:', error);
                msg.hide();
                alert('An error occurred while sending the email. Please check the console for details.');
            });
    }

    return {
        pageInit: pageInit
    };
});