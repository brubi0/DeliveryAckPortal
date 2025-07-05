/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @Author Bruno Rubio, Urku COnsulting, LLC
 */
define(['N/url'], (url) => {

    const beforeLoad = (context) => {
        // Only run when viewing a record and a form exists
        if (context.type !== context.UserEventType.VIEW || !context.form) {
            return;
        }

        const form = context.form;
        const currentRecord = context.newRecord;

        const status = currentRecord.getValue({ fieldId: 'shipstatus' });
        const isAcknowledged = currentRecord.getValue({ fieldId: 'custbody_urku_delivery_acknowledged' });

        // Only proceed if the record is Shipped
        if (status !== 'C') { // 'C' is the internal ID for 'Shipped'
            return;
        }
        
        // If NOT acknowledged yet, show the "Send Email" button
        if (!isAcknowledged) {
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
                <input type="button" class="uir-button" value="Send Acknowledgment Email" onclick="window.open('${suiteletUrl}', '_self');" />
            `;
        } 
        // If it IS acknowledged, show the "Print" button instead
        else {
            const suiteletUrl = url.resolveScript({
                scriptId: 'customscript2774',
                deploymentId: 'customdeploy1',
                params: { // Note: No returnExternalUrl needed here
                    'custpage_action': 'print_note',
                    'recordId': currentRecord.id
                }
            });

            const printButtonField = form.addField({
                id: 'custpage_print_ack_btn_html',
                type: 'inlinehtml',
                label: ' '
            });

            printButtonField.defaultValue = `
                <input type="button" class="uir-button" value="Print Signed Delivery Note" onclick="window.open('${suiteletUrl}');" />
            `;
        }
    };

    return { beforeLoad };
});