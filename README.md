# NetSuite Delivery Acknowledgment Portal

**Author:** Bruno Rubio, Urku Consulting, LLC
**Version:** 3.0.0

## Overview

This NetSuite application provides a streamlined, paperless solution for customers to acknowledge receipt of goods and for internal users to print a signed delivery note. It adds a context-sensitive button to the Item Fulfillment record that allows a user to email a signature request to the customer. The customer receives a link to a secure, external webpage where they can review the full delivery details, provide their name and title, and capture their digital signature.

## Features

* **Context-Aware Button:** Adds a "Send Acknowledgment Email" button to "Shipped" Item Fulfillment records. After acknowledgment, this button is replaced with a "Print Signed Delivery Note" button.
* **Background Emailing:** The "Send" button uses an asynchronous background call (AJAX) to send the email, providing a seamless user experience without leaving the transaction page.
* **External Signature Page:** Generates a secure, external webpage for customers. This page displays a full preview of the delivery note—including company branding, shipping details, and a complete itemized list—before prompting for a signature.
* **Automated Data Capture:** Automatically saves the customer's printed name, title, signature image, and acknowledgment date back to the corresponding Item Fulfillment record.
* **Printable PDF Generation:** Creates a formatted PDF document containing all delivery and acknowledgment details, including the captured signature image.

---

## NetSuite Components

### Custom Fields

The following **six** **Transaction Body Fields** must be created and applied to the **Item Fulfillment** record.

| Label                        | ID                                     | Type      | Notes                                                                            |
| :--------------------------- | :------------------------------------- | :-------- | :------------------------------------------------------------------------------- |
| Customer Acknowledgement     | `custbody_urku_delivery_acknowledged`  | Check Box | Automatically checked upon submission.                                           |
| Acknowledgment Date          | `custbody_urku_ack_date`               | Date      | Stores the date of submission.                                                   |
| Signature File Link          | `custbody_urku_signature_file_link`    | Hyperlink | Stores a link to the signature file in the File Cabinet.                         |
| Acknowledged By (Print Name) | `custbody_urku_ack_by_name`            | Text Area | Stores the printed name entered by the customer.                                 |
| Acknowledged By (Title/Phone)| `custbody_urku_ack_by_title_phone`     | Text Area | Stores the title/phone number.                                                   |
| Signature Base64             | `custbody_urku_signature_base64`       | Long Text | Stores the raw image data for reliable PDF printing. **Display Type** should be **Hidden**. |

### Advanced PDF/HTML Template

An Advanced PDF/HTML Template must be created to define the layout of the printable delivery note.

* **Navigate To:** `Customization > Forms > Advanced PDF/HTML Templates > New`
* **Title:** `Delivery Acknowledgment Form` (or similar)
* **Note the Internal ID** of this template after saving.

### Saved Scripts

This application consists of three essential script files.

| File Name                         | Script Type       | Deployment Notes                        |
| :-------------------------------- | :---------------- | :-------------------------------------- |
| `urku_ue_add_ack_button.js`       | User Event Script | Deployed to **Item Fulfillment** Record. Contains embedded client-side logic for the "Send" button. |
| `urku_sl_delivery_ack.js`         | Suitelet          | Deployed as a Page/Form. Needs to be available without login. |
| `urku_cs_delivery_ack_helper.js`  | Client Script     | Not Deployed. Called by the Suitelet to power the signature pad.     |

---

## Deployment & Configuration

Follow these steps to deploy the application.

### 1. Initial Setup

1.  Create the six custom fields and the Advanced PDF/HTML template as detailed above.
2.  Create a folder in the File Cabinet for signature images (e.g., "Delivery Signatures").
3.  Update the `urku_sl_delivery_ack.js` script to replace the placeholder `folder:` and `templateId:` values with your correct internal IDs.

### 2. Upload Scripts

1.  Create a folder in the File Cabinet for this project (e.g., `/SuiteScripts/DeliveryAckPortal`).
2.  Upload the three essential script files to this folder.

### 3. Create and Deploy Scripts

1.  **User Event Script (`urku_ue_add_ack_button.js`):**
    * Create a Script record and a Deployment with these settings:
        * **Applies To:** Item Fulfillment
        * **Status:** Released
        * **Execute as Role:** Administrator

2.  **Suitelet (`urku_sl_delivery_ack.js`):**
    * Create a Script record and a Deployment with these settings:
        * **Status:** Released
        * **Execute as Role:** Administrator
        * **Available without Login:** **True** (Checked)
        * **Audience (subtab) > Roles:** Add the **Online Form User** role.

3.  **Client Script (`urku_cs_delivery_ack_helper.js`):**
    * Create a Script record. No deployment is necessary.

---

## Usage

1.  Navigate to a "Shipped" Item Fulfillment record.
2.  If unacknowledged, click **"Send Acknowledgment Email"**. The page will briefly reload, confirming the email has been sent in the background.
3.  The customer receives an email and clicks the link.
4.  The customer sees a full preview of the delivery note, fills out the acknowledgment form, and submits their signature.
5.  The Item Fulfillment record is automatically updated with the acknowledgment data.
6.  If you now view the same Item Fulfillment, the button will have changed to **"Print Signed Delivery Note"**.
7.  Clicking this button generates and downloads the final, signed PDF.