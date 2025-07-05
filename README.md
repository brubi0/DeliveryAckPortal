# NetSuite Delivery Acknowledgment Portal

**Author:** Bruno Rubio, Urku Consulting, LLC
**Version:** 2.0.0

## Overview

This NetSuite application provides a streamlined, paperless solution for customers to acknowledge receipt of goods and for internal users to print a signed delivery note. It adds context-sensitive buttons to the Item Fulfillment record to manage the entire acknowledgment lifecycle.

## Features

* **Context-Aware Buttons:** Adds a "Send Acknowledgment Email" button to unacknowledged records and a "Print Signed Delivery Note" button to acknowledged records.
* **External Signature Page:** Generates a secure, external webpage for customers to provide their name, title, and a captured digital signature.
* **Automated Data Capture:** Automatically saves all acknowledgment data back to the corresponding Item Fulfillment record.
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
* **Preferred:** Checked
* **Note the Internal ID** of this template after saving.

### Saved Scripts

This application consists of three essential script files.

| File Name                         | Script Type       | Deployment                            |
| :-------------------------------- | :---------------- | :------------------------------------ |
| `urku_ue_add_ack_button.js`       | User Event Script | Deployed to **Item Fulfillment** Record |
| `urku_sl_delivery_ack.js`         | Suitelet          | Deployed as a Page/Form               |
| `urku_cs_delivery_ack_helper.js`  | Client Script     | Not Deployed (Called by Suitelet)     |

---

## Deployment & Configuration

Follow these steps to deploy the application.

### 1. Initial Setup

1.  Create the six custom fields and the Advanced PDF/HTML template as detailed above.
2.  Create a folder in the File Cabinet for signature images (e.g., "Delivery Signatures").
3.  Update the `urku_sl_delivery_ack.js` script to replace the placeholder `folder:` and `templateId:` values with your correct internal IDs.

### 2. Upload Scripts

1.  Create a folder in the File Cabinet for this project (e.g., `/SuiteScripts/DeliveryAckPortal`).
2.  Upload the three script files to this folder.

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
2.  If unacknowledged, click **"Send Acknowledgment Email"**. A confirmation page appears, and an email is sent to the customer.
3.  The customer clicks the link, fills out the form, and submits their signature.
4.  The Item Fulfillment record is updated with the acknowledgment data.
5.  If you now view the same Item Fulfillment, the button will have changed to **"Print Signed Delivery Note"**.
6.  Clicking this button generates and downloads the final, signed PDF.