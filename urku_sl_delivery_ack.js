/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @Author Bruno Rubio, Urku Consulting, LLC
 * @Version 1.03
 * @Description Saves PDF to File Cabinet and links it via a custom hyperlink field.
 */
define(['N/ui/serverWidget', 'N/record', 'N/file', 'N/runtime', 'N/email', 'N/url', 'N/format', 'N/render', 'N/config'],
    (serverWidget, record, file, runtime, email, url, format, render, config) => {

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
            const folderId = 7604; // Folder for the final PDF

            const fulfillmentRecord = record.load({
                type: record.Type.ITEM_FULFILLMENT,
                id: recordId
            });

            const renderer = render.create();
            renderer.setTemplateById({ id: templateId });
            renderer.addRecord({
                templateName: 'record',
                record: fulfillmentRecord
            });

            const pdfFile = renderer.renderAsPdf();
            const tranId = fulfillmentRecord.getValue('tranid');
            pdfFile.name = `Signed_Delivery_Note_${tranId}.pdf`;
            pdfFile.folder = folderId;

            try {
                // Save the PDF to the File Cabinet
                const fileId = pdfFile.save();
                
                // Get the full URL of the new file
                const host = url.resolveDomain({ hostType: url.HostType.APPLICATION });
                const fileObj = file.load({ id: fileId });
                const fullFileUrl = `https://${host}${fileObj.url}`;

                // Update the custom hyperlink field on the Item Fulfillment record
                record.submitFields({
                    type: record.Type.ITEM_FULFILLMENT,
                    id: recordId,
                    values: {
                        'custbody_urku_signed_pdf_link': fullFileUrl
                    }
                });

            } catch (e) {
                log.error('PDF Save/Link Error', `Failed to save or link PDF for IF ID ${recordId}. Error: ${e.message}`);
            }
            
            // Serve the file for download to the user
            response.writeFile(pdfFile, true);
        };

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

            const fulfillmentRecord = record.load({
                type: record.Type.ITEM_FULFILLMENT,
                id: recordId,
                isDynamic: true
            });
            
            const companyLogoUrl = 'https://507081-sb1.app.netsuite.com/core/media/media.nl?id=5053&c=507081_SB1&h=nor3AjnlRLfn1tT9M_IieTtlPLn6ESwzTrWKpQhk9hGrG9pF';
            const companyAddress = '4611 S. University Dr. Suite #435, Davie FL 33328<br>Tel. (954) 538-3808, Fax. (866) 794-7520<br>www.dmimedical-usa.com';

            const form = serverWidget.createForm({ title: `Delivery Acknowledgment for: ${tranId}` });
            form.clientScriptModulePath = './urku_cs_delivery_ack_helper.js';

            let fullHtml = form.addField({
                id: 'custpage_full_form_html',
                type: serverWidget.FieldType.INLINEHTML,
                label: ' '
            });

            let itemTable = '';
            const lineCount = fulfillmentRecord.getLineCount({ sublistId: 'item' });
            for (let i = 0; i < lineCount; i++) {
                const itemName = fulfillmentRecord.getSublistText({ sublistId: 'item', fieldId: 'item', line: i });
                const description = fulfillmentRecord.getSublistValue({ sublistId: 'item', fieldId: 'description', line: i });
                const quantity = fulfillmentRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
                const inventoryDetail = fulfillmentRecord.getSublistValue({ sublistId: 'item', fieldId: 'inventorydetail', line: i });
                const expDate = fulfillmentRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_dmi_expiration_date', line: i });
                
                itemTable += `
                    <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #ccc;">${itemName}</td>
                        <td style="padding: 5px; border-bottom: 1px solid #ccc;">${description}</td>
                        <td style="padding: 5px; border-bottom: 1px solid #ccc;">${inventoryDetail}</td>
                        <td style="padding: 5px; border-bottom: 1px solid #ccc;">${expDate}</td>
                        <td style="padding: 5px; border-bottom: 1px solid #ccc;" align="right">${quantity}</td>
                    </tr>
                `;
            }

            fullHtml.defaultValue = `
                <style>
                    body { font-family: sans-serif; color: #333; }
                    .main-container { max-width: 800px; margin: auto; }
                    .header-table, .details-table, .items-table, .ack-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    .header-table td { vertical-align: top; }
                    .details-box { border: 1px solid #ccc; padding: 5px; }
                    .details-box th, .details-box td { border: 1px solid #ccc; padding: 5px; text-align: center; font-size: 9pt; }
                    .items-table th { background-color: #f2f2f2; text-align: left; padding: 8px; border-bottom: 2px solid #ccc; }
                    .ack-table td { padding: 8px; vertical-align: top; }
                    .ack-table textarea { width: 100%; min-height: 40px; }
                    .signature-pad-container { border: 1px solid #ccc; background-color: #f9f9f9; width: 100%; max-width: 400px; height: 150px; }
                    #signature-pad { width: 100%; height: 100%; }
                </style>
                <div class="main-container">
                    <table class="header-table">
                        <tr>
                            <td style="width: 60%;">
                                <img src="${companyLogoUrl}" style="width: 15%; height: 15%; margin-bottom: 10px;" />
                                <p style="font-size: 9pt;">${companyAddress}</p>
                            </td>
                            <td style="width: 40%; text-align: right;">
                                <h1 style="font-size: 24pt;">Delivery Note</h1>
                                <table class="details-box" style="width: 100%; margin-top: 10px;">
                                    <tr><th>Date</th><th>Our Reference</th></tr>
                                    <tr><td>${fulfillmentRecord.getText('trandate')}</td><td>${fulfillmentRecord.getValue('tranid')}</td></tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                    <table class="details-table">
                        <tr>
                            <td style="width: 50%; vertical-align: top; font-size: 9pt;">
                                <b>Address</b><br/>
                                ${fulfillmentRecord.getValue('shipaddress')}
                            </td>
                            <td style="width: 50%; vertical-align: top;">
                                 <table class="details-box" style="width: 100%;">
                                    <tr>
                                        <td><b>Customer PO</b><br/>${fulfillmentRecord.getValue({fieldId: 'otherrefnum', join: 'createdFrom'}) || ''}</td>
                                        <td><b>SO Number</b><br/>${fulfillmentRecord.getText({fieldId: 'tranid', join: 'createdFrom'}) || ''}</td>
                                    </tr>
                                     <tr>
                                        <td><b>Via</b><br/>${fulfillmentRecord.getText('shipmethod') || ''}</td>
                                        <td><b>Incoterms</b><br/>${fulfillmentRecord.getText({fieldId: 'custbody2', join: 'createdFrom'}) || ''}</td>
                                     </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th style="width: 25%;">Items</th>
                                <th style="width: 35%;">Description</th>
                                <th style="width: 15%;">Batch No.</th>
                                <th style="width: 15%;">Exp. Date</th>
                                <th style="width: 10%;" align="right">Quantity</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemTable}
                        </tbody>
                    </table>
                    <hr style="margin-top: 30px;"/>
                    <h2>Acknowledgment Details</h2>
                    <table class="ack-table">
                        <tr>
                            <td style="width: 20%;"><b>Received By (Print Name) *</b></td>
                            <td><textarea name="custpage_ack_by_name" required></textarea></td>
                        </tr>
                        <tr>
                            <td><b>Title & Phone</b></td>
                            <td><textarea name="custpage_ack_by_title_phone"></textarea></td>
                        </tr>
                         <tr>
                            <td><b>Signature</b></td>
                            <td>
                                <div class="signature-pad-container"><canvas id="signature-pad"></canvas></div>
                                <button type="button" id="clear-signature" style="margin-top:5px;">Clear Signature</button>
                                <input type="hidden" name="custpage_signature_data" id="custpage_signature_data">
                            </td>
                        </tr>
                    </table>
                </div>
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