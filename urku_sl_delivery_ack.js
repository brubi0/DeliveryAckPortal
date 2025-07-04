/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @Author Bruno Rubio, DMI, INC.
 * @Version 5.0.0
 */
define(['N/ui/serverWidget', 'N/record', 'N/file', 'N/search', 'N/runtime', 'N/email', 'N/url', 'N/format'],
    (serverWidget, record, file, search, runtime, email, url, format) => {

        const onRequest = (context) => {
            const request = context.request;
            const response = context.response;
            const action = request.parameters.custpage_action;

            if (action === 'send_email') {
                handleSendEmail(request, response);
                return;
            }

            if (request.method === 'GET') {
                handleGet(request, response);
            } else if (request.method === 'POST') {
                handlePost(request, response);
            }
        };

        const handleSendEmail = (request, response) => {
            // ... (This function remains the same)
            const recordId = request.parameters.recordId;
            const tranId = request.parameters.tranid;
            const recipientId = request.parameters.recipientId;
            const senderId = 1888; 

            const suiteletUrl = url.resolveScript({
                scriptId: 'customscript2774',
                deploymentId: 'customdeploy1',
                returnExternalUrl: true
            });
            const fullUrl = `${suiteletUrl}&recordId=${recordId}&tranid=${tranId}`;

            try {
                email.send({
                    author: senderId,
                    recipients: recipientId,
                    subject: `Please Acknowledge Delivery for Shipment #${tranId}`,
                    body: `Dear Valued Customer,\n\nPlease click the link below to acknowledge receipt of the goods for shipment #${tranId}.\n\n<a href="${fullUrl}">Click Here to Acknowledge Delivery</a>\n\nThank you,\nDMI, INC.`,
                    relatedRecords: {
                        transactionId: recordId
                    }
                });
                // THIS IS THE CHANGE: Added a "Go Back" button to the success message
                let successHtml = `
                    <h1>Email Sent Successfully</h1>
                    <p>The acknowledgment email has been sent. You can close this window.</p>
                    <br>
                    <button onclick="history.back()">Go Back</button>
                `;
                response.write(successHtml);

            } catch(e) {
                response.write(`<h1>Error Sending Email</h1><p>The following error occurred: ${e.message}</p>`);
            }
        };

        const handleGet = (request, response) => {
            const recordId = request.parameters.recordId;
            const tranId = request.parameters.tranid;

            if (!recordId) {
                response.write('<h1>Error</h1><p>Transaction ID not found. Please contact support.</p>');
                return;
            }

            // Get Today's Date Formatted
            const today = format.format({ value: new Date(), type: format.Type.DATE });

            const form = serverWidget.createForm({ title: `Delivery Acknowledgment for: ${tranId}` });
            form.clientScriptModulePath = './urku_cs_delivery_ack_helper.js';

            // THIS IS THE CHANGE: New form layout emulating your image
            let formLayoutHtml = `
                <style>
                    .ack-table { border-collapse: collapse; width: 100%; max-width: 800px; font-family: sans-serif; font-size: 14px; }
                    .ack-table td { padding: 8px; }
                    .label { font-weight: bold; width: 15%; }
                    .field-line { border: none; border-bottom: 1px solid #333; width: 100%; padding: 5px 0; }
                    .signature-pad-container { border: 1px solid #ccc; background-color: #f9f9f9; width: 100%; height: 100px; }
                    #signature-pad { width: 100%; height: 100%; }
                </style>
                <table class="ack-table">
                    <tr>
                        <td class="label">Received By: Print Name:</td>
                        <td><input type="text" name="custpage_ack_by_name" class="field-line"></td>
                        <td class="label">Delivered By: Print Name:</td>
                        <td><input type="text" class="field-line" value="Jose Torres" disabled></td>
                    </tr>
                    <tr>
                        <td class="label">Signature:</td>
                        <td><div class="signature-pad-container"><canvas id="signature-pad"></canvas></div><input type="hidden" name="custpage_signature_data" id="custpage_signature_data"></td>
                        <td class="label">Date:</td>
                        <td><input type="text" class="field-line" value="${today}" disabled></td>
                    </tr>
                    <tr>
                        <td class="label">Title & Phone:</td>
                        <td><input type="text" name="custpage_ack_by_title_phone" class="field-line"></td>
                        <td colspan="2"><button type="button" id="clear-signature" style="margin-top:5px;">Clear Signature</button></td>
                    </tr>
                </table>
            `;
            
            form.addField({ id: 'custpage_form_html', type: serverWidget.FieldType.INLINEHTML, label: ' ' }).defaultValue = formLayoutHtml;
            form.addField({ id: 'custpage_record_id', type: serverWidget.FieldType.TEXT, label: ' ' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN }).defaultValue = recordId;
            form.addSubmitButton({ label: 'Submit Acknowledgment' });

            response.writePage(form);
        };

        const handlePost = (request, response) => {
            const recordId = request.parameters.custpage_record_id;
            const signatureData = request.parameters.custpage_signature_data;
            const receivedByName = request.parameters.custpage_ack_by_name; // Capture new field
            const receivedByTitle = request.parameters.custpage_ack_by_title_phone; // Capture new field

            if (!signatureData || signatureData.length < 100) {
                response.write('<h1>Error</h1><p>A signature is required.</p>');
                return;
            }

            try {
                const formattedDate = format.format({ value: new Date(), type: format.Type.DATE });

                const updateValues = {
                    'custbody_urku_delivery_acknowledged': true,
                    'custbody_urku_ack_date': formattedDate,
                    'custbody_urku_ack_by_name': receivedByName, // Add to save object
                    'custbody_urku_ack_by_title_phone': receivedByTitle // Add to save object
                };

                if (signatureData && signatureData.length > 100) {
                    const signatureFile = file.create({
                        name: `Signature_IF_${recordId}.png`,
                        fileType: file.Type.PNGIMAGE,
                        contents: signatureData.split(',')[1],
                        folder: 7600
                    });
                    const fileId = signatureFile.save();
                    const fileUrl = file.load({ id: fileId }).url;
                    updateValues['custbody_urku_signature_file_link'] = `https://` + runtime.accountId + fileUrl;
                }

                record.submitFields({
                    type: record.Type.ITEM_FULFILLMENT,
                    id: recordId,
                    values: updateValues
                });

                response.write('<h1>Thank You!</h1><p>Your acknowledgment has been successfully recorded.</p>');
            } catch (e) {
                log.error('Submission Error', `Record ID: ${recordId} | Error: ${e.message}`);
                response.write(`<h1>Error</h1><p>An error occurred while submitting your acknowledgment. Please contact support.</p><p><i>Details: ${e.message}</i></p>`);
            }
        };

        return { onRequest };
    });