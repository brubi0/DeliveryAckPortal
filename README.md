# NetSuite Delivery Acknowledgment Portal

**Author:** Bruno Rubio, Urku Consulting, LLC
**Version:** 2.0.0

## Overview

This NetSuite application provides a streamlined, paperless solution for customers to acknowledge receipt of goods and for internal users to archive and retrieve a signed delivery note. It adds context-sensitive buttons to the Item Fulfillment record to manage the entire acknowledgment lifecycle.

## Features

* **Context-Aware Button:** Adds a "Send Acknowledgment Email" button to unacknowledged records and an "Archive Delivery Note" button to acknowledged records.
* **External Signature Page:** Generates a secure, external webpage for customers to provide their name, title, and a captured digital signature, with a full preview of the delivery details.
* **Automated Data Capture:** Automatically saves all acknowledgment data back to the corresponding Item Fulfillment record.
* **PDF Archiving:** When the "Archive Delivery Note" button is clicked, the system generates a final PDF, saves it to the File Cabinet, and places a direct, clickable link to the PDF on the Item Fulfillment record for easy retrieval.

---

## NetSuite Components

### Custom Fields

The following **seven** **Transaction Body Fields** must be created and applied to the **Item Fulfillment** record.

| Label                        | ID                                     | Type      | Notes                                                                            |
| :--------------------------- | :------------------------------------- | :-------- | :------------------------------------------------------------------------------- |
| Customer Acknowledgement     | `custbody_urku_delivery_acknowledged`  | Check Box | Automatically checked upon submission.                                           |
| Acknowledgment Date          | `custbody_urku_ack_date`               | Date      | Stores the date of submission.                                                   |
| Signature File Link          | `custbody_urku_signature_file_link`    | Hyperlink | Stores a link to the signature PNG file in the File Cabinet.                     |
| **Signed Delivery Note PDF** | **`custbody_urku_signed_pdf_link`** | **Hyperlink** | **Stores a direct link to the final, signed PDF in the File Cabinet.** |
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
| `urku_ue_add_ack_button.js`       | User Event Script | Deployed to **Item Fulfillment** Record. Contains embedded client-side logic. |
| `urku_sl_delivery_ack.js`         | Suitelet          | Deployed as a Page/Form. Needs to be available without login. |
| `urku_cs_delivery_ack_helper.js`  | Client Script     | Not Deployed. Called by the Suitelet to power the signature pad.     |

---

## Deployment & Configuration

Follow these steps to deploy the application.

### 1. Initial Setup

1.  Create the seven custom fields and the Advanced PDF/HTML template as detailed above.
2.  Create a folder in the File Cabinet for signature images (e.g., "Delivery Signatures") and one for the final PDFs (e.g., "Signed Delivery Notes").
3.  Update the `urku_sl_delivery_ack.js` script to replace the placeholder `folder:` values with your correct internal IDs.

### 2. Upload Scripts

1.  Upload the three essential script files to your project folder in the File Cabinet.

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