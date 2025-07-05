/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @Author Bruno Rubio, Urku Consulting, LLC
 */
define(['N/url'], (url) => {

    const beforeLoad = (context) => {
        if (context.type !== context.UserEventType.VIEW || !context.form) {
            return;
        }

        const currentRecord = context.newRecord;
        const status = currentRecord.getValue({ fieldId: 'shipstatus' });
        const isAcknowledged = currentRecord.getValue({ fieldId: 'custbody_urku_delivery_acknowledged' });

        if (status !== 'C') {
            return;
        }
        
        if (!isAcknowledged) {
            // This now generates a relative URL, resolving the "Failed to fetch" error.
            const suiteletUrl = url.resolveScript({
                scriptId: 'customscript2774',
                deploymentId: 'customdeploy1',
                // returnExternalUrl: true,  <-- THIS LINE HAS BEEN REMOVED
                params: {
                    'custpage_action': 'send_email',
                    'recordId': currentRecord.id,
                    'tranid': currentRecord.getValue({ fieldId: 'tranid' }),
                    'recipientId': currentRecord.getValue({ fieldId: 'entity' })
                }
            });

            const buttonField = context.form.addField({
                id: 'custpage_send_ack_email_btn',
                type: 'inlinehtml',
                label: ' '
            });

            buttonField.defaultValue = `
                <script>
                    function sendAckEmail(url) {
                        fetch(url)
                            .then(response => {
                                if (!response.ok) {
                                    throw new Error('Network request failed with status: ' + response.status);
                                }
                                window.location.reload();
                            })
                            .catch(error => {
                                console.error('Error sending acknowledgment email:', error);
                                alert('Failed to send email: ' + error.message);
                            });
                    }
                </script>
                <input type="button" class="uir-button" value="Send Acknowledgment Email" onclick="sendAckEmail('${suiteletUrl}')" />
            `;

        } else {
            const suiteletUrl = url.resolveScript({
                scriptId: 'customscript2774',
                deploymentId: 'customdeploy1',
                params: {
                    'custpage_action': 'print_note',
                    'recordId': currentRecord.id
                }
            });

            const printButtonField = context.form.addField({
                id: 'custpage_print_ack_btn_html',
                type: 'inlinehtml',
                label: ' '
            });

            printButtonField.defaultValue = `<input type="button" class="uir-button" value="Print Signed Delivery Note" onclick="window.open('${suiteletUrl}');" />`;
        }
    };

    return { beforeLoad };
});