/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @Author Bruno Rubio, Urku Consulting, LLC
 * @Version 7.0.0
 * @Description Final version. Reverted handlePost to use request.parameters for server-side compatibility.
 */
define(['N/ui/serverWidget', 'N/record', 'N/file', 'N/search', 'N/runtime', 'N/email', 'N/url', 'N/format', 'N/render'],
    (serverWidget, record, file, search, runtime, email, url, format, render) => {

        // Main router function
        const onRequest = (context) => {
            const request = context.request;
            const response = context.response;
            const action = request.parameters.custpage_action;

            if (action === 'send_email') {
                handleSendEmail(request, response);
                return;
            } 
            else if (action === 'print_note') {
                handlePrintNote(request, response);
                return;
            }

            if (request.method === 'GET') {
                handleGet(request, response);
            } else if (request.method === 'POST') {
                handlePost(request, response);
            }
        };
        
        const handlePrintNote = (request, response) => {
            const recordId = request.parameters.recordId;
            const templateId = 209;

            const renderer = render.create();
            renderer.setTemplateById({ id: templateId });
            renderer.addRecord({
                templateName: 'record',
                record: record.load({
                    type: record.Type.ITEM_FULFILLMENT,
                    id: recordId
                })
            });

            const pdfFile = renderer.renderAsPdf();
            response.writeFile(pdfFile, true);
        };

        // Sends the initial email to the customer
        const handleSendEmail = (request, response) => {
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
                // -- NO LONGER NEEDED --
                // The client script will handle the user feedback by reloading the page.
                // We just write a simple success response for the fetch() call.
                response.write(JSON.stringify({ success: true }));

            } catch(e) {
                response.write(JSON.stringify({ success: false, error: e.message }));
                response.code = 500;
            }
        };

        const handleGet = (request, response) => {
            const recordId = request.parameters.recordId;
            const tranId = request.parameters.tranid;

            if (!recordId) {
                response.write('<h1>Error</h1><p>Transaction ID not found. Please contact support.</p>');
                return;
            }

            const form = serverWidget.createForm({ title: `Delivery Acknowledgment for: ${tranId}` });
            form.clientScriptModulePath = './urku_cs_delivery_ack_helper.js';

            form.addFieldGroup({ id: 'maingroup', label: 'Acknowledgment Details' });

            let htmlHeader = form.addField({
                id: 'custpage_header_html',
                type: serverWidget.FieldType.INLINEHTML,
                label: ' ',
                container: 'maingroup'
            });
            htmlHeader.defaultValue = `<p style="font-size: 14px;">Please review and acknowledge receipt of goods for transaction <strong>${tranId}</strong>.</p><hr>`;

            const receivedByField = form.addField({
                id: 'custpage_ack_by_name',
                type: serverWidget.FieldType.TEXTAREA,
                label: 'Received By (Print Name)',
                container: 'maingroup'
            });
            receivedByField.isMandatory = true;

            const titleField = form.addField({
                id: 'custpage_ack_by_title_phone',
                type: serverWidget.FieldType.TEXTAREA,
                label: 'Title & Phone',
                container: 'maingroup'
            });

            let signatureHtml = form.addField({
                id: 'custpage_signature_html',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'Signature',
                container: 'maingroup'
            });
            signatureHtml.defaultValue = `
                <style>
                    .signature-pad-container { border: 1px solid #ccc; background-color: #f9f9f9; width: 100%; max-width: 400px; height: 150px; }
                    #signature-pad { width: 100%; height: 100%; }
                </style>
                <div class="signature-pad-container"><canvas id="signature-pad"></canvas></div>
                <button type="button" id="clear-signature" style="margin-top:5px;">Clear Signature</button>
                <input type="hidden" name="custpage_signature_data" id="custpage_signature_data">
            `;
            
            form.addField({ id: 'custpage_record_id', type: serverWidget.FieldType.TEXT, label: ' ' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN }).defaultValue = recordId;
            form.addSubmitButton({ label: 'Submit Acknowledgment' });

            response.writePage(form);
        };

        const handlePost = (request, response) => {
            const recordId = request.parameters.custpage_record_id;
            const signatureData = request.parameters.custpage_signature_data;
            const receivedByName = request.parameters.custpage_ack_by_name;
            const receivedByTitle = request.parameters.custpage_ack_by_title_phone;

            if (!signatureData || signatureData.length < 100) {
                response.write('<h1>Error</h1><p>A signature is required.</p>');
                return;
            }
            if (!receivedByName) {
                response.write('<h1>Error</h1><p>The "Received By: Print Name" field is required.</p>');
                return;
            }

            try {
                const formattedDate = format.format({ value: new Date(), type: format.Type.DATE });

                const updateValues = {
                    'custbody_urku_delivery_acknowledged': true,
                    'custbody_urku_ack_date': formattedDate,
                    'custbody_urku_ack_by_name': receivedByName,
                    'custbody_urku_ack_by_title_phone': receivedByTitle
                };

                if (signatureData && signatureData.length > 100) {
                    const base64Data = signatureData.split(',')[1];
                    updateValues['custbody_urku_signature_base64'] = base64Data;

                    const signatureFile = file.create({
                        name: `Signature_IF_${recordId}.png`,
                        fileType: file.Type.PNGIMAGE,
                        contents: base64Data,
                        folder: 7600
                    });
                    const fileId = signatureFile.save();
                    
                    const host = url.resolveDomain({ hostType: url.HostType.APPLICATION });
                    const fileObj = file.load({ id: fileId });
                    const fullFileUrl = `https://${host}${fileObj.url}`;

                    updateValues['custbody_urku_signature_file_link'] = fullFileUrl;
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