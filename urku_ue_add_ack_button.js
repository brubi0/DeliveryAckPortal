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

        // Attach the new client script to the form
        context.form.clientScriptModulePath = './urku_cs_ack_button_handler.js';

        const currentRecord = context.newRecord;
        const status = currentRecord.getValue({ fieldId: 'shipstatus' });
        const isAcknowledged = currentRecord.getValue({ fieldId: 'custbody_urku_delivery_acknowledged' });

        if (status !== 'C') { // 'C' is 'Shipped'
            return;
        }
        
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

            const buttonField = context.form.addField({
                id: 'custpage_send_ack_email_btn',
                type: 'inlinehtml',
                label: ' '
            });

            // The button now has a simple ID and a data-url attribute. The client script will handle the click.
            buttonField.defaultValue = `
                <input type="button" id="custpage_send_ack_email_btn_html" class="uir-button" value="Send Acknowledgment Email" data-url="${suiteletUrl}" />
            `;
        } 
        else {
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

            printButtonField.defaultValue = `
                <input type="button" class="uir-button" value="Print Signed Delivery Note" onclick="window.open('${suiteletUrl}');" />
            `;
        }
    };

    return { beforeLoad };
});