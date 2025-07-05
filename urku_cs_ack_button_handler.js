/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @Author Bruno Rubio, Urku Consulting, LLC
 */
define(['N/ui/message'], (message) => {

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
                // On success, simply reload the page.
                window.location.reload();
            })
            .catch(error => {
                console.error('Error sending email:', error);
                msg.hide();
                alert('An error occurred while sending the email. Please check the console for details.');
            });
    }

    return {
        pageInit: () => {}, // pageInit is required, but we can leave it empty.
        sendEmailInBackground: sendEmailInBackground
    };
});