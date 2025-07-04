/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @Author Bruno Rubio, DMI, INC.
 */
define(['N/url'], (url) => {

    const beforeLoad = (context) => {
        if (context.type !== context.UserEventType.VIEW || !context.form) {
            return;
        }

        const form = context.form;
        const currentRecord = context.newRecord;
        const status = currentRecord.getValue({ fieldId: 'shipstatus' });
        const isAcknowledged = currentRecord.getValue({ fieldId: 'custbody_urku_delivery_acknowledged' });

        if (status === 'C' && !isAcknowledged) {
            
            const suiteletUrl = url.resolveScript({
                scriptId: 'customscript2774',
                deploymentId: 'customdeploy1',
                returnExternalUrl: true,
                params: {
                    'custpage_action': 'send_email',
                    'recordId': currentRecord.id,
                    'tranid': currentRecord.getValue({ fieldId: 'tranid' }),
                    'recipientId': currentRecord.getValue({ fieldId: 'entity' })
                }
            });

            const buttonField = form.addField({
                id: 'custpage_send_ack_email_btn_html',
                type: 'inlinehtml',
                label: ' '
            });

            buttonField.defaultValue = `
                <script>
                    function sendAcknowledgmentEmail() {
                        var url = '${suiteletUrl}';
                        window.open(url, '_self');
                    }
                </script>
                <input type="button" class="uir-button" value="Send Acknowledgment Email" onclick="sendAcknowledgmentEmail();" />
            `;
        }
    };

    return { beforeLoad };
});