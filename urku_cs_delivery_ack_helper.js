/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @Author Bruno Rubio, Urku Consulting, LLC
 */
define([], () => {

    function pageInit(context) {
        // Dynamically load the signature pad library from a CDN
        var script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/signature_pad@4.0.0/dist/signature_pad.umd.min.js';
        document.head.appendChild(script);

        script.onload = function() {
            var canvas = document.getElementById('signature-pad');
            var signaturePad = new SignaturePad(canvas, {
                backgroundColor: 'rgb(249, 249, 249)'
            });

            document.getElementById('clear-signature').addEventListener('click', function() {
                signaturePad.clear();
            });

            // Before submitting, save the signature data to the hidden field
            var form = document.getElementById('main_form');
            form.addEventListener('submit', function(event) {
                if (!signaturePad.isEmpty()) {
                    var data = signaturePad.toDataURL('image/png');
                    document.getElementById('custpage_signature_data').value = data;
                }
            });
        };
    }

    return {
        pageInit: pageInit
    };
});